import { 
  AppSettings, 
  Customer, 
  DocumentItem, 
  DocumentRecord, 
  DocumentType, 
  DocumentVersionSnapshot,
  InventoryItem 
} from '../types';
import { 
  CANONICAL_SELLER, 
  INITIAL_SETTINGS, 
  SEED_CUSTOMERS, 
  SEED_INVENTORY,
  STANDARD_TERMS_DOMESTIC,
  STANDARD_TERMS_EXPORT,
  PRICE_OFFER_TERMS
} from '../constants/brand';

const STORAGE_KEYS = {
  SETTINGS: 'mg_supplytech_settings_v1',
  DOCUMENTS: 'mg_supplytech_documents_v1',
  CUSTOMERS: 'mg_supplytech_customers_v1',
  INVENTORY: 'mg_supplytech_inventory_v1'
};

// Broadcast local updates across components
export const notifyStorageChange = (type: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mg_data_change', { detail: { type } }));
  }
};

export const getSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    
    // Ensure deep merging of company details and bank accounts
    const company = {
      ...INITIAL_SETTINGS.company,
      ...(parsed.company || {})
    };
    
    const bankAccounts = (parsed.bankAccounts && Array.isArray(parsed.bankAccounts) && parsed.bankAccounts.length > 0)
      ? parsed.bankAccounts
      : INITIAL_SETTINGS.bankAccounts || [];

    const domesticBankId = parsed.domesticBankId || INITIAL_SETTINGS.domesticBankId || bankAccounts[0]?.id;
    const exportBankId = parsed.exportBankId || INITIAL_SETTINGS.exportBankId || bankAccounts[1]?.id || bankAccounts[0]?.id;

    return {
      ...INITIAL_SETTINGS,
      ...parsed,
      company,
      bankAccounts,
      domesticBankId,
      exportBankId
    };
  } catch (err) {
    console.error('Failed to load settings:', err);
    return INITIAL_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings): void => {
  // Keep legacy flat fields in sync with rich company profile
  if (settings.company) {
    settings.sellerName = settings.company.companyName || settings.sellerName;
    settings.gstin = settings.company.gstin || settings.gstin;
    settings.address = settings.company.address || settings.address;
    settings.email = settings.company.email || settings.email;
    settings.phone = settings.company.phone || settings.phone;
    settings.whatsapp = settings.company.whatsapp || settings.whatsapp;
    settings.website = settings.company.website || settings.website;
  }

  // Keep legacy flat bank fields in sync with active domestic bank
  if (settings.bankAccounts && settings.bankAccounts.length > 0) {
    const domestic = settings.bankAccounts.find(b => b.id === settings.domesticBankId) || settings.bankAccounts[0];
    if (domestic) {
      settings.bankName = domestic.bankName;
      settings.bankAccount = domestic.accountNumber;
      settings.bankIfsc = domestic.ifsc || '';
      settings.bankBranch = domestic.branch || '';
    }
  }

  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  notifyStorageChange('settings');
};

/**
 * Returns the effective company profile with guaranteed fallbacks
 */
export const getEffectiveCompanyProfile = (settings?: AppSettings): import('../types').CompanyProfile => {
  const current = settings || getSettings();
  return {
    ...INITIAL_SETTINGS.company!,
    ...(current.company || {}),
    companyName: current.company?.companyName || current.sellerName || INITIAL_SETTINGS.sellerName,
    gstin: current.company?.gstin || current.gstin || INITIAL_SETTINGS.gstin,
    address: current.company?.address || current.address || INITIAL_SETTINGS.address,
    email: current.company?.email || current.email || INITIAL_SETTINGS.email,
    phone: current.company?.phone || current.phone || INITIAL_SETTINGS.phone,
    website: current.company?.website || current.website || INITIAL_SETTINGS.website,
  };
};

/**
 * Resolves the designated bank account for a given document (Domestic vs Export)
 */
export const getDocumentBankAccount = (
  doc: import('../types').DocumentRecord,
  settings?: AppSettings
): import('../types').BankAccountDetails => {
  const s = settings || getSettings();
  const accounts = s.bankAccounts && s.bankAccounts.length > 0 
    ? s.bankAccounts 
    : (INITIAL_SETTINGS.bankAccounts || []);

  // Check if document has an explicit bankAccountId override
  if (doc.bankAccountId) {
    const explicit = accounts.find(b => b.id === doc.bankAccountId);
    if (explicit) return explicit;
  }

  // If document is Export, prioritize configured Export Bank Account
  if (doc.isExport) {
    const exportAcc = accounts.find(b => b.id === s.exportBankId) || accounts.find(b => b.isExportDefault);
    if (exportAcc) return exportAcc;
    // Fallback to any account with swiftBic
    const swiftAcc = accounts.find(b => Boolean(b.swiftBic));
    if (swiftAcc) return swiftAcc;
  }

  // Otherwise Domestic
  const domesticAcc = accounts.find(b => b.id === s.domesticBankId) || accounts.find(b => b.isDomesticDefault);
  if (domesticAcc) return domesticAcc;

  // Fallback to first available account or construct from flat settings
  return accounts[0] || {
    id: 'default',
    accountLabel: 'Primary Bank Account',
    beneficiaryName: s.company?.companyName || s.sellerName || 'MG SUPPLYTECH',
    bankName: s.bankName,
    accountNumber: s.bankAccount,
    accountType: 'Current Account',
    ifsc: s.bankIfsc,
    branch: s.bankBranch || '',
    currency: doc.currency || 'INR'
  };
};

export const getCustomers = (): Customer[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(SEED_CUSTOMERS));
      return SEED_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load customers:', err);
    return SEED_CUSTOMERS;
  }
};

export const saveCustomers = (customers: Customer[]): void => {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  notifyStorageChange('customers');
};

export const upsertCustomer = (customer: Partial<Customer> & { companyName: string }): Customer => {
  const all = getCustomers();
  const existingIdx = all.findIndex(
    c => (customer.id && c.id === customer.id) || 
         c.companyName.trim().toLowerCase() === customer.companyName.trim().toLowerCase()
  );

  const now = new Date().toISOString();
  if (existingIdx >= 0) {
    const updated: Customer = {
      ...all[existingIdx],
      ...customer,
      updatedAt: now,
      rememberedTerms: {
        ...all[existingIdx].rememberedTerms,
        ...customer.rememberedTerms
      }
    };
    all[existingIdx] = updated;
    saveCustomers(all);
    return updated;
  } else {
    const created: Customer = {
      id: customer.id || `cust-${Date.now()}`,
      companyName: customer.companyName.trim(),
      contactPerson: customer.contactPerson || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      country: customer.country || 'India',
      mobile: customer.mobile || '',
      email: customer.email || '',
      gstin: customer.gstin || '',
      productsBought: customer.productsBought || '',
      rememberedTerms: customer.rememberedTerms || {},
      createdAt: now,
      updatedAt: now
    };
    all.push(created);
    saveCustomers(all);
    return created;
  }
};

export const getInventory = (): InventoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(SEED_INVENTORY));
      return SEED_INVENTORY;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load inventory:', err);
    return SEED_INVENTORY;
  }
};

export const saveInventory = (items: InventoryItem[]): void => {
  localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  notifyStorageChange('inventory');
};

export const upsertInventoryItem = (item: Partial<InventoryItem> & { name: string }): InventoryItem => {
  const all = getInventory();
  const existingIdx = all.findIndex(
    i => (item.id && i.id === item.id) || (item.sku && i.sku === item.sku)
  );

  if (existingIdx >= 0) {
    const updated: InventoryItem = { ...all[existingIdx], ...item };
    all[existingIdx] = updated;
    saveInventory(all);
    return updated;
  } else {
    const created: InventoryItem = {
      id: item.id || `prod-${Date.now()}`,
      sku: item.sku || `MG-${Math.floor(100 + Math.random() * 900)}`,
      name: item.name.trim(),
      description: item.description || '',
      category: item.category || 'General Sourcing',
      hsnSac: item.hsnSac || '6804',
      defaultUom: item.defaultUom || 'PCS',
      packSize: item.packSize || '1 PC',
      basePrice: item.basePrice || 0,
      defaultTaxRate: item.defaultTaxRate !== undefined ? item.defaultTaxRate : 18,
      inStock: item.inStock || 0
    };
    all.push(created);
    saveInventory(all);
    return created;
  }
};

export const getDocuments = (): DocumentRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    let parsed: DocumentRecord[] = [];
    if (!raw) {
      const initialDoc = createInitialDocument('quotation');
      parsed = [initialDoc];
      saveDocuments(parsed);
      return parsed;
    }
    parsed = JSON.parse(raw);
    let mutated = false;
    parsed = parsed.map(doc => {
      if (!doc.versions || doc.versions.length === 0) {
        mutated = true;
        const v1 = createVersionSnapshot(
          doc,
          1,
          'Initial Archived Version',
          'Commercial Desk',
          'Document snapshot archived into version system.',
          doc.createdAt
        );
        return {
          ...doc,
          version: 1,
          versions: [v1]
        };
      }
      return doc;
    });

    if (mutated) {
      localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load documents:', err);
    return [];
  }
};

export const saveDocuments = (documents: DocumentRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
  notifyStorageChange('documents');
};

export const createVersionSnapshot = (
  doc: DocumentRecord,
  versionNumber: number,
  label: string,
  author = 'Commercial Desk',
  changeNotes?: string,
  timestamp?: string
): DocumentVersionSnapshot => {
  // Create a clean detached copy of the document without circular versions reference
  const clone = JSON.parse(JSON.stringify(doc)) as DocumentRecord;
  delete clone.versions;

  return {
    versionId: `ver-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    versionNumber,
    savedAt: timestamp || new Date().toISOString(),
    label,
    author,
    changeNotes: changeNotes || `Revision ${versionNumber} saved with ${doc.items.length} line items.`,
    summary: {
      itemsCount: doc.items.length,
      grandTotal: doc.grandTotal,
      subtotal: doc.subtotal,
      currency: doc.currency,
      status: doc.status,
      customerName: doc.customerName,
      paymentTerms: doc.paymentTerms,
      deliveryTerms: doc.deliveryTerms
    },
    snapshot: clone
  };
};

export const saveDocument = (
  doc: DocumentRecord,
  options?: {
    versionLabel?: string;
    changeNotes?: string;
    author?: string;
    forceNewVersion?: boolean;
  }
): DocumentRecord => {
  const all = getDocuments();
  const existingIdx = all.findIndex(d => d.id === doc.id);
  const now = new Date().toISOString();

  let versions = Array.isArray(doc.versions) ? [...doc.versions] : [];

  if (versions.length === 0) {
    // Brand new initial version 1
    const v1 = createVersionSnapshot(
      doc, 
      1, 
      options?.versionLabel || 'Initial Draft', 
      options?.author || 'Commercial Desk',
      options?.changeNotes || 'Initial creation of commercial document.',
      doc.createdAt || now
    );
    versions = [v1];
    doc.version = 1;
  } else {
    // Check if there are meaningful differences with the latest version
    const latest = versions[versions.length - 1];
    const diffItemsCount = latest.summary.itemsCount !== doc.items.length;
    const diffGrandTotal = Math.abs((latest.summary.grandTotal || 0) - (doc.grandTotal || 0)) > 0.01;
    const diffStatus = latest.summary.status !== doc.status;
    const diffTerms = (latest.summary.paymentTerms || '') !== (doc.paymentTerms || '') ||
                      (latest.summary.deliveryTerms || '') !== (doc.deliveryTerms || '');
    const diffCustomer = (latest.summary.customerName || '') !== (doc.customerName || '');

    const hasSignificantDiff = diffItemsCount || diffGrandTotal || diffStatus || diffTerms || diffCustomer;

    if (options?.forceNewVersion || hasSignificantDiff) {
      const nextVerNum = versions.length + 1;
      let notes = options?.changeNotes;

      if (!notes) {
        const changes: string[] = [];
        if (diffGrandTotal) {
          changes.push(`Grand total: ${latest.summary.currency} ${latest.summary.grandTotal?.toLocaleString()} → ${doc.currency} ${doc.grandTotal?.toLocaleString()}`);
        }
        if (diffItemsCount) {
          changes.push(`Line items: ${latest.summary.itemsCount} → ${doc.items.length}`);
        }
        if (diffTerms) {
          changes.push('Commercial terms updated');
        }
        if (diffStatus) {
          changes.push(`Status: ${latest.summary.status} → ${doc.status}`);
        }
        if (diffCustomer) {
          changes.push(`Customer: ${doc.customerName}`);
        }
        notes = changes.join('; ') || `Revision ${nextVerNum} updated.`;
      }

      const newVersion = createVersionSnapshot(
        doc,
        nextVerNum,
        options?.versionLabel || `Revision ${nextVerNum}`,
        options?.author || 'Commercial Desk',
        notes,
        now
      );
      versions.push(newVersion);
      doc.version = nextVerNum;
    }
  }

  const updatedDoc: DocumentRecord = {
    ...doc,
    version: doc.version || versions.length,
    versions,
    updatedAt: now
  };

  if (existingIdx >= 0) {
    all[existingIdx] = updatedDoc;
  } else {
    all.unshift(updatedDoc);
  }

  saveDocuments(all);

  // If this document has confirmed customer terms, remember them for this specific customer
  if (doc.customerName && (doc.paymentTerms || doc.deliveryTerms)) {
    upsertCustomer({
      companyName: doc.customerName,
      address: doc.customerAddress,
      city: doc.customerCity,
      state: doc.customerState,
      country: doc.customerCountry,
      mobile: doc.customerContact,
      email: doc.customerEmail,
      gstin: doc.customerTaxId,
      rememberedTerms: {
        paymentTerms: doc.paymentTerms,
        deliveryTerms: doc.deliveryTerms,
        incoterm: doc.incoterm,
        currency: doc.currency,
        freightInsurance: doc.freightInsurance
      }
    });
  }

  return updatedDoc;
};

export const restoreDocumentVersion = (docId: string, versionId: string): DocumentRecord | null => {
  const all = getDocuments();
  const doc = all.find(d => d.id === docId);
  if (!doc || !doc.versions) return null;

  const versionSnapshot = doc.versions.find(v => v.versionId === versionId);
  if (!versionSnapshot) return null;

  // Restore the document properties from snapshot while preserving the version history!
  const restoredDoc: DocumentRecord = {
    ...versionSnapshot.snapshot,
    id: doc.id,
    versions: doc.versions,
    version: versionSnapshot.versionNumber,
    updatedAt: new Date().toISOString()
  };

  saveDocument(restoredDoc, {
    versionLabel: `Restored to Rev ${versionSnapshot.versionNumber}`,
    changeNotes: `Rolled back to version ${versionSnapshot.versionNumber} (${versionSnapshot.label})`,
    author: 'Commercial Desk',
    forceNewVersion: true
  });

  return restoredDoc;
};

export const deleteDocument = (id: string): void => {
  const all = getDocuments().filter(d => d.id !== id);
  saveDocuments(all);
};

// Automatic Document Number Generator
export const generateNextDocNumber = (docType: DocumentType): string => {
  const settings = getSettings();
  const currentYear = new Date().getFullYear();
  let prefix = 'QT';
  let seq = settings.nextQuotationSeq || 1001;

  if (docType === 'price-offer') {
    prefix = 'PO';
    seq = settings.nextPriceOfferSeq || 1001;
    settings.nextPriceOfferSeq = seq + 1;
  } else if (docType === 'quotation') {
    prefix = 'QT';
    seq = settings.nextQuotationSeq || 1001;
    settings.nextQuotationSeq = seq + 1;
  } else if (docType === 'proforma-invoice') {
    prefix = 'PI';
    seq = settings.nextPiSeq || 1001;
    settings.nextPiSeq = seq + 1;
  } else if (docType === 'tax-invoice') {
    prefix = 'INV';
    seq = settings.nextInvoiceSeq || 1001;
    settings.nextInvoiceSeq = seq + 1;
  } else if (docType === 'delivery-challan') {
    prefix = 'DC';
    seq = settings.nextChallanSeq || 1001;
    settings.nextChallanSeq = seq + 1;
  } else if (docType === 'letterhead') {
    prefix = 'LTR';
    seq = settings.nextQuotationSeq || 1001;
  }

  saveSettings(settings);
  return `${prefix}/${currentYear}/${seq}`;
};

// Pipeline Converter: Progressively convert documents between stages:
// Price Offer ➔ Quotation ➔ Proforma Invoice ➔ Tax Invoice ➔ Delivery Challan
export const convertDocumentToStage = (
  sourceDoc: DocumentRecord,
  targetType: DocumentType,
  asNewRecord = true
): DocumentRecord => {
  const newDocNumber = generateNextDocNumber(targetType);
  const now = new Date().toISOString();
  const dateToday = now.split('T')[0];

  const sourceTypeName = sourceDoc.docType.replace('-', ' ');
  const targetTypeName = targetType.replace('-', ' ');

  // Compute offer types and labels
  let offerType = sourceDoc.offerType;
  if (targetType === 'price-offer') offerType = 'Commercial Price Offer & Rate Confirmation';
  else if (targetType === 'quotation') offerType = 'Commercial Price Quotation';
  else if (targetType === 'proforma-invoice') offerType = 'Proforma Invoice / Order Confirmation';
  else if (targetType === 'tax-invoice') offerType = 'Original Tax Invoice';
  else if (targetType === 'delivery-challan') offerType = 'Delivery Challan / Transporter Dispatch Note';

  // Ensure line items have appropriate tax/totals calculated and preserve all item data
  const isMovingFromPriceOffer = sourceDoc.docType === 'price-offer' && targetType !== 'price-offer';
  const updatedItems = sourceDoc.items.map(item => {
    let itemQty = Number(item.qty || 0);
    // If moving from price offer (which has no quantity) to quotation or later, default qty to 1 so totals compute
    if (isMovingFromPriceOffer && itemQty <= 0) {
      itemQty = 1;
    }
    return {
      ...item,
      qty: itemQty,
      taxRate: sourceDoc.isExport ? 0 : (item.taxRate !== undefined ? item.taxRate : 18)
    };
  });
  const totals = calculateDocumentTotals(updatedItems, sourceDoc.isExport);

  const convertedDoc: DocumentRecord = {
    ...JSON.parse(JSON.stringify(sourceDoc)),
    id: asNewRecord ? `doc-${Date.now()}` : sourceDoc.id,
    docType: targetType,
    docNumber: newDocNumber,
    date: dateToday,
    items: updatedItems,
    ...totals,
    reference: `Ref: Based on ${sourceTypeName.toUpperCase()} ${sourceDoc.docNumber}`,
    offerType,
    status: targetType === 'tax-invoice' ? 'sent' : targetType === 'delivery-challan' ? 'delivered' : 'draft',
    // Domestic vs Export text fields preservation and priming
    countryOfOrigin: 'India',
    countryOfFinalDestination: sourceDoc.isExport ? (sourceDoc.countryOfFinalDestination || sourceDoc.customerCountry) : undefined,
    iecCode: sourceDoc.isExport ? (sourceDoc.iecCode || '0517036281') : undefined,
    lutArn: sourceDoc.isExport ? (sourceDoc.lutArn || 'AD240324001234F') : undefined,
    portOfLoading: sourceDoc.isExport ? (sourceDoc.portOfLoading || 'Mundra Port / ICD Delhi') : undefined,
    incoterm: sourceDoc.isExport ? (sourceDoc.incoterm || 'FOB Mundra Port') : undefined,
    placeOfSupply: !sourceDoc.isExport ? (sourceDoc.placeOfSupply || sourceDoc.customerState || 'Delhi (07)') : undefined,
    stateCode: !sourceDoc.isExport ? (sourceDoc.stateCode || '07') : undefined,
    createdAt: asNewRecord ? now : sourceDoc.createdAt,
    updatedAt: now,
    version: 1,
    versions: []
  };

  if (targetType === 'price-offer') {
    convertedDoc.amountInWords = 'Rate Schedule (No Total - Unit Price Offer)';
  } else {
    convertedDoc.amountInWords = numberToWords(totals.grandTotal, convertedDoc.currency);
  }

  // Add initial version milestone for converted document
  const v1 = createVersionSnapshot(
    convertedDoc,
    1,
    `Converted from ${sourceTypeName} (${sourceDoc.docNumber})`,
    'Commercial Workflow Engine',
    `Progressed commercial pipeline: ${sourceTypeName} ${sourceDoc.docNumber} ➔ ${targetTypeName} ${newDocNumber}`,
    now
  );
  convertedDoc.versions = [v1];

  if (asNewRecord) {
    const all = getDocuments();
    all.unshift(convertedDoc);
    saveDocuments(all);

    // Also record a snapshot note in the source document acknowledging it was converted
    saveDocument(sourceDoc, {
      versionLabel: `Converted to ${targetTypeName}`,
      changeNotes: `Successfully progressed into ${targetTypeName} ${newDocNumber}`,
      author: 'Workflow Engine',
      forceNewVersion: false
    });
  } else {
    saveDocument(convertedDoc);
  }

  return convertedDoc;
};

// Determine default currency according to Canonical Rule:
// India, Nepal, Bhutan -> INR; other countries -> USD
export const getCurrencyForCountry = (countryName: string): string => {
  const normalized = countryName.trim().toLowerCase();
  if (normalized === 'india' || normalized === 'nepal' || normalized === 'bhutan') {
    return 'INR';
  }
  return 'USD';
};

// Check if destination is export (non-India)
export const isExportCountry = (countryName: string): boolean => {
  const normalized = countryName.trim().toLowerCase();
  return normalized !== 'india';
};

// Format currency display with proper symbols
export const formatCurrency = (amount: number, currency = 'INR'): string => {
  const rounded = Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (currency === 'INR') return `₹ ${rounded}`;
  if (currency === 'USD') return `$ ${rounded}`;
  if (currency === 'EUR') return `€ ${rounded}`;
  if (currency === 'GBP') return `£ ${rounded}`;
  return `${currency} ${rounded}`;
};

// Indian numbering amount in words
export const numberToWords = (num: number, currency = 'INR'): string => {
  if (isNaN(num) || num === 0) return 'Zero';
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanOneThousand(n % 100) : '');
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let words = '';
  if (currency === 'INR') {
    const crore = Math.floor(integerPart / 10000000);
    const lakh = Math.floor((integerPart % 10000000) / 100000);
    const thousand = Math.floor((integerPart % 100000) / 1000);
    const remainder = integerPart % 1000;

    if (crore > 0) words += convertLessThanOneThousand(crore) + ' Crore ';
    if (lakh > 0) words += convertLessThanOneThousand(lakh) + ' Lakh ';
    if (thousand > 0) words += convertLessThanOneThousand(thousand) + ' Thousand ';
    if (remainder > 0) words += convertLessThanOneThousand(remainder);
    
    words = words.trim() + ' Rupees';
    if (decimalPart > 0) {
      words += ' and ' + convertLessThanOneThousand(decimalPart) + ' Paise';
    }
  } else {
    // International millions
    const million = Math.floor(integerPart / 1000000);
    const thousand = Math.floor((integerPart % 1000000) / 1000);
    const remainder = integerPart % 1000;

    if (million > 0) words += convertLessThanOneThousand(million) + ' Million ';
    if (thousand > 0) words += convertLessThanOneThousand(thousand) + ' Thousand ';
    if (remainder > 0) words += convertLessThanOneThousand(remainder);

    words = words.trim() + (currency === 'USD' ? ' US Dollars' : ` ${currency}`);
    if (decimalPart > 0) {
      words += ' and ' + convertLessThanOneThousand(decimalPart) + ' Cents';
    }
  }

  return (words.trim() + ' Only');
};

// Calculate financial figures for items
export const calculateDocumentTotals = (items: DocumentItem[], isExport: boolean) => {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  items.forEach(item => {
    const qty = Number(item.qty || 0);
    const rate = Number(item.unitPrice || 0);
    const rawLine = qty * rate;
    const discount = (rawLine * Number(item.discountPercent || 0)) / 100;
    const taxable = rawLine - discount;
    const taxRate = isExport ? 0 : Number(item.taxRate || 0);
    const tax = (taxable * taxRate) / 100;

    subtotal += rawLine;
    discountTotal += discount;
    taxTotal += tax;
  });

  const grandTotal = subtotal - discountTotal + taxTotal;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100
  };
};

// Factory to create a clean new document record
export const createInitialDocument = (type: DocumentType = 'quotation'): DocumentRecord => {
  const settings = getSettings();
  const docNumber = generateNextDocNumber(type);
  const today = new Date().toISOString().split('T')[0];
  
  const validDate = new Date();
  validDate.setDate(validDate.getDate() + 15);
  const validTill = validDate.toISOString().split('T')[0];

  const defaultCustomer = SEED_CUSTOMERS[0];
  const isExp = isExportCountry(defaultCustomer.country);
  const currency = getCurrencyForCountry(defaultCustomer.country);

  const initialItems: DocumentItem[] = type === 'price-offer' ? [
    {
      id: `item-${Date.now()}-1`,
      description: "Cerium Oxide Polishing Powder (Grade A - 99.5% Heavy Sourcing)",
      packSize: "20 KG Drum / 500 KG Pallet",
      qty: 0,
      uom: "KG",
      unitPrice: 650,
      taxRate: 18,
      notes: "High purity optical cerium, rapid glass stock removal rate."
    },
    {
      id: `item-${Date.now()}-2`,
      description: "High Density Spiral Wool Felt Polishing Wheel 150mm x 50mm",
      packSize: "10 PCS Pack / Carton",
      qty: 0,
      uom: "PCS",
      unitPrice: 850,
      taxRate: 18,
      notes: "Pure Australian wool felt for scratch removal and edge polishing."
    },
    {
      id: `item-${Date.now()}-3`,
      description: "Metal Bond Diamond Grinding Wheel 150mm (Grit 120/140)",
      packSize: "Individual Box",
      qty: 0,
      uom: "PCS",
      unitPrice: 3200,
      taxRate: 18,
      notes: "Balanced bronze matrix for high precision CNC & straight-line edging."
    }
  ] : [
    {
      id: `item-${Date.now()}-1`,
      description: "Cerium Oxide Polishing Powder (Grade A - 99.5%)",
      hsnSac: "28461010",
      qty: 100,
      uom: "KG",
      unitPrice: 650,
      discountPercent: 0,
      taxRate: 18,
      packSize: "20 KG Drum"
    },
    {
      id: `item-${Date.now()}-2`,
      description: "Metal Bond Diamond Grinding Wheel 150mm",
      hsnSac: "68042110",
      qty: 4,
      uom: "PCS",
      unitPrice: 3200,
      discountPercent: 5,
      taxRate: 18,
      packSize: "1 PC Box"
    }
  ];

  const totals = calculateDocumentTotals(initialItems, isExp);

  const baseDoc: DocumentRecord = {
    id: `doc-${Date.now()}`,
    docType: type,
    docNumber,
    date: today,
    validTill,
    status: 'draft',
    customerId: defaultCustomer.id,
    customerName: defaultCustomer.companyName,
    customerContact: defaultCustomer.mobile,
    customerAddress: defaultCustomer.address,
    customerCity: defaultCustomer.city,
    customerState: defaultCustomer.state,
    customerCountry: defaultCustomer.country,
    customerTaxId: defaultCustomer.gstin,
    customerEmail: defaultCustomer.email,
    currency,
    reference: '',
    offerType: "Commercial Price Quotation",
    priceBasis: "Ex-Works Delhi Godown",
    priceNote: "Rates quoted are net Ex-Works Delhi. Taxes and freight as applicable.",
    items: initialItems,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    grandTotal: totals.grandTotal,
    amountInWords: numberToWords(totals.grandTotal, currency),
    paymentTerms: defaultCustomer.rememberedTerms?.paymentTerms || settings.defaultPaymentTermsDomestic,
    deliveryTerms: defaultCustomer.rememberedTerms?.deliveryTerms || settings.defaultDeliveryTermsDomestic,
    freightInsurance: defaultCustomer.rememberedTerms?.freightInsurance || "Freight extra at actuals / To buyer's account",
    validityText: "Offer valid for 15 days from date of quotation",
    notes: "Material test certificate and TDS provided upon dispatch. Bank charges to buyer's account.",
    isExport: isExp,
    incoterm: isExp ? "FOB Mundra Port" : undefined,
    portOfLoading: isExp ? "ICD Patparganj / Mundra Port" : undefined,
    countryOfOrigin: "India",
    letterSubject: "Commercial Supply Proposal for Polishing & Sourcing Consumables",
    letterReference: `LTR/MG/${new Date().getFullYear()}/089`,
    letterRecipientName: "The Procurement Manager",
    letterRecipientCompany: defaultCustomer.companyName,
    letterRecipientAddress: `${defaultCustomer.address}, ${defaultCustomer.city}, ${defaultCustomer.state}`,
    letterBody: `Dear Sir/Madam,\n\nWe thank you for your valued enquiry regarding high-performance glass polishing compounds and industrial consumables.\n\nMG Supplytech is an ISO certified global sourcing and supply specialist delivering precision polishing powders, diamond grinding tools, and pneumatic equipment to premier architectural glass processors.\n\nPlease find enclosed our competitive commercial offer along with technical specifications for your kind consideration. Our dedicated technical team is available to support trials at your facility.\n\nAssuring you of our best quality, competitive pricing and prompt service at all times.`,
    enclosures: "1. Technical Data Sheet (TDS)\n2. ISO Quality Certificate\n3. Bank Account Mandate",
    version: 3,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Build seed version snapshots for rich visual timeline comparison demo
  const v1Items: DocumentItem[] = [
    {
      id: `item-v1-1`,
      description: "Cerium Oxide Polishing Powder (Grade A - 99.5%)",
      hsnSac: "28461010",
      qty: 50,
      uom: "KG",
      unitPrice: 680,
      discountPercent: 0,
      taxRate: 18,
      packSize: "20 KG Drum"
    }
  ];
  const v1Totals = calculateDocumentTotals(v1Items, isExp);
  const v1Doc: DocumentRecord = {
    ...baseDoc,
    items: v1Items,
    subtotal: v1Totals.subtotal,
    discountTotal: v1Totals.discountTotal,
    taxTotal: v1Totals.taxTotal,
    grandTotal: v1Totals.grandTotal,
    amountInWords: numberToWords(v1Totals.grandTotal, currency),
    paymentTerms: "100% Payment against Delivery",
    notes: "Initial quote as requested. Material test certificates available.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  };

  const v2Items: DocumentItem[] = [
    {
      id: `item-v2-1`,
      description: "Cerium Oxide Polishing Powder (Grade A - 99.5%)",
      hsnSac: "28461010",
      qty: 50,
      uom: "KG",
      unitPrice: 660,
      discountPercent: 0,
      taxRate: 18,
      packSize: "20 KG Drum"
    },
    {
      id: `item-v2-2`,
      description: "Metal Bond Diamond Grinding Wheel 150mm",
      hsnSac: "68042110",
      qty: 2,
      uom: "PCS",
      unitPrice: 3400,
      discountPercent: 0,
      taxRate: 18,
      packSize: "1 PC Box"
    }
  ];
  const v2Totals = calculateDocumentTotals(v2Items, isExp);
  const v2Doc: DocumentRecord = {
    ...baseDoc,
    items: v2Items,
    subtotal: v2Totals.subtotal,
    discountTotal: v2Totals.discountTotal,
    taxTotal: v2Totals.taxTotal,
    grandTotal: v2Totals.grandTotal,
    amountInWords: numberToWords(v2Totals.grandTotal, currency),
    paymentTerms: "50% Advance, Balance against Proforma Invoice",
    notes: "Revised offer with additional diamond grinding tooling as discussed.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  };

  const v1Snapshot = createVersionSnapshot(
    v1Doc,
    1,
    'Initial Draft Quotation',
    'Commercial Desk',
    'Initial pricing based on 50 KG trial inquiry.',
    new Date(Date.now() - 86400000 * 2).toISOString()
  );

  const v2Snapshot = createVersionSnapshot(
    v2Doc,
    2,
    'Tooling Additions & Price Revision',
    'Commercial Desk',
    'Grand total: ₹40,120 → ₹46,964; Added Diamond Grinding Wheels (2 PCS); Reduced Cerium powder to ₹660/KG.',
    new Date(Date.now() - 86400000).toISOString()
  );

  const v3Snapshot = createVersionSnapshot(
    baseDoc,
    3,
    'Final Approved Commercial Revision',
    'Commercial Desk',
    'Grand total: ₹46,964 → ₹91,096; Scaled Cerium to 100 KG bulk rate (₹650/KG); 4 PCS Diamond Wheels with 5% discount; Payment 100% advance confirmed.',
    new Date().toISOString()
  );

  baseDoc.versions = [v1Snapshot, v2Snapshot, v3Snapshot];
  baseDoc.version = 3;

  return baseDoc;
};

export interface BatchImportResult {
  added: number;
  updated: number;
  total: number;
}

export const importCustomersBatch = (
  items: Array<{
    companyName: string;
    contactPerson?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    mobile?: string;
    email?: string;
    gstin?: string;
    productsBought?: string;
    paymentTerms?: string;
    deliveryTerms?: string;
  }>,
  options: { updateExisting: boolean } = { updateExisting: true }
): BatchImportResult => {
  const all = getCustomers();
  let added = 0;
  let updated = 0;
  const now = new Date().toISOString();

  for (const item of items) {
    if (!item.companyName || !item.companyName.trim()) continue;
    const cleanName = item.companyName.trim();
    const existingIdx = all.findIndex(
      c => c.companyName.trim().toLowerCase() === cleanName.toLowerCase() ||
           (Boolean(item.gstin) && Boolean(c.gstin) && c.gstin?.trim().toUpperCase() === item.gstin?.trim().toUpperCase())
    );

    const rememberedTerms: any = {};
    if (item.paymentTerms) rememberedTerms.paymentTerms = item.paymentTerms;
    if (item.deliveryTerms) rememberedTerms.deliveryTerms = item.deliveryTerms;

    if (existingIdx >= 0) {
      if (options.updateExisting) {
        all[existingIdx] = {
          ...all[existingIdx],
          contactPerson: item.contactPerson || all[existingIdx].contactPerson,
          address: item.address || all[existingIdx].address,
          city: item.city || all[existingIdx].city,
          state: item.state || all[existingIdx].state,
          country: item.country || all[existingIdx].country || 'India',
          mobile: item.mobile || all[existingIdx].mobile,
          email: item.email || all[existingIdx].email,
          gstin: item.gstin || all[existingIdx].gstin,
          productsBought: item.productsBought || all[existingIdx].productsBought,
          rememberedTerms: {
            ...all[existingIdx].rememberedTerms,
            ...rememberedTerms
          },
          updatedAt: now
        };
        updated++;
      }
    } else {
      all.push({
        id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        companyName: cleanName,
        contactPerson: item.contactPerson || '',
        address: item.address || '',
        city: item.city || '',
        state: item.state || '',
        country: item.country || 'India',
        mobile: item.mobile || '',
        email: item.email || '',
        gstin: item.gstin || '',
        productsBought: item.productsBought || '',
        rememberedTerms,
        createdAt: now,
        updatedAt: now
      });
      added++;
    }
  }

  saveCustomers(all);
  return { added, updated, total: added + updated };
};

export const importInventoryBatch = (
  items: Array<{
    name: string;
    sku?: string;
    description?: string;
    category?: string;
    hsnSac?: string;
    defaultUom?: string;
    packSize?: string;
    basePrice?: number;
    defaultTaxRate?: number;
    inStock?: number;
  }>,
  options: { updateExisting: boolean } = { updateExisting: true }
): BatchImportResult => {
  const all = getInventory();
  let added = 0;
  let updated = 0;

  for (const item of items) {
    if (!item.name || !item.name.trim()) continue;
    const cleanName = item.name.trim();
    const cleanSku = item.sku?.trim() || '';

    const existingIdx = all.findIndex(
      i => (Boolean(cleanSku) && i.sku?.trim().toLowerCase() === cleanSku.toLowerCase()) ||
           i.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (existingIdx >= 0) {
      if (options.updateExisting) {
        all[existingIdx] = {
          ...all[existingIdx],
          sku: cleanSku || all[existingIdx].sku,
          description: item.description !== undefined ? item.description : all[existingIdx].description,
          category: item.category || all[existingIdx].category,
          hsnSac: item.hsnSac || all[existingIdx].hsnSac,
          defaultUom: item.defaultUom || all[existingIdx].defaultUom,
          packSize: item.packSize || all[existingIdx].packSize,
          basePrice: item.basePrice !== undefined ? item.basePrice : all[existingIdx].basePrice,
          defaultTaxRate: item.defaultTaxRate !== undefined ? item.defaultTaxRate : all[existingIdx].defaultTaxRate,
          inStock: item.inStock !== undefined ? item.inStock : all[existingIdx].inStock
        };
        updated++;
      }
    } else {
      all.push({
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        sku: cleanSku || `MG-${Math.floor(100 + Math.random() * 900)}`,
        name: cleanName,
        description: item.description || '',
        category: item.category || 'General Sourcing',
        hsnSac: item.hsnSac || '6804',
        defaultUom: item.defaultUom || 'PCS',
        packSize: item.packSize || '1 PC',
        basePrice: item.basePrice || 0,
        defaultTaxRate: item.defaultTaxRate !== undefined ? item.defaultTaxRate : 18,
        inStock: item.inStock || 0
      });
      added++;
    }
  }

  saveInventory(all);
  return { added, updated, total: added + updated };
};

export const getActiveDocumentId = (): string | null => {
  try {
    return localStorage.getItem('mg_supplytech_active_doc_id');
  } catch (e) {
    return null;
  }
};

export const setActiveDocumentId = (docId: string): void => {
  try {
    localStorage.setItem('mg_supplytech_active_doc_id', docId);
  } catch (e) {}
};

export const autoSaveCurrentDocument = (doc: DocumentRecord): DocumentRecord => {
  const all = getDocuments();
  const existingIdx = all.findIndex(d => d.id === doc.id);
  const now = new Date().toISOString();

  const updatedDoc: DocumentRecord = {
    ...doc,
    updatedAt: now
  };

  if (existingIdx >= 0) {
    all[existingIdx] = updatedDoc;
  } else {
    all.unshift(updatedDoc);
  }

  saveDocuments(all);
  setActiveDocumentId(doc.id);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mg_autosave_status', { 
      detail: { status: 'saved', timestamp: now, docId: doc.id } 
    }));
  }

  return updatedDoc;
};

