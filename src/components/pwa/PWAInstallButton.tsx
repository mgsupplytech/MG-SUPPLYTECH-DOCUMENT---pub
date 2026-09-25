import React, { useState } from 'react';
import { Download, CheckCircle2, WifiOff } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../../hooks/usePWAInstall';
import { MacInstallModal } from './MacInstallModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isMac, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
          isInstalled
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60'
            : 'bg-gradient-to-r from-[#003A30] to-[#014136] hover:from-[#00241E] hover:to-[#003A30] text-[#DFBC64] border border-[#DFBC64]/40 hover:border-[#DFBC64]'
        }`}
        title={isInstalled ? 'Installed as Standalone App on Mac' : 'Package & Install Locally on macOS (Sonoma / Sequoia / Ventura)'}
      >
        {/* Apple Icon */}
        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 170 170">
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.79-11.97-14.24-6.43-9.79-11.45-20.73-15.06-32.81-3.61-12.09-5.42-23.77-5.42-35.04 0-14.89 3.82-27.26 11.45-37.1 7.64-9.84 17.15-14.86 28.53-15.06 4.9.11 10.23 1.34 16 3.7 5.77 2.36 9.57 3.6 11.4 3.73 2.53-.13 6.44-1.42 11.75-3.87 5.3-2.45 10.37-3.63 15.2-3.56 12.09.65 21.84 5.39 29.25 14.21-10.78 6.53-16.06 15.54-15.84 27.02.22 9.03 3.63 16.64 10.23 22.84 6.6 6.2 14.53 9.79 23.8 10.77-2.39 7.08-5.18 14.07-8.37 20.97zM119.22 31.84c0-7.39 2.65-14.38 7.95-20.97 5.3-6.59 11.9-10.87 19.8-12.83.22 1.3.33 2.45.33 3.44 0 7.39-2.73 14.51-8.19 21.36-5.46 6.85-12.08 11.12-19.89 12.82v-3.82z" />
        </svg>

        {isInstalled ? (
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Mac App Installed</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span>Install on Mac</span>
          </span>
        )}
      </button>

      <MacInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom duration-300">
      <WifiOff className="w-3.5 h-3.5 animate-pulse" />
      <span>Offline Mode — All local documents and data are active</span>
    </div>
  );
};
