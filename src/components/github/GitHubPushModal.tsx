import React, { useState } from 'react';
import { 
  X, 
  GitBranch, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  FolderGit2, 
  ShieldCheck, 
  Sparkles,
  Download,
  KeyRound,
  AlertTriangle,
  Laptop,
  RefreshCw,
  AppWindow,
  Compass
} from 'lucide-react';

interface GitHubPushModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPushModal: React.FC<GitHubPushModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'mac-app' | 'push'>('mac-app');
  const [repoName, setRepoName] = useState('MG-SUPPLYTECH-DOCUMENT');
  const [githubUsername, setGithubUsername] = useState('shankeragencies');
  const [githubToken, setGithubToken] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const targetUrl = githubToken
    ? `https://${githubToken.trim()}@github.com/${githubUsername.trim()}/${repoName}.git`
    : `https://github.com/${githubUsername.trim()}/${repoName}.git`;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const directPushCommand = `git remote set-url origin "${targetUrl}" && git push -u origin main`;
  const fixPermissionsCommand = `chmod +x ~/Downloads/MG-SUPPLYTECH-DOCUMENT*/*.command`;
  const bashDirectCommand = `bash Push-Updates-Directly.command`;

  const allCommands = `# 1. Go to github.com/new and create a repo named "${repoName}"
# 2. In your terminal inside the project directory, run:
git remote add origin ${targetUrl}
git branch -M main
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#101b19] border border-slate-200 dark:border-[#223531] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#16211F] dark:text-[#E3ECE8]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#00241E] via-[#003A30] to-[#014136] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20">
              <Laptop className="w-5 h-5 text-[#DFBC64]" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                Mac Desktop App &amp; GitHub Sync
              </h2>
              <p className="text-xs text-[#DFBC64]">
                1-Click Desktop Icon &bull; Auto-Updates &bull; Zero Terminal Commands
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-[#223531] bg-slate-50 dark:bg-[#152220] px-4 pt-2">
          <button
            onClick={() => setActiveTab('mac-app')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'mac-app'
                ? 'border-[#014136] dark:border-[#DFBC64] text-[#014136] dark:text-[#DFBC64]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AppWindow className="w-4 h-4" />
            <span>Mac Desktop App (No Terminal)</span>
          </button>

          <button
            onClick={() => setActiveTab('push')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition ${
              activeTab === 'push'
                ? 'border-[#014136] dark:border-[#DFBC64] text-[#014136] dark:text-[#DFBC64]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Push Code to GitHub</span>
          </button>
        </div>

        {/* Tab 1: Mac App & Auto-Updating */}
        {activeTab === 'mac-app' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Feature 1: Create Desktop Shortcut */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-black text-xs">1</div>
                  <h3 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-200">
                    Create 1-Click Mac Desktop App
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                You never need to open the Terminal or type commands. Inside your downloaded project folder, double-click:
              </p>
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#13201d] rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                <code className="text-xs font-mono font-bold text-emerald-900 dark:text-emerald-300">
                  Create-Mac-Desktop-App.command
                </code>
                <span className="text-[11px] font-semibold text-slate-500">
                  Double-click once in Finder
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                ✨ It places <b>"MG Supplytech.app"</b> directly on your Desktop with the brand logo. Double-clicking it automatically checks GitHub for updates, starts the server in the background, and opens your app!
              </p>
            </div>

            {/* Feature 2: 1-Click Update from GitHub */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-600 text-white font-black text-xs">2</div>
                  <h3 className="font-extrabold text-sm text-amber-950 dark:text-amber-200">
                    Instant 1-Click GitHub Updater
                  </h3>
                </div>
                <RefreshCw className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Whenever changes or fixes are made to your GitHub repository, you can update your Mac with one double-click:
              </p>
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#13201d] rounded-lg border border-amber-200 dark:border-amber-800/40">
                <code className="text-xs font-mono font-bold text-amber-900 dark:text-amber-300">
                  Update-From-GitHub.command
                </code>
                <span className="text-[11px] font-semibold text-slate-500">
                  Double-click in Finder
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                ⚡ It pulls the latest changes from branch <code>main</code>, installs any updated packages, and reloads your Mac app automatically.
              </p>
            </div>

            {/* Feature 3: Safari / Chrome Add to Dock */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#223531] space-y-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#014136] dark:text-[#DFBC64]" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Browser 1-Click Desktop &amp; Dock Shortcut
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#101b19] border border-slate-200 dark:border-[#223531]">
                  <b>Safari (macOS):</b> Click <b>File</b> in top menu &rarr; <b>Add to Dock</b>. It creates a standalone macOS app icon in your Dock!
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#101b19] border border-slate-200 dark:border-[#223531]">
                  <b>Google Chrome:</b> Click the <b>Install</b> icon in the URL address bar to install MG Supplytech directly into Applications.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Push Code to GitHub */}
        {activeTab === 'push' && (
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Info Box */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <b>Local Git Repository Initialized:</b> The project is already committed locally with branch <code>main</code>, clean history, and full TypeScript source code.
            </div>
          </div>

          {/* Fix 'No Privileges' Alert Box */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Common Mac Terminal Messages &amp; Quick Solutions:</span>
            </div>

            <div className="space-y-2 text-slate-700 dark:text-slate-300 text-[11px]">
              {/* Fix 0: Xcode Developer Tools popup */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#13201d] border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-amber-200">
                  ⚡ If Terminal says: <code className="text-amber-700 dark:text-amber-400">"No developer tools were found, requesting install"</code>:
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  A small Apple popup window has appeared on your Mac desktop screen. Click <b>"Install"</b> on that popup and accept terms. macOS will automatically download Apple Command Line Tools (~1-2 minutes). Once it finishes, re-run your push command!
                </p>
                <div className="text-[10px] text-slate-500">
                  If the popup didn't appear, run this in Terminal to trigger it: <code className="bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">xcode-select --install</code>
                </div>
              </div>

              {/* Fix 1: Mac Execution Privileges */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#13201d] border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-amber-200 flex items-center justify-between">
                  <span>1. If Mac Finder says "You do not have appropriate access privileges":</span>
                  <button
                    onClick={() => copyToClipboard(fixPermissionsCommand, 101)}
                    className="text-[10px] text-[#003A30] dark:text-[#DFBC64] font-bold hover:underline flex items-center gap-1"
                  >
                    {copiedIndex === 101 ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedIndex === 101 ? 'Copied Fix' : 'Copy Fix'}</span>
                  </button>
                </div>
                <p className="text-slate-500">Run this once in your Mac Terminal to unlock executable privileges:</p>
                <code className="block p-1.5 rounded bg-slate-900 text-emerald-400 font-mono text-[10px] break-all select-all">
                  {fixPermissionsCommand}
                </code>
                <div className="pt-1 text-[10px] text-slate-500">
                  Or simply run: <code className="bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-slate-800 dark:text-slate-200">{bashDirectCommand}</code>
                </div>
              </div>

              {/* Fix 2: GitHub Write Permission / Token */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#13201d] border border-amber-200 dark:border-amber-800/40 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-amber-200 flex items-center justify-between">
                  <span>2. If GitHub says "Permission to repo denied / 403":</span>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=MG-Supplytech-Push"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Generate Token (1-Click)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-500">
                  GitHub permanently disabled account passwords. Enter your <b>Personal Access Token</b> below to push directly:
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="Paste GitHub Token (starts with ghp_...)"
                    className="flex-1 px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-50 dark:bg-[#0c1413] border border-slate-200 dark:border-white/10 font-mono focus:ring-1 focus:ring-[#003A30]"
                  />
                  <button
                    onClick={() => copyToClipboard(directPushCommand, 102)}
                    className="px-3 py-1.5 rounded-lg bg-[#003A30] hover:bg-[#014136] text-[#DFBC64] text-[10px] font-bold shrink-0 transition"
                  >
                    {copiedIndex === 102 ? 'Copied Push Command!' : 'Copy Push Command'}
                  </button>
                </div>
                {githubToken && (
                  <code className="block p-1.5 rounded bg-slate-900 text-emerald-400 font-mono text-[10px] break-all select-all">
                    {directPushCommand}
                  </code>
                )}
              </div>
            </div>
          </div>

          {/* GitHub Repository Info */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              GitHub Repository
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${githubUsername}/${repoName}`}
                onChange={(e) => {
                  const parts = e.target.value.split('/');
                  if (parts[0]) setGithubUsername(parts[0]);
                  if (parts[1]) setRepoName(parts[1]);
                }}
                placeholder="e.g. shankeragencies/MG-SUPPLYTECH-DOCUMENT"
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#003A30]"
              />
              <a
                href={`https://github.com/${githubUsername}/${repoName}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2b27] hover:bg-slate-200 dark:hover:bg-[#233833] text-xs font-bold text-[#003A30] dark:text-[#DFBC64] border border-slate-200 dark:border-[#2a3f3b] transition"
              >
                <span>Open on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Step 1-2-3 Terminal Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#003A30] dark:text-[#DFBC64]" />
                Terminal Commands (Run on your Mac / Terminal)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(allCommands, 99)}
                className="text-[11px] font-bold text-[#003A30] dark:text-[#DFBC64] hover:underline flex items-center gap-1"
              >
                {copiedIndex === 99 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedIndex === 99 ? 'Copied All' : 'Copy All Commands'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-1.5">
                <span># 1. Connect remote repository</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`git remote add origin ${targetUrl}`, 1)}
                  className="hover:text-white"
                >
                  {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <code className="block text-emerald-400 break-all select-all">
                git remote add origin {targetUrl}
              </code>

              <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-1.5 pt-1">
                <span># 2. Set default branch</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`git branch -M main`, 2)}
                  className="hover:text-white"
                >
                  {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <code className="block text-slate-300 select-all">
                git branch -M main
              </code>

              <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-1.5 pt-1">
                <span># 3. Push complete codebase</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`git push -u origin main`, 3)}
                  className="hover:text-white"
                >
                  {copiedIndex === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <code className="block text-amber-300 select-all">
                git push -u origin main
              </code>
            </div>
          </div>

          {/* Mac Double-Click Script Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <b className="text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#DFBC64]" />
                  Direct 1-Click Push on Mac
                </b>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Double-click <b>Push-Updates-Directly.command</b> inside your downloaded folder!
                </div>
              </div>
              <span className="px-2.5 py-1 bg-[#003A30] text-[#DFBC64] rounded-lg font-mono text-[10px] font-bold border border-[#DFBC64]/30 shadow-xs">
                Push-Updates-Directly.command
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Or run in Terminal:</span>
              <button
                type="button"
                onClick={() => copyToClipboard('git add . && git commit -m "Update MG Supplytech" && git push origin main', 88)}
                className="font-mono text-xs px-2.5 py-1 rounded bg-slate-900 text-emerald-400 hover:text-white transition flex items-center gap-1.5"
              >
                {copiedIndex === 88 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>git add . && git commit -m "Update" && git push</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0c1412] border-t border-slate-200 dark:border-[#223531] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#1a2b27] hover:bg-slate-300 dark:hover:bg-[#233833] text-xs font-bold text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
          {activeTab === 'push' && (
            <button
              onClick={() => copyToClipboard(allCommands, 99)}
              className="px-4 py-2 rounded-xl bg-[#003A30] hover:bg-[#014136] text-[#DFBC64] hover:text-white text-xs font-bold uppercase tracking-wider transition shadow"
            >
              {copiedIndex === 99 ? 'Copied Commands!' : 'Copy Push Commands'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
