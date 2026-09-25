import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { getCustomers, saveCustomers, upsertCustomer } from '../../services/storageService';
import { 
  Building2, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Globe, 
  Phone, 
  Mail, 
  FileText, 
  Tag, 
  BookmarkCheck,
  ArrowRight,
  FileSpreadsheet
} from 'lucide-react';
import { SpreadsheetColumnMapperModal } from '../data/SpreadsheetColumnMapperModal';

interface CustomersViewProps {
  onSelectCustomerForQuote: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ onSelectCustomerForQuote }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({});

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  const refreshList = () => {
    setCustomers(getCustomers());
  };

  const handleStartCreate = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      mobile: '',
      email: '',
      gstin: '',
      productsBought: '',
      rememberedTerms: {
        paymentTerms: '100% Advance against PI',
        deliveryTerms: '3–5 working days'
      }
    });
    setSelectedCust(null);
    setIsEditing(true);
  };

  const handleStartEdit = (c: Customer) => {
    setFormData(c);
    setSelectedCust(c);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName?.trim()) return;

    upsertCustomer({
      ...formData,
      companyName: formData.companyName.trim()
    } as any);

    setIsEditing(false);
    refreshList();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to remove this customer record?')) return;
    const filtered = customers.filter(c => c.id !== id);
    saveCustomers(filtered);
    setCustomers(filtered);
    if (selectedCust?.id === id) setSelectedCust(null);
  };

  const filteredCustomers = customers.filter(c => 
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase()) ||
    (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase())) ||
    (c.productsBought && c.productsBought.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
            Customer Master &amp; Commercial Memory Hub
          </h2>
          <p className="text-xs text-[#65716D]">
            Source: Polishing_Material_Customers_1.xlsx &bull; Exact remembered terms policy
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1a2b28] hover:bg-slate-200 dark:hover:bg-[#233833] text-slate-800 dark:text-[#DFBC64] border border-slate-200 dark:border-[#2a3f3b] font-bold text-xs transition shadow-xs"
            title="Upload CSV or Excel spreadsheet with interactive column mapping"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#014136] dark:text-[#DFBC64]" />
            <span>Import CSV / Excel</span>
          </button>

          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#014136] text-[#DFBC64] font-bold text-xs hover:bg-[#002e27] shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#65716D] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by company name, city, country, products bought, or GSTIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#014136]"
        />
      </div>

      {/* Grid of Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const isExport = cust.country.toLowerCase() !== 'india';
          const rem = cust.rememberedTerms;

          return (
            <div
              key={cust.id}
              className="bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] rounded-2xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#014136] dark:text-[#DFBC64] leading-snug">
                      {cust.companyName}
                    </h3>
                    <div className="text-[11px] text-[#65716D] flex items-center gap-1 mt-0.5">
                      <Globe className="w-3 h-3 text-[#B88C2E]" />
                      <span>{cust.city}, {cust.country}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    isExport ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isExport ? 'Export' : 'Domestic'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#43504B] dark:text-[#a2b5b0] pt-2 border-t border-[#EDF0EE] dark:border-[#223531]">
                  {cust.contactPerson && (
                    <div className="truncate"><span className="text-[#65716D]">Attn:</span> {cust.contactPerson}</div>
                  )}
                  {cust.mobile && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 text-[#65716D]" />
                      <span className="font-mono">{cust.mobile}</span>
                    </div>
                  )}
                  {cust.email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-[#65716D]" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}
                  {cust.gstin && (
                    <div className="text-[11px] font-mono text-[#014136] dark:text-[#DFBC64]">
                      GST: {cust.gstin}
                    </div>
                  )}
                  {cust.productsBought && (
                    <div className="text-[10px] text-[#65716D] mt-2 p-1.5 rounded bg-[#F6F7F5] dark:bg-[#101b19] line-clamp-2">
                      <Tag className="w-2.5 h-2.5 inline mr-1 text-[#B88C2E]" />
                      {cust.productsBought}
                    </div>
                  )}
                </div>

                {/* Remembered Terms badge box */}
                {rem && (rem.paymentTerms || rem.deliveryTerms) && (
                  <div className="mt-3 p-2 bg-[#DFBC64]/10 rounded-lg border border-[#DFBC64]/30 text-[10px] text-[#43504B] dark:text-[#E3ECE8]">
                    <div className="font-bold text-[#B88C2E] flex items-center gap-1 mb-0.5">
                      <BookmarkCheck className="w-3 h-3" />
                      <span>Remembered Terms:</span>
                    </div>
                    {rem.paymentTerms && <div>&bull; Payment: {rem.paymentTerms}</div>}
                    {rem.deliveryTerms && <div>&bull; Lead Time: {rem.deliveryTerms}</div>}
                    {rem.incoterm && <div>&bull; Incoterm: {rem.incoterm}</div>}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-3 mt-3 border-t border-[#EDF0EE] dark:border-[#223531] flex items-center justify-between">
                <button
                  onClick={() => onSelectCustomerForQuote(cust)}
                  className="flex items-center gap-1 text-xs font-black text-[#014136] dark:text-[#DFBC64] hover:underline"
                >
                  <span>Create Document</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(cust)}
                    className="p-1 text-[#65716D] hover:text-[#014136]"
                    title="Edit Customer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cust.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Customer Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#152220] rounded-2xl shadow-2xl border border-[#D9DEDB] dark:border-[#223531] overflow-hidden">
            <div className="px-6 py-4 bg-[#003A30] text-white flex items-center justify-between border-b border-[#DFBC64]">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {selectedCust ? 'Edit Customer Record' : 'Add New Customer'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country || 'India'}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={formData.gstin || ''}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#DFBC64]/10 rounded-xl border border-[#DFBC64]/30 space-y-2">
                <div className="text-xs font-bold text-[#B88C2E] uppercase">
                  Remembered Customer Terms (Memory Policy)
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#65716D]">Payment Terms</label>
                  <input
                    type="text"
                    value={formData.rememberedTerms?.paymentTerms || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      rememberedTerms: { ...formData.rememberedTerms, paymentTerms: e.target.value }
                    })}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#65716D]">Delivery / Lead Time</label>
                  <input
                    type="text"
                    value={formData.rememberedTerms?.deliveryTerms || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      rememberedTerms: { ...formData.rememberedTerms, deliveryTerms: e.target.value }
                    })}
                    className="w-full px-2 py-1 text-xs bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded"
                  />
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
                  Save Record
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
        mode="customers"
        onImportComplete={() => {
          refreshList();
        }}
      />
    </div>
  );
};
