#!/bin/bash
# ==============================================================================
# MG SUPPLYTECH - Mac 1-Click Double-Clickable GitHub Pusher
# Repository Name: mg-supplytech-document-maker
# ==============================================================================

cd "$(dirname "$0")"

clear
echo "=========================================================="
echo "  MG SUPPLYTECH — PUSH TO GITHUB (macOS)"
echo "  Project: mg-supplytech-document-maker"
echo "=========================================================="
echo ""

# Ensure git is initialized
if [ ! -d ".git" ]; then
  echo "📦 Initializing local Git repository..."
  git init -b main
  git config user.name "MG Supplytech"
  git config user.email "info@mgsupplytech.com"
fi

# Stage and commit all updates
echo "📝 Staging latest changes..."
git add .
if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "✅ Working tree clean (all changes committed)."
else
  git commit -m "Update MG Supplytech Document Maker - $(date +'%Y-%m-%d %H:%M:%S')"
  echo "✅ Committed latest updates."
fi

# Detect existing remote URL
EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ -n "$EXISTING_REMOTE" ]; then
  echo "📡 Using existing GitHub remote:"
  echo "   $EXISTING_REMOTE"
  remote_url="$EXISTING_REMOTE"
else
  echo ""
  echo "Please enter your GitHub repository URL (first time only):"
  echo "Example: https://github.com/shankeragencies/MG-SUPPLYTECH-DOCUMENT.git"
  echo ""
  read -p "GitHub URL: " remote_url

  if [ -z "$remote_url" ]; then
    echo "❌ Repository URL cannot be empty."
    echo "Press any key to exit..."
    read -n 1
    exit 1
  fi

  git remote remove origin 2>/dev/null || true
  git remote add origin "$remote_url"
fi

git branch -M main

echo ""
echo "🚀 Pushing to GitHub (main branch)..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================================="
  echo "🎉 SUCCESS: Project successfully pushed to GitHub!"
  echo "Repository: $remote_url"
  echo "=========================================================="
else
  echo ""
  echo "⚠️ Push failed due to authentication or missing privileges."
  echo "GitHub does not accept normal passwords for git push."
  echo ""
  echo "Would you like to authenticate using a GitHub Personal Access Token (PAT)?"
  read -p "Paste your GitHub Token (starts with ghp_...) or press [Enter] to cancel: " user_token

  if [ -n "$user_token" ]; then
    CLEAN_HOST_PATH=$(echo "$remote_url" | sed -E 's|https://[^@]+@||' | sed -E 's|https://||' | sed -E 's|git@github.com:|github.com/|')
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
echo "Press any key to close..."
read -n 1
