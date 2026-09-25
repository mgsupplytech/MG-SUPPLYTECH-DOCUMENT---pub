import JSZip from 'jszip';

export async function generateMacPackageZip(): Promise<Blob> {
  const zip = new JSZip();

  const folder = zip.folder('MG-Supplytech-Mac-Local');
  if (!folder) throw new Error('Could not create zip folder');

  // 1. Executable macOS Launcher script
  const launcherScript = `#!/bin/bash
# ==========================================================
#   MG SUPPLYTECH — COMMERCIAL DOCUMENT SUITE (MAC LOCAL)
# ==========================================================

cd "$(dirname "$0")"

echo ""
echo " ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓"
echo " ┃   MG SUPPLYTECH — LOCAL MAC COMMERCIAL SUITE        ┃"
echo " ┃   Quotation & Invoice Studio • Offline Persistence  ┃"
echo " ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "⚠️  Node.js was not detected on your Mac."
  echo "👉 Please install Node.js (LTS version) from https://nodejs.org"
  echo "   or run: brew install node"
  echo ""
  open "https://nodejs.org"
  read -p "Press [Enter] to exit..."
  exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "🚀 Starting local offline server on http://localhost:3000 ..."

# Start local server in background
node server.js &
PID=$!

# Wait 1.5 seconds for server boot
sleep 1.5

# Open default browser (Safari / Chrome)
open "http://localhost:3000"

echo ""
echo "✨ MG Supplytech is now running locally on your Mac!"
echo "   URL: http://localhost:3000"
echo ""
echo "💡 TIP: In Safari, click 'File' > 'Add to Dock' to create a permanent native Mac app icon!"
echo "   In Chrome, click 'Install MG Supplytech' from the address bar."
echo ""
echo "🛑 To stop the local server, press [Ctrl + C] or close this Terminal window."
echo "=========================================================="

wait $PID
`;

  folder.file('Start-MG-Supplytech.command', launcherScript);

  // 2. Self-contained Node HTTP Server (Zero-dependency, works directly with built assets)
  const serverCode = `/**
 * MG Supplytech Local Mac Server
 * High performance local HTTP server for offline commercial document generation
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let cleanUrl = req.url.split('?')[0];
  if (cleanUrl === '/') cleanUrl = '/index.html';

  let filePath = path.join(PUBLIC_DIR, cleanUrl);

  // Fallback to index.html for SPA routing
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading ' + cleanUrl);
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000'
    });
    res.end(content);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('MG Supplytech Local Server running at http://localhost:' + PORT);
});
`;

  folder.file('server.js', serverCode);

  // 3. Simple package.json for npm users
  const packageJson = {
    name: 'mg-supplytech-mac',
    version: '2.5.0',
    description: 'MG Supplytech Commercial Document Studio - Mac Local Edition',
    main: 'server.js',
    scripts: {
      start: 'node server.js',
      app: 'open http://localhost:3000 && node server.js'
    }
  };
  folder.file('package.json', JSON.stringify(packageJson, null, 2));

  // 4. Instructions Markdown
  const readmeMd = `# MG Supplytech — Local Mac Installation Guide

Welcome to the standalone local Mac distribution of **MG Supplytech Commercial Document Suite**.

---

## ⚡ Method 1: 1-Click Double-Click Launcher (Easiest)

1. Extract this zip folder to your Mac (e.g. \`Documents/MG-Supplytech\` or \`Applications\`).
2. Make the launcher executable (First time only):
   - Open **Terminal** on your Mac.
   - Run:
     \`\`\`bash
     chmod +x "/path/to/MG-Supplytech-Mac-Local/Start-MG-Supplytech.command"
     \`\`\`
3. Double-click **\`Start-MG-Supplytech.command\`**.
4. The application automatically starts on \`http://localhost:3000\` and opens in your browser!

---

## 🍏 Method 2: Turn into a Permanent macOS Native App in your Dock

Once the app opens in your browser on your Mac:

### In Safari (macOS Sonoma, Sequoia, or later):
1. In the top macOS menu bar, click **File** > **Add to Dock**.
2. Click **Add**.
3. **MG Supplytech** is now a full standalone macOS app in your Mac's Dock and Applications folder, with its own window, Cmd+Tab app switcher tile, and offline support!

### In Google Chrome / Brave / Microsoft Edge:
1. Look at the right side of the address bar for the **Install** icon (desktop with arrow down), or click **...** > **Save and Share** > **Install MG Supplytech**.
2. Click **Install**.
3. It creates \`MG Supplytech.app\` inside your Mac's Applications directory!

---

## 💻 Method 3: Run via Node in Terminal

If you prefer terminal commands:
\`\`\`bash
cd /path/to/MG-Supplytech-Mac-Local
npm start
\`\`\`
Then visit \`http://localhost:3000\`.

---

## 🛡️ Data Storage & Offline Persistence
All your invoices, quotations, customer records, inventory items, and custom company logos are saved locally on your Mac using browser **IndexedDB and LocalStorage**. No cloud account is required for full offline operation!
`;

  folder.file('README-MAC-INSTALL.md', readmeMd);

  // 5. Build minimal public folder HTML bundle with offline fallback
  const publicFolder = folder.folder('public');
  if (publicFolder) {
    // Copy the current page HTML or fallback
    const htmlContent = document.documentElement.outerHTML || '<!DOCTYPE html><html><body><h1>MG Supplytech</h1></body></html>';
    publicFolder.file('index.html', htmlContent);

    // Add instructions file in public
    publicFolder.file('app-info.json', JSON.stringify({
      app: 'MG Supplytech Commercial Document Suite',
      platform: 'macOS Local Bundle',
      exportedAt: new Date().toISOString(),
      version: '2.5.0'
    }, null, 2));
  }

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
