#!/bin/bash
# One-time setup: grant the deck user (and plugin_loader service) access to
# input devices needed for OCR Learner hardware hotkey.
set -e

echo "=== OCR Learner: Hotkey Permission Setup ==="

# 1. Add deck to input group (gives access to event5, event14, etc.)
echo "[1/3] Adding deck user to input group..."
usermod -a -G input deck
echo "    Done."

# 2. Create udev rule so the Legion joystick (event8) is accessible by
#    the input group, and grant the deck user direct read/write access via ACLs
#    since Decky Loader drops the deck user's supplementary groups.
echo "[2/3] Creating udev rule for Legion Controller joystick & event ACLs..."
cat > /etc/udev/rules.d/99-ocr-learner-hotkey.rules << 'EOF'
# Allow input group to read Legion joystick events (for OCR Learner hotkey)
SUBSYSTEM=="input", ATTRS{idVendor}=="17ef", ATTRS{idProduct}=="6182", \
    ENV{ID_INPUT_JOYSTICK}=="1", \
    MODE="0664", GROUP="input"
# Allow input group access to Ideapad extra buttons (Legion L/R hardware buttons)
SUBSYSTEM=="input", ENV{ID_PATH}=="platform-VPC2004:00-event", \
    MODE="0664", GROUP="input"

# Grant deck user (UID 1000) read/write access to all input event devices via ACL
# because Decky Loader drops supplementary groups (like input) when launching plugins
KERNEL=="event*", RUN+="/usr/bin/setfacl -m u:deck:rw /dev/input/%k"
# Grant deck user (UID 1000) read/write access to all hidraw devices via ACL
KERNEL=="hidraw*", RUN+="/usr/bin/setfacl -m u:deck:rw /dev/%k"
EOF
echo "    Written to /etc/udev/rules.d/99-ocr-learner-hotkey.rules"

# 3. Reload udev rules, apply ACLs, and restart plugin_loader
echo "[3/3] Reloading udev rules, applying ACLs, and restarting plugin_loader..."
udevadm control --reload-rules
udevadm trigger --subsystem-match=input
udevadm trigger --subsystem-match=hidraw
# Apply ACL immediately to all existing event and hidraw devices so they are accessible without reboot/replug
setfacl -m u:deck:rw /dev/input/event*
setfacl -m u:deck:rw /dev/hidraw*
systemctl restart plugin_loader
echo "    Done."

echo ""
echo "=== Setup complete! ==="
