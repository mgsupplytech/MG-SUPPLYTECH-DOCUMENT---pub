#!/bin/bash
# ==============================================================================
# MG SUPPLYTECH - Git Push Helper to GitHub
# Repository Name: mg-supplytech-document-maker
# ==============================================================================

set -e

echo "=========================================================="
echo "  MG SUPPLYTECH DOCUMENT MAKER — GITHUB PUSH HELPER"
echo "=========================================================="
echo ""

REPO_NAME="mg-supplytech-document-maker"
DEFAULT_ORG="MG Supplytech"

# Ensure git is initialized
if [ ! -d ".git" ]; then
  echo "📦 Initializing local Git repository..."
  git init -b main
  git config user.name "MG Supplytech"
  git config user.email "info@mgsupplytech.com"
fi

# Stage and commit all updates
echo "📝 Checking local files and changes..."
git add .
if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "✅ Working tree clean (all changes already committed)."
else
  git commit -m "Update MG Supplytech Document Maker - $(date +'%Y-%m-%d %H:%M:%S')"
  echo "✅ Committed latest workspace state."
fi

echo ""
echo "----------------------------------------------------------"
echo "How would you like to push to GitHub?"
echo "----------------------------------------------------------"
echo "1) Enter GitHub Repository URL (HTTPS or SSH)"
echo "2) Use GitHub CLI ('gh repo create')"
echo "3) Print manual commands to copy-paste"
echo "----------------------------------------------------------"
read -p "Select option (1, 2, or 3) [default: 1]: " choice
choice=${choice:-1}

if [ "$choice" = "1" ]; then
  echo ""
  read -p "Enter your GitHub Repo URL (e.g., https://github.com/YOUR_USER/$REPO_NAME.git): " remote_url
  if [ -z "$remote_url" ]; then
    echo "❌ Error: Repository URL cannot be empty."
    exit 1
  fi

  git remote remove origin 2>/dev/null || true
  git remote add origin "$remote_url"
  git branch -M main
  echo "🚀 Pushing to $remote_url..."
  git push -u origin main
  echo ""
  echo "🎉 SUCCESS: Successfully pushed to GitHub!"
  echo "URL: $remote_url"

elif [ "$choice" = "2" ]; then
  if command -v gh &> /dev/null; then
    echo "🚀 Creating repository with GitHub CLI..."
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
    echo "🎉 SUCCESS: Repository created and pushed!"
  else
    echo "❌ GitHub CLI ('gh') is not installed. Please install 'gh' via 'brew install gh' or use Option 1."
    exit 1
  fi

else
  echo ""
  echo "📋 Run these commands in your Mac terminal inside this folder:"
  echo ""
  echo "  git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
  echo "  git branch -M main"
  echo "  git push -u origin main"
  echo ""
fi
