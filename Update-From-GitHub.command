#!/bin/bash
# ==============================================================================
# MG SUPPLYTECH — 1-CLICK GITHUB UPDATER FOR MAC
# Double-click this file from Finder to download the latest updates from GitHub!
# No Terminal commands required.
# ==============================================================================

cd "$(dirname "$0")"
clear

echo ""
echo " ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo " ┃   MG SUPPLYTECH — 1-CLICK MAC GITHUB UPDATER                     ┃"
echo " ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

# Check for git
if ! command -v git &> /dev/null; then
    echo "⚠️  Git is required to pull updates."
    echo "👉 Install Git with Xcode command line tools or Homebrew."
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
    echo "🎉 SUCCESS: MG Supplytech is now running the latest version!"
    echo "   All updates from GitHub have been installed on your Mac."
    echo "=========================================================="
    
    # Check if app is running on port 3000, reload if active
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚡ Active local app detected. Re-opening in browser..."
        open "http://localhost:3000"
    fi
else
    echo ""
    echo "⚠️ Could not pull from GitHub automatically."
    echo "   Please check your internet connection or GitHub repository permissions."
fi

echo ""
read -p "Press [Enter] to close this window..."
