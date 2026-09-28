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
  echo "⚠️ Push failed due to authentication or missing privileges."
  echo "GitHub does not accept normal passwords for git push."
  echo ""
  echo "Would you like to authenticate using a GitHub Personal Access Token (PAT)?"
  read -p "Paste your GitHub Token (starts with ghp_...) or press [Enter] to cancel: " user_token

  if [ -n "$user_token" ]; then
    # Strip existing credentials and protocol from remote URL
    CLEAN_HOST_PATH=$(echo "$EXISTING_REMOTE" | sed -E 's|https://[^@]+@||' | sed -E 's|https://||' | sed -E 's|git@github.com:|github.com/|')
    AUTH_REMOTE="https://${user_token}@${CLEAN_HOST_PATH}"
    
    echo "🔑 Applying token to git remote..."
    git remote set-url origin "$AUTH_REMOTE"
    
    echo "🚀 Retrying push with token privileges..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
      echo ""
      echo "=========================================================="
      echo "🎉 SUCCESS: All updates pushed to GitHub with token!"
      echo "=========================================================="
    else
      echo "❌ Still failed. Please verify that your token has 'repo' privileges."
    fi
  else
    echo "To create a token:"
    echo "1. Go to: https://github.com/settings/tokens/new"
    echo "2. Check the 'repo' box"
    echo "3. Generate token and re-run this script"
  fi
fi

echo ""
read -p "Press [Enter] to close this window..."
