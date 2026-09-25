import React, { useState, useEffect } from 'react';
import { 
  AppSettings,
  Customer, 
  DocumentRecord, 
  InventoryItem 
} from './types';
import { 
  createInitialDocument, 
  getSettings, 
  saveSettings, 
  saveDocument 
} from './services/storageService';
import { CANONICAL_SELLER } from './constants/brand';
import { MGLogo } from './components/brand/BrandLogos';
import { DocumentView } from './components/documents/DocumentView';
import { DocumentEditor } from './components/editor/DocumentEditor';
import { DocumentArchiveView } from './components/documents/DocumentArchiveView';
import { CustomersView } from './components/customers/CustomersView';
import { InventoryView } from './components/inventory/InventoryView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { AIChatDrawer } from './components/ai/AIChatDrawer';
import { EmailModal } from './components/email/EmailModal';
import { CloudSyncModal } from './components/sync/CloudSyncModal';
import { ImportExportModal } from './components/data/ImportExportModal';
import { PWAInstallButton, OfflineIndicator } from './components/pwa/PWAInstallButton';
import { LoginView } from './components/auth/LoginView';
import { GitHubPushModal } from './components/github/GitHubPushModal';
import { authService } from './services/authService';
import { AuthUser } from './types';
import { 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Archive, 
  Settings,
  Sun, 
  Moon, 
  Sparkles, 
  Cloud, 
  CloudOff, 
  Database, 
  Eye, 
  Edit3, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Check,
  Menu,
  X,
  ExternalLink,
  Printer,
  LogOut,
  FolderGit2,
  Lock,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentSession()?.user || null);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'archive' | 'customers' | 'inventory' | 'reports' | 'settings'>('editor');
  const [currentDoc, setCurrentDoc] = useState<DocumentRecord>(() => createInitialDocument('quotation'));
  const [previewZoom, setPreviewZoom] = useState<number>(0.85);
  const [mobileViewMode, setMobileViewMode] = useState<'edit' | 'preview'>('edit');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => getSettings());

  // Listen to cross-system settings or data changes to live update document views
  useEffect(() => {
    const handleDataChange = (e: any) => {
      if (e.detail?.type === 'settings' || !e.detail?.type) {
        setAppSettings(getSettings());
      }
    };
    window.addEventListener('mg_data_change', handleDataChange);
    return () => window.removeEventListener('mg_data_change', handleDataChange);
  }, []);

  // Modals state
  const [showAiChat, setShowAiChat] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showCloudSync, setShowCloudSync] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const s = getSettings();
    return s.darkMode || false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const s = getSettings();
    saveSettings({ ...s, darkMode });
  }, [darkMode]);

  const handleApplyAiDoc = (partialDoc: Partial<DocumentRecord>) => {
    setCurrentDoc(prev => ({
      ...prev,
      ...partialDoc,
      updatedAt: new Date().toISOString()
    }));
    setActiveTab('editor');
  };

  const handleSelectCustomerForQuote = (cust: Customer) => {
    const isExp = cust.country.toLowerCase() !== 'india';
    const updated: DocumentRecord = {
      ...currentDoc,
      customerId: cust.id,
      customerName: cust.companyName,
      customerContact: cust.mobile,
      customerAddress: cust.address,
      customerCity: cust.city,
      customerState: cust.state,
      customerCountry: cust.country,
      customerTaxId: cust.gstin,
      customerEmail: cust.email,
      isExport: isExp,
      paymentTerms: cust.rememberedTerms?.paymentTerms || currentDoc.paymentTerms,
      deliveryTerms: cust.rememberedTerms?.deliveryTerms || currentDoc.deliveryTerms,
      incoterm: cust.rememberedTerms?.incoterm || currentDoc.incoterm,
      currency: cust.rememberedTerms?.currency || (isExp ? 'USD' : 'INR')
    };
    setCurrentDoc(updated);
    setActiveTab('editor');
  };

  const handleAddItemFromCatalog = (item: InventoryItem) => {
    const newItem = {
      id: `item-${Date.now()}`,
      description: item.name,
      hsnSac: item.hsnSac,
      qty: 1,
      uom: item.defaultUom,
      unitPrice: item.basePrice,
      packSize: item.packSize,
      taxRate: currentDoc.isExport ? 0 : item.defaultTaxRate,
      discountPercent: 0
    };
    setCurrentDoc(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setActiveTab('editor');
  };

  const isFirebaseEnabled = getSettings().firebaseConfig?.enabled;

  // Gatekeeper: Require Login ID & Password before accessing commercial studio
  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0D1614] text-slate-900 dark:text-[#E3ECE8] flex flex-col font-sans transition-colors duration-200">
      {/* Top Application Bar - Clean light surface with brand accent banner */}
      <header className="app-header relative bg-white dark:bg-[#111C1A] text-slate-800 dark:text-[#E3ECE8] border-b border-slate-200 dark:border-[#223531] px-4 py-2.5 sticky top-0 z-40 shadow-xs">
        {/* Top 3px Brand Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#014136] via-[#DFBC64] to-[#014136]"></div>

        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-3 pt-0.5">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 dark:text-white/80 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('editor')}>
              <MGLogo size={36} variant="original" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-sm tracking-tight font-['Playfair_Display',Georgia,serif] text-[#014136] dark:text-white">
                    MG
                  </span>
                  <span className="font-black text-sm tracking-wider font-['Plus_Jakarta_Sans',sans-serif] text-[#B88C2E] dark:text-[#DFBC64]">
                    SUPPLYTECH
                  </span>
                </div>
                <span className="text-[8.5px] font-bold tracking-[0.18em] text-[#65716D] dark:text-[#DFBC64]/80 uppercase mt-0.5">
                  DOCUMENT MAKER &bull; COMMERCIAL SUITE
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs - Crisp Light Pill Group */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-[#182624] p-1 rounded-xl border border-slate-200/80 dark:border-white/5">
            {[
              { id: 'editor', label: 'Document Studio', icon: FileText },
              { id: 'archive', label: 'Archive', icon: Archive },
              { id: 'customers', label: 'Customer Master', icon: Users },
              { id: 'inventory', label: 'Product Catalog', icon: Package },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'settings', label: 'Company & Bank Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    active
                      ? 'bg-white dark:bg-[#101b19] text-[#014136] dark:text-[#DFBC64] shadow-xs border border-slate-200/60 dark:border-transparent'
                      : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Install on Mac / PWA Standalone Button */}
            <PWAInstallButton />

            {/* Cloud Sync Status Indicator */}
            <button
              onClick={() => setShowCloudSync(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                isFirebaseEnabled
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-500/40'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70 dark:bg-white/5 dark:text-white/70 dark:border-white/10'
              }`}
              title="Cloud Sync settings with Firebase"
            >
              {isFirebaseEnabled ? <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <CloudOff className="w-3.5 h-3.5 text-slate-500 dark:text-white/50" />}
              <span className="hidden sm:inline">{isFirebaseEnabled ? 'Cloud Sync Online' : 'Local Offline'}</span>
            </button>

            {/* AI Assistant Button */}
            <button
              onClick={() => setShowAiChat(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DFBC64]/20 hover:bg-[#DFBC64]/35 text-[#014136] dark:text-[#DFBC64] border border-[#DFBC64]/40 font-bold text-xs transition"
              title="MG Supplytech AI Commercial Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B88C2E] dark:text-[#DFBC64]" />
              <span className="hidden md:inline">AI Commercial</span>
            </button>

            {/* Data Hub */}
            <button
              onClick={() => setShowImportExport(true)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/80 border border-slate-200 dark:border-white/10 transition"
              title="Import & Export CSV/JSON"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Push to GitHub */}
            <button
              onClick={() => setShowGitHubModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 transition"
              title="Push project to GitHub (mg-supplytech-document-maker)"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-[#DFBC64]" />
              <span className="hidden md:inline">Push to GitHub</span>
            </button>

            {/* Company & Bank Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-1.5 rounded-lg border transition ${
                activeTab === 'settings'
                  ? 'bg-[#014136] text-white border-[#014136]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white/80 border-slate-200 dark:border-white/10'
              }`}
              title="Company Details, Logo, GST, IEC & Bank Accounts"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-[#DFBC64] border border-slate-200 dark:border-white/10 transition"
              title="Toggle Dark / Light Mode"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-white/10">
              <button
                onClick={() => {
                  if (window.confirm("Do you want to sign out of MG Supplytech Commercial Suite?")) {
                    authService.logout();
                    setCurrentUser(null);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 dark:bg-white/5 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-200 text-xs font-bold transition border border-slate-200 dark:border-white/10"
                title={`Signed in as ${currentUser?.displayName} (${currentUser?.loginId}). Click to sign out.`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="hidden xl:inline">{currentUser?.displayName?.split(' ')[0] || 'Admin'}</span>
                <LogOut className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-3 pb-1 border-t border-slate-200 dark:border-white/10 mt-2 space-y-1">
            {[
              { id: 'editor', label: 'Document Studio', icon: FileText },
              { id: 'archive', label: 'Archive', icon: Archive },
              { id: 'customers', label: 'Customer Master', icon: Users },
              { id: 'inventory', label: 'Product Catalog', icon: Package },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'settings', label: 'Company & Bank Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition ${
                    active
                      ? 'bg-[#014136] text-white shadow-xs'
                      : 'text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-4 lg:p-6">
        {activeTab === 'editor' && (
          <div className="space-y-4">
            {/* Mobile / Tablet Toggle between Form and Live Preview */}
            <div className="xl:hidden flex items-center justify-between p-2 bg-white dark:bg-[#152220] rounded-xl border border-slate-200 dark:border-[#223531]">
              <div className="flex gap-2">
                <button
                  onClick={() => setMobileViewMode('edit')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mobileViewMode === 'edit'
                      ? 'bg-[#014136] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => setMobileViewMode('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    mobileViewMode === 'preview'
                      ? 'bg-[#014136] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>A4 Print Preview</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-[#014136] dark:text-[#DFBC64] font-bold">
                {currentDoc.docNumber}
              </div>
            </div>

            {/* Main Split-Screen Workspace (Desktop) */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1fr] gap-6 items-start">
              {/* Left Column: Form Editor */}
              <div className={`${mobileViewMode === 'preview' ? 'hidden xl:block' : 'block'}`}>
                <DocumentEditor
                  currentDoc={currentDoc}
                  onChange={(updated) => setCurrentDoc(updated)}
                  onOpenEmail={() => setShowEmailModal(true)}
                  onOpenAiChat={() => setShowAiChat(true)}
                />
              </div>

              {/* Right Column: Live A4 Document Preview */}
              <div className={`${mobileViewMode === 'edit' ? 'hidden xl:block' : 'block'} sticky top-16`}>
                <div className="bg-slate-100 dark:bg-[#101b19] rounded-2xl border border-slate-200 dark:border-[#223531] p-3 shadow-inner flex flex-col">
                  {/* Preview Toolbar */}
                  <div className="flex items-center justify-between pb-3 px-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold uppercase text-[10px] tracking-wider text-[#014136] dark:text-[#DFBC64]">
                        A4 Print Preview
                      </span>
                      <span className="text-[10px] text-[#65716D] hidden sm:inline">
                        (Exact @page A4 boundaries &amp; fixed footer)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewZoom(z => Math.max(0.6, z - 0.05))}
                        className="p-1 bg-white dark:bg-[#152220] rounded border border-[#D9DEDB] dark:border-[#2a3f3b] text-[#43504B] hover:text-[#014136]"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono w-10 text-center text-[#65716D]">
                        {Math.round(previewZoom * 100)}%
                      </span>
                      <button
                        onClick={() => setPreviewZoom(z => Math.min(1.2, z + 0.05))}
                        className="p-1 bg-white dark:bg-[#152220] rounded border border-[#D9DEDB] dark:border-[#2a3f3b] text-[#43504B] hover:text-[#014136]"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPreviewZoom(0.85)}
                        className="p-1 bg-white dark:bg-[#152220] rounded border border-[#D9DEDB] dark:border-[#2a3f3b] text-[#43504B] hover:text-[#014136]"
                        title="Reset Zoom"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scaled Preview Frame */}
                  <div className="overflow-x-auto overflow-y-auto max-h-[82vh] flex justify-center p-3 rounded-xl bg-slate-200/60 dark:bg-[#080d0c] border border-slate-200 dark:border-white/5">
                    <div 
                      style={{ 
                        transform: `scale(${previewZoom})`, 
                        transformOrigin: 'top center',
                        marginBottom: `calc((297mm * ${previewZoom}) - 297mm)`
                      }}
                      className="transition-transform duration-100 shadow-xl"
                    >
                      <DocumentView document={currentDoc} settings={appSettings} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents Archive Tab */}
        {activeTab === 'archive' && (
          <DocumentArchiveView
            onLoadDocIntoEditor={(doc) => {
              setCurrentDoc(doc);
              setActiveTab('editor');
            }}
            onOpenEmail={(doc) => {
              setCurrentDoc(doc);
              setShowEmailModal(true);
            }}
          />
        )}

        {/* Customer Master Tab */}
        {activeTab === 'customers' && (
          <CustomersView
            onSelectCustomerForQuote={handleSelectCustomerForQuote}
          />
        )}

        {/* Product Catalog Tab */}
        {activeTab === 'inventory' && (
          <InventoryView
            onAddItemToActiveDoc={handleAddItemFromCatalog}
          />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsView />
        )}

        {/* Company Identity & Bank Account Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsView
            onNavigateToStudio={() => setActiveTab('editor')}
          />
        )}
      </main>

      {/* Persistent Hidden Print Container for Clean Native Printing */}
      <div className="hidden print:block print-area">
        <DocumentView document={currentDoc} printMode={true} settings={appSettings} />
      </div>

      {/* Modals & Drawers */}
      <AIChatDrawer
        isOpen={showAiChat}
        onClose={() => setShowAiChat(false)}
        currentDoc={currentDoc}
        onApplyDoc={handleApplyAiDoc}
      />

      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        document={currentDoc}
      />

      <CloudSyncModal
        isOpen={showCloudSync}
        onClose={() => setShowCloudSync(false)}
      />

      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
      />

      <GitHubPushModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
      />

      {/* Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}
