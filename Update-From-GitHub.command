#!/bin/bash
# ==============================================================================
# MG SUPPLYTECH — 1-CLICK GITHUB UPDATER & SERVER RESTART FOR MAC
# Double-click this file from Finder to download the latest updates from GitHub
# and start/reload your local Mac server immediately!
# ==============================================================================

cd "$(dirname "$0")"

# Ensure all Mac Node/npm paths are available (Homebrew, NVM, Volta, fnm)
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls -1 $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$HOME/.fnm/current/bin:$HOME/.volta/bin:$PATH"

clear
echo ""
echo " ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo " ┃   MG SUPPLYTECH — 1-CLICK MAC GITHUB UPDATER                     ┃"
echo " ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

# Check for git
if ! command -v git &> /dev/null; then
    echo "⚠️  Git is required to pull updates."
    echo "👉 Please install Xcode command line tools or Homebrew."
    read -p "Press [Enter] to exit..."
    exit 1
fi

if [ ! -d ".git" ]; then
    echo "⚠️ This directory is not yet linked to a Git repository."
    echo "👉 Please run 'Push-Updates-Directly.command' first to link with GitHub."
    echo ""
    read -p "Press [Enter] to exit..."
    exit 1
fi

echo "🔍 Checking connection to GitHub..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo "⚠️ No GitHub remote 'origin' found."
    read -p "Press [Enter] to exit..."
    exit 1
fi

echo "📡 Connected repository: $REMOTE_URL"
echo ""
echo "⬇️ Pulling latest changes from GitHub (main branch)..."

# Stash any local temporary changes so pull never conflicts
git stash --quiet 2>/dev/null || true

# Pull latest commits
if git pull origin main; then
    echo ""
    echo "📦 Checking if dependencies need updating..."
    if [ -f "package.json" ]; then
        npm install --legacy-peer-deps --silent 2>/dev/null || true
    fi
    echo ""
    echo "=========================================================="
    echo "🎉 SUCCESS: All updates from GitHub have been installed!"
    echo "=========================================================="
    echo ""
    
    echo "🔄 Refreshing local server on http://localhost:3000 ..."
    # Kill any stale or unresponsive process on port 3000
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        kill -9 $(lsof -ti :3000 2>/dev/null) 2>/dev/null || true
        sleep 1
    fi

    # Start server in background
    npm run dev > /tmp/mg-supplytech-server.log 2>&1 &
    
    # Wait for server to respond with HTTP 200
    echo "⏳ Waiting for app to initialize..."
    READY=0
    for i in {1..20}; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 1 http://localhost:3000 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
            READY=1
            break
        fi
        sleep 0.5
    done

    echo "⚡ Opening updated app in browser..."
    open "http://localhost:3000"
else
    echo ""
    echo "⚠️ Could not pull from GitHub automatically."
    echo "   Please check your internet connection or repository permissions."
fi

echo ""
read -p "Press [Enter] to close this window..."
