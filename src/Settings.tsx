import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { 
  ServerAPI, 
  PanelSection, 
  PanelSectionRow, 
  ButtonItem, 
  TextField,
  Navigation,
  showModal,
  findSP
} from "decky-frontend-lib";
import { FaPlay, FaBook, FaPlus, FaTrash, FaBookOpen } from "react-icons/fa";
import { Overlay } from "./Overlay";

interface Dictionary {
  name: string;
  created_at: string;
}

interface VocabItem {
  id: number;
  expression: string;
  reading: string;
  definition: string;
  sentence: string;
  created_at: string;
}

export const Settings: React.FC<{ serverApi: ServerAPI }> = ({ serverApi }) => {
  const [installStatus, setInstallStatus] = useState<string>("idle");
  const [installLog, setInstallLog] = useState<string>("");
  const [dictPath, setDictPath] = useState<string>("/home/deck/Downloads/JMdict_english.zip");
  const [dictList, setDictList] = useState<Dictionary[]>([]);
  const [vocabCount, setVocabCount] = useState<number>(0);
  const [activeView, setActiveView] = useState<"dashboard" | "vocab">("dashboard");
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);
  const [importProgress, setImportProgress] = useState<{ status: string; progress: number; message: string }>({
    status: "idle",
    progress: 0,
    message: ""
  });
  const [importLog, setImportLog] = useState<string>("");
  const [ocrLog, setOcrLog] = useState<string>("");
  const [ocrDebugMode, setOcrDebugMode] = useState<boolean>(false);

  // Hotkey state
  const [hotkeyDevice, setHotkeyDevice] = useState<string>("");
  const [hotkeyKeycode, setHotkeyKeycode] = useState<number | string>(-1);
  const [hotkeyLearning, setHotkeyLearning] = useState<boolean>(false);
  const [hotkeyStatus, setHotkeyStatus] = useState<string>("");
  const [hotkeyDiagLog, setHotkeyDiagLog] = useState<string>("");
  const [needsInputSetup, setNeedsInputSetup] = useState<boolean>(false);

  // Portal target ref and state to render the overlay in the QuickAccess window
  const settingsRef = useRef<HTMLDivElement>(null);
  const dummyFocusRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isOverlayActive, setIsOverlayActive] = useState<boolean>(false);

  useEffect(() => {
    if (settingsRef.current) {
      try {
        const sp = findSP();
        if (sp && sp.document) {
          setPortalTarget(sp.document.body);
        } else {
          setPortalTarget(settingsRef.current.ownerDocument.body);
        }
      } catch (e) {
        console.error("[Settings] findSP failed, falling back to QAM body:", e);
        setPortalTarget(settingsRef.current.ownerDocument.body);
      }
    }
  }, []);

  // Keep focus locked inside settings/overlay and block navigation keys when overlay is active to prevent moving to QAM tabs
  useEffect(() => {
    if (!isOverlayActive) return;

    let parentDoc: Document | null = null;
    try {
      const sp = findSP();
      if (sp && sp.document) {
        parentDoc = sp.document;
      }
    } catch (e) {
      console.error("[Settings] findSP failed in focus hook:", e);
    }
    if (!parentDoc && portalTarget && portalTarget.ownerDocument) {
      parentDoc = portalTarget.ownerDocument;
    }
    if (!parentDoc) {
      parentDoc = settingsRef.current?.ownerDocument || document;
    }

    const localDoc = settingsRef.current?.ownerDocument || document;

    const handleFocusCheck = (e?: Event) => {
      if (!isOverlayActive) return;

      const overlayContainer = parentDoc?.getElementById("decky-ocr-overlay-container");

      // 1. If focus is going to an element inside the overlay, let it happen!
      if (e && e.target && overlayContainer && (e.target === overlayContainer || overlayContainer.contains(e.target as Node))) {
        return;
      }

      // 2. If the current active element in the parent document is inside the overlay, let it be!
      if (parentDoc) {
        const activeEl = parentDoc.activeElement;
        if (overlayContainer && (activeEl === overlayContainer || overlayContainer.contains(activeEl))) {
          return;
        }
      }

      // 3. Otherwise, focus has escaped! Redirect it back to the overlay container (or the dummy element)
      if (overlayContainer) {
        (overlayContainer as HTMLElement).focus();
      } else if (dummyFocusRef.current) {
        dummyFocusRef.current.focus();
      }
    };

    // Block keyboard/gamepad navigation and select events in the capture phase
    const handleKeyCapture = (e: KeyboardEvent) => {
      const keysToBlock = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Enter", " "];
      if (keysToBlock.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Set initial focus
    const initialOverlay = parentDoc?.getElementById("decky-ocr-overlay-container");
    if (initialOverlay) {
      (initialOverlay as HTMLElement).focus();
    } else if (dummyFocusRef.current) {
      dummyFocusRef.current.focus();
    }

    // Register capture-phase focus listeners on both local and parent documents!
    const docs = Array.from(new Set([parentDoc, localDoc].filter(Boolean) as Document[]));
    docs.forEach(d => {
      d.addEventListener("focusin", handleFocusCheck, true);
    });

    const interval = setInterval(() => handleFocusCheck(), 100);

    // Register key capture on all relevant windows (parent SP window, portal target window, and local iframe window)
    const windows: Window[] = [];
    try {
      const sp = findSP();
      if (sp && sp.document && sp.document.defaultView) {
        windows.push(sp.document.defaultView);
      }
    } catch (err) {
      console.error("[Settings] Failed to find SP window:", err);
    }
    if (portalTarget && portalTarget.ownerDocument && portalTarget.ownerDocument.defaultView) {
      const pWin = portalTarget.ownerDocument.defaultView;
      if (!windows.includes(pWin)) windows.push(pWin);
    }
    if (localDoc && localDoc.defaultView) {
      const lWin = localDoc.defaultView;
      if (!windows.includes(lWin)) windows.push(lWin);
    }

    windows.forEach(win => {
      win.addEventListener("keydown", handleKeyCapture, true);
      win.addEventListener("keyup", handleKeyCapture, true);
      win.addEventListener("keypress", handleKeyCapture, true);
    });

    return () => {
      docs.forEach(d => {
        d.removeEventListener("focusin", handleFocusCheck, true);
      });
      clearInterval(interval);
      windows.forEach(win => {
        win.removeEventListener("keydown", handleKeyCapture, true);
        win.removeEventListener("keyup", handleKeyCapture, true);
        win.removeEventListener("keypress", handleKeyCapture, true);
      });
    };
  }, [isOverlayActive, portalTarget]);

  // Poll installation status on load
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const response = await serverApi.callPluginMethod("get_install_status", {});
        if (response.success && response.result) {
          const result = response.result as any;
          setInstallStatus(result.status);
          setInstallLog(result.log);
          
          if (result.status === "installing") {
            timer = setTimeout(checkStatus, 1500);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkStatus();
    fetchDictionaries();
    fetchVocabList();
    fetchHotkeyConfig();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Effect to hide/disable/defuse the QAM back button and other outside elements (like tabs) when overlay is active
  useEffect(() => {
    if (!isOverlayActive) return;

    let parentDoc: Document | null = null;
    try {
      const sp = findSP();
      if (sp && sp.document) {
        parentDoc = sp.document;
      }
    } catch (e) {
      console.error("[Settings] findSP failed in hook:", e);
    }
    if (!parentDoc && portalTarget && portalTarget.ownerDocument) {
      parentDoc = portalTarget.ownerDocument;
    }
    if (!parentDoc) {
      parentDoc = settingsRef.current?.ownerDocument || document;
    }

    const localDoc = settingsRef.current?.ownerDocument || document;
    const docsToProcess = Array.from(new Set([parentDoc, localDoc].filter(Boolean) as Document[]));

    const originalAttrs = new Map<Element, {
      disabled: string | null;
      tabIndex: string | null;
      className: string;
      style: string;
      doc: Document;
    }>();

    const defuseOutsideElements = () => {
      try {
        const settingsEl = settingsRef.current;
        if (!settingsEl) return;

        docsToProcess.forEach(doc => {
          const myIframe = (localDoc.defaultView || window).frameElement;
          const overlayContainer = doc.getElementById("decky-ocr-overlay-container");

          // Query focusable elements, inputs, tab items, sidebar items
          const focusables = doc.querySelectorAll(
            ".Focusable, button, input, select, textarea, a, [tabindex='0'], [class*=\"tab\"], [class*=\"Tab\"], [class*=\"TabBar\"], [class*=\"tabbar\"], [class*=\"Sidebar\"], [class*=\"sidebar\"]"
          );

          for (const el of Array.from(focusables)) {
            // Check tag name to avoid disabling body, html, or iframes
            const tagName = el.tagName.toUpperCase();
            if (tagName === "BODY" || tagName === "HTML" || tagName === "IFRAME") {
              continue;
            }

            // If it's the iframe container element itself, don't disable it
            if (myIframe && el === myIframe) {
              continue;
            }

            // If it is our void focus dummy, don't disable it
            if (el.id === "decky-ocr-void-focus") {
              continue;
            }

            // If it is inside our settings menu, don't disable it
            if (doc === localDoc && settingsEl.contains(el)) {
              continue;
            }

            // If it is the overlay or inside the overlay, do NOT defuse it
            if (overlayContainer && (el === overlayContainer || overlayContainer.contains(el))) {
              continue;
            }

            // Backup original attributes if not already saved
            if (!originalAttrs.has(el)) {
              const classNameStr = typeof el.className === "string" ? el.className : el.getAttribute("class") || "";
              originalAttrs.set(el, {
                disabled: el.getAttribute("disabled"),
                tabIndex: el.getAttribute("tabindex"),
                className: classNameStr,
                style: el.getAttribute("style") || "",
                doc
              });
            }

            // Apply defusing modifications
            if (el.getAttribute("tabindex") !== "-1") {
              el.setAttribute("tabindex", "-1");
            }
            if (el.classList.contains("Focusable")) {
              el.classList.remove("Focusable");
            }
            if (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
              if (el.getAttribute("disabled") !== "true") {
                el.setAttribute("disabled", "true");
              }
            }

            // Disable all pointer & touch events
            const htmlEl = el as HTMLElement;
            if (htmlEl.style) {
              htmlEl.style.pointerEvents = "none";
            }

            if (doc.activeElement === el) {
              htmlEl.blur();
            }
          }
        });
      } catch (e) {
        console.error("[Settings] Error defusing outside elements:", e);
      }
    };

    // Run immediately
    defuseOutsideElements();

    // Poll periodically in case of Steam UI re-renders
    const interval = setInterval(defuseOutsideElements, 200);

    return () => {
      clearInterval(interval);
      // Restore original state of any elements we modified
      try {
        originalAttrs.forEach((attrs, el) => {
          if (el && attrs.doc.contains(el)) {
            if (attrs.disabled !== null) {
              el.setAttribute("disabled", attrs.disabled);
            } else {
              el.removeAttribute("disabled");
            }
            if (attrs.tabIndex !== null) {
              el.setAttribute("tabindex", attrs.tabIndex);
            } else {
              el.removeAttribute("tabindex");
            }
            if (typeof el.className === "string") {
              el.className = attrs.className;
            } else {
              el.setAttribute("class", attrs.className);
            }
            el.setAttribute("style", attrs.style);
          }
        });
      } catch (e) {
        console.error("[Settings] Error restoring outside elements:", e);
      }
    };
  }, [isOverlayActive, portalTarget]);

  const fetchDictionaries = async () => {
    try {
      const response = await serverApi.callPluginMethod("list_dictionaries", {});
      const result = response.result as any;
      if (response.success && result && result.status === "success") {
        setDictList(result.dictionaries);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVocabList = async () => {
    try {
      const response = await serverApi.callPluginMethod("get_vocab_list", {});
      const result = response.result as any;
      if (response.success && result && result.status === "success") {
        setVocabList(result.vocab);
        setVocabCount(result.vocab.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHotkeyConfig = async () => {
    try {
      const res = await serverApi.callPluginMethod("get_hotkey_config", {});
      if (res.success && res.result) {
        const r = res.result as any;
        setHotkeyDevice(r.device || "");
        setHotkeyKeycode(r.keycode ?? -1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLearnHotkey = async () => {
    setHotkeyStatus("Waiting for button press... (15s)");
    setHotkeyLearning(true);
    try {
      await serverApi.callPluginMethod("start_hotkey_learn", {});
    } catch (e) {
      setHotkeyStatus("Failed to start learn mode.");
      setHotkeyLearning(false);
      return;
    }
    // Poll until result arrives or timeout
    const poll = async () => {
      try {
        const res = await serverApi.callPluginMethod("get_hotkey_learn_result", {});
        const r = res.result as any;
        if (r.result) {
          // Got a result — save it
          await serverApi.callPluginMethod("save_hotkey", { device: r.result.device, keycode: r.result.keycode });
          setHotkeyDevice(r.result.device);
          setHotkeyKeycode(r.result.keycode);
          setHotkeyStatus("Hotkey saved! ✓");
          setHotkeyLearning(false);
          // Show learn log for transparency
          if (r.log && r.log.length > 0) setHotkeyDiagLog(r.log.join("\n"));
          setTimeout(() => setHotkeyStatus(""), 3000);
        } else if (r.active) {
          setTimeout(poll, 500);
        } else {
          // Timed out — show the session log so user can see what happened
          const logText = r.log && r.log.length > 0 ? r.log.join("\n") : "(no log)";
          setHotkeyDiagLog(logText);
          setHotkeyStatus("Timed out — no button detected. See log below.");
          setHotkeyLearning(false);
        }
      } catch (e) {
        setHotkeyStatus("Poll error.");
        setHotkeyLearning(false);
      }
    };
    setTimeout(poll, 500);
  };

  const handleClearHotkey = async () => {
    try {
      await serverApi.callPluginMethod("clear_hotkey", {});
      setHotkeyDevice("");
      setHotkeyKeycode(-1);
      setHotkeyStatus("Hotkey cleared.");
      setTimeout(() => setHotkeyStatus(""), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDiagnose = async () => {
    setHotkeyDiagLog("Running diagnosis...");
    try {
      const res = await serverApi.callPluginMethod("diagnose_hotkey", {});
      if (res.success && res.result) {
        const r = res.result as any;
        setHotkeyDiagLog(r.log || "(empty)");
        // Detect permission issue: UID != 0 and key devices blocked
        const accessible: string[] = r.accessible || [];
        const hasEvent5 = accessible.some((d: string) => d.includes("event5"));
        const hasEvent8 = accessible.some((d: string) => d.includes("event8"));
        if (r.uid !== 0 && (!hasEvent5 || !hasEvent8)) {
          setNeedsInputSetup(true);
        } else {
          setNeedsInputSetup(false);
        }
      } else {
        setHotkeyDiagLog("RPC failed.");
      }
    } catch (e) {
      setHotkeyDiagLog("Error: " + String(e));
    }
  };

  const fetchOcrLog = async () => {
    try {
      const res = await serverApi.callPluginMethod("get_ocr_log", {});
      if (res.success && res.result) {
        setOcrLog((res.result as any).log || "(empty)");
      } else {
        setOcrLog("Could not fetch OCR log.");
      }
    } catch (e) {
      setOcrLog("Error: " + String(e));
    }
  };

  const handleTriggerOCR = () => {
    Navigation.CloseSideMenus();
    setOcrLog("Sidebar closing (600ms)...");
    setTimeout(async () => {
      setOcrLog(prev => prev + "\nTriggering OCR request on backend...");
      try {
        await serverApi.callPluginMethod("trigger_ocr_request", {});
      } catch (e) {
        setOcrLog(prev => prev + "\nRPC Trigger failed: " + String(e));
      }
      // Fetch the backend log 2.5s later so capture_screen has time to finish
      setTimeout(fetchOcrLog, 2500);
    }, 600);
  };

  // Debug: call capture_screen directly without closing the sidebar,
  // so we can see the full error from the backend even in Settings view.
  const handleDebugCapture = async () => {
    setOcrLog("Calling capture_screen directly...");
    try {
      const spKeys = Object.keys((window as any).SP_REACTDOM || {});
      const rdKeys = Object.keys((window as any).ReactDOM || {});
      const globalKeys = Object.keys(window);
      setOcrLog(prev => prev + `\nSP_REACTDOM keys: ${JSON.stringify(spKeys)}\nReactDOM keys: ${JSON.stringify(rdKeys)}\nHas SP_REACTDOM: ${typeof (window as any).SP_REACTDOM}\nHas ReactDOM: ${typeof (window as any).ReactDOM}`);
    } catch (e) {
      setOcrLog(prev => prev + "\nError inspecting React DOM: " + String(e));
    }
    try {
      const res = await serverApi.callPluginMethod("capture_screen", {});
      const result = res.result as any;
      setOcrLog(prev => prev + "\nRPC result: " + JSON.stringify(result, null, 2));
    } catch (e) {
      setOcrLog(prev => prev + "\nRPC error: " + String(e));
    }
    await fetchOcrLog();
  };

  const handleImportDictionary = async () => {
    if (!dictPath) {
      setImportProgress({
        status: "error",
        progress: 0,
        message: "Please enter a valid path to a Yomichan ZIP dictionary."
      });
      return;
    }
    setImportProgress({
      status: "importing",
      progress: 0,
      message: "Starting import..."
    });
    try {
      const response = await serverApi.callPluginMethod("import_dictionary", { zip_path: dictPath });
      const result = response.result as any;
      if (response.success && result && result.status === "success") {
        const interval = setInterval(async () => {
          try {
            const progResponse = await serverApi.callPluginMethod("get_import_progress", {});
            if (progResponse.success && progResponse.result) {
              const progressResult = progResponse.result as any;
              setImportProgress(progressResult);
              if (progressResult.status === "success" || progressResult.status === "error") {
                clearInterval(interval);
                fetchDictionaries();
                setTimeout(() => {
                  setImportProgress(p => p.status === progressResult.status ? { ...p, status: "idle" } : p);
                }, 5000);
              }
            }
          } catch (pollErr) {
            console.error(pollErr);
            clearInterval(interval);
          }
        }, 500);
      } else {
        setImportProgress({
          status: "error",
          progress: 0,
          message: "Import failed: " + (result?.message || "Verify file path.")
        });
      }
    } catch (err) {
      setImportProgress({
        status: "error",
        progress: 0,
        message: "Failed to initiate import."
      });
      console.error(err);
    }
  };

  const handleViewLog = async () => {
    try {
      const response = await serverApi.callPluginMethod("get_import_log", {});
      if (response.success && response.result) {
        const result = response.result as any;
        setImportLog(result.log || "(empty log)");
      } else {
        setImportLog("Could not fetch log.");
      }
    } catch (err) {
      setImportLog("Error fetching log: " + String(err));
    }
  };

  const handleDeleteDict = async (name: string) => {
    try {
      const response = await serverApi.callPluginMethod("delete_dictionary", { name });
      const result = response.result as any;
      if (response.success && result?.status === "success") {
        fetchDictionaries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenVocabView = () => {
    fetchVocabList();
    setActiveView("vocab");
  };

  const handleDeleteVocabItem = async (id: number) => {
    try {
      const response = await serverApi.callPluginMethod("delete_vocab_item", { item_id: id });
      const result = response.result as any;
      if (response.success && result?.status === "success") {
        fetchVocabList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleForceReinstall = async () => {
    setInstallStatus("installing");
    setInstallLog("Forcing reinstallation...\n");
    try {
      // Trigger clean installation in Python backend
      await serverApi.callPluginMethod("force_reinstall", {});
      
      // Start polling
      setTimeout(async function poll() {
        const response = await serverApi.callPluginMethod("get_install_status", {});
        if (response.success && response.result) {
          const result = response.result as any;
          setInstallStatus(result.status);
          setInstallLog(result.log);
          if (result.status === "installing") {
            setTimeout(poll, 1500);
          }
        }
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Loading / Installer Screen
  if (installStatus === "installing") {
    return (
      <PanelSection title="Dependencies">
        <PanelSectionRow>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: "12px" }}>
            <div className="spinner" style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: "14px", fontWeight: "bold", textAlign: "center" }}>Installing OCR & NLP Engines...</div>
            <div style={{ fontSize: "11px", opacity: 0.6, textAlign: "center" }}>This runs offline once in background. Keep Steam Deck awake.</div>
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <div style={{ background: "#111", padding: "8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "10px", maxHeight: "150px", overflowY: "auto", whiteSpace: "pre-wrap", color: "#65a30d" }}>
            {installLog}
          </div>
        </PanelSectionRow>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
      </PanelSection>
    );
  }

  // 2. Error Screen
  if (installStatus === "error") {
    return (
      <PanelSection title="Dependencies Error">
        <PanelSectionRow>
          <div style={{ padding: "8px 0", color: "#f87171", fontSize: "13px" }}>
            Failed to download Python dependencies. Make sure you are connected to the internet and click Retry.
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonItem onClick={handleForceReinstall}>
            Retry Installation
          </ButtonItem>
        </PanelSectionRow>
        <PanelSectionRow>
          <div style={{ background: "#111", padding: "8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "9px", maxHeight: "150px", overflowY: "auto", whiteSpace: "pre-wrap", color: "#ef4444" }}>
            {installLog}
          </div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  // 2.5. Void Screen when Overlay is active (handled inside main return block to prevent unmounting Portal)

  // 3. Ready Dashboard Screen
  return (
    <div ref={settingsRef} style={{ display: "contents" }}>
      {isOverlayActive ? (
        <>
          <style dangerouslySetInnerHTML={{ __html: `
            /* Hide the Decky QAM header with the back button when active */
            div:has(> button:has(svg > path[d^="M257.5 445.1"])) {
              display: none !important;
            }
          `}} />
          <PanelSection title="OCR Active">
            <PanelSectionRow>
              <div 
                ref={dummyFocusRef}
                id="decky-ocr-void-focus"
                className="Focusable"
                tabIndex={0}
                data-nav-up="decky-ocr-void-focus"
                data-nav-down="decky-ocr-void-focus"
                data-nav-left="decky-ocr-void-focus"
                data-nav-right="decky-ocr-void-focus"
                nav-up="decky-ocr-void-focus"
                nav-down="decky-ocr-void-focus"
                nav-left="decky-ocr-void-focus"
                nav-right="decky-ocr-void-focus"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 10px",
                  textAlign: "center",
                  opacity: 0.6,
                  fontSize: "13px",
                  outline: "none"
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>OCR Overlay is active.</div>
                <div style={{ fontSize: "11px", lineHeight: 1.4 }}>Controls are temporarily mapped to the text highlights on the screenshot.</div>
              </div>
            </PanelSectionRow>
          </PanelSection>
        </>
      ) : activeView === "vocab" ? (
        <PanelSection title={`Vocabulary List (${vocabList.length})`}>
          <PanelSectionRow>
            <ButtonItem onClick={() => setActiveView("dashboard")}>
              Back to Dashboard
            </ButtonItem>
          </PanelSectionRow>
          
          {vocabList.length === 0 ? (
            <PanelSectionRow>
              <div style={{ textAlign: "center", opacity: 0.5, padding: "20px 0", fontStyle: "italic", fontSize: "13px", width: "100%" }}>
                No saved words yet. Capture a screen, select a word, and save it!
              </div>
            </PanelSectionRow>
          ) : (
            vocabList.map((item, idx) => {
              let definitionsList: string[] = [];
              try {
                definitionsList = JSON.parse(item.definition);
              } catch {
                definitionsList = [item.definition];
              }
              return (
                <PanelSectionRow key={idx}>
                  <div style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "8px",
                    padding: "10px",
                    position: "relative",
                    width: "100%",
                    boxSizing: "border-box"
                  }}>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteVocabItem(item.id)}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "4px"
                      }}
                    >
                      <FaTrash size={12} />
                    </button>

                    <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "15px", fontWeight: "bold" }}>{item.expression}</span>
                      {item.reading && item.reading !== "*" && (
                        <span style={{ fontSize: "11px", color: "#a5b4fc" }}>[{item.reading}]</span>
                      )}
                    </div>

                    <div style={{ fontSize: "11px", color: "#e2e8f0", paddingLeft: "8px", borderLeft: "2px solid #6366f1", marginBottom: "6px" }}>
                      {definitionsList.slice(0, 3).map((dText, dIdx) => (
                        <div key={dIdx} style={{ marginBottom: "2px" }}>• {dText}</div>
                      ))}
                      {definitionsList.length > 3 && <div style={{ opacity: 0.5 }}>and {definitionsList.length - 3} more...</div>}
                    </div>

                    {item.sentence && (
                      <div style={{ background: "rgba(0, 0, 0, 0.15)", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", color: "#94a3b8", fontStyle: "italic", wordBreak: "break-all" }}>
                        Context: {item.sentence}
                      </div>
                    )}
                  </div>
                </PanelSectionRow>
              );
            })
          )}
        </PanelSection>
      ) : (
        <PanelSection title="OCR Learner Dashboard">
      <PanelSectionRow>
        <ButtonItem onClick={handleTriggerOCR}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <FaPlay size={12} />
            <span>Capture Game Screen</span>
          </div>
        </ButtonItem>
      </PanelSectionRow>

      {/* Hotkey Configuration */}
      <PanelSectionRow>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
          <div style={{ fontSize: "11px", fontWeight: "bold", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Hardware Hotkey
          </div>

          {/* Permission setup banner */}
          {needsInputSetup && (
            <div style={{
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.4)",
              borderRadius: "8px",
              padding: "8px 10px",
              fontSize: "10px",
              color: "#fbbf24"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>⚠ Setup Required</div>
              <div style={{ opacity: 0.85, marginBottom: "6px" }}>
                Plugin runs as deck user — gamepad devices are permission-denied.
                Run this once in SSH terminal, then re-open settings:
              </div>
              <div style={{
                background: "rgba(0,0,0,0.4)",
                borderRadius: "4px",
                padding: "4px 6px",
                fontFamily: "monospace",
                fontSize: "9px",
                color: "#e2e8f0",
                wordBreak: "break-all",
                userSelect: "text"
              }}>
                {"sudo bash /tmp/setup_hotkey_permissions.sh"}
              </div>
              <div style={{ marginTop: "4px", opacity: 0.7, fontSize: "9px" }}>
                (File already uploaded to your Steam Deck at /tmp/setup_hotkey_permissions.sh)
              </div>
            </div>
          )}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            padding: "8px 10px",
            fontSize: "11px",
            color: hotkeyDevice ? "#10b981" : "rgba(255,255,255,0.35)",
            fontFamily: "monospace"
          }}>
            {hotkeyDevice
              ? `${hotkeyDevice.replace("/dev/input/", "")}  key:${hotkeyKeycode}`
              : "Not configured — press a hardware button below"}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={handleLearnHotkey}
              disabled={hotkeyLearning}
              style={{
                flex: 2,
                background: hotkeyLearning
                  ? "rgba(99,102,241,0.35)"
                  : "rgba(99,102,241,0.2)",
                border: `1px solid ${hotkeyLearning ? "#818cf8" : "rgba(99,102,241,0.4)"}`,
                color: hotkeyLearning ? "#e0e7ff" : "#a5b4fc",
                borderRadius: "6px",
                padding: "5px 10px",
                fontSize: "11px",
                fontWeight: "bold",
                cursor: hotkeyLearning ? "not-allowed" : "pointer",
                animation: hotkeyLearning ? "pulse 1s ease-in-out infinite" : "none"
              }}
            >
              {hotkeyLearning ? "⏳ Waiting..." : "⌨ Learn Hotkey"}
            </button>
            {hotkeyDevice && (
              <button
                onClick={handleClearHotkey}
                style={{
                  flex: 1,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171",
                  borderRadius: "6px",
                  padding: "5px 8px",
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            )}
          </div>
          {hotkeyStatus && (
            <div style={{ fontSize: "10px", color: hotkeyStatus.includes("✓") ? "#10b981" : "#f59e0b", textAlign: "center" }}>
              {hotkeyStatus}
            </div>
          )}
          {/* Diagnose button and session log */}
          <button
            onClick={handleDiagnose}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              borderRadius: "6px",
              padding: "3px 8px",
              fontSize: "10px",
              cursor: "pointer",
              width: "100%"
            }}
          >
            🔍 Diagnose Input Access
          </button>
          {hotkeyDiagLog && (
            <div style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "6px",
              padding: "6px 8px",
              fontSize: "9px",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              color: "#94a3b8",
              maxHeight: "120px",
              overflowY: "auto"
            }}>
              {hotkeyDiagLog}
            </div>
          )}
        </div>
      </PanelSectionRow>

      {/* OCR Debug Panel */}
      <PanelSectionRow>
        <div style={{ display: "flex", gap: "6px", width: "100%" }}>
          <button
            onClick={() => setOcrDebugMode(m => !m)}
            style={{
              flex: 1,
              background: ocrDebugMode ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#e2e8f0",
              borderRadius: "6px",
              padding: "5px 10px",
              fontSize: "11px",
              cursor: "pointer"
            }}
          >
            {ocrDebugMode ? "▼ Debug ON" : "▶ Debug"}
          </button>
          {ocrDebugMode && (
            <button
              onClick={handleDebugCapture}
              style={{
                flex: 2,
                background: "rgba(99,102,241,0.2)",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "#a5b4fc",
                borderRadius: "6px",
                padding: "5px 10px",
                fontSize: "11px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Test capture_screen directly
            </button>
          )}
        </div>
      </PanelSectionRow>

      {ocrDebugMode && ocrLog && (
        <PanelSectionRow>
          <div style={{
            fontSize: "10px",
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "8px",
            maxHeight: "160px",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: "#e2e8f0",
            lineHeight: 1.4,
            width: "100%"
          }}>
            {ocrLog}
          </div>
          <ButtonItem onClick={() => setOcrLog("")} layout="below">
            Clear
          </ButtonItem>
        </PanelSectionRow>
      )}

      <PanelSectionRow>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
          <span style={{ fontSize: "14px", opacity: 0.8 }}>Saved Words</span>
          <button 
            onClick={handleOpenVocabView}
            style={{ 
              background: "rgba(99, 102, 241, 0.15)", 
              border: "1px solid rgba(99, 102, 241, 0.3)", 
              color: "#a5b4fc", 
              borderRadius: "8px", 
              padding: "6px 12px", 
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <FaBookOpen size={11} />
            <span>List ({vocabCount})</span>
          </button>
        </div>
      </PanelSectionRow>

      <PanelSectionRow>
        <div style={{ fontSize: "12px", fontWeight: "bold", opacity: 0.6, marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Import Yomichan Dictionary
        </div>
      </PanelSectionRow>
      
      <PanelSectionRow>
        <TextField 
          label="Local Dictionary ZIP Path"
          value={dictPath}
          onChange={(e) => setDictPath(e.target.value)}
          placeholder="/home/deck/Downloads/JMdict.zip"
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem onClick={handleImportDictionary}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <FaPlus size={10} />
            <span>Import Dictionary</span>
          </div>
        </ButtonItem>
      </PanelSectionRow>

      {importProgress.status === "importing" && (
        <PanelSectionRow>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", padding: "4px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", opacity: 0.8 }}>
              <span style={{ fontWeight: "bold" }}>{importProgress.message}</span>
              <span>{importProgress.progress}%</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", overflow: "hidden" }}>
              <div 
                style={{ 
                  width: `${importProgress.progress}%`, 
                  height: "100%", 
                  background: "linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)", 
                  borderRadius: "4px",
                  transition: "width 0.2s ease-out" 
                }} 
              />
            </div>
          </div>
        </PanelSectionRow>
      )}

      {importProgress.status === "success" && (
        <PanelSectionRow>
          <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "bold", padding: "4px 0" }}>
            {importProgress.message}
          </div>
        </PanelSectionRow>
      )}

      {(importProgress.status === "error" || importProgress.status === "importing") && importProgress.progress <= 1 && (
        <PanelSectionRow>
          <ButtonItem onClick={handleViewLog} layout="below">
            View Import Log
          </ButtonItem>
        </PanelSectionRow>
      )}

      {importProgress.status === "error" && (
        <PanelSectionRow>
          <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "bold", padding: "4px 0" }}>
            {importProgress.message}
          </div>
        </PanelSectionRow>
      )}

      {importLog && (
        <PanelSectionRow>
          <div style={{
            fontSize: "10px",
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            padding: "8px",
            maxHeight: "120px",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            color: "#e2e8f0",
            lineHeight: 1.4
          }}>
            {importLog}
          </div>
          <ButtonItem onClick={() => setImportLog("")} layout="below">
            Clear Log
          </ButtonItem>
        </PanelSectionRow>
      )}

      {/* List Active Dictionaries */}
      <PanelSectionRow>
        <div style={{ fontSize: "12px", fontWeight: "bold", opacity: 0.6, marginTop: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Active Dictionaries ({dictList.length})
        </div>
      </PanelSectionRow>

      {dictList.length === 0 ? (
        <PanelSectionRow>
          <div style={{ fontSize: "13px", opacity: 0.5, fontStyle: "italic" }}>
            No dictionaries active. Import a Yomichan ZIP file above to enable word definitions.
          </div>
        </PanelSectionRow>
      ) : (
        dictList.map((dict, idx) => (
          <PanelSectionRow key={idx}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", padding: "4px 0" }}>
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px", fontSize: "13px" }}>
                {dict.name}
              </div>
              <button 
                onClick={() => handleDeleteDict(dict.name)}
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: "#ef4444", 
                  cursor: "pointer", 
                  padding: "4px 8px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <FaTrash size={12} />
              </button>
            </div>
          </PanelSectionRow>
        ))
      )}
    </PanelSection>
      )}
    {portalTarget && ReactDOM.createPortal(
      <Overlay 
        serverApi={serverApi} 
        focusWindow={settingsRef.current?.ownerDocument.defaultView || undefined} 
        renderWindow={portalTarget.ownerDocument.defaultView || undefined} 
        onActivationChange={setIsOverlayActive}
      />,
      portalTarget
    )}
  </div>
);
};

// Fullscreen Modal component for Vocabulary viewing
const VocabModal: React.FC<{ serverApi: ServerAPI; closeModal?: () => void; onClose: () => void }> = ({ serverApi, closeModal, onClose }) => {
  const [vocabList, setVocabList] = useState<VocabItem[]>([]);

  useEffect(() => {
    loadVocab();
  }, []);

  const loadVocab = async () => {
    try {
      const response = await serverApi.callPluginMethod("get_vocab_list", {});
      const result = response.result as any;
      if (response.success && result && result.status === "success") {
        setVocabList(result.vocab);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      const response = await serverApi.callPluginMethod("delete_vocab_item", { item_id: id });
      const result = response.result as any;
      if (response.success && result?.status === "success") {
        loadVocab();
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div 
      style={{
        padding: "24px",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "600px",
        color: "#fff",
        fontFamily: "'Outfit', 'Inter', sans-serif"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaBook size={18} />
          <span>My Vocabulary List ({vocabList.length})</span>
        </h2>
        <button 
          onClick={closeModal}
          style={{ 
            background: "rgba(255,255,255,0.06)", 
            border: "1px solid rgba(255,255,255,0.1)", 
            borderRadius: "6px", 
            color: "#fff", 
            padding: "4px 12px", 
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Close
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: "8px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {vocabList.length === 0 ? (
          <div style={{ textAlign: "center", opacity: 0.5, padding: "40px 0", fontStyle: "italic", fontSize: "14px" }}>
            No saved words yet. Capture a screen, select a word, and save it!
          </div>
        ) : (
          vocabList.map((item, idx) => {
            let definitionsList: string[] = [];
            try {
              definitionsList = JSON.parse(item.definition);
            } catch {
              definitionsList = [item.definition];
            }

            return (
              <div 
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "16px",
                  position: "relative"
                }}
              >
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    background: "transparent",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                >
                  <FaTrash size={12} />
                </button>

                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "18px", fontWeight: "bold" }}>{item.expression}</span>
                  {item.reading && item.reading !== "*" && (
                    <span style={{ fontSize: "13px", color: "#a5b4fc" }}>[{item.reading}]</span>
                  )}
                </div>

                <div style={{ fontSize: "13px", color: "#e2e8f0", paddingLeft: "12px", borderLeft: "2px solid #6366f1", marginBottom: "10px" }}>
                  {definitionsList.slice(0, 3).map((dText, dIdx) => (
                    <div key={dIdx} style={{ marginBottom: "2px" }}>• {dText}</div>
                  ))}
                  {definitionsList.length > 3 && <div style={{ fontSize: "11px", opacity: 0.5 }}>and {definitionsList.length - 3} more...</div>}
                </div>

                {item.sentence && (
                  <div style={{ background: "rgba(0, 0, 0, 0.2)", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>
                    Context: {item.sentence}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
