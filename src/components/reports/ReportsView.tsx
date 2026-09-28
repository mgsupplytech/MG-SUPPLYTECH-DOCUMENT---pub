import React, { useState, useEffect } from 'react';
import { getDocuments, formatCurrency } from '../../services/storageService';
import { DocumentRecord } from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  Printer, 
  Download, 
  Calendar, 
  FileCheck, 
  PieChart, 
  Globe2, 
  CheckCircle2, 
  Clock, 
  DollarSign,
  Building
} from 'lucide-react';
import { CANONICAL_SELLER } from '../../constants/brand';
import { MGLogo } from '../brand/BrandLogos';

export const ReportsView: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    setDocuments(getDocuments());
  }, []);

  const totalDocs = documents.length;
  const totalValue = documents.reduce((sum, d) => sum + (d.grandTotal || 0), 0);
  const acceptedValue = documents
    .filter(d => d.status === 'accepted' || d.status === 'paid')
    .reduce((sum, d) => sum + (d.grandTotal || 0), 0);
  const paidValue = documents
    .filter(d => d.status === 'paid')
    .reduce((sum, d) => sum + (d.grandTotal || 0), 0);
  const pendingValue = documents
    .filter(d => d.status === 'draft' || d.status === 'sent')
    .reduce((sum, d) => sum + (d.grandTotal || 0), 0);

  // Group by customer
  const customerMap: Record<string, { name: string; count: number; value: number }> = {};
  documents.forEach(d => {
    const name = d.customerName || 'Unknown Customer';
    if (!customerMap[name]) customerMap[name] = { name, count: 0, value: 0 };
    customerMap[name].count += 1;
    customerMap[name].value += (d.grandTotal || 0);
  });
  const topCustomers = Object.values(customerMap).sort((a, b) => b.value - a.value).slice(0, 5);

  // Export vs Domestic count
  const exportDocs = documents.filter(d => d.isExport || ((d.customerCountry || '').trim().toLowerCase() !== 'india' && (d.customerCountry || '').trim().length > 0));
  const domesticDocs = documents.filter(d => !d.isExport && (!(d.customerCountry || '').trim() || (d.customerCountry || '').trim().toLowerCase() === 'india'));

  const handlePrintReport = () => {
    document.body.classList.add('printing-report');
    const cleanup = () => {
      document.body.classList.remove('printing-report');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 45000);
    setTimeout(() => {
      window.focus();
      window.print();
    }, 100);
  };

  const handleExportCsv = () => {
    const headers = ['Doc Number', 'Type', 'Customer', 'Country', 'Date', 'Currency', 'Grand Total', 'Status'];
    const rows = documents.map(d => [
      `"${d.docNumber}"`,
      `"${d.docType}"`,
      `"${d.customerName}"`,
      `"${d.customerCountry}"`,
      `"${d.date}"`,
      `"${d.currency}"`,
      d.grandTotal || 0,
      `"${d.status}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `MG_Supplytech_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-lg font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
            Commercial Analytics &amp; Pipeline Reports
          </h2>
          <p className="text-xs text-[#65716D]">
            Summary performance of all quotes, price offers &amp; invoices for MG Supplytech
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1a2b28] border border-[#D9DEDB] dark:border-[#2a3f3b] text-[#43504B] dark:text-[#E3ECE8] font-bold text-xs rounded-xl hover:bg-[#eaece8]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#014136] text-[#DFBC64] font-bold text-xs rounded-xl hover:bg-[#002e27] shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Printable Report Wrapper */}
      <div id="printable-report" className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#65716D]">
                Total Quoted Volume
              </span>
              <div className="p-2 rounded-lg bg-[#014136]/10 text-[#014136] dark:text-[#DFBC64]">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-[#014136] dark:text-[#DFBC64]">
              {formatCurrency(totalValue, 'INR')}
            </div>
            <div className="text-[10px] text-[#65716D] mt-1">
              Across {totalDocs} generated commercial documents
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#65716D]">
                Accepted Commercials
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              {formatCurrency(acceptedValue, 'INR')}
            </div>
            <div className="text-[10px] text-[#65716D] mt-1">
              Won / approved by buyer procurement
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#65716D]">
                Payment Realized
              </span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-purple-700 dark:text-purple-400">
              {formatCurrency(paidValue, 'INR')}
            </div>
            <div className="text-[10px] text-[#65716D] mt-1">
              Bank receipts against ICICI canonical account
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#65716D]">
                Active Pipeline
              </span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black font-mono text-amber-700 dark:text-amber-400">
              {formatCurrency(pendingValue, 'INR')}
            </div>
            <div className="text-[10px] text-[#65716D] mt-1">
              Under customer review / draft stage
            </div>
          </div>
        </div>

        {/* Breakdown Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Buyers */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-4 h-4 text-[#014136] dark:text-[#DFBC64]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
                Top Buyers by Commercial Value
              </h3>
            </div>
            <div className="space-y-3">
              {topCustomers.map((cust, i) => (
                <div key={cust.name} className="flex items-center justify-between p-2 rounded-xl bg-[#F6F7F5] dark:bg-[#101b19]">
                  <div>
                    <div className="font-bold text-xs text-[#014136] dark:text-[#DFBC64]">
                      {i + 1}. {cust.name}
                    </div>
                    <div className="text-[10px] text-[#65716D]">
                      {cust.count} commercial document(s)
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-xs text-[#16211F] dark:text-[#E3ECE8]">
                    {formatCurrency(cust.value, 'INR')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Domestic vs Export Distribution */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#152220] border border-[#D9DEDB] dark:border-[#223531] shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-4 h-4 text-[#014136] dark:text-[#DFBC64]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#014136] dark:text-[#DFBC64]">
                Market Geographic Distribution
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 rounded-xl border border-[#D9DEDB] dark:border-[#2a3f3b] text-center">
                <span className="text-[10px] font-bold text-[#65716D] uppercase block">Domestic (India)</span>
                <span className="text-2xl font-black text-[#014136] dark:text-[#DFBC64]">{domesticDocs.length}</span>
                <span className="text-[10px] text-[#65716D] block mt-1">INR Invoices</span>
              </div>

              <div className="p-4 rounded-xl border border-[#D9DEDB] dark:border-[#2a3f3b] text-center">
                <span className="text-[10px] font-bold text-[#65716D] uppercase block">Export (International)</span>
                <span className="text-2xl font-black text-[#B88C2E]">{exportDocs.length}</span>
                <span className="text-[10px] text-[#65716D] block mt-1">USD / Global PI</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#003A30] text-white text-[11px] leading-relaxed">
              <b className="text-[#DFBC64] uppercase tracking-wide block mb-1">Export Compliance Reminder</b>
              Always confirm Incoterm, port of loading/discharge, and required inspection/certificates for international consignees before final order processing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
