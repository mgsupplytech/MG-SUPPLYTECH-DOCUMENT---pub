#!/bin/bash
# ==============================================================================
#   MG SUPPLYTECH — COMMERCIAL DOCUMENT SUITE (MAC LOCAL LAUNCHER)
#   Double-click to start local offline server and launch in macOS browser
# ==============================================================================

cd "$(dirname "$0")"

echo ""
echo " ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo " ┃   MG SUPPLYTECH — LOCAL MAC COMMERCIAL DOCUMENT SUITE            ┃"
echo " ┃   Professional Quotations, Invoices & Offline Ledger on macOS   ┃"
echo " ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js was not found on your Mac."
    echo "👉 Please download Node.js LTS from https://nodejs.org"
    echo "   or install with Homebrew in Terminal: brew install node"
    echo ""
    open "https://nodejs.org"
    read -p "Press [Enter] after installing Node.js..."
fi

echo "🍏 Detected Node $(node -v) on macOS ($(uname -m))"

# Check GitHub for latest updates if git repository exists
if [ -d ".git" ]; then
    echo "🔄 Checking GitHub for latest updates..."
    # Attempt quick pull with 5s network timeout
    if git pull origin main --quiet 2>/dev/null; then
        echo "✅ Synchronized with latest GitHub version!"
    elif git pull --quiet 2>/dev/null; then
        echo "✅ Synchronized with latest GitHub version!"
    else
        echo "⚡ Running current local version."
    fi
fi

# Check if port 3000 is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚡ MG Supplytech is already running on http://localhost:3000"
    open "http://localhost:3000"
    exit 0
fi

# Check if node_modules exists, if not install
if [ ! -d "node_modules" ]; then
    echo "📦 Initializing local dependencies (first run only)..."
    npm install --legacy-peer-deps || npm install --force
fi

echo "🚀 Starting MG Supplytech on http://localhost:3000 ..."

# Start vite dev server in background
npm run dev &
SERVER_PID=$!

# Wait for server to initialize
sleep 2

# Open in default macOS browser (Safari / Chrome / Edge)
open "http://localhost:3000"

echo ""
echo "✨ MG Supplytech is active!"
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
