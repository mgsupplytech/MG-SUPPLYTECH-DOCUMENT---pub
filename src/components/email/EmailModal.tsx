import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, ExternalLink, Send, Sparkles, MessageSquare } from 'lucide-react';
import { DocumentRecord } from '../../types';
import { CANONICAL_SELLER } from '../../constants/brand';
import { draftEmailWithAi } from '../../services/aiService';
import { getSettings, getEffectiveCompanyProfile } from '../../services/storageService';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  document: doc
}) => {
  const company = getEffectiveCompanyProfile(getSettings());
  const [to, setTo] = useState(doc.customerEmail || '');
  const [cc, setCc] = useState(company.email || CANONICAL_SELLER.email);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    const comp = getEffectiveCompanyProfile(getSettings());
    setTo(doc.customerEmail || '');
    setCc(comp.email || CANONICAL_SELLER.email);
    const isPriceOffer = doc.docType === 'price-offer';
    const typeLabel = isPriceOffer 
      ? 'Price Offer' 
      : doc.docType === 'proforma-invoice' 
        ? 'Proforma Invoice' 
        : 'Quotation';

    const defaultSubject = `[${comp.companyName || 'MG Supplytech'}] ${typeLabel} ${doc.docNumber} — ${doc.customerName || 'Customer'}`;
    const defaultBody = `Dear ${doc.customerName || 'Customer'},\n\n` +
      `Greetings from ${comp.companyName || 'MG Supplytech'}, ${comp.city || 'Delhi'}.\n\n` +
      `We thank you for your valued enquiry. Please find our official ${typeLabel.toLowerCase()} #${doc.docNumber} for your kind review.\n\n` +
      `SUMMARY OF COMMERCIAL TERMS:\n` +
      `• Document Reference: ${doc.docNumber}\n` +
      `• Date: ${doc.date}\n` +
      (isPriceOffer ? `• Price Basis: ${doc.priceBasis || 'Ex-Works Delhi'}\n` : `• Total Amount: ${doc.currency} ${(doc.grandTotal || 0).toLocaleString()}\n`) +
      `• Payment Terms: ${doc.paymentTerms || 'As agreed'}\n` +
      `• Delivery / Lead Time: ${doc.deliveryTerms || '3-5 business days'}\n` +
      `• Freight & Insurance: ${doc.freightInsurance || "To Buyer's Account"}\n\n` +
      `Please find the complete commercial document generated in the attachment.\n` +
      `Our technical sourcing team remains at your disposal should you require further samples or specifications.\n\n` +
      `Warm regards,\n\n` +
      `Commercial Sourcing Team\n` +
      `${comp.companyName || 'MG SUPPLYTECH'}\n` +
      `${comp.address || '177 First Floor, Vigyan Vihar, Delhi – 110092, India'}\n` +
      `Phone/WhatsApp: ${comp.phone || CANONICAL_SELLER.phone}\n` +
      `Email: ${comp.email || CANONICAL_SELLER.email}\n` +
      `Web: ${comp.website || CANONICAL_SELLER.website}`;

    setSubject(defaultSubject);
    setBody(defaultBody);
  }, [doc]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMailClient = () => {
    const mailto = `mailto:${encodeURIComponent(to)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const handleSendWhatsApp = () => {
    const rawNumber = (doc.customerContact || '').replace(/[^0-9]/g, '');
    const text = `*MG SUPPLYTECH — ${doc.docNumber}*\n\nDear ${doc.customerName},\nPlease find our official commercial document ${doc.docNumber} for ${doc.currency} ${doc.grandTotal}.\n\nPayment Terms: ${doc.paymentTerms}\nDelivery: ${doc.deliveryTerms}\n\nPlease review and let us know your confirmation.\n\nMG Supplytech (+91 83739 76489)`;
    const url = rawNumber 
      ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleAiPolish = async () => {
    setAiGenerating(true);
    try {
      const res = await draftEmailWithAi(doc);
      if (res.subject) setSubject(res.subject);
      if (res.body) setBody(res.body);
    } catch (e) {
      console.error(e);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-[#152220] rounded-2xl shadow-2xl border border-[#D9DEDB] dark:border-[#223531] flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#003A30] text-white flex items-center justify-between border-b border-[#DFBC64]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#DFBC64] text-[#003A30]">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Direct Email &amp; WhatsApp Support
              </h2>
              <div className="text-[11px] text-[#DFBC64]">
                Pre-composed formal dispatch for {doc.docNumber}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Recipient (To)</label>
              <input
                type="email"
                placeholder="customer@company.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">CC Copy</label>
              <input
                type="email"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#65716D] uppercase mb-1">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-semibold text-[#014136] dark:text-[#DFBC64]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#65716D] uppercase">Email Body</label>
              <button
                onClick={handleAiPolish}
                disabled={aiGenerating}
                className="flex items-center gap-1 text-[11px] text-[#B88C2E] font-bold hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                <span>{aiGenerating ? 'Polishing with AI...' : 'AI Rewrite / Polish'}</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F6F7F5] dark:bg-[#101b19] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg font-sans leading-relaxed text-[#16211F] dark:text-[#E3ECE8]"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-[#F6F7F5] dark:bg-[#101b19] border-t border-[#D9DEDB] dark:border-[#223531] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#1a2b28] border border-[#D9DEDB] dark:border-[#2a3f3b] rounded-lg text-xs font-bold text-[#43504B] dark:text-[#E3ECE8] hover:bg-[#eaece8]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Email Text'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366]/10 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/30 rounded-lg text-xs font-bold hover:bg-[#25D366]/20"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
          </div>

          <button
            onClick={handleOpenMailClient}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#014136] hover:bg-[#002e27] text-[#DFBC64] rounded-lg text-xs font-black shadow transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Email Client</span>
          </button>
        </div>
      </div>
    </div>
  );
};
