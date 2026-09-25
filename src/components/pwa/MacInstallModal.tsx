import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  ExternalLink,
  Laptop,
  FolderDown,
  Sparkles,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { generateMacPackageZip, downloadBlob } from '../../utils/macPackaging';

interface MacInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MacInstallModal: React.FC<MacInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isMac, isSafari, isChrome, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'download' | 'terminal' | 'dmg'>('pwa');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isPackaging, setIsPackaging] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsPackaging(true);
      const zipBlob = await generateMacPackageZip();
      downloadBlob(zipBlob, 'MG-Supplytech-Mac-Local.zip');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to generate Mac package zip:', err);
    } finally {
      setIsPackaging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#0f1a18] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-[#203631] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#00241E] via-[#003A30] to-[#014136] text-white px-6 py-4 flex items-center justify-between border-b border-[#DFBC64]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DFBC64]/15 border border-[#DFBC64]/40 flex items-center justify-center text-[#DFBC64] shadow-inner">
              {/* Apple icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.79-11.97-14.24-6.43-9.79-11.45-20.73-15.06-32.81-3.61-12.09-5.42-23.77-5.42-35.04 0-14.89 3.82-27.26 11.45-37.1 7.64-9.84 17.15-14.86 28.53-15.06 4.9.11 10.23 1.34 16 3.7 5.77 2.36 9.57 3.6 11.4 3.73 2.53-.13 6.44-1.42 11.75-3.87 5.3-2.45 10.37-3.63 15.2-3.56 12.09.65 21.84 5.39 29.25 14.21-10.78 6.53-16.06 15.54-15.84 27.02.22 9.03 3.63 16.64 10.23 22.84 6.6 6.2 14.53 9.79 23.8 10.77-2.39 7.08-5.18 14.07-8.37 20.97zM119.22 31.84c0-7.39 2.65-14.38 7.95-20.97 5.3-6.59 11.9-10.87 19.8-12.83.22 1.3.33 2.45.33 3.44 0 7.39-2.73 14.51-8.19 21.36-5.46 6.85-12.08 11.12-19.89 12.82v-3.82z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Package & Install on macOS</h3>
                <span className="text-[10px] bg-[#DFBC64]/25 text-[#DFBC64] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#DFBC64]/40">
                  Mac Ready
                </span>
              </div>
              <p className="text-xs text-white/70">
                Run natively in your Mac Dock, Applications, or local offline server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#203631] bg-slate-50 dark:bg-[#12201d] px-4 pt-2 gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'border-[#014136] dark:border-[#DFBC64] text-[#014136] dark:text-[#DFBC64]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            1-Click Mac App (Dock & Applications)
          </button>

          <button
            onClick={() => setActiveTab('download')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'download'
                ? 'border-[#014136] dark:border-[#DFBC64] text-[#014136] dark:text-[#DFBC64]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FolderDown className="w-3.5 h-3.5" />
            Offline Zip Bundle (.command)
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'terminal'
                ? 'border-[#014136] dark:border-[#DFBC64] text-[#014136] dark:text-[#DFBC64]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Terminal / Node CLI
          </button>

          <button
            onClick={() => setActiveTab('dmg')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dmg'
                ? 'border-[#014136] dark:border-[#DFBC64] text-[#014136] dark:text-[#DFBC64]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Native DMG / Electron
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* TAB 1: 1-Click Mac Native PWA */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="font-bold text-sm">How Method 1 Works (No File Download Needed!)</div>
                  For <b>Method 1</b>, you do <b>not</b> need to download an installer file from the web. Instead, macOS converts this live application directly into a native <b>.app</b> in your <b>Dock & Applications</b> with full offline storage!
                </div>
              </div>

              {/* Direct Link to Open on Mac */}
              <div className="p-4 bg-slate-50 dark:bg-[#12201d] border border-slate-200 dark:border-[#203631] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#014136] dark:text-[#DFBC64] uppercase tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open this URL on your Mac in Safari or Chrome:
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Click to copy or open</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value="https://ais-pre-knb2dcnhse3qphknzrnd47-525939218479.asia-southeast1.run.app"
                    className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard('https://ais-pre-knb2dcnhse3qphknzrnd47-525939218479.asia-southeast1.run.app', 99)}
                    className="px-3 py-2 bg-[#014136] hover:bg-[#003028] text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 transition"
                    title="Copy URL to clipboard"
                  >
                    {copiedIndex === 99 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === 99 ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <a
                    href="https://ais-pre-knb2dcnhse3qphknzrnd47-525939218479.asia-southeast1.run.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white rounded-lg text-xs font-bold shrink-0 transition"
                    title="Open in new window"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Install trigger if Chromium beforeinstallprompt is ready */}
              {isInstallable && (
                <div className="p-4 bg-gradient-to-r from-[#003A30] to-[#014136] text-white rounded-xl shadow-md flex items-center justify-between">
                  <div>
                    <div className="font-bold text-base flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#DFBC64]" />
                      Ready to Install on this Mac
                    </div>
                    <div className="text-xs text-white/80 mt-0.5">
                      Click below to add MG Supplytech to your Mac Applications & Dock.
                    </div>
                  </div>
                  <button
                    onClick={install}
                    className="px-4 py-2 bg-[#DFBC64] hover:bg-[#c9a64f] text-[#00241E] font-bold text-xs rounded-lg transition shadow-md flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Install App Now
                  </button>
                </div>
              )}

              {/* Step-by-step for Safari vs Chrome */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Safari on Mac */}
                <div className="border border-slate-200 dark:border-[#203631] rounded-xl p-4 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2 font-bold text-[#014136] dark:text-[#DFBC64] mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#014136] text-white flex items-center justify-center text-xs">1</span>
                    Safari on macOS (Sonoma / Sequoia)
                  </div>
                  <ol className="text-xs space-y-2 text-slate-700 dark:text-slate-300 list-decimal list-inside pl-1 leading-relaxed">
                    <li>In the top Mac menu bar, click <b className="text-[#014136] dark:text-[#DFBC64]">File</b>.</li>
                    <li>Select <b className="text-[#014136] dark:text-[#DFBC64]">Add to Dock...</b> (or Add to Applications).</li>
                    <li>Confirm the name <b>MG Supplytech</b> and click <b>Add</b>.</li>
                    <li>The app now appears on your Mac Dock and inside <code className="bg-slate-200 dark:bg-black/40 px-1 py-0.5 rounded font-mono">~/Applications</code>!</li>
                  </ol>
                </div>

                {/* Chrome / Edge on Mac */}
                <div className="border border-slate-200 dark:border-[#203631] rounded-xl p-4 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-2 font-bold text-[#014136] dark:text-[#DFBC64] mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#014136] text-white flex items-center justify-center text-xs">2</span>
                    Google Chrome / Brave / Edge
                  </div>
                  <ol className="text-xs space-y-2 text-slate-700 dark:text-slate-300 list-decimal list-inside pl-1 leading-relaxed">
                    <li>Look at the right side of the address bar for the <b className="text-[#014136] dark:text-[#DFBC64]">Install icon ⊕</b>.</li>
                    <li>Or click the top-right <b className="text-[#014136] dark:text-[#DFBC64]">⋮</b> menu &gt; <b>Save and Share</b> &gt; <b>Install MG Supplytech</b>.</li>
                    <li>Click <b>Install</b> in the confirmation dialog.</li>
                    <li>A native macOS window opens with its own Dock icon!</li>
                  </ol>
                </div>
              </div>

              {/* Standalone status indicator */}
              {isInstalled && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  MG Supplytech is already running as an installed standalone Mac application!
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Download Standalone Mac Zip Bundle */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-[#203631] rounded-xl">
                <div className="flex items-center gap-2 font-bold text-sm text-[#014136] dark:text-[#DFBC64] mb-1">
                  <FolderDown className="w-4 h-4" />
                  Pre-Packaged Offline Mac Bundle (.zip)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Download a pre-packaged bundle containing a double-clickable <code className="bg-slate-200 dark:bg-black/40 px-1 py-0.5 rounded font-mono font-bold">Start-MG-Supplytech.command</code> script, zero-configuration local server, and full offline documentation.
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isPackaging}
                    className="px-5 py-2.5 bg-[#014136] hover:bg-[#003028] text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-[#DFBC64]" />
                    {isPackaging ? 'Generating Mac Bundle...' : 'Download Mac Package (.zip)'}
                  </button>
                  {downloadSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" /> Downloaded successfully!
                    </span>
                  )}
                </div>
              </div>

              {/* How to use the downloaded zip on Mac */}
              <div className="border border-slate-200 dark:border-[#203631] rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#65716D]">How to run on Mac after downloading:</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                    <span>Extract <b>MG-Supplytech-Mac-Local.zip</b> on your Mac (in Documents or Desktop).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                    <div>
                      <span>Make the launcher executable in Terminal (one-time step):</span>
                      <div className="mt-1.5 flex items-center justify-between bg-slate-900 text-slate-100 font-mono text-[11px] p-2.5 rounded-lg">
                        <code>chmod +x ~/Downloads/MG-Supplytech-Mac-Local/Start-MG-Supplytech.command</code>
                        <button
                          onClick={() => copyToClipboard('chmod +x ~/Downloads/MG-Supplytech-Mac-Local/Start-MG-Supplytech.command', 1)}
                          className="p-1 hover:text-[#DFBC64] transition"
                          title="Copy command"
                        >
                          {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                    <span>Double-click <b>Start-MG-Supplytech.command</b> in Finder. The app starts on your Mac instantly!</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Terminal / Node Quickstart */}
          {activeTab === 'terminal' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                To run the full development or production server locally on macOS via Terminal:
              </p>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-bold text-[#014136] dark:text-[#DFBC64] mb-1">
                    Option 1: Quick Local Dev Server (Port 3000)
                  </div>
                  <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl flex items-center justify-between border border-slate-800">
                    <div>
                      <div>npm install</div>
                      <div>npm run dev</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard('npm install && npm run dev', 2)}
                      className="p-2 text-slate-400 hover:text-white transition"
                      title="Copy"
                    >
                      {copiedIndex === 2 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-[#014136] dark:text-[#DFBC64] mb-1">
                    Option 2: Optimized Production Build & Preview
                  </div>
                  <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl flex items-center justify-between border border-slate-800">
                    <div>
                      <div>npm run build</div>
                      <div>npm run preview</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard('npm run build && npm run preview', 3)}
                      className="p-2 text-slate-400 hover:text-white transition"
                      title="Copy"
                    >
                      {copiedIndex === 3 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Compatible with all modern Mac models including Apple Silicon (M1, M2, M3, M4) and Intel Core processors. Requires Node.js 18+.</span>
              </div>
            </div>
          )}

          {/* TAB 4: Native DMG / Electron Packager */}
          {activeTab === 'dmg' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You can wrap this application into a standalone native macOS <b>.dmg</b> installer or <b>.app</b> file using Nativefier or Electron Forge:
              </p>

              <div className="space-y-3">
                <div className="border border-slate-200 dark:border-[#203631] rounded-xl p-3">
                  <div className="text-xs font-bold text-[#014136] dark:text-[#DFBC64] mb-1">
                    Method A: Instant Native Mac .app via Nativefier (Zero Code)
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Builds an isolated macOS app with native Mac menu bar and isolated data sandbox.
                  </p>
                  <div className="bg-slate-900 text-slate-100 font-mono text-[11px] p-3 rounded-lg flex items-center justify-between">
                    <code>npx nativefier --name "MG Supplytech" "http://localhost:3000" --icon public/icon.svg --platform mac</code>
                    <button
                      onClick={() => copyToClipboard('npx nativefier --name "MG Supplytech" "http://localhost:3000" --icon public/icon.svg --platform mac', 4)}
                      className="p-1.5 text-slate-400 hover:text-white transition"
                    >
                      {copiedIndex === 4 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-[#203631] rounded-xl p-3">
                  <div className="text-xs font-bold text-[#014136] dark:text-[#DFBC64] mb-1">
                    Method B: Native DMG distribution with Electron Forge
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Generates a redistributable <b>MG-Supplytech.dmg</b> mountable disk image for macOS.
                  </p>
                  <div className="bg-slate-900 text-slate-100 font-mono text-[11px] p-3 rounded-lg flex items-center justify-between">
                    <code>npm run package:mac</code>
                    <button
                      onClick={() => copyToClipboard('npm run package:mac', 5)}
                      className="p-1.5 text-slate-400 hover:text-white transition"
                    >
                      {copiedIndex === 5 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-[#12201d] px-6 py-3 border-t border-slate-200 dark:border-[#203631] flex items-center justify-between text-xs text-[#65716D]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#014136] dark:text-[#DFBC64]" />
            <span>100% Offline Compatible &bull; Local Storage &bull; No Telemetry</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
