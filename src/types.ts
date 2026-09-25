export type DocumentType = 
  | 'price-offer' 
  | 'quotation' 
  | 'proforma-invoice' 
  | 'tax-invoice' 
  | 'delivery-challan' 
  | 'letterhead';

export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid' | 'delivered';

export interface DocumentItem {
  id: string;
  description: string;
  hsnSac?: string;
  qty: number;
  uom: string;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number; // e.g. 18 for 18%
  packSize?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  companyName: string;
  contactPerson?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  mobile: string;
  email?: string;
  gstin?: string;
  pan?: string;
  productsBought?: string;
  rememberedTerms?: {
    paymentTerms?: string;
    deliveryTerms?: string;
    incoterm?: string;
    currency?: string;
    freightInsurance?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  hsnSac: string;
  defaultUom: string;
  packSize: string;
  basePrice: number;
  defaultTaxRate: number;
  inStock?: number;
}

export interface DocumentRecord {
  id: string;
  docType: DocumentType;
  docNumber: string;
  date: string; // YYYY-MM-DD or formatted DD/MM/YYYY
  validTill?: string;
  status: DocumentStatus;
  
  // Buyer Details
  customerId?: string;
  customerName: string;
  customerContact?: string;
  customerAddress: string;
  customerCity?: string;
  customerState?: string;
  customerCountry: string;
  customerTaxId?: string; // GSTIN or foreign VAT/tax ID
  customerEmail?: string;
  
  // Shipping Details (for PI, Tax Invoice, DC)
  shipToAddress?: string;
  placeOfSupply?: string;
  
  // Commercial & Currency
  currency: string; // 'INR' | 'USD' | 'EUR' | 'GBP' etc.
  reference?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  offerType?: string;
  priceBasis?: string; // e.g. "Ex-Works Delhi" or "FOB Mundra"
  priceNote?: string;
  
  // Line items
  items: DocumentItem[];
  
  // Financial summaries
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  taxType?: 'GST' | 'IGST' | 'CGST_SGST' | 'VAT' | 'ZERO_RATED';
  grandTotal: number;
  amountInWords?: string;
  
  // Terms & Delivery
  paymentTerms: string;
  deliveryTerms: string;
  freightInsurance: string;
  validityText?: string;
  notes?: string;
  
  // Export specifics
  isExport: boolean;
  incoterm?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  countryOfFinalDestination?: string;
  countryOfOrigin?: string;
  dispatchMode?: string;
  vesselFlightNo?: string;
  containerNo?: string;
  iecCode?: string;
  lutArn?: string;
  taxTreatment?: string;
  
  // Domestic & Challan / Dispatch specifics
  stateCode?: string;
  ewayBillNo?: string;
  carrierName?: string;
  vehicleNo?: string;
  lrNumber?: string;
  packageCount?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneeGstin?: string;
  consigneeState?: string;
  
  // Custom Bank Account override if not using default
  bankAccountId?: string;
  
  // Letterhead specifics
  letterSubject?: string;
  letterReference?: string;
  letterRecipientName?: string;
  letterRecipientCompany?: string;
  letterRecipientAddress?: string;
  letterBody?: string;
  enclosures?: string;

  // Version Control & Timeline
  version?: number;
  versions?: DocumentVersionSnapshot[];
  
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersionSnapshot {
  versionId: string;
  versionNumber: number; // 1, 2, 3...
  savedAt: string; // ISO string
  label: string; // e.g. "Initial Draft", "Price Negotiation", "Final Approved"
  author?: string; // "Commercial Desk", "AI Assistant", "Auto-Save"
  changeNotes?: string;
  summary: {
    itemsCount: number;
    grandTotal: number;
    subtotal: number;
    currency: string;
    status: DocumentStatus;
    customerName: string;
    paymentTerms: string;
    deliveryTerms: string;
  };
  snapshot: DocumentRecord;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  enabled: boolean;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface BankAccountDetails {
  id: string;
  accountLabel: string; // e.g. "Domestic Primary (ICICI)", "Export EEFC (ICICI)"
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  accountType: 'Current Account' | 'Cash Credit' | 'Savings' | 'EEFC' | 'Export Trade Account' | string;
  ifsc?: string; // For Domestic NEFT/RTGS
  swiftBic?: string; // For International Wire / SWIFT
  adCode?: string; // Authorized Dealer Code for Indian Customs / EDPMS
  branch?: string;
  branchAddress?: string;
  upiId?: string; // Domestic UPI/VPA for QR payment
  currency?: string; // 'INR', 'USD', 'EUR', etc.
  isDomesticDefault?: boolean;
  isExportDefault?: boolean;
  correspondentBank?: string; // e.g. JPMorgan Chase Bank N.A., New York (SWIFT: CHASUS33)
  routingNumber?: string;
  notes?: string;
}

export interface CompanyProfile {
  companyName: string;
  legalName?: string;
  tagline?: string;
  headerTrustText?: string;
  footerMotto?: string;
  logoUrl?: string; // Data URI or URL
  logoVariant?: 'original' | 'gold' | 'monochrome';
  logoScale?: number; // 60 to 140
  address: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  country?: string;
  gstin: string; // 15-digit GSTIN
  iec: string; // 10-digit Import Export Code
  udyam: string; // MSME Udyam Registration (e.g. UDYAM-DL-03-0048912)
  pan?: string; // 10-digit PAN
  cin?: string; // Corporate Identification No
  lutArn?: string; // Letter of Undertaking for Export
  email: string;
  phone: string;
  whatsapp?: string;
  whatsappUrl?: string;
  secondaryPhone?: string;
  website: string;
}

export interface AppSettings {
  sellerName: string;
  gstin: string;
  address: string;
  email: string;
  phone: string;
  whatsapp: string;
  secondaryPhone: string;
  website: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankBranch?: string;
  
  // Enhanced Company Details & Branding
  company?: CompanyProfile;
  
  // Bank Accounts Management (Domestic vs Export)
  bankAccounts?: BankAccountDetails[];
  domesticBankId?: string;
  exportBankId?: string;

  darkMode: boolean;
  activeCurrency: string;
  geminiApiKey?: string;
  firebaseConfig: FirebaseConfig;
  defaultPaymentTermsDomestic: string;
  defaultDeliveryTermsDomestic: string;
  defaultPaymentTermsExport: string;
  defaultDeliveryTermsExport: string;
  nextPriceOfferSeq?: number;
  nextQuotationSeq: number;
  nextPiSeq: number;
  nextInvoiceSeq: number;
  nextChallanSeq: number;
}

export interface AuthUser {
  id: string;
  loginId: string;
  displayName: string;
  role: 'Administrator' | 'Commercial Officer' | 'Accountant';
  email: string;
  avatarUrl?: string;
  lastLogin: string;
}

export interface AuthCredentials {
  loginId: string; // e.g. "info@mgsupplytech.com" or "admin"
  passwordHash: string; // Stored password hash/token
  salt?: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
  rememberMe: boolean;
}
