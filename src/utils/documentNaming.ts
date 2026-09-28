import { DocumentRecord, DocumentType } from '../types';

/**
 * Standardized document type codes for filing
 * Converts kebab-case internal types into clean, capitalized filing tokens
 */
export const DOCUMENT_TYPE_FILING_CODES: Record<DocumentType, string> = {
  'tax-invoice': 'TAXINVOICE',
  'price-offer': 'PRICEOFFER',
  'quotation': 'QUOTATION',
  'proforma-invoice': 'PROFORMAINVOICE',
  'delivery-challan': 'DELIVERYCHALLAN',
  'letterhead': 'LETTERHEAD'
};

/**
 * Formats a document type into a standardized uppercase filing code.
 * E.g. 'tax-invoice' -> 'TAXINVOICE', 'price-offer' -> 'PRICEOFFER'
 */
export const formatDocTypeForFiling = (docType?: DocumentType | string): string => {
  if (!docType) return 'DOCUMENT';
  const key = docType.toLowerCase().trim() as DocumentType;
  if (DOCUMENT_TYPE_FILING_CODES[key]) {
    return DOCUMENT_TYPE_FILING_CODES[key];
  }
  // Fallback: strip hyphens/spaces and uppercase
  return docType.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'DOCUMENT';
};

/**
 * Formats a document number into a clean filing-safe string without forbidden path characters.
 * Handles patterns like 'INV001', 'INV-001', 'INV/2026/1001', 'MG/INV/1001'.
 */
export const formatDocNumberForFiling = (docNumber?: string): string => {
  if (!docNumber) return 'NODOCNUM';
  
  let clean = docNumber.trim();
  
  // Strip redundant leading "MG-" or "MG/" if already present in number to avoid "MG-TAXINVOICE-MG-INV..."
  clean = clean.replace(/^[Mm][Gg][-_/]+/, '');
  
  // Replace slashes and backslashes with hyphens
  clean = clean.replace(/[\/\\]+/g, '-');
  
  // Strip spaces, colons, or invalid file-system characters
  clean = clean.replace(/[\s:]+/g, '');
  clean = clean.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Collapse repeated hyphens
  clean = clean.replace(/-+/g, '-');
  
  // Strip trailing or leading hyphens
  clean = clean.replace(/^[-_]+|[-_]+$/g, '');

  return clean.toUpperCase() || 'NODOCNUM';
};

/**
 * Formats any date string into the standardized 'YYYYMMDD' 8-digit format.
 * Examples:
 * - '2023-10-27' -> '20231027'
 * - '27/10/2023' -> '20231027'
 * - '2026-09-23T01:44:52.000Z' -> '20260923'
 */
export const formatDocDateForFiling = (dateStr?: string): string => {
  if (!dateStr || typeof dateStr !== 'string') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  const trimmed = dateStr.trim();

  // Match YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}${m.padStart(2, '0')}${d.padStart(2, '0')}`;
  }

  // Match DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}${m.padStart(2, '0')}${d.padStart(2, '0')}`;
  }

  // Try standard Date parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  // Fallback: extract 8 consecutive digits if already formatted
  const eightDigits = trimmed.replace(/\D/g, '');
  if (eightDigits.length >= 8) {
    return eightDigits.substring(0, 8);
  }

  // Fallback to today
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

/**
 * Generates the standardized base document name (without extension).
 * Pattern: 'MG-TYPE-DOCNUMBER-DATE'
 * Example: 'MG-TAXINVOICE-INV001-20231027'
 */
export const getStandardizedDocumentBaseName = (doc: Pick<DocumentRecord, 'docType' | 'docNumber' | 'date'>): string => {
  const brand = 'MG';
  const type = formatDocTypeForFiling(doc.docType);
  const docNumber = formatDocNumberForFiling(doc.docNumber);
  const date = formatDocDateForFiling(doc.date);

  return `${brand}-${type}-${docNumber}-${date}`;
};

/**
 * Generates the standardized document file name with extension.
 * Pattern: 'MG-TYPE-DOCNUMBER-DATE.pdf'
 * Example: 'MG-TAXINVOICE-INV001-20231027.pdf'
 */
export const getStandardizedDocumentFileName = (
  doc: Pick<DocumentRecord, 'docType' | 'docNumber' | 'date'>,
  extension: 'pdf' | 'html' | 'json' | 'csv' | string = 'pdf'
): string => {
  const base = getStandardizedDocumentBaseName(doc);
  const cleanExt = extension.replace(/^\./, '').toLowerCase();
  return `${base}.${cleanExt}`;
};

/**
 * Convenience alias specifically for PDF file naming
 * Pattern: 'MG-TYPE-DOCNUMBER-DATE.pdf'
 */
export const getStandardizedPdfName = (doc: Pick<DocumentRecord, 'docType' | 'docNumber' | 'date'>): string => {
  return getStandardizedDocumentFileName(doc, 'pdf');
};

/**
 * Copies the standardized file name to the user's clipboard.
 * Returns true if successful.
 */
export const copyStandardizedFileName = async (
  doc: Pick<DocumentRecord, 'docType' | 'docNumber' | 'date'>,
  extension: string = 'pdf'
): Promise<boolean> => {
  const fileName = getStandardizedDocumentFileName(doc, extension);
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(fileName);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard write failed:', err);
  }
  return false;
};

/**
 * Triggers standard browser print/save-as-PDF with the document title
 * temporarily set to the standardized filing name (e.g. 'MG-TAXINVOICE-INV001-20231027').
 * In all modern browsers (Chrome, Firefox, Safari, Edge), the print dialog uses
 * document.title as the default file name when saving to PDF!
 */
export const printDocumentWithStandardName = (doc: DocumentRecord): string => {
  const standardName = getStandardizedPdfName(doc);
  const titleWithoutExt = getStandardizedDocumentBaseName(doc);
  const originalTitle = document.title;

  try {
    // Set document.title so Chrome/Firefox/Safari pre-fills "Save as PDF" with this exact name
    document.title = titleWithoutExt;

    // Dispatch event to mount this exact document in the isolated print container
    window.dispatchEvent(new CustomEvent('mg_prepare_print_doc', { detail: { doc } }));

    // Restore title after print dialog closes or after a safety timeout
    const cleanup = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 45000);

    // Give React render and browser layout enough frames to paint the isolated container
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.focus();
        window.print();
      }, 150);
    });
  } catch (err) {
    console.error('Error triggering standardized print:', err);
    document.title = originalTitle;
    window.print();
  }

  return standardName;
};
