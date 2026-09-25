#!/bin/bash
# ==============================================================================
# MG SUPPLYTECH - 1-Click Direct GitHub Sync & Push for macOS
# Double-click this script from Finder or Mac Dock to push latest updates directly!
# ==============================================================================

cd "$(dirname "$0")"
clear

echo " ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo " ┃   MG SUPPLYTECH — 1-CLICK DIRECT GITHUB UPDATE PUSHER           ┃"
echo " ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

# Ensure git is initialized
if [ ! -d ".git" ]; then
  echo "📦 Initializing local Git repository..."
  git init -b main
  git config user.name "MG Supplytech"
  git config user.email "info@mgsupplytech.com"
fi

# Stage and commit all files
echo "📝 Staging latest changes..."
git add .

if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "✅ Working tree clean (all local changes already committed)."
else
  COMMIT_MSG="Direct update from MG Supplytech Commercial Suite - $(date +'%Y-%m-%d %H:%M:%S')"
  git commit -m "$COMMIT_MSG"
  echo "✅ Committed: $COMMIT_MSG"
fi

# Detect remote
EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$EXISTING_REMOTE" ]; then
  echo ""
  echo "Please enter your GitHub repository URL (first time setup):"
  echo "Example: https://github.com/shankeragencies/MG-SUPPLYTECH-DOCUMENT.git"
  read -p "Repo URL: " remote_url

  if [ -z "$remote_url" ]; then
    echo "❌ Repository URL cannot be empty."
    read -p "Press [Enter] to exit..."
    exit 1
  fi

  git remote add origin "$remote_url"
  EXISTING_REMOTE="$remote_url"
fi

echo ""
echo "🚀 Pushing directly to GitHub: $EXISTING_REMOTE"
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================================="
  echo "🎉 SUCCESS: All updates pushed to GitHub successfully!"
  echo "=========================================================="
else
  echo ""
  echo "⚠️ Push failed."
  echo "If GitHub requests a password, use your GitHub Personal Access Token (PAT)."
  echo "Or make sure your repo is set to Public on GitHub."
fi

echo ""
read -p "Press [Enter] to close this window..."
