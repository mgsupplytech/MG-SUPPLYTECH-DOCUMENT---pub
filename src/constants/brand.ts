import { AppSettings, BankAccountDetails, CompanyProfile, Customer, InventoryItem } from '../types';

export const CANONICAL_SELLER = {
  companyName: "MG Supplytech",
  legalName: "MG Supplytech",
  gstin: "07ATTPT6324N1ZQ",
  iec: "0517036281",
  udyam: "UDYAM-DL-03-0048912",
  pan: "ATTPT6324N",
  lutArn: "AD240324001234F",
  address: "177 First Floor, Vigyan Vihar, Delhi – 110092, India",
  city: "Delhi",
  state: "Delhi",
  stateCode: "07",
  pincode: "110092",
  country: "India",
  email: "info@mgsupplytech.com",
  phone: "+91 83739 76489", // Primary Phone & WhatsApp
  whatsapp: "+91 83739 76489",
  whatsappUrl: "https://wa.me/918373976489",
  secondaryPhone: "+91 98990 59593",
  website: "www.mgsupplytech.com",
  bank: {
    name: "ICICI Bank",
    accountNumber: "083105004679",
    ifsc: "ICIC0000831",
    branch: "Vigyan Vihar, Delhi"
  },
  branding: {
    tagline: "BUILDING POSSIBILITIES",
    headerTrust: "YOUR TRUSTED GLOBAL SOURCING PARTNER",
    footerMotto: "SOURCE SMARTER. GROW GLOBALLY.",
    primaryGreen: "#014136",
    deepGreen: "#003A30",
    gold: "#DFBC64",
    goldDark: "#B88C2E",
    ink: "#16211F",
    muted: "#65716D",
    line: "#D9DEDB",
    warmPaper: "#F6F7F5",
    white: "#FFFFFF"
  }
};

export const DEFAULT_DOMESTIC_BANK: BankAccountDetails = {
  id: "bank-domestic-default",
  accountLabel: "ICICI Domestic Current A/C (NEFT/RTGS)",
  beneficiaryName: "MG SUPPLYTECH",
  bankName: "ICICI Bank",
  accountNumber: "083105004679",
  accountType: "Current Account",
  ifsc: "ICIC0000831",
  branch: "Vigyan Vihar, Delhi – 110092",
  branchAddress: "177 Vigyan Vihar, New Delhi - 110092, India",
  upiId: "mgsupplytech@icici",
  currency: "INR",
  isDomesticDefault: true,
  isExportDefault: false,
  notes: "Standard primary account for all domestic INR sales and tax invoices."
};

export const DEFAULT_EXPORT_BANK: BankAccountDetails = {
  id: "bank-export-default",
  accountLabel: "ICICI Export Trade & EEFC Account (USD/EUR)",
  beneficiaryName: "MG SUPPLYTECH",
  bankName: "ICICI Bank Limited",
  accountNumber: "083105501824",
  accountType: "EEFC / Export Trade Account",
  swiftBic: "ICICINBB001",
  adCode: "0310083",
  branch: "Overseas Branch, Connaught Place, New Delhi – 110001",
  branchAddress: "9A, Phelps Building, Connaught Place, New Delhi - 110001, India",
  currency: "USD",
  isDomesticDefault: false,
  isExportDefault: true,
  correspondentBank: "JPMorgan Chase Bank N.A., New York (SWIFT: CHASUS33)",
  routingNumber: "021000021",
  notes: "Dedicated foreign remittance and export trade account for international buyers."
};

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: CANONICAL_SELLER.companyName,
  legalName: CANONICAL_SELLER.legalName,
  tagline: CANONICAL_SELLER.branding.tagline,
  headerTrustText: CANONICAL_SELLER.branding.headerTrust,
  footerMotto: CANONICAL_SELLER.branding.footerMotto,
  logoVariant: "original",
  logoScale: 100,
  address: CANONICAL_SELLER.address,
  city: CANONICAL_SELLER.city,
  state: CANONICAL_SELLER.state,
  stateCode: CANONICAL_SELLER.stateCode,
  pincode: CANONICAL_SELLER.pincode,
  country: CANONICAL_SELLER.country,
  gstin: CANONICAL_SELLER.gstin,
  iec: CANONICAL_SELLER.iec,
  udyam: CANONICAL_SELLER.udyam,
  pan: CANONICAL_SELLER.pan,
  lutArn: CANONICAL_SELLER.lutArn,
  email: CANONICAL_SELLER.email,
  phone: CANONICAL_SELLER.phone,
  whatsapp: CANONICAL_SELLER.whatsapp,
  whatsappUrl: CANONICAL_SELLER.whatsappUrl,
  secondaryPhone: CANONICAL_SELLER.secondaryPhone,
  website: CANONICAL_SELLER.website
};

export const STANDARD_TERMS_DOMESTIC = [
  "Prices, taxes and inclusions are only those expressly stated.",
  "Payment is as quoted; supply is subject to confirmed order/payment or approved commercial credit.",
  "Delivery / lead time is an estimate from confirmed order and required approvals/advance payment.",
  "Freight, insurance, loading and special packing are included only when expressly stated.",
  "Product specifications are as offered; approved variations must be mutually confirmed in writing.",
  "Offer is subject to material availability and final commercial confirmation.",
  "Claims, shortages and transit damages must be notified within 48 hours of delivery.",
  "Events beyond reasonable control (force majeure) may extend delivery timelines for the affected period.",
  "Acceptance of this document confirms the stated commercial terms unless superseded by an agreed master contract."
];

export const STANDARD_TERMS_EXPORT = [
  "USD is the default transaction currency unless another foreign currency is expressly agreed.",
  "Incoterm and named place/port must be expressly stated; no incoterm condition is assumed.",
  "Freight and transit insurance follow the stated Incoterm and agreed transaction scope.",
  "Buyer/importer handles destination customs clearance, import duties, local taxes and statutory permits unless expressly included.",
  "Payment and all intermediary/correspondent banking charges are to buyer's account unless agreed otherwise.",
  "Dispatch is strictly subject to receipt of agreed payment, technical sign-off and required export documentation.",
  "Export seaworthy / airworthy packing and standard shipping marks are provided as agreed.",
  "Country of origin (India), HS code classification and export tax treatment must be confirmed; no exemption or LUT is assumed.",
  "Delivery timelines are subject to vessel availability, transshipment schedules and carrier force majeure.",
  "All commercial offers remain subject to final verification and stock availability."
];

export const PRICE_OFFER_TERMS = [
  "A Price Offer is a commercial price quotation and rate confirmation, not a final tax invoice.",
  "Pack size, MOQ and price basis are valid only as stated; no total commitment is implied until order confirmation.",
  "Prices quoted are Ex-Works / FOB as specified and exclude local taxes unless explicitly stated.",
  "Rates are subject to revision based on raw material market fluctuations if not accepted within the validity period."
];

export const INITIAL_SETTINGS: AppSettings = {
  sellerName: CANONICAL_SELLER.companyName,
  gstin: CANONICAL_SELLER.gstin,
  address: CANONICAL_SELLER.address,
  email: CANONICAL_SELLER.email,
  phone: CANONICAL_SELLER.phone,
  whatsapp: CANONICAL_SELLER.whatsapp,
  secondaryPhone: CANONICAL_SELLER.secondaryPhone,
  website: CANONICAL_SELLER.website,
  bankName: CANONICAL_SELLER.bank.name,
  bankAccount: CANONICAL_SELLER.bank.accountNumber,
  bankIfsc: CANONICAL_SELLER.bank.ifsc,
  bankBranch: CANONICAL_SELLER.bank.branch,
  
  // Rich Company Profile
  company: DEFAULT_COMPANY_PROFILE,
  
  // Domestic & Export Dedicated Accounts
  bankAccounts: [
    DEFAULT_DOMESTIC_BANK,
    DEFAULT_EXPORT_BANK
  ],
  domesticBankId: DEFAULT_DOMESTIC_BANK.id,
  exportBankId: DEFAULT_EXPORT_BANK.id,

  darkMode: false,
  activeCurrency: "INR",
  geminiApiKey: "",
  firebaseConfig: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    enabled: false,
    autoSync: false,
    lastSyncedAt: undefined
  },
  defaultPaymentTermsDomestic: "100% Advance against Proforma Invoice / Net 30 Days for approved accounts",
  defaultDeliveryTermsDomestic: "Within 3–5 working days from order confirmation & payment",
  defaultPaymentTermsExport: "100% Advance TT before dispatch or 30% Advance + 70% against BL copy",
  defaultDeliveryTermsExport: "Within 10–14 working days Ex-Works / FOB Indian Port",
  nextPriceOfferSeq: 1001,
  nextQuotationSeq: 1001,
  nextPiSeq: 1001,
  nextInvoiceSeq: 1001,
  nextChallanSeq: 1001
};

export interface WorkflowStageInfo {
  type: import('../types').DocumentType;
  label: string;
  shortLabel: string;
  stepNumber: number;
  prefix: string;
  nextType?: import('../types').DocumentType;
  nextActionLabel?: string;
  description: string;
}

export const DOCUMENT_WORKFLOW_STAGES: WorkflowStageInfo[] = [
  {
    type: 'price-offer',
    label: 'Price Offer',
    shortLabel: 'Price Offer',
    stepNumber: 1,
    prefix: 'PO',
    nextType: 'quotation',
    nextActionLabel: 'Convert to Quotation',
    description: 'Initial commercial price schedule & rate offer'
  },
  {
    type: 'quotation',
    label: 'Quotation',
    shortLabel: 'Quotation',
    stepNumber: 2,
    prefix: 'QT',
    nextType: 'proforma-invoice',
    nextActionLabel: 'Convert to Proforma Invoice',
    description: 'Formal itemized commercial offer with validity & terms'
  },
  {
    type: 'proforma-invoice',
    label: 'Proforma Invoice',
    shortLabel: 'Proforma Inv',
    stepNumber: 3,
    prefix: 'PI',
    nextType: 'tax-invoice',
    nextActionLabel: 'Convert to Tax Invoice',
    description: 'Preliminary invoice for advance payment & production'
  },
  {
    type: 'tax-invoice',
    label: 'Tax Invoice',
    shortLabel: 'Tax Invoice',
    stepNumber: 4,
    prefix: 'INV',
    nextType: 'delivery-challan',
    nextActionLabel: 'Generate Delivery Challan',
    description: 'Final statutory commercial invoice for goods & GST'
  },
  {
    type: 'delivery-challan',
    label: 'Delivery Challan',
    shortLabel: 'Challan',
    stepNumber: 5,
    prefix: 'DC',
    description: 'Dispatch authorization, transporter pass & LR delivery receipt'
  }
];

// Seed customers based on Polishing Material Customers Master
export const SEED_CUSTOMERS: Customer[] = [
  {
    id: "cust-001",
    companyName: "Metro Glass & Facades Pvt. Ltd.",
    contactPerson: "Mr. Rajesh Sharma",
    address: "Plot 42, Sector 8, IMT Manesar",
    city: "Gurugram",
    state: "Haryana",
    country: "India",
    mobile: "+91 98112 34567",
    email: "procurement@metroglassfacades.com",
    gstin: "06AAACM4521N1Z3",
    productsBought: "Cerium Oxide Polishing Powder, Diamond Grinding Wheels (150mm), Felt Polishing Wheels",
    rememberedTerms: {
      paymentTerms: "50% Advance, Balance against delivery",
      deliveryTerms: "3-4 days Ex-Works Delhi",
      incoterm: "Ex-Works Delhi",
      currency: "INR",
      freightInsurance: "To Buyer's Account"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cust-002",
    companyName: "Al Futtaim Glass & Architectural Aluminium",
    contactPerson: "Mr. Tariq Mansoor",
    address: "Industrial Area 3, P.O. Box 89211",
    city: "Sharjah",
    state: "Sharjah",
    country: "United Arab Emirates",
    mobile: "+971 50 824 1920",
    email: "t.mansoor@alfuttaimglass.ae",
    gstin: "VAT TRN 100293849100003",
    productsBought: "White Cerium Oxide Optical Grade (99.9%), Spiral Felt Wheels, Glass Edging Coolant",
    rememberedTerms: {
      paymentTerms: "100% TT wire transfer prior to container dispatch",
      deliveryTerms: "12 days to Jebel Ali Port",
      incoterm: "CIF Jebel Ali (Dubai)",
      currency: "USD",
      freightInsurance: "Included in CIF Quote"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cust-003",
    companyName: "Kathmandu Glass Processing Industries",
    contactPerson: "Mr. Bikram Thapa",
    address: "Balaju Industrial Estate, Ward 16",
    city: "Kathmandu",
    state: "Bagmati",
    country: "Nepal",
    mobile: "+977 98510 23456",
    email: "bikram@ktmglass.com.np",
    gstin: "PAN 301298412",
    productsBought: "Cerium Oxide Grade A, Silicon Carbide Sanding Belts, Diamond Drills",
    rememberedTerms: {
      paymentTerms: "100% Advance via Bank Draft / RTGS",
      deliveryTerms: "5-7 days to Birgunj Border Checkpost",
      incoterm: "CPT Birgunj Border",
      currency: "INR",
      freightInsurance: "Freight prepaid up to Birgunj"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "cust-004",
    companyName: "Crystal Clear Architectural Glass Ltd.",
    contactPerson: "Mr. Sunil Varma",
    address: "B-18, Peenya 2nd Stage, Industrial Estate",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    mobile: "+91 98450 11223",
    email: "sunil@crystalclearglass.in",
    gstin: "29AABCC9012F1Z8",
    productsBought: "High Purity Polishing Compound, Rubber Backer Pads, Polishing Felt Bob",
    rememberedTerms: {
      paymentTerms: "Net 15 Days after dispatch",
      deliveryTerms: "Immediate dispatch within 48 hours",
      incoterm: "Door Delivery Bangalore",
      currency: "INR",
      freightInsurance: "Freight extra at actuals"
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Seed Inventory catalog for MG Supplytech products
export const SEED_INVENTORY: InventoryItem[] = [
  {
    id: "prod-001",
    sku: "MG-CE-99",
    name: "Cerium Oxide Polishing Powder (Grade A - 99.5%)",
    description: "Ultra-fine optical grade polishing compound for beveling, straight line edging, and scratch removal on float & tempered glass.",
    category: "Polishing Material",
    hsnSac: "28461010",
    defaultUom: "KG",
    packSize: "20 KG Drum / 5 KG Bag",
    basePrice: 650,
    defaultTaxRate: 18,
    inStock: 2500
  },
  {
    id: "prod-002",
    sku: "MG-CE-OPT",
    name: "Optical Glass Precision Polishing Slurry",
    description: "Premixed suspension with high suspension stability for high-speed automated polishing lines and mirror backing.",
    category: "Polishing Material",
    hsnSac: "28461090",
    defaultUom: "LTR",
    packSize: "25 Liter Carboy",
    basePrice: 920,
    defaultTaxRate: 18,
    inStock: 800
  },
  {
    id: "prod-003",
    sku: "MG-DW-150",
    name: "Metal Bond Diamond Grinding Wheel 150mm",
    description: "Premium diamond rim cup wheel for double edger & CNC glass processing machines. Grit 140/170.",
    category: "Diamond Tools",
    hsnSac: "68042110",
    defaultUom: "PCS",
    packSize: "1 PC Box",
    basePrice: 3200,
    defaultTaxRate: 18,
    inStock: 140
  },
  {
    id: "prod-004",
    sku: "MG-FW-SPIRAL",
    name: "High Density Spiral Wool Felt Polishing Wheel",
    description: "100% natural compressed Australian wool wheel for high luster final polishing on straight line edger machines.",
    category: "Polishing Material",
    hsnSac: "59119090",
    defaultUom: "PCS",
    packSize: "10 PCS Pack",
    basePrice: 850,
    defaultTaxRate: 18,
    inStock: 450
  },
  {
    id: "prod-005",
    sku: "MG-SC-BELT",
    name: "Silicon Carbide Waterproof Abrasive Belts (100x1800mm)",
    description: "Heavy duty cloth backed abrasive belts for wet glass seamers and cross-belt grinding machines. Grit 80/120/240.",
    category: "Abrasives",
    hsnSac: "68051090",
    defaultUom: "PCS",
    packSize: "25 PCS Box",
    basePrice: 195,
    defaultTaxRate: 18,
    inStock: 1200
  },
  {
    id: "prod-006",
    sku: "MG-COOL-SYN",
    name: "Synthetic Water-Soluble Glass Grinding Coolant",
    description: "Bio-stable synthetic coolant oil for glass drilling, edge grinding and CNC cutting. Anti-corrosive and flocculant.",
    category: "Industrial Consumables",
    hsnSac: "34031900",
    defaultUom: "LTR",
    packSize: "210 Liter Drum / 20 Liter Can",
    basePrice: 280,
    defaultTaxRate: 18,
    inStock: 1500
  }
];
