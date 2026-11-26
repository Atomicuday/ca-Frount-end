/**
 * ZapDocs CA Portal – State Stamp Duty Statutory Catalogue & Reference Mock Data
 *
 * Sourced from gazetted Indian State Stamp Acts and Indian Stamp Act, 1899.
 * Provides statutory articles, calculation basis, minimum/maximum duty caps,
 * and stamping channel availability.
 *
 * IMPORTANT:
 * - This catalogue provides reference schedules for Chartered Accountants.
 * - Unsupported or unverified combinations return 'unverified' status rather than ₹0.
 * - Government duty is strictly separated from provider/platform fees.
 */

export const SUPPORTED_INDIAN_STATES = [
  { code: 'MH', name: 'Maharashtra', act: 'Maharashtra Stamp Act, 1958', authority: 'Inspector General of Registration & Stamps (IGR Maharashtra)' },
  { code: 'KA', name: 'Karnataka', act: 'Karnataka Stamp Act, 1957', authority: 'Department of Stamps & Registration, Govt of Karnataka' },
  { code: 'DL', name: 'Delhi (NCT)', act: 'Indian Stamp Act, 1899 (Delhi Schedule 1A)', authority: 'Revenue Department, Govt of NCT of Delhi' },
  { code: 'GJ', name: 'Gujarat', act: 'Gujarat Stamp Act, 1958', authority: 'Superintendent of Stamps, Govt of Gujarat' },
  { code: 'TN', name: 'Tamil Nadu', act: 'Indian Stamp Act, 1899 (Tamil Nadu Amendments)', authority: 'Registration Department, Govt of Tamil Nadu' },
  { code: 'UP', name: 'Uttar Pradesh', act: 'Indian Stamp Act, 1899 (UP Schedule 1B)', authority: 'Stamp & Registration Department, Govt of Uttar Pradesh' },
  { code: 'TS', name: 'Telangana', act: 'Indian Stamp Act, 1899 (Telangana Amendments)', authority: 'Registration & Stamps Department, Govt of Telangana' },
  { code: 'WB', name: 'West Bengal', act: 'Indian Stamp Act, 1899 (West Bengal Amendments)', authority: 'Directorate of Registration & Stamp Revenue, Govt of WB' },
  { code: 'RJ', name: 'Rajasthan', act: 'Rajasthan Stamp Act, 1998', authority: 'Registration & Stamps Department, Govt of Rajasthan' },
  { code: 'HR', name: 'Haryana', act: 'Indian Stamp Act, 1899 (Haryana Amendments)', authority: 'Department of Revenue & Disaster Management, Haryana' }
];

export const SUPPORTED_DOCUMENT_TYPES = [
  { id: 'partnership-deed', name: 'Partnership Deed (Formation / Reconstitution)', category: 'Commercial & Association' },
  { id: 'llp-agreement', name: 'LLP Agreement & Incorporation Charter', category: 'Corporate & LLP' },
  { id: 'shareholders-resolution', name: 'Shareholder Resolution & MGT-14 Agreement', category: 'Corporate Governance' },
  { id: 'power-of-attorney', name: 'Power of Attorney (General / Specific)', category: 'Authorisation & Representation' },
  { id: 'commercial-lease', name: 'Commercial Lease / Tenancy Agreement', category: 'Property & Leasing' },
  { id: 'indemnity-bond', name: 'Indemnity Bond', category: 'Bonds & Undertakings' },
  { id: 'affidavit', name: 'Affidavit & Statutory Declaration', category: 'Affidavits & Sworn Declarations' },
  { id: 'share-purchase-agreement', name: 'Share Purchase / Transfer Agreement', category: 'Securities & Investments' },
  { id: 'service-agreement', name: 'Commercial Service & Retainer Contract', category: 'Commercial Contracts' },
  { id: 'loan-hypothecation', name: 'Loan Agreement & Hypothecation Deed', category: 'Banking & Financing' },
  { id: 'board-resolution-extract', name: 'Board Resolution Extract & Attestation', category: 'Corporate Governance' }
];

/**
 * Statutory schedule registry mapping [stateCode:docTypeId]
 */
export const STAMP_DUTY_REGISTRY = {
  // MAHARASHTRA
  'MH:partnership-deed': {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    documentTypeId: 'partnership-deed',
    documentTypeName: 'Partnership Deed',
    articleReference: 'Article 47, Schedule I, Maharashtra Stamp Act, 1958',
    calculationBasis: 'percentage',
    percentageRate: 0.5,
    minDuty: 500,
    maxDuty: 10000,
    fixedAmount: null,
    formulaDescription: '0.5% of capital contribution (Min ₹500, Max ₹10,000)',
    requiresInputs: true,
    inputField: {
      id: 'capitalContribution',
      label: 'Total Capital Contribution (₹)',
      placeholder: 'e.g. 500000',
      min: 0,
      defaultValue: 500000
    },
    effectiveDate: '01 Apr 2024',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Inspector General of Registration & Stamps, Maharashtra',
    officialSourceUrl: 'https://igrmaharashtra.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital / Electronic)',
      provider: 'Stock Holding Corporation of India Ltd (SHCIL) & GRAS Treasury',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Where no capital contribution is brought in, minimum duty of ₹500 applies. Registration fee of 1% or statutory ceiling applies upon sub-registrar filing.'
  },
  'MH:llp-agreement': {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    documentTypeId: 'llp-agreement',
    documentTypeName: 'LLP Agreement',
    articleReference: 'Article 47, Schedule I, Maharashtra Stamp Act, 1958 (as amended)',
    calculationBasis: 'percentage',
    percentageRate: 0.5,
    minDuty: 500,
    maxDuty: 10000,
    fixedAmount: null,
    formulaDescription: '0.5% of partner contribution (Min ₹500, Max ₹10,000)',
    requiresInputs: true,
    inputField: {
      id: 'capitalContribution',
      label: 'Total LLP Capital Contribution (₹)',
      placeholder: 'e.g. 100000',
      min: 0,
      defaultValue: 100000
    },
    effectiveDate: '01 Apr 2024',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Maharashtra Stamp Office Gazette notification',
    officialSourceUrl: 'https://igrmaharashtra.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital)',
      provider: 'SHCIL & Government Receipt Accounting System (GRAS)',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Supplementary LLP agreements recording partner admission or retirement without capital increment carry ₹500 flat stamp duty.'
  },
  'MH:shareholders-resolution': {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    documentTypeId: 'shareholders-resolution',
    documentTypeName: 'Shareholder Resolution & MGT-14 Agreement',
    articleReference: 'Article 5(h)(ii), Maharashtra Stamp Act, 1958',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 500,
    maxDuty: 500,
    fixedAmount: 500,
    formulaDescription: 'Flat ₹500 per agreement or execution copy',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Apr 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Department of Stamps & Registration, Maharashtra',
    officialSourceUrl: 'https://igrmaharashtra.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital)',
      provider: 'SHCIL & GRAS',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'If accompanied by an indemnity or voting trust, separate article duty applies for each distinct covenant.'
  },
  'MH:power-of-attorney': {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    documentTypeId: 'power-of-attorney',
    documentTypeName: 'Power of Attorney (General / Specific)',
    articleReference: 'Article 48, Schedule I, Maharashtra Stamp Act, 1958',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 500,
    maxDuty: 500,
    fixedAmount: 500,
    formulaDescription: 'Flat ₹500 for general commercial / statutory representation',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Jan 2024',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'IGR Maharashtra Portal',
    officialSourceUrl: 'https://igrmaharashtra.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'POA granted with consideration or authorising sale of immovable property attracts conveyance duty under Article 25.'
  },
  'MH:commercial-lease': {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    documentTypeId: 'commercial-lease',
    documentTypeName: 'Commercial Lease / Tenancy Agreement',
    articleReference: 'Article 36A, Schedule I, Maharashtra Stamp Act, 1958',
    calculationBasis: 'percentage',
    percentageRate: 0.25,
    minDuty: 100,
    maxDuty: null,
    fixedAmount: null,
    formulaDescription: '0.25% of total rent payable during the tenure + non-refundable deposit',
    requiresInputs: true,
    inputField: {
      id: 'totalRentAndDeposit',
      label: 'Total Rent Payable over Tenure + Non-Refundable Deposit (₹)',
      placeholder: 'e.g. 1200000',
      min: 0,
      defaultValue: 1200000
    },
    effectiveDate: '01 Jun 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'IGR Maharashtra Leave and License Gazette',
    officialSourceUrl: 'https://igrmaharashtra.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital) + E-Filing',
      provider: 'Department of Stamps, Maharashtra',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Mandatory registration with biometric verification required under Section 55 of the Maharashtra Rent Control Act, 1999.'
  },
  'MH:indemnity-bond': {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    documentTypeId: 'indemnity-bond',
    documentTypeName: 'Indemnity Bond',
    articleReference: 'Article 35, Schedule I, Maharashtra Stamp Act, 1958',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 500,
    maxDuty: 500,
    fixedAmount: 500,
    formulaDescription: 'Flat ₹500 for general commercial indemnity',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Apr 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Maharashtra Stamp Office',
    officialSourceUrl: 'https://igrmaharashtra.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Securing an unspecified contingent indemnity.'
  },
  'MH:affidavit': {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    documentTypeId: 'affidavit',
    documentTypeName: 'Affidavit & Statutory Declaration',
    articleReference: 'Article 4, Schedule I, Maharashtra Stamp Act, 1958',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 100,
    maxDuty: 100,
    fixedAmount: 100,
    formulaDescription: 'Flat ₹100 per affidavit / declaration',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Apr 2022',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'IGR Maharashtra',
    officialSourceUrl: 'https://igrmaharashtra.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Affidavits filed for immediate court proceedings are exempt under specific high court notification.'
  },

  // KARNATAKA
  'KA:partnership-deed': {
    stateCode: 'KA',
    stateName: 'Karnataka',
    documentTypeId: 'partnership-deed',
    documentTypeName: 'Partnership Deed',
    articleReference: 'Article 40(a), Schedule, Karnataka Stamp Act, 1957',
    calculationBasis: 'slab',
    percentageRate: null,
    minDuty: 1000,
    maxDuty: 5000,
    fixedAmount: null,
    formulaDescription: 'Slab-based: Capital up to ₹50,000 = ₹1,000; Exceeding ₹50,000 = ₹5,000',
    requiresInputs: true,
    inputField: {
      id: 'capitalContribution',
      label: 'Capital Contribution (₹)',
      placeholder: 'e.g. 500000',
      min: 0,
      defaultValue: 500000
    },
    effectiveDate: '01 Apr 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Kaveri Online Services, Department of Stamps & Registration, Karnataka',
    officialSourceUrl: 'https://kaverionline.karnataka.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital via SHCIL)',
      provider: 'Stock Holding Corporation of India Ltd (SHCIL)',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Reconstitution of partnership where immovable property is contributed attracts Article 40(c) conveyance rates.'
  },
  'KA:llp-agreement': {
    stateCode: 'KA',
    stateName: 'Karnataka',
    documentTypeId: 'llp-agreement',
    documentTypeName: 'LLP Agreement',
    articleReference: 'Article 40(a) r/w Karnataka Stamp Amendment Act',
    calculationBasis: 'slab',
    percentageRate: null,
    minDuty: 1000,
    maxDuty: 5000,
    fixedAmount: null,
    formulaDescription: 'Slab-based: Capital up to ₹50,000 = ₹1,000; Exceeding ₹50,000 = ₹5,000',
    requiresInputs: true,
    inputField: {
      id: 'capitalContribution',
      label: 'LLP Contribution (₹)',
      placeholder: 'e.g. 100000',
      min: 0,
      defaultValue: 100000
    },
    effectiveDate: '01 Apr 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Kaveri Online Services, Karnataka',
    officialSourceUrl: 'https://kaverionline.karnataka.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital via SHCIL)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Applicable for initial incorporation agreement filed in MCA Form 3.'
  },
  'KA:shareholders-resolution': {
    stateCode: 'KA',
    stateName: 'Karnataka',
    documentTypeId: 'shareholders-resolution',
    documentTypeName: 'Shareholder Resolution & MGT-14 Agreement',
    articleReference: 'Article 5(j), Karnataka Stamp Act, 1957',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 500,
    maxDuty: 500,
    fixedAmount: 500,
    formulaDescription: 'Flat ₹500 per agreement or resolution instrument',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Apr 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Department of Stamps & Registration, Karnataka',
    officialSourceUrl: 'https://kaverionline.karnataka.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital via SHCIL)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'General agreement category covering corporate governance accords not otherwise provided for.'
  },
  'KA:indemnity-bond': {
    stateCode: 'KA',
    stateName: 'Karnataka',
    documentTypeId: 'indemnity-bond',
    documentTypeName: 'Indemnity Bond',
    articleReference: 'Article 29, Karnataka Stamp Act, 1957',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 200,
    maxDuty: 200,
    fixedAmount: 200,
    formulaDescription: 'Flat ₹200 for indemnity undertakings',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Apr 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Department of Stamps & Registration, Karnataka',
    officialSourceUrl: 'https://kaverionline.karnataka.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital via SHCIL)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Indemnity in favor of government bodies or municipal corporations.'
  },
  'KA:affidavit': {
    stateCode: 'KA',
    stateName: 'Karnataka',
    documentTypeId: 'affidavit',
    documentTypeName: 'Affidavit & Statutory Declaration',
    articleReference: 'Article 4, Karnataka Stamp Act, 1957',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 20,
    maxDuty: 20,
    fixedAmount: 20,
    formulaDescription: 'Flat ₹20 per affidavit',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Apr 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Kaveri Portal, Govt of Karnataka',
    officialSourceUrl: 'https://kaverionline.karnataka.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital via SHCIL)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Commonly executed on minimum denomination ₹20 or ₹50 eStamp certificate.'
  },

  // DELHI
  'DL:partnership-deed': {
    stateCode: 'DL',
    stateName: 'Delhi (NCT)',
    documentTypeId: 'partnership-deed',
    documentTypeName: 'Partnership Deed',
    articleReference: 'Article 46, Schedule 1A, Indian Stamp Act, 1899 (Delhi)',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 200,
    maxDuty: 200,
    fixedAmount: 200,
    formulaDescription: 'Flat ₹200 for partnership constitution',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Jan 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Revenue Department, Govt of NCT of Delhi',
    officialSourceUrl: 'https://revenue.delhi.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital via SHCIL)',
      provider: 'Stock Holding Corporation of India Ltd (SHCIL)',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Dissolution of partnership deed carries ₹50 in Delhi.'
  },
  'DL:llp-agreement': {
    stateCode: 'DL',
    stateName: 'Delhi (NCT)',
    documentTypeId: 'llp-agreement',
    documentTypeName: 'LLP Agreement',
    articleReference: 'Article 46 r/w Article 5, Schedule 1A, Indian Stamp Act (Delhi)',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 200,
    maxDuty: 200,
    fixedAmount: 200,
    formulaDescription: 'Flat ₹200 for initial LLP agreement',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Jan 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Revenue Department, Govt of NCT of Delhi',
    officialSourceUrl: 'https://revenue.delhi.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital via SHCIL)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Filed in MCA Form 3 with corporate registrar.'
  },
  'DL:affidavit': {
    stateCode: 'DL',
    stateName: 'Delhi (NCT)',
    documentTypeId: 'affidavit',
    documentTypeName: 'Affidavit & Statutory Declaration',
    articleReference: 'Article 4, Schedule 1A, Indian Stamp Act (Delhi)',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 10,
    maxDuty: 10,
    fixedAmount: 10,
    formulaDescription: 'Flat ₹10 statutory duty',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Jan 2022',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Revenue Department, Delhi',
    officialSourceUrl: 'https://revenue.delhi.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital via SHCIL)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Minimum electronic certificate issued by SHCIL centers is typically ₹10 or ₹50.'
  },
  'DL:indemnity-bond': {
    stateCode: 'DL',
    stateName: 'Delhi (NCT)',
    documentTypeId: 'indemnity-bond',
    documentTypeName: 'Indemnity Bond',
    articleReference: 'Article 34, Schedule 1A, Indian Stamp Act (Delhi)',
    calculationBasis: 'fixed',
    percentageRate: null,
    minDuty: 100,
    maxDuty: 100,
    fixedAmount: 100,
    formulaDescription: 'Flat ₹100 per indemnity bond',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Jan 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Revenue Department, Delhi',
    officialSourceUrl: 'https://revenue.delhi.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital via SHCIL)',
      provider: 'SHCIL',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Used extensively for tax refund guarantees and bank account indemnities.'
  },

  // GUJARAT
  'GJ:partnership-deed': {
    stateCode: 'GJ',
    stateName: 'Gujarat',
    documentTypeId: 'partnership-deed',
    documentTypeName: 'Partnership Deed',
    articleReference: 'Article 44, Schedule I, Gujarat Stamp Act, 1958',
    calculationBasis: 'percentage',
    percentageRate: 1.0,
    minDuty: 1000,
    maxDuty: 10000,
    fixedAmount: null,
    formulaDescription: '1.0% of capital contribution (Min ₹1,000, Max ₹10,000)',
    requiresInputs: true,
    inputField: {
      id: 'capitalContribution',
      label: 'Capital Contribution (₹)',
      placeholder: 'e.g. 500000',
      min: 0,
      defaultValue: 500000
    },
    effectiveDate: '01 Apr 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Superintendent of Stamps, Govt of Gujarat',
    officialSourceUrl: 'https://garvi.gujarat.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital)',
      provider: 'Stock Holding Corporation of India Ltd (SHCIL)',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Gujarat requires mandatory eStamping for all instruments above ₹100.'
  },

  // TAMIL NADU
  'TN:partnership-deed': {
    stateCode: 'TN',
    stateName: 'Tamil Nadu',
    documentTypeId: 'partnership-deed',
    documentTypeName: 'Partnership Deed',
    articleReference: 'Article 46, Indian Stamp Act (Tamil Nadu Amendments)',
    calculationBasis: 'percentage',
    percentageRate: 1.0,
    minDuty: 300,
    maxDuty: 25000,
    fixedAmount: null,
    formulaDescription: '1.0% of capital contribution (Min ₹300, Max ₹25,000)',
    requiresInputs: true,
    inputField: {
      id: 'capitalContribution',
      label: 'Capital Contribution (₹)',
      placeholder: 'e.g. 500000',
      min: 0,
      defaultValue: 500000
    },
    effectiveDate: '01 Jul 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Registration Department (TNREGINET), Govt of Tamil Nadu',
    officialSourceUrl: 'https://tnreginet.gov.in',
    providerAvailability: {
      channel: 'eStamp Certificate (Digital)',
      provider: 'SHCIL & TNREGINET Portal',
      status: 'Available via ZapDocs Platform',
      isDigitalAvailable: true
    },
    notes: 'Registration fee of 1% is payable separately under the Registration Act.'
  },

  // CONFIRMED STATUTORY EXEMPTIONS (Not Applicable)
  'MH:board-resolution-extract': {
    stateCode: 'MH',
    stateName: 'Maharashtra',
    documentTypeId: 'board-resolution-extract',
    documentTypeName: 'Board Resolution Extract & Attestation',
    articleReference: 'General Schedule Exemption, Maharashtra Stamp Act, 1958',
    calculationBasis: 'not_applicable',
    percentageRate: null,
    minDuty: null,
    maxDuty: null,
    fixedAmount: null,
    formulaDescription: 'Not applicable (Statutory Exemption: Internal corporate extract without conveyance or transfer of rights)',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Apr 2024',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Inspector General of Registration & Stamps, Maharashtra',
    officialSourceUrl: 'https://igrmaharashtra.gov.in',
    providerAvailability: {
      channel: 'Not Chargeable / Statutory Exemption',
      provider: 'None',
      status: 'Statutory Exemption',
      isDigitalAvailable: false
    },
    notes: 'Certified copies or internal extracts of board minutes/resolutions without standalone conveyance or security creation are non-chargeable under the state stamp schedule.'
  },
  'KA:board-resolution-extract': {
    stateCode: 'KA',
    stateName: 'Karnataka',
    documentTypeId: 'board-resolution-extract',
    documentTypeName: 'Board Resolution Extract & Attestation',
    articleReference: 'Statutory Exemption, Schedule, Karnataka Stamp Act, 1957',
    calculationBasis: 'not_applicable',
    percentageRate: null,
    minDuty: null,
    maxDuty: null,
    fixedAmount: null,
    formulaDescription: 'Not applicable (Non-chargeable corporate record extract)',
    requiresInputs: false,
    inputField: null,
    effectiveDate: '01 Apr 2023',
    lastVerifiedDate: '15 Nov 2026',
    officialSource: 'Department of Stamps & Registration, Karnataka',
    officialSourceUrl: 'https://kaverionline.karnataka.gov.in',
    providerAvailability: {
      channel: 'Not Chargeable / Statutory Exemption',
      provider: 'None',
      status: 'Statutory Exemption',
      isDigitalAvailable: false
    },
    notes: 'Internal board resolution extracts certified by Company Secretary or Director do not constitute dutiable instruments under the Act.'
  }
};
