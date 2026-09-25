/**
 * Robust CSV / TSV / Spreadsheet Parser & Serializer
 * Supports:
 * - RFC 4180 quotes with escaped quotes ("") and commas
 * - Tab-separated values (direct copy-paste from Excel / Google Sheets)
 * - Automatic delimiter detection (, or \t or ;)
 * - Header row extraction & row dictionary generation
 */

export interface ParsedSpreadsheet {
  headers: string[];
  rows: string[][];
  totalRows: number;
  delimiter: string;
}

/**
 * Parses raw CSV or TSV text into headers and row values
 */
export function parseSpreadsheetText(rawText: string): ParsedSpreadsheet {
  const clean = rawText.trim();
  if (!clean) {
    return { headers: [], rows: [], totalRows: 0, delimiter: ',' };
  }

  // Detect delimiter: check the first line for tabs, semicolons, or commas
  const firstLine = clean.split(/\r\n|\n|\r/)[0] || '';
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount >= semicolonCount) {
    delimiter = '\t';
  } else if (semicolonCount > commaCount && semicolonCount > tabCount) {
    delimiter = ';';
  }

  // Parse lines with quote handling
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < clean.length) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(col => col.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some(col => col.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push final field/row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(col => col.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, delimiter };
  }

  const rawHeaders = lines[0].map(h => h.trim());
  const rows = lines.slice(1).filter(r => r.some(cell => cell.trim().length > 0));

  return {
    headers: rawHeaders,
    rows,
    totalRows: rows.length,
    delimiter
  };
}

/**
 * Downloads a CSV string as a file in the user's browser
 */
export function downloadCsvFile(content: string, fileName: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Standard CSV templates for 1-click download
 */
export const SAMPLE_CUSTOMERS_CSV = `Company Name,Contact Person,Mobile No,Email,GSTIN,Address,City,State,Country,Payment Terms,Delivery Terms,Products Bought
"Apex Optical Industries","Mr. Rajesh Sharma","+91 98210 55443","rajesh@apexoptical.com","07AAACA4512D1Z5","Plot 45, Okhla Industrial Area Phase-III","New Delhi","Delhi","India","100% Advance against PI","3–5 working days","White Cerium Oxide Powder, Polishing Felts"
"Precision Glassworks Ltd","Dr. Anand Verma","+91 98450 11223","procure@precisionglass.co.in","29AAACP8841M1ZF","Survey 102, Peenya Industrial Area","Bengaluru","Karnataka","India","50% Advance, Balance on Dispatch","7–10 days","High-Purity Rare Earth Cerium, Diamond Wheels"
"Starlight Optics GMBH","Mr. Hans Mueller","+49 170 555 4321","h.mueller@starlight-optics.de","DE812345678","Industriestrasse 14","Frankfurt","Hesse","Germany","100% Irrevocable LC at sight","FOB Mundra Port","Optical Grade Cerium Oxide 99.9%"
"Himalayan Crystals Pvt Ltd","Mr. Gaurav Batra","+91 94191 22334","batra@himalayancrystals.in","01AAACH3321K1Z2","Industrial Estate Gangyal","Jammu","Jammu & Kashmir","India","30 Days Net from Delivery","Ready Stock (1-2 days)","Cerium Oxide Polishing Powder"`;

export const SAMPLE_PRODUCTS_CSV = `Product Name,SKU,Category,HSN Code,Unit,Pack Size,Base Price,Tax Rate (%),In Stock,Description
"White Cerium Oxide Polishing Powder (TREO 99.9%)","MG-CER-999","Polishing Material","28461010","KG","20 KG Fiber Drum",1850,18,500,"High precision glass & optical beveling compound with rapid removal rate"
"Optical Grade Rare Earth Cerium Powder (Standard)","MG-CER-STD","Polishing Material","28461010","KG","25 KG Drum",1420,18,850,"Standard flat glass polishing powder for beveling, edgework & mirror backing"
"Diamond Grinding Wheel (Double Edge 150mm)","MG-DIA-150","Machinery Tools","68042290","PCS","1 PC Box",3650,18,45,"High concentration diamond abrasive wheel for straight line edging machine"
"High Density Wool Polishing Felt Wheel (150x25mm)","MG-FELT-150","Consumables","59119090","PCS","1 PC Pack",890,18,120,"Pure Australian wool spiral pressed wheel for scratch-free optical luster"
"Glass Cutting Lubricant & Coolant Concentrated (5L)","MG-COOL-05","Chemicals","34039900","LTR","5 Liter Can",1250,18,60,"Water-soluble glass grinding coolant with corrosion inhibitor and rapid chip settling"`;
