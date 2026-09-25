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
  Download
} from 'lucide-react';

interface GitHubPushModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPushModal: React.FC<GitHubPushModalProps> = ({ isOpen, onClose }) => {
  const [repoName, setRepoName] = useState('mg-supplytech-document-maker');
  const [githubUsername, setGithubUsername] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const targetUrl = githubUsername 
    ? `https://github.com/${githubUsername.trim()}/${repoName}.git`
    : `https://github.com/YOUR_GITHUB_USERNAME/${repoName}.git`;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

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
              <FolderGit2 className="w-5 h-5 text-[#DFBC64]" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                Push to GitHub
              </h2>
              <p className="text-xs text-[#DFBC64]">
                Target Repository: <b>{repoName}</b>
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Info Box */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <b>Local Git Repository Initialized:</b> The project is already committed locally with branch <code>main</code>, clean history, and full TypeScript source code.
            </div>
          </div>

          {/* GitHub Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Your GitHub Username / Organization (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="e.g. shankeragencies or mgsupplytech"
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-slate-800 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#003A30]"
              />
              <a
                href="https://github.com/new"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2b27] hover:bg-slate-200 dark:hover:bg-[#233833] text-xs font-bold text-[#003A30] dark:text-[#DFBC64] border border-slate-200 dark:border-[#2a3f3b] transition"
              >
                <span>Create on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Create a new empty repo named <b>{repoName}</b> on GitHub (do not initialize with README or license).
            </p>
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
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-xs flex items-center justify-between">
            <div>
              <b className="text-slate-800 dark:text-white">macOS 1-Click Pusher:</b>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                You can also run <code>push-to-github.command</code> right inside your local Mac folder!
              </div>
            </div>
            <span className="px-2 py-1 bg-[#003A30] text-[#DFBC64] rounded font-mono text-[10px] font-bold">
              push-to-github.command
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0c1412] border-t border-slate-200 dark:border-[#223531] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#1a2b27] hover:bg-slate-300 dark:hover:bg-[#233833] text-xs font-bold text-slate-700 dark:text-slate-200 transition"
          >
            Close
          </button>
          <button
            onClick={() => copyToClipboard(allCommands, 99)}
            className="px-4 py-2 rounded-xl bg-[#003A30] hover:bg-[#014136] text-[#DFBC64] hover:text-white text-xs font-bold uppercase tracking-wider transition shadow"
          >
            {copiedIndex === 99 ? 'Copied Commands!' : 'Copy Push Commands'}
          </button>
        </div>
      </div>
    </div>
  );
};
