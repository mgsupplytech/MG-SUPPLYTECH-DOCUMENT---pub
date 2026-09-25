import React, { useState, useId } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Table, 
  Sparkles, 
  RefreshCw,
  FileText,
  HelpCircle
} from 'lucide-react';
import { parseSpreadsheetText, downloadCsvFile, SAMPLE_CUSTOMERS_CSV, SAMPLE_PRODUCTS_CSV, ParsedSpreadsheet } from '../../utils/csvParser';
import { importCustomersBatch, importInventoryBatch, BatchImportResult } from '../../services/storageService';

export interface SpreadsheetColumnMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'customers' | 'inventory';
  onImportComplete?: (result: BatchImportResult) => void;
}

interface TargetFieldDef {
  key: string;
  label: string;
  required: boolean;
  synonyms: string[];
  description: string;
  example: string;
}

const CUSTOMER_TARGET_FIELDS: TargetFieldDef[] = [
  { 
    key: 'companyName', 
    label: 'Company / Party Name', 
    required: true, 
    synonyms: ['company', 'party', 'name', 'client', 'buyer', 'customer', 'customer name', 'party name', 'firm name'], 
    description: 'Legal registered business or buyer name', 
    example: 'Apex Optical Industries' 
  },
  { 
    key: 'contactPerson', 
    label: 'Contact Person', 
    required: false, 
    synonyms: ['contact', 'person', 'attention', 'poc', 'manager', 'contact name'], 
    description: 'Name of commercial director or buyer rep', 
    example: 'Mr. Rajesh Sharma' 
  },
  { 
    key: 'mobile', 
    label: 'Mobile / Phone No', 
    required: false, 
    synonyms: ['phone', 'mobile', 'tel', 'cell', 'contact no', 'mobile no', 'whatsapp'], 
    description: 'Primary calling or WhatsApp contact', 
    example: '+91 98210 55443' 
  },
  { 
    key: 'email', 
    label: 'Email Address', 
    required: false, 
    synonyms: ['email', 'mail', 'e-mail', 'email id'], 
    description: 'Accounts or commercial dispatch email', 
    example: 'procure@apexoptical.com' 
  },
  { 
    key: 'gstin', 
    label: 'GSTIN / Tax ID', 
    required: false, 
    synonyms: ['gst', 'gstin', 'vat', 'tax', 'tax id', 'tin', 'gst no', 'gstin/uin'], 
    description: '15-digit GSTIN or foreign VAT registration', 
    example: '07AAACA4512D1Z5' 
  },
  { 
    key: 'address', 
    label: 'Address Line', 
    required: false, 
    synonyms: ['address', 'street', 'premise', 'location', 'addr', 'billing address'], 
    description: 'Factory or office street address', 
    example: 'Plot 45, Okhla Ind Area Phase-III' 
  },
  { 
    key: 'city', 
    label: 'City', 
    required: false, 
    synonyms: ['city', 'town', 'district'], 
    description: 'Town or city location', 
    example: 'New Delhi' 
  },
  { 
    key: 'state', 
    label: 'State / Province', 
    required: false, 
    synonyms: ['state', 'province', 'region'], 
    description: 'State name for GST place of supply', 
    example: 'Delhi' 
  },
  { 
    key: 'country', 
    label: 'Country', 
    required: false, 
    synonyms: ['country', 'nation'], 
    description: 'Country (defaults to India if blank)', 
    example: 'India' 
  },
  { 
    key: 'paymentTerms', 
    label: 'Standard Payment Terms', 
    required: false, 
    synonyms: ['payment terms', 'payment', 'terms of payment', 'credit'], 
    description: 'Remembered commercial terms for quotes', 
    example: '100% Advance against PI' 
  },
  { 
    key: 'deliveryTerms', 
    label: 'Standard Delivery Terms', 
    required: false, 
    synonyms: ['delivery terms', 'delivery', 'dispatch', 'lead time'], 
    description: 'Standard dispatch timeline', 
    example: '3–5 working days' 
  },
  { 
    key: 'productsBought', 
    label: 'Products / Catalog Tags', 
    required: false, 
    synonyms: ['products', 'products bought', 'items', 'tags', 'materials'], 
    description: 'Consumables routinely ordered by this client', 
    example: 'White Cerium Powder, Felt Wheels' 
  }
];

const INVENTORY_TARGET_FIELDS: TargetFieldDef[] = [
  { 
    key: 'name', 
    label: 'Product / Item Name', 
    required: true, 
    synonyms: ['product', 'item', 'item name', 'product name', 'description', 'material', 'title'], 
    description: 'Full commercial trade description of the consumable or machinery', 
    example: 'White Cerium Oxide Polishing Powder (TREO 99.9%)' 
  },
  { 
    key: 'sku', 
    label: 'SKU / Item Code', 
    required: false, 
    synonyms: ['sku', 'code', 'item code', 'part no', 'product code', 'model'], 
    description: 'Internal SKU or identifier (auto-generated if omitted)', 
    example: 'MG-CER-999' 
  },
  { 
    key: 'category', 
    label: 'Category', 
    required: false, 
    synonyms: ['category', 'group', 'type', 'classification', 'department'], 
    description: 'e.g. Polishing Material, Machinery Tools, Consumables', 
    example: 'Polishing Material' 
  },
  { 
    key: 'hsnSac', 
    label: 'HSN / SAC Code', 
    required: false, 
    synonyms: ['hsn', 'sac', 'hsn code', 'hsn/sac', 'commodity code', 'tariff'], 
    description: 'GST Harmonized System of Nomenclature code', 
    example: '28461010' 
  },
  { 
    key: 'defaultUom', 
    label: 'Unit of Measure (UOM)', 
    required: false, 
    synonyms: ['uom', 'unit', 'measurement', 'units', 'uom code'], 
    description: 'Standard trading unit (KG, PCS, LTR, SET, DRUM)', 
    example: 'KG' 
  },
  { 
    key: 'packSize', 
    label: 'Packaging Size', 
    required: false, 
    synonyms: ['pack', 'pack size', 'packaging', 'packing', 'bundle'], 
    description: 'Commercial packaging unit', 
    example: '20 KG Fiber Drum' 
  },
  { 
    key: 'basePrice', 
    label: 'Base Rate / Unit Price', 
    required: false, 
    synonyms: ['price', 'rate', 'unit price', 'base price', 'mrp', 'cost', 'standard rate'], 
    description: 'Standard selling price per UOM excluding GST', 
    example: '1850' 
  },
  { 
    key: 'defaultTaxRate', 
    label: 'GST / Tax Rate (%)', 
    required: false, 
    synonyms: ['tax', 'gst', 'gst%', 'tax rate', 'tax%', 'gst rate', 'vat%'], 
    description: 'Applicable GST percentage (e.g. 18 or 12 or 5)', 
    example: '18' 
  },
  { 
    key: 'inStock', 
    label: 'Opening Stock Qty', 
    required: false, 
    synonyms: ['stock', 'qty', 'quantity', 'inventory', 'in stock', 'opening stock'], 
    description: 'Current available warehouse count', 
    example: '500' 
  },
  { 
    key: 'description', 
    label: 'Detailed Technical Specs', 
    required: false, 
    synonyms: ['details', 'specs', 'notes', 'technical details', 'remarks'], 
    description: 'Additional purity, grit, or application notes for quotes', 
    example: 'High precision glass & optical beveling compound' 
  }
];

export const SpreadsheetColumnMapperModal: React.FC<SpreadsheetColumnMapperModalProps> = ({
  isOpen,
  onClose,
  mode,
  onImportComplete
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'complete'>('upload');
  const [rawPastedText, setRawPastedText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedSpreadsheet | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [updateExisting, setUpdateExisting] = useState(true);
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputId = useId();

  if (!isOpen) return null;

  const targetFields = mode === 'customers' ? CUSTOMER_TARGET_FIELDS : INVENTORY_TARGET_FIELDS;

  // Auto-match CSV headers with target fields based on synonyms
  const autoMapHeaders = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};

    targetFields.forEach(tf => {
      // Find matching header
      const match = headers.find(h => {
        const cleanH = h.trim().toLowerCase();
        // Exact label match
        if (cleanH === tf.label.toLowerCase()) return true;
        // Synonym match
        return tf.synonyms.some(syn => {
          if (cleanH === syn) return true;
          // Substring match for longer phrases
          if (cleanH.includes(syn) || syn.includes(cleanH)) return true;
          return false;
        });
      });

      if (match) {
        mapping[tf.key] = match;
      } else {
        mapping[tf.key] = '';
      }
    });

    return mapping;
  };

  const handleProcessText = (text: string) => {
    try {
      setErrorMessage(null);
      const parsed = parseSpreadsheetText(text);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setErrorMessage('Could not find any data rows. Please ensure your CSV or table has a header row and at least one line of data.');
        return;
      }
      setParsedData(parsed);
      const initialMapping = autoMapHeaders(parsed.headers);
      setFieldMapping(initialMapping);
      setStep('mapping');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse spreadsheet data.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessText(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    if (mode === 'customers') {
      downloadCsvFile(SAMPLE_CUSTOMERS_CSV, 'MG-Supplytech-Customers-Template.csv');
    } else {
      downloadCsvFile(SAMPLE_PRODUCTS_CSV, 'MG-Supplytech-Products-Inventory-Template.csv');
    }
  };

  const handleMappingChange = (targetKey: string, csvHeader: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [targetKey]: csvHeader
    }));
  };

  const getMappedPreviewRows = (maxCount = 3) => {
    if (!parsedData) return [];

    return parsedData.rows.slice(0, maxCount).map((row) => {
      const mappedRecord: Record<string, string> = {};
      targetFields.forEach(tf => {
        const selectedHeader = fieldMapping[tf.key];
        if (selectedHeader) {
          const colIndex = parsedData.headers.indexOf(selectedHeader);
          mappedRecord[tf.key] = colIndex >= 0 ? (row[colIndex] || '') : '';
        } else {
          mappedRecord[tf.key] = '';
        }
      });
      return mappedRecord;
    });
  };

  const handleExecuteImport = () => {
    if (!parsedData) return;

    // Check required field
    const primaryKey = mode === 'customers' ? 'companyName' : 'name';
    const primaryHeader = fieldMapping[primaryKey];
    if (!primaryHeader) {
      setErrorMessage(`Please select which column maps to the required field: "${mode === 'customers' ? 'Company / Party Name' : 'Product / Item Name'}"`);
      return;
    }

    try {
      const headerIndexMap: Record<string, number> = {};
      targetFields.forEach(tf => {
        const colName = fieldMapping[tf.key];
        if (colName) {
          headerIndexMap[tf.key] = parsedData.headers.indexOf(colName);
        }
      });

      if (mode === 'customers') {
        const recordsToImport = parsedData.rows.map(row => {
          const getVal = (key: string) => {
            const idx = headerIndexMap[key];
            return idx !== undefined && idx >= 0 ? (row[idx] || '').trim() : '';
          };

          return {
            companyName: getVal('companyName'),
            contactPerson: getVal('contactPerson'),
            mobile: getVal('mobile'),
            email: getVal('email'),
            gstin: getVal('gstin'),
            address: getVal('address'),
            city: getVal('city'),
            state: getVal('state'),
            country: getVal('country') || 'India',
            paymentTerms: getVal('paymentTerms'),
            deliveryTerms: getVal('deliveryTerms'),
            productsBought: getVal('productsBought')
          };
        }).filter(r => Boolean(r.companyName));

        const result = importCustomersBatch(recordsToImport, { updateExisting });
        setImportResult(result);
        setStep('complete');
        onImportComplete?.(result);
      } else {
        const recordsToImport = parsedData.rows.map(row => {
          const getVal = (key: string) => {
            const idx = headerIndexMap[key];
            return idx !== undefined && idx >= 0 ? (row[idx] || '').trim() : '';
          };

          const rawPrice = getVal('basePrice').replace(/[^0-9.]/g, '');
          const rawTax = getVal('defaultTaxRate').replace(/[^0-9.]/g, '');
          const rawStock = getVal('inStock').replace(/[^0-9.]/g, '');

          return {
            name: getVal('name'),
            sku: getVal('sku'),
            category: getVal('category') || 'General Sourcing',
            hsnSac: getVal('hsnSac') || '6804',
            defaultUom: getVal('defaultUom') || 'PCS',
            packSize: getVal('packSize') || '1 PC',
            basePrice: rawPrice ? parseFloat(rawPrice) : 0,
            defaultTaxRate: rawTax ? parseFloat(rawTax) : 18,
            inStock: rawStock ? parseFloat(rawStock) : 0,
            description: getVal('description')
          };
        }).filter(r => Boolean(r.name));

        const result = importInventoryBatch(recordsToImport, { updateExisting });
        setImportResult(result);
        setStep('complete');
        onImportComplete?.(result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Import execution failed.');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setRawPastedText('');
    setParsedData(null);
    setFieldMapping({});
    setImportResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#101b19] border border-slate-200 dark:border-[#223531] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#16211F] dark:text-[#E3ECE8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#00241E] via-[#003A30] to-[#014136] text-white flex items-center justify-between border-b border-[#DFBC64]/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-[#DFBC64]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-wider text-white">
                  {mode === 'customers' ? 'Import Customers & Client Directory' : 'Import Products & Consumables Catalog'}
                </h2>
                <span className="text-[10px] bg-[#DFBC64]/25 text-[#DFBC64] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-[#DFBC64]/40">
                  CSV &amp; Excel
                </span>
              </div>
              <p className="text-xs text-white/75 mt-0.5">
                Bulk upload spreadsheet with interactive column mapping, auto-deduplication, and live preview.
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

        {/* Stepper Bar */}
        <div className="flex border-b border-slate-200 dark:border-[#203631] bg-slate-50 dark:bg-[#12201d] px-6 py-2.5 items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 font-bold ${step === 'upload' ? 'text-[#014136] dark:text-[#DFBC64]' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'upload' ? 'bg-[#014136] text-white dark:bg-[#DFBC64] dark:text-[#00241E]' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white/60'}`}>1</span>
              <span>Upload / Paste CSV</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <div className={`flex items-center gap-2 font-bold ${step === 'mapping' ? 'text-[#014136] dark:text-[#DFBC64]' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'mapping' ? 'bg-[#014136] text-white dark:bg-[#DFBC64] dark:text-[#00241E]' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white/60'}`}>2</span>
              <span>Map Spreadsheet Columns</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <div className={`flex items-center gap-2 font-bold ${step === 'complete' ? 'text-[#014136] dark:text-[#DFBC64]' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'complete' ? 'bg-[#014136] text-white dark:bg-[#DFBC64] dark:text-[#00241E]' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white/60'}`}>3</span>
              <span>Done</span>
            </div>
          </div>

          <button
            onClick={handleDownloadSample}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-[#1a2b28] hover:bg-slate-100 dark:hover:bg-[#233833] text-slate-700 dark:text-[#DFBC64] border border-slate-200 dark:border-[#2a3f3b] rounded-lg font-semibold transition"
            title="Download ready-to-fill sample CSV template"
          >
            <Download className="w-3.5 h-3.5 text-[#014136] dark:text-[#DFBC64]" />
            <span>Download Sample Template (.csv)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Upload or Paste */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drag & Drop File Zone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-[#2a3f3b] hover:border-[#014136] dark:hover:border-[#DFBC64] rounded-2xl p-8 text-center transition bg-slate-50/50 dark:bg-white/[0.01]">
                <input
                  id={fileInputId}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor={fileInputId} className="cursor-pointer block space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#003A30]/10 dark:bg-[#DFBC64]/10 border border-[#003A30]/20 dark:border-[#DFBC64]/30 flex items-center justify-center text-[#014136] dark:text-[#DFBC64]">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-[#014136] dark:text-[#DFBC64] hover:underline">
                      Click to choose CSV or TSV file
                    </span>
                    <span className="text-slate-500 text-xs block mt-1">
                      or drag and drop your spreadsheet file here
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports .csv, .tsv, comma-delimited, tab-delimited, and semicolon-delimited exports from Tally, Excel, Zoho, or Google Sheets.
                  </p>
                </label>
              </div>

              {/* OR Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200 dark:bg-[#203631]" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">or paste directly from excel / sheets</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-[#203631]" />
              </div>

              {/* Paste Table / Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#014136] dark:text-[#DFBC64]" />
                    Paste Spreadsheet Rows (with Header):
                  </label>
                  <span className="text-[10px] text-slate-400">Copy table in Excel and press Cmd+V / Ctrl+V</span>
                </div>
                <textarea
                  rows={5}
                  value={rawPastedText}
                  onChange={(e) => setRawPastedText(e.target.value)}
                  placeholder={mode === 'customers' 
                    ? 'Company Name, Contact Person, Mobile, GSTIN, City, State\nApex Optical, Rajesh Sharma, 9821055443, 07AAACA4512D1Z5, New Delhi, Delhi' 
                    : 'Product Name, SKU, Category, HSN, Rate, Unit\nWhite Cerium Oxide 99.9%, MG-CER-999, Polishing, 28461010, 1850, KG'}
                  className="w-full font-mono text-xs p-3 bg-white dark:bg-[#0c1413] border border-slate-200 dark:border-[#223531] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003A30] dark:focus:ring-[#DFBC64] text-slate-800 dark:text-white"
                />
                {rawPastedText.trim() && (
                  <button
                    onClick={() => handleProcessText(rawPastedText)}
                    className="w-full py-2.5 bg-[#014136] hover:bg-[#002922] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Analyze Columns &amp; Continue</span>
                    <ArrowRight className="w-4 h-4 text-[#DFBC64]" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Interactive Column Mapping */}
          {step === 'mapping' && parsedData && (
            <div className="space-y-6">
              {/* File stats banner */}
              <div className="p-3 bg-slate-50 dark:bg-[#121f1d] border border-slate-200 dark:border-[#223531] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    {parsedData.totalRows} Rows Found
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Detected {parsedData.headers.length} columns in your spreadsheet.
                    </span>
                    <p className="text-[11px] text-slate-500">
                      We automatically matched columns with high confidence. Confirm or adjust the mappings below.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline font-medium"
                >
                  Choose Different File
                </button>
              </div>

              {/* Column Mapping Grid */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Spreadsheet Column Mapping
                </h3>
                <div className="border border-slate-200 dark:border-[#223531] rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#0f1a18]">
                  {targetFields.map((tf) => {
                    const mappedValue = fieldMapping[tf.key] || '';
                    const isMapped = Boolean(mappedValue);

                    return (
                      <div key={tf.key} className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition">
                        <div className="sm:w-1/2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {tf.label}
                            </span>
                            {tf.required && (
                              <span className="text-amber-500 font-bold text-xs" title="Required field">*</span>
                            )}
                            {isMapped && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {tf.description} • <span className="italic text-slate-400">e.g. {tf.example}</span>
                          </p>
                        </div>

                        <div className="sm:w-1/2 flex items-center gap-2">
                          <select
                            value={mappedValue}
                            onChange={(e) => handleMappingChange(tf.key, e.target.value)}
                            className={`w-full text-xs p-2 rounded-lg border font-medium transition ${
                              isMapped 
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/50 text-slate-800 dark:text-emerald-200' 
                                : tf.required
                                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50 text-slate-700'
                                  : 'bg-white dark:bg-[#152220] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <option value="">-- Do Not Import / Skip --</option>
                            {parsedData.headers.map(h => (
                              <option key={h} value={h}>
                                Column: "{h}"
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-[#014136] dark:text-[#DFBC64]" />
                    Live Mapped Data Preview (First 3 Rows)
                  </h3>
                  <span className="text-[10px] text-slate-400">Shows how rows will be saved</span>
                </div>

                <div className="border border-slate-200 dark:border-[#223531] rounded-xl overflow-x-auto bg-slate-50/40 dark:bg-black/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#152220] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-[#2a3f3b]">
                        {targetFields.filter(tf => Boolean(fieldMapping[tf.key])).slice(0, 6).map(tf => (
                          <th key={tf.key} className="p-2.5 font-bold uppercase text-[10px] tracking-wider">
                            {tf.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                      {getMappedPreviewRows(3).map((r, i) => (
                        <tr key={i} className="hover:bg-white/60 dark:hover:bg-white/5">
                          {targetFields.filter(tf => Boolean(fieldMapping[tf.key])).slice(0, 6).map(tf => (
                            <td key={tf.key} className="p-2.5 text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                              {r[tf.key] || <span className="text-slate-400 italic">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deduplication & Merge Options */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#12201d] border border-slate-200 dark:border-[#223531] flex items-center justify-between text-xs">
                <div>
                  <label htmlFor="updateExistingToggle" className="font-bold text-slate-800 dark:text-slate-200 block cursor-pointer">
                    Update Existing Records
                  </label>
                  <p className="text-[11px] text-slate-500">
                    If a record already exists with the same {mode === 'customers' ? 'Company Name or GSTIN' : 'Product Name or SKU'}, merge and update its fields instead of skipping.
                  </p>
                </div>
                <input
                  id="updateExistingToggle"
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="w-4 h-4 text-[#014136] rounded border-slate-300 focus:ring-[#003A30] cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleExecuteImport}
                  className="px-6 py-2.5 bg-[#014136] hover:bg-[#002821] text-white font-bold text-xs rounded-xl transition shadow-md flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#DFBC64]" />
                  <span>Import {parsedData.totalRows} {mode === 'customers' ? 'Customers' : 'Products'} Now</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Complete */}
          {step === 'complete' && importResult && (
            <div className="py-8 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Bulk Import Successful!
                </h3>
                <p className="text-xs text-slate-500">
                  Your spreadsheet records have been verified and securely saved into local storage.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-[#121f1d] border border-slate-200 dark:border-[#223531] rounded-xl text-center">
                <div>
                  <div className="text-lg font-black text-[#014136] dark:text-[#DFBC64]">
                    {importResult.added}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">New Added</div>
                </div>
                <div>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                    {importResult.updated}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Updated</div>
                </div>
                <div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {importResult.total}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Saved</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-[#014136] hover:bg-[#002821] text-white font-bold text-xs rounded-xl transition shadow-md"
                >
                  Return to {mode === 'customers' ? 'Customers' : 'Inventory'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
