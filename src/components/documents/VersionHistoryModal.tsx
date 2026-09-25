import React, { useState, useMemo } from 'react';
import { DocumentRecord, DocumentVersionSnapshot, DocumentItem } from '../../types';
import { formatCurrency, saveDocument, createVersionSnapshot } from '../../services/storageService';
import { DocumentView } from './DocumentView';
import { downloadDocumentHtml, openDocumentInNewTab } from '../../utils/exportHtml';
import { 
  History, 
  GitCommit, 
  Clock, 
  ArrowRight, 
  ArrowLeftRight, 
  Check, 
  RotateCcw, 
  FileText, 
  Eye, 
  Download, 
  Printer, 
  Copy, 
  Plus, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  X, 
  Tag,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles
} from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord | null;
  onLoadVersionIntoEditor: (doc: DocumentRecord) => void;
  onDocUpdated?: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  document: activeDoc,
  onLoadVersionIntoEditor,
  onDocUpdated
}) => {
  if (!isOpen || !activeDoc) return null;

  // Prepare versions list (latest first for timeline display)
  const versions: DocumentVersionSnapshot[] = useMemo(() => {
    if (activeDoc.versions && activeDoc.versions.length > 0) {
      return [...activeDoc.versions].sort((a, b) => b.versionNumber - a.versionNumber);
    }
    // Fallback if document had no versions
    return [
      createVersionSnapshot(
        activeDoc,
        1,
        'Original Draft',
        'Commercial Desk',
        'Initial baseline archived version',
        activeDoc.createdAt
      )
    ];
  }, [activeDoc]);

  // Selected versions for comparison
  // By default, Version B is the latest version, Version A is the previous version (or earliest if only 1)
  const [versionAId, setVersionAId] = useState<string>(() => {
    if (versions.length > 1) {
      return versions[1].versionId; // Previous version
    }
    return versions[0].versionId;
  });

  const [versionBId, setVersionBId] = useState<string>(() => {
    return versions[0].versionId; // Latest version
  });

  const [activeTab, setActiveTab] = useState<'diff' | 'previewA' | 'previewB'>('diff');
  const [newRevisionModalOpen, setNewRevisionModalOpen] = useState(false);
  const [revisionLabel, setRevisionLabel] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');

  const versionA = useMemo(() => {
    return versions.find(v => v.versionId === versionAId) || versions[versions.length - 1];
  }, [versions, versionAId]);

  const versionB = useMemo(() => {
    return versions.find(v => v.versionId === versionBId) || versions[0];
  }, [versions, versionBId]);

  const docA = versionA.snapshot;
  const docB = versionB.snapshot;

  // Compute key financial diffs
  const grandTotalDiff = (docB.grandTotal || 0) - (docA.grandTotal || 0);
  const subtotalDiff = (docB.subtotal || 0) - (docA.subtotal || 0);
  const taxDiff = (docB.taxTotal || 0) - (docA.taxTotal || 0);
  const itemsCountDiff = docB.items.length - docA.items.length;
  const percentChange = docA.grandTotal > 0 
    ? ((grandTotalDiff / docA.grandTotal) * 100).toFixed(1)
    : '0';

  // Compute Line Items Diff
  interface ItemDiffRow {
    description: string;
    status: 'added' | 'removed' | 'modified' | 'unchanged';
    itemA?: DocumentItem;
    itemB?: DocumentItem;
    qtyDiff?: number;
    priceDiff?: number;
  }

  const itemDiffRows: ItemDiffRow[] = useMemo(() => {
    const rows: ItemDiffRow[] = [];
    const itemsA = docA.items || [];
    const itemsB = docB.items || [];
    const matchedBIds = new Set<string>();

    itemsA.forEach(itemA => {
      // Find matching item in B by ID or normalized description
      const matchB = itemsB.find(
        b => !matchedBIds.has(b.id) && (b.id === itemA.id || b.description.trim().toLowerCase() === itemA.description.trim().toLowerCase())
      );

      if (matchB) {
        matchedBIds.add(matchB.id);
        const qtyChanged = Number(matchB.qty) !== Number(itemA.qty);
        const priceChanged = Number(matchB.unitPrice) !== Number(itemA.unitPrice);
        const discountChanged = Number(matchB.discountPercent || 0) !== Number(itemA.discountPercent || 0);
        const taxChanged = Number(matchB.taxRate || 0) !== Number(itemA.taxRate || 0);

        const isModified = qtyChanged || priceChanged || discountChanged || taxChanged;

        rows.push({
          description: matchB.description || itemA.description,
          status: isModified ? 'modified' : 'unchanged',
          itemA,
          itemB: matchB,
          qtyDiff: Number(matchB.qty) - Number(itemA.qty),
          priceDiff: Number(matchB.unitPrice) - Number(itemA.unitPrice)
        });
      } else {
        // Item was removed in B
        rows.push({
          description: itemA.description,
          status: 'removed',
          itemA
        });
      }
    });

    // Any remaining items in B were added
    itemsB.forEach(itemB => {
      if (!matchedBIds.has(itemB.id)) {
        rows.push({
          description: itemB.description,
          status: 'added',
          itemB
        });
      }
    });

    return rows;
  }, [docA, docB]);

  const handleCreateNewRevisionSnapshot = () => {
    if (!revisionLabel.trim()) return;
    const updated = saveDocument(activeDoc, {
      versionLabel: revisionLabel.trim(),
      changeNotes: revisionNotes.trim() || `Milestone revision snapshot created.`,
      author: 'Commercial Desk',
      forceNewVersion: true
    });
    setRevisionLabel('');
    setRevisionNotes('');
    setNewRevisionModalOpen(false);
    if (onDocUpdated) onDocUpdated();
    // Auto-select latest version
    if (updated.versions && updated.versions.length > 0) {
      setVersionBId(updated.versions[updated.versions.length - 1].versionId);
    }
  };

  const handleLoadVersion = (targetDoc: DocumentRecord, versionNumber: number) => {
    if (confirm(`Load Version ${versionNumber} into the Document Editor? Any unsaved edits in the current editor will be replaced.`)) {
      onLoadVersionIntoEditor(targetDoc);
      onClose();
    }
  };

  const handleDuplicateVersion = (targetDoc: DocumentRecord, versionNumber: number) => {
    const duplicated: DocumentRecord = {
      ...targetDoc,
      id: `doc-${Date.now()}`,
      docNumber: `${targetDoc.docNumber}-REV${versionNumber}`,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      version: 1,
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveDocument(duplicated);
    if (onDocUpdated) onDocUpdated();
    alert(`Created new quotation ${duplicated.docNumber} based on Rev ${versionNumber}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#F6F7F5] dark:bg-[#101C19] border border-[#014136]/20 dark:border-[#DFBC64]/30 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Modal Header - Clean light modal header with brand accents */}
        <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#111C1A] text-slate-800 dark:text-[#E3ECE8] border-b border-slate-200 dark:border-[#223531]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#DFBC64]/20 border border-[#DFBC64]/30 rounded-xl text-[#014136] dark:text-[#DFBC64]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
                  Version History &amp; Visual Comparison Timeline
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#DFBC64]/20 text-[#014136] dark:text-[#DFBC64] border border-[#DFBC64]/30">
                  {versions.length} {versions.length === 1 ? 'Version' : 'Revisions'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#E3ECE8]/80">
                Document: <span className="font-mono font-bold text-slate-800 dark:text-white">{activeDoc.docNumber}</span> &bull; Customer: <span className="font-semibold text-slate-800 dark:text-white">{activeDoc.customerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewRevisionModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DFBC64] hover:bg-[#B88C2E] text-[#003A30] font-bold text-xs rounded-xl shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Milestone Revision
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-[#E3ECE8] dark:hover:text-white dark:hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split into Timeline (Left) and Comparison Diff / Preview (Right) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Visual Timeline (4 Cols) */}
          <div className="lg:col-span-4 border-r border-[#D9DEDB] dark:border-[#223531] bg-white dark:bg-[#152220] flex flex-col max-h-[40vh] lg:max-h-[calc(92vh-130px)] overflow-y-auto p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#EDF0EE] dark:border-[#223531]">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#014136] dark:text-[#DFBC64]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
                  Revision Timeline
                </span>
              </div>
              <span className="text-[11px] text-[#65716D]">
                Chronological Logs
              </span>
            </div>

            {/* Quick compare selection hints */}
            <div className="p-2.5 mb-3 bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#223531] rounded-xl text-[11px] text-[#43504B] dark:text-[#A7B3AF]">
              <div className="flex items-center justify-between mb-1 font-bold">
                <span className="text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Base (A): Rev {versionA.versionNumber}
                </span>
                <ArrowRight className="w-3 h-3 text-[#65716D]" />
                <span className="text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Compare (B): Rev {versionB.versionNumber}
                </span>
              </div>
              <p className="text-[10px] text-[#65716D]">
                Click "Set as A" or "Set as B" on any card below to compare differences.
              </p>
            </div>

            {/* Timeline Cards */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#D9DEDB] dark:before:bg-[#223531]">
              {versions.map((ver, idx) => {
                const isCurrent = ver.versionNumber === (activeDoc.version || versions[0].versionNumber);
                const isA = ver.versionId === versionAId;
                const isB = ver.versionId === versionBId;
                const formattedDate = new Date(ver.savedAt).toLocaleString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={ver.versionId} 
                    className={`relative p-3.5 rounded-xl border transition-all ${
                      isB 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 shadow-xs' 
                        : isA 
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-[#101b19] border-[#D9DEDB] dark:border-[#223531] hover:border-[#014136]/40'
                    }`}
                  >
                    {/* Node circle on timeline */}
                    <div className={`absolute -left-[27px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isCurrent 
                        ? 'bg-[#003A30] border-[#DFBC64]' 
                        : isB
                          ? 'bg-emerald-600 border-white'
                          : isA
                            ? 'bg-amber-600 border-white'
                            : 'bg-white dark:bg-[#152220] border-[#65716D]'
                    }`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                    </div>

                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-[#003A30] text-white">
                          v{ver.versionNumber}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                            Active in Archive
                          </span>
                        )}
                        {isA && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                            Base (A)
                          </span>
                        )}
                        {isB && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                            Compare (B)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#65716D]">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Label & Description */}
                    <h4 className="text-xs font-bold text-[#16211F] dark:text-[#E3ECE8] mb-1">
                      {ver.label || `Revision ${ver.versionNumber}`}
                    </h4>

                    {ver.changeNotes && (
                      <p className="text-[11px] text-[#65716D] dark:text-[#A7B3AF] mb-2 leading-relaxed italic bg-[#F6F7F5] dark:bg-[#152220] p-1.5 rounded-lg border border-[#EDF0EE] dark:border-[#223531]">
                        "{ver.changeNotes}"
                      </p>
                    )}

                    {/* Quick Metrics */}
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-[#EDF0EE] dark:border-[#223531]">
                      <span className="font-bold text-[#014136] dark:text-[#DFBC64]">
                        {formatCurrency(ver.summary.grandTotal, ver.summary.currency)}
                      </span>
                      <span className="text-[#65716D]">
                        {ver.summary.itemsCount} {ver.summary.itemsCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Action buttons inside card */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#EDF0EE] dark:border-[#223531]">
                      <button
                        onClick={() => { setVersionAId(ver.versionId); setActiveTab('diff'); }}
                        className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded-lg transition text-center ${
                          isA 
                            ? 'bg-amber-600 text-white' 
                            : 'bg-[#F6F7F5] dark:bg-[#152220] hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {isA ? 'Selected (A)' : 'Set as A'}
                      </button>

                      <button
                        onClick={() => { setVersionBId(ver.versionId); setActiveTab('diff'); }}
                        className={`flex-1 text-[10px] font-bold py-1 px-1.5 rounded-lg transition text-center ${
                          isB 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-[#F6F7F5] dark:bg-[#152220] hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                        }`}
                      >
                        {isB ? 'Selected (B)' : 'Set as B'}
                      </button>

                      <button
                        onClick={() => handleLoadVersion(ver.snapshot, ver.versionNumber)}
                        title="Load this historical revision directly into the editor"
                        className="p-1 bg-[#003A30] hover:bg-[#014136] text-white rounded-lg transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Comparison Matrix / Visual Diff & A4 Document Preview (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col max-h-[calc(92vh-130px)] overflow-hidden bg-[#F6F7F5] dark:bg-[#101C19]">
            
            {/* Top Toolbar: View Toggles & Selectors */}
            <div className="p-4 bg-white dark:bg-[#152220] border-b border-[#D9DEDB] dark:border-[#223531] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Mode Selector Tabs */}
                <div className="inline-flex bg-[#F6F7F5] dark:bg-[#101b19] p-1 rounded-xl border border-[#D9DEDB] dark:border-[#223531]">
                  <button
                    onClick={() => setActiveTab('diff')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                      activeTab === 'diff'
                        ? 'bg-[#003A30] text-white shadow-xs'
                        : 'text-[#65716D] hover:text-[#16211F] dark:hover:text-white'
                    }`}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    Side-by-Side Diff
                  </button>

                  <button
                    onClick={() => setActiveTab('previewA')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                      activeTab === 'previewA'
                        ? 'bg-amber-700 text-white shadow-xs'
                        : 'text-[#65716D] hover:text-[#16211F] dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Rev {versionA.versionNumber} (A)
                  </button>

                  <button
                    onClick={() => setActiveTab('previewB')}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                      activeTab === 'previewB'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-[#65716D] hover:text-[#16211F] dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Rev {versionB.versionNumber} (B)
                  </button>
                </div>
              </div>

              {/* Version Comparison Dropdowns */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-amber-800 dark:text-amber-400">Base (A):</span>
                  <select
                    value={versionAId}
                    onChange={(e) => setVersionAId(e.target.value)}
                    className="py-1 px-2.5 bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#223531] rounded-lg font-mono font-bold text-xs"
                  >
                    {versions.map(v => (
                      <option key={`opt-a-${v.versionId}`} value={v.versionId}>
                        Rev {v.versionNumber} - {formatCurrency(v.summary.grandTotal, v.summary.currency)} ({v.label})
                      </option>
                    ))}
                  </select>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-[#65716D]" />

                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-emerald-800 dark:text-emerald-400">Compare (B):</span>
                  <select
                    value={versionBId}
                    onChange={(e) => setVersionBId(e.target.value)}
                    className="py-1 px-2.5 bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#223531] rounded-lg font-mono font-bold text-xs"
                  >
                    {versions.map(v => (
                      <option key={`opt-b-${v.versionId}`} value={v.versionId}>
                        Rev {v.versionNumber} - {formatCurrency(v.summary.grandTotal, v.summary.currency)} ({v.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {activeTab === 'diff' ? (
                <>
                  {/* High-Level Comparison KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531]">
                      <span className="text-[10px] uppercase font-bold text-[#65716D] block">
                        Grand Total Impact
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-base font-mono font-black ${
                          grandTotalDiff > 0 ? 'text-emerald-700 dark:text-emerald-400' :
                          grandTotalDiff < 0 ? 'text-rose-700 dark:text-rose-400' :
                          'text-[#16211F] dark:text-[#E3ECE8]'
                        }`}>
                          {grandTotalDiff > 0 ? `+` : ''}{formatCurrency(grandTotalDiff, docB.currency)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${
                        grandTotalDiff > 0 ? 'text-emerald-600' : grandTotalDiff < 0 ? 'text-rose-600' : 'text-[#65716D]'
                      }`}>
                        {grandTotalDiff > 0 ? <TrendingUp className="w-3 h-3" /> : grandTotalDiff < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                        {percentChange !== '0' ? `${percentChange}% change` : 'No total variation'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531]">
                      <span className="text-[10px] uppercase font-bold text-[#65716D] block">
                        Base (A) Total
                      </span>
                      <span className="text-sm font-mono font-bold text-amber-800 dark:text-amber-400 mt-1 block">
                        {formatCurrency(docA.grandTotal, docA.currency)}
                      </span>
                      <span className="text-[10px] text-[#65716D] mt-0.5 block">
                        {docA.items.length} line items
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531]">
                      <span className="text-[10px] uppercase font-bold text-[#65716D] block">
                        Compare (B) Total
                      </span>
                      <span className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-400 mt-1 block">
                        {formatCurrency(docB.grandTotal, docB.currency)}
                      </span>
                      <span className="text-[10px] text-[#65716D] mt-0.5 block">
                        {docB.items.length} line items
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531]">
                      <span className="text-[10px] uppercase font-bold text-[#65716D] block">
                        Commercial Terms
                      </span>
                      <span className="text-sm font-bold text-[#16211F] dark:text-[#E3ECE8] mt-1 block">
                        {(docA.paymentTerms !== docB.paymentTerms || docA.deliveryTerms !== docB.deliveryTerms) ? (
                          <span className="text-amber-600 dark:text-amber-400 font-black">Modified ⚠️</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Identical ✓</span>
                        )}
                      </span>
                      <span className="text-[10px] text-[#65716D] mt-0.5 block">
                        {itemsCountDiff !== 0 ? `${itemsCountDiff > 0 ? '+' : ''}${itemsCountDiff} items diff` : 'Same line item count'}
                      </span>
                    </div>
                  </div>

                  {/* Line Items Diff Table */}
                  <div className="bg-white dark:bg-[#152220] rounded-xl border border-[#D9DEDB] dark:border-[#223531] shadow-xs overflow-hidden">
                    <div className="p-3.5 bg-[#003A30] text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#DFBC64]" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#DFBC64]">
                          Line Items Comparison Breakdown
                        </h4>
                      </div>
                      <span className="text-[10px] text-[#E3ECE8]/80 font-mono">
                        Rev {versionA.versionNumber} vs Rev {versionB.versionNumber}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-[#F6F7F5] dark:bg-[#101b19] text-[10px] uppercase font-bold text-[#65716D] border-b border-[#EDF0EE] dark:border-[#223531]">
                          <tr>
                            <th className="p-3">Status</th>
                            <th className="p-3">Item Description &amp; Packaging</th>
                            <th className="p-3 text-center">Qty (A vs B)</th>
                            <th className="p-3 text-right">Unit Price (A vs B)</th>
                            <th className="p-3 text-right">Line Total (A vs B)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EDF0EE] dark:divide-[#223531]">
                          {itemDiffRows.map((row, idx) => {
                            const lineTotalA = row.itemA ? row.itemA.qty * row.itemA.unitPrice : 0;
                            const lineTotalB = row.itemB ? row.itemB.qty * row.itemB.unitPrice : 0;
                            const lineTotalDiff = lineTotalB - lineTotalA;

                            return (
                              <tr 
                                key={`diff-row-${idx}`}
                                className={`transition ${
                                  row.status === 'added' ? 'bg-emerald-50/60 dark:bg-emerald-950/20' :
                                  row.status === 'removed' ? 'bg-rose-50/60 dark:bg-rose-950/20 opacity-80' :
                                  row.status === 'modified' ? 'bg-amber-50/50 dark:bg-amber-950/15' :
                                  'hover:bg-[#F6F7F5] dark:hover:bg-[#1a2b28]'
                                }`}
                              >
                                <td className="p-3 whitespace-nowrap">
                                  {row.status === 'added' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                                      + Added in B
                                    </span>
                                  )}
                                  {row.status === 'removed' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                                      - Removed in B
                                    </span>
                                  )}
                                  {row.status === 'modified' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                                      ● Modified
                                    </span>
                                  )}
                                  {row.status === 'unchanged' && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-[#1e2d2a] text-[#65716D]">
                                      Unchanged
                                    </span>
                                  )}
                                </td>

                                <td className="p-3">
                                  <div className="font-bold text-[#16211F] dark:text-[#E3ECE8]">
                                    {row.description}
                                  </div>
                                  {(row.itemB?.packSize || row.itemA?.packSize) && (
                                    <div className="text-[10px] text-[#65716D]">
                                      Pack: {row.itemB?.packSize || row.itemA?.packSize}
                                    </div>
                                  )}
                                </td>

                                <td className="p-3 text-center font-mono font-semibold">
                                  {row.status === 'removed' ? (
                                    <span className="line-through text-rose-600">{row.itemA?.qty} {row.itemA?.uom}</span>
                                  ) : row.status === 'added' ? (
                                    <span className="text-emerald-600 font-bold">{row.itemB?.qty} {row.itemB?.uom}</span>
                                  ) : row.qtyDiff !== 0 ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <span className="text-[#65716D] line-through">{row.itemA?.qty}</span>
                                      <ArrowRight className="w-3 h-3 text-[#65716D]" />
                                      <span className="font-bold text-[#014136] dark:text-[#DFBC64]">
                                        {row.itemB?.qty} {row.itemB?.uom}
                                      </span>
                                    </div>
                                  ) : (
                                    <span>{row.itemA?.qty} {row.itemA?.uom}</span>
                                  )}
                                </td>

                                <td className="p-3 text-right font-mono">
                                  {row.status === 'removed' ? (
                                    <span className="line-through text-rose-600">{formatCurrency(row.itemA?.unitPrice || 0, docA.currency)}</span>
                                  ) : row.status === 'added' ? (
                                    <span className="text-emerald-600 font-bold">{formatCurrency(row.itemB?.unitPrice || 0, docB.currency)}</span>
                                  ) : row.priceDiff !== 0 ? (
                                    <div>
                                      <div className="text-[10px] text-[#65716D] line-through">
                                        {formatCurrency(row.itemA?.unitPrice || 0, docA.currency)}
                                      </div>
                                      <div className="font-bold text-[#014136] dark:text-[#DFBC64]">
                                        {formatCurrency(row.itemB?.unitPrice || 0, docB.currency)}
                                      </div>
                                    </div>
                                  ) : (
                                    <span>{formatCurrency(row.itemA?.unitPrice || 0, docA.currency)}</span>
                                  )}
                                </td>

                                <td className="p-3 text-right font-mono font-bold">
                                  {row.status === 'removed' ? (
                                    <span className="line-through text-rose-600">{formatCurrency(lineTotalA, docA.currency)}</span>
                                  ) : row.status === 'added' ? (
                                    <span className="text-emerald-600">{formatCurrency(lineTotalB, docB.currency)}</span>
                                  ) : (
                                    <div>
                                      <div className="text-[#16211F] dark:text-[#E3ECE8]">
                                        {formatCurrency(lineTotalB, docB.currency)}
                                      </div>
                                      {lineTotalDiff !== 0 && (
                                        <div className={`text-[10px] ${lineTotalDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {lineTotalDiff > 0 ? '+' : ''}{formatCurrency(lineTotalDiff, docB.currency)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Commercial Terms & Metadata Side-by-Side Diff */}
                  <div className="bg-white dark:bg-[#152220] rounded-xl border border-[#D9DEDB] dark:border-[#223531] shadow-xs overflow-hidden">
                    <div className="p-3.5 bg-[#003A30] text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#DFBC64]" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#DFBC64]">
                          Commercial Terms &amp; Policies Comparison
                        </h4>
                      </div>
                    </div>

                    <div className="divide-y divide-[#EDF0EE] dark:divide-[#223531] text-xs">
                      {/* Payment Terms */}
                      <div className={`p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 ${docA.paymentTerms !== docB.paymentTerms ? 'bg-amber-50/40 dark:bg-amber-950/15' : ''}`}>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 block mb-1">
                            Rev {versionA.versionNumber} Payment Terms:
                          </span>
                          <p className="text-[#43504B] dark:text-[#A7B3AF] bg-[#F6F7F5] dark:bg-[#101b19] p-2.5 rounded-lg border border-[#EDF0EE] dark:border-[#223531]">
                            {docA.paymentTerms || 'Standard Terms'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                            Rev {versionB.versionNumber} Payment Terms:
                          </span>
                          <p className="text-[#16211F] dark:text-[#E3ECE8] font-semibold bg-[#F6F7F5] dark:bg-[#101b19] p-2.5 rounded-lg border border-[#EDF0EE] dark:border-[#223531]">
                            {docB.paymentTerms || 'Standard Terms'}
                          </p>
                        </div>
                      </div>

                      {/* Delivery Terms */}
                      <div className={`p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 ${docA.deliveryTerms !== docB.deliveryTerms ? 'bg-amber-50/40 dark:bg-amber-950/15' : ''}`}>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 block mb-1">
                            Rev {versionA.versionNumber} Delivery Terms:
                          </span>
                          <p className="text-[#43504B] dark:text-[#A7B3AF] bg-[#F6F7F5] dark:bg-[#101b19] p-2.5 rounded-lg border border-[#EDF0EE] dark:border-[#223531]">
                            {docA.deliveryTerms || 'Standard Delivery'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                            Rev {versionB.versionNumber} Delivery Terms:
                          </span>
                          <p className="text-[#16211F] dark:text-[#E3ECE8] font-semibold bg-[#F6F7F5] dark:bg-[#101b19] p-2.5 rounded-lg border border-[#EDF0EE] dark:border-[#223531]">
                            {docB.deliveryTerms || 'Standard Delivery'}
                          </p>
                        </div>
                      </div>

                      {/* Freight, Incoterm & Notes */}
                      <div className={`p-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 ${(docA.freightInsurance !== docB.freightInsurance || docA.notes !== docB.notes) ? 'bg-amber-50/40 dark:bg-amber-950/15' : ''}`}>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 block mb-1">
                            Rev {versionA.versionNumber} Freight &amp; Notes:
                          </span>
                          <div className="text-[#43504B] dark:text-[#A7B3AF] bg-[#F6F7F5] dark:bg-[#101b19] p-2.5 rounded-lg border border-[#EDF0EE] dark:border-[#223531] space-y-1">
                            <div><strong className="text-[#16211F] dark:text-[#E3ECE8]">Freight:</strong> {docA.freightInsurance || 'Standard'}</div>
                            {docA.incoterm && <div><strong className="text-[#16211F] dark:text-[#E3ECE8]">Incoterm:</strong> {docA.incoterm}</div>}
                            {docA.notes && <div><strong className="text-[#16211F] dark:text-[#E3ECE8]">Notes:</strong> {docA.notes}</div>}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                            Rev {versionB.versionNumber} Freight &amp; Notes:
                          </span>
                          <div className="text-[#16211F] dark:text-[#E3ECE8] bg-[#F6F7F5] dark:bg-[#101b19] p-2.5 rounded-lg border border-[#EDF0EE] dark:border-[#223531] space-y-1">
                            <div><strong>Freight:</strong> {docB.freightInsurance || 'Standard'}</div>
                            {docB.incoterm && <div><strong>Incoterm:</strong> {docB.incoterm}</div>}
                            {docB.notes && <div><strong>Notes:</strong> {docB.notes}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeTab === 'previewA' ? (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                      <Eye className="w-4 h-4" />
                      <span>Viewing historical snapshot for <strong>Revision {versionA.versionNumber}</strong> ({versionA.label})</span>
                    </div>
                    <button
                      onClick={() => handleLoadVersion(docA, versionA.versionNumber)}
                      className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg transition"
                    >
                      Load Rev {versionA.versionNumber} into Editor
                    </button>
                  </div>
                  <div className="border border-[#D9DEDB] dark:border-[#223531] rounded-xl overflow-hidden shadow-md">
                    <DocumentView document={docA} printMode={false} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                      <Eye className="w-4 h-4" />
                      <span>Viewing historical snapshot for <strong>Revision {versionB.versionNumber}</strong> ({versionB.label})</span>
                    </div>
                    <button
                      onClick={() => handleLoadVersion(docB, versionB.versionNumber)}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition"
                    >
                      Load Rev {versionB.versionNumber} into Editor
                    </button>
                  </div>
                  <div className="border border-[#D9DEDB] dark:border-[#223531] rounded-xl overflow-hidden shadow-md">
                    <DocumentView document={docB} printMode={false} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 bg-white dark:bg-[#152220] border-t border-[#D9DEDB] dark:border-[#223531] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#65716D]">
                  Actions for <strong className="text-[#014136] dark:text-[#DFBC64]">Rev {versionB.versionNumber}</strong>:
                </span>
                <button
                  onClick={() => downloadDocumentHtml(docB)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F7F5] dark:bg-[#101b19] hover:bg-[#EDF0EE] dark:hover:bg-[#1a2b28] text-xs font-bold text-[#43504B] dark:text-[#E3ECE8] rounded-xl border border-[#D9DEDB] dark:border-[#223531] transition"
                  title="Download standalone HTML for Version B"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download HTML
                </button>

                <button
                  onClick={() => openDocumentInNewTab(docB)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F7F5] dark:bg-[#101b19] hover:bg-[#EDF0EE] dark:hover:bg-[#1a2b28] text-xs font-bold text-[#43504B] dark:text-[#E3ECE8] rounded-xl border border-[#D9DEDB] dark:border-[#223531] transition"
                  title="Open in new tab to print or save PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Rev {versionB.versionNumber}
                </button>

                <button
                  onClick={() => handleDuplicateVersion(docB, versionB.versionNumber)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F7F5] dark:bg-[#101b19] hover:bg-[#EDF0EE] dark:hover:bg-[#1a2b28] text-xs font-bold text-[#43504B] dark:text-[#E3ECE8] rounded-xl border border-[#D9DEDB] dark:border-[#223531] transition"
                  title="Save as separate new quotation"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Clone as New Doc
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-[#65716D] hover:text-[#16211F] dark:hover:text-white rounded-xl transition"
                >
                  Close
                </button>

                <button
                  onClick={() => handleLoadVersion(docB, versionB.versionNumber)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#003A30] hover:bg-[#014136] text-[#DFBC64] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Load Rev {versionB.versionNumber} Into Editor
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Nested Modal: Save Custom Milestone Revision */}
      {newRevisionModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#152220] rounded-2xl p-6 border border-[#014136]/30 dark:border-[#DFBC64]/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EDF0EE] dark:border-[#223531]">
              <div className="flex items-center gap-2 text-[#003A30] dark:text-[#DFBC64]">
                <Sparkles className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase tracking-wider">
                  Save Milestone Revision
                </h4>
              </div>
              <button
                onClick={() => setNewRevisionModalOpen(false)}
                className="text-[#65716D] hover:text-[#16211F] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#65716D]">
              Capture the current document state as a named milestone in the version history timeline.
            </p>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#43504B] dark:text-[#A7B3AF] block mb-1">
                Revision Label / Milestone Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Price Negotiation Round 2, Accepted with 50% Advance"
                value={revisionLabel}
                onChange={(e) => setRevisionLabel(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#223531] rounded-xl text-xs"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#43504B] dark:text-[#A7B3AF] block mb-1">
                Change Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Summarize reason for revision, client requests, or term modifications..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#223531] rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setNewRevisionModalOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-[#65716D] hover:text-[#16211F]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewRevisionSnapshot}
                disabled={!revisionLabel.trim()}
                className="px-4 py-2 bg-[#003A30] hover:bg-[#014136] disabled:opacity-50 text-[#DFBC64] font-bold text-xs rounded-xl shadow-xs transition"
              >
                Save Revision Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
