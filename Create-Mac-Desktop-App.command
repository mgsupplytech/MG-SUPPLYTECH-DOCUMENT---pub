#!/bin/bash
# ==============================================================================
# MG SUPPLYTECH — CREATE STANDALONE MAC DESKTOP APP (NO TERMINAL REQUIRED)
# Double-click this file once to create "MG Supplytech.app" on your Mac Desktop.
# After this, you just click the Desktop icon to run, auto-update & launch!
# ==============================================================================

cd "$(dirname "$0")"
PROJECT_DIR="$(pwd)"
DESKTOP_DIR="$HOME/Desktop"
APP_NAME="MG Supplytech.app"
TARGET_APP="$DESKTOP_DIR/$APP_NAME"

clear
echo ""
echo " ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo " ┃   MG SUPPLYTECH — MAC DESKTOP APP GENERATOR                      ┃"
echo " ┃   Creates 1-click Desktop App with Auto-Updates & Zero Terminal  ┃"
echo " ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

echo "🔨 Building native macOS application bundle on your Desktop..."

# Remove old version if present
rm -rf "$TARGET_APP"

# Create macOS .app directory structure
mkdir -p "$TARGET_APP/Contents/MacOS"
mkdir -p "$TARGET_APP/Contents/Resources"

# Create the background launcher script (strictly runs headless - NO Terminal window)
cat << 'EOF' > "$TARGET_APP/Contents/MacOS/launcher"
#!/bin/bash
DIR_PLACEHOLDER

cd "$APP_DIR"

# Ensure all Mac Node/npm paths are available in background headless context
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$HOME/.fnm/current/bin:$HOME/.volta/bin:$PATH"

# 1. Silently pull latest updates from GitHub if connected
if [ -d ".git" ]; then
    git pull origin main --quiet 2>/dev/null || git pull --quiet 2>/dev/null || true
fi

# 2. Check if port 3000 is occupied
IS_ALIVE=0
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 1 http://localhost:3000 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        IS_ALIVE=1
    else
        # Stale or dead process on port 3000 - kill it
        kill -9 $(lsof -ti :3000 2>/dev/null) 2>/dev/null || true
        sleep 1
    fi
fi

# 3. If server is not alive, start it
if [ "$IS_ALIVE" -eq 0 ]; then
    nohup npm run dev > /tmp/mg-supplytech-server.log 2>&1 &
    
    # Wait for server to respond (up to 12 seconds)
    for i in {1..24}; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 1 http://localhost:3000 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
            break
        fi
        sleep 0.5
    done
fi

# 4. Open in default browser or PWA window
open "http://localhost:3000"

# 5. Subtle macOS banner notification
osascript -e 'display notification "MG Supplytech is running on http://localhost:3000" with title "MG Supplytech" subtitle "Commercial Document Suite"' 2>/dev/null || true

exit 0
EOF

# Inject real project directory into launcher
sed -i '' "s|DIR_PLACEHOLDER|APP_DIR=\"$PROJECT_DIR\"|g" "$TARGET_APP/Contents/MacOS/launcher" 2>/dev/null || \
sed -i "s|DIR_PLACEHOLDER|APP_DIR=\"$PROJECT_DIR\"|g" "$TARGET_APP/Contents/MacOS/launcher"

chmod +x "$TARGET_APP/Contents/MacOS/launcher"

# Create Info.plist
cat << 'EOF' > "$TARGET_APP/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIconFile</key>
    <string>appIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.mgsupplytech.documentsuite</string>
    <key>CFBundleName</key>
    <string>MG Supplytech</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF

# Generate high-resolution macOS .icns icon from public/pwa-512x512.png
if [ -f "public/pwa-512x512.png" ]; then
    ICONSET_DIR="/tmp/mg_icon.iconset"
    rm -rf "$ICONSET_DIR"
    mkdir -p "$ICONSET_DIR"
    
    sips -z 16 16     public/pwa-512x512.png --out "$ICONSET_DIR/icon_16x16.png" >/dev/null 2>&1
    sips -z 32 32     public/pwa-512x512.png --out "$ICONSET_DIR/icon_16x16@2x.png" >/dev/null 2>&1
    sips -z 32 32     public/pwa-512x512.png --out "$ICONSET_DIR/icon_32x32.png" >/dev/null 2>&1
    sips -z 64 64     public/pwa-512x512.png --out "$ICONSET_DIR/icon_32x32@2x.png" >/dev/null 2>&1
    sips -z 128 128   public/pwa-512x512.png --out "$ICONSET_DIR/icon_128x128.png" >/dev/null 2>&1
    sips -z 256 256   public/pwa-512x512.png --out "$ICONSET_DIR/icon_128x128@2x.png" >/dev/null 2>&1
    sips -z 256 256   public/pwa-512x512.png --out "$ICONSET_DIR/icon_256x256.png" >/dev/null 2>&1
    sips -z 512 512   public/pwa-512x512.png --out "$ICONSET_DIR/icon_256x256@2x.png" >/dev/null 2>&1
    sips -z 512 512   public/pwa-512x512.png --out "$ICONSET_DIR/icon_512x512.png" >/dev/null 2>&1

    if command -v iconutil &> /dev/null; then
        iconutil -c icns "$ICONSET_DIR" -o "$TARGET_APP/Contents/Resources/appIcon.icns" >/dev/null 2>&1
    fi
    rm -rf "$ICONSET_DIR"
fi

# Touch to refresh macOS Finder icon cache
touch "$TARGET_APP"

echo ""
echo "=================================================================="
echo "🎉 SUCCESS: 'MG Supplytech' is now on your Desktop!"
echo "   Path: $TARGET_APP"
echo "=================================================================="
echo ""
echo "👉 How to use it:"
echo "   1. Look on your Mac Desktop for the 'MG Supplytech' icon."
echo "   2. Double-click it anytime to launch."
echo "   3. It will automatically:"
echo "      • Pull latest updates from GitHub in the background"
echo "      • Clear any stale port block and start the server"
echo "      • Verify the server is running before opening your browser"
echo ""
echo "💡 PRO-TIP: You can drag 'MG Supplytech' from your Desktop into your Mac Dock"
echo "            to keep it pinned just like Excel or Word!"
echo ""
read -p "Press [Enter] to finish..."
