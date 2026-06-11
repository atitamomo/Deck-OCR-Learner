# Decky OCR Learner

An on-screen OCR and dictionary lookup tool designed for language learning on SteamOS/Steam Deck. This Decky Loader plugin allows you to capture game text, segment words using Japanese morphological analysis (Janome), and perform dictionary lookups on-the-fly using Yomichan-compatible dictionaries—all while playing games.


---

##  Development & Building

### 1. Prerequisites
- **Node.js** (v16+) installed on your PC.
- **Steam Deck** with SSH enabled (`sudo systemctl enable --now sshd` in Desktop Mode).
- **Decky Loader** installed on the Steam Deck.

### 2. Install PC Dependencies
```bash
npm install
```

### 3. Compile the Frontend
Compile the TypeScript and React source files in `src/` to the single-bundle frontend script `dist/index.js`:
```bash
npm run build
```


### 4. Deploy to Steam Deck
You can compile and automatically deploy the plugin to a Steam Deck on your local network using the deployment script:
```bash
node deploy.js <STEAM_DECK_IP>
```
*Note: This script builds the project, copies files via SCP to a staging folder, moves them into `/home/deck/homebrew/plugins/`, sets permissions, and restarts Decky Loader.*

---

##  Packaging for Distribution

To share your plugin with others for easy installation:

1. Build the frontend (`npm run build`).
2. Create a folder named `decky-ocr-learner` containing:
   - `dist/index.js`
   - `main.py`
   - `plugin.json`
   - `setup_hotkey_permissions.sh`
   - An empty `libs/` directory (the plugin will automatically download its dependencies here on the Deck when it is run for the first time).
3. Compress the folder into a ZIP archive: `decky-ocr-learner.zip`.

---

##  Setup on the Steam Deck

### 1. Install the Plugin
Users can install the plugin either by:
- **Developer Settings (Recommended):** Enabling CEF Debugging in Steam Deck Developer Settings, then using **Install from ZIP** in the Decky Developer menu.
- **Manual Extraction:** Unzipping and placing the `decky-ocr-learner` folder into `/home/deck/homebrew/plugins/` and running:
  ```bash
  sudo systemctl restart plugin_loader
  ```

### 2. Configure Hotkey Permissions (Mandatory)
Because Decky Loader restricts plugin permissions and drops supplementary groups (like the `input` group), the backend needs system-level permissions to listen for physical button events.

Run the provided permission script as root on the Steam Deck:
```bash
cd /home/deck/homebrew/plugins/decky-ocr-learner
sudo bash setup_hotkey_permissions.sh
```
This adds the necessary `udev` rules and grants the `deck` user read/write access to input and hidraw events.

### 3. Initialize & Install Backend Engines
Once the plugin loads, open it in the QAM. Navigate to its settings:
- Click **Install Dependencies** (if prompted) to download Python Dependencies and the Japanese OCR models.
- Click **Learn Hotkey** and press the hardware button to map your trigger.
- **Import Yomichan Dictionary:** Load any standard Yomichan dictionary zip file from your Steam Deck's local storage.
