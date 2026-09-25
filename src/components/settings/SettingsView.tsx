import React, { useState, useRef } from 'react';
import { AppSettings, BankAccountDetails, CompanyProfile } from '../../types';
import { 
  getSettings, 
  saveSettings, 
  getEffectiveCompanyProfile 
} from '../../services/storageService';
import { 
  CANONICAL_SELLER, 
  DEFAULT_COMPANY_PROFILE, 
  DEFAULT_DOMESTIC_BANK, 
  DEFAULT_EXPORT_BANK 
} from '../../constants/brand';
import { MGLogo } from '../brand/BrandLogos';
import { 
  Building2, 
  Landmark, 
  Image as ImageIcon, 
  FileText, 
  Save, 
  RotateCcw, 
  Upload, 
  Trash2, 
  Check, 
  AlertCircle, 
  Plus, 
  Globe, 
  Phone, 
  Mail, 
  ShieldCheck, 
  CreditCard,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Laptop,
  FolderDown,
  Terminal,
  Copy,
  Lock,
  KeyRound,
  FolderGit2
} from 'lucide-react';
import { generateMacPackageZip, downloadBlob } from '../../utils/macPackaging';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { authService, DEFAULT_AUTH_CONFIG } from '../../services/authService';
import { GitHubPushModal } from '../github/GitHubPushModal';

interface SettingsViewProps {
  onNavigateToStudio?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateToStudio }) => {
  const [settings, setSettingsState] = useState<AppSettings>(() => getSettings());
  const [activeTab, setActiveTab] = useState<'company' | 'logo' | 'banking' | 'terms' | 'mac' | 'security'>('company');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPackaging, setIsPackaging] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Security & GitHub states
  const [loginIdSetting, setLoginIdSetting] = useState(() => authService.getStoredLoginId());
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authStatusMsg, setAuthStatusMsg] = useState<string | null>(null);
  const [authStatusError, setAuthStatusError] = useState<string | null>(null);
  const [showGitHubModal, setShowGitHubModal] = useState(false);

  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleDownloadMacZip = async () => {
    try {
      setIsPackaging(true);
      const zipBlob = await generateMacPackageZip();
      downloadBlob(zipBlob, 'MG-Supplytech-Mac-Local.zip');
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to create Mac zip:', err);
    } finally {
      setIsPackaging(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Editing state for company profile
  const [company, setCompany] = useState<CompanyProfile>(() => getEffectiveCompanyProfile(settings));

  // Editing state for bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccountDetails[]>(() => {
    return (settings.bankAccounts && settings.bankAccounts.length > 0)
      ? settings.bankAccounts
      : [DEFAULT_DOMESTIC_BANK, DEFAULT_EXPORT_BANK];
  });

  const [domesticBankId, setDomesticBankId] = useState<string>(
    settings.domesticBankId || DEFAULT_DOMESTIC_BANK.id
  );
  const [exportBankId, setExportBankId] = useState<string>(
    settings.exportBankId || DEFAULT_EXPORT_BANK.id
  );

  // Active bank being edited in modal or expanded card
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAll = () => {
    const updated: AppSettings = {
      ...settings,
      sellerName: company.companyName,
      gstin: company.gstin,
      address: company.address,
      email: company.email,
      phone: company.phone,
      whatsapp: company.whatsapp || company.phone,
      secondaryPhone: company.secondaryPhone || '',
      website: company.website,
      company: { ...company },
      bankAccounts: [...bankAccounts],
      domesticBankId,
      exportBankId
    };

    saveSettings(updated);
    setSettingsState(updated);
    setSaveSuccess(true);
    setStatusMessage('Company profile, logos, and domestic/export bank settings saved successfully!');
    setTimeout(() => {
      setSaveSuccess(false);
      setStatusMessage(null);
    }, 4000);
  };

  const handleResetDefaults = () => {
    if (!window.confirm('Reset company details, logos, and banking configuration back to official MG Supplytech defaults?')) {
      return;
    }
    setCompany(DEFAULT_COMPANY_PROFILE);
    setBankAccounts([DEFAULT_DOMESTIC_BANK, DEFAULT_EXPORT_BANK]);
    setDomesticBankId(DEFAULT_DOMESTIC_BANK.id);
    setExportBankId(DEFAULT_EXPORT_BANK.id);

    const resetSettings: AppSettings = {
      ...settings,
      company: DEFAULT_COMPANY_PROFILE,
      bankAccounts: [DEFAULT_DOMESTIC_BANK, DEFAULT_EXPORT_BANK],
      domesticBankId: DEFAULT_DOMESTIC_BANK.id,
      exportBankId: DEFAULT_EXPORT_BANK.id,
      sellerName: DEFAULT_COMPANY_PROFILE.companyName,
      gstin: DEFAULT_COMPANY_PROFILE.gstin,
      address: DEFAULT_COMPANY_PROFILE.address,
      email: DEFAULT_COMPANY_PROFILE.email,
      phone: DEFAULT_COMPANY_PROFILE.phone,
      website: DEFAULT_COMPANY_PROFILE.website
    };
    saveSettings(resetSettings);
    setSettingsState(resetSettings);
    setStatusMessage('Settings restored to official defaults.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, or WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size exceeds 2MB. Please upload an image under 2MB for optimal performance.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCompany(prev => ({
        ...prev,
        logoUrl: dataUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomLogo = () => {
    setCompany(prev => ({
      ...prev,
      logoUrl: undefined
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Bank management helpers
  const handleAddNewBank = () => {
    const newId = `bank-${Date.now()}`;
    const isExport = bankAccounts.length > 0;
    const newBank: BankAccountDetails = {
      id: newId,
      accountLabel: isExport ? 'Secondary / Export Account' : 'Domestic Commercial Account',
      beneficiaryName: company.legalName || company.companyName,
      bankName: 'New Commercial Bank',
      accountNumber: '',
      accountType: 'Current Account',
      ifsc: 'ABCD0123456',
      swiftBic: isExport ? 'ABCDINBBXXX' : '',
      adCode: isExport ? '0123456' : '',
      branch: 'Branch Name, City',
      currency: isExport ? 'USD' : 'INR'
    };
    setBankAccounts(prev => [...prev, newBank]);
    setEditingBankId(newId);
  };

  const handleUpdateBankField = (id: string, field: keyof BankAccountDetails, value: any) => {
    setBankAccounts(prev => prev.map(b => {
      if (b.id !== id) return b;
      return { ...b, [field]: value };
    }));
  };

  const handleDeleteBank = (id: string) => {
    if (bankAccounts.length <= 1) {
      alert('You must have at least one bank account configured.');
      return;
    }
    if (domesticBankId === id) {
      const other = bankAccounts.find(b => b.id !== id);
      if (other) setDomesticBankId(other.id);
    }
    if (exportBankId === id) {
      const other = bankAccounts.find(b => b.id !== id);
      if (other) setExportBankId(other.id);
    }
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    if (editingBankId === id) setEditingBankId(null);
  };

  const activeDomesticBank = bankAccounts.find(b => b.id === domesticBankId) || bankAccounts[0];
  const activeExportBank = bankAccounts.find(b => b.id === exportBankId) || bankAccounts[1] || bankAccounts[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#014136]/10 dark:bg-[#DFBC64]/10 border border-[#014136]/20 dark:border-[#DFBC64]/30 flex items-center justify-center text-[#014136] dark:text-[#DFBC64]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Company Profile & Settings Utility
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                Active Master
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">
              Configure legal entity information, GSTIN, IEC, UDYAM registration, brand logos, and dedicated Domestic vs. Export bank accounts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            title="Reset to default MG Supplytech settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#014136] hover:bg-[#003A30] text-white font-bold text-xs shadow-md shadow-[#014136]/20 transition"
          >
            <Save className="w-4 h-4 text-[#DFBC64]" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs transition animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
          {onNavigateToStudio && (
            <button
              onClick={onNavigateToStudio}
              className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 dark:text-emerald-300 underline underline-offset-2 hover:opacity-80"
            >
              Open Document Studio <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
        {[
          { id: 'company', label: 'Company & Statutory Details', icon: ShieldCheck, badge: 'GSTIN • IEC • UDYAM' },
          { id: 'logo', label: 'Brand Logo & Appearance', icon: ImageIcon, badge: 'Upload / Vector' },
          { id: 'banking', label: 'Bank Accounts (Domestic vs Export)', icon: Landmark, badge: 'NEFT / RTGS & SWIFT / AD' },
          { id: 'terms', label: 'Commercial Terms & Sequences', icon: FileText, badge: 'Legal Clauses' },
          { id: 'mac', label: 'Package & Install on Mac', icon: Laptop, badge: 'macOS Bundle & PWA' },
          { id: 'security', label: 'Login & GitHub Sync', icon: Lock, badge: 'Password & Repo' }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
                active
                  ? 'bg-[#014136] text-white shadow-sm'
                  : 'bg-white dark:bg-[#121f1d] text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#DFBC64]' : 'text-slate-500 dark:text-white/50'}`} />
              <span>{tab.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                active 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMPANY & STATUTORY DETAILS */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          {/* Statutory Registration Numbers Box */}
          <div className="p-6 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#014136] dark:text-[#DFBC64]" />
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Statutory Registrations (GSTIN, IEC, UDYAM, PAN, LUT)
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Printed on invoices, delivery challans, and statutory tax headers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  GSTIN (15-Digit Indian GST Identification) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={company.gstin}
                  onChange={e => setCompany({ ...company, gstin: e.target.value.toUpperCase() })}
                  placeholder="07ATTPT6324N1ZQ"
                  className="w-full px-3 py-2 font-mono text-xs uppercase font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
                />
                <p className="text-[10px] text-slate-400 mt-1">State Code (07) + PAN + Entity + Z + Checksum</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  IEC Code (Import Export Code - DGFT) <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  value={company.iec}
                  onChange={e => setCompany({ ...company, iec: e.target.value.toUpperCase() })}
                  placeholder="0517036281"
                  className="w-full px-3 py-2 font-mono text-xs uppercase font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
                />
                <p className="text-[10px] text-slate-400 mt-1">10-Digit Code mandatory for Foreign Export Sales</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  UDYAM Registration (MSME Number)
                </label>
                <input
                  type="text"
                  value={company.udyam}
                  onChange={e => setCompany({ ...company, udyam: e.target.value.toUpperCase() })}
                  placeholder="UDYAM-DL-03-0048912"
                  className="w-full px-3 py-2 font-mono text-xs uppercase font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Ministry of MSME Enterprise Registration</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  PAN Number (Permanent Account Number)
                </label>
                <input
                  type="text"
                  value={company.pan || ''}
                  onChange={e => setCompany({ ...company, pan: e.target.value.toUpperCase() })}
                  placeholder="ATTPT6324N"
                  className="w-full px-3 py-2 font-mono text-xs uppercase font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  LUT ARN (Export Under Bond / Undertaking)
                </label>
                <input
                  type="text"
                  value={company.lutArn || ''}
                  onChange={e => setCompany({ ...company, lutArn: e.target.value.toUpperCase() })}
                  placeholder="AD240324001234F"
                  className="w-full px-3 py-2 font-mono text-xs uppercase font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Zero-rated export GST declaration reference</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  CIN / Corporate Reg No. (Optional)
                </label>
                <input
                  type="text"
                  value={company.cin || ''}
                  onChange={e => setCompany({ ...company, cin: e.target.value.toUpperCase() })}
                  placeholder="U51909DL2020PTC123456"
                  className="w-full px-3 py-2 font-mono text-xs uppercase font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
                />
              </div>
            </div>
          </div>

          {/* Legal Entity & General Identity */}
          <div className="p-6 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-white/10 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Legal Entity & Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Brand / Trade Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={company.companyName}
                  onChange={e => setCompany({ ...company, companyName: e.target.value })}
                  placeholder="MG Supplytech"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Legal / Registered Entity Name
                </label>
                <input
                  type="text"
                  value={company.legalName || ''}
                  onChange={e => setCompany({ ...company, legalName: e.target.value })}
                  placeholder="MG Supplytech"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Corporate Brand Tagline
                </label>
                <input
                  type="text"
                  value={company.tagline || ''}
                  onChange={e => setCompany({ ...company, tagline: e.target.value })}
                  placeholder="BUILDING POSSIBILITIES"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Header Trust Subtitle
                </label>
                <input
                  type="text"
                  value={company.headerTrustText || ''}
                  onChange={e => setCompany({ ...company, headerTrustText: e.target.value })}
                  placeholder="YOUR TRUSTED GLOBAL SOURCING PARTNER"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Registered Office Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={company.address}
                  onChange={e => setCompany({ ...company, address: e.target.value })}
                  placeholder="177 First Floor, Vigyan Vihar, Delhi – 110092, India"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  City & State / State Code
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={company.city || ''}
                    onChange={e => setCompany({ ...company, city: e.target.value })}
                    placeholder="Delhi"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                  />
                  <input
                    type="text"
                    value={company.stateCode || ''}
                    onChange={e => setCompany({ ...company, stateCode: e.target.value })}
                    placeholder="State Code (07)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Country & Pincode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={company.country || 'India'}
                    onChange={e => setCompany({ ...company, country: e.target.value })}
                    placeholder="India"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                  />
                  <input
                    type="text"
                    value={company.pincode || ''}
                    onChange={e => setCompany({ ...company, pincode: e.target.value })}
                    placeholder="110092"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Primary Mobile & WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={e => setCompany({ ...company, phone: e.target.value, whatsapp: e.target.value })}
                  placeholder="+91 83739 76489"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Secondary / Landline Phone
                </label>
                <input
                  type="text"
                  value={company.secondaryPhone || ''}
                  onChange={e => setCompany({ ...company, secondaryPhone: e.target.value })}
                  placeholder="+91 98990 59593"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Official Contact Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={company.email}
                  onChange={e => setCompany({ ...company, email: e.target.value })}
                  placeholder="info@mgsupplytech.com"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={company.website}
                  onChange={e => setCompany({ ...company, website: e.target.value })}
                  placeholder="www.mgsupplytech.com"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRAND LOGO & APPEARANCE */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Brand Logo & Letterhead Header Artwork
              </h2>
              <p className="text-xs text-slate-500 dark:text-white/60 mt-1">
                Upload your custom corporate logo or select one of the high-resolution vector brand insignia presets. This logo renders at full 300-DPI resolution on invoices, quotations, price offers, and delivery challans.
              </p>
            </div>

            {/* Live Logo Preview Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#101b19] dark:to-[#162724] border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#0c1514] border border-slate-200 dark:border-white/10 p-2 shadow-inner flex items-center justify-center overflow-hidden">
                  {company.logoUrl ? (
                    <img 
                      src={company.logoUrl} 
                      alt="Custom Company Logo Preview" 
                      className="max-h-full max-w-full object-contain transition-transform duration-200"
                      style={{ transform: `scale(${(company.logoScale || 100) / 100})` }}
                    />
                  ) : (
                    <MGLogo size={80} variant={company.logoVariant || 'original'} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
                      {company.logoUrl ? 'Custom Image Logo Active' : 'Official Vector Emblem'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#DFBC64]/20 text-[#003A30] dark:text-[#DFBC64]">
                      {company.logoScale || 100}% Scale
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {company.companyName}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-white/60">
                    {company.tagline || 'BUILDING POSSIBILITIES'}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  id="logo-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#014136] hover:bg-[#003A30] text-white text-xs font-bold shadow-xs transition"
                >
                  <Upload className="w-4 h-4 text-[#DFBC64]" />
                  <span>Upload Custom Logo</span>
                </button>

                {company.logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomLogo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-bold transition"
                    title="Remove custom logo and revert to vector emblem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Use Vector Logo</span>
                  </button>
                )}
              </div>
            </div>

            {/* Custom Logo URL / Scale Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Logo Size / Scale ({company.logoScale || 100}%)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold">Small (70%)</span>
                  <input
                    type="range"
                    min="70"
                    max="140"
                    step="5"
                    value={company.logoScale || 100}
                    onChange={e => setCompany({ ...company, logoScale: parseInt(e.target.value) })}
                    className="flex-1 accent-[#014136]"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">Large (140%)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Adjusts the proportional footprint on printed letterhead and A4 documents.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Or Paste External Logo Image URL
                </label>
                <input
                  type="url"
                  value={company.logoUrl?.startsWith('data:') ? '' : (company.logoUrl || '')}
                  onChange={e => setCompany({ ...company, logoUrl: e.target.value || undefined })}
                  placeholder="https://example.com/assets/logo.png"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Supports HTTPS image URLs directly from your cloud host or CDN.
                </p>
              </div>
            </div>

            {/* Vector Insignia Variant Selector (When not using uploaded image or for vector letterheads) */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/10">
              <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-2">
                Vector Brand Insignia Variants (Default Fallback)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'original', name: 'Original Emblem', desc: 'Classic Deep Forest Green & Metallic Gold' },
                  { id: 'gold', name: 'Metallic Gold Accent', desc: 'Prestige Gold gradient finish' },
                  { id: 'monochrome', name: 'Monochrome High-Contrast', desc: 'Crisp Black/Charcoal for B&W printing' }
                ].map(v => {
                  const isSelected = (!company.logoVariant && v.id === 'original') || company.logoVariant === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setCompany({ ...company, logoVariant: v.id as any })}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center gap-3 ${
                        isSelected
                          ? 'border-[#014136] bg-[#014136]/5 dark:border-[#DFBC64] dark:bg-[#DFBC64]/10'
                          : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                      }`}
                    >
                      <MGLogo size={36} variant={v.id as any} />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{v.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-white/50">{v.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BANK ACCOUNTS (DOMESTIC VS EXPORT) */}
      {activeTab === 'banking' && (
        <div className="space-y-6">
          {/* Statutory Trade Note Banner */}
          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-start gap-3">
            <Landmark className="w-5 h-5 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200">
              <span className="font-bold uppercase tracking-wider block mb-0.5">
                Statutory Multi-Regime Banking Architecture: Domestic vs. International Export
              </span>
              <p className="leading-relaxed">
                Domestic Indian sales mandate <b>NEFT / RTGS / IFSC</b> settlement details. International export transactions mandate <b>SWIFT / BIC</b>, <b>AD Code (Authorized Dealer Code for Customs / EDPMS)</b>, and Foreign Currency (USD / EUR / EEFC) remittance instructions. The system automatically switches accounts based on whether the document is Domestic or Export.
              </p>
            </div>
          </div>

          {/* Quick Active Assignment Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Domestic Default Selector */}
            <div className="p-4 bg-white dark:bg-[#121f1d] rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/30 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    Default For Domestic Sales (INR)
                  </span>
                </div>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">
                Assigned Domestic Bank:
              </div>
              <select
                value={domesticBankId}
                onChange={e => setDomesticBankId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#014136]"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.accountLabel} — {b.bankName} (A/C: {b.accountNumber || 'Pending'}) {b.ifsc ? `• IFSC: ${b.ifsc}` : ''}
                  </option>
                ))}
              </select>
              {activeDomesticBank && (
                <div className="text-[11px] text-slate-500 dark:text-white/60 pt-1">
                  <b>{activeDomesticBank.bankName}</b> &bull; A/C: <span className="font-mono">{activeDomesticBank.accountNumber}</span> &bull; IFSC: <span className="font-mono">{activeDomesticBank.ifsc || 'None'}</span>
                </div>
              )}
            </div>

            {/* Export Default Selector */}
            <div className="p-4 bg-white dark:bg-[#121f1d] rounded-2xl border-2 border-[#DFBC64]/50 dark:border-[#DFBC64]/40 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#DFBC64]/20 text-[#846317] dark:text-[#DFBC64]">
                    Default For International Export (USD / Foreign)
                  </span>
                </div>
                <Globe className="w-4 h-4 text-[#B88C2E] dark:text-[#DFBC64]" />
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-white">
                Assigned Export Bank:
              </div>
              <select
                value={exportBankId}
                onChange={e => setExportBankId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19] focus:ring-2 focus:ring-[#DFBC64]"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.accountLabel} — {b.bankName} (A/C: {b.accountNumber || 'Pending'}) {b.swiftBic ? `• SWIFT: ${b.swiftBic}` : ''}
                  </option>
                ))}
              </select>
              {activeExportBank && (
                <div className="text-[11px] text-slate-500 dark:text-white/60 pt-1">
                  <b>{activeExportBank.bankName}</b> &bull; A/C: <span className="font-mono">{activeExportBank.accountNumber}</span> &bull; SWIFT: <span className="font-mono">{activeExportBank.swiftBic || 'None'}</span> &bull; AD Code: <span className="font-mono">{activeExportBank.adCode || 'None'}</span>
                </div>
              )}
            </div>
          </div>

          {/* List of Configured Bank Accounts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">
                Configured Commercial Bank Accounts ({bankAccounts.length})
              </h3>
              <button
                type="button"
                onClick={handleAddNewBank}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {bankAccounts.map((bank, index) => {
                const isDomestic = domesticBankId === bank.id;
                const isExport = exportBankId === bank.id;
                const isEditing = editingBankId === bank.id;

                return (
                  <div
                    key={bank.id}
                    className={`p-5 rounded-2xl border transition bg-white dark:bg-[#121f1d] ${
                      isEditing 
                        ? 'border-[#014136] dark:border-[#DFBC64] ring-1 ring-[#014136]/20' 
                        : 'border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {/* Bank Summary Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[#014136] dark:text-[#DFBC64] font-black text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {bank.accountLabel || bank.bankName}
                            </span>
                            {isDomestic && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                Domestic Active
                              </span>
                            )}
                            {isExport && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#DFBC64]/20 text-[#846317] dark:text-[#DFBC64]">
                                Export Active
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-white/60">
                            {bank.bankName} &bull; A/C: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{bank.accountNumber || '—'}</span> &bull; {bank.accountType || 'Current Account'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBankId(isEditing ? null : bank.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                        >
                          {isEditing ? 'Collapse Details' : 'Edit Account Details'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBank(bank.id)}
                          disabled={bankAccounts.length <= 1}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 transition"
                          title="Delete Bank Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Detailed Fields (Expanded or Always Visible for Active Edit) */}
                    <div className={`pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 ${isEditing ? 'block' : 'block'}`}>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          Account Nickname / Label <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={bank.accountLabel}
                          onChange={e => handleUpdateBankField(bank.id, 'accountLabel', e.target.value)}
                          placeholder="e.g. ICICI Domestic Current A/C"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          Beneficiary Account Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={bank.beneficiaryName}
                          onChange={e => handleUpdateBankField(bank.id, 'beneficiaryName', e.target.value)}
                          placeholder="MG SUPPLYTECH"
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          Bank Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={bank.bankName}
                          onChange={e => handleUpdateBankField(bank.id, 'bankName', e.target.value)}
                          placeholder="ICICI Bank"
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          Account Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={bank.accountNumber}
                          onChange={e => handleUpdateBankField(bank.id, 'accountNumber', e.target.value)}
                          placeholder="083105004679"
                          className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          Account Type
                        </label>
                        <select
                          value={bank.accountType}
                          onChange={e => handleUpdateBankField(bank.id, 'accountType', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        >
                          <option value="Current Account">Current Account</option>
                          <option value="EEFC / Export Trade Account">EEFC / Export Trade Account</option>
                          <option value="Cash Credit (CC)">Cash Credit (CC)</option>
                          <option value="Savings Account">Savings Account</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          Domestic IFSC Code (NEFT/RTGS)
                        </label>
                        <input
                          type="text"
                          value={bank.ifsc || ''}
                          onChange={e => handleUpdateBankField(bank.id, 'ifsc', e.target.value.toUpperCase())}
                          placeholder="ICIC0000831"
                          className="w-full px-3 py-2 text-xs font-mono uppercase font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          SWIFT / BIC Code (Export Wire Remittance)
                        </label>
                        <input
                          type="text"
                          value={bank.swiftBic || ''}
                          onChange={e => handleUpdateBankField(bank.id, 'swiftBic', e.target.value.toUpperCase())}
                          placeholder="ICICINBB001"
                          className="w-full px-3 py-2 text-xs font-mono uppercase font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          AD Code (Authorized Dealer Code for Customs)
                        </label>
                        <input
                          type="text"
                          value={bank.adCode || ''}
                          onChange={e => handleUpdateBankField(bank.id, 'adCode', e.target.value)}
                          placeholder="0310083"
                          className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                        <p className="text-[9px] text-slate-400 mt-0.5">Required for export shipping bill clearance</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          Domestic UPI VPA / QR ID
                        </label>
                        <input
                          type="text"
                          value={bank.upiId || ''}
                          onChange={e => handleUpdateBankField(bank.id, 'upiId', e.target.value)}
                          placeholder="mgsupplytech@icici"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          Branch Name & Physical Address
                        </label>
                        <input
                          type="text"
                          value={bank.branch || ''}
                          onChange={e => handleUpdateBankField(bank.id, 'branch', e.target.value)}
                          placeholder="Vigyan Vihar, Delhi – 110092, India"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                          Correspondent Bank (For Export Remittance)
                        </label>
                        <input
                          type="text"
                          value={bank.correspondentBank || ''}
                          onChange={e => handleUpdateBankField(bank.id, 'correspondentBank', e.target.value)}
                          placeholder="JPMorgan Chase Bank N.A., New York (CHASUS33)"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMERCIAL TERMS & SEQUENCES */}
      {activeTab === 'terms' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-white/10 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Default Commercial Terms (Domestic vs Export)
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Default Payment Terms (Domestic)
                </label>
                <textarea
                  rows={3}
                  value={settings.defaultPaymentTermsDomestic}
                  onChange={e => setSettingsState({ ...settings, defaultPaymentTermsDomestic: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Default Delivery Terms (Domestic)
                </label>
                <textarea
                  rows={3}
                  value={settings.defaultDeliveryTermsDomestic}
                  onChange={e => setSettingsState({ ...settings, defaultDeliveryTermsDomestic: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Default Payment Terms (Export)
                </label>
                <textarea
                  rows={3}
                  value={settings.defaultPaymentTermsExport}
                  onChange={e => setSettingsState({ ...settings, defaultPaymentTermsExport: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 dark:text-white/70 mb-1">
                  Default Delivery Terms (Export)
                </label>
                <textarea
                  rows={3}
                  value={settings.defaultDeliveryTermsExport}
                  onChange={e => setSettingsState({ ...settings, defaultDeliveryTermsExport: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>
            </div>
          </div>

          {/* Sequential Document Counters */}
          <div className="p-6 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-white/10 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Next Sequential Document Number Counters
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Controls the next auto-generated sequence number for each document workflow stage.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Price Offer (PO)</label>
                <input
                  type="number"
                  value={settings.nextPriceOfferSeq || 1001}
                  onChange={e => setSettingsState({ ...settings, nextPriceOfferSeq: parseInt(e.target.value) || 1001 })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Quotation (QT)</label>
                <input
                  type="number"
                  value={settings.nextQuotationSeq || 1001}
                  onChange={e => setSettingsState({ ...settings, nextQuotationSeq: parseInt(e.target.value) || 1001 })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Proforma (PI)</label>
                <input
                  type="number"
                  value={settings.nextPiSeq || 1001}
                  onChange={e => setSettingsState({ ...settings, nextPiSeq: parseInt(e.target.value) || 1001 })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Tax Invoice (INV)</label>
                <input
                  type="number"
                  value={settings.nextInvoiceSeq || 1001}
                  onChange={e => setSettingsState({ ...settings, nextInvoiceSeq: parseInt(e.target.value) || 1001 })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Challan (DC)</label>
                <input
                  type="number"
                  value={settings.nextChallanSeq || 1001}
                  onChange={e => setSettingsState({ ...settings, nextChallanSeq: parseInt(e.target.value) || 1001 })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#101b19]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MAC INSTALLATION & PACKAGING */}
      {activeTab === 'mac' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="p-6 bg-gradient-to-r from-[#00241E] via-[#003A30] to-[#014136] text-white rounded-2xl shadow-lg border border-[#DFBC64]/30 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DFBC64]/20 border border-[#DFBC64]/40 flex items-center justify-center text-[#DFBC64]">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.79-11.97-14.24-6.43-9.79-11.45-20.73-15.06-32.81-3.61-12.09-5.42-23.77-5.42-35.04 0-14.89 3.82-27.26 11.45-37.1 7.64-9.84 17.15-14.86 28.53-15.06 4.9.11 10.23 1.34 16 3.7 5.77 2.36 9.57 3.6 11.4 3.73 2.53-.13 6.44-1.42 11.75-3.87 5.3-2.45 10.37-3.63 15.2-3.56 12.09.65 21.84 5.39 29.25 14.21-10.78 6.53-16.06 15.54-15.84 27.02.22 9.03 3.63 16.64 10.23 22.84 6.6 6.2 14.53 9.79 23.8 10.77-2.39 7.08-5.18 14.07-8.37 20.97zM119.22 31.84c0-7.39 2.65-14.38 7.95-20.97 5.3-6.59 11.9-10.87 19.8-12.83.22 1.3.33 2.45.33 3.44 0 7.39-2.73 14.51-8.19 21.36-5.46 6.85-12.08 11.12-19.89 12.82v-3.82z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-black tracking-tight">Package & Install on Apple Mac</h3>
                  <span className="text-[10px] bg-[#DFBC64]/20 text-[#DFBC64] px-2 py-0.5 rounded-full font-bold uppercase border border-[#DFBC64]/40">
                    macOS Native
                  </span>
                </div>
                <p className="text-xs text-white/80 max-w-xl">
                  Run MG Supplytech as an installed desktop app in your Mac Dock and Applications folder, or download a standalone offline local runner bundle.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isInstallable && (
                  <button
                    onClick={install}
                    className="px-4 py-2 bg-[#DFBC64] hover:bg-[#c9a64f] text-[#00241E] font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Laptop className="w-4 h-4" />
                    Install to Mac Dock
                  </button>
                )}

                <button
                  onClick={handleDownloadMacZip}
                  disabled={isPackaging}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FolderDown className="w-4 h-4 text-[#DFBC64]" />
                  {isPackaging ? 'Generating Mac Zip...' : 'Download Mac Bundle (.zip)'}
                </button>
              </div>
            </div>

            {downloadSuccess && (
              <div className="mt-3 p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Downloaded MG-Supplytech-Mac-Local.zip! Extract and double-click Start-MG-Supplytech.command to run.
              </div>
            )}
          </div>

          {/* 3 Packaging & Installation Routes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: 1-Click Mac App via Safari / Chrome */}
            <div className="p-5 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-[#014136] dark:text-[#DFBC64] mb-2">
                  <Laptop className="w-4 h-4 text-[#B88C2E]" />
                  <h4>Method 1: Direct macOS App (Dock)</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                  Converts the studio into a native macOS <b>.app</b> in <code className="bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded font-mono">~/Applications</code> with Dock icon and isolated offline database.
                </p>

                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-2.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl">
                    <div className="font-bold text-[#014136] dark:text-[#DFBC64] mb-1">In Safari (macOS Sonoma / Sequoia):</div>
                    <div>Click <b>File</b> &gt; <b>Add to Dock...</b> and press <b>Add</b>.</div>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl">
                    <div className="font-bold text-[#014136] dark:text-[#DFBC64] mb-1">In Chrome / Brave / Edge:</div>
                    <div>Click the <b>Install ⊕</b> icon in the address bar.</div>
                  </div>
                </div>
              </div>

              {isInstalled ? (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Standalone Mac App active
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500">
                  Runs independently without browser tabs
                </div>
              )}
            </div>

            {/* Card 2: Standalone Zip Package */}
            <div className="p-5 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-[#014136] dark:text-[#DFBC64] mb-2">
                  <FolderDown className="w-4 h-4 text-[#B88C2E]" />
                  <h4>Method 2: Mac Offline Package</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                  Download a complete offline package containing a double-clickable macOS launcher script and local server.
                </p>

                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-2.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl font-mono text-[11px]">
                    <div>1. Extract zip file</div>
                    <div>2. chmod +x Start-MG-Supplytech.command</div>
                    <div>3. Double-click to launch on Mac</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={handleDownloadMacZip}
                  disabled={isPackaging}
                  className="w-full py-2 bg-[#014136] hover:bg-[#003A30] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FolderDown className="w-3.5 h-3.5 text-[#DFBC64]" />
                  {isPackaging ? 'Preparing Zip...' : 'Download Mac Package'}
                </button>
              </div>
            </div>

            {/* Card 3: Terminal Quickstart */}
            <div className="p-5 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-[#014136] dark:text-[#DFBC64] mb-2">
                  <Terminal className="w-4 h-4 text-[#B88C2E]" />
                  <h4>Method 3: Terminal / CLI</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                  Run directly on your Mac using standard Node.js & npm tooling.
                </p>

                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] space-y-1 relative">
                  <div>npm install</div>
                  <div>npm run dev</div>
                  <button
                    onClick={() => copyToClipboard('npm install && npm run dev', 10)}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"
                    title="Copy commands"
                  >
                    {copiedIndex === 10 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500">
                Compatible with Apple Silicon M1/M2/M3/M4 & Intel
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LOGIN CREDENTIALS & GITHUB SYNC */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-[#00241E] via-[#003A30] to-[#014136] rounded-2xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#DFBC64] mb-1">
                <Lock className="w-4 h-4 text-[#DFBC64]" />
                Security &amp; Source Code Deployment
              </div>
              <h3 className="text-xl font-black font-['Playfair_Display',Georgia,serif]">
                Login Credentials &amp; GitHub Sync
              </h3>
              <p className="text-xs text-white/80 max-w-xl mt-1 leading-relaxed">
                Protect your document studio with administrative Login ID &amp; Password, and push the full repository to GitHub as <b>mg-supplytech-document-maker</b>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowGitHubModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DFBC64] hover:bg-[#B88C2E] text-[#003A30] font-black text-xs uppercase tracking-wider transition shadow-md"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Push to GitHub Assistant</span>
            </button>
          </div>

          {/* Feedback messages */}
          {authStatusMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authStatusMsg}</span>
            </div>
          )}
          {authStatusError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 rounded-xl text-xs font-bold text-red-900 dark:text-red-200 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{authStatusError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Change Login ID & Password */}
            <div className="p-6 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="p-2 rounded-xl bg-[#003A30] text-[#DFBC64]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                    Update Login ID &amp; Password
                  </h4>
                  <p className="text-xs text-slate-500">
                    Modify the credentials used to log into this commercial application.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Login ID / Admin Email
                  </label>
                  <input
                    type="text"
                    value={loginIdSetting}
                    onChange={(e) => setLoginIdSetting(e.target.value)}
                    placeholder="e.g. info@mgsupplytech.com or admin"
                    className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003A30]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Current Password (Required for verification)
                  </label>
                  <input
                    type="password"
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003A30]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      New Password (Optional)
                    </label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003A30]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-[#152220] border border-slate-200 dark:border-[#2a3f3b] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003A30]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setAuthStatusMsg(null);
                    setAuthStatusError(null);
                    if (!currentPasswordInput) {
                      setAuthStatusError('Please enter your current password to confirm changes.');
                      return;
                    }
                    if (newPasswordInput && newPasswordInput !== confirmPasswordInput) {
                      setAuthStatusError('New password and confirmation do not match.');
                      return;
                    }

                    const res = await authService.updateCredentials(
                      currentPasswordInput,
                      loginIdSetting,
                      newPasswordInput || undefined
                    );

                    if (res.success) {
                      setAuthStatusMsg(res.message);
                      setCurrentPasswordInput('');
                      setNewPasswordInput('');
                      setConfirmPasswordInput('');
                      setTimeout(() => setAuthStatusMsg(null), 5000);
                    } else {
                      setAuthStatusError(res.message);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#003A30] hover:bg-[#014136] text-[#DFBC64] hover:text-white font-bold text-xs uppercase tracking-wider transition shadow"
                >
                  Save &amp; Update Login Credentials
                </button>
              </div>

              {/* Standard Default Credentials Reference */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/10 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Default Master Credentials Reference:
                </span>
                <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 space-y-0.5">
                  <div>Login ID: <b>{DEFAULT_AUTH_CONFIG.defaultLoginId}</b> (or <b>admin</b>)</div>
                  <div>Password: <b>{DEFAULT_AUTH_CONFIG.defaultPassword}</b></div>
                </div>
              </div>
            </div>

            {/* Card 2: GitHub Repository Push Assistant */}
            <div className="p-6 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-white/10">
                  <div className="p-2 rounded-xl bg-slate-900 text-[#DFBC64]">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                      GitHub Source Code Repository
                    </h4>
                    <p className="text-xs text-slate-500">
                      Export codebase to your personal or company GitHub account.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl text-slate-100 text-xs font-mono space-y-2">
                  <div className="text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                    <span>Repository Name: mg-supplytech-document-maker</span>
                    <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[9px]">Main Branch</span>
                  </div>
                  <div className="text-slate-400 text-[10.5px]">
                    # One-line push command:
                  </div>
                  <code className="block bg-black/40 p-2 rounded text-[11px] text-amber-300 break-all select-all">
                    git remote add origin https://github.com/YOUR_USER/mg-supplytech-document-maker.git && git branch -M main && git push -u origin main
                  </code>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                  <div>✅ <b>Git Initialized:</b> Clean commit history created locally.</div>
                  <div>✅ <b>Mac Double-Click Script:</b> Run <code>push-to-github.command</code> right from your downloaded package.</div>
                  <div>✅ <b>Complete Source Code:</b> Includes all templates, PDF engine, PWA, and auth.</div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowGitHubModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow"
                >
                  <FolderGit2 className="w-4 h-4 text-[#DFBC64]" />
                  <span>Launch GitHub Push Assistant</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Push Modal */}
      <GitHubPushModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
      />

      {/* Bottom Floating Save Button Bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-[#121f1d] rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60">
          <Sparkles className="w-4 h-4 text-[#B88C2E] dark:text-[#DFBC64]" />
          <span>All updates immediately reflect across live invoices, print PDFs, and exports.</span>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#014136] hover:bg-[#003A30] text-white font-bold text-xs shadow-md transition"
        >
          {saveSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4 text-[#DFBC64]" />}
          <span>{saveSuccess ? 'Changes Saved!' : 'Save All Settings'}</span>
        </button>
      </div>
    </div>
  );
};
