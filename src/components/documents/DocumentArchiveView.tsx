import React, { useState, useEffect } from 'react';
import { DocumentRecord, DocumentStatus, DocumentType } from '../../types';
import { 
  getDocuments, 
  saveDocuments, 
  saveDocument,
  createInitialDocument,
  deleteDocument, 
  formatCurrency, 
  convertDocumentToStage 
} from '../../services/storageService';
import { 
  FileText, 
  Search, 
  Printer, 
  Download, 
  Mail, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Edit3, 
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  DollarSign,
  History,
  GitCommit,
  ArrowRight,
  Sparkles,
  Plus,
  ChevronDown
} from 'lucide-react';
import { downloadDocumentHtml, openDocumentInNewTab } from '../../utils/exportHtml';
import { 
  getStandardizedPdfName, 
  printDocumentWithStandardName, 
  copyStandardizedFileName 
} from '../../utils/documentNaming';
import { VersionHistoryModal } from './VersionHistoryModal';

interface DocumentArchiveViewProps {
  onLoadDocIntoEditor: (doc: DocumentRecord) => void;
  onOpenEmail: (doc: DocumentRecord) => void;
}

export const DocumentArchiveView: React.FC<DocumentArchiveViewProps> = ({
  onLoadDocIntoEditor,
  onOpenEmail
}) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedVersionDoc, setSelectedVersionDoc] = useState<DocumentRecord | null>(null);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);

  useEffect(() => {
    setDocuments(getDocuments());
  }, []);

  const refreshList = () => {
    setDocuments(getDocuments());
  };

  const handleCreateNewDocument = (type: DocumentType) => {
    const newDoc = createInitialDocument(type);
    saveDocument(newDoc);
    setDocuments([newDoc, ...getDocuments()]);
    setShowCreateDropdown(false);
    onLoadDocIntoEditor(newDoc);
  };

  const handleStatusChange = (docId: string, newStatus: DocumentStatus) => {
    const updated = documents.map(d => d.id === docId ? { ...d, status: newStatus } : d);
    saveDocuments(updated);
    setDocuments(updated);
  };

  const handleDuplicate = (doc: DocumentRecord) => {
    const year = new Date().getFullYear();
    const duplicated: DocumentRecord = {
      ...doc,
      id: `doc-${Date.now()}`,
      docNumber: `${doc.docNumber}-COPY`,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveDocuments([duplicated, ...documents]);
    setDocuments([duplicated, ...documents]);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this document record?')) return;
    deleteDocument(id);
    refreshList();
  };

  const handleConvertStage = (doc: DocumentRecord, targetType: DocumentType) => {
    const converted = convertDocumentToStage(doc, targetType, true);
    refreshList();
    onLoadDocIntoEditor(converted);
  };

  const filteredDocs = documents.filter(d => {
    const matchSearch = 
      d.docNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.customerName.toLowerCase().includes(search.toLowerCase()) ||
      d.customerCountry.toLowerCase().includes(search.toLowerCase()) ||
      (d.reference && d.reference.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchType = typeFilter === 'all' || d.docType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
            Commercial Document Archive
          </h2>
          <p className="text-xs text-[#65716D]">
            All generated Quotations, Price Offers, Proforma Invoices &amp; Delivery Challans
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#014136] text-[#DFBC64] font-bold text-xs hover:bg-[#002e27] shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Document</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
          </button>

          {showCreateDropdown && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-[#162522] border border-slate-200 dark:border-[#2a3f3b] rounded-xl shadow-2xl z-50 p-2 text-xs space-y-1 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 border-b border-slate-100 dark:border-white/5 font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">
                Select Document Stage
              </div>
              <button
                onClick={() => handleCreateNewDocument('quotation')}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-[#014136] dark:text-[#DFBC64] flex items-center justify-between"
              >
                <span>1. Quotation (QT)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">Recommended</span>
              </button>
              <button
                onClick={() => handleCreateNewDocument('tax-invoice')}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-slate-700 dark:text-slate-200"
              >
                <span>2. Tax Invoice (INV)</span>
              </button>
              <button
                onClick={() => handleCreateNewDocument('proforma-invoice')}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 font-medium text-slate-700 dark:text-slate-200"
              >
                <span>3. Proforma Invoice (PI)</span>
              </button>
              <button
                onClick={() => handleCreateNewDocument('price-offer')}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 font-medium text-slate-700 dark:text-slate-200"
              >
                <span>4. Price Offer (PO)</span>
              </button>
              <button
                onClick={() => handleCreateNewDocument('delivery-challan')}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 font-medium text-slate-700 dark:text-slate-200"
              >
                <span>5. Delivery Challan (DC)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-1">
          <Search className="w-4 h-4 text-[#65716D] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search doc number, customer, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] rounded-xl text-xs"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#DFBC64]"
          >
            <option value="all">All Document Formats</option>
            <option value="price-offer">1. Price Offers (PO)</option>
            <option value="quotation">2. Quotations (QT)</option>
            <option value="proforma-invoice">3. Proforma Invoices (PI)</option>
            <option value="tax-invoice">4. Tax Invoices (INV)</option>
            <option value="delivery-challan">5. Delivery Challans (DC)</option>
            <option value="letterhead">Letterheads (LTR)</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-[#152220] border border-slate-200 dark:border-[#223531] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#DFBC64]"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent to Client</option>
            <option value="accepted">Accepted / Approved</option>
            <option value="paid">Payment Received</option>
            <option value="delivered">Delivered / Dispatched</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#152220] rounded-2xl border border-slate-200 dark:border-[#223531]">
          <FileText className="w-10 h-10 mx-auto text-[#DFBC64] mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-[#E3ECE8]">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Create a new quotation or invoice in the Document Editor tab to save it to your archive.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#223531] bg-white dark:bg-[#152220] shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-[#162522] text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-[#223531] text-[10px] uppercase font-extrabold tracking-wider">
              <tr>
                <th className="p-3">Doc Number</th>
                <th className="p-3">Pipeline Stage</th>
                <th className="p-3">Customer (Buyer)</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Convert / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#223531]">
              {filteredDocs.map((doc) => {
                const isPriceOffer = doc.docType === 'price-offer';
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/70 dark:hover:bg-[#1a2b28] transition">
                    <td className="p-3 font-mono font-bold text-[#014136] dark:text-[#DFBC64]">
                      <div>{doc.docNumber}</div>
                      <div 
                        onClick={() => copyStandardizedFileName(doc)}
                        className="text-[9px] font-mono text-slate-500 hover:text-[#014136] dark:hover:text-[#DFBC64] cursor-pointer inline-flex items-center gap-1 group mt-0.5"
                        title={`Click to copy standardized filing name: ${getStandardizedPdfName(doc)}`}
                      >
                        <span className="truncate max-w-[140px]">{getStandardizedPdfName(doc)}</span>
                        <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
                      </div>
                      <div>
                        <button
                          onClick={() => setSelectedVersionDoc(doc)}
                          className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#DFBC64]/20 hover:bg-[#DFBC64]/40 text-[#003A30] dark:text-[#DFBC64] border border-[#DFBC64]/40 transition"
                          title="View Version History Timeline & Compare Revisions"
                        >
                          <History className="w-2.5 h-2.5" />
                          v{doc.version || doc.versions?.length || 1} &bull; {doc.versions?.length || 1} {(doc.versions?.length || 1) === 1 ? 'Rev' : 'Revs'}
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#101b19] text-slate-700 dark:text-[#E3ECE8]">
                        {doc.docType.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-[#E3ECE8]">{doc.customerName}</div>
                      <div className="text-[10px] text-slate-500">{doc.customerCountry}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      {doc.date}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#014136] dark:text-[#DFBC64]">
                      {isPriceOffer ? 'Rate Schedule' : formatCurrency(doc.grandTotal, doc.currency)}
                    </td>
                    <td className="p-3 text-center">
                      <select
                        value={doc.status}
                        onChange={(e) => handleStatusChange(doc.id, e.target.value as DocumentStatus)}
                        className={`text-[10px] font-bold py-1 px-2 rounded-lg border focus:outline-none ${
                          doc.status === 'accepted' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          doc.status === 'sent' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                          doc.status === 'paid' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                          'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="paid">Paid</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Progressive Pipeline Stage Convert Button */}
                        {doc.docType === 'price-offer' && (
                          <button
                            onClick={() => handleConvertStage(doc, 'quotation')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition mr-1"
                            title="Convert Price Offer to Formal Quotation"
                          >
                            <span>To Quote</span>
                            <ArrowRight className="w-2.5 h-2.5 text-[#B88C2E]" />
                          </button>
                        )}
                        {doc.docType === 'quotation' && (
                          <button
                            onClick={() => handleConvertStage(doc, 'proforma-invoice')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 transition mr-1"
                            title="Convert Quotation to Proforma Invoice"
                          >
                            <span>To PI</span>
                            <ArrowRight className="w-2.5 h-2.5 text-blue-600" />
                          </button>
                        )}
                        {doc.docType === 'proforma-invoice' && (
                          <button
                            onClick={() => handleConvertStage(doc, 'tax-invoice')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 transition mr-1"
                            title="Convert Proforma Invoice to Tax Invoice"
                          >
                            <span>To Tax Inv</span>
                            <ArrowRight className="w-2.5 h-2.5 text-purple-600" />
                          </button>
                        )}
                        {doc.docType === 'tax-invoice' && (
                          <button
                            onClick={() => handleConvertStage(doc, 'delivery-challan')}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition mr-1"
                            title="Generate Delivery Challan / Transporter Pass"
                          >
                            <span>To Challan</span>
                            <ArrowRight className="w-2.5 h-2.5 text-emerald-600" />
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedVersionDoc(doc)}
                          className="p-1.5 text-[#014136] dark:text-[#DFBC64] bg-[#DFBC64]/15 hover:bg-[#DFBC64]/30 rounded-lg transition"
                          title="Version History & Visual Comparison Timeline"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onLoadDocIntoEditor(doc)}
                          className="p-1.5 text-slate-600 hover:text-[#014136] dark:text-[#DFBC64] hover:bg-slate-100 dark:hover:bg-[#101b19] rounded-lg"
                          title="Open in Editor"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenEmail(doc)}
                          className="p-1.5 text-slate-600 hover:text-[#014136] hover:bg-slate-100 dark:hover:bg-[#101b19] rounded-lg"
                          title="Direct Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => printDocumentWithStandardName(doc)}
                          className="p-1.5 text-slate-600 hover:text-[#014136] hover:bg-slate-100 dark:hover:bg-[#101b19] rounded-lg"
                          title={`Print or Save as PDF (${getStandardizedPdfName(doc)})`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => downloadDocumentHtml(doc)}
                          className="p-1.5 text-slate-600 hover:text-[#014136] hover:bg-slate-100 dark:hover:bg-[#101b19] rounded-lg"
                          title="Download Standalone HTML"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openDocumentInNewTab(doc)}
                          className="p-1.5 text-slate-600 hover:text-[#014136] hover:bg-slate-100 dark:hover:bg-[#101b19] rounded-lg"
                          title="Open Clean View"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(doc)}
                          className="p-1.5 text-slate-600 hover:text-[#014136] hover:bg-slate-100 dark:hover:bg-[#101b19] rounded-lg"
                          title="Duplicate Document"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Version History & Visual Timeline Comparison Modal */}
      <VersionHistoryModal
        isOpen={!!selectedVersionDoc}
        onClose={() => setSelectedVersionDoc(null)}
        document={selectedVersionDoc}
        onLoadVersionIntoEditor={(restoredDoc) => {
          onLoadDocIntoEditor(restoredDoc);
          setSelectedVersionDoc(null);
        }}
        onDocUpdated={() => {
          refreshList();
          if (selectedVersionDoc) {
            const updated = getDocuments().find(d => d.id === selectedVersionDoc.id);
            if (updated) setSelectedVersionDoc(updated);
          }
        }}
      />
    </div>
  );
};
