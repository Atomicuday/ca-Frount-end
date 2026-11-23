/**
 * CA Document Template Catalog & Schema Definitions
 * Provides published templates, category mappings, and dynamic field schemas.
 */

export const PUBLISHED_CA_TEMPLATES = [
  {
    id: 'tpl-stat-audit-3cd',
    name: 'Statutory Audit Report & Tax Audit Form 3CD',
    category: 'Statutory Audit',
    code: 'AUD',
    status: 'published',
    description: 'Comprehensive audit computation under Section 44AB and Companies Act Schedule II.',
    requiresEmail: true,
    allowedClientTypes: ['Company', 'LLP', 'Partnership'],
    fields: [
      {
        id: 'assessmentYear',
        label: 'Assessment Year',
        type: 'text',
        placeholder: 'e.g. AY 2026-27',
        defaultValue: 'AY 2026-27',
        required: true,
        helpText: 'Applicable statutory income tax assessment period'
      },
      {
        id: 'turnover',
        label: 'Annual Turnover / Gross Receipts',
        type: 'text',
        placeholder: 'e.g. ₹42.50 Cr',
        required: true,
        helpText: 'Subject turnover for 44AB threshold evaluation'
      },
      {
        id: 'pan',
        label: 'Entity PAN',
        type: 'text',
        placeholder: 'e.g. AAACA1234A',
        required: true,
        helpText: 'Permanent Account Number registered with Income Tax Dept'
      }
    ]
  },
  {
    id: 'tpl-gstr-9',
    name: 'GSTR-9 Annual Return Computation Sheet',
    category: 'GST Returns',
    code: 'GST',
    status: 'published',
    description: 'Annual return reconciliation under Section 44 with GSTR-2B & 3B verification.',
    requiresEmail: false,
    allowedClientTypes: ['Company', 'LLP', 'Partnership', 'Individual'],
    fields: [
      {
        id: 'financialYear',
        label: 'GST Financial Year',
        type: 'text',
        placeholder: 'e.g. FY 2025-26',
        defaultValue: 'FY 2025-26',
        required: true,
        helpText: 'Annual filing period under CGST Act'
      },
      {
        id: 'gstin',
        label: 'GSTIN',
        type: 'text',
        placeholder: 'e.g. 29AAACA1234A1Z5',
        required: true,
        helpText: '15-digit Goods and Services Tax Identification Number'
      },
      {
        id: 'aggregateTurnover',
        label: 'Audited Annual Turnover',
        type: 'text',
        placeholder: 'e.g. ₹8.75 Cr',
        required: true,
        helpText: 'Aggregate state turnover reconciled with financial statements'
      }
    ]
  },
  {
    id: 'tpl-itr-3',
    name: 'ITR-3 Business & Professional Income Pack',
    category: 'Income Tax',
    code: 'ITR',
    status: 'published',
    description: 'Comprehensive tax computation sheet, depreciation schedule, and Form 16 reconciliation.',
    requiresEmail: false,
    allowedClientTypes: ['Individual', 'Partnership', 'LLP'],
    fields: [
      {
        id: 'assessmentYear',
        label: 'Assessment Year',
        type: 'text',
        placeholder: 'e.g. AY 2026-27',
        defaultValue: 'AY 2026-27',
        required: true,
        helpText: 'Filing assessment year'
      },
      {
        id: 'pan',
        label: 'Client PAN',
        type: 'text',
        placeholder: 'e.g. ABCDS9012K',
        required: true,
        helpText: 'Assessee Permanent Account Number'
      },
      {
        id: 'businessNature',
        label: 'Nature of Profession / Business',
        type: 'text',
        placeholder: 'e.g. Medical Services / Legal / Architecture',
        required: true,
        helpText: 'Principal business activity code classification'
      }
    ]
  },
  {
    id: 'tpl-roc-mgt-14',
    name: 'ROC Form MGT-14 & Board Resolutions Pack',
    category: 'ROC Compliance',
    code: 'ROC',
    status: 'published',
    description: 'Filing of special resolutions and corporate agreements with Registrar of Companies.',
    requiresEmail: true,
    allowedClientTypes: ['Company'],
    fields: [
      {
        id: 'cin',
        label: 'Corporate Identification Number (CIN)',
        type: 'text',
        placeholder: 'e.g. U72200KA2020PTC123456',
        required: true,
        helpText: '21-digit alphanumeric MCA registration code'
      },
      {
        id: 'resolutionType',
        label: 'Resolution Subject Matter',
        type: 'text',
        placeholder: 'e.g. Section 180(1)(c) Borrowing Limits',
        required: true,
        helpText: 'Statutory section under Companies Act 2013'
      },
      {
        id: 'meetingDate',
        label: 'Board / EGM Meeting Date',
        type: 'date',
        required: true,
        helpText: 'Date resolution was adopted by shareholders'
      }
    ]
  },
  {
    id: 'tpl-llp-agreement',
    name: 'LLP Supplementary Reconstitution Charter',
    category: 'Deed / Agreement',
    code: 'AGR',
    status: 'published',
    description: 'Partner admission, retirement, and profit-sharing amendment charter.',
    requiresEmail: false,
    allowedClientTypes: ['LLP'],
    fields: [
      {
        id: 'llpin',
        label: 'LLPIN',
        type: 'text',
        placeholder: 'e.g. AAA-1234',
        required: true,
        helpText: 'LLP registration number assigned by MCA'
      },
      {
        id: 'effectiveDate',
        label: 'Effective Reconstitution Date',
        type: 'date',
        required: true,
        helpText: 'Date partner amendments come into effect'
      },
      {
        id: 'capitalContribution',
        label: 'Total Partner Capital Contribution',
        type: 'text',
        placeholder: 'e.g. ₹50,00,000',
        required: true,
        helpText: 'Monetary capital contribution of partners'
      }
    ]
  },
  {
    id: 'tpl-form-15cb',
    name: 'Form 15CA/CB Foreign Remittance Certificate',
    category: 'Certificates & Attestations',
    code: 'CERT',
    status: 'published',
    description: 'Chartered Accountant certificate for overseas payments under Section 195.',
    requiresEmail: true,
    allowedClientTypes: ['Company', 'LLP', 'Individual'],
    fields: [
      {
        id: 'pan',
        label: 'Remitter PAN',
        type: 'text',
        placeholder: 'e.g. AAACG4455P',
        required: true,
        helpText: 'PAN of party remitting funds abroad'
      },
      {
        id: 'remittanceAmount',
        label: 'Remittance Amount & Currency',
        type: 'text',
        placeholder: 'e.g. $45,000 USD / €30,000 EUR',
        required: true,
        helpText: 'Foreign currency transaction value'
      },
      {
        id: 'countryOfRemittance',
        label: 'Country of Remittance',
        type: 'text',
        placeholder: 'e.g. United States / Germany / Singapore',
        required: true,
        helpText: 'Beneficiary destination jurisdiction'
      }
    ]
  }
];

export const CLIENT_TYPES = [
  { value: 'Company', label: 'Company (Private / Public Limited)' },
  { value: 'LLP', label: 'Limited Liability Partnership (LLP)' },
  { value: 'Partnership', label: 'Partnership Firm' },
  { value: 'Individual', label: 'Individual / Sole Proprietor' }
];
