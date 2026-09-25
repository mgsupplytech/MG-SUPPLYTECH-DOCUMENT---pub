import { GoogleGenAI } from '@google/genai';
import { getSettings } from './storageService';
import { CANONICAL_SELLER } from '../constants/brand';
import { DocumentRecord, DocumentType } from '../types';

export const getGeminiClient = (customKey?: string): GoogleGenAI | null => {
  const settings = getSettings();
  const apiKey = customKey || settings.geminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
    return null;
  }
};

export const hasAiConfigured = (): boolean => {
  const settings = getSettings();
  const apiKey = settings.geminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  return Boolean(apiKey && apiKey.trim().length > 5);
};

const SYSTEM_PROMPT = `You are the dedicated AI Commercial Executive for MG Supplytech, a premier B2B glass polishing and industrial supplytech company based in Delhi, India.
Canonical Seller Data:
- Company Name: MG Supplytech
- GSTIN: 07ATTPT6324N1ZQ
- Address: 177 First Floor, Vigyan Vihar, Delhi – 110092, India
- Email: info@mgsupplytech.com
- Primary Phone/WhatsApp: +91 83739 76489
- Secondary Phone: +91 98990 59593
- Website: www.mgsupplytech.com
- Bank: ICICI Bank, Account: 083105004679, IFSC: ICIC0000831

Rules:
1. Always maintain a professional, courteous B2B corporate tone.
2. For destinations in India, Nepal, Bhutan, default currency is INR. For other countries, default currency is USD.
3. For export transactions, always ask or confirm Incoterm, port of loading, port of discharge, dispatch mode, and payment terms.
4. When asked to parse or generate a document or quotation, respond with valid JSON when requested.`;

export async function askAiAssistant(userPrompt: string, contextDoc?: DocumentRecord): Promise<string> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini API key is not configured. Please enter your Gemini API Key in the AI panel or Settings.");
  }

  const contextMessage = contextDoc ? `
Current Active Document in Editor:
- Document Type: ${contextDoc.docType} (${contextDoc.docNumber})
- Customer: ${contextDoc.customerName} (${contextDoc.customerCountry})
- Currency: ${contextDoc.currency}
- Grand Total: ${contextDoc.grandTotal}
- Items Count: ${contextDoc.items.length}
- Payment Terms: ${contextDoc.paymentTerms}
- Delivery Terms: ${contextDoc.deliveryTerms}
` : '';

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${SYSTEM_PROMPT}\n\n${contextMessage}\n\nUser Request: ${userPrompt}`
    });

    return response.text || "I was unable to generate a response. Please check your request.";
  } catch (err: any) {
    console.error("AI Error:", err);
    throw new Error(err.message || "Failed to communicate with Gemini API.");
  }
}

export async function generateDocumentFromPrompt(prompt: string, defaultType: DocumentType = 'quotation'): Promise<Partial<DocumentRecord>> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error("Gemini API key is required to use AI document generation.");
  }

  const instructions = `
Extract details from the user prompt into a structured JSON document for MG Supplytech.
Output ONLY raw JSON with no backticks, no markdown fencing, and no preamble:
{
  "docType": "${defaultType}",
  "customerName": "string",
  "customerCountry": "India" or destination country,
  "customerAddress": "string",
  "customerContact": "string",
  "customerEmail": "string",
  "customerTaxId": "string",
  "currency": "INR" or "USD",
  "priceBasis": "Ex-Works Delhi" or Incoterm,
  "paymentTerms": "string",
  "deliveryTerms": "string",
  "freightInsurance": "string",
  "notes": "string",
  "items": [
    {
      "description": "string",
      "hsnSac": "string",
      "qty": number,
      "uom": "KG" | "PCS" | "LTR" | "MTR",
      "unitPrice": number,
      "discountPercent": number,
      "taxRate": number,
      "packSize": "string"
    }
  ]
}

User prompt: ${prompt}`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: instructions,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (err: any) {
    console.error("AI Document Generation error:", err);
    throw new Error(`Failed to generate document: ${err.message}`);
  }
}

export async function draftEmailWithAi(doc: DocumentRecord): Promise<{ subject: string; body: string }> {
  const client = getGeminiClient();
  if (!client) {
    // High quality fallback if AI key not yet entered
    const isPriceOffer = doc.docType === 'price-offer';
    const typeLabel = isPriceOffer ? 'Price Offer' : doc.docType === 'proforma-invoice' ? 'Proforma Invoice' : 'Commercial Quotation';
    const subject = `[MG Supplytech] ${typeLabel} ${doc.docNumber} — ${doc.customerName}`;
    const body = `Dear ${doc.customerName},\n\n` +
      `Greetings from MG Supplytech, Delhi.\n\n` +
      `We thank you for your valued enquiry. Please find our official ${typeLabel.toLowerCase()} #${doc.docNumber} for your kind review.\n\n` +
      `SUMMARY OF OFFER:\n` +
      `• Document Reference: ${doc.docNumber}\n` +
      `• Date: ${doc.date}\n` +
      `• Total Amount: ${doc.currency} ${doc.grandTotal.toLocaleString()}\n` +
      `• Payment Terms: ${doc.paymentTerms}\n` +
      `• Delivery / Lead Time: ${doc.deliveryTerms}\n` +
      `• Price Basis: ${doc.priceBasis || 'Ex-Works Delhi'}\n\n` +
      `Kindly review the detailed document attached. We look forward to your valuable purchase confirmation.\n\n` +
      `Warm regards,\n\n` +
      `Commercial Sourcing Team\n` +
      `MG SUPPLYTECH\n` +
      `177 First Floor, Vigyan Vihar, Delhi – 110092, India\n` +
      `Phone/WhatsApp: +91 83739 76489 | +91 98990 59593\n` +
      `Email: info@mgsupplytech.com | Web: www.mgsupplytech.com`;
    return { subject, body };
  }

  const prompt = `Write a formal, courteous, high-converting B2B sales email for sending a ${doc.docType} (#${doc.docNumber}) to customer "${doc.customerName}" in ${doc.customerCountry}.
Total amount: ${doc.currency} ${doc.grandTotal}.
Payment terms: ${doc.paymentTerms}.
Delivery: ${doc.deliveryTerms}.
Return JSON only: { "subject": "string", "body": "string" }`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
  } catch (err) {
    return {
      subject: `[MG Supplytech] Quotation ${doc.docNumber} — ${doc.customerName}`,
      body: `Dear ${doc.customerName},\n\nPlease find our formal commercial offer attached.\n\nWarm regards,\nMG Supplytech\n+91 83739 76489`
    };
  }
}
