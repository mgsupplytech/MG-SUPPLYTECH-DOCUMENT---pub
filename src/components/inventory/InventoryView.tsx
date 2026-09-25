import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../../types';
import { getInventory, saveInventory, upsertInventoryItem } from '../../services/storageService';
import { 
  Package, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Tag, 
  Layers, 
  Boxes,
  FileSpreadsheet
} from 'lucide-react';
import { SpreadsheetColumnMapperModal } from '../data/SpreadsheetColumnMapperModal';

interface InventoryViewProps {
  onAddItemToActiveDoc?: (item: InventoryItem) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onAddItemToActiveDoc }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    setItems(getInventory());
  }, []);

  const refreshList = () => {
    setItems(getInventory());
  };

  const handleStartCreate = () => {
    setFormData({
      sku: `MG-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      description: '',
      category: 'Polishing Material',
      hsnSac: '28461010',
      defaultUom: 'KG',
      packSize: '20 KG Drum',
      basePrice: 0,
      defaultTaxRate: 18,
      inStock: 0
    });
    setSelectedItem(null);
    setIsEditing(true);
  };

  const handleStartEdit = (item: InventoryItem) => {
    setFormData(item);
    setSelectedItem(item);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    upsertInventoryItem({
      ...formData,
      name: formData.name.trim()
    } as any);

    setIsEditing(false);
    refreshList();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const filtered = items.filter(i => i.id !== id);
    saveInventory(filtered);
    setItems(filtered);
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase()) ||
    i.hsnSac.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
            Product Catalog &amp; Consumables Inventory
          </h2>
          <p className="text-xs text-[#65716D]">
            Standard MG Supplytech polishing powders, diamond wheels, felts &amp; industrial sourcing items
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2b28] hover:bg-slate-200 dark:hover:bg-[#233833] text-slate-800 dark:text-[#DFBC64] border border-slate-200 dark:border-[#2a3f3b] font-bold text-xs transition shadow-xs"
            title="Upload CSV or Excel spreadsheet of consumables with column mapping"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#014136] dark:text-[#DFBC64]" />
            <span>Import CSV / Excel</span>
          </button>

          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#014136] text-[#DFBC64] font-bold text-xs hover:bg-[#002e27] shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#65716D] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by product name, SKU, HSN/SAC code, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#014136]"
        />
      </div>

      {/* Items Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#B88C2E] uppercase">
                    {item.sku}
                  </span>
                  <h3 className="font-extrabold text-sm text-[#014136] dark:text-[#DFBC64] leading-snug">
                    {item.name}
                  </h3>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[#F6F7F5] dark:bg-[#101b19] text-[#65716D]">
                  {item.category}
                </span>
              </div>

              <p className="text-xs text-[#65716D] line-clamp-2 mb-3">
                {item.description}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#EDF0EE] dark:border-[#223531]">
                <div>
                  <span className="text-[10px] text-[#65716D] block">HSN/SAC</span>
                  <span className="font-mono font-bold">{item.hsnSac}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#65716D] block">Pack Size</span>
                  <span className="font-semibold">{item.packSize || item.defaultUom}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#65716D] block">Base Rate</span>
                  <span className="font-mono font-black text-[#014136] dark:text-[#DFBC64]">
                    ₹ {item.basePrice.toLocaleString()} / {item.defaultUom}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#65716D] block">GST Rate</span>
                  <span className="font-mono font-bold">{item.defaultTaxRate}%</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-[#EDF0EE] dark:border-[#223531] flex items-center justify-between">
              {onAddItemToActiveDoc && (
                <button
                  onClick={() => onAddItemToActiveDoc(item)}
                  className="flex items-center gap-1 text-xs font-black text-[#014136] dark:text-[#DFBC64] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Active Quote</span>
                </button>
              )}

              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => handleStartEdit(item)}
                  className="p-1 text-[#65716D] hover:text-[#014136]"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Product Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#152220] rounded-2xl shadow-2xl border border-[#D9DEDB] dark:border-[#223531] overflow-hidden">
            <div className="px-6 py-4 bg-[#003A30] text-white flex items-center justify-between border-b border-[#DFBC64]">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {selectedItem ? 'Edit Product Catalog Item' : 'Add New Inventory Item'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">SKU / Item Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-bold bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">HSN/SAC</label>
                  <input
                    type="text"
                    value={formData.hsnSac || ''}
                    onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs font-mono bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">UOM</label>
                  <input
                    type="text"
                    value={formData.defaultUom || 'PCS'}
                    onChange={(e) => setFormData({ ...formData, defaultUom: e.target.value.toUpperCase() })}
                    className="w-full px-2 py-1.5 text-xs font-bold bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Pack Size</label>
                  <input
                    type="text"
                    value={formData.packSize || ''}
                    onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Base Price (INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.basePrice || 0}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg text-[#014136] dark:text-[#DFBC64]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Default GST%</label>
                  <select
                    value={formData.defaultTaxRate ?? 18}
                    onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  >
                    <option value="18">18%</option>
                    <option value="12">12%</option>
                    <option value="5">5%</option>
                    <option value="28">28%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#F6F7F5] dark:bg-[#101b19] text-[#65716D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#014136] text-[#DFBC64]"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spreadsheet CSV Column Mapping Modal */}
      <SpreadsheetColumnMapperModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        mode="inventory"
        onImportComplete={() => {
          refreshList();
        }}
      />
    </div>
  );
};
