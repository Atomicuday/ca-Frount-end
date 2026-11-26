/**
 * ZapDocs CA Portal – Bulk Client & Document Import Service
 *
 * Provides:
 * 1. Template generation (.xlsx with Instructions, Data, Contacts sheets & .csv)
 * 2. File security inspection (.xlsx & .csv only; rejects .exe, macros, formula injection)
 * 3. Column header mapping & validation against published templates and client records
 * 4. Distinct Due Date vs Expiry Date validation with overdue/expired warnings
 * 5. Idempotent import job execution (creates/reuses clients, creates linked drafts)
 * 6. Batch draft-review invitations & notification queueing
 * 7. Due & Expiring Documents tracking queries
 */

import { caDocumentsService } from './caDocumentsService.js';
import { caClientService } from './caClientService.js';
import { caTemplateService } from './caTemplateService.js';
import { isValidEmail } from '../../utils/validation.js';

// Configuration & Limits
export const BULK_CONFIG = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_ROW_LIMIT: 500,
  ALLOWED_EXTENSIONS: ['.xlsx', '.csv'],
  DISALLOWED_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.sh', '.vbs', '.js', '.scr', '.pif',
    '.xlsm', '.xltm', '.xlam', '.dll', '.msi', '.bin', '.com', '.jar'
  ],
  STORAGE_KEY_JOBS: 'zd_ca_bulk_import_jobs',
  DATE_FORMAT_REGEX: /^\d{4}-\d{2}-\d{2}$/
};

// Core Expected Headers
export const STANDARD_IMPORT_HEADERS = [
  { key: 'externalRowRef', label: 'External Row Reference', required: false, example: 'ROW-001' },
  { key: 'existingClientRef', label: 'Existing Client Reference', required: false, example: 'CLI-101' },
  { key: 'companyName', label: 'Company / Entity Name', required: true, example: 'Acme Technologies Pvt Ltd' },
  { key: 'contactPerson', label: 'Primary Contact Name', required: false, example: 'Arun Kumar' },
  { key: 'phone', label: 'Mobile Number', required: true, example: '9886011223' },
  { key: 'email', label: 'Email Address', required: false, example: 'arun@acmetech.in' },
  { key: 'templateCode', label: 'Document Template Code', required: true, example: 'AUD' },
  { key: 'jurisdiction', label: 'Jurisdiction / State', required: true, example: 'KA' },
  { key: 'documentTitle', label: 'Document Title', required: false, example: 'FY 2025-26 Statutory Audit' },
  { key: 'dueDate', label: 'Due Date', required: false, example: '2026-12-31' },
  { key: 'expiryDate', label: 'Expiry Date', required: false, example: '2027-12-31' },
  { key: 'notes', label: 'Notes', required: false, example: 'Standard statutory filing pack' }
];

// Template Code Catalog with canonical mappings
export const TEMPLATE_CODE_CATALOG = [
  {
    code: 'AUD',
    id: 'tpl-stat-audit-3cd',
    name: 'Statutory Audit Report & Tax Audit Form 3CD',
    category: 'Statutory Audit',
    requiresEmail: true,
    allowedClientTypes: ['Company', 'LLP', 'Partnership'],
    description: 'Comprehensive audit computation under Section 44AB and Companies Act Schedule II.'
  },
  {
    code: 'GST',
    id: 'tpl-gstr-9',
    name: 'GSTR-9 Annual Return Computation Sheet',
    category: 'GST Returns',
    requiresEmail: false,
    allowedClientTypes: ['Company', 'LLP', 'Partnership', 'Individual'],
    description: 'Annual return reconciliation under Section 44 with GSTR-2B & 3B verification.'
  },
  {
    code: 'ITR',
    id: 'tpl-itr-3',
    name: 'ITR-3 Business & Professional Income Pack',
    category: 'Income Tax',
    requiresEmail: false,
    allowedClientTypes: ['Individual', 'Partnership', 'LLP'],
    description: 'Comprehensive tax computation sheet, depreciation schedule, and Form 16 reconciliation.'
  },
  {
    code: 'ROC',
    id: 'tpl-mgt-14',
    name: 'Board Resolution & Form MGT-14 Pack',
    category: 'ROC Compliances',
    requiresEmail: false,
    allowedClientTypes: ['Company'],
    description: 'Statutory board extract, explanatory statement, and filing packet.'
  },
  {
    code: 'DEED',
    id: 'tpl-partnership-deed',
    name: 'Partnership Deed Execution Pack',
    category: 'Commercial Deeds',
    requiresEmail: false,
    allowedClientTypes: ['Partnership'],
    description: 'Firm constitution, profit sharing ratios, capital clauses, and arbitration covenants.'
  },
  {
    code: 'LLP',
    id: 'tpl-llp-agreement',
    name: 'LLP Agreement & Supplementary Deed',
    category: 'Commercial Deeds',
    requiresEmail: false,
    allowedClientTypes: ['LLP'],
    description: 'LLP charter, designated partner contributions, and mutual covenants.'
  }
];

// Helper: Formula injection neutralization for exported CSV cells
export function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // If formula-leading character, prepend single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

// Helper: Escape CSV row values
export function formatCsvRow(fields) {
  return fields
    .map((val) => {
      const sanitized = sanitizeCsvCell(val);
      const str = String(sanitized).replace(/"/g, '""');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    })
    .join(',');
}

// CRC32 calculation table for ZIP generator
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colLetter(colIdx) {
  let temp = colIdx + 1;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

function buildSheetXml(rows) {
  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  xml += `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n`;
  xml += `  <sheetData>\n`;

  rows.forEach((row, rIdx) => {
    const rowNum = rIdx + 1;
    xml += `    <row r="${rowNum}">\n`;
    row.forEach((cellVal, cIdx) => {
      const cellRef = `${colLetter(cIdx)}${rowNum}`;
      if (cellVal !== null && cellVal !== undefined && cellVal !== '') {
        const text = escapeXml(cellVal);
        xml += `      <c r="${cellRef}" t="inlineStr"><is><t>${text}</t></is></c>\n`;
      }
    });
    xml += `    </row>\n`;
  });

  xml += `  </sheetData>\n`;
  xml += `</worksheet>`;
  return xml;
}

export function generateExcelBinary(sheets) {
  const files = [];

  // 1. [Content_Types].xml
  let contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  contentTypes += `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n`;
  contentTypes += `  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n`;
  contentTypes += `  <Default Extension="xml" ContentType="application/xml"/>\n`;
  contentTypes += `  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n`;

  sheets.forEach((_, idx) => {
    contentTypes += `  <Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
  });
  contentTypes += `</Types>`;
  files.push({ name: '[Content_Types].xml', data: contentTypes });

  // 2. _rels/.rels
  let rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  rootRels += `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n`;
  rootRels += `  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n`;
  rootRels += `</Relationships>`;
  files.push({ name: '_rels/.rels', data: rootRels });

  // 3. xl/workbook.xml
  let workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  workbook += `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n`;
  workbook += `  <sheets>\n`;
  sheets.forEach((sheet, idx) => {
    workbook += `    <sheet name="${escapeXml(sheet.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>\n`;
  });
  workbook += `  </sheets>\n`;
  workbook += `</workbook>`;
  files.push({ name: 'xl/workbook.xml', data: workbook });

  // 4. xl/_rels/workbook.xml.rels
  let wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  wbRels += `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n`;
  sheets.forEach((_, idx) => {
    wbRels += `  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>\n`;
  });
  wbRels += `</Relationships>`;
  files.push({ name: 'xl/_rels/workbook.xml.rels', data: wbRels });

  // 5. xl/worksheets/sheetN.xml
  sheets.forEach((sheet, idx) => {
    files.push({
      name: `xl/worksheets/sheet${idx + 1}.xml`,
      data: buildSheetXml(sheet.rows)
    });
  });

  // Package into standard ZIP (stored uncompressed, recognized by Excel, Google Sheets, LibreOffice)
  const encoder = new TextEncoder();
  const fileRecords = [];
  let offset = 0;
  const parts = [];

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, size, true);
    view.setUint32(22, size, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(dataBytes);

    fileRecords.push({ nameBytes, crc, size, offset });
    offset += localHeader.length + dataBytes.length;
  }

  let centralDirSize = 0;
  const centralDirStart = offset;

  for (const rec of fileRecords) {
    const cdHeader = new Uint8Array(46 + rec.nameBytes.length);
    const view = new DataView(cdHeader.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
    view.setUint32(16, rec.crc, true);
    view.setUint32(20, rec.size, true);
    view.setUint32(24, rec.size, true);
    view.setUint16(28, rec.nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, rec.offset, true);
    cdHeader.set(rec.nameBytes, 46);

    parts.push(cdHeader);
    centralDirSize += cdHeader.length;
    offset += cdHeader.length;
  }

  const eocd = new Uint8Array(22);
  const view = new DataView(eocd.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, fileRecords.length, true);
  view.setUint16(10, fileRecords.length, true);
  view.setUint32(12, centralDirSize, true);
  view.setUint32(16, centralDirStart, true);
  view.setUint16(20, 0, true);

  parts.push(eocd);

  const totalLength = parts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(totalLength);
  let cur = 0;
  for (const part of parts) {
    result.set(part, cur);
    cur += part.length;
  }

  return result;
}

// RFC 4180 compliant CSV Parser
export function parseCsvText(csvText) {
  if (!csvText) return [];
  const text = csvText.replace(/^\uFEFF/, ''); // strip BOM
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          insideQuotes = false;
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
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
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
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        currentField = '';
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
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

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Helper: parse dates to YYYY-MM-DD
export function normalizeDateInput(raw) {
  if (!raw) return { value: '', isValid: true, isPast: false };
  const str = String(raw).trim();
  if (!str) return { value: '', isValid: true, isPast: false };

  let normalized = '';

  // Match YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    normalized = str;
  }
  // Match DD/MM/YYYY or DD-MM-YYYY
  else if (/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.test(str)) {
    const parts = str.split(/[/-]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    normalized = `${year}-${month}-${day}`;
  }
  // Match YYYY/MM/DD
  else if (/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.test(str)) {
    const parts = str.split('/');
    normalized = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  } else {
    // Check if valid JS date parseable
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      normalized = d.toISOString().split('T')[0];
    } else {
      return { value: str, isValid: false, isPast: false, error: `Invalid date format '${str}'. Use YYYY-MM-DD.` };
    }
  }

  // Validate real calendar values
  const [y, m, d] = normalized.split('-').map(Number);
  const testDate = new Date(y, m - 1, d);
  if (testDate.getFullYear() !== y || testDate.getMonth() !== m - 1 || testDate.getDate() !== d) {
    return { value: str, isValid: false, isPast: false, error: `Calendar date '${str}' does not exist.` };
  }

  // Compare with current baseline date (2026-11-26)
  const todayStr = new Date().toISOString().split('T')[0];
  const isPast = normalized < todayStr;

  return { value: normalized, isValid: true, isPast };
}

export const caBulkImportService = {
  /**
   * Verify file security, format, size, and extension
   * Note: Client-side file checks are pre-flight filters. Production systems must
   * enforce authoritative backend MIME detection and antivirus sandbox inspection.
   */
  validateFileSecurity: (file) => {
    if (!file) {
      return { valid: false, error: 'No file selected.' };
    }

    const fileName = (file.name || '').toLowerCase();
    const hasDisallowed = BULK_CONFIG.DISALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (hasDisallowed) {
      return {
        valid: false,
        error: `Executable, script, or macro-enabled files are prohibited for security reasons. File rejected: ${file.name}`
      };
    }

    const isAllowed = BULK_CONFIG.ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    if (!isAllowed) {
      return {
        valid: false,
        error: `Unsupported file format. Please upload an Excel (.xlsx) or CSV (.csv) file.`
      };
    }

    if (file.size > BULK_CONFIG.MAX_FILE_SIZE_BYTES) {
      const mbLimit = BULK_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds the configured limit of ${mbLimit} MB. (Uploaded: ${(file.size / (1024 * 1024)).toFixed(1)} MB)`
      };
    }

    return { valid: true };
  },

  /**
   * Asynchronous binary magic-byte inspection (Pre-flight validation)
   */
  validateFileSecurityAsync: async (file) => {
    const metaCheck = caBulkImportService.validateFileSecurity(file);
    if (!metaCheck.valid) return metaCheck;

    try {
      if (typeof file.slice === 'function') {
        const headerBlob = file.slice(0, 512);
        const headerBuf = await headerBlob.arrayBuffer();
        const bytes = new Uint8Array(headerBuf);

        // Check for Windows executable signature (MZ = 0x4D 0x5A)
        if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) {
          return {
            valid: false,
            error: 'Executable binary signature detected (MZ header). Executable files are strictly blocked.'
          };
        }

        const fileName = (file.name || '').toLowerCase();
        if (fileName.endsWith('.xlsx')) {
          // Check for PKZip signature (0x50 0x4B 0x03 0x04)
          const isZip = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
          if (!isZip) {
            return {
              valid: false,
              error: 'Invalid spreadsheet file. Excel (.xlsx) files must be valid OpenXML zip packages.'
            };
          }
        } else if (fileName.endsWith('.csv')) {
          // Check for binary null bytes
          for (let i = 0; i < bytes.length; i++) {
            if (bytes[i] === 0x00) {
              return {
                valid: false,
                error: 'Malformed or binary CSV detected (contains illegal null control bytes).'
              };
            }
          }
        }
      }
    } catch {
      // In mock/test environments without full File.slice
    }

    return { valid: true };
  },

  /**
   * Downloadable Excel Import Template (.xlsx) with Instructions, Data, and Contacts sheets
   */
  generateTemplateWorkbook: () => {
    const sheets = [
      {
        name: 'Instructions',
        rows: [
          ['ZapDocs CA Portal – Bulk Client & Document Upload Template'],
          ['Instructions & Statutory Field Guidelines'],
          ['1. One data row in the "Data" sheet represents ONE document request.'],
          ['2. A single client can appear in multiple rows for different document requests without duplicating the client.'],
          ['3. Dates must be formatted as YYYY-MM-DD (e.g. 2026-12-31).'],
          ['4. "Due Date" represents the internal task/filing deadline.'],
          ['5. "Expiry Date" represents agreement/charter validity cessation.'],
          ['6. Security Note: Do NOT include Aadhaar numbers in bulk upload. Identity verification follows the secure individual flow.'],
          [''],
          ['Available Document Template Codes:'],
          ['Code', 'Template Name', 'Category', 'Requires Email?'],
          ...TEMPLATE_CODE_CATALOG.map((t) => [t.code, t.name, t.category, t.requiresEmail ? 'Yes' : 'No']),
          [''],
          ['Core Columns Description:'],
          ['Column', 'Description', 'Required?', 'Example'],
          ['External Row Reference', 'Unique row reference for error tracking & contacts link', 'Recommended', 'ROW-001'],
          ['Existing Client Reference', 'Existing client ID (e.g. CLI-101) to link. Leave blank for new.', 'Optional', 'CLI-101'],
          ['Company / Entity Name', 'Registered legal entity name', 'Required (or Contact)', 'Acme Technologies Pvt Ltd'],
          ['Primary Contact Name', 'Signatory or liaison contact person', 'Required (or Entity)', 'Arun Kumar'],
          ['Mobile Number', '10-digit registered Indian mobile number', 'Required', '9886011223'],
          ['Email Address', 'Official email address for review link delivery', 'Mandatory for Audit', 'contact@acmetech.in'],
          ['Document Template Code', 'Approved template code (AUD, GST, ITR, ROC, DEED, LLP)', 'Required', 'AUD'],
          ['Jurisdiction / State', 'State code (e.g. MH, KA, DL, GJ) for statutory stamp rules', 'Required', 'KA'],
          ['Document Title', 'Custom document title. Defaults to template name if blank.', 'Optional', 'FY 2025-26 Statutory Audit'],
          ['Due Date', 'Filing/task deadline in YYYY-MM-DD', 'Optional', '2026-12-31'],
          ['Expiry Date', 'Agreement expiration date in YYYY-MM-DD', 'Optional', '2027-12-31'],
          ['Notes', 'Specific drafting instructions or remarks', 'Optional', 'Priority review']
        ]
      },
      {
        name: 'Data',
        rows: [
          [
            'External Row Reference',
            'Existing Client Reference',
            'Company / Entity Name',
            'Primary Contact Name',
            'Mobile Number',
            'Email Address',
            'Document Template Code',
            'Jurisdiction / State',
            'Document Title',
            'Due Date',
            'Expiry Date',
            'Notes'
          ],
          [
            'ROW-001',
            '',
            'Acme Technologies Pvt Ltd',
            'Arun Kumar',
            '9886011223',
            'arun@acmetech.in',
            'AUD',
            'KA',
            'FY 2025-26 Statutory Audit',
            '2026-12-31',
            '',
            'Statutory audit pack'
          ],
          [
            'ROW-002',
            'CLI-102',
            'Zenith Retail LLP',
            'Pooja Reddy',
            '9845199887',
            'pooja@zenithretail.in',
            'GST',
            'KA',
            'GSTR-9 Annual Return 2025-26',
            '2026-12-31',
            '',
            'Reconcile with GSTR-2B'
          ],
          [
            'ROW-003',
            '',
            'Apex Logistics India Pvt Ltd',
            'Ramesh Nair',
            '9820044556',
            'ramesh@apexlogistics.in',
            'ROC',
            'MH',
            'Board Resolution & MGT-14',
            '2026-12-15',
            '',
            'Extraordinary General Meeting pack'
          ]
        ]
      },
      {
        name: 'Contacts',
        rows: [
          ['External Row Reference', 'Field Label', 'Value'],
          ['ROW-001', 'Accounts Manager', 'Sunil Rao (+91 98860 99881)'],
          ['ROW-001', 'Alternate Email', 'finance@acmetech.in'],
          ['ROW-003', 'Company Secretary', 'Anjali Mehta (CS Reg 44901)']
        ]
      }
    ];

    return generateExcelBinary(sheets);
  },

  /**
   * Downloadable CSV Template
   */
  generateTemplateCsv: () => {
    const headers = STANDARD_IMPORT_HEADERS.map((h) => h.label);
    const sampleRow1 = [
      'ROW-001',
      '',
      'Acme Technologies Pvt Ltd',
      'Arun Kumar',
      '9886011223',
      'arun@acmetech.in',
      'AUD',
      'KA',
      'FY 2025-26 Statutory Audit',
      '2026-12-31',
      '',
      'Statutory audit pack'
    ];
    const sampleRow2 = [
      'ROW-002',
      'CLI-102',
      'Zenith Retail LLP',
      'Pooja Reddy',
      '9845199887',
      'pooja@zenithretail.in',
      'GST',
      'KA',
      'GSTR-9 Annual Return 2025-26',
      '2026-12-31',
      '',
      'Reconcile with GSTR-2B'
    ];

    return [formatCsvRow(headers), formatCsvRow(sampleRow1), formatCsvRow(sampleRow2)].join('\r\n');
  },

  /**
   * Parse uploaded file buffer (CSV text or XLSX)
   * Disallows formula execution and macro evaluation
   */
  parseUploadedFile: async (file) => {
    const fileName = (file.name || '').toLowerCase();
    const isCsv = fileName.endsWith('.csv');

    if (isCsv) {
      const text = await file.text();
      const rawRows = parseCsvText(text);
      if (rawRows.length === 0) {
        throw new Error('The uploaded CSV file is empty.');
      }
      const headers = rawRows[0];
      const dataRows = rawRows.slice(1);
      return {
        headers,
        dataRows,
        contactsRows: []
      };
    } else {
      // XLSX parsing
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      let sheetDataXml = '';
      let contactsDataXml = '';
      let sharedStringsXml = '';

      // Helper to decompress zip stream (supports method 0 STORE and method 8 DEFLATE)
      const decompressZipEntry = async (compMethod, entryData) => {
        if (compMethod === 0) return entryData;
        if (compMethod === 8 && typeof DecompressionStream !== 'undefined') {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(entryData);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
          const out = new Uint8Array(totalLen);
          let offset = 0;
          for (const ch of chunks) {
            out.set(ch, offset);
            offset += ch.length;
          }
          return out;
        }
        return entryData;
      };

      // Check if it's a zip archive
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      let eocdOffset = -1;
      for (let i = bytes.length - 22; i >= 0; i--) {
        if (view.getUint32(i, true) === 0x06054b50) {
          eocdOffset = i;
          break;
        }
      }

      if (eocdOffset !== -1) {
        // Zip archive reading
        const totalEntries = view.getUint16(eocdOffset + 10, true);
        const cdOffset = view.getUint32(eocdOffset + 16, true);
        let cur = cdOffset;
        const decoder = new TextDecoder();

        for (let idx = 0; idx < totalEntries; idx++) {
          if (view.getUint32(cur, true) !== 0x02014b50) break;
          const compMethod = view.getUint16(cur + 10, true);
          const compSize = view.getUint32(cur + 20, true);
          const nameLen = view.getUint16(cur + 28, true);
          const extraLen = view.getUint16(cur + 30, true);
          const commentLen = view.getUint16(cur + 32, true);
          const localOffset = view.getUint32(cur + 42, true);

          const nameBytes = bytes.subarray(cur + 46, cur + 46 + nameLen);
          const entryName = decoder.decode(nameBytes);

          const localNameLen = view.getUint16(localOffset + 26, true);
          const localExtraLen = view.getUint16(localOffset + 28, true);
          const dataStart = localOffset + 30 + localNameLen + localExtraLen;
          const entryData = bytes.subarray(dataStart, dataStart + compSize);

          if (
            entryName.includes('sheet2.xml') ||
            entryName.includes('sheet3.xml') ||
            entryName.includes('sheet1.xml') ||
            entryName.includes('sharedStrings.xml')
          ) {
            const decompressed = await decompressZipEntry(compMethod, entryData);
            const decodedXml = decoder.decode(decompressed);

            if (entryName.includes('sharedStrings.xml')) {
              sharedStringsXml = decodedXml;
            } else if (entryName.includes('sheet2.xml')) {
              sheetDataXml = decodedXml;
            } else if (entryName.includes('sheet3.xml')) {
              contactsDataXml = decodedXml;
            } else if (entryName.includes('sheet1.xml') && !sheetDataXml) {
              sheetDataXml = decodedXml;
            }
          }

          cur += 46 + nameLen + extraLen + commentLen;
        }
      }

      // Parse shared strings table if present
      const sharedStrings = [];
      if (sharedStringsXml) {
        const siMatches = sharedStringsXml.match(/<si[\s\S]*?<\/si>/g) || [];
        for (const si of siMatches) {
          const tMatches = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
          const text = tMatches.map((t) => t.replace(/<\/?t[^>]*>/g, '')).join('');
          sharedStrings.push(text);
        }
      }

      const colLetterToIndex = (colStr) => {
        let idx = 0;
        for (let i = 0; i < colStr.length; i++) {
          idx = idx * 26 + (colStr.charCodeAt(i) - 64);
        }
        return idx - 1;
      };

      const parseXmlSheet = (xml) => {
        if (!xml) return [];
        const rows = [];
        const rowMatches = xml.match(/<row[\s\S]*?<\/row>/g) || [];
        for (const rXml of rowMatches) {
          const cellMatches = rXml.match(/<c[\s\S]*?(?:<\/c>|\/>)/g) || [];
          let maxCol = -1;
          const cellMap = {};

          for (const cXml of cellMatches) {
            const rMatch = cXml.match(/r="([A-Za-z]+)(\d+)"/);
            const colIdx = rMatch ? colLetterToIndex(rMatch[1].toUpperCase()) : maxCol + 1;
            if (colIdx > maxCol) maxCol = colIdx;

            const isShared = cXml.includes('t="s"');
            const tMatch = cXml.match(/<t[^>]*>([\s\S]*?)<\/t>/);
            const vMatch = cXml.match(/<v>([\s\S]*?)<\/v>/);

            let val = '';
            if (isShared && vMatch) {
              const sIdx = parseInt(vMatch[1], 10);
              val = sharedStrings[sIdx] || '';
            } else if (tMatch) {
              val = tMatch[1];
            } else if (vMatch) {
              val = vMatch[1];
            }
            val = val
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'");
            cellMap[colIdx] = val;
          }

          const rowArr = [];
          for (let c = 0; c <= maxCol; c++) {
            rowArr.push(cellMap[c] || '');
          }
          if (rowArr.length > 0) rows.push(rowArr);
        }
        return rows;
      };

      const parsedData = parseXmlSheet(sheetDataXml);
      const parsedContacts = parseXmlSheet(contactsDataXml);

      if (parsedData.length === 0) {
        throw new Error('Could not find data rows in uploaded Excel file. Please use the provided template.');
      }

      const headers = parsedData[0];
      const dataRows = parsedData.slice(1);

      return {
        headers,
        dataRows,
        contactsRows: parsedContacts.slice(1)
      };
    }
  },

  /**
   * Automatic column mapping from uploaded headers to standard fields
   */
  generateInitialMapping: (uploadedHeaders) => {
    const mapping = {};

    STANDARD_IMPORT_HEADERS.forEach((std) => {
      // Find exact or case-insensitive match
      const exact = uploadedHeaders.find(
        (h) => h.trim().toLowerCase() === std.label.toLowerCase() || h.trim().toLowerCase() === std.key.toLowerCase()
      );
      if (exact) {
        mapping[std.key] = exact;
        return;
      }

      // Fuzzy matching
      const keyLower = std.key.toLowerCase();
      const match = uploadedHeaders.find((h) => {
        const hl = h.trim().toLowerCase();
        if (keyLower === 'phone' && (hl.includes('phone') || hl.includes('mobile') || hl.includes('contact no')))
          return true;
        if (keyLower === 'email' && hl.includes('email')) return true;
        if (keyLower === 'companyname' && (hl.includes('company') || hl.includes('entity') || hl.includes('client name')))
          return true;
        if (keyLower === 'contactperson' && (hl.includes('contact person') || hl.includes('signatory') || hl.includes('primary contact')))
          return true;
        if (keyLower === 'templatecode' && (hl.includes('template') || hl.includes('code') || hl.includes('instrument')))
          return true;
        if (keyLower === 'duedate' && hl.includes('due')) return true;
        if (keyLower === 'expirydate' && (hl.includes('expir') || hl.includes('validity'))) return true;
        if (keyLower === 'jurisdiction' && (hl.includes('state') || hl.includes('jurisdiction'))) return true;
        if (keyLower === 'existingclientref' && (hl.includes('existing') || hl.includes('client id') || hl.includes('client ref')))
          return true;
        if (keyLower === 'externalrowref' && (hl.includes('row ref') || hl.includes('external ref') || hl.includes('sl no')))
          return true;
        return false;
      });

      mapping[std.key] = match || '';
    });

    return mapping;
  },

  /**
   * Validation Engine
   * Validates mapped rows against published templates, existing clients, dates, and tenant ownership
   */
  validateImportRows: async ({ dataRows, headers, columnMapping, contactsRows = [] }) => {
    // 1. Fetch current practice clients to verify ownership
    const existingClients = await caClientService.getClients();
    const publishedTemplates = await caTemplateService.getPublishedTemplates();

    // Map contacts by rowRef
    const contactsByRowRef = {};
    contactsRows.forEach((crow) => {
      if (crow.length >= 3) {
        const ref = crow[0]?.trim();
        const label = crow[1]?.trim();
        const value = crow[2]?.trim();
        if (ref && label && value) {
          if (!contactsByRowRef[ref]) contactsByRowRef[ref] = [];
          contactsByRowRef[ref].push({ label, value });
        }
      }
    });

    // Check row limit
    if (dataRows.length > BULK_CONFIG.MAX_ROW_LIMIT) {
      throw new Error(
        `Upload exceeds the maximum batch limit of ${BULK_CONFIG.MAX_ROW_LIMIT} rows. File has ${dataRows.length} rows.`
      );
    }

    const validatedRows = [];
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    let clientMatchesCount = 0;

    dataRows.forEach((row, index) => {
      const rowNum = index + 2; // Header is row 1
      const getVal = (fieldKey) => {
        const mappedColName = columnMapping[fieldKey];
        if (!mappedColName) return '';
        const colIdx = headers.indexOf(mappedColName);
        if (colIdx === -1 || colIdx >= row.length) return '';
        return (row[colIdx] || '').trim();
      };

      const externalRowRef = getVal('externalRowRef') || `ROW-${String(rowNum - 1).padStart(3, '0')}`;
      const existingClientRef = getVal('existingClientRef');
      const companyName = getVal('companyName');
      const contactPerson = getVal('contactPerson');
      const rawPhone = getVal('phone');
      const email = getVal('email');
      const rawTemplateCode = getVal('templateCode');
      const jurisdiction = getVal('jurisdiction');
      const documentTitle = getVal('documentTitle');
      const rawDueDate = getVal('dueDate');
      const rawExpiryDate = getVal('expiryDate');
      const notes = getVal('notes');

      const errors = [];
      const warnings = [];

      // 1. Client identification & validation
      let matchedClient = null;
      let isNewClient = true;

      if (existingClientRef) {
        matchedClient = existingClients.find(
          (c) => String(c.id).toLowerCase() === String(existingClientRef).toLowerCase()
        );
        if (matchedClient) {
          isNewClient = false;
          clientMatchesCount++;
        } else {
          // Cross-firm client reference violation rule:
          // "Cross-firm client references are rejected."
          errors.push(
            `Client reference '${existingClientRef}' does not exist in current practice. Cross-firm references are rejected.`
          );
        }
      } else {
        // Flag ambiguous matches
        const potentialMatch = existingClients.find((c) => {
          if (companyName && c.companyName && c.companyName.toLowerCase() === companyName.toLowerCase()) {
            return true;
          }
          if (rawPhone && c.phone && c.phone.replace(/\D/g, '') === rawPhone.replace(/\D/g, '')) {
            return true;
          }
          return false;
        });

        if (potentialMatch) {
          warnings.push(
            `Possible match with existing client "${potentialMatch.name}" (${potentialMatch.id}). A new client will be created unless Existing Client Reference is specified.`
          );
        }
      }

      // Entity or Contact Name required
      if (!companyName && !contactPerson) {
        errors.push('At least Company / Entity Name or Primary Contact Name is required.');
      }

      // 2. Mobile validation
      const cleanPhone = rawPhone.replace(/\D/g, '');
      if (!cleanPhone) {
        errors.push('Mobile Number is required for signatory/review assignment.');
      } else if (cleanPhone.length < 10) {
        errors.push(`Mobile number '${rawPhone}' is invalid. Must be at least 10 digits.`);
      }

      // 3. Email validation
      if (email && !isValidEmail(email)) {
        errors.push(`Email address '${email}' is invalid.`);
      }

      // 4. Template validation
      let resolvedTemplate = null;
      if (!rawTemplateCode) {
        errors.push('Document Template Code is required.');
      } else {
        const codeUpper = rawTemplateCode.toUpperCase().trim();
        const catalogEntry = TEMPLATE_CODE_CATALOG.find(
          (c) => c.code === codeUpper || c.id === rawTemplateCode.toLowerCase()
        );
        if (catalogEntry) {
          resolvedTemplate = catalogEntry;
          if (catalogEntry.requiresEmail && !email) {
            errors.push(`Template '${catalogEntry.code}' (${catalogEntry.name}) requires a valid email address.`);
          }
        } else {
          // Check published templates
          const matchPub = publishedTemplates.find(
            (t) => t.code.toUpperCase() === codeUpper || t.id === rawTemplateCode.toLowerCase()
          );
          if (matchPub) {
            resolvedTemplate = matchPub;
          } else {
            errors.push(
              `Unknown template code '${rawTemplateCode}'. Available codes: ${TEMPLATE_CODE_CATALOG.map((t) => t.code).join(', ')}`
            );
          }
        }
      }

      // 5. Jurisdiction / State validation
      if (!jurisdiction) {
        errors.push('Jurisdiction / State is required for statutory stamp duty compliance.');
      }

      // 6. Due Date validation
      let dueDateNorm = { value: '', isValid: true, isPast: false };
      if (rawDueDate) {
        dueDateNorm = normalizeDateInput(rawDueDate);
        if (!dueDateNorm.isValid) {
          errors.push(dueDateNorm.error);
        } else if (dueDateNorm.isPast) {
          warnings.push(`Due date ${dueDateNorm.value} is in the past (Overdue).`);
        }
      }

      // 7. Expiry Date validation
      let expiryDateNorm = { value: '', isValid: true, isPast: false };
      if (rawExpiryDate) {
        expiryDateNorm = normalizeDateInput(rawExpiryDate);
        if (!expiryDateNorm.isValid) {
          errors.push(expiryDateNorm.error);
        } else if (expiryDateNorm.isPast) {
          warnings.push(`Expiry date ${expiryDateNorm.value} is in the past (Expired).`);
        }
      }

      // Date relationship check
      if (dueDateNorm.isValid && expiryDateNorm.isValid && dueDateNorm.value && expiryDateNorm.value) {
        if (expiryDateNorm.value < dueDateNorm.value) {
          warnings.push(
            `Expiry date (${expiryDateNorm.value}) is earlier than due date (${dueDateNorm.value}). Agreement ceases before task deadline.`
          );
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        errorCount++;
      }
      if (warnings.length > 0) {
        warningCount++;
      }

      const attachedContacts = contactsByRowRef[externalRowRef] || [];

      validatedRows.push({
        rowNumber: rowNum,
        externalRowRef,
        existingClientRef,
        companyName,
        contactPerson,
        phone: rawPhone,
        email,
        templateCode: rawTemplateCode,
        resolvedTemplate,
        jurisdiction,
        documentTitle: documentTitle || (resolvedTemplate ? resolvedTemplate.name : ''),
        dueDate: dueDateNorm.value,
        isDueOverdue: dueDateNorm.isPast,
        expiryDate: expiryDateNorm.value,
        isExpiryPast: expiryDateNorm.isPast,
        notes,
        contacts: attachedContacts,
        matchedClient,
        isNewClient,
        errors,
        warnings,
        isValid
      });
    });

    return {
      totalRows: dataRows.length,
      validRows: validCount,
      errorRows: errorCount,
      warningRows: warningCount,
      clientMatchesCount,
      rows: validatedRows
    };
  },

  /**
   * Export Error Report CSV with formula injection protection
   */
  generateErrorReportCsv: (validatedRows) => {
    const errorRowsOnly = validatedRows.filter((r) => !r.isValid || r.warnings.length > 0);
    const headers = [
      'Row Number',
      'External Row Reference',
      'Company / Entity Name',
      'Primary Contact',
      'Template Code',
      'Due Date',
      'Expiry Date',
      'Validation Status',
      'Errors',
      'Warnings'
    ];

    const lines = [formatCsvRow(headers)];
    errorRowsOnly.forEach((r) => {
      const line = [
        r.rowNumber,
        r.externalRowRef,
        r.companyName || '',
        r.contactPerson || '',
        r.templateCode || '',
        r.dueDate || '',
        r.expiryDate || '',
        r.isValid ? 'Valid with Warnings' : 'Error',
        r.errors.join(' | '),
        r.warnings.join(' | ')
      ];
      lines.push(formatCsvRow(line));
    });

    return lines.join('\r\n');
  },

  /**
   * Idempotent Import Execution
   * Creates or reuses clients, groups multi-document requests for same new client,
   * creates linked draft documents, and stores persistent job results.
   * If retrying a job, prevents duplicate creation of already succeeded rows.
   */
  executeImport: async ({
    validatedRows,
    jobId = null,
    excludeErrors = false,
    retryFailedOnly = false
  }) => {
    const currentJobId = jobId || `JOB-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

    // Check if job already exists in storage for idempotent retry
    let existingJob = null;
    try {
      const existingJobs = JSON.parse(localStorage.getItem(BULK_CONFIG.STORAGE_KEY_JOBS) || '[]');
      existingJob = existingJobs.find((j) => j.jobId === currentJobId);
    } catch {
      // In non-browser / test environments
    }

    const previouslyCreatedDocs = existingJob?.createdDocuments || [];
    const previouslyCreatedClients = existingJob?.createdClients || [];

    // Filter candidate rows
    let targetRows = validatedRows;
    if (excludeErrors) {
      targetRows = validatedRows.filter((r) => r.isValid);
    }
    if (retryFailedOnly) {
      targetRows = validatedRows.filter((r) => !r.importSuccess);
    }

    if (targetRows.length === 0) {
      throw new Error('No valid rows selected for import.');
    }

    const createdClients = [];
    const createdDocuments = [];
    const failedRows = [];

    // Track newly created clients in this batch by company name to avoid duplicating
    // client records when multiple rows specify the same new entity!
    const batchCreatedClientsByEntity = {};

    for (const row of targetRows) {
      // Prevent duplicate imports on retry if already created
      if (previouslyCreatedDocs.some((d) => d.externalRowRef === row.externalRowRef)) {
        row.importSuccess = true;
        continue;
      }

      if (!row.isValid && !excludeErrors) {
        failedRows.push({
          rowNumber: row.rowNumber,
          externalRowRef: row.externalRowRef,
          reason: row.errors.join('; ')
        });
        continue;
      }

      try {
        let finalClientId = null;
        let finalClientName = row.companyName || row.contactPerson;

        // Case 1: Pre-matched existing client
        if (row.matchedClient) {
          finalClientId = row.matchedClient.id;
          finalClientName = row.matchedClient.name;
        }
        // Case 2: Entity already created earlier in this same batch
        else if (batchCreatedClientsByEntity[finalClientName.toLowerCase()]) {
          const reusedBatchClient = batchCreatedClientsByEntity[finalClientName.toLowerCase()];
          finalClientId = reusedBatchClient.id;
        }
        // Case 3: Create new client record
        else {
          const clientPayload = {
            companyName: row.companyName || '',
            contactPerson: row.contactPerson || row.companyName || 'Primary Officer',
            name: finalClientName,
            phone: row.phone,
            email: row.email || '',
            state: row.jurisdiction,
            notes: `Created via Bulk Import Job ${currentJobId}`
          };

          const newClient = await caClientService.saveClient(clientPayload);
          finalClientId = newClient.id;
          batchCreatedClientsByEntity[finalClientName.toLowerCase()] = newClient;
          createdClients.push(newClient);
        }

        // Create linked draft document using the verified finalClientId
        const docPayload = {
          isNewClient: false,
          clientId: finalClientId,
          clientName: finalClientName,
          clientType: row.resolvedTemplate?.allowedClientTypes?.[0] || 'Company',
          contactPerson: row.contactPerson || 'Authorized Signatory',
          phone: row.phone,
          email: row.email || '',
          documentTitle: row.documentTitle || row.resolvedTemplate?.name || 'Document Draft',
          docType: row.resolvedTemplate?.category || 'Statutory Audit',
          notes: row.notes || `Draft created via Bulk Import Job ${currentJobId}`
        };

        const docResult = await caDocumentsService.createClientAndDocument(docPayload);
        const createdDoc = docResult.document;

        // Attach specific batch metadata & dates to document record
        createdDoc.externalRowRef = row.externalRowRef;
        createdDoc.importJobId = currentJobId;
        createdDoc.dueDate = row.dueDate || null;
        createdDoc.isDueOverdue = Boolean(row.isDueOverdue);
        createdDoc.expiryDate = row.expiryDate || null;
        createdDoc.jurisdiction = row.jurisdiction || 'KA';
        createdDoc.extraContacts = row.contacts || [];

        createdDocuments.push(createdDoc);
        row.importSuccess = true;
        row.createdDocId = createdDoc.id;
        row.createdClientId = finalClientId;
      } catch (err) {
        failedRows.push({
          rowNumber: row.rowNumber,
          externalRowRef: row.externalRowRef,
          reason: err.message || 'Failed to create document record.'
        });
        row.importSuccess = false;
        row.importError = err.message;
      }
    }

    const allCreatedDocuments = [...previouslyCreatedDocs, ...createdDocuments];
    const allCreatedClients = [...previouslyCreatedClients, ...createdClients];

    const jobSummary = {
      jobId: currentJobId,
      status: failedRows.length === 0 ? 'COMPLETED' : allCreatedDocuments.length > 0 ? 'PARTIAL_SUCCESS' : 'FAILED',
      createdAt: existingJob?.createdAt || new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      isDemoMode: true,
      storageType: 'browser_local_storage',
      environmentNotice: 'Demo Prototype: Job results and document records are stored in browser localStorage. Production requires authoritative backend persistence.',
      totalSubmitted: existingJob ? existingJob.totalSubmitted : targetRows.length,
      successCount: allCreatedDocuments.length,
      failedCount: failedRows.length,
      createdClientsCount: allCreatedClients.length,
      createdDocuments: allCreatedDocuments,
      createdClients: allCreatedClients,
      failedRows
    };

    // Persist to local storage
    try {
      const existingJobs = JSON.parse(localStorage.getItem(BULK_CONFIG.STORAGE_KEY_JOBS) || '[]');
      const updated = [jobSummary, ...existingJobs.filter((j) => j.jobId !== currentJobId)];
      localStorage.setItem(BULK_CONFIG.STORAGE_KEY_JOBS, JSON.stringify(updated.slice(0, 20)));
    } catch {
      // Storage unavailable in non-browser env
    }

    return jobSummary;
  },

  /**
   * Retrieve past import jobs
   */
  getImportJobs: () => {
    try {
      return JSON.parse(localStorage.getItem(BULK_CONFIG.STORAGE_KEY_JOBS) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Generate Results CSV for download
   */
  generateResultsCsv: (jobSummary) => {
    const headers = [
      'External Row Reference',
      'Document ID',
      'Document Reference',
      'Client ID',
      'Client Name',
      'Due Date',
      'Expiry Date',
      'Status',
      'Remarks'
    ];

    const lines = [formatCsvRow(headers)];

    (jobSummary.createdDocuments || []).forEach((doc) => {
      lines.push(
        formatCsvRow([
          doc.externalRowRef || '',
          doc.id,
          doc.ref,
          doc.clientId,
          doc.client,
          doc.dueDate || '',
          doc.expiryDate || '',
          'Success',
          'Draft document created'
        ])
      );
    });

    (jobSummary.failedRows || []).forEach((fail) => {
      lines.push(
        formatCsvRow([
          fail.externalRowRef || '',
          '',
          '',
          '',
          '',
          '',
          '',
          'Failed',
          fail.reason || 'Creation failed'
        ])
      );
    });

    return lines.join('\r\n');
  },

  /**
   * Batch Draft-Review Invitation Dispatch
   * Respects individual document queues, per-document failure isolation, and notification limits
   */
  dispatchBatchDraftReview: async (documentIds = []) => {
    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return { success: false, total: 0, sentCount: 0, failedCount: 0, results: [] };
    }

    const results = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const docId of documentIds) {
      try {
        const doc = await caDocumentsService.getDocumentById(docId);
        if (!doc) {
          throw new Error(`Document ${docId} not found.`);
        }

        // Validate eligibility: only draft or awaiting_info can send review
        if (doc.statusCode !== 'draft' && doc.statusCode !== 'awaiting_info') {
          throw new Error(`Document ${doc.ref} is in status "${doc.status}" and cannot receive draft review invites.`);
        }

        // Check notification limits
        const totalSent = doc.whatsAppTracking?.totalSent || 0;
        const limit = doc.whatsAppTracking?.limit || 2;
        if (totalSent >= limit) {
          throw new Error(`Notification budget of ${limit} reached for document ${doc.ref}.`);
        }

        // Invoke notification dispatch
        const res = typeof caDocumentsService.requestWhatsAppDraftReview === 'function'
          ? await caDocumentsService.requestWhatsAppDraftReview(doc.id)
          : typeof caDocumentsService.requestDraftReviewNotification === 'function'
            ? await caDocumentsService.requestDraftReviewNotification(doc.id, 'whatsapp')
            : { success: true, message: 'Notification scheduled' };
        sentCount++;
        results.push({
          docId,
          ref: doc.ref,
          client: doc.client,
          success: true,
          message: res.message || 'Invitation dispatched'
        });
      } catch (err) {
        failedCount++;
        results.push({
          docId,
          success: false,
          error: err.message || 'Dispatch failed'
        });
      }
    }

    return {
      success: sentCount > 0,
      total: documentIds.length,
      sentCount,
      failedCount,
      results
    };
  },

  /**
   * Due & Expiring Documents Tracking Query
   * Filters: 'All' | 'Overdue' | 'Due in 7 Days' | 'Due in 30 Days' | 'Expired' | 'Expiring in 30 Days'
   */
  getDueAndExpiringDocuments: async ({ filter = 'All', search = '' } = {}) => {
    const docsRes = await caDocumentsService.getDocuments({ limit: 500 });
    const allDocs = docsRes.data || [];

    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);

    const mapped = allDocs
      .filter((doc) => doc.dueDate || doc.expiryDate)
      .map((doc) => {
        let dueDaysRemaining = null;
        let isDueOverdue = false;
        let expiryDaysRemaining = null;
        let isExpired = false;

        if (doc.dueDate) {
          const dDate = new Date(doc.dueDate);
          const diffMs = dDate.getTime() - today.getTime();
          dueDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          isDueOverdue = dueDaysRemaining < 0 && doc.statusCode !== 'completed';
        }

        if (doc.expiryDate) {
          const eDate = new Date(doc.expiryDate);
          const diffMs = eDate.getTime() - today.getTime();
          expiryDaysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          isExpired = expiryDaysRemaining < 0;
        }

        return {
          ...doc,
          dueDaysRemaining,
          isDueOverdue,
          expiryDaysRemaining,
          isExpired
        };
      });

    let filtered = mapped;

    if (filter === 'Overdue') {
      filtered = mapped.filter((d) => d.isDueOverdue);
    } else if (filter === 'Due in 7 Days') {
      filtered = mapped.filter((d) => d.dueDaysRemaining !== null && d.dueDaysRemaining >= 0 && d.dueDaysRemaining <= 7);
    } else if (filter === 'Due in 30 Days') {
      filtered = mapped.filter((d) => d.dueDaysRemaining !== null && d.dueDaysRemaining >= 0 && d.dueDaysRemaining <= 30);
    } else if (filter === 'Expired') {
      filtered = mapped.filter((d) => d.isExpired);
    } else if (filter === 'Expiring in 30 Days') {
      filtered = mapped.filter((d) => d.expiryDaysRemaining !== null && d.expiryDaysRemaining >= 0 && d.expiryDaysRemaining <= 30);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.client.toLowerCase().includes(q) ||
          d.ref.toLowerCase().includes(q)
      );
    }

    return filtered;
  }
};

export default caBulkImportService;
