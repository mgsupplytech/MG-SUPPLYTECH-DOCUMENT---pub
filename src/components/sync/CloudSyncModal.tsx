import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownLeft,
  Server
} from 'lucide-react';
import { AppSettings, FirebaseConfig } from '../../types';
import { getSettings, saveSettings } from '../../services/storageService';
import { firebaseSync } from '../../services/firebaseSync';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettingsState] = useState<AppSettings>(getSettings());
  const [config, setConfig] = useState<FirebaseConfig>(settings.firebaseConfig);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleToggle = (enabled: boolean) => {
    const updatedConfig = { ...config, enabled };
    setConfig(updatedConfig);
    const updatedSettings = { ...settings, firebaseConfig: updatedConfig };
    setSettingsState(updatedSettings);
    saveSettings(updatedSettings);
  };

  const handleSaveConfig = () => {
    const updatedSettings = { ...settings, firebaseConfig: config };
    setSettingsState(updatedSettings);
    saveSettings(updatedSettings);
    setTestResult({ success: true, message: 'Firebase configuration saved locally.' });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await firebaseSync.testConnection(config);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncPush = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await firebaseSync.syncLocalToCloud();
      setSyncResult(res);
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncPull = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await firebaseSync.pullFromCloud();
      setSyncResult(res);
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-[#152220] rounded-2xl shadow-2xl border border-[#D9DEDB] dark:border-[#223531] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#003A30] text-white flex items-center justify-between border-b border-[#DFBC64]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#DFBC64] text-[#003A30]">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Online Cloud-Sync &bull; Firebase Hub
              </h2>
              <div className="text-[11px] text-[#DFBC64]">
                Seamless real-time updates across multiple devices &amp; browsers
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Online / Offline Mode Toggle */}
          <div className="p-4 rounded-xl border border-[#D9DEDB] dark:border-[#223531] bg-[#F6F7F5] dark:bg-[#101b19] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-full ${config.enabled ? 'bg-green-100 dark:bg-green-950 text-green-700' : 'bg-gray-200 dark:bg-gray-800 text-gray-600'}`}>
                {config.enabled ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
                  {config.enabled ? 'Online Mode Active (Cloud-Sync Enabled)' : 'Local Browser Mode (Offline First)'}
                </div>
                <div className="text-[11px] text-[#65716D] mt-0.5">
                  {config.enabled 
                    ? 'Records can sync securely to your Firebase Firestore cloud database.' 
                    : 'All documents, customers & catalog remain safely stored in your browser local storage.'}
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#014136]"></div>
            </label>
          </div>

          {/* Test & Sync Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              testResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {testResult.success ? <Check className="w-4 h-4 text-green-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {syncResult && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              syncResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {syncResult.success ? <Check className="w-4 h-4 text-green-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{syncResult.message}</span>
            </div>
          )}

          {/* Configuration Inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-[#014136] dark:text-[#DFBC64]">
                Firebase Credentials
              </h3>
              <span className="text-[10px] text-[#65716D] font-mono">
                {config.lastSyncedAt ? `Last Synced: ${new Date(config.lastSyncedAt).toLocaleString()}` : 'Never synced'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
                  Firebase Project ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. mgsupplytech-cloud"
                  value={config.projectId}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
                  Web API Key *
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSaveConfig}
                className="px-3 py-1.5 bg-[#014136] text-[#DFBC64] text-xs font-bold rounded-lg hover:bg-[#002e27]"
              >
                Save Settings
              </button>

              <button
                onClick={handleTestConnection}
                disabled={testing || !config.projectId || !config.apiKey}
                className="px-3 py-1.5 bg-[#F6F7F5] dark:bg-[#1a2b28] border border-[#D9DEDB] dark:border-[#2a3f3b] text-xs font-bold rounded-lg text-[#014136] dark:text-[#DFBC64] hover:bg-[#eaece8] disabled:opacity-40"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {/* Manual Push / Pull Trigger */}
          {config.enabled && (
            <div className="pt-2 border-t border-[#EDF0EE] dark:border-[#223531] space-y-3">
              <h3 className="text-xs font-bold uppercase text-[#014136] dark:text-[#DFBC64]">
                Manual Sync Operations
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleSyncPush}
                  disabled={syncing}
                  className="p-3 rounded-xl border border-[#D9DEDB] dark:border-[#2a3f3b] bg-white dark:bg-[#152220] hover:border-[#014136] text-left flex items-start gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-[#014136] text-[#DFBC64] shrink-0 mt-0.5">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#014136] dark:text-[#DFBC64]">
                      Push to Firebase
                    </div>
                    <div className="text-[10px] text-[#65716D] mt-0.5">
                      Upload all local customers, inventory and documents to cloud.
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleSyncPull}
                  disabled={syncing}
                  className="p-3 rounded-xl border border-[#D9DEDB] dark:border-[#2a3f3b] bg-white dark:bg-[#152220] hover:border-[#014136] text-left flex items-start gap-3 transition"
                >
                  <div className="p-2 rounded-lg bg-[#B88C2E] text-white shrink-0 mt-0.5">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#014136] dark:text-[#DFBC64]">
                      Pull from Firebase
                    </div>
                    <div className="text-[10px] text-[#65716D] mt-0.5">
                      Restore latest cloud records into this browser device.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
