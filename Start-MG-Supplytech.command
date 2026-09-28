#!/bin/bash
# ==============================================================================
#   MG SUPPLYTECH — COMMERCIAL DOCUMENT SUITE (MAC LOCAL LAUNCHER)
#   Double-click to start local offline server and launch in macOS browser
# ==============================================================================

cd "$(dirname "$0")"

# Ensure all Mac Node/npm paths are available (Homebrew on Apple Silicon/Intel, NVM, Volta, fnm)
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$HOME/.fnm/current/bin:$HOME/.volta/bin:$PATH"

clear
echo ""
echo " ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo " ┃   MG SUPPLYTECH — LOCAL MAC COMMERCIAL DOCUMENT SUITE            ┃"
echo " ┃   Professional Quotations, Invoices & Offline Ledger on macOS   ┃"
echo " ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js was not found in standard Mac paths."
    echo "👉 Please download Node.js LTS from https://nodejs.org"
    echo "   or install with Homebrew: brew install node"
    echo ""
    open "https://nodejs.org"
    read -p "Press [Enter] after installing Node.js..."
fi

echo "🍏 Detected Node $(node -v) on macOS ($(uname -m))"

# Check GitHub for latest updates if git repository exists
if [ -d ".git" ]; then
    echo "🔄 Checking GitHub for latest updates..."
    if git pull origin main --quiet 2>/dev/null; then
        echo "✅ Synchronized with latest GitHub version!"
    elif git pull --quiet 2>/dev/null; then
        echo "✅ Synchronized with latest GitHub version!"
    else
        echo "⚡ Running current local version."
    fi
fi

# Check if port 3000 is occupied
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    # Test if it's ACTUALLY serving our app
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 2 http://localhost:3000 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        echo "⚡ MG Supplytech server is already running and healthy on http://localhost:3000"
        open "http://localhost:3000"
        exit 0
    else
        echo "🧹 Clearing non-responsive process on port 3000..."
        kill -9 $(lsof -ti :3000 2>/dev/null) 2>/dev/null || true
        sleep 1
    fi
fi

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Initializing local dependencies (first run only)..."
    npm install --legacy-peer-deps || npm install --force
fi

echo "🚀 Starting MG Supplytech server on http://localhost:3000 ..."

# Start vite dev server in background and pipe to log file
npm run dev > /tmp/mg-supplytech-server.log 2>&1 &
SERVER_PID=$!

# Wait for server to actually respond with HTTP 200 (up to 15 seconds)
echo "⏳ Waiting for server to be ready..."
READY=0
for i in {1..30}; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 1 http://localhost:3000 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
        READY=1
        break
    fi
    sleep 0.5
done

if [ "$READY" -eq 1 ]; then
    echo "✅ MG Supplytech is active and verified at http://localhost:3000"
    open "http://localhost:3000"
else
    echo "⚠️ Server is taking a few moments. Opening browser now..."
    cat /tmp/mg-supplytech-server.log | tail -n 10
    open "http://localhost:3000"
fi

echo ""
echo "✨ MG Supplytech is running!"
echo "   URL: http://localhost:3000"
echo ""
echo "💡 PRO-TIP FOR MAC:"
echo "   In Safari (macOS Sonoma / Sequoia): Click 'File' > 'Add to Dock'"
echo "   In Google Chrome: Click the 'Install' icon in the address bar."
echo "   This creates a permanent standalone native Mac app icon in your Dock!"
echo ""
echo "🛑 Press [Ctrl + C] in this window to stop the local Mac server."
echo "=================================================================="

wait $SERVER_PID
