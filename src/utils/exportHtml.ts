import { DocumentRecord } from '../types';
import { 
  getStandardizedDocumentBaseName, 
  getStandardizedDocumentFileName, 
  getStandardizedPdfName 
} from './documentNaming';

export const generateStandaloneHtml = (doc: DocumentRecord): string => {
  const printableElement = document.getElementById('mg-printable-document');
  const innerHtml = printableElement ? printableElement.outerHTML : '';
  const baseName = getStandardizedDocumentBaseName(doc);
  const pdfFileName = getStandardizedPdfName(doc);
  const htmlFileName = getStandardizedDocumentFileName(doc, 'html');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${baseName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Rajdhani:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --mg-deep: #003A30;
      --mg-green: #014136;
      --mg-gold: #DFBC64;
      --mg-gold-dark: #B88C2E;
      --mg-ink: #16211F;
      --mg-muted: #65716D;
      --mg-line: #D9DEDB;
      --mg-soft: #F6F7F5;
      --paper: #ffffff;
      --page-w: 210mm;
      --page-h: 297mm;
      --safe-x: 11mm;
      --footer-h: 12mm;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #e9eeeb;
      color: var(--mg-ink);
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      font-size: 10pt;
      line-height: 1.42;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body { min-width: 210mm; }
    .toolbar-bar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #003A30;
      padding: 10px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .toolbar-title { font-weight: 800; font-size: 13px; letter-spacing: 0.05em; color: #DFBC64; }
    .toolbar-actions { display: flex; gap: 8px; }
    .btn {
      border: 0;
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .btn-gold { background: #DFBC64; color: #003A30; }
    .btn-light { background: #ffffff; color: #014136; }

    .a4-document {
      width: var(--page-w);
      min-height: var(--page-h);
      margin: 15px auto;
      background: #fff;
      position: relative;
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }

    /* Print media rules for strict A4 pagination */
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      html, body {
        background: #ffffff !important;
        min-width: 0 !important;
      }
      .toolbar-bar { display: none !important; }
      .a4-document {
        width: 210mm !important;
        margin: 0 !important;
        box-shadow: none !important;
      }
      thead { display: table-header-group !important; }
      tr, .break-inside-avoid {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .footer-bar {
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar-bar">
    <div class="toolbar-title">
      MG SUPPLYTECH &bull; ${doc.docNumber}
      <span style="font-size: 11px; font-weight: 600; color: #DFBC64; margin-left: 10px; background: rgba(223, 188, 100, 0.15); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(223, 188, 100, 0.3);">
        Filing: ${pdfFileName}
      </span>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-light" onclick="window.open(location.href, '_blank')">Open in New Tab</button>
      <button class="btn btn-gold" onclick="document.title='${baseName}'; window.print();">Print / Save PDF</button>
      <button class="btn btn-light" onclick="downloadCurrentHtml()">Download HTML</button>
    </div>
  </div>

  ${innerHtml}

  <script>
    function downloadCurrentHtml() {
      const blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '${htmlFileName}';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    }
  </script>
</body>
</html>`;
};

export const downloadDocumentHtml = (doc: DocumentRecord): void => {
  const html = generateStandaloneHtml(doc);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = getStandardizedDocumentFileName(doc, 'html');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
};

export const openDocumentInNewTab = (doc: DocumentRecord): void => {
  const html = generateStandaloneHtml(doc);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};
