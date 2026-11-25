/**
 * Mock Data Fixtures for Dashboard Summary Cards Details Dialogs
 * Strictly reconciles with summary card counts:
 * - Total Clients: 48
 * - Pending Documents: 47 (14 Draft + 8 Info + 6 CA Review + 9 Party Review + 6 Payment + 4 Executing)
 * - Completed Documents: 184
 */

// 1. Exactly 48 Clients for Total Clients dialog
export const MOCK_SUMMARY_CLIENTS = [
  {
    id: 'CLI-101',
    name: 'Acme Technologies Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Arun Kumar',
    phone: '+91 98860 11223',
    email: 'arun@acmetech.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-102',
    name: 'Zenith Retail LLP',
    entityType: 'LLP',
    contactPerson: 'Pooja Reddy',
    phone: '+91 98451 99887',
    email: 'pooja@zenithretail.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-103',
    name: 'Dr. Vikram Sethi',
    entityType: 'Individual',
    contactPerson: 'Dr. Vikram Sethi',
    phone: '+91 94480 33445',
    email: 'dr.sethi@clinic.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-104',
    name: 'Apex Logistics India Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Ramesh Nair',
    phone: '+91 98200 44556',
    email: 'ramesh@apexlogistics.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-105',
    name: 'Horizon Enterprises',
    entityType: 'Partnership',
    contactPerson: 'Suresh Patel',
    phone: '+91 98220 77889',
    email: 'suresh@horizonenterprises.com',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-106',
    name: 'BlueStar Freight LLP',
    entityType: 'LLP',
    contactPerson: 'Kavita Menon',
    phone: '+91 97410 88990',
    email: 'kavita@bluestarfreight.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-107',
    name: 'GreenLeaf Organics Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Priya Sharma',
    phone: '+91 98210 12345',
    email: 'priya@greenleaf.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-108',
    name: 'Sudarshan Castings Ltd',
    entityType: 'Company',
    contactPerson: 'Rajesh Gupta',
    phone: '+91 98110 23456',
    email: 'rajesh@sudarshancastings.com',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-109',
    name: 'Kaveri Renewable Energy Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Anand Kulkarni',
    phone: '+91 98440 34567',
    email: 'anand@kaverienergy.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-110',
    name: 'Aura Healthcare LLP',
    entityType: 'LLP',
    contactPerson: 'Dr. Sunita Deshmukh',
    phone: '+91 98230 45678',
    email: 'sunita@aurahealth.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-111',
    name: 'Shri Ram Textiles Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Mohanlal Agarwal',
    phone: '+91 98790 56789',
    email: 'mohan@shriramtextiles.com',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-112',
    name: 'Pragati Microfinance Ltd',
    entityType: 'Company',
    contactPerson: 'Sneha Joshi',
    phone: '+91 98201 67890',
    email: 'sneha@pragatimicro.in',
    isContactAuthorised: false, // Demonstrates contact authorization restriction
    authStatusLabel: 'Restricted'
  },
  {
    id: 'CLI-113',
    name: 'Sunbeam Education Trust',
    entityType: 'Trust',
    contactPerson: 'Prof. Harish Rao',
    phone: '+91 94490 78901',
    email: 'contact@sunbeamtrust.org',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-114',
    name: 'Nexus Media Works LLP',
    entityType: 'LLP',
    contactPerson: 'Rohan Verma',
    phone: '+91 98100 89012',
    email: 'rohan@nexusmedia.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-115',
    name: 'Vantage Capital Advisors',
    entityType: 'Partnership',
    contactPerson: 'Sameer Mehta',
    phone: '+91 98212 90123',
    email: 'sameer@vantagecap.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-116',
    name: 'Kalyani Agro Products Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Balasaheb Patil',
    phone: '+91 98500 01234',
    email: 'info@kalyaniagro.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-117',
    name: 'Sterling Finlease Ltd',
    entityType: 'Company',
    contactPerson: 'Deepak Chawla',
    phone: '+91 98105 12340',
    email: 'deepak@sterlingfinlease.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-118',
    name: 'Metropolis Diagnostic Centre',
    entityType: 'Partnership',
    contactPerson: 'Dr. Alok Banerjee',
    phone: '+91 98300 23451',
    email: 'alok@metropoliscare.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-119',
    name: 'Falcon Infotech Solutions LLP',
    entityType: 'LLP',
    contactPerson: 'Gautam Singhania',
    phone: '+91 98455 34562',
    email: 'gautam@falconinfo.com',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-120',
    name: 'Omkar Real Estate Developers',
    entityType: 'Partnership',
    contactPerson: 'Kishore Jhaveri',
    phone: '+91 98205 45673',
    email: 'kishore@omkarbuild.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-121',
    name: 'Riddhi Siddhi Gold & Diamonds',
    entityType: 'Company',
    contactPerson: 'Babulal Jain',
    phone: '+91 98290 56784',
    email: 'babulal@rsjewels.com',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-122',
    name: 'Shankar Mahadevan & Associates',
    entityType: 'Partnership',
    contactPerson: 'Shankar Mahadevan',
    phone: '+91 94440 67895',
    email: 'shankar@sma-advisors.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-123',
    name: 'CloudNine Beverages India LLP',
    entityType: 'LLP',
    contactPerson: 'Nikhil Mathur',
    phone: '+91 98118 78906',
    email: 'nikhil@cloudninebev.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-124',
    name: 'Universal Marine Services Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Capt. R. K. Pillai',
    phone: '+91 98209 89017',
    email: 'rkpillai@universalmarine.co.in',
    isContactAuthorised: false, // Demonstrates contact authorization restriction
    authStatusLabel: 'Restricted'
  },
  {
    id: 'CLI-125',
    name: 'Navratna Engineering Works',
    entityType: 'Partnership',
    contactPerson: 'Venkatesh Iyer',
    phone: '+91 98402 90128',
    email: 'venkat@navratnaengg.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-126',
    name: 'Pioneer Cold Storage & Logistics',
    entityType: 'Company',
    contactPerson: 'Harcharan Singh',
    phone: '+91 98140 01239',
    email: 'harcharan@pioneercold.com',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-127',
    name: 'Aishwarya Silks & Sarees',
    entityType: 'Individual',
    contactPerson: 'Aishwarya Sundaram',
    phone: '+91 94431 12340',
    email: 'aishwarya@sundaramsilks.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-128',
    name: 'Prime Diagnostic Laboratories',
    entityType: 'LLP',
    contactPerson: 'Dr. Meera Nambiar',
    phone: '+91 97412 23451',
    email: 'meera@primelab.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-129',
    name: 'Trident Solar Tech India Ltd',
    entityType: 'Company',
    contactPerson: 'Manish Bhatnagar',
    phone: '+91 98102 34562',
    email: 'manish@tridentsolar.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-130',
    name: 'Bhartiya Gramin Vikas Sanstha',
    entityType: 'Trust',
    contactPerson: 'Devendra Pandey',
    phone: '+91 94150 45673',
    email: 'devendra@bgvs-india.org',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-131',
    name: 'Crestone Hospitality Services LLP',
    entityType: 'LLP',
    contactPerson: 'Vikramaditya Roy',
    phone: '+91 98310 56784',
    email: 'vikram@crestonehotels.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-132',
    name: 'Galaxy Automotive Components Ltd',
    entityType: 'Company',
    contactPerson: 'Inderjeet Chadha',
    phone: '+91 98180 67895',
    email: 'inderjeet@galaxyauto.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-133',
    name: 'Sri Krishna Dairy & Poultry Farms',
    entityType: 'Partnership',
    contactPerson: 'K. R. Gopal',
    phone: '+91 98490 78906',
    email: 'krgopal@krishnadairy.com',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-134',
    name: 'Quantum Data Science Systems Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Abhinav Saxena',
    phone: '+91 98801 89017',
    email: 'abhinav@quantumds.ai',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-135',
    name: 'Saraswati Offset Printers',
    entityType: 'Individual',
    contactPerson: 'Saraswati Prasad',
    phone: '+91 94500 90128',
    email: 'saraswati@saraswatiprint.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-136',
    name: 'Everest Rubber & Polymers LLP',
    entityType: 'LLP',
    contactPerson: 'Jitendra Shah',
    phone: '+91 98250 01239',
    email: 'jitendra@everestrubber.com',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-137',
    name: 'Matrix Cloud Infrastructure Ltd',
    entityType: 'Company',
    contactPerson: 'Siddharth Sen',
    phone: '+91 98114 12340',
    email: 'siddharth@matrixcloud.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-138',
    name: 'Heritage Spices & Condiments',
    entityType: 'Partnership',
    contactPerson: 'Manoj Varma',
    phone: '+91 94470 23451',
    email: 'manoj@heritagespices.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-139',
    name: 'Mahaveer Jain Educational Trust',
    entityType: 'Trust',
    contactPerson: 'Shantilal Lodha',
    phone: '+91 98292 34562',
    email: 'shantilal@mjetrust.org',
    isContactAuthorised: false, // Demonstrates contact authorization restriction
    authStatusLabel: 'Restricted'
  },
  {
    id: 'CLI-140',
    name: 'Precision Metal Stamping Ltd',
    entityType: 'Company',
    contactPerson: 'Gurmeet Gill',
    phone: '+91 98145 45673',
    email: 'gurmeet@precisionstamping.co.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-141',
    name: 'Vedic Wellness Retreats LLP',
    entityType: 'LLP',
    contactPerson: 'Radhika Kashyap',
    phone: '+91 98203 56784',
    email: 'radhika@vedicwellness.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-142',
    name: 'Narmada Packaging Containers Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Dharmesh Trivedi',
    phone: '+91 98240 67895',
    email: 'dharmesh@narmadapack.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-143',
    name: 'Dr. Anandita Sen Family Trust',
    entityType: 'Trust',
    contactPerson: 'Dr. Anandita Sen',
    phone: '+91 98305 78906',
    email: 'anandita@senfamilytrust.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-144',
    name: 'Paramount Security Solutions LLP',
    entityType: 'LLP',
    contactPerson: 'Col. Surinder Malik',
    phone: '+91 98109 89017',
    email: 'malik@paramountsec.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-145',
    name: 'Deccan Mineral & Mining Corp Ltd',
    entityType: 'Company',
    contactPerson: 'Prabhakar Reddy',
    phone: '+91 98481 90128',
    email: 'prabhakar@deccanminerals.com',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-146',
    name: 'Aditya Wind Energy Solutions Pvt Ltd',
    entityType: 'Company',
    contactPerson: 'Aditya Kothari',
    phone: '+91 98224 01239',
    email: 'aditya@adityawind.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-147',
    name: 'Sagar Coastal Logistics LLP',
    entityType: 'LLP',
    contactPerson: 'Mohan Das',
    phone: '+91 94482 12340',
    email: 'mohandas@sagarcoastal.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  },
  {
    id: 'CLI-148',
    name: 'Kohinoor Tea Plantations & Exports',
    entityType: 'Partnership',
    contactPerson: 'Dipak Barua',
    phone: '+91 94350 23451',
    email: 'dipak@kohinoortea.in',
    isContactAuthorised: true,
    authStatusLabel: 'Authorised'
  }
];

// 2. Exactly 47 Pending Documents partitioned by the 6 pipeline stages:
// 14 Draft + 8 Awaiting Info + 6 CA Review + 9 Party Review + 6 Awaiting Payment + 4 Executing = 47
export const MOCK_SUMMARY_PENDING_DOCS = [
  // --- CA REVIEW (6 documents) ---
  {
    id: 'DOC-PND-01',
    ref: 'AUD-2026-081',
    title: 'FY 2025-26 Statutory Audit & Tax Audit 3CD',
    client: 'Acme Technologies Pvt Ltd',
    clientId: 'CLI-101',
    stage: 'CA Review',
    statusCode: 'ca_review',
    badgeColor: '#3b82f6',
    lastUpdated: '2 hours ago'
  },
  {
    id: 'DOC-PND-02',
    ref: 'ITR-2026-092',
    title: 'Form 3CEB Transfer Pricing Accountant Report',
    client: 'Apex Logistics India Pvt Ltd',
    clientId: 'CLI-104',
    stage: 'CA Review',
    statusCode: 'ca_review',
    badgeColor: '#3b82f6',
    lastUpdated: '3 hours ago'
  },
  {
    id: 'DOC-PND-03',
    ref: 'GST-2026-118',
    title: 'GSTR-9C Reconciliation Statement Verification',
    client: 'Sudarshan Castings Ltd',
    clientId: 'CLI-108',
    stage: 'CA Review',
    statusCode: 'ca_review',
    badgeColor: '#3b82f6',
    lastUpdated: '4 hours ago'
  },
  {
    id: 'DOC-PND-04',
    ref: 'AUD-2026-074',
    title: 'Limited Review Report for Listed Quarterly Filing',
    client: 'Kaveri Renewable Energy Pvt Ltd',
    clientId: 'CLI-109',
    stage: 'CA Review',
    statusCode: 'ca_review',
    badgeColor: '#3b82f6',
    lastUpdated: '6 hours ago'
  },
  {
    id: 'DOC-PND-05',
    ref: 'ROC-2026-061',
    title: 'Statutory Secretarial Compliance Certificate',
    client: 'Shri Ram Textiles Pvt Ltd',
    clientId: 'CLI-111',
    stage: 'CA Review',
    statusCode: 'ca_review',
    badgeColor: '#3b82f6',
    lastUpdated: '8 hours ago'
  },
  {
    id: 'DOC-PND-06',
    ref: 'CERT-2026-029',
    title: 'Net Worth Certificate for Bank Credit Facility',
    client: 'Vantage Capital Advisors',
    clientId: 'CLI-115',
    stage: 'CA Review',
    statusCode: 'ca_review',
    badgeColor: '#3b82f6',
    lastUpdated: '10 hours ago'
  },

  // --- PARTY REVIEW (9 documents) ---
  {
    id: 'DOC-PND-07',
    ref: 'ITR-2026-312',
    title: 'ITR-3 Professional Income Computation & Capital Gains',
    client: 'Dr. Vikram Sethi',
    clientId: 'CLI-103',
    stage: 'Party Review',
    statusCode: 'party_review',
    badgeColor: '#8b5cf6',
    lastUpdated: '1 day ago'
  },
  {
    id: 'DOC-PND-08',
    ref: 'GST-2026-104',
    title: 'GSTR-9 Annual Return Computation Sheet',
    client: 'Zenith Retail LLP',
    clientId: 'CLI-102',
    stage: 'Party Review',
    statusCode: 'party_review',
    badgeColor: '#8b5cf6',
    lastUpdated: '1 day ago'
  },
  {
    id: 'DOC-PND-09',
    ref: 'AUD-2026-088',
    title: 'Statutory Balance Sheet & Profit and Loss Schedule',
    client: 'GreenLeaf Organics Pvt Ltd',
    clientId: 'CLI-107',
    stage: 'Party Review',
    statusCode: 'party_review',
    badgeColor: '#8b5cf6',
    lastUpdated: '1 day ago'
  },
  {
    id: 'DOC-PND-10',
    ref: 'AGR-2026-042',
    title: 'LLP Supplementary Agreement for Profit Ratio Amendment',
    client: 'Aura Healthcare LLP',
    clientId: 'CLI-110',
    stage: 'Party Review',
    statusCode: 'party_review',
    badgeColor: '#8b5cf6',
    lastUpdated: '2 days ago'
  },
  {
    id: 'DOC-PND-11',
    ref: 'ROC-2026-052',
    title: 'Annual Return Form MGT-7 with Director Disclosures',
    client: 'Kalyani Agro Products Pvt Ltd',
    clientId: 'CLI-116',
    stage: 'Party Review',
    statusCode: 'party_review',
    badgeColor: '#8b5cf6',
    lastUpdated: '2 days ago'
  },
  {
    id: 'DOC-PND-12',
    ref: 'CERT-2026-034',
    title: 'Foreign Inward Remittance Certificate (FIRC) Proof Pack',
    client: 'Nexus Media Works LLP',
    clientId: 'CLI-114',
    stage: 'Party Review',
    statusCode: 'party_review',
    badgeColor: '#8b5cf6',
    lastUpdated: '2 days ago'
  },
  {
    id: 'DOC-PND-13',
    ref: 'AUD-2026-095',
    title: 'Tax Audit Annexures and Clause 44 Expenditure Verification',
    client: 'Sterling Finlease Ltd',
    clientId: 'CLI-117',
    stage: 'Party Review',
    statusCode: 'party_review',
    badgeColor: '#8b5cf6',
    lastUpdated: '3 days ago'
  },
  {
    id: 'DOC-PND-14',
    ref: 'AGR-2026-038',
    title: 'Partnership Reconstitution Deed with New Partner Admission',
    client: 'Omkar Real Estate Developers',
    clientId: 'CLI-120',
    stage: 'Party Review',
    statusCode: 'party_review',
    badgeColor: '#8b5cf6',
    lastUpdated: '3 days ago'
  },
  {
    id: 'DOC-PND-15',
    ref: 'ROC-2026-077',
    title: 'Board Resolution for Statutory Auditor Appointment ADT-1',
    client: 'Trident Solar Tech India Ltd',
    clientId: 'CLI-129',
    stage: 'Party Review',
    statusCode: 'party_review',
    badgeColor: '#8b5cf6',
    lastUpdated: '4 days ago'
  },

  // --- DRAFT (14 documents) ---
  {
    id: 'DOC-PND-16',
    ref: 'AGR-2026-017',
    title: 'Partnership Deed Supplementary Reconstitution',
    client: 'Horizon Enterprises',
    clientId: 'CLI-105',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '3 hours ago'
  },
  {
    id: 'DOC-PND-17',
    ref: 'AUD-2026-102',
    title: 'Internal Financial Controls (IFCoFR) Audit Matrix',
    client: 'Pragati Microfinance Ltd',
    clientId: 'CLI-112',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '5 hours ago'
  },
  {
    id: 'DOC-PND-18',
    ref: 'ITR-2026-204',
    title: 'ITR-5 Partnership Firm Business Income Computation',
    client: 'Metropolis Diagnostic Centre',
    clientId: 'CLI-118',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '7 hours ago'
  },
  {
    id: 'DOC-PND-19',
    ref: 'GST-2026-140',
    title: 'GST Input Tax Credit Reversal Schedule (Rule 42/43)',
    client: 'Riddhi Siddhi Gold & Diamonds',
    clientId: 'CLI-121',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '12 hours ago'
  },
  {
    id: 'DOC-PND-20',
    ref: 'ROC-2026-085',
    title: 'MCA Form DPT-3 Return of Deposits Statement',
    client: 'Universal Marine Services Pvt Ltd',
    clientId: 'CLI-124',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '1 day ago'
  },
  {
    id: 'DOC-PND-21',
    ref: 'CERT-2026-041',
    title: 'Working Capital Certificate for Consortium Lending',
    client: 'Navratna Engineering Works',
    clientId: 'CLI-125',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '1 day ago'
  },
  {
    id: 'DOC-PND-22',
    ref: 'ITR-2026-218',
    title: 'ITR-6 Corporate Advance Tax Q3 Computation',
    client: 'Pioneer Cold Storage & Logistics',
    clientId: 'CLI-126',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '2 days ago'
  },
  {
    id: 'DOC-PND-23',
    ref: 'AGR-2026-050',
    title: 'Commercial Lease Agreement with Stamp Duty Endorsement',
    client: 'Aishwarya Silks & Sarees',
    clientId: 'CLI-127',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '2 days ago'
  },
  {
    id: 'DOC-PND-24',
    ref: 'AUD-2026-115',
    title: 'Diagnostic Lab Equipment Fixed Assets Register & Depreciation',
    client: 'Prime Diagnostic Laboratories',
    clientId: 'CLI-128',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '2 days ago'
  },
  {
    id: 'DOC-PND-25',
    ref: 'ROC-2026-092',
    title: 'Form BEN-2 Declaration of Significant Beneficial Ownership',
    client: 'Galaxy Automotive Components Ltd',
    clientId: 'CLI-132',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '3 days ago'
  },
  {
    id: 'DOC-PND-26',
    ref: 'ITR-2026-230',
    title: 'Section 11 & 12 Exemption Return Form 10B for NGO Trust',
    client: 'Bhartiya Gramin Vikas Sanstha',
    clientId: 'CLI-130',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '3 days ago'
  },
  {
    id: 'DOC-PND-27',
    ref: 'CERT-2026-048',
    title: 'CA Certificate for Turnover & Export Invoicing Compliance',
    client: 'CloudNine Beverages India LLP',
    clientId: 'CLI-123',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '4 days ago'
  },
  {
    id: 'DOC-PND-28',
    ref: 'AGR-2026-063',
    title: 'Franchise Royalty Agreement & Withholding Tax Protocol',
    client: 'Crestone Hospitality Services LLP',
    clientId: 'CLI-131',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '4 days ago'
  },
  {
    id: 'DOC-PND-29',
    ref: 'AUD-2026-121',
    title: 'Agricultural Farm Inventory Valuation Schedule',
    client: 'Sri Krishna Dairy & Poultry Farms',
    clientId: 'CLI-133',
    stage: 'Draft',
    statusCode: 'draft',
    badgeColor: '#64748b',
    lastUpdated: '5 days ago'
  },

  // --- AWAITING INFORMATION (8 documents) ---
  {
    id: 'DOC-PND-30',
    ref: 'AUD-2026-130',
    title: 'R&D Tax Incentive Claim Documentation under Section 35(2AB)',
    client: 'Quantum Data Science Systems Pvt Ltd',
    clientId: 'CLI-134',
    stage: 'Awaiting Info',
    statusCode: 'awaiting_info',
    badgeColor: '#f59e0b',
    lastUpdated: '1 day ago'
  },
  {
    id: 'DOC-PND-31',
    ref: 'GST-2026-155',
    title: 'Annual GST Reconciliation GSTR-9 for Press Operations',
    client: 'Saraswati Offset Printers',
    clientId: 'CLI-135',
    stage: 'Awaiting Info',
    statusCode: 'awaiting_info',
    badgeColor: '#f59e0b',
    lastUpdated: '1 day ago'
  },
  {
    id: 'DOC-PND-32',
    ref: 'ITR-2026-245',
    title: 'Foreign Branch Financial Consolidation & Form 67 Foreign Tax Credit',
    client: 'Everest Rubber & Polymers LLP',
    clientId: 'CLI-136',
    stage: 'Awaiting Info',
    statusCode: 'awaiting_info',
    badgeColor: '#f59e0b',
    lastUpdated: '2 days ago'
  },
  {
    id: 'DOC-PND-33',
    ref: 'ROC-2026-105',
    title: 'Form CHG-1 Charge Creation Certificate for Bank Loan',
    client: 'Matrix Cloud Infrastructure Ltd',
    clientId: 'CLI-137',
    stage: 'Awaiting Info',
    statusCode: 'awaiting_info',
    badgeColor: '#f59e0b',
    lastUpdated: '3 days ago'
  },
  {
    id: 'DOC-PND-34',
    ref: 'AUD-2026-138',
    title: 'Raw Material Consumption & Spice Processing Waste Verification',
    client: 'Heritage Spices & Condiments',
    clientId: 'CLI-138',
    stage: 'Awaiting Info',
    statusCode: 'awaiting_info',
    badgeColor: '#f59e0b',
    lastUpdated: '3 days ago'
  },
  {
    id: 'DOC-PND-35',
    ref: 'ITR-2026-259',
    title: 'Educational Institution Foreign Contribution FCRA Audit Pack',
    client: 'Mahaveer Jain Educational Trust',
    clientId: 'CLI-139',
    stage: 'Awaiting Info',
    statusCode: 'awaiting_info',
    badgeColor: '#f59e0b',
    lastUpdated: '4 days ago'
  },
  {
    id: 'DOC-PND-36',
    ref: 'CERT-2026-056',
    title: 'Machinery Valuation & Installed Capacity Verification Certificate',
    client: 'Precision Metal Stamping Ltd',
    clientId: 'CLI-140',
    stage: 'Awaiting Info',
    statusCode: 'awaiting_info',
    badgeColor: '#f59e0b',
    lastUpdated: '5 days ago'
  },
  {
    id: 'DOC-PND-37',
    ref: 'AGR-2026-071',
    title: 'Ayurvedic Treatment Trademark Licensing Agreement',
    client: 'Vedic Wellness Retreats LLP',
    clientId: 'CLI-141',
    stage: 'Awaiting Info',
    statusCode: 'awaiting_info',
    badgeColor: '#f59e0b',
    lastUpdated: '6 days ago'
  },

  // --- AWAITING PAYMENT (6 documents) ---
  {
    id: 'DOC-PND-38',
    ref: 'AUD-2026-145',
    title: 'Packaging Plant Tax Audit Report 3CA/3CD Certification',
    client: 'Narmada Packaging Containers Pvt Ltd',
    clientId: 'CLI-142',
    stage: 'Awaiting Payment',
    statusCode: 'awaiting_payment',
    badgeColor: '#ec4899',
    lastUpdated: '4 hours ago'
  },
  {
    id: 'DOC-PND-39',
    ref: 'ITR-2026-270',
    title: 'Private Family Trust Assessment Form 10B & ITR-5',
    client: 'Dr. Anandita Sen Family Trust',
    clientId: 'CLI-143',
    stage: 'Awaiting Payment',
    statusCode: 'awaiting_payment',
    badgeColor: '#ec4899',
    lastUpdated: '8 hours ago'
  },
  {
    id: 'DOC-PND-40',
    ref: 'GST-2026-168',
    title: 'Security Personnel Service GST Audit & Input Tax Settlement',
    client: 'Paramount Security Solutions LLP',
    clientId: 'CLI-144',
    stage: 'Awaiting Payment',
    statusCode: 'awaiting_payment',
    badgeColor: '#ec4899',
    lastUpdated: '1 day ago'
  },
  {
    id: 'DOC-PND-41',
    ref: 'ROC-2026-119',
    title: 'Mining Concession Leasehold Disclosure in Form AOC-4 XBRL',
    client: 'Deccan Mineral & Mining Corp Ltd',
    clientId: 'CLI-145',
    stage: 'Awaiting Payment',
    statusCode: 'awaiting_payment',
    badgeColor: '#ec4899',
    lastUpdated: '1 day ago'
  },
  {
    id: 'DOC-PND-42',
    ref: 'CERT-2026-063',
    title: 'Clean Energy Subsidy CA Utilization Certificate',
    client: 'Aditya Wind Energy Solutions Pvt Ltd',
    clientId: 'CLI-146',
    stage: 'Awaiting Payment',
    statusCode: 'awaiting_payment',
    badgeColor: '#ec4899',
    lastUpdated: '2 days ago'
  },
  {
    id: 'DOC-PND-43',
    ref: 'AGR-2026-080',
    title: 'Vessel Charter Party Freight Transportation Deed',
    client: 'Sagar Coastal Logistics LLP',
    clientId: 'CLI-147',
    stage: 'Awaiting Payment',
    statusCode: 'awaiting_payment',
    badgeColor: '#ec4899',
    lastUpdated: '3 days ago'
  },

  // --- EXECUTING (4 documents) ---
  {
    id: 'DOC-PND-44',
    ref: 'ROC-2026-049',
    title: 'Shareholders Resolution & Form MGT-14 Pack',
    client: 'Apex Logistics India Pvt Ltd',
    clientId: 'CLI-104',
    stage: 'Executing',
    statusCode: 'executing',
    badgeColor: '#06b6d4',
    lastUpdated: '3 hours ago'
  },
  {
    id: 'DOC-PND-45',
    ref: 'AUD-2026-150',
    title: 'Statutory Execution Packet for Bank Credit Consortium',
    client: 'Kohinoor Tea Plantations & Exports',
    clientId: 'CLI-148',
    stage: 'Executing',
    statusCode: 'executing',
    badgeColor: '#06b6d4',
    lastUpdated: '5 hours ago'
  },
  {
    id: 'DOC-PND-46',
    ref: 'AGR-2026-089',
    title: 'Executive Director Service Contract & Remuneration Charter',
    client: 'Acme Technologies Pvt Ltd',
    clientId: 'CLI-101',
    stage: 'Executing',
    statusCode: 'executing',
    badgeColor: '#06b6d4',
    lastUpdated: '7 hours ago'
  },
  {
    id: 'DOC-PND-47',
    ref: 'CERT-2026-072',
    title: 'Digital Signature Preserved Statutory Solvency Certificate',
    client: 'BlueStar Freight LLP',
    clientId: 'CLI-106',
    stage: 'Executing',
    statusCode: 'executing',
    badgeColor: '#06b6d4',
    lastUpdated: '12 hours ago'
  }
];

// Helper to generate 184 deterministic completed documents
const generate184CompletedDocs = () => {
  const result = [];
  const primaryClients = [
    { name: 'Acme Technologies Pvt Ltd', id: 'CLI-101' },
    { name: 'Zenith Retail LLP', id: 'CLI-102' },
    { name: 'Dr. Vikram Sethi', id: 'CLI-103' },
    { name: 'Apex Logistics India Pvt Ltd', id: 'CLI-104' },
    { name: 'Horizon Enterprises', id: 'CLI-105' },
    { name: 'BlueStar Freight LLP', id: 'CLI-106' },
    { name: 'GreenLeaf Organics Pvt Ltd', id: 'CLI-107' },
    { name: 'Sudarshan Castings Ltd', id: 'CLI-108' },
    { name: 'Kaveri Renewable Energy Pvt Ltd', id: 'CLI-109' },
    { name: 'Aura Healthcare LLP', id: 'CLI-110' },
    { name: 'Shri Ram Textiles Pvt Ltd', id: 'CLI-111' },
    { name: 'Pragati Microfinance Ltd', id: 'CLI-112' },
    { name: 'Sunbeam Education Trust', id: 'CLI-113' },
    { name: 'Nexus Media Works LLP', id: 'CLI-114' },
    { name: 'Vantage Capital Advisors', id: 'CLI-115' },
    { name: 'Kalyani Agro Products Pvt Ltd', id: 'CLI-116' }
  ];

  const docTemplates = [
    { title: 'Annual Audited Financial Statements FY 2024-25', prefix: 'AUD' },
    { title: 'Tax Audit Report Form 3CA / 3CD Certification', prefix: 'TAX' },
    { title: 'GSTR-9 Annual Return & Statutory Reconciliation', prefix: 'GST' },
    { title: 'Income Tax Computation & AY 2025-26 E-Filing Ack', prefix: 'ITR' },
    { title: 'MCA Annual Filing Pack (AOC-4 & MGT-7)', prefix: 'ROC' },
    { title: 'Statutory Solvency & Net Worth Certificate', prefix: 'CERT' },
    { title: 'Partnership Reconstitution & Capital Sharing Deed', prefix: 'AGR' },
    { title: 'Transfer Pricing Documentation Study Form 3CEB', prefix: 'TP' },
    { title: 'Director Identification KYC & Annual Attestation', prefix: 'DIR' },
    { title: 'TDS Annual Reconciliation & Form 26AS Verification', prefix: 'TDS' }
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Start with known executed mock document from dashboard
  result.push({
    id: 'DOC-CMP-001',
    ref: 'AUD-2026-054',
    title: 'Annual Audited Financial Statements FY 2024-25',
    client: 'BlueStar Freight LLP',
    clientId: 'CLI-106',
    completedAt: '17 Nov 2026, 14:30 IST',
    completedDate: '2026-11-17',
    finalFileAvailable: true,
    isAuthorised: true,
    fileName: 'AUD-2026-054-Executed.pdf',
    stampCertificateNo: 'IN-KA99120488219M'
  });

  // Recent item where assembly is still in progress (demonstrates final file processing / not yet available state)
  result.push({
    id: 'DOC-CMP-002',
    ref: 'AUD-2026-055',
    title: 'FY 2024-25 Statutory Independent Auditor Report',
    client: 'Acme Technologies Pvt Ltd',
    clientId: 'CLI-101',
    completedAt: '23 Nov 2026, 11:15 IST',
    completedDate: '2026-11-23',
    finalFileAvailable: false, // In assembly progress
    isAuthorised: true,
    fileName: 'AUD-2026-055-Executed.pdf',
    stampCertificateNo: null
  });

  // Generate remaining 182 documents
  for (let i = 3; i <= 184; i++) {
    const paddedId = String(i).padStart(3, '0');
    const client = primaryClients[(i - 1) % primaryClients.length];
    const tmpl = docTemplates[(i - 1) % docTemplates.length];
    const year = i > 120 ? 2025 : 2026;
    const ref = `${tmpl.prefix}-${year}-${String(100 + i)}`;

    // Spread completed dates realistically across past 11 months
    const day = (i % 28) + 1;
    const monthIdx = (i % 11);
    const completedAt = `${String(day).padStart(2, '0')} ${months[monthIdx]} ${year}`;

    // Item 38 is restricted for demonstration
    const isAuthorised = i !== 38;
    // Item 15 is still packaging
    const finalFileAvailable = i !== 15;

    result.push({
      id: `DOC-CMP-${paddedId}`,
      ref,
      title: `${tmpl.title}`,
      client: client.name,
      clientId: client.id,
      completedAt,
      completedDate: `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      finalFileAvailable,
      isAuthorised,
      fileName: `${ref}-Executed.pdf`,
      stampCertificateNo: `IN-KA${String(99000000000 + i * 179).slice(0, 11)}M`
    });
  }

  return result;
};

// 3. Exactly 184 Completed Documents
export const MOCK_SUMMARY_COMPLETED_DOCS = generate184CompletedDocs();
