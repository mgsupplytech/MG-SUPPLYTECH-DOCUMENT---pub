import React from 'react';
import { AppSettings, DocumentRecord } from '../../types';
import { CANONICAL_SELLER, STANDARD_TERMS_DOMESTIC, STANDARD_TERMS_EXPORT, PRICE_OFFER_TERMS } from '../../constants/brand';
import { 
  formatCurrency, 
  numberToWords, 
  getSettings, 
  getEffectiveCompanyProfile, 
  getDocumentBankAccount 
} from '../../services/storageService';
import { MGLogo, WhatsAppQR } from '../brand/BrandLogos';

interface DocumentViewProps {
  document: DocumentRecord;
  printMode?: boolean;
  settings?: AppSettings;
}

// Helper to determine if a reference number is just a redundant duplicate of the document number
const isDuplicateReference = (ref?: string, docNum?: string): boolean => {
  if (!ref || !ref.trim()) return true;
  if (!docNum || !docNum.trim()) return false;
  const cleanRef = ref.trim().toLowerCase().replace(/^ref[\s/:-]*/i, '').trim();
  const cleanDoc = docNum.trim().toLowerCase().trim();
  return cleanRef === cleanDoc || cleanRef === `ref/${cleanDoc}` || cleanRef.includes(cleanDoc);
};

export const DocumentView: React.FC<DocumentViewProps> = ({ document: doc, printMode = false, settings }) => {
  const appSettings = settings || getSettings();
  const company = getEffectiveCompanyProfile(appSettings);
  const bank = getDocumentBankAccount(doc, appSettings);

  const isExport = doc.isExport || (doc.customerCountry && doc.customerCountry.toLowerCase() !== 'india');
  const currency = doc.currency || (isExport ? 'USD' : 'INR');
  const isPriceOffer = doc.docType === 'price-offer';
  const isLetterhead = doc.docType === 'letterhead';
  const isChallan = doc.docType === 'delivery-challan';
  const isInvoice = doc.docType === 'tax-invoice';
  const isPI = doc.docType === 'proforma-invoice';

  // Choose title and kicker
  let docTitle = 'Quotation';
  let docKicker = 'Commercial Offer';

  if (isPriceOffer) {
    docTitle = 'Price Offer';
    docKicker = 'Commercial Rate Confirmation';
  } else if (isPI) {
    docTitle = 'Proforma Invoice';
    docKicker = 'Pre-Shipment Commercial Document';
  } else if (isInvoice) {
    docTitle = 'Tax Invoice';
    docKicker = 'Original for Recipient';
  } else if (isChallan) {
    docTitle = 'Delivery Challan';
    docKicker = 'Goods Dispatch Voucher';
  } else if (isLetterhead) {
    docTitle = 'Official Letter';
    docKicker = 'Corporate Letterhead';
  }

  const termsList = isPriceOffer 
    ? PRICE_OFFER_TERMS 
    : isExport 
      ? STANDARD_TERMS_EXPORT 
      : STANDARD_TERMS_DOMESTIC;

  return (
    <div 
      id="mg-printable-document" 
      className="a4-document bg-white text-[#16211F] font-['Segoe_UI',Arial,sans-serif] mx-auto relative shadow-2xl print:shadow-none print:m-0 print:w-full print:bg-white text-[10pt] leading-[1.42] overflow-visible"
      style={{
        width: printMode ? '100%' : '210mm',
        minHeight: printMode ? 'auto' : '297mm',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Brand Accent Bar */}
      <div className="h-[3.2mm] bg-[#003A30] w-full" />

      {/* Branded Header */}
      <header className="px-[11mm] pt-[5mm] pb-[4mm] grid grid-cols-[23mm_1fr_auto_18mm] gap-[4mm] items-center border-b border-[#D9DEDB] bg-white">
        <div className="flex items-center justify-start overflow-hidden">
          {company.logoUrl ? (
            <img 
              src={company.logoUrl} 
              alt={company.companyName}
              className="object-contain max-h-[16mm] max-w-[23mm]"
              style={{ 
                transform: `scale(${(company.logoScale || 100) / 100})`,
                transformOrigin: 'left center'
              }}
            />
          ) : (
            <MGLogo size={70} variant={company.logoVariant || 'original'} />
          )}
        </div>

        <div className="min-w-0 pr-2">
          {/* Company Name using website's authentic Playfair Display font */}
          <div className="text-[16pt] leading-tight font-black tracking-tight text-[#014136] uppercase font-['Playfair_Display',Georgia,serif]">
            {company.companyName}
          </div>
          <div className="text-[6.8pt] tracking-[0.2em] font-extrabold text-[#B88C2E] uppercase mt-[1mm]">
            {company.tagline || CANONICAL_SELLER.branding.tagline}
          </div>
          <div className="mt-[1.5mm] text-[6.5pt] leading-[1.35] text-[#65716D]">
            <div className="font-bold text-[#014136]">{company.address}</div>
            <div className="truncate">
              Phone: <b>{company.phone}</b> &bull; Email: <b>{company.email}</b>
            </div>
          </div>
        </div>

        <div className="text-right text-[#014136] uppercase pl-2 border-l border-[#EDF0EE]">
          <div className="text-[7pt] tracking-[0.08em] font-black leading-tight text-[#003A30]">
            {(company.headerTrustText || CANONICAL_SELLER.branding.headerTrust).split(' ').slice(0, 2).join(' ')}<br/>
            {(company.headerTrustText || CANONICAL_SELLER.branding.headerTrust).split(' ').slice(2).join(' ')}
          </div>
          <div className="mt-[1.8mm] text-[7.5pt] leading-snug text-[#16211F] normal-case font-mono">
            <span className="font-bold">{doc.docNumber}</span><br />
            <span className="text-[#65716D]">{doc.date}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <WhatsAppQR size={56} />
        </div>
      </header>

      {/* Dark Forest Green Sub-strip with Gold Accent - Prominently Featuring GSTIN, IEC, and UDYAM */}
      <div className="mx-[11mm] px-[3mm] py-[2mm] flex flex-wrap justify-between items-center text-[6.8pt] tracking-[0.02em] bg-[#003A30] text-white border-b-[1.15mm] border-[#DFBC64] gap-1">
        <span className="font-bold tracking-wider uppercase">{company.companyName}</span>
        <div className="flex items-center gap-3 font-mono font-medium">
          <span>GSTIN: <b className="text-[#DFBC64]">{company.gstin}</b></span>
          {company.iec && <span>IEC: <b className="text-[#DFBC64]">{company.iec}</b></span>}
          {company.udyam && <span>UDYAM: <b className="text-[#DFBC64]">{company.udyam}</b></span>}
        </div>
        <span className="font-semibold uppercase tracking-wider">{doc.customerCountry || 'India'} &bull; {currency}</span>
      </div>

      {/* Main Document Content Body with text-safe margins */}
      <main className="px-[11mm] pt-0 pb-[20mm]">
        {/* Compact, refined Document Head strip - saves valuable vertical letterhead space */}
        {!isLetterhead && (
          <div className="flex justify-between items-end gap-[4mm] py-[2.2mm] border-b border-[#EDF0EE]">
            <div className="border-l-[1.2mm] border-[#DFBC64] pl-[2.5mm]">
              <div className="text-[6.2pt] font-bold tracking-[0.14em] text-[#B88C2E] uppercase">
                {docKicker}
              </div>
              <h1 className="text-[12.5pt] leading-tight font-black text-[#014136] uppercase tracking-normal m-0 font-['Playfair_Display',Georgia,serif]">
                {docTitle}
              </h1>
              {isPriceOffer && doc.priceNote && (
                <div className="text-[7pt] text-[#65716D] mt-0.5">{doc.priceNote}</div>
              )}
            </div>

            <div className="text-right text-[7.5pt]">
              {isPriceOffer && doc.priceBasis && (
                <div className="text-[7pt] font-black text-[#B88C2E] uppercase tracking-wider">
                  Price Basis: <span className="text-[#014136]">{doc.priceBasis}</span>
                </div>
              )}
              {doc.validTill && (
                <div className="text-[#65716D]">
                  Valid Till: <b className="text-[#014136]">{doc.validTill}</b>
                </div>
              )}
              {/* Only show buyer reference if genuinely provided and NOT duplicating docNumber */}
              {doc.reference && !isDuplicateReference(doc.reference, doc.docNumber) && (
                <div className="text-[#65716D] font-mono">
                  Buyer Ref: <span className="font-semibold text-[#014136]">{doc.reference}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Letterhead Specific Body Layout */}
        {isLetterhead ? (
          <div className="pt-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#EDF0EE]">
              <div className="border border-[#D9DEDB] rounded p-3 bg-white">
                <h3 className="text-[7.5pt] font-black uppercase text-[#003A30] tracking-wider mb-2">To</h3>
                <div className="text-[8.5pt]">
                  {doc.letterRecipientName && <div className="font-bold text-[#014136]">{doc.letterRecipientName}</div>}
                  <div className="font-semibold">{doc.customerName || doc.letterRecipientCompany}</div>
                  <div className="text-[#65716D] whitespace-pre-line">{doc.customerAddress || doc.letterRecipientAddress}</div>
                  {doc.customerContact && <div className="text-[#65716D] mt-1">Tel: {doc.customerContact}</div>}
                  {doc.customerEmail && <div className="text-[#65716D]">Email: {doc.customerEmail}</div>}
                </div>
              </div>
              <div className="border border-[#D9DEDB] rounded p-3 bg-white">
                <h3 className="text-[7.5pt] font-black uppercase text-[#003A30] tracking-wider mb-2">Reference</h3>
                <table className="w-full text-[8pt] border-collapse">
                  <tbody>
                    <tr>
                      <td className="text-[#65716D] font-bold py-1 w-[32%]">Date</td>
                      <td className="w-[8%] text-[#B88C2E] font-bold text-center">:</td>
                      <td className="font-semibold">{doc.date}</td>
                    </tr>
                    <tr>
                      <td className="text-[#65716D] font-bold py-1">Reference</td>
                      <td className="text-[#B88C2E] font-bold text-center">:</td>
                      <td className="font-mono text-[7.5pt]">{doc.letterReference || doc.docNumber}</td>
                    </tr>
                    <tr>
                      <td className="text-[#65716D] font-bold py-1">Department</td>
                      <td className="text-[#B88C2E] font-bold text-center">:</td>
                      <td className="font-semibold text-[#014136]">Commercial Desk</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Corporate Letterhead Subject Line: Professional, proportional, elegant font */}
            {doc.letterSubject && (
              <div className="mt-3.5 mb-2 py-1 px-2.5 bg-[#F6F7F5] border-l-[3px] border-[#014136] rounded-r text-[9pt]">
                <span className="font-black uppercase tracking-wider text-[7.5pt] text-[#014136] mr-2">Subject:</span>
                <span className="font-bold text-[#16211F]">{doc.letterSubject}</span>
              </div>
            )}

            <div className="py-4 text-[9pt] leading-relaxed text-[#16211F] whitespace-pre-line min-h-[120mm]">
              {doc.letterBody}
            </div>

            <div className="pt-4 border-t border-[#EDF0EE] break-inside-avoid">
              <div className="text-[8.5pt] text-[#43504B]">Yours faithfully,</div>
              <div className="h-[14mm]"></div>
              <div className="font-extrabold text-[#014136] text-[9.5pt]">For MG SUPPLYTECH</div>
              <div className="text-[8pt] text-[#65716D]">Authorised Signatory</div>
              {doc.enclosures && (
                <div className="mt-4 p-2 bg-[#F6F7F5] rounded border border-[#D9DEDB] text-[7.5pt] text-[#43504B]">
                  <b>Enclosures:</b><br />
                  <span className="whitespace-pre-line">{doc.enclosures}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Info Grid: Buyer & Transaction Cards */}
            <div className="grid grid-cols-[1.38fr_1fr] gap-[4mm] mt-[4mm]">
              {/* Buyer Card */}
              <div className="border border-[#D9DEDB] rounded-[2mm] overflow-hidden bg-white break-inside-avoid">
                <h3 className="bg-[#003A30] text-white text-[7.2pt] font-black uppercase tracking-[0.08em] px-[3mm] py-[2mm] m-0">
                  {isChallan ? 'Consignee / Deliver To' : 'Buyer / Customer Details'}
                </h3>
                <div className="p-[2.8mm]">
                  <table className="w-full border-collapse text-[8pt]">
                    <tbody>
                      <tr>
                        <td className="w-[33%] text-[#65716D] font-bold py-[0.8mm] align-top">Company</td>
                        <td className="w-[6%] text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                        <td className="font-bold text-[#014136] py-[0.8mm] align-top">{doc.customerName || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Address</td>
                        <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                        <td className="text-[#43504B] py-[0.8mm] align-top leading-tight">
                          {doc.customerAddress}
                          {doc.customerCity && `, ${doc.customerCity}`}
                          {doc.customerState && `, ${doc.customerState}`}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-[#65716D] font-bold py-[0.8mm] align-top">
                          {isExport ? 'Destination Country' : 'State & State Code'}
                        </td>
                        <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                        <td className="font-semibold text-[#16211F] py-[0.8mm] align-top">
                          {isExport 
                            ? (doc.countryOfFinalDestination || doc.customerCountry)
                            : `${doc.customerState || 'Delhi'} (Code: ${doc.stateCode || '07'})`
                          }
                        </td>
                      </tr>
                      <tr>
                        <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Contact / Mobile</td>
                        <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                        <td className="font-mono text-[#16211F] py-[0.8mm] align-top">{doc.customerContact || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="text-[#65716D] font-bold py-[0.8mm] align-top">
                          {isExport ? 'Tax ID / Foreign VAT' : 'GSTIN / UIN'}
                        </td>
                        <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                        <td className="font-mono font-semibold text-[#014136] py-[0.8mm] align-top">
                          {doc.customerTaxId || (isExport ? 'N/A (Zero-Rated Export)' : 'Unregistered / To be advised')}
                        </td>
                      </tr>
                      {doc.buyerOrderNo && (
                        <tr>
                          <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Buyer P.O. Ref</td>
                          <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                          <td className="font-mono font-bold text-[#B88C2E] py-[0.8mm] align-top">
                            {doc.buyerOrderNo} {doc.buyerOrderDate ? `dated ${doc.buyerOrderDate}` : ''}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Document Meta Card */}
              <div className="border border-[#D9DEDB] rounded-[2mm] overflow-hidden bg-white break-inside-avoid">
                <h3 className="bg-[#003A30] text-white text-[7.2pt] font-black uppercase tracking-[0.08em] px-[3mm] py-[2mm] m-0">
                  {docTitle} Details
                </h3>
                <div className="p-[2.8mm]">
                  <table className="w-full border-collapse text-[8pt]">
                    <tbody>
                      <tr>
                        <td className="w-[36%] text-[#65716D] font-bold py-[0.8mm] align-top">Doc Number</td>
                        <td className="w-[6%] text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                        <td className="font-mono font-bold text-[#014136] py-[0.8mm] align-top">{doc.docNumber}</td>
                      </tr>
                      <tr>
                        <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Date</td>
                        <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                        <td className="font-semibold text-[#16211F] py-[0.8mm] align-top">{doc.date}</td>
                      </tr>
                      <tr>
                        <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Currency</td>
                        <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                        <td className="font-bold text-[#014136] py-[0.8mm] align-top">{currency}</td>
                      </tr>
                      {isPriceOffer ? (
                        <tr>
                          <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Price Basis</td>
                          <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                          <td className="font-semibold text-[#16211F] py-[0.8mm] align-top">{doc.priceBasis || (isExport ? 'FOB Mundra' : 'Ex-Works Delhi')}</td>
                        </tr>
                      ) : (
                        <tr>
                          <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Payment Terms</td>
                          <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                          <td className="text-[#43504B] text-[7.5pt] py-[0.8mm] align-top leading-tight truncate max-w-[120px]">
                            {doc.paymentTerms || 'As agreed'}
                          </td>
                        </tr>
                      )}
                      {isExport ? (
                        <>
                          <tr>
                            <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Incoterm</td>
                            <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                            <td className="font-bold text-[#B88C2E] py-[0.8mm] align-top">{doc.incoterm || 'FOB Mundra Port'}</td>
                          </tr>
                          <tr>
                            <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Port of Loading</td>
                            <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                            <td className="font-semibold text-[#16211F] py-[0.8mm] align-top text-[7.5pt]">{doc.portOfLoading || 'Mundra / ICD Delhi'}</td>
                          </tr>
                          <tr>
                            <td className="text-[#65716D] font-bold py-[0.8mm] align-top">IEC / LUT ARN</td>
                            <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                            <td className="font-mono text-[7pt] text-[#014136] py-[0.8mm] align-top">{doc.iecCode || '0517036281'} / {doc.lutArn || 'AD240324001234F'}</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr>
                            <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Place of Supply</td>
                            <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                            <td className="font-semibold text-[#16211F] py-[0.8mm] align-top text-[7.5pt]">{doc.placeOfSupply || doc.customerState || 'Delhi (07)'}</td>
                          </tr>
                          {doc.ewayBillNo && (
                            <tr>
                              <td className="text-[#65716D] font-bold py-[0.8mm] align-top">E-Way Bill No</td>
                              <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                              <td className="font-mono font-bold text-[#014136] py-[0.8mm] align-top text-[7.5pt]">{doc.ewayBillNo}</td>
                            </tr>
                          )}
                          {doc.vehicleNo && (
                            <tr>
                              <td className="text-[#65716D] font-bold py-[0.8mm] align-top">Vehicle / LR</td>
                              <td className="text-[#B88C2E] font-bold text-center py-[0.8mm] align-top">:</td>
                              <td className="font-mono text-[#16211F] py-[0.8mm] align-top text-[7.5pt]">{doc.vehicleNo} {doc.lrNumber ? `(${doc.lrNumber})` : ''}</td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Items Table with repeated thead on continuation pages */}
            <div className="mt-[5mm] table-wrap">
              {isPriceOffer ? (
                /* Price Offer specialized clean table: strictly rate schedule, NO QTY */
                <table className="w-full border-collapse text-[8.2pt] table-fixed">
                  <colgroup>
                    <col style={{ width: '7%' }} />
                    <col style={{ width: '47%' }} />
                    <col style={{ width: '23%' }} />
                    <col style={{ width: '23%' }} />
                  </colgroup>
                  <thead className="table-header-group">
                    <tr className="bg-[#003A30] text-white text-[7pt] uppercase tracking-[0.06em]">
                      <th className="py-[2.5mm] px-[2mm] text-center border-r border-white/10">#</th>
                      <th className="py-[2.5mm] px-[2mm] text-left border-r border-white/10">Product Description &amp; Specifications</th>
                      <th className="py-[2.5mm] px-[2mm] text-center border-r border-white/10">Packaging / Drum Size</th>
                      <th className="py-[2.5mm] px-[2mm] text-right">Offered Rate / Price ({currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.items.map((item, idx) => (
                      <tr key={item.id || idx} className={`break-inside-avoid ${idx % 2 === 1 ? 'bg-[#FBFDFB]' : 'bg-white'}`}>
                        <td className="py-[2.5mm] px-[2mm] text-center text-[#65716D] border-b border-[#D9DEDB]">{idx + 1}</td>
                        <td className="py-[2.5mm] px-[2mm] font-bold text-[#014136] border-b border-[#D9DEDB]">
                          {item.description}
                          {item.notes && <span className="block text-[7pt] font-normal text-[#65716D] mt-0.5">{item.notes}</span>}
                        </td>
                        <td className="py-[2.5mm] px-[2mm] text-center text-[#43504B] border-b border-[#D9DEDB]">
                          {item.packSize || item.uom || 'Standard Packaging'}
                        </td>
                        <td className="py-[2.5mm] px-[2mm] text-right font-extrabold text-[#014136] border-b border-[#D9DEDB] text-[9pt] font-mono">
                          {formatCurrency(item.unitPrice, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : isExport ? (
                /* Export Quotation / PI / Tax Invoice table: Clean export billing with NO domestic GST Tax% column */
                <table className="w-full border-collapse text-[8pt] table-fixed">
                  <colgroup>
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '41%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '12%' }} />
                  </colgroup>
                  <thead className="table-header-group">
                    <tr className="bg-[#003A30] text-white text-[6.8pt] uppercase tracking-[0.05em]">
                      <th className="py-[2.2mm] px-[1.5mm] text-center border-r border-white/10">#</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-left border-r border-white/10">Description of Goods &amp; Specifications</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-center border-r border-white/10">HSN Code</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-right border-r border-white/10">Quantity</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-center border-r border-white/10">UOM</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-right border-r border-white/10">Unit Price ({currency})</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-right">Total Amount ({currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.items.map((item, idx) => {
                      const qty = Number(item.qty || 0);
                      const rate = Number(item.unitPrice || 0);
                      const discount = (qty * rate * (Number(item.discountPercent || 0))) / 100;
                      const lineTotal = (qty * rate) - discount;

                      return (
                        <tr key={item.id || idx} className={`break-inside-avoid ${idx % 2 === 1 ? 'bg-[#FBFDFB]' : 'bg-white'}`}>
                          <td className="py-[2mm] px-[1.5mm] text-center text-[#65716D] border-b border-[#D9DEDB]">{idx + 1}</td>
                          <td className="py-[2mm] px-[1.5mm] border-b border-[#D9DEDB]">
                            <span className="font-bold text-[#014136] block">{item.description}</span>
                            {item.packSize && (
                              <span className="text-[6.8pt] text-[#B88C2E] font-medium block">Pack: {item.packSize}</span>
                            )}
                            {item.notes && (
                              <span className="text-[6.8pt] text-[#65716D] block">{item.notes}</span>
                            )}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-center font-mono text-[7.5pt] text-[#43504B] border-b border-[#D9DEDB]">
                            {item.hsnSac || '—'}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-right font-mono font-semibold text-[#16211F] border-b border-[#D9DEDB]">
                            {qty.toLocaleString()}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-center text-[#65716D] text-[7.5pt] border-b border-[#D9DEDB]">
                            {item.uom || 'PCS'}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-right font-mono text-[#16211F] border-b border-[#D9DEDB]">
                            {formatCurrency(rate, currency).replace(currency, '').trim()}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-right font-mono font-bold text-[#014136] border-b border-[#D9DEDB]">
                            {formatCurrency(lineTotal, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* Domestic Commercial Quotation / PI / Tax Invoice table: with GST breakdown */
                <table className="w-full border-collapse text-[8pt] table-fixed">
                  <colgroup>
                    <col style={{ width: '5%' }} />
                    <col style={{ width: '34%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '14%' }} />
                  </colgroup>
                  <thead className="table-header-group">
                    <tr className="bg-[#003A30] text-white text-[6.8pt] uppercase tracking-[0.05em]">
                      <th className="py-[2.2mm] px-[1.5mm] text-center border-r border-white/10">#</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-left border-r border-white/10">Item Description</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-center border-r border-white/10">HSN/SAC</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-right border-r border-white/10">Qty</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-center border-r border-white/10">UOM</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-right border-r border-white/10">Unit Rate (₹)</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-center border-r border-white/10">GST%</th>
                      <th className="py-[2.2mm] px-[1.5mm] text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.items.map((item, idx) => {
                      const qty = Number(item.qty || 0);
                      const rate = Number(item.unitPrice || 0);
                      const discount = (qty * rate * (Number(item.discountPercent || 0))) / 100;
                      const lineTotal = (qty * rate) - discount;

                      return (
                        <tr key={item.id || idx} className={`break-inside-avoid ${idx % 2 === 1 ? 'bg-[#FBFDFB]' : 'bg-white'}`}>
                          <td className="py-[2mm] px-[1.5mm] text-center text-[#65716D] border-b border-[#D9DEDB]">{idx + 1}</td>
                          <td className="py-[2mm] px-[1.5mm] border-b border-[#D9DEDB]">
                            <span className="font-bold text-[#014136] block">{item.description}</span>
                            {item.packSize && (
                              <span className="text-[6.8pt] text-[#B88C2E] font-medium block">Pack: {item.packSize}</span>
                            )}
                            {item.notes && (
                              <span className="text-[6.8pt] text-[#65716D] block">{item.notes}</span>
                            )}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-center font-mono text-[7.5pt] text-[#43504B] border-b border-[#D9DEDB]">
                            {item.hsnSac || '—'}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-right font-mono font-semibold text-[#16211F] border-b border-[#D9DEDB]">
                            {qty.toLocaleString()}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-center text-[#65716D] text-[7.5pt] border-b border-[#D9DEDB]">
                            {item.uom || 'PCS'}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-right font-mono text-[#16211F] border-b border-[#D9DEDB]">
                            {formatCurrency(rate, currency).replace(currency, '').trim()}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-center font-mono text-[7.2pt] text-[#65716D] border-b border-[#D9DEDB]">
                            {`${item.taxRate || 18}%`}
                          </td>
                          <td className="py-[2mm] px-[1.5mm] text-right font-mono font-bold text-[#014136] border-b border-[#D9DEDB]">
                            {formatCurrency(lineTotal, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Price Offer Scope Box (When document is price offer) */}
            {isPriceOffer && (
              <div className="mt-[4mm] p-[3mm] rounded-[2mm] bg-[#F6F7F5] border border-[#D9DEDB] border-l-[3px] border-l-[#014136] break-inside-avoid">
                <div className="grid grid-cols-[1.4fr_1fr] gap-4 items-start">
                  <div>
                    <span className="text-[7.5pt] font-black uppercase text-[#014136] tracking-wider block mb-1">
                      Commercial Rate Schedule Terms &amp; Conditions
                    </span>
                    <p className="text-[7.5pt] text-[#43504B] leading-relaxed m-0">
                      This Price Offer is a non-binding unit rate quotation for technical &amp; commercial evaluation. Quantities, billing calculations, and statutory tax obligations are not included at this stage. Please contact our commercial desk or convert this offer into a formal Quotation or Proforma Invoice once order quantities are finalized.
                    </p>
                  </div>
                  <div className="border-l border-[#D9DEDB] pl-3 space-y-1 text-[7.5pt]">
                    <div><b className="text-[#65716D]">Price Basis:</b> <span className="font-bold text-[#014136]">{doc.priceBasis || (isExport ? 'FOB Mundra Port' : 'Ex-Works Delhi')}</span></div>
                    <div><b className="text-[#65716D]">Validity:</b> <span className="font-semibold text-[#B88C2E]">{doc.validityText || '30 Days from issue'}</span></div>
                    <div><b className="text-[#65716D]">Taxes:</b> <span className="text-[#43504B]">Extra as applicable at proforma stage</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Summary & Totals Box (For Quotation, PI, Tax Invoice, Challan) */}
            {!isPriceOffer && (
              <div className="flex justify-between items-start mt-[4mm] gap-4 break-inside-avoid">
                {/* Left: Amount in words & Bank Details */}
                <div className="flex-1 pr-4">
                  <div className="text-[7.5pt] text-[#43504B] mb-2 p-2 rounded bg-[#F6F7F5] border border-[#D9DEDB]">
                    <b className="text-[#014136] uppercase">Amount in Words:</b><br />
                    <span className="font-semibold italic">{doc.amountInWords || numberToWords(doc.grandTotal, currency)}</span>
                  </div>

                  {/* Bank Details Box: Tailored for Domestic (NEFT/RTGS) vs Export (SWIFT/AD Code Wire) */}
                  <div className="border border-[#D9DEDB] rounded-[2mm] overflow-hidden bg-white mt-2">
                    <div className="bg-[#003A30] text-white text-[7pt] font-black uppercase px-2.5 py-1 tracking-wider flex justify-between items-center">
                      <span>{isExport ? 'International Wire Remittance (Export Trade Account)' : 'Direct Bank Transfer Details (NEFT / RTGS)'}</span>
                      <span className="text-[#DFBC64] font-mono text-[6.5pt]">{isExport ? 'EXPORT EEFC' : 'DOMESTIC CURRENT'}</span>
                    </div>
                    <div className="p-2 text-[7.5pt]">
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="text-[#65716D] font-bold w-[32%]">Beneficiary</td>
                            <td className="w-[6%] text-[#B88C2E] text-center font-bold">:</td>
                            <td className="font-bold text-[#014136] uppercase">{bank.beneficiaryName || company.legalName || company.companyName}</td>
                          </tr>
                          <tr>
                            <td className="text-[#65716D] font-bold">Bank Name</td>
                            <td className="text-[#B88C2E] text-center font-bold">:</td>
                            <td className="font-bold text-[#014136]">{bank.bankName}</td>
                          </tr>
                          <tr>
                            <td className="text-[#65716D] font-bold">A/C Number</td>
                            <td className="text-[#B88C2E] text-center font-bold">:</td>
                            <td className="font-mono font-bold text-[#014136]">{bank.accountNumber}</td>
                          </tr>
                          <tr>
                            <td className="text-[#65716D] font-bold">Account Type</td>
                            <td className="text-[#B88C2E] text-center font-bold">:</td>
                            <td className="font-medium text-[#16211F]">{bank.accountType || (isExport ? 'EEFC / Export Trade Account' : 'Current Account')}</td>
                          </tr>
                          {isExport ? (
                            <>
                              <tr>
                                <td className="text-[#65716D] font-bold">SWIFT / BIC</td>
                                <td className="text-[#B88C2E] text-center font-bold">:</td>
                                <td className="font-mono font-bold text-[#014136]">{bank.swiftBic || 'ICICINBB001'}</td>
                              </tr>
                              <tr>
                                <td className="text-[#65716D] font-bold">AD Code</td>
                                <td className="text-[#B88C2E] text-center font-bold">:</td>
                                <td className="font-mono font-semibold text-[#014136]">{bank.adCode || '0310083'}</td>
                              </tr>
                              {bank.correspondentBank && (
                                <tr>
                                  <td className="text-[#65716D] font-bold">Correspondent</td>
                                  <td className="text-[#B88C2E] text-center font-bold">:</td>
                                  <td className="text-[7pt] text-[#43504B]">{bank.correspondentBank}</td>
                                </tr>
                              )}
                              {bank.branch && (
                                <tr>
                                  <td className="text-[#65716D] font-bold">Branch</td>
                                  <td className="text-[#B88C2E] text-center font-bold">:</td>
                                  <td className="text-[7pt] text-[#43504B]">{bank.branch}</td>
                                </tr>
                              )}
                            </>
                          ) : (
                            <>
                              <tr>
                                <td className="text-[#65716D] font-bold">IFSC Code</td>
                                <td className="text-[#B88C2E] text-center font-bold">:</td>
                                <td className="font-mono font-bold text-[#014136]">{bank.ifsc || 'ICIC0000831'}</td>
                              </tr>
                              {bank.branch && (
                                <tr>
                                  <td className="text-[#65716D] font-bold">Branch</td>
                                  <td className="text-[#B88C2E] text-center font-bold">:</td>
                                  <td className="text-[7pt] text-[#43504B]">{bank.branch}</td>
                                </tr>
                              )}
                              {bank.upiId && (
                                <tr>
                                  <td className="text-[#65716D] font-bold">UPI ID</td>
                                  <td className="text-[#B88C2E] text-center font-bold">:</td>
                                  <td className="font-mono text-[#014136]">{bank.upiId}</td>
                                </tr>
                              )}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Statutory Export Declaration */}
                  {isExport && (
                    <div className="mt-2 py-1 px-2.5 bg-[#F6F7F5] border-l-[3px] border-[#014136] rounded text-[6.5pt] font-bold text-[#014136] leading-tight">
                      SUPPLY MEANT FOR EXPORT UNDER BOND OR LETTER OF UNDERTAKING (LUT ARN: {doc.lutArn || company.lutArn || 'AD240324001234F'}) WITHOUT PAYMENT OF INTEGRATED TAX. IEC: {doc.iecCode || company.iec || '0517036281'}.
                    </div>
                  )}
                </div>

                {/* Right: Totals summary card */}
                <div className="w-[84mm] border-t border-[#D9DEDB] bg-white pt-1">
                  <div className="grid grid-cols-[1fr_34mm] py-[1.2mm] border-b border-[#EDF0EE] text-[7.8pt]">
                    <div className="text-[#65716D] font-medium">{isExport ? 'Net FOB / CIF Value' : 'Taxable Subtotal'}</div>
                    <div className="text-right font-mono font-bold text-[#16211F]">
                      {formatCurrency(doc.subtotal, currency)}
                    </div>
                  </div>

                  {doc.discountTotal > 0 && (
                    <div className="grid grid-cols-[1fr_34mm] py-[1.2mm] border-b border-[#EDF0EE] text-[7.8pt]">
                      <div className="text-[#B88C2E] font-medium">Trade Discount</div>
                      <div className="text-right font-mono font-bold text-[#B88C2E]">
                        - {formatCurrency(doc.discountTotal, currency)}
                      </div>
                    </div>
                  )}

                  {!isExport && doc.taxTotal > 0 && (
                    <div className="grid grid-cols-[1fr_34mm] py-[1.2mm] border-b border-[#EDF0EE] text-[7.8pt]">
                      <div className="text-[#65716D] font-medium">CGST + SGST / IGST</div>
                      <div className="text-right font-mono font-bold text-[#16211F]">
                        {formatCurrency(doc.taxTotal, currency)}
                      </div>
                    </div>
                  )}

                  {isExport && (
                    <div className="grid grid-cols-[1fr_34mm] py-[1.2mm] border-b border-[#EDF0EE] text-[7.5pt]">
                      <div className="text-[#65716D] font-medium">Export Duties / IGST</div>
                      <div className="text-right font-mono text-[#014136] font-semibold">
                        0.00 (Zero Rated under LUT)
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-[1fr_36mm] pt-[2.5mm] mt-1 border-t-2 border-[#DFBC64] text-[10.5pt] text-[#003A30]">
                    <div className="font-black uppercase tracking-tight">Grand Total</div>
                    <div className="text-right font-mono font-black text-[#014136]">
                      {formatCurrency(doc.grandTotal, currency)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Commercial Terms & Notes Panels */}
            <div className="grid grid-cols-2 gap-[4mm] mt-[4mm] break-inside-avoid">
              <section className="border-t-2 border-[#DFBC64] pt-[2mm]">
                <h4 className="text-[7.2pt] font-black uppercase text-[#014136] tracking-[0.08em] mb-[1.2mm]">
                  Commercial Terms
                </h4>
                <div className="text-[7.5pt] text-[#43504B] space-y-[0.8mm]">
                  <div><b>Payment Terms:</b> {doc.paymentTerms || '100% Advance against PI'}</div>
                  <div><b>Delivery / Lead Time:</b> {doc.deliveryTerms || '3-5 business days'}</div>
                  <div><b>Freight / Insurance:</b> {doc.freightInsurance || "To Buyer's Account"}</div>
                  {doc.validityText && <div><b>Validity:</b> {doc.validityText}</div>}
                </div>
              </section>

              <section className="border-t-2 border-[#DFBC64] pt-[2mm]">
                <h4 className="text-[7.2pt] font-black uppercase text-[#014136] tracking-[0.08em] mb-[1.2mm]">
                  Notes &amp; Instructions
                </h4>
                <div className="text-[7.5pt] text-[#43504B] leading-relaxed">
                  {doc.notes || 'All rates are quoted in accordance with MG Supplytech standard sourcing terms. Test certificates provided with dispatch.'}
                </div>
              </section>
            </div>

            {/* Export Dispatch Information Block (when non-India) */}
            {isExport && (
              <div className="grid grid-cols-3 gap-[3mm] mt-[4mm] break-inside-avoid">
                <div className="border border-[#D9DEDB] rounded p-[2mm] bg-white">
                  <b className="block text-[6.8pt] font-black text-[#014136] uppercase tracking-wider mb-0.5">Incoterm &amp; Port</b>
                  <span className="text-[7.5pt] text-[#43504B] font-semibold">{doc.incoterm || 'FOB Indian Port'}</span>
                </div>
                <div className="border border-[#D9DEDB] rounded p-[2mm] bg-white">
                  <b className="block text-[6.8pt] font-black text-[#014136] uppercase tracking-wider mb-0.5">Port of Loading</b>
                  <span className="text-[7.5pt] text-[#43504B] font-semibold">{doc.portOfLoading || 'Mundra / ICD Delhi'}</span>
                </div>
                <div className="border border-[#D9DEDB] rounded p-[2mm] bg-white">
                  <b className="block text-[6.8pt] font-black text-[#014136] uppercase tracking-wider mb-0.5">Origin &amp; Docs</b>
                  <span className="text-[7.5pt] text-[#43504B] font-semibold">India &bull; BL / Packing List / CO</span>
                </div>
              </div>
            )}

            {/* Standard Terms & Conditions Box */}
            <section className="mt-[4.5mm] border border-[#D9DEDB] border-l-[2.1mm] border-l-[#DFBC64] rounded-[1.8mm] p-[3mm] bg-white break-inside-avoid">
              <h4 className="text-[7.2pt] font-black uppercase text-[#014136] tracking-[0.08em] mb-[1.2mm]">
                Standard Terms &amp; Conditions ({isExport ? 'Export' : 'Domestic'})
              </h4>
              <ol className="list-decimal pl-[4.5mm] m-0 space-y-[0.8mm] text-[7.2pt] text-[#43504B] leading-normal">
                {termsList.slice(0, 6).map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ol>
            </section>

            {/* Authorised Signatory Block */}
            <div className="mt-[6mm] flex justify-between items-end break-inside-avoid">
              <div className="text-[7.2pt] text-[#65716D]">
                This is a computer-generated commercial document issued by <b>{company.companyName}</b>.
              </div>
              <div className="text-right">
                <div className="w-[45mm] border-t border-[#65716D] mb-1 inline-block"></div>
                <div className="text-[8.5pt] font-black text-[#014136] uppercase tracking-tight">For {company.companyName.toUpperCase()}</div>
                <div className="text-[7.5pt] text-[#65716D]">Authorised Signatory</div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Sleek full-width footer pinned to physical bottom - Clean 4-item space-saving layout */}
      <footer className="footer-bar h-[11mm] bg-[#003A30] text-white border-t-[1.15mm] border-[#DFBC64] px-[11mm] flex items-center justify-between text-[6.8pt] tracking-[0.01em] absolute bottom-0 left-0 right-0 z-10 print:fixed print:bottom-0">
        <div className="truncate">
          <span className="text-[#DFBC64] font-bold uppercase tracking-wider mr-1.5">Location:</span>
          <span>{company.city ? `${company.city} – ${company.pincode || '110092'}, ${company.country || 'India'}` : company.address}</span>
        </div>
        <div className="truncate">
          <span className="text-[#DFBC64] font-bold uppercase tracking-wider mr-1.5">Phone / WhatsApp:</span>
          <span>{company.phone}</span>
        </div>
        <div className="truncate">
          <span className="text-[#DFBC64] font-bold uppercase tracking-wider mr-1.5">Email:</span>
          <span>{company.email}</span>
        </div>
        <div className="text-right truncate">
          <span className="text-[#DFBC64] font-bold uppercase tracking-wider mr-1.5">Web:</span>
          <span>{company.website}</span>
        </div>
      </footer>
    </div>
  );
};
