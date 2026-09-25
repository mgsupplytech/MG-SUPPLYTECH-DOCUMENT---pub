import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Database,
  RefreshCw
} from 'lucide-react';
import { Customer, InventoryItem, DocumentRecord } from '../../types';
import { 
  getCustomers, 
  getInventory, 
  getDocuments, 
  saveCustomers, 
  saveInventory, 
  saveDocuments, 
  upsertCustomer 
} from '../../services/storageService';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DataType = 'customers' | 'inventory' | 'documents';

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [dataType, setDataType] = useState<DataType>('customers');
  
  // CSV Mapping state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRawRows, setCsvRawRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Expected target schema definitions for mapping
  const customerTargetFields = [
    { key: 'companyName', label: 'Company / Customer Name *', required: true },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'mobile', label: 'Mobile / Phone' },
    { key: 'email', label: 'Email' },
    { key: 'gstin', label: 'GSTIN / VAT ID' },
    { key: 'productsBought', label: 'Products Bought (History)' },
    { key: 'paymentTerms', label: 'Payment Terms' },
    { key: 'deliveryTerms', label: 'Delivery / Lead Time' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccessMessage(null);

    const reader = new FileReader();
    const isJson = file.name.endsWith('.json');

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (isJson) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            if (dataType === 'customers') {
              const current = getCustomers();
              const merged = [...current];
              parsed.forEach(c => {
                if (c.companyName) {
                  const idx = merged.findIndex(ex => ex.companyName.toLowerCase() === c.companyName.toLowerCase());
                  if (idx >= 0) merged[idx] = { ...merged[idx], ...c };
                  else merged.push({ ...c, id: c.id || `cust-${Date.now()}-${Math.random()}` });
                }
              });
              saveCustomers(merged);
              setImportSuccessMessage(`Successfully imported ${parsed.length} customer records from JSON.`);
            } else if (dataType === 'inventory') {
              saveInventory(parsed);
              setImportSuccessMessage(`Successfully imported ${parsed.length} inventory items from JSON.`);
            } else {
              saveDocuments(parsed);
              setImportSuccessMessage(`Successfully restored ${parsed.length} documents from JSON.`);
            }
          } else {
            setImportError('Invalid JSON format. Expected an array of records.');
          }
        } catch (err: any) {
          setImportError(`JSON Parse error: ${err.message}`);
        }
      } else {
        // Parse CSV
        parseCsv(content);
      }
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      setImportError('CSV file must have at least a header row and one data row.');
      return;
    }

    // Basic CSV splitting (handling quoted fields)
    const splitCsvRow = (rowStr: string): string[] => {
      const result: string[] = [];
      let inQuotes = false;
      let cur = '';
      for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const headers = splitCsvRow(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
    const dataRows = lines.slice(1).map(l => splitCsvRow(l).map(c => c.replace(/^["']|["']$/g, '').trim()));

    setCsvHeaders(headers);
    setCsvRawRows(dataRows);

    // Smart auto-mapping heuristic
    const autoMap: Record<string, string> = {};
    customerTargetFields.forEach(field => {
      const match = headers.find(h => {
        const normH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normF = field.key.toLowerCase();
        const normL = field.label.toLowerCase();
        return normH.includes(normF) || normL.includes(normH) || (normF === 'companyname' && (normH.includes('name') || normH.includes('client') || normH.includes('customer')));
      });
      if (match) autoMap[field.key] = match;
    });

    setColumnMapping(autoMap);
  };

  const applyCsvMapping = () => {
    const nameCol = columnMapping['companyName'];
    if (!nameCol) {
      setImportError('Please map the required "Company Name" column.');
      return;
    }

    const nameColIdx = csvHeaders.indexOf(nameCol);
    if (nameColIdx === -1) {
      setImportError('Company Name column not found in headers.');
      return;
    }

    let count = 0;
    csvRawRows.forEach(row => {
      const compName = row[nameColIdx];
      if (!compName || !compName.trim()) return;

      const getVal = (fieldKey: string) => {
        const colName = columnMapping[fieldKey];
        if (!colName) return '';
        const idx = csvHeaders.indexOf(colName);
        return idx >= 0 ? row[idx] || '' : '';
      };

      upsertCustomer({
        companyName: compName,
        contactPerson: getVal('contactPerson'),
        address: getVal('address'),
        city: getVal('city'),
        state: getVal('state'),
        country: getVal('country') || 'India',
        mobile: getVal('mobile'),
        email: getVal('email'),
        gstin: getVal('gstin'),
        productsBought: getVal('productsBought'),
        rememberedTerms: {
          paymentTerms: getVal('paymentTerms') || undefined,
          deliveryTerms: getVal('deliveryTerms') || undefined
        }
      });
      count++;
    });

    setImportSuccessMessage(`Successfully imported and mapped ${count} customer records into local database!`);
    setCsvHeaders([]);
    setCsvRawRows([]);
  };

  const handleExport = (format: 'csv' | 'json') => {
    let dataToExport: any[] = [];
    let filename = `MG_Supplytech_${dataType}_${new Date().toISOString().split('T')[0]}`;

    if (dataType === 'customers') {
      dataToExport = getCustomers();
    } else if (dataType === 'inventory') {
      dataToExport = getInventory();
    } else {
      dataToExport = getDocuments();
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${filename}.json`;
      a.click();
    } else {
      // Export as CSV
      if (dataToExport.length === 0) {
        alert('No records to export.');
        return;
      }
      const keys = Object.keys(dataToExport[0]).filter(k => typeof dataToExport[0][k] !== 'object');
      const csvContent = [
        keys.join(','),
        ...dataToExport.map(row => 
          keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${filename}.csv`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white dark:bg-[#152220] rounded-2xl shadow-2xl border border-[#D9DEDB] dark:border-[#223531] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#003A30] text-white flex items-center justify-between border-b border-[#DFBC64]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#DFBC64] text-[#003A30]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Data Management &bull; CSV &amp; JSON Hub
              </h2>
              <div className="text-[11px] text-[#DFBC64]">
                Import/export customers, catalog &amp; invoices with column mapping
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#EDF0EE] dark:border-[#223531] bg-[#F6F7F5] dark:bg-[#101b19] px-6 pt-3">
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'border-[#014136] text-[#014136] dark:text-[#DFBC64] dark:border-[#DFBC64]'
                : 'border-transparent text-[#65716D]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import &amp; Column Mapping</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-[#014136] text-[#014136] dark:text-[#DFBC64] dark:border-[#DFBC64]'
                : 'border-transparent text-[#65716D]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV / JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Data Category Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#65716D] uppercase">Dataset:</span>
            {(['customers', 'inventory', 'documents'] as DataType[]).map((type) => (
              <button
                key={type}
                onClick={() => { setDataType(type); setCsvHeaders([]); setCsvRawRows([]); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  dataType === type
                    ? 'bg-[#014136] text-[#DFBC64]'
                    : 'bg-[#F6F7F5] dark:bg-[#1a2b28] text-[#43504B] dark:text-[#a2b5b0]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {importSuccessMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {activeTab === 'import' ? (
            <div className="space-y-4">
              {/* File input */}
              <div className="border-2 border-dashed border-[#D9DEDB] dark:border-[#2a3f3b] rounded-xl p-6 text-center hover:border-[#014136] transition cursor-pointer relative bg-[#F6F7F5] dark:bg-[#101b19]">
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-8 h-8 mx-auto text-[#014136] dark:text-[#DFBC64] mb-2" />
                <div className="text-xs font-bold text-[#16211F] dark:text-[#E3ECE8]">
                  Click or drag customer CSV or JSON file here
                </div>
                <div className="text-[11px] text-[#65716D] mt-1">
                  Supports master customer lists, Polishing_Material_Customers_1.xlsx export, or system JSON
                </div>
              </div>

              {/* Column Mapping Interface if CSV is loaded */}
              {csvHeaders.length > 0 && (
                <div className="space-y-4 p-4 rounded-xl border border-[#D9DEDB] dark:border-[#2a3f3b] bg-white dark:bg-[#152220]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-[#014136] dark:text-[#DFBC64] tracking-wider">
                      Interactive Table &amp; Column Mapping
                    </h3>
                    <span className="text-[11px] text-[#65716D]">
                      Detected {csvHeaders.length} columns &bull; {csvRawRows.length} rows
                    </span>
                  </div>

                  {/* Mapping Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {customerTargetFields.map(field => (
                      <div key={field.key} className="p-2 bg-[#F6F7F5] dark:bg-[#101b19] rounded-lg border border-[#D9DEDB] dark:border-[#223531]">
                        <label className="block text-[10px] font-bold text-[#43504B] dark:text-[#a2b5b0] mb-1">
                          {field.label}
                        </label>
                        <select
                          value={columnMapping[field.key] || ''}
                          onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                          className="w-full text-xs py-1 px-2 bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded font-medium"
                        >
                          <option value="">-- Do Not Import --</option>
                          {csvHeaders.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Live Row Preview */}
                  <div className="pt-2">
                    <div className="text-[10px] font-bold text-[#65716D] uppercase mb-1">
                      Mapped Row Preview (First 3 Records)
                    </div>
                    <div className="overflow-x-auto border border-[#D9DEDB] dark:border-[#223531] rounded-lg">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-[#003A30] text-white">
                          <tr>
                            <th className="p-1.5">Company Name</th>
                            <th className="p-1.5">City</th>
                            <th className="p-1.5">Mobile</th>
                            <th className="p-1.5">GSTIN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvRawRows.slice(0, 3).map((row, idx) => {
                            const getVal = (k: string) => {
                              const col = columnMapping[k];
                              if (!col) return '—';
                              const i = csvHeaders.indexOf(col);
                              return i >= 0 ? row[i] || '—' : '—';
                            };
                            return (
                              <tr key={idx} className="border-b border-[#EDF0EE] dark:border-[#223531]">
                                <td className="p-1.5 font-bold text-[#014136] dark:text-[#DFBC64]">{getVal('companyName')}</td>
                                <td className="p-1.5">{getVal('city')}</td>
                                <td className="p-1.5 font-mono">{getVal('mobile')}</td>
                                <td className="p-1.5 font-mono">{getVal('gstin')}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button
                    onClick={applyCsvMapping}
                    className="w-full py-2 bg-[#014136] hover:bg-[#002e27] text-[#DFBC64] font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow"
                  >
                    <span>Execute Import &amp; Save to Offline Storage</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Export tab */
            <div className="space-y-4">
              <div className="p-4 bg-[#F6F7F5] dark:bg-[#101b19] rounded-xl border border-[#D9DEDB] dark:border-[#2a3f3b]">
                <h3 className="text-xs font-bold uppercase text-[#014136] dark:text-[#DFBC64] mb-1">
                  Export {dataType.toUpperCase()} Dataset
                </h3>
                <p className="text-xs text-[#65716D] mb-4">
                  Download all {dataType} records currently stored in your browser local offline storage.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex-1 py-2.5 px-4 bg-[#014136] hover:bg-[#002e27] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4 text-[#DFBC64]" />
                    <span>Download as CSV (.csv)</span>
                  </button>

                  <button
                    onClick={() => handleExport('json')}
                    className="flex-1 py-2.5 px-4 bg-white dark:bg-[#1a2b28] hover:bg-[#eaece8] text-[#014136] dark:text-[#DFBC64] border border-[#D9DEDB] dark:border-[#2a3f3b] font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download as JSON (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
