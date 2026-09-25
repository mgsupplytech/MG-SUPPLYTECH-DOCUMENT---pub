import React, { useState, useEffect } from 'react';
import { 
  DocumentRecord, 
  DocumentType, 
  DocumentItem, 
  Customer, 
  InventoryItem 
} from '../../types';
import { 
  calculateDocumentTotals, 
  formatCurrency, 
  getCustomers, 
  getCurrencyForCountry, 
  getInventory, 
  generateNextDocNumber, 
  isExportCountry, 
  numberToWords, 
  saveDocument, 
  upsertCustomer,
  convertDocumentToStage,
  getSettings,
  getDocumentBankAccount,
  getEffectiveCompanyProfile
} from '../../services/storageService';
import { DOCUMENT_WORKFLOW_STAGES } from '../../constants/brand';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Download, 
  Mail, 
  Sparkles, 
  ExternalLink, 
  Save, 
  Copy, 
  FileText, 
  Search, 
  Check, 
  AlertCircle,
  Globe,
  Truck,
  Building2,
  Coins,
  History,
  ArrowRight,
  ArrowUpRight,
  Shuffle
} from 'lucide-react';
import { downloadDocumentHtml, openDocumentInNewTab } from '../../utils/exportHtml';
import { 
  getStandardizedPdfName, 
  printDocumentWithStandardName, 
  copyStandardizedFileName 
} from '../../utils/documentNaming';
import { VersionHistoryModal } from '../documents/VersionHistoryModal';

interface DocumentEditorProps {
  currentDoc: DocumentRecord;
  onChange: (doc: DocumentRecord) => void;
  onOpenEmail: () => void;
  onOpenAiChat: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  currentDoc,
  onChange,
  onOpenEmail,
  onOpenAiChat
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    setCustomers(getCustomers());
    setInventory(getInventory());
  }, []);

  const handleDocTypeChange = (type: DocumentType) => {
    const updated = {
      ...currentDoc,
      docType: type,
      docNumber: generateNextDocNumber(type)
    };
    onChange(updated);
  };

  const handleCustomerSelect = (cust: Customer) => {
    const isExp = isExportCountry(cust.country);
    const currency = getCurrencyForCountry(cust.country);
    
    // Remembered Terms Policy: recall confirmed terms for this exact customer
    const rem = cust.rememberedTerms || {};

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
      currency: rem.currency || currency,
      paymentTerms: rem.paymentTerms || currentDoc.paymentTerms,
      deliveryTerms: rem.deliveryTerms || currentDoc.deliveryTerms,
      freightInsurance: rem.freightInsurance || currentDoc.freightInsurance,
      incoterm: rem.incoterm || currentDoc.incoterm || (isExp ? 'FOB Mundra Port' : undefined)
    };

    const totals = calculateDocumentTotals(updated.items, isExp);
    updated.subtotal = totals.subtotal;
    updated.discountTotal = totals.discountTotal;
    updated.taxTotal = totals.taxTotal;
    updated.grandTotal = totals.grandTotal;
    updated.amountInWords = numberToWords(totals.grandTotal, updated.currency);

    onChange(updated);
    setShowCustomerDropdown(false);
    setCustomerSearch('');
  };

  const handleItemChange = (index: number, field: keyof DocumentItem, value: any) => {
    const newItems = [...currentDoc.items];
    newItems[index] = { ...newItems[index], [field]: value };

    const totals = calculateDocumentTotals(newItems, currentDoc.isExport);
    const updated: DocumentRecord = {
      ...currentDoc,
      items: newItems,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      amountInWords: numberToWords(totals.grandTotal, currentDoc.currency)
    };
    onChange(updated);
  };

  const addItemFromInventory = (invItem: InventoryItem) => {
    const newItem: DocumentItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      description: invItem.name,
      hsnSac: invItem.hsnSac,
      qty: 1,
      uom: invItem.defaultUom,
      unitPrice: invItem.basePrice,
      packSize: invItem.packSize,
      taxRate: currentDoc.isExport ? 0 : invItem.defaultTaxRate,
      discountPercent: 0,
      notes: invItem.description
    };

    const newItems = [...currentDoc.items, newItem];
    const totals = calculateDocumentTotals(newItems, currentDoc.isExport);
    onChange({
      ...currentDoc,
      items: newItems,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      amountInWords: numberToWords(totals.grandTotal, currentDoc.currency)
    });
  };

  const addNewBlankItem = () => {
    const newItem: DocumentItem = {
      id: `item-${Date.now()}`,
      description: '',
      hsnSac: '6804',
      qty: 1,
      uom: 'PCS',
      unitPrice: 0,
      discountPercent: 0,
      taxRate: currentDoc.isExport ? 0 : 18,
      packSize: 'Standard'
    };
    const newItems = [...currentDoc.items, newItem];
    onChange({ ...currentDoc, items: newItems });
  };

  const removeItem = (index: number) => {
    if (currentDoc.items.length <= 1) return;
    const newItems = currentDoc.items.filter((_, i) => i !== index);
    const totals = calculateDocumentTotals(newItems, currentDoc.isExport);
    onChange({
      ...currentDoc,
      items: newItems,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      amountInWords: numberToWords(totals.grandTotal, currentDoc.currency)
    });
  };

  const handleSave = () => {
    saveDocument(currentDoc);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const [showConvertDropdown, setShowConvertDropdown] = useState(false);
  const [conversionToast, setConversionToast] = useState<string | null>(null);
  const [copiedFileName, setCopiedFileName] = useState(false);
  const [showConsigneeSection, setShowConsigneeSection] = useState(Boolean(currentDoc.consigneeName));

  const currentWorkflowStage = DOCUMENT_WORKFLOW_STAGES.find(s => s.type === currentDoc.docType);
  const currentStageIndex = DOCUMENT_WORKFLOW_STAGES.findIndex(s => s.type === currentDoc.docType);

  const handlePipelineConvert = (targetType: DocumentType) => {
    const converted = convertDocumentToStage(currentDoc, targetType, true);
    onChange(converted);
    setShowConvertDropdown(false);
    const targetStage = DOCUMENT_WORKFLOW_STAGES.find(s => s.type === targetType);
    const stageName = targetStage ? targetStage.label : targetType;
    setConversionToast(`Transformed into ${stageName} (${converted.docNumber})! Line item descriptions, pack sizes, specifications, and customer data preserved.`);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
    setTimeout(() => {
      setConversionToast(null);
    }, 4500);
  };

  const isPriceOffer = currentDoc.docType === 'price-offer';
  const isLetterhead = currentDoc.docType === 'letterhead';

  return (
    <div className="bg-white dark:bg-[#152220] rounded-2xl border border-slate-200 dark:border-[#223531] shadow-xs p-4 md:p-6 space-y-5">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#223531]">
        {/* Document Format Tabs in Standard Workflow Order */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-[#101b19] p-1 rounded-xl border border-slate-200/80 dark:border-white/5">
          {(['price-offer', 'quotation', 'proforma-invoice', 'tax-invoice', 'delivery-challan', 'letterhead'] as DocumentType[]).map((type) => {
            const labels: Record<DocumentType, string> = {
              'price-offer': '1. Price Offer',
              'quotation': '2. Quotation',
              'proforma-invoice': '3. Proforma Inv',
              'tax-invoice': '4. Tax Invoice',
              'delivery-challan': '5. Delivery Challan',
              'letterhead': 'Letterhead'
            };
            const active = currentDoc.docType === type;
            return (
              <button
                key={type}
                onClick={() => handleDocTypeChange(type)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  active 
                    ? 'bg-[#014136] text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/70 dark:hover:bg-white/5'
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Prominent 'Convert To' Button with Workflow Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowConvertDropdown(!showConvertDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#014136] hover:bg-[#002e27] text-white font-bold text-xs shadow-xs transition"
              title="Convert this document into another stage while preserving item data"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#DFBC64]" />
              <span>Convert To ▾</span>
            </button>

            {showConvertDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-[#162522] border border-slate-200 dark:border-[#2a3f3b] rounded-xl shadow-xl z-50 p-2 text-xs space-y-1">
                <div className="px-2 py-1 border-b border-slate-100 dark:border-white/5 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">
                  Transform Workflow Stage
                </div>
                
                {/* Next recommended stage quick conversion */}
                {currentWorkflowStage?.nextType && (
                  <button
                    onClick={() => handlePipelineConvert(currentWorkflowStage.nextType!)}
                    className="w-full text-left p-2 rounded-lg bg-[#014136]/10 dark:bg-[#DFBC64]/10 hover:bg-[#014136]/20 border border-[#014136]/30 flex items-center justify-between font-bold text-[#014136] dark:text-[#DFBC64]"
                  >
                    <span>⚡ Next: {currentWorkflowStage.nextActionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#DFBC64]" />
                  </button>
                )}

                <div className="pt-1 text-[10px] text-slate-400 font-semibold px-2 uppercase tracking-wider">
                  All Pipeline Stages (Items Preserved)
                </div>

                {DOCUMENT_WORKFLOW_STAGES.map((stg) => {
                  const isCurrent = currentDoc.docType === stg.type;
                  return (
                    <button
                      key={stg.type}
                      disabled={isCurrent}
                      onClick={() => handlePipelineConvert(stg.type)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition ${
                        isCurrent 
                          ? 'bg-slate-100 text-slate-400 dark:bg-white/5 cursor-default' 
                          : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-medium'
                      }`}
                    >
                      <span>{stg.stepNumber}. {stg.label}</span>
                      {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold">Current</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={onOpenAiChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DFBC64]/20 hover:bg-[#DFBC64]/35 text-[#014136] dark:text-[#DFBC64] border border-[#DFBC64]/40 font-bold text-xs transition"
            title="Ask AI to draft quotation or enhance terms"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B88C2E] dark:text-[#DFBC64]" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setShowVersionHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#1a2b28] dark:text-[#DFBC64] font-bold text-xs border border-slate-200 dark:border-[#2a3f3b] transition"
            title="Version History & Visual Comparison Timeline"
          >
            <History className="w-3.5 h-3.5 text-[#014136] dark:text-[#DFBC64]" />
            <span>v{currentDoc.version || currentDoc.versions?.length || 1} Timeline</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#014136] hover:bg-[#002e27] text-white font-bold text-xs shadow-xs transition"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5 text-[#DFBC64]" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={() => {
              const standardName = printDocumentWithStandardName(currentDoc);
              setConversionToast(`Printing with standardized PDF filing name: ${standardName}`);
              setTimeout(() => setConversionToast(null), 4000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#1a2b28] dark:text-[#DFBC64] font-bold text-xs border border-slate-200 dark:border-[#2a3f3b] transition"
            title={`Print or Save as PDF: ${getStandardizedPdfName(currentDoc)}`}
          >
            <Printer className="w-3.5 h-3.5 text-[#014136] dark:text-[#DFBC64]" />
            <span>Print PDF</span>
          </button>

          <button
            onClick={() => downloadDocumentHtml(currentDoc)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#1a2b28] dark:text-[#E3ECE8] font-semibold text-xs border border-slate-200 dark:border-[#2a3f3b] transition"
            title="Download Standalone HTML file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HTML</span>
          </button>

          <button
            onClick={onOpenEmail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#1a2b28] dark:text-[#DFBC64] font-bold text-xs border border-slate-200 dark:border-[#2a3f3b] transition"
            title="Direct Email to Customer"
          >
            <Mail className="w-3.5 h-3.5 text-[#014136] dark:text-[#DFBC64]" />
            <span>Email</span>
          </button>

          <button
            onClick={() => openDocumentInNewTab(currentDoc)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-[#1a2b28] dark:text-slate-300 dark:border-[#2a3f3b]"
            title="Open Document in Full Clean Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversion Confirmation Toast */}
      {conversionToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{conversionToast}</span>
          </div>
          <button onClick={() => setConversionToast(null)} className="text-emerald-700 hover:text-emerald-950 text-xs font-bold shrink-0 ml-2">✕</button>
        </div>
      )}

      {/* Commercial Workflow Progression Stepper: Price Offer ➔ Quotation ➔ Proforma Invoice ➔ Tax Invoice ➔ Delivery Challan */}
      <div className="bg-slate-50 dark:bg-[#121f1d] border border-slate-200 dark:border-[#223531] rounded-xl p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Commercial Workflow Pipeline
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Price Offer &bull; Quotation &bull; Proforma &bull; Tax Invoice &bull; Delivery Challan)
            </span>
          </div>

          {currentWorkflowStage?.nextType && (
            <button
              onClick={() => handlePipelineConvert(currentWorkflowStage.nextType!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#014136] hover:bg-[#002e27] text-white shadow-xs transition"
              title={`Progress this document to ${currentWorkflowStage.nextActionLabel}`}
            >
              <span>{currentWorkflowStage.nextActionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#DFBC64]" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DOCUMENT_WORKFLOW_STAGES.map((stage) => {
            const isCurrent = currentDoc.docType === stage.type;
            const isPassed = currentStageIndex > -1 && currentStageIndex > stage.stepNumber - 1;
            return (
              <button
                key={stage.type}
                type="button"
                onClick={() => {
                  if (!isCurrent) {
                    handlePipelineConvert(stage.type);
                  }
                }}
                className={`text-left p-2 rounded-lg border transition ${
                  isCurrent
                    ? 'bg-white dark:bg-[#182926] border-[#014136] dark:border-[#DFBC64] shadow-xs'
                    : isPassed
                      ? 'bg-slate-100/70 dark:bg-white/5 border-emerald-200 text-slate-600 hover:bg-white'
                      : 'bg-white/60 dark:bg-white/5 border-slate-200 text-slate-400 hover:bg-white hover:text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isCurrent ? 'text-[#014136] dark:text-[#DFBC64]' : isPassed ? 'text-emerald-700' : 'text-slate-500'
                  }`}>
                    {stage.stepNumber}. {stage.shortLabel}
                  </span>
                  {isPassed && <Check className="w-3 h-3 text-emerald-600" />}
                  {isCurrent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#DFBC64]"></span>}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                  {stage.prefix} &bull; {stage.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Metadata Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Document Number & Date */}
        <div>
          <label className="block text-xs font-bold text-[#43504B] dark:text-[#a2b5b0] uppercase mb-1">
            Doc Number
          </label>
          <input
            type="text"
            value={currentDoc.docNumber}
            onChange={(e) => onChange({ ...currentDoc, docNumber: e.target.value })}
            className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DFBC64]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#43504B] dark:text-[#a2b5b0] uppercase mb-1">
            Date (India)
          </label>
          <input
            type="date"
            value={currentDoc.date}
            onChange={(e) => onChange({ ...currentDoc, date: e.target.value })}
            className="w-full px-3 py-2 text-xs font-mono bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DFBC64]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#43504B] dark:text-[#a2b5b0] uppercase mb-1">
            Currency
          </label>
          <div className="flex items-center gap-2">
            <select
              value={currentDoc.currency}
              onChange={(e) => {
                const newCurr = e.target.value;
                const totals = calculateDocumentTotals(currentDoc.items, currentDoc.isExport);
                onChange({
                  ...currentDoc,
                  currency: newCurr,
                  amountInWords: numberToWords(totals.grandTotal, newCurr)
                });
              }}
              className="w-full px-3 py-2 text-xs font-bold bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DFBC64]"
            >
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="AED">AED (د.إ - UAE Dirham)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#43504B] dark:text-[#a2b5b0] uppercase mb-1">
            Buyer Ref / RFQ (Optional)
          </label>
          <input
            type="text"
            placeholder="Optional external ref"
            value={currentDoc.reference || ''}
            onChange={(e) => onChange({ ...currentDoc, reference: e.target.value })}
            className="w-full px-3 py-2 text-xs font-mono bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#DFBC64]"
          />
        </div>
      </div>

      {/* Standardized File Naming Utility Display */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
            Standardized PDF Filing Name
          </span>
          <code className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100 selection:bg-emerald-200">
            {getStandardizedPdfName(currentDoc)}
          </code>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const ok = await copyStandardizedFileName(currentDoc);
              if (ok) {
                setCopiedFileName(true);
                setTimeout(() => setCopiedFileName(false), 2000);
              }
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#152220] border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition shadow-2xs"
            title="Copy standardized filename to clipboard for professional archiving"
          >
            {copiedFileName ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFileName ? 'Copied' : 'Copy File Name'}</span>
          </button>
        </div>
      </div>

      {/* Customer / Buyer Selector with Auto-Lookup from Master */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#101b19] border border-slate-200 dark:border-[#223531] relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#014136] dark:text-[#DFBC64]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-[#DFBC64]">
              Buyer / Customer Master Lookup
            </h3>
          </div>
          <span className="text-[10px] text-slate-500">
            Source: Polishing_Material_Customers_1.xlsx
          </span>
        </div>

        {/* Quick Customer Search Autocomplete */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#65716D] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customer by name, city, GST, or mobile..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#014136]"
              />
            </div>
            {customerSearch && (
              <button
                onClick={() => { setCustomerSearch(''); setShowCustomerDropdown(false); }}
                className="text-xs text-[#65716D] hover:text-[#014136]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showCustomerDropdown && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg shadow-xl">
              {customers
                .filter(c => 
                  c.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.city.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.country.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  (c.gstin && c.gstin.toLowerCase().includes(customerSearch.toLowerCase()))
                )
                .map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => handleCustomerSelect(cust)}
                    className="p-2.5 border-b border-[#EDF0EE] dark:border-[#223531] hover:bg-[#F6F7F5] dark:hover:bg-[#1a2b28] cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#014136] dark:text-[#DFBC64]">
                        {cust.companyName}
                      </div>
                      <div className="text-[10px] text-[#65716D]">
                        {cust.city}, {cust.country} &bull; {cust.mobile}
                      </div>
                    </div>
                    {cust.rememberedTerms?.paymentTerms && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#DFBC64]/20 text-[#B88C2E] font-bold">
                        Has Remembered Terms
                      </span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Domestic vs Export Mode Selector */}
        <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-[#223531] gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Transaction Regime:</span>
            <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-[#1f332f]">
              <button
                type="button"
                onClick={() => {
                  onChange({
                    ...currentDoc,
                    isExport: false,
                    currency: currentDoc.currency === 'USD' || currentDoc.currency === 'EUR' ? 'INR' : currentDoc.currency,
                    placeOfSupply: currentDoc.placeOfSupply || 'Delhi (07)',
                    stateCode: currentDoc.stateCode || '07'
                  });
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  !currentDoc.isExport
                    ? 'bg-[#014136] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                🇮🇳 Domestic (GST &amp; Transport)
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange({
                    ...currentDoc,
                    isExport: true,
                    currency: currentDoc.currency === 'INR' ? 'USD' : currentDoc.currency,
                    incoterm: currentDoc.incoterm || 'FOB Mundra Port',
                    portOfLoading: currentDoc.portOfLoading || 'Mundra Port / ICD Delhi',
                    iecCode: currentDoc.iecCode || '0517036281',
                    lutArn: currentDoc.lutArn || 'AD240324001234F'
                  });
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                  currentDoc.isExport
                    ? 'bg-[#DFBC64] text-[#014136] shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                🌐 Export (Zero-Rated LUT &amp; Shipping)
              </button>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {currentDoc.isExport ? 'Export under LUT without payment of IGST (Rule 96A)' : 'Domestic GST regime: Intra-State (CGST+SGST) or Inter-State (IGST)'}
          </span>
        </div>

        {/* Customer fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={currentDoc.customerName}
              onChange={(e) => onChange({ ...currentDoc, customerName: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
              Country
            </label>
            <input
              type="text"
              value={currentDoc.customerCountry}
              onChange={(e) => {
                const val = e.target.value;
                const isExp = isExportCountry(val);
                const curr = getCurrencyForCountry(val);
                onChange({ 
                  ...currentDoc, 
                  customerCountry: val, 
                  isExport: isExp,
                  currency: curr 
                });
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
              Mobile / WhatsApp
            </label>
            <input
              type="text"
              value={currentDoc.customerContact}
              onChange={(e) => onChange({ ...currentDoc, customerContact: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
              {currentDoc.isExport ? 'Foreign VAT / Tax ID' : 'GSTIN / UIN'}
            </label>
            <input
              type="text"
              value={currentDoc.customerTaxId || ''}
              onChange={(e) => onChange({ ...currentDoc, customerTaxId: e.target.value })}
              placeholder={currentDoc.isExport ? 'Foreign VAT / Tax ID' : '07AAAAA0000A1Z5'}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-3">
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
              Billing / Registered Address
            </label>
            <input
              type="text"
              value={currentDoc.customerAddress}
              onChange={(e) => onChange({ ...currentDoc, customerAddress: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
              Buyer P.O. / Ref No
            </label>
            <input
              type="text"
              value={currentDoc.buyerOrderNo || ''}
              onChange={(e) => onChange({ ...currentDoc, buyerOrderNo: e.target.value })}
              placeholder="PO-2026-XYZ"
              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
            />
          </div>
        </div>

        {/* Specialized Fields: Domestic (Place of Supply, Consignee, Transport) vs Export (Incoterm, Ports, LUT, IEC) */}
        {!currentDoc.isExport ? (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#223531] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
                  Place of Supply (State &amp; Code)
                </label>
                <input
                  type="text"
                  value={currentDoc.placeOfSupply || 'Delhi (07)'}
                  onChange={(e) => onChange({ ...currentDoc, placeOfSupply: e.target.value })}
                  placeholder="e.g. Delhi (07) or Haryana (06)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
                  State Code
                </label>
                <input
                  type="text"
                  value={currentDoc.stateCode || '07'}
                  onChange={(e) => onChange({ ...currentDoc, stateCode: e.target.value })}
                  placeholder="07"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
                  Buyer P.O. Date
                </label>
                <input
                  type="date"
                  value={currentDoc.buyerOrderDate || ''}
                  onChange={(e) => onChange({ ...currentDoc, buyerOrderDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                />
              </div>
            </div>

            {/* Consignee Toggle & Form */}
            <div className="p-3 bg-white dark:bg-[#152220] rounded-lg border border-slate-200 dark:border-[#223531]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showConsigneeSection}
                    onChange={(e) => setShowConsigneeSection(e.target.checked)}
                    className="rounded text-[#014136] focus:ring-[#014136]"
                  />
                  <span>Dispatch / Ship to Different Consignee Address</span>
                </label>
                <span className="text-[10px] text-slate-400">Optional: For direct delivery to warehouse or site</span>
              </div>

              {showConsigneeSection && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5 pt-2.5 border-t border-slate-100 dark:border-white/5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Consignee Name</label>
                    <input
                      type="text"
                      value={currentDoc.consigneeName || ''}
                      onChange={(e) => onChange({ ...currentDoc, consigneeName: e.target.value })}
                      placeholder="Consignee company / site"
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Consignee Address</label>
                    <input
                      type="text"
                      value={currentDoc.consigneeAddress || ''}
                      onChange={(e) => onChange({ ...currentDoc, consigneeAddress: e.target.value })}
                      placeholder="Delivery site address"
                      className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Consignee GSTIN / State</label>
                    <input
                      type="text"
                      value={currentDoc.consigneeGstin || ''}
                      onChange={(e) => onChange({ ...currentDoc, consigneeGstin: e.target.value })}
                      placeholder="Consignee GSTIN"
                      className="w-full px-2 py-1 text-xs font-mono bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Transport & Dispatch Details (Particularly useful for Tax Invoice & Delivery Challan) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">E-Way Bill No.</label>
                <input
                  type="text"
                  value={currentDoc.ewayBillNo || ''}
                  onChange={(e) => onChange({ ...currentDoc, ewayBillNo: e.target.value })}
                  placeholder="12-digit E-Way Bill"
                  className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Vehicle No.</label>
                <input
                  type="text"
                  value={currentDoc.vehicleNo || ''}
                  onChange={(e) => onChange({ ...currentDoc, vehicleNo: e.target.value })}
                  placeholder="e.g. DL-1AA-1234"
                  className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Transporter / Carrier</label>
                <input
                  type="text"
                  value={currentDoc.carrierName || ''}
                  onChange={(e) => onChange({ ...currentDoc, carrierName: e.target.value })}
                  placeholder="Transporter Name"
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">LR / Bilty No.</label>
                <input
                  type="text"
                  value={currentDoc.lrNumber || ''}
                  onChange={(e) => onChange({ ...currentDoc, lrNumber: e.target.value })}
                  placeholder="LR Number"
                  className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Export Specific Statutory & Logistics Fields */
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#223531] space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[9px] font-bold text-[#65716D] uppercase mb-1">Incoterm</label>
                <input
                  type="text"
                  value={currentDoc.incoterm || 'FOB Mundra Port'}
                  onChange={(e) => onChange({ ...currentDoc, incoterm: e.target.value })}
                  placeholder="e.g. FOB Mundra Port"
                  className="w-full px-2 py-1 text-xs font-bold text-[#B88C2E] bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#65716D] uppercase mb-1">Port of Loading</label>
                <input
                  type="text"
                  value={currentDoc.portOfLoading || 'Mundra Port / ICD Delhi'}
                  onChange={(e) => onChange({ ...currentDoc, portOfLoading: e.target.value })}
                  placeholder="Port of Loading"
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#65716D] uppercase mb-1">Port of Discharge</label>
                <input
                  type="text"
                  value={currentDoc.portOfDischarge || 'Jebel Ali Port, UAE'}
                  onChange={(e) => onChange({ ...currentDoc, portOfDischarge: e.target.value })}
                  placeholder="Port of Discharge"
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#65716D] uppercase mb-1">Final Destination</label>
                <input
                  type="text"
                  value={currentDoc.countryOfFinalDestination || currentDoc.customerCountry || 'United Arab Emirates'}
                  onChange={(e) => onChange({ ...currentDoc, countryOfFinalDestination: e.target.value })}
                  placeholder="Final Destination Country"
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[9px] font-bold text-[#65716D] uppercase mb-1">IEC Code</label>
                <input
                  type="text"
                  value={currentDoc.iecCode || '0517036281'}
                  onChange={(e) => onChange({ ...currentDoc, iecCode: e.target.value })}
                  placeholder="0517036281"
                  className="w-full px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#65716D] uppercase mb-1">LUT / Bond ARN</label>
                <input
                  type="text"
                  value={currentDoc.lutArn || 'AD240324001234F'}
                  onChange={(e) => onChange({ ...currentDoc, lutArn: e.target.value })}
                  placeholder="AD240324001234F"
                  className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#65716D] uppercase mb-1">Vessel / Flight No</label>
                <input
                  type="text"
                  value={currentDoc.vesselFlightNo || ''}
                  onChange={(e) => onChange({ ...currentDoc, vesselFlightNo: e.target.value })}
                  placeholder="Vessel or Flight No."
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#65716D] uppercase mb-1">Container No</label>
                <input
                  type="text"
                  value={currentDoc.containerNo || ''}
                  onChange={(e) => onChange({ ...currentDoc, containerNo: e.target.value })}
                  placeholder="Container / Seal No."
                  className="w-full px-2 py-1 text-xs font-mono bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Letterhead Specific Body Fields */}
      {isLetterhead && (
        <div className="p-4 rounded-xl bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#223531] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Letter Subject</label>
              <input
                type="text"
                value={currentDoc.letterSubject || ''}
                onChange={(e) => onChange({ ...currentDoc, letterSubject: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Recipient Attention</label>
              <input
                type="text"
                value={currentDoc.letterRecipientName || ''}
                onChange={(e) => onChange({ ...currentDoc, letterRecipientName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Letter Content (Body)</label>
            <textarea
              rows={8}
              value={currentDoc.letterBody || ''}
              onChange={(e) => onChange({ ...currentDoc, letterBody: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-sans leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* Items Section (For Quotations, Price Offers, PIs, Invoices, Challans) */}
      {!isLetterhead && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
              {isPriceOffer ? 'Offered Products & Prices' : 'Line Items & Commercial Goods'}
            </h3>
            
            {/* Quick Add from Inventory Catalog */}
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const found = inventory.find(i => i.id === e.target.value);
                  if (found) {
                    addItemFromInventory(found);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-2.5 py-1 text-xs bg-[#F6F7F5] dark:bg-[#1a2b28] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-semibold text-[#014136] dark:text-[#DFBC64]"
              >
                <option value="" disabled>+ Add from Catalog...</option>
                {inventory.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.defaultUom}) - {formatCurrency(inv.basePrice, currentDoc.currency)}
                  </option>
                ))}
              </select>

              <button
                onClick={addNewBlankItem}
                className="flex items-center gap-1 px-3 py-1 bg-[#014136] text-white rounded-lg text-xs font-bold hover:bg-[#002e27]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>
          </div>

          {/* Price Offer Explanatory Banner */}
          {isPriceOffer && (
            <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-extrabold uppercase tracking-wider text-[10px] bg-amber-200 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-950 dark:text-amber-200">
                  Rate Schedule Mode
                </span>
                <span>
                  Price offers are indicative unit rate schedules without quantities. Quantities, HSN codes, and tax totals are omitted.
                </span>
              </div>
              <button
                onClick={() => handlePipelineConvert('quotation')}
                className="px-2.5 py-1 bg-[#014136] text-white rounded-lg text-xs font-bold hover:bg-[#002e27] shrink-0 ml-2 shadow-xs"
              >
                Convert to Quotation (Add Qty) ➔
              </button>
            </div>
          )}

          {/* Table Editor */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#223531]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-[#162522] text-slate-700 dark:text-slate-200 text-[10px] uppercase font-extrabold tracking-wider border-b border-slate-200 dark:border-[#223531]">
                <tr>
                  <th className="p-2.5 w-8 text-center">#</th>
                  <th className="p-2.5 min-w-[220px]">
                    {isPriceOffer 
                      ? 'Product Description & Technical Specifications' 
                      : currentDoc.isExport 
                        ? 'Description of Export Goods & Specifications' 
                        : 'Item Description & Technical Specifications'}
                  </th>
                  {!isPriceOffer && (
                    <th className="p-2.5 w-24">{currentDoc.isExport ? 'HSN Code' : 'HSN / SAC'}</th>
                  )}
                  {isPriceOffer ? (
                    <th className="p-2.5 w-28 text-center">Packaging / Size</th>
                  ) : (
                    <>
                      <th className="p-2.5 w-20 text-center">Qty</th>
                      <th className="p-2.5 w-16 text-center">UOM</th>
                    </>
                  )}
                  <th className="p-2.5 w-28 text-right">
                    {isPriceOffer ? `Offered Rate (${currentDoc.currency})` : `Unit Price (${currentDoc.currency})`}
                  </th>
                  {!isPriceOffer && <th className="p-2.5 w-16 text-center">Disc%</th>}
                  {!isPriceOffer && !currentDoc.isExport && <th className="p-2.5 w-16 text-center">GST%</th>}
                  {isPriceOffer ? (
                    <th className="p-2.5 min-w-[160px]">Application / Remarks</th>
                  ) : (
                    <th className="p-2.5 w-28 text-right">
                      {currentDoc.isExport ? `FOB / CIF (${currentDoc.currency})` : `Taxable (${currentDoc.currency})`}
                    </th>
                  )}
                  <th className="p-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#223531]">
                {currentDoc.items.map((item, idx) => {
                  const qty = Number(item.qty || 0);
                  const rate = Number(item.unitPrice || 0);
                  const disc = (qty * rate * Number(item.discountPercent || 0)) / 100;
                  const lineTotal = (qty * rate) - disc;

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-[#1a2b28]">
                      <td className="p-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="Item name / specification"
                          className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-[#D9DEDB] focus:border-[#014136] rounded text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={item.packSize || ''}
                          onChange={(e) => handleItemChange(idx, 'packSize', e.target.value)}
                          placeholder="Pack details (e.g. 20 KG Drum / 50 KG Bag)"
                          className="w-full px-2 py-0.5 bg-transparent text-[10px] text-[#65716D] border-0"
                        />
                      </td>
                      {!isPriceOffer && (
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.hsnSac || ''}
                            onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                            placeholder="HSN"
                            className="w-full px-1.5 py-1 text-center font-mono text-xs bg-transparent border border-transparent hover:border-[#D9DEDB] rounded"
                          />
                        </td>
                      )}
                      {isPriceOffer ? (
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.packSize || ''}
                            onChange={(e) => handleItemChange(idx, 'packSize', e.target.value)}
                            placeholder="e.g. 20 KG"
                            className="w-full px-1.5 py-1 text-center text-xs bg-transparent border border-transparent hover:border-[#D9DEDB] rounded"
                          />
                        </td>
                      ) : (
                        <>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.qty}
                              onChange={(e) => handleItemChange(idx, 'qty', parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-1 text-center font-mono text-xs bg-transparent border border-transparent hover:border-[#D9DEDB] rounded font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.uom}
                              onChange={(e) => handleItemChange(idx, 'uom', e.target.value)}
                              className="w-full px-1 py-1 text-center text-xs bg-transparent border border-transparent hover:border-[#D9DEDB] rounded uppercase font-bold"
                            />
                          </td>
                        </>
                      )}
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-1.5 py-1 text-right font-mono text-xs font-bold bg-transparent border border-transparent hover:border-[#D9DEDB] rounded text-[#014136] dark:text-[#DFBC64]"
                        />
                      </td>
                      {!isPriceOffer && (
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discountPercent || 0}
                            onChange={(e) => handleItemChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                            className="w-full px-1 py-1 text-center font-mono text-xs bg-transparent border border-transparent hover:border-[#D9DEDB] rounded"
                          />
                        </td>
                      )}
                      {!isPriceOffer && !currentDoc.isExport && (
                        <td className="p-2">
                          <select
                            value={item.taxRate ?? 18}
                            onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-full px-1 py-1 text-center font-mono text-xs bg-transparent"
                          >
                            <option value="18">18%</option>
                            <option value="12">12%</option>
                            <option value="5">5%</option>
                            <option value="28">28%</option>
                            <option value="0">0%</option>
                          </select>
                        </td>
                      )}
                      {isPriceOffer ? (
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.notes || ''}
                            onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                            placeholder="Grade, finishing step, etc."
                            className="w-full px-2 py-1 text-xs bg-transparent border border-transparent hover:border-[#D9DEDB] rounded text-slate-600 dark:text-slate-300"
                          />
                        </td>
                      ) : (
                        <td className="p-2 text-right font-mono font-bold text-[#014136] dark:text-[#DFBC64]">
                          {formatCurrency(lineTotal, currentDoc.currency)}
                        </td>
                      )}
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30"
                          disabled={currentDoc.items.length <= 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation / Rate Offer Summary Bar */}
          {!isPriceOffer ? (
            <div className="flex flex-wrap items-center justify-between p-3.5 bg-slate-50 dark:bg-[#121f1d] border border-slate-200 dark:border-[#223531] rounded-xl gap-4">
              <div className="text-xs space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>Grand Total ({currentDoc.currency}):</span>
                  <span className="text-base font-black text-[#014136] dark:text-[#DFBC64] font-mono">
                    {formatCurrency(currentDoc.grandTotal, currentDoc.currency)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  In Words: {currentDoc.amountInWords || numberToWords(currentDoc.grandTotal, currentDoc.currency)}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Subtotal</span>
                  <span className="font-bold">{formatCurrency(currentDoc.subtotal, currentDoc.currency)}</span>
                </div>
                {Number(currentDoc.discountTotal || 0) > 0 && (
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Discount</span>
                    <span className="font-bold text-emerald-600">-{formatCurrency(currentDoc.discountTotal, currentDoc.currency)}</span>
                  </div>
                )}
                {!currentDoc.isExport ? (
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">GST Total</span>
                    <span className="font-bold">{formatCurrency(currentDoc.taxTotal, currentDoc.currency)}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">Export LUT</span>
                    <span className="font-bold text-[#014136] dark:text-[#DFBC64]">0.00 (Zero-Rated)</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl gap-3">
              <div className="text-xs">
                <span className="font-bold text-amber-950 dark:text-amber-200 block">Unit Price Schedule Active</span>
                <span className="text-[10px] text-amber-800 dark:text-amber-300">
                  {currentDoc.items.length} products offered. Rates are Ex-Works Delhi Godown valid for 30 days.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePipelineConvert('quotation')}
                  className="px-3 py-1.5 rounded-lg bg-[#014136] text-white font-bold text-xs hover:bg-[#002e27] shadow-xs flex items-center gap-1.5"
                >
                  <span>Convert to Quotation</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#DFBC64]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Commercial Terms & Export Dispatch Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
            Commercial Terms
          </h4>
          <div>
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
              Payment Terms (Remembered for customer)
            </label>
            <input
              type="text"
              value={currentDoc.paymentTerms}
              onChange={(e) => onChange({ ...currentDoc, paymentTerms: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
              Delivery / Lead Time
            </label>
            <input
              type="text"
              value={currentDoc.deliveryTerms}
              onChange={(e) => onChange({ ...currentDoc, deliveryTerms: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">
              Freight &amp; Insurance Responsibility
            </label>
            <input
              type="text"
              value={currentDoc.freightInsurance}
              onChange={(e) => onChange({ ...currentDoc, freightInsurance: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-medium"
            />
          </div>

          {/* Settlement Bank Account Selector (Domestic vs Export aware) */}
          {(() => {
            const appSettings = getSettings();
            const activeBank = getDocumentBankAccount(currentDoc, appSettings);
            return (
              <div className="p-3 bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-[#65716D] uppercase">
                    Settlement Bank Account
                  </label>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    currentDoc.isExport 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}>
                    {currentDoc.isExport ? 'Export (Wire/SWIFT)' : 'Domestic (NEFT/RTGS)'}
                  </span>
                </div>

                <select
                  value={currentDoc.bankAccountId || ''}
                  onChange={(e) => onChange({ ...currentDoc, bankAccountId: e.target.value || undefined })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-semibold text-[#014136] dark:text-[#DFBC64]"
                >
                  <option value="">
                    Auto: {currentDoc.isExport ? 'Export Default' : 'Domestic Default'} ({activeBank.bankName} - ...{activeBank.accountNumber.slice(-4)})
                  </option>
                  {(appSettings.bankAccounts || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.accountLabel || b.bankName}: {b.bankName} ({b.accountNumber}) {b.swiftBic ? `[SWIFT: ${b.swiftBic}]` : `[IFSC: ${b.ifsc}]`}
                    </option>
                  ))}
                </select>

                <div className="mt-2 text-[10px] text-[#65716D] flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-200 dark:border-white/5 font-mono">
                  <span><b>A/C:</b> {activeBank.accountNumber}</span>
                  {currentDoc.isExport ? (
                    <span><b>SWIFT:</b> {activeBank.swiftBic || 'ICICINBB001'} &bull; <b>AD:</b> {activeBank.adCode || '0310083'}</span>
                  ) : (
                    <span><b>IFSC:</b> {activeBank.ifsc || 'ICIC0000831'}</span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
            {currentDoc.isExport ? 'Export & Dispatch Checklist' : 'Price Basis & Notes'}
          </h4>

          {currentDoc.isExport ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">Incoterm</label>
                  <input
                    type="text"
                    value={currentDoc.incoterm || 'FOB Mundra Port'}
                    onChange={(e) => onChange({ ...currentDoc, incoterm: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-bold text-[#B88C2E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">Port of Loading</label>
                  <input
                    type="text"
                    value={currentDoc.portOfLoading || 'Mundra / ICD Delhi'}
                    onChange={(e) => onChange({ ...currentDoc, portOfLoading: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">Price Basis</label>
              <input
                type="text"
                value={currentDoc.priceBasis || 'Ex-Works Delhi Godown'}
                onChange={(e) => onChange({ ...currentDoc, priceBasis: e.target.value })}
                className="w-full px-3 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[#65716D] uppercase mb-1">Special Notes</label>
            <textarea
              rows={3}
              value={currentDoc.notes || ''}
              onChange={(e) => onChange({ ...currentDoc, notes: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Version History & Timeline Modal */}
      <VersionHistoryModal
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        document={currentDoc}
        onLoadVersionIntoEditor={(restoredDoc) => {
          onChange(restoredDoc);
          setShowVersionHistory(false);
        }}
        onDocUpdated={() => {
          const all = getCustomers(); // trigger any reload if needed
        }}
      />
    </div>
  );
};
