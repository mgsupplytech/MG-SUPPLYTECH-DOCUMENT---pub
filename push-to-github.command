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

echo ""
echo "Please enter your GitHub repository URL:"
echo "Example: https://github.com/your-username/mg-supplytech-document-maker.git"
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
  echo "⚠️ Push failed. If this is a private repo, make sure you are logged into GitHub via Git Credential Manager or Personal Access Token (PAT)."
fi

echo ""
echo "Press any key to close..."
read -n 1
