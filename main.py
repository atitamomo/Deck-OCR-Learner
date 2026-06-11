import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
import sys
import subprocess
import threading
import shutil
import sqlite3
import json
import time
import glob

# No global evdev imports needed

# Ensure local libs directory is in path
libs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "libs")
if libs_path not in sys.path:
    sys.path.insert(0, libs_path)

# Set up logging using decky_plugin logger if available, otherwise fallback to standard logging
try:
    from decky_plugin import logger
except ImportError:
    import logging
    logging.basicConfig(level=logging.INFO)
    class LoggerFallback:
        def info(self, msg): logging.info(msg)
        def error(self, msg): logging.error(msg)
        def debug(self, msg): logging.debug(msg)
    logger = LoggerFallback()

# ---------------------------------------------------------------------------
# Module-level import worker — lives OUTSIDE Plugin so Decky's RPC scanner
# can never intercept or call it without arguments.
# ---------------------------------------------------------------------------
def _dict_import_worker(plugin, zip_path):
    """Run inside a daemon thread. Updates plugin.import_progress in place."""
    import traceback
    import zipfile

    def log_step(msg):
        logger.info(f"[Import] {msg}")
        try:
            with open("/tmp/decky_ocr_import.log", "a") as f:
                f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {msg}\n")
        except Exception:
            pass

    def set_progress(pct, msg):
        plugin.import_progress = {"status": "importing", "progress": pct, "message": msg}
        log_step(f"[{pct}%] {msg}")

    try:
        # Clear old log
        try:
            open("/tmp/decky_ocr_import.log", "w").close()
        except Exception:
            pass

        log_step(f"Worker started. zip_path={zip_path!r}")
        set_progress(2, "Opening dictionary zip archive...")

        with zipfile.ZipFile(zip_path, "r") as z:
            log_step("ZipFile opened.")
            namelist = z.namelist()
            log_step(f"Found {len(namelist)} files in archive.")

            if "index.json" not in namelist:
                plugin.import_progress = {"status": "error", "progress": 0,
                                           "message": "Invalid dictionary: missing index.json"}
                return

            set_progress(3, "Connecting to database...")
            conn = sqlite3.connect(plugin.dict_db_path, timeout=30.0)
            cursor = conn.cursor()

            set_progress(4, "Configuring database...")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA temp_store=MEMORY")
            cursor.execute("PRAGMA cache_size=10000")

            set_progress(5, "Initializing tables...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS dictionaries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS terms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    dictionary_id INTEGER,
                    expression TEXT,
                    reading TEXT,
                    definition TEXT,
                    pos TEXT,
                    popularity INTEGER,
                    sequence INTEGER,
                    FOREIGN KEY(dictionary_id) REFERENCES dictionaries(id) ON DELETE CASCADE
                )
            """)

            set_progress(7, "Dropping old indexes...")
            cursor.execute("DROP INDEX IF EXISTS idx_terms_expression")
            cursor.execute("DROP INDEX IF EXISTS idx_terms_reading")
            conn.commit()

            set_progress(10, "Parsing dictionary metadata...")
            index_data = json.loads(z.read("index.json").decode("utf-8"))
            dict_name = index_data.get("title", "Unknown Dictionary")
            log_step(f"Dictionary title: {dict_name!r}")

            try:
                cursor.execute("INSERT INTO dictionaries (name) VALUES (?)", (dict_name,))
                dict_id = cursor.lastrowid
                log_step(f"New dictionary inserted. id={dict_id}")
            except sqlite3.IntegrityError:
                cursor.execute("SELECT id FROM dictionaries WHERE name = ?", (dict_name,))
                dict_id = cursor.fetchone()[0]
                log_step(f"Existing dictionary found. id={dict_id}. Clearing old terms.")
                cursor.execute("DELETE FROM terms WHERE dictionary_id = ?", (dict_id,))

            term_files = sorted(f for f in namelist if f.startswith("term_bank_"))
            total = len(term_files)
            log_step(f"Found {total} term bank files.")

            for idx, fname in enumerate(term_files):
                pct = int(12 + (idx / max(total, 1)) * 78)
                set_progress(pct, f"Importing bank {idx + 1}/{total}...")
                bank_data = json.loads(z.read(fname).decode("utf-8"))
                rows = []
                for item in bank_data:
                    expression = item[0]
                    reading = item[1]
                    pos = item[2]
                    popularity = item[4]
                    glossary = item[5]
                    sequence = item[6]
                    definition = (json.dumps(glossary, ensure_ascii=False)
                                  if isinstance(glossary, list) else str(glossary))
                    rows.append((dict_id, expression, reading, definition, pos, popularity, sequence))
                cursor.executemany("""
                    INSERT INTO terms (dictionary_id, expression, reading, definition, pos, popularity, sequence)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, rows)
                log_step(f"Inserted {len(rows)} terms from {fname}.")

            set_progress(92, "Rebuilding indexes...")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_terms_expression ON terms(expression)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_terms_reading ON terms(reading)")

            set_progress(98, "Committing...")
            conn.commit()
            conn.close()

            plugin.import_progress = {
                "status": "success", "progress": 100,
                "message": f"Successfully imported '{dict_name}'!"
            }
            log_step(f"Import complete: {dict_name!r}")

    except Exception as e:
        tb = traceback.format_exc()
        log_step(f"ERROR: {e}\n{tb}")
        plugin.import_progress = {
            "status": "error", "progress": 0,
            "message": f"Import failed: {e}"
        }
        logger.error(f"[Import] Worker failed: {e}\n{tb}")


class Plugin:
    # Class-level defaults — these exist even before _main runs,
    # so any method called early won't hit AttributeError.
    install_status = "idle"
    install_log = ""
    settings_dir = os.environ.get(
        "DECKY_PLUGIN_SETTINGS_DIR",
        os.path.expanduser("~/.config/decky-ocr-learner")
    )
    dict_db_path = os.path.join(settings_dir, "dictionary.db")
    vocab_db_path = os.path.join(settings_dir, "vocab.db")
    ocr_instance = None
    tokenizer_instance = None
    import_progress = {"status": "idle", "progress": 0, "message": ""}
    ocr_requested = False
    deactivate_requested = False
    ocr_active = False
    import collections
    nav_input_queue = collections.deque(maxlen=16)  # queued nav button events for the frontend
    _grab_fds = []   # open fds for exclusively-grabbed evdev devices
    # EVIOCGRAB = _IOW('E', 0x90, int) on Linux x86_64
    _EVIOCGRAB = 0x40044590

    # Hotkey system
    hotkey_device = ""       # e.g. "/dev/input/event5" or "hidraw"
    hotkey_keycode = -1      # key code (int) or button name (str) to listen for
    hotkey_learn_active = False
    hotkey_learn_result = None   # {"device": ..., "keycode": ...} when done
    hotkey_learn_log = []        # diagnostic log from last learn session
    _hotkey_listener_active = False
    _learn_file_objs = []

    BUTTONS_L = {
        'R2': 0x00000001,
        'L2': 0x00000002,
        'R1': 0x00000004,
        'L1': 0x00000008,
        'Y': 0x00000010,
        'B': 0x00000020,
        'X': 0x00000040,
        'A': 0x00000080,
        'DPAD_UP': 0x00000100,
        'DPAD_RIGHT': 0x00000200,
        'DPAD_LEFT': 0x00000400,
        'DPAD_DOWN': 0x00000800,
        'SELECT': 0x00001000,
        'STEAM': 0x00002000,
        'START': 0x00004000,
        'L5': 0x00008000,
        'R5': 0x00010000,
        'LEFT_PAD_TOUCH': 0x00080000,
        'RIGHT_PAD_TOUCH': 0x00100000,
        'L3': 0x00400000,
        'R3': 0x04000000,
    }

    BUTTONS_H = {
        'L4': 0x00000200,
        'R4': 0x00000400,
        'QAM': 0x00040000,
    }

    @classmethod
    async def _main(cls, *args, **kwargs):
        """Called by Decky Loader on plugin startup — this is the real __init__."""
        logger.info(f"Decky OCR Learner: _main called with args={args} kwargs={kwargs}, initializing...")
        # Re-read settings dir in case env var changed after module load
        cls.settings_dir = os.environ.get(
            "DECKY_PLUGIN_SETTINGS_DIR",
            os.path.expanduser("~/.config/decky-ocr-learner")
        )
        os.makedirs(cls.settings_dir, exist_ok=True)
        cls.dict_db_path = os.path.join(cls.settings_dir, "dictionary.db")
        cls.vocab_db_path = os.path.join(cls.settings_dir, "vocab.db")
        cls.ocr_instance = None
        cls.tokenizer_instance = None
        cls.import_progress = {"status": "idle", "progress": 0, "message": ""}
        cls.install_status = "idle"
        cls.install_log = ""
        cls.ocr_requested = False
        logger.info(f"Settings dir: {cls.settings_dir}")
        logger.info(f"Dict DB: {cls.dict_db_path}")
        cls.init_vocab_db()
        cls.check_and_install_dependencies()
        # Start hotkey listener (runs as root — can open all /dev/input devices)
        cls._load_hotkey_config()
        cls._hotkey_listener_active = True
        threading.Thread(target=cls._run_hotkey_listener, daemon=True).start()
        logger.info("Decky OCR Learner: initialization complete.")

    @classmethod
    async def _unload(cls, *args, **kwargs):
        cls._hotkey_listener_active = False
        cls.hotkey_learn_active = False
        logger.info("Decky OCR Learner Backend Unloaded")

    @classmethod
    async def trigger_ocr_request(cls, *args, **kwargs):
        cls.ocr_requested = True
        cls.ocr_active = True
        logger.info("[Bridge] OCR request triggered via RPC.")
        return {"status": "success"}

    @classmethod
    async def notify_activated(cls, *args, **kwargs):
        cls.ocr_active = True
        cls.nav_input_queue.clear()   # flush stale nav events
        logger.info("[Bridge] Frontend notified activation.")
        return {"status": "success"}

    @classmethod
    async def get_ocr_debug_info(cls, *args, **kwargs):
        try:
            if cls.ocr_instance is None:
                return {"status": "error", "message": "ocr_instance is None"}
                
            info = {}
            info["class"] = str(cls.ocr_instance.__class__)
            info["using_japanese_ocr"] = getattr(cls, "using_japanese_ocr", None)
            
            # Inspect the recognizer
            if hasattr(cls.ocr_instance, "text_recognizer"):
                rec = cls.ocr_instance.text_recognizer
                info["rec_class"] = str(rec.__class__)
                for attr in ["model_path", "keys_path", "rec_keys_path", "cfg", "config"]:
                    if hasattr(rec, attr):
                        val = getattr(rec, attr)
                        if attr in ("cfg", "config"):
                            info[attr] = str(val)[:1000]
                        else:
                            info[attr] = str(val)
                            
            return {"status": "success", "info": info}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    @classmethod
    async def notify_deactivated(cls, *args, **kwargs):
        cls.ocr_active = False
        cls.nav_input_queue.clear()   # flush stale nav events
        logger.info("[Bridge] Frontend notified deactivation.")
        cls._set_qam_visibility(True)
        threading.Thread(target=cls._ungrab_input, daemon=True).start()
        return {"status": "success"}

    @classmethod
    async def poll_ocr_request(cls, *args, **kwargs):
        triggered = cls.ocr_requested
        if triggered:
            cls.ocr_requested = False
            logger.info("[Bridge] OCR request consumed.")
            
        deactivate = cls.deactivate_requested
        if deactivate:
            cls.deactivate_requested = False
            logger.info("[Bridge] Deactivate request consumed.")
            
        return {"status": "success", "triggered": triggered, "deactivate": deactivate}

    @classmethod
    async def poll_nav_input(cls, *args, **kwargs):
        """Drain the next nav button press from the hidraw listener queue.
        Returns the button name if one is pending, else None."""
        if cls.nav_input_queue:
            btn = cls.nav_input_queue.popleft()
            logger.info(f"[Nav] poll_nav_input consumed: {btn}")
            return {"status": "success", "button": btn}
        return {"status": "success", "button": None}

    # -------------------------------------------------------------------------
    # Hotkey system — runs as root, can access all /dev/input/* devices
    # -------------------------------------------------------------------------

    @classmethod
    def _load_hotkey_config(cls):
        """Load saved hotkey config from settings directory."""
        config_path = os.path.join(cls.settings_dir, "hotkey.json")
        try:
            if os.path.exists(config_path):
                with open(config_path, "r") as f:
                    cfg = json.load(f)
                cls.hotkey_device = cfg.get("device", "")
                cls.hotkey_keycode = cfg.get("keycode", -1)
                logger.info(f"[Hotkey] Loaded config: device={cls.hotkey_device!r} keycode={cls.hotkey_keycode}")
            else:
                cls.hotkey_device = ""
                cls.hotkey_keycode = -1
                logger.info("[Hotkey] No saved config found.")
        except Exception as e:
            logger.error(f"[Hotkey] Failed to load config: {e}")
            cls.hotkey_device = ""
            cls.hotkey_keycode = -1

    @classmethod
    def _save_hotkey_config(cls):
        """Persist current hotkey config to settings directory."""
        config_path = os.path.join(cls.settings_dir, "hotkey.json")
        try:
            with open(config_path, "w") as f:
                json.dump({"device": cls.hotkey_device, "keycode": cls.hotkey_keycode}, f)
            logger.info(f"[Hotkey] Saved config: device={cls.hotkey_device!r} keycode={cls.hotkey_keycode}")
        except Exception as e:
            logger.error(f"[Hotkey] Failed to save config: {e}")

    @classmethod
    def _find_hidraw_device(cls):
        """Find a Valve-compatible/InputPlumber virtual controller hidraw device."""
        import glob, select
        for i in range(20):
            path = f'/dev/hidraw{i}'
            uevent_path = f'/sys/class/hidraw/hidraw{i}/device/uevent'
            if os.path.exists(uevent_path):
                try:
                    with open(uevent_path, 'r') as f:
                        content = f.read().upper()
                    if '28DE' in content:
                        # Verify we can actually open it
                        fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK)
                        try:
                            # Verify readability
                            r, _, _ = select.select([fd], [], [], 0.02)
                            os.close(fd)
                            return path
                        except Exception:
                            os.close(fd)
                except Exception:
                    pass
        return None

    @classmethod
    def _set_qam_visibility(cls, visible: bool):
        """Set QAM (Quick Access Menu) visibility using Chrome Remote Debugging Protocol."""
        import urllib.request, urllib.parse, json, socket, base64
        try:
            # 1. Fetch tabs
            req = urllib.request.urlopen("http://127.0.0.1:8080/json", timeout=2.0)
            tabs = json.loads(req.read().decode('utf-8'))
            
            # 2. Find QuickAccess tab
            ws_url = None
            for tab in tabs:
                title = tab.get('title', '')
                if title.startswith('QuickAccess'):
                    ws_url = tab.get('webSocketDebuggerUrl')
                    break
            
            if not ws_url:
                logger.warning("[QAM] QuickAccess tab not found in CEF debugger.")
                return False
                
            # 3. Connect raw websocket and evaluate JS
            style_val = 'visible' if visible else 'hidden'
            expr = f"document.body.style.visibility = '{style_val}';"
            
            # Perform raw websocket evaluation
            parsed = urllib.parse.urlparse(ws_url)
            host = parsed.hostname
            port = parsed.port or 80
            path = parsed.path
            if parsed.query:
                path += "?" + parsed.query

            key = base64.b64encode(b"qamvisibility123").decode('utf-8')
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(2.0)
            s.connect((host, port))

            handshake = (
                f"GET {path} HTTP/1.1\r\n"
                f"Host: {host}:{port}\r\n"
                f"Upgrade: websocket\r\n"
                f"Connection: Upgrade\r\n"
                f"Sec-WebSocket-Key: {key}\r\n"
                f"Sec-WebSocket-Version: 13\r\n\r\n"
            )
            s.sendall(handshake.encode('utf-8'))

            response = b""
            while b"\r\n\r\n" not in response:
                chunk = s.recv(1024)
                if not chunk:
                    break
                response += chunk

            if b"101" not in response:
                s.close()
                logger.error(f"[QAM] WS handshake failed: {response}")
                return False

            payload = json.dumps({
                "id": 1,
                "method": "Runtime.evaluate",
                "params": {
                    "expression": expr,
                    "returnByValue": True
                }
            }).encode('utf-8')

            mask = b"\x11\x22\x33\x44"
            masked_payload = bytearray(len(payload))
            for i in range(len(payload)):
                masked_payload[i] = payload[i] ^ mask[i % 4]

            header = bytearray()
            header.append(0x81)
            if len(payload) <= 125:
                header.append(0x80 | len(payload))
            elif len(payload) <= 65535:
                header.append(0x80 | 126)
                header.extend(len(payload).to_bytes(2, byteorder='big'))
            else:
                header.append(0x80 | 127)
                header.extend(len(payload).to_bytes(8, byteorder='big'))
            header.extend(mask)

            s.sendall(header + masked_payload)
            s.close()
            logger.info(f"[QAM] Successfully set QAM visibility to {style_val}")
            return True
        except Exception as e:
            logger.error(f"[QAM] Failed to set QAM visibility: {e}")
            return False

    @classmethod
    def _grab_input(cls):
        """Exclusively grab all gamepad/controller evdev devices EXCEPT the hotkey device,
        preventing duplicate input navigation in Steam Client."""
        import fcntl, struct, glob as glob_mod, array, os
        cls._ungrab_input()  # release any stale grabs first

        # EVIOCGNAME(256): read device name
        EVIOCGNAME = 0x80ff4506
        # EVIOCGBIT(EV_KEY, 96 bytes): read key capability bitmap
        EVIOCGBIT_KEY = (0x80000000 | (96 << 16) | (ord('E') << 8) | 0x21)
        gamepad_key_codes = {
            0x130, 0x131, 0x133, 0x134,  # face buttons
            0x136, 0x137,                # shoulders
            0x13a, 0x13b,                # select/start
            0x220, 0x221, 0x222, 0x223,  # d-pad
        }
        gamepad_name_markers = (
            'gamepad', 'joystick', 'controller', 'x-box', 'xbox',
            'steam deck', 'valve', 'inputplumber'
        )

        grabbed = []
        for path in sorted(glob_mod.glob('/dev/input/event*')):
            # CRITICAL: Skip the hotkey device so the background hotkey listener thread is NOT blocked!
            try:
                real_path = os.path.realpath(path)
                real_hotkey = os.path.realpath(cls.hotkey_device) if cls.hotkey_device else ""
                if real_path == real_hotkey:
                    logger.info(f"[Input] Skipping grab on hotkey device: {path}")
                    continue
            except Exception:
                if path == cls.hotkey_device:
                    logger.info(f"[Input] Skipping grab on hotkey device (fallback): {path}")
                    continue

            fd = None
            try:
                fd = os.open(path, os.O_RDWR | os.O_NONBLOCK)

                # Get name
                buf = bytearray(256)
                try:
                    fcntl.ioctl(fd, EVIOCGNAME, buf)
                    name = bytes(buf).rstrip(b'\x00').decode('utf-8', errors='replace').lower()
                except Exception:
                    name = ''

                # Skip keyboards, mice, touchscreens
                if any(k in name for k in ('keyboard', 'mouse', 'touchscreen', 'touchpad', 'pen', 'power button')):
                    if not any(g in name for g in ('gamepad', 'controller', 'xbox')):
                        os.close(fd); fd = None; continue

                key_bits = array.array('B', [0] * 96)
                try:
                    fcntl.ioctl(fd, EVIOCGBIT_KEY, key_bits, True)
                except Exception:
                    os.close(fd); fd = None; continue

                has_gamepad_key = False
                for code in gamepad_key_codes:
                    byte_idx, bit_idx = code >> 3, code & 7
                    if byte_idx < len(key_bits) and (key_bits[byte_idx] & (1 << bit_idx)):
                        has_gamepad_key = True
                        break

                if not has_gamepad_key and not any(k in name for k in gamepad_name_markers):
                    os.close(fd); fd = None; continue

                # Grab exclusively
                fcntl.ioctl(fd, cls._EVIOCGRAB, struct.pack('I', 1))
                grabbed.append(fd)
                logger.info(f"[Input] Grabbed device: {path} ({name.strip()})")
                fd = None  # keep open to maintain grab
            except Exception as e:
                logger.debug(f"[Input] Could not grab {path}: {e}")
                if fd is not None:
                    try: os.close(fd)
                    except: pass

        cls._grab_fds = grabbed
        logger.info(f"[Input] Grabbed {len(grabbed)} device(s).")

    @classmethod
    def _ungrab_input(cls):
        """Release all exclusively-grabbed evdev devices."""
        import fcntl, struct
        for fd in cls._grab_fds:
            try:
                fcntl.ioctl(fd, cls._EVIOCGRAB, struct.pack('I', 0))
                os.close(fd)
            except Exception:
                try: os.close(fd)
                except: pass
        cls._grab_fds = []
        logger.info("[Input] Released all grabbed devices.")

    @classmethod
    def _handle_hotkey_press(cls):
        logger.info(f"[Hotkey] Hotkey pressed. Current ocr_active={cls.ocr_active}")
        if not cls.ocr_active:
            cls.ocr_requested = True
            cls.ocr_active = True
            cls._set_qam_visibility(False)
            threading.Thread(target=cls._grab_input, daemon=True).start()
        else:
            cls.deactivate_requested = True
            cls.ocr_active = False
            cls._set_qam_visibility(True)
            threading.Thread(target=cls._ungrab_input, daemon=True).start()

    @classmethod
    def _run_hotkey_listener(cls):
        """Background thread: watches the configured input device for the hotkey.
        Runs as root so it can open any /dev/input or /dev/hidraw device."""
        import struct, select

        # Explicit little-endian 64-bit format: tv_sec(8) tv_usec(8) type(2) code(2) value(4)
        EVENT_FMT = "<qqHHi"
        EVENT_SIZE = struct.calcsize(EVENT_FMT)
        EV_KEY = 1
        EV_ABS = 3
        KEY_DOWN = 1

        logger.info("[Hotkey] Listener thread started.")
        abs_baseline = {}
        last_hidraw_buttons = set()

        while cls._hotkey_listener_active:
            device = cls.hotkey_device
            keycode = cls.hotkey_keycode

            if not device or keycode == -1 or keycode == "":
                time.sleep(0.5)
                continue

            # Case 1: Low-level hidraw button listener
            if device == "hidraw" or device.startswith("/dev/hidraw"):
                hidraw_path = cls._find_hidraw_device()
                if not hidraw_path:
                    logger.warning("[Hotkey] Hidraw device configured but not found. Retrying in 2s...")
                    time.sleep(2)
                    continue
                fd = None
                try:
                    fd = os.open(hidraw_path, os.O_RDONLY | os.O_NONBLOCK)
                    logger.info(f"[Hotkey] Watching hidraw device {hidraw_path} for button {keycode}")
                    while cls._hotkey_listener_active:
                        if cls.hotkey_device != device or cls.hotkey_keycode != keycode:
                            break
                        if cls.hotkey_learn_active:
                            time.sleep(0.2)
                            continue
                        r, _, _ = select.select([fd], [], [], 0.5)
                        if r:
                            data = os.read(fd, 64)
                            if len(data) >= 16:
                                buttons_l = struct.unpack('<I', data[8:12])[0]
                                buttons_h = struct.unpack('<I', data[12:16])[0]
                                
                                current_pressed = set()
                                for name, mask in cls.BUTTONS_L.items():
                                    if buttons_l & mask:
                                        current_pressed.add(name)
                                for name, mask in cls.BUTTONS_H.items():
                                    if buttons_h & mask:
                                        current_pressed.add(name)
                                
                                # Detect new presses
                                NAV_BUTTONS = {
                                    'DPAD_LEFT', 'DPAD_RIGHT', 'DPAD_UP', 'DPAD_DOWN',
                                    'A', 'B', 'Y', 'X'
                                }
                                for btn in current_pressed - last_hidraw_buttons:
                                    if cls.ocr_active:
                                        if btn in NAV_BUTTONS:
                                            # Route to nav queue; never fire hotkey for these
                                            logger.info(f"[Nav] Queuing nav button: {btn}")
                                            cls.nav_input_queue.append(btn)
                                        elif btn == keycode:
                                            # Non-nav hotkey — allow it to close the overlay
                                            logger.info(f"[Hotkey] Fired to close overlay: {btn}")
                                            cls._handle_hotkey_press()
                                    else:
                                        # Overlay is closed — only open via hotkey
                                        if btn == keycode:
                                            logger.info(f"[Hotkey] Fired to open overlay: {btn}")
                                            cls._handle_hotkey_press()
                                last_hidraw_buttons = current_pressed
                except Exception as e:
                    logger.error(f"[Hotkey] Hidraw listener error on {hidraw_path}: {e}")
                    time.sleep(1)
                finally:
                    if fd is not None:
                        try:
                            os.close(fd)
                        except:
                            pass
                continue

            # Case 2: Standard evdev listener
            try:
                abs_baseline.clear()
                with open(device, "rb", buffering=0) as fd:
                    logger.info(f"[Hotkey] Watching {device!r} for key code {keycode}")
                    while cls._hotkey_listener_active:
                        if cls.hotkey_device != device or cls.hotkey_keycode != keycode:
                            logger.info("[Hotkey] Config changed — reopening device.")
                            break
                        if cls.hotkey_learn_active:
                            time.sleep(0.2)
                            continue
                        r, _, _ = select.select([fd], [], [], 0.5)
                        if r:
                            data = fd.read(EVENT_SIZE)
                            if len(data) == EVENT_SIZE:
                                _, _, ev_type, code, value = struct.unpack(EVENT_FMT, data)
                                # EV_KEY hotkey
                                if ev_type == EV_KEY and code == keycode and value == KEY_DOWN:
                                    logger.info(f"[Hotkey] Fired! EV_KEY code={code} on {device!r}")
                                    cls._handle_hotkey_press()
                                # EV_ABS synthetic hotkey
                                elif ev_type == EV_ABS and isinstance(keycode, int) and keycode >= 10000:
                                    axis = keycode - 10000
                                    if code == axis:
                                        bkey = (fd.fileno(), code)
                                        baseline = abs_baseline.get(bkey)
                                        if baseline is None:
                                            abs_baseline[bkey] = value
                                        elif abs(value - baseline) > 200:
                                            logger.info(f"[Hotkey] Fired! EV_ABS axis={code} delta={abs(value - baseline)}")
                                            cls._handle_hotkey_press()
                                            abs_baseline[bkey] = value
            except FileNotFoundError:
                logger.error(f"[Hotkey] Device {device!r} not found — clearing hotkey.")
                cls.hotkey_device = ""
                cls.hotkey_keycode = -1
            except Exception as e:
                logger.error(f"[Hotkey] Listener error on {device!r}: {e}")
                time.sleep(1)

        logger.info("[Hotkey] Listener thread stopped.")

    @classmethod
    def _run_hotkey_learn(cls):
        """Background thread: opens ALL /dev/input devices AND /dev/hidraw (as root)
        and captures the next meaningful button press (EV_KEY, EV_ABS change, or hidraw button)."""
        import struct, select, glob as glob_mod

        EVENT_FMT = "<qqHHi"
        EVENT_SIZE = struct.calcsize(EVENT_FMT)

        EV_KEY = 1
        EV_ABS = 3
        KEY_DOWN = 1
        IGNORE_KEY_CODES = {1, 14, 15, 28, 29, 42, 54, 56, 57, 100, 125, 126, 127}

        session_log = []
        def slog(msg):
            logger.info(f"[Hotkey Learn] {msg}")
            session_log.append(msg)

        cls.hotkey_learn_log = []
        cls.hotkey_learn_result = None
        cls.hotkey_learn_active = True
        cls._learn_file_objs.clear()

        slog(f"EVENT_SIZE={EVENT_SIZE}  UID={os.getuid()}")

        fds = []
        fd_paths = {}

        # 1. Try to open the Valve/InputPlumber hidraw device
        hidraw_path = cls._find_hidraw_device()
        hidraw_fd = None
        if hidraw_path:
            try:
                hidraw_fd = os.open(hidraw_path, os.O_RDONLY | os.O_NONBLOCK)
                fds.append(hidraw_fd)
                fd_paths[hidraw_fd] = "hidraw"
                slog(f"  OK hidraw: {hidraw_path}")
            except Exception as e:
                slog(f"  NO hidraw: {hidraw_path} ({e})")
        else:
            slog("  No Valve/InputPlumber hidraw candidate found")

        # 2. Try to open evdev event devices
        all_paths = sorted(glob_mod.glob("/dev/input/event*"))
        slog(f"Devices found: {all_paths}")

        for path in all_paths:
            try:
                fd = open(path, "rb", buffering=0)
                fds.append(fd.fileno())
                fd_paths[fd.fileno()] = path
                cls._learn_file_objs.append(fd)
                slog(f"  OK: {path}")
            except Exception as e:
                slog(f"  NO: {path} ({e})")

        if not fds:
            slog("ERROR: Could not open ANY input or hidraw device.")
            cls.hotkey_learn_active = False
            cls.hotkey_learn_log = session_log
            return

        slog(f"Listening on {len(fds)} device(s). Waiting for button press (15s)...")

        abs_baseline = {}
        last_hidraw_buttons = None

        end = time.time() + 15
        try:
            while time.time() < end and cls.hotkey_learn_active:
                r, _, _ = select.select(fds, [], [], 0.3)
                for fd in r:
                    try:
                        dev_type = fd_paths[fd]
                        if dev_type == "hidraw":
                            data = os.read(fd, 64)
                            if len(data) >= 16:
                                buttons_l = struct.unpack('<I', data[8:12])[0]
                                buttons_h = struct.unpack('<I', data[12:16])[0]
                                
                                current_pressed = set()
                                for name, mask in cls.BUTTONS_L.items():
                                    if buttons_l & mask:
                                        current_pressed.add(name)
                                for name, mask in cls.BUTTONS_H.items():
                                    if buttons_h & mask:
                                        current_pressed.add(name)
                                
                                if last_hidraw_buttons is None:
                                    last_hidraw_buttons = current_pressed
                                    continue
                                
                                # Detect new presses
                                new_presses = current_pressed - last_hidraw_buttons
                                if new_presses:
                                    pressed_button = list(new_presses)[0]
                                    slog(f"  CAPTURED hidraw button: {pressed_button}")
                                    cls.hotkey_learn_result = {"device": "hidraw", "keycode": pressed_button, "type": "hidraw"}
                                    cls.hotkey_learn_active = False
                                    cls.hotkey_learn_log = session_log
                                    return
                                last_hidraw_buttons = current_pressed
                        
                        else:
                            # evdev file descriptor
                            file_obj = next((f for f in cls._learn_file_objs if f.fileno() == fd), None)
                            if file_obj:
                                data = file_obj.read(EVENT_SIZE)
                                if len(data) != EVENT_SIZE:
                                    continue
                                _, _, ev_type, code, value = struct.unpack(EVENT_FMT, data)
                                device = fd_paths[fd]

                                if ev_type == EV_KEY and value == KEY_DOWN:
                                    if code in IGNORE_KEY_CODES or (272 <= code <= 287) or (320 <= code <= 340):
                                        slog(f"  Skipped key code={code} (navigation/pointer key)")
                                        continue
                                    slog(f"  CAPTURED EV_KEY: device={device} code={code}")
                                    cls.hotkey_learn_result = {"device": device, "keycode": code, "type": "key"}
                                    cls.hotkey_learn_active = False
                                    cls.hotkey_learn_log = session_log
                                    return

                                elif ev_type == EV_ABS:
                                    key = (fd, code)
                                    baseline = abs_baseline.get(key)
                                    if baseline is None:
                                        abs_baseline[key] = value
                                        continue
                                    delta = abs(value - baseline)
                                    if delta > 200:
                                        slog(f"  CAPTURED EV_ABS: device={device} axis={code} value={value} delta={delta}")
                                        synthetic_code = 10000 + code
                                        cls.hotkey_learn_result = {"device": device, "keycode": synthetic_code, "type": "abs", "axis": code}
                                        cls.hotkey_learn_active = False
                                        cls.hotkey_learn_log = session_log
                                        return
                    except Exception as e:
                        pass
        finally:
            if hidraw_fd is not None:
                try:
                    os.close(hidraw_fd)
                except:
                    pass
            for f in cls._learn_file_objs:
                try:
                    f.close()
                except:
                    pass
            cls._learn_file_objs.clear()
            cls.hotkey_learn_active = False
            cls.hotkey_learn_log = session_log
            slog("Learn session ended.")

    @classmethod
    async def start_hotkey_learn(cls, *args, **kwargs):
        """RPC: Begin listening for the next hardware button press (15s timeout)."""
        if cls.hotkey_learn_active:
            return {"status": "error", "message": "Learn mode already active."}
        cls.hotkey_learn_result = None
        threading.Thread(target=cls._run_hotkey_learn, daemon=True).start()
        return {"status": "success"}

    @classmethod
    async def get_hotkey_learn_result(cls, *args, **kwargs):
        """RPC: Poll for the result of learn mode."""
        return {
            "status": "success",
            "active": cls.hotkey_learn_active,
            "result": cls.hotkey_learn_result,
            "log": cls.hotkey_learn_log
        }

    @classmethod
    async def diagnose_hotkey(cls, *args, **kwargs):
        """RPC: Return diagnostic info about what input devices are accessible."""
        import glob as glob_mod
        lines = []
        uid = os.getuid()
        lines.append(f"UID={uid} ({'root' if uid == 0 else 'non-root'})")
        
        # Check hidraw Valve/InputPlumber controller
        hidraw_path = cls._find_hidraw_device()
        lines.append(f"Hidraw candidate: {hidraw_path}")
        if hidraw_path:
            try:
                fd = os.open(hidraw_path, os.O_RDONLY | os.O_NONBLOCK)
                os.close(fd)
                lines.append(f"  OK: {hidraw_path}")
            except Exception as e:
                lines.append(f"  NO: {hidraw_path} ({e})")
                
        all_paths = sorted(glob_mod.glob("/dev/input/event*"))
        lines.append(f"Devices on /dev/input: {len(all_paths)}")
        accessible = []
        for path in all_paths:
            try:
                fd = open(path, "rb")
                fd.close()
                accessible.append(path)
                lines.append(f"  OK: {path}")
            except Exception as e:
                lines.append(f"  NO: {path} ({e})")
        return {
            "status": "success",
            "uid": uid,
            "accessible": accessible,
            "log": "\n".join(lines)
        }

    @classmethod
    async def save_hotkey(cls, *args, **kwargs):
        """RPC: Persist a hotkey assignment and (re)start the listener."""
        device = ""
        keycode = -1
        if args and isinstance(args[0], dict):
            device = args[0].get("device", "")
            keycode = args[0].get("keycode", -1)
        elif kwargs:
            device = kwargs.get("device", "")
            keycode = kwargs.get("keycode", -1)
        elif len(args) >= 2:
            device = args[0]
            keycode = args[1]

        cls.hotkey_device = device
        try:
            cls.hotkey_keycode = int(keycode)
        except ValueError:
            cls.hotkey_keycode = keycode
            
        logger.info(f"[Hotkey] save_hotkey called: device={device!r} keycode={keycode!r}")
        cls._save_hotkey_config()
        return {"status": "success"}

    @classmethod
    async def get_hotkey_config(cls, *args, **kwargs):
        """RPC: Return current hotkey assignment."""
        return {
            "status": "success",
            "device": cls.hotkey_device,
            "keycode": cls.hotkey_keycode
        }

    @classmethod
    async def clear_hotkey(cls, *args, **kwargs):
        """RPC: Remove the hotkey assignment."""
        cls.hotkey_device = ""
        cls.hotkey_keycode = -1
        cls._save_hotkey_config()
        return {"status": "success"}

    @classmethod
    def init_vocab_db(cls):
        try:
            conn = sqlite3.connect(cls.vocab_db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS vocab (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    expression TEXT,
                    reading TEXT,
                    definition TEXT,
                    sentence TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            conn.close()
            logger.info("Vocabulary database initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize vocab database: {e}")

    @classmethod
    def check_and_install_dependencies(cls):
        try:
            import rapidocr_onnxruntime
            import janome
            
            # Check if Japanese model and dict are present
            models_dir = "/home/deck/homebrew/settings/decky-ocr-learner/models"
            jp_rec_model_path = os.path.join(models_dir, "japan_rec_v5.onnx")
            jp_dict_path = os.path.join(models_dir, "japan_dict_v5.txt")
            
            if not os.path.exists(jp_rec_model_path) or not os.path.exists(jp_dict_path):
                raise ImportError("Japanese models missing")
                
            cls.install_status = "ready"
            logger.info("All dependencies and Japanese models are already installed.")
        except ImportError:
            cls.install_status = "installing"
            logger.info("Dependencies or Japanese models missing. Starting installer thread...")
            threading.Thread(target=cls.run_installer, daemon=True).start()

    @classmethod
    def find_python_with_pip(cls):
        candidates = [
            "/home/deck/.local/share/uv/python/cpython-3.13.2-linux-x86_64-gnu/bin/python",
            "python3",
            "python",
            sys.executable
        ]
        for c in candidates:
            try:
                res = subprocess.run([c, "-c", "import pip"], capture_output=True, text=True, timeout=3)
                if res.returncode == 0:
                    logger.info(f"[Installer] Found python with pip: {c}")
                    return c
            except Exception:
                pass
        return sys.executable

    @classmethod
    def _download_model_files(cls):
        import urllib.request
        import shutil
        import ssl
        
        # Disable SSL certificate verification to handle outdated cert packages on SteamOS/Bazzite
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        
        models_dir = "/home/deck/homebrew/settings/decky-ocr-learner/models"
        os.makedirs(models_dir, exist_ok=True)
        
        files_to_download = [
            {
                "url": "https://huggingface.co/monkt/paddleocr-onnx/resolve/main/languages/chinese/rec.onnx",
                "path": os.path.join(models_dir, "japan_rec_v5.onnx"),
                "name": "Japanese OCR Model"
            },
            {
                "url": "https://huggingface.co/monkt/paddleocr-onnx/resolve/main/languages/chinese/dict.txt",
                "path": os.path.join(models_dir, "japan_dict_v5.txt"),
                "name": "Japanese Character Dictionary"
            }
        ]
        
        for f_info in files_to_download:
            url = f_info["url"]
            path = f_info["path"]
            name = f_info["name"]
            
            # Check if file exists and has correct size
            if os.path.exists(path):
                if os.path.getsize(path) > 1000:
                    cls.install_log += f"{name} already exists. Skipping download.\n"
                    logger.info(f"[Installer] {name} already exists. Skipping.")
                    continue
            
            cls.install_log += f"Downloading {name}...\n"
            logger.info(f"[Installer] Downloading {name} from {url}")
            try:
                req = urllib.request.Request(
                    url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                )
                with urllib.request.urlopen(req, context=ssl_ctx, timeout=45) as response:
                    with open(path, 'wb') as out_file:
                        shutil.copyfileobj(response, out_file)
                cls.install_log += f"  {name} downloaded successfully.\n"
                logger.info(f"[Installer] {name} downloaded successfully.")
            except Exception as e:
                cls.install_log += f"  Failed to download {name}: {e}\n"
                logger.error(f"[Installer] Failed to download {name}: {e}")
                raise e

    @classmethod
    def run_installer(cls):
        cls.install_log = "Starting installation of dependencies...\n"
        try:
            # Clear old libs folder to force clean download of correct Python 3.11 wheels
            if os.path.exists(libs_path):
                try:
                    shutil.rmtree(libs_path)
                except Exception as e:
                    cls.install_log += f"Warning: could not clear old libs directory: {e}\n"
            os.makedirs(libs_path, exist_ok=True)
            python_bin = cls.find_python_with_pip()
            # Run pip to target libs directory
            # We use --no-cache-dir to avoid disk space waste
            cmd = [
                python_bin, "-m", "pip", "install", 
                "--target", libs_path, 
                "--no-cache-dir",
                "--only-binary=:all:",
                "--python-version", "3.11",
                "--implementation", "cp",
                "--abi", "cp311",
                "--platform", "manylinux_2_17_x86_64",
                "--platform", "manylinux2014_x86_64",
                "rapidocr-onnxruntime", "janome", "numpy<2.0.0"
            ]
            cls.install_log += f"Running command: {' '.join(cmd)}\n"
            
            # Run pip process
            process = subprocess.Popen(
                cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.STDOUT, 
                text=True
            )
            
            # Stream output
            while True:
                output = process.stdout.readline()
                if output == '' and process.poll() is not None:
                    break
                if output:
                    cls.install_log += output
                    logger.info(f"[Installer] {output.strip()}")
            
            rc = process.poll()
            if rc == 0:
                cls.patch_libs_execstack()
                
                # Download Japanese model files
                try:
                    cls._download_model_files()
                    cls.install_log += "\nDependency and Japanese model installation completed successfully!\n"
                    cls.install_status = "ready"
                    logger.info("Dependencies and Japanese models installed successfully.")
                except Exception as e:
                    cls.install_log += f"\nFailed to download Japanese model files: {e}\n"
                    cls.install_status = "error"
                    logger.error(f"Failed to download Japanese model files: {e}")
            else:
                cls.install_log += f"\nInstallation failed with code {rc}.\n"
                cls.install_status = "error"
                logger.error(f"Installation failed with code {rc}")
        except Exception as e:
            cls.install_log += f"\nException occurred during install: {e}\n"
            cls.install_status = "error"
            logger.error(f"Exception during dependency installation: {e}")

    @classmethod
    def patch_libs_execstack(cls):
        logger.info("[Installer] Starting ELF execstack patch pass on libs directory...")
        count = 0
        try:
            for root, dirs, files in os.walk(libs_path):
                for file in files:
                    if file.endswith(".so"):
                        filepath = os.path.join(root, file)
                        try:
                            with open(filepath, "r+b") as f:
                                ident = f.read(16)
                                if ident[:4] != b"\x7fELF" or ident[4] != 2:
                                    continue
                                
                                f.seek(32)
                                e_phoff = int.from_bytes(f.read(8), "little")
                                f.seek(54)
                                e_phentsize = int.from_bytes(f.read(2), "little")
                                e_phnum = int.from_bytes(f.read(2), "little")
                                
                                for i in range(e_phnum):
                                    offset = e_phoff + i * e_phentsize
                                    f.seek(offset)
                                    p_type = int.from_bytes(f.read(4), "little")
                                    if p_type == 0x6474e551: # PT_GNU_STACK
                                        f.seek(offset + 4)
                                        p_flags = int.from_bytes(f.read(4), "little")
                                        if p_flags & 0x1: # if execute bit is set
                                            new_flags = p_flags & ~0x1
                                            f.seek(offset + 4)
                                            f.write(new_flags.to_bytes(4, "little"))
                                            cls.install_log += f"Patched {file}: cleared execstack flag (flags {p_flags} -> {new_flags})\n"
                                            logger.info(f"[Installer] Patched {file}: GNU_STACK flags {p_flags} -> {new_flags}")
                                            count += 1
                                        break
                        except Exception as e:
                            logger.error(f"[Installer] Failed to patch ELF header for {file}: {e}")
            cls.install_log += f"ELF execstack patch pass complete. Patched {count} files.\n"
            logger.info(f"[Installer] ELF execstack patch pass complete. Patched {count} files.")
        except Exception as e:
            logger.error(f"[Installer] Failed during traverse_and_patch: {e}")

    @classmethod
    async def get_install_status(cls, *args, **kwargs):
        return {
            "status": cls.install_status,
            "log": cls.install_log
        }

    @classmethod
    async def force_reinstall(cls, *args, **kwargs):
        cls.install_status = "installing"
        threading.Thread(target=cls.run_installer, daemon=True).start()
        return {"status": "success"}


    # Capture screen using gstreamer targeting gamescope pipewire source
    @classmethod
    def capture_screen_raw(cls, output_path):
        runtime_dir = "/run/user/1000"
        if not os.path.exists(runtime_dir):
            dirs = glob.glob("/run/user/*")
            if dirs:
                runtime_dir = dirs[0]

        env = os.environ.copy()
        env["XDG_RUNTIME_DIR"] = runtime_dir
        env["PIPEWIRE_RUNTIME_DIR"] = runtime_dir

        cmd = [
            "gst-launch-1.0",
            "pipewiresrc",
            "target-object=gamescope",
            "num-buffers=1",
            "!", "videoconvert",
            "!", "pngenc",
            "!", "filesink", f"location={output_path}"
        ]

        logger.info(f"[OCR] GStreamer cmd: {' '.join(cmd)}")
        res = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=10)
        if res.returncode != 0:
            logger.error(f"[OCR] GStreamer stderr: {res.stderr}")
            raise Exception(f"GStreamer exit {res.returncode}: {res.stderr.strip()[:300]}")
        return output_path

    @classmethod
    async def capture_screen(cls, *args, **kwargs):
        log_path = "/tmp/decky_ocr.log"

        def ocr_log(msg):
            logger.info(f"[OCR] {msg}")
            try:
                with open(log_path, "a") as f:
                    f.write(f"{time.strftime('%H:%M:%S')} {msg}\n")
            except Exception:
                pass

        # Clear the log at the start of each capture
        try:
            open(log_path, "w").close()
        except Exception:
            pass

        ocr_log(f"capture_screen called. install_status={cls.install_status!r}")
        ocr_log(f"dict_db_path={cls.dict_db_path!r}")

        if cls.install_status != "ready":
            ocr_log(f"ABORT: dependencies not ready (status={cls.install_status})")
            return {"status": "error", "message": f"OCR engine not ready (status: {cls.install_status}). Check the Dependencies section."}

        screenshot_path = "/tmp/decky_ocr_screenshot.png"
        last_error = None

        for i in range(3):
            ocr_log(f"Screenshot attempt {i + 1}/3...")
            try:
                if os.path.exists(screenshot_path):
                    os.remove(screenshot_path)
                    ocr_log("  Old screenshot removed.")
                cls.capture_screen_raw(screenshot_path)
                size = os.path.getsize(screenshot_path) if os.path.exists(screenshot_path) else 0
                ocr_log(f"  GStreamer finished. File size: {size} bytes.")
                if size > 0:
                    ocr_log("  Screenshot valid. Proceeding.")
                    break
                else:
                    raise Exception("Screenshot file is empty after capture.")
            except Exception as e:
                last_error = e
                ocr_log(f"  Attempt {i + 1} FAILED: {e}")
                time.sleep(0.2)

        if not os.path.exists(screenshot_path) or os.path.getsize(screenshot_path) == 0:
            ocr_log(f"ABORT: all screenshot attempts failed. Last error: {last_error}")
            return {
                "status": "error",
                "message": f"Screenshot failed: {last_error}"
            }

        ocr_log("Running OCR inference...")
        try:
            models_dir = "/home/deck/homebrew/settings/decky-ocr-learner/models"
            jp_rec_model_path = os.path.join(models_dir, "japan_rec_v5.onnx")
            jp_dict_path = os.path.join(models_dir, "japan_dict_v5.txt")
            has_jp_models = os.path.exists(jp_rec_model_path) and os.path.exists(jp_dict_path)
            
            # Force discard the old Chinese model instance if Japanese models are now available
            if cls.ocr_instance is not None and has_jp_models and not getattr(cls, "using_japanese_ocr", False):
                ocr_log("  Japanese models detected. Discarding old default OCR instance...")
                cls.ocr_instance = None
                
            if cls.ocr_instance is None:
                ocr_log("  Loading RapidOCR model (first run, may take a moment)...")
                from rapidocr_onnxruntime import RapidOCR
                
                if has_jp_models:
                    ocr_log(f"  Using Japanese OCR model: {jp_rec_model_path}")
                    cls.ocr_instance = RapidOCR(
                        rec_model_path=jp_rec_model_path,
                        rec_keys_path=jp_dict_path,
                        det_db_unclip_ratio=1.9,
                        det_intra_op_num_threads=4,
                        det_inter_op_num_threads=4,
                        cls_intra_op_num_threads=4,
                        cls_inter_op_num_threads=4,
                        rec_intra_op_num_threads=4,
                        rec_inter_op_num_threads=4
                    )
                    cls.using_japanese_ocr = True
                else:
                    ocr_log("  Warning: Japanese models not found. Falling back to default (Chinese/English).")
                    cls.ocr_instance = RapidOCR(
                        det_db_unclip_ratio=1.9,
                        det_intra_op_num_threads=4,
                        det_inter_op_num_threads=4,
                        cls_intra_op_num_threads=4,
                        cls_inter_op_num_threads=4,
                        rec_intra_op_num_threads=4,
                        rec_inter_op_num_threads=4
                    )
                    cls.using_japanese_ocr = False
                ocr_log("  RapidOCR loaded.")

            results, elapse = cls.ocr_instance(screenshot_path)
            elapse_total = sum(elapse) if isinstance(elapse, list) else elapse
            ocr_log(f"  OCR complete in {elapse_total:.3f}s. Raw result count: {len(results) if results else 0}")

            # Parse width/height of the captured PNG file directly from its IHDR header
            width, height = 1280, 800
            try:
                with open(screenshot_path, 'rb') as f:
                    f.seek(16)
                    width = int.from_bytes(f.read(4), byteorder='big')
                    height = int.from_bytes(f.read(4), byteorder='big')
                ocr_log(f"  Screenshot resolution: {width}x{height}")
            except Exception as e:
                ocr_log(f"  Failed to read PNG dimensions: {e}")

            ocr_results = []
            if results:
                for item in results:
                    box, text, confidence = item
                    ocr_results.append({
                        "box": box,
                        "text": text,
                        "confidence": float(confidence)
                    })
                    ocr_log(f"  Box: {text!r} ({float(confidence):.2f})")

            ocr_log(f"SUCCESS: returning {len(ocr_results)} boxes.")
            return {
                "status": "success",
                "results": ocr_results,
                "elapse": elapse_total,
                "width": width,
                "height": height
            }
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            ocr_log(f"OCR FAILED: {e}\n{tb}")
            logger.error(f"[OCR] Inference failed: {e}\n{tb}")
            return {"status": "error", "message": f"OCR failed: {e}"}

    @classmethod
    async def lookup_word(cls, *args, **kwargs):
        text = ""
        if args and isinstance(args[0], dict):
            text = args[0].get("text", "")
        elif kwargs:
            text = kwargs.get("text", "")
        elif args:
            text = args[0]

        logger.info(f"lookup_word called: text={repr(text)}")

        if cls.install_status != "ready":
            return {"status": "error", "message": "Dependencies not ready."}

        def _extract_text(node):
            """Recursively extract plain text from a Yomichan structured-content node."""
            if isinstance(node, str):
                return node
            if isinstance(node, list):
                return " ".join(_extract_text(item) for item in node if _extract_text(item).strip())
            if isinstance(node, dict):
                content = node.get("content", "")
                return _extract_text(content)
            return ""

        def _flatten_definition(raw_json_str):
            """Parse a definition JSON string and return a JSON array of plain text strings."""
            try:
                items = json.loads(raw_json_str)
            except Exception:
                return raw_json_str  # leave as-is if not valid JSON
            if not isinstance(items, list):
                items = [items]
            texts = []
            for item in items:
                t = _extract_text(item).strip()
                if t:
                    texts.append(t)
            if not texts:
                return raw_json_str
            return json.dumps(texts, ensure_ascii=False)

        try:
            # Initialize tokenizer if needed
            if cls.tokenizer_instance is None:
                from janome.tokenizer import Tokenizer
                cls.tokenizer_instance = Tokenizer()

            # Tokenize using janome for proper Japanese morphological analysis
            janome_tokens = cls.tokenizer_instance.tokenize(text)
            
            # Filter out only relevant token types
            surface_tokens = []
            for t in janome_tokens:
                surface = t.surface
                base = t.base_form or surface
                reading = t.reading or ""
                pos = t.part_of_speech or ""
                if surface.strip():
                    surface_tokens.append({
                        "surface": surface,
                        "base": base,
                        "reading": reading,
                        "pos": pos
                    })

            # Now look up each token in the dictionary
            conn = sqlite3.connect(cls.dict_db_path)
            cursor = conn.cursor()

            token_results = []
            for tok in surface_tokens:
                surface = tok["surface"]
                reading = tok["reading"]
                base = tok["base"]
                
                # Normalize reading: convert katakana to hiragana for lookup
                def to_hiragana(s):
                    if not s:
                        return s
                    result = []
                    for c in s:
                        if c >= '\u30A1' and c <= '\u30F6':  # Katakana range
                            result.append(chr(ord(c) - 0x60))  # Convert to hiragana
                        elif c == 'ー':  # Prolonged sound mark - keep as is
                            result.append(c)
                        elif c == 'ッ':  # Sokuon in katakana - convert to hiragana
                            result.append('っ')
                        else:
                            result.append(c)
                    return ''.join(result)
                
                reading_hira = to_hiragana(reading)
                base_hira = to_hiragana(base)
                
                # Build list of variants to try
                variants = []
                variants.append((surface, reading_hira, base))
                variants.append((surface, reading, base))  # Try original reading too
                if surface.endswith("っ"):
                    variants.append((surface[:-1], reading_hira[:-1] if reading_hira.endswith("っ") else reading_hira, surface[:-1]))
                    variants.append((surface[:-1], reading[:-1] if reading.endswith("ッ") else reading, surface[:-1]))
                variants.append((base, base_hira, base))
                variants.append((base, reading_hira, base))  # Try base expression with reading
                
                # Also try stem forms (for 高まる, 高ます, etc.)
                for stem_suf in ["る", "す", "てる", "たら", "ない", "ます", "ました", "よう", "なる"]:
                    if base.endswith(stem_suf) and len(base) > len(stem_suf):
                        stem = base[:-len(stem_suf)]
                        variants.append((stem, to_hiragana(stem), stem))
                
                rows = []
                for lookup_s, lookup_r, matched_base in variants:
                    cursor.execute(
                        "SELECT t.expression, t.reading, t.definition, t.pos, t.popularity, t.sequence, d.name "
                        "FROM terms t JOIN dictionaries d ON t.dictionary_id = d.id "
                        "WHERE t.expression = ? OR t.reading = ? "
                        "ORDER BY t.popularity DESC",
                        (lookup_s, lookup_r)
                    )
                    raw_rows = cursor.fetchall()
                    if raw_rows:
                        # Filter rows to avoid homophones with completely different kanji
                        valid_rows = []
                        has_kanji_lookup = any('\u4e00' <= c <= '\u9fff' or '\u3400' <= c <= '\u4dbf' for c in lookup_s)
                        lookup_kanji_set = {c for c in lookup_s if '\u4e00' <= c <= '\u9fff' or '\u3400' <= c <= '\u4dbf'}
                        
                        for row in raw_rows:
                            row_exp = row[0]
                            row_kanji_set = {c for c in row_exp if '\u4e00' <= c <= '\u9fff' or '\u3400' <= c <= '\u4dbf'}
                            
                            if has_kanji_lookup:
                                # If the query contains kanji, the database entry must also contain kanji
                                # and they must share at least one kanji character.
                                if not row_kanji_set:
                                    continue
                                if not (lookup_kanji_set & row_kanji_set):
                                    continue
                            
                            # Reading compatibility check
                            has_kanji_reading = any('\u4e00' <= c <= '\u9fff' or '\u3400' <= c <= '\u4dbf' for c in lookup_r)
                            if not has_kanji_reading:
                                row_read = row[1]
                                h_lookup_r = to_hiragana(lookup_r)
                                h_row_read = to_hiragana(row_read)
                                if not (h_lookup_r == h_row_read or h_lookup_r.startswith(h_row_read) or h_row_read.startswith(h_lookup_r)):
                                    continue
                            
                            valid_rows.append(row)
                        
                        if valid_rows:
                            # Prioritize exact/variant expression matches over reading-only matches
                            valid_rows.sort(key=lambda r: (r[0] == lookup_s, r[4]), reverse=True)
                            rows = valid_rows
                            logger.info(f"[Lookup] Found match for '{surface}' via variant '{lookup_s}' / '{lookup_r}': {len(rows)} valid rows")
                            base = matched_base
                            break
                
                definitions = []
                for row in rows:
                    def_text = row[2]
                    flat_def = _flatten_definition(def_text)
                    logger.info(f"[Lookup] Definition for '{row[0]}': raw={def_text[:100]!r} flat={flat_def[:100]!r}")
                    definitions.append({
                        "expression": row[0],
                        "reading": row[1],
                        "definition": flat_def,
                        "pos": row[3],
                        "popularity": row[4],
                        "sequence": row[5],
                        "dictionary": row[6]
                    })
                
                token_results.append({
                    "surface": surface,
                    "base": base,
                    "reading": to_hiragana(reading),  # Return Hiragana to frontend
                    "pos": tok["pos"],
                    "definitions": definitions
                })

            conn.close()
            token_surfaces = [t["surface"] for t in token_results]
            logger.info(f"lookup_word complete: {len(token_results)} tokens: {token_surfaces}")
            return {"status": "success", "tokens": token_results}
        except Exception as e:
            logger.error(f"Word lookup failed: {e}")
            return {"status": "error", "message": f"Lookup failed: {e}"}

    @classmethod
    async def import_dictionary(cls, *args, **kwargs):
        zip_path = ""
        if args and isinstance(args[0], dict):
            zip_path = args[0].get("zip_path", "")
        elif kwargs:
            zip_path = kwargs.get("zip_path", "")
        elif args:
            zip_path = args[0]

        if not zip_path or not zip_path.strip():
            return {"status": "error", "message": "No file path provided."}
        if not os.path.exists(zip_path):
            return {"status": "error", "message": f"File not found: {zip_path}"}
        if not os.path.isfile(zip_path):
            return {"status": "error", "message": f"Path is not a file: {zip_path}"}

        cls.import_progress = {"status": "importing", "progress": 1, "message": "Spawning background worker..."}
        logger.info(f"[Import] Starting worker thread for: {zip_path}")
        # Call the module-level function — NOT a Plugin method, so Decky's RPC
        # scanner can never accidentally call it without arguments.
        t = threading.Thread(target=_dict_import_worker, args=(cls, zip_path), daemon=True)
        t.start()
        logger.info(f"[Import] Thread id: {t.ident}")
        return {"status": "success", "message": "Import started in background."}

    @classmethod
    async def get_import_progress(cls, *args, **kwargs):
        return cls.import_progress

    @classmethod
    async def get_import_log(cls, *args, **kwargs):
        """Return the last 4 KB of /tmp/decky_ocr_import.log for debugging."""
        try:
            log_path = "/tmp/decky_ocr_import.log"
            if not os.path.exists(log_path):
                return {"status": "success", "log": "(log file not found)"}
            with open(log_path, "r") as f:
                content = f.read()
            return {"status": "success", "log": content[-4096:]}
        except Exception as e:
            return {"status": "error", "log": str(e)}

    @classmethod
    async def get_ocr_log(cls, *args, **kwargs):
        """Return the last 4 KB of /tmp/decky_ocr.log for debugging."""
        try:
            log_path = "/tmp/decky_ocr.log"
            if not os.path.exists(log_path):
                return {"status": "success", "log": "(OCR log not found — has capture_screen been called?)"}
            with open(log_path, "r") as f:
                content = f.read()
            return {"status": "success", "log": content[-4096:]}
        except Exception as e:
            return {"status": "error", "log": str(e)}

    @classmethod
    async def list_dictionaries(cls, *args, **kwargs):
        try:
            if not os.path.exists(cls.dict_db_path):
                return {"status": "success", "dictionaries": []}
                
            conn = sqlite3.connect(cls.dict_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT name, created_at FROM dictionaries")
            dicts = []
            for row in cursor.fetchall():
                dicts.append({
                    "name": row[0],
                    "created_at": row[1]
                })
            conn.close()
            return {"status": "success", "dictionaries": dicts}
        except Exception as e:
            logger.error(f"Failed to list dictionaries: {e}")
            return {"status": "error", "message": str(e)}

    @classmethod
    async def delete_dictionary(cls, *args, **kwargs):
        name = ""
        if args and isinstance(args[0], dict):
            name = args[0].get("name", "")
        elif kwargs:
            name = kwargs.get("name", "")
        elif args:
            name = args[0]

        try:
            conn = sqlite3.connect(cls.dict_db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM dictionaries WHERE name = ?", (name,))
            conn.commit()
            conn.close()
            return {"status": "success"}
        except Exception as e:
            logger.error(f"Failed to delete dictionary: {e}")
            return {"status": "error", "message": str(e)}

    # Vocab Database Operations
    @classmethod
    async def add_to_vocab(cls, *args, **kwargs):
        expression = ""
        reading = ""
        definition = ""
        sentence = ""
        if args and isinstance(args[0], dict):
            payload = args[0]
            expression = payload.get("expression", "")
            reading = payload.get("reading", "")
            definition = payload.get("definition", "")
            sentence = payload.get("sentence", "")
        elif kwargs:
            expression = kwargs.get("expression", "")
            reading = kwargs.get("reading", "")
            definition = kwargs.get("definition", "")
            sentence = kwargs.get("sentence", "")
        elif len(args) >= 4:
            expression, reading, definition, sentence = args[:4]

        try:
            conn = sqlite3.connect(cls.vocab_db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO vocab (expression, reading, definition, sentence)
                VALUES (?, ?, ?, ?)
            """, (expression, reading, definition, sentence))
            conn.commit()
            conn.close()
            return {"status": "success"}
        except Exception as e:
            logger.error(f"Failed to add word to vocabulary: {e}")
            return {"status": "error", "message": str(e)}

    @classmethod
    async def get_vocab_list(cls, *args, **kwargs):
        try:
            conn = sqlite3.connect(cls.vocab_db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, expression, reading, definition, sentence, created_at FROM vocab ORDER BY id DESC")
            items = []
            for row in cursor.fetchall():
                items.append({
                    "id": row[0],
                    "expression": row[1],
                    "reading": row[2],
                    "definition": row[3],
                    "sentence": row[4],
                    "created_at": row[5]
                })
            conn.close()
            return {"status": "success", "vocab": items}
        except Exception as e:
            logger.error(f"Failed to fetch vocabulary list: {e}")
            return {"status": "error", "message": str(e)}

    @classmethod
    async def delete_vocab_item(cls, *args, **kwargs):
        item_id = -1
        if args and isinstance(args[0], dict):
            item_id = args[0].get("item_id", -1)
        elif kwargs:
            item_id = kwargs.get("item_id", -1)
        elif args:
            item_id = args[0]

        try:
            conn = sqlite3.connect(cls.vocab_db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM vocab WHERE id = ?", (item_id,))
            conn.commit()
            conn.close()
            return {"status": "success"}
        except Exception as e:
            logger.error(f"Failed to delete vocab item: {e}")
            return {"status": "error", "message": str(e)}
