const { execSync } = require('child_process');
const path = require('path');

// Get IP from command line args
const deckIp = process.argv[2];

if (!deckIp) {
  console.error("Error: Please provide your Steam Deck's IP address.");
  console.log("Usage: node deploy.js <DECK_IP>");
  console.log("Example: node deploy.js 192.168.1.125");
  process.exit(1);
}

const targetPath = `/home/deck/homebrew/plugins/decky-ocr-learner`;

try {
  console.log("1. Building frontend...");
  execSync("npm.cmd run build", { stdio: "inherit" });

  console.log(`\n2. Copying files to Steam Deck (${deckIp})...`);
  // Create a temporary staging directory on the Steam Deck where deck user has write access
  execSync(`ssh deck@${deckIp} "rm -rf /tmp/decky-ocr-learner && mkdir -p /tmp/decky-ocr-learner"`, { stdio: "inherit" });
  // Copy dist folder, main.py, and plugin.json via SCP to staging directory
  execSync(`scp -r dist plugin.json main.py deck@${deckIp}:/tmp/decky-ocr-learner/`, { stdio: "inherit" });

  console.log("\n3. Moving files to plugin directory and restarting Decky Loader...");
  // Clean target directory, move staged folder to plugins directory, set root:root ownership, and restart plugin_loader service
  execSync(`ssh -t deck@${deckIp} "sudo rm -rf ${targetPath} && sudo mv /tmp/decky-ocr-learner ${targetPath} && sudo chown -R root:root ${targetPath} && sudo chmod -R a+rX ${targetPath} && sudo mkdir -p ${targetPath}/libs && sudo chown -R deck:deck ${targetPath}/libs && sudo systemctl restart plugin_loader"`, { stdio: "inherit" });

  console.log("\n[SUCCESS] Build deployed and Decky Loader restarted successfully!");
} catch (err) {
  console.error("\n[ERROR] Deployment failed! Make sure:");
  console.error(" - Your Steam Deck and PC are on the same Wi-Fi network.");
  console.error(" - SSH is enabled on the Deck (sudo systemctl enable --now sshd).");
  console.error(" - You entered the correct IP address.");
  process.exit(1);
}
