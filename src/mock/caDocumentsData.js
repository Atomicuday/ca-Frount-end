/**
 * Mock Document Dataset for ZapDocs CA Practice Suite
 * Covers the full lifecycle of statutory audits, tax filings, ROC compliances, and legal charters.
 * Incorporates explicit states, versioning, approvals, quotes, execution packets, and password policies.
 */

export const BACKEND_PASSWORD_POLICY = {
  ruleKey: 'NAME4_PHONE4',
  description: 'First 4 characters of client / entity name in UPPERCASE followed by the last 4 digits of registered mobile number.',
  exampleFormat: 'e.g. For client "Acme Technologies" and phone "+91 98860 11223", the access key is "ACME1223"',
  providerCompliance: 'STATUTORY_SIGNATURE_PRESERVATION_COMPLIANT',
  signaturePreservationNote: 'PDF password protection is applied via statutory signing provider without modifying or compressing cryptographic signatures.'
};

export const MOCK_CA_DOCUMENTS = [
  {
    id: 'DOC-201',
    ref: 'AUD-2026-081',
    version: 'v1',
    title: 'FY 2025-26 Statutory Audit & Tax Audit 3CD',
    docType: 'Statutory Audit',
    createdAt: '18 Nov 2026',
    createdDate: '2026-11-18',
    lastUpdated: '2 hours ago',
    client: 'Acme Technologies Pvt Ltd',
    clientType: 'Private Limited',
    clientId: 'CLI-101',
    status: 'CA Review',
    statusCode: 'ca_review',
    stage: 'Review',
    isEditableDraft: false,
    clientApproval: {
      isApproved: true,
      versionApproved: 'v1',
      approvedAt: '2026-11-19T10:30:00Z',
      approvedBy: 'Arun Kumar (Managing Director)'
    },
    correctionRequests: [],
    payment: {
      status: 'PAID',
      amountPaise: 124900,
      orderId: 'ORD-PAY-AUD-201',
      receiptId: 'ZD-RCP-2026-8812',
      paidAt: '2026-11-20T14:15:00Z',
      method: 'wallet'
    },
    execution: {
      isLocked: true,
      packetReady: true,
      stampRequired: true,
      stampStatus: 'ISSUED',
      stampCertificateNo: 'IN-KA99120488219M',
      signers: [
        {
          id: 'sig-1',
          name: 'Arun Kumar',
          role: 'Managing Director',
          email: 'arun@acmetech.in',
          phone: '+91 98860 11223',
          status: 'PENDING',
          signedAt: null
        },
        {
          id: 'sig-2',
          name: 'CA Rajesh Sharma',
          role: 'Statutory Auditor (FCA)',
          email: 'ca.rajesh@sharma-associates.in',
          phone: '+91 98450 12345',
          status: 'PENDING',
          signedAt: null
        }
      ]
    },
    allowedSendAction: {
      actionKey: 'send_invitation',
      label: 'Send Signing Link',
      targetSignatory: 'Arun Kumar (Managing Director)',
      targetEmail: 'arun@acmetech.in',
      phone: '+91 98860 11223',
      channel: 'portal_email',
      whatsAppLimit: 2,
      whatsAppSentCount: 1
    },
    whatsAppTracking: {
      reviewSent: true,
      signingSent: false,
      totalSent: 1,
      limit: 2
    },
    statusDetails: {
      paymentStatus: 'Paid',
      stampStatus: 'eStamped',
      signerStatus: 'Pending Signatures'
    },
    formData: {
      turnover: '₹42.50 Cr',
      auditPeriod: '01 Apr 2025 – 31 Mar 2026',
      taxAuditForm: 'Form 3CA / 3CD',
      reportingPartner: 'CA Rajesh Sharma, FCA',
      notes: 'Depreciation verified under Companies Act Schedule II and Section 32 of Income Tax Act.'
    }
  },
  {
    id: 'DOC-202',
    ref: 'GST-2026-104',
    version: 'v1',
    title: 'GSTR-9 Annual Return Computation Sheet',
    docType: 'GST Returns',
    createdAt: '15 Nov 2026',
    createdDate: '2026-11-15',
    lastUpdated: '5 hours ago',
    client: 'Zenith Retail LLP',
    clientType: 'LLP',
    clientId: 'CLI-102',
    status: 'Changes Requested',
    statusCode: 'corrections',
    stage: 'Changes Requested',
    isEditableDraft: false,
    clientApproval: {
      isApproved: false,
      versionApproved: null,
      approvedAt: null,
      approvedBy: null
    },
    correctionRequests: [
      {
        id: 'cr-201',
        author: 'Pooja Reddy',
        role: 'Designated Partner',
        requesterName: 'Pooja Reddy',
        requesterPhone: '+91 98451 99887',
        text: 'Table 8A ITC reconciliation reflects ₹42,000 difference with GSTR-2B. Please update turnover field and GTA liability note.',
        proposedFields: [
          {
            fieldId: 'turnover',
            fieldLabel: 'Turnover (INR)',
            existingValue: '₹8.75 Cr',
            proposedValue: '₹8.92 Cr'
          },
          {
            fieldId: 'notes',
            fieldLabel: 'Audit Notes',
            existingValue: 'Table 6B inward supplies reconciled; pending 8A GTA review.',
            proposedValue: 'Table 6B reconciled; Table 8A ITC updated with supplier invoice #ZR-884.'
          }
        ],
        createdAt: '5 hours ago',
        status: 'Pending',
        version: 'v1'
      },
      {
        id: 'cr-202',
        author: 'CA Amit Verma',
        role: 'Audit Senior',
        requesterName: 'CA Amit Verma',
        requesterPhone: '+91 98450 67890',
        text: 'Reverse charge liability under 9(3) for GTA services requires supplementary payment challan attachment.',
        proposedFields: [],
        createdAt: '1 day ago',
        status: 'Pending',
        version: 'v1'
      }
    ],
    payment: {
      status: 'UNBILLED',
      amountPaise: 41300,
      orderId: null,
      receiptId: null,
      paidAt: null,
      method: null
    },
    execution: {
      isLocked: false,
      packetReady: false,
      stampRequired: false,
      stampStatus: 'NOT_REQUIRED',
      stampCertificateNo: null,
      signers: [
        {
          id: 'sig-201',
          name: 'Pooja Reddy',
          role: 'Designated Partner',
          email: 'pooja@zenithretail.in',
          phone: '+91 98451 99887',
          status: 'PENDING',
          signedAt: null
        }
      ]
    },
    allowedSendAction: {
      actionKey: 'resubmit_review',
      label: 'Resubmit for Review',
      targetSignatory: 'Pooja Reddy (Partner)',
      targetEmail: 'pooja@zenithretail.in',
      phone: '+91 98451 99887',
      channel: 'portal_email',
      whatsAppLimit: 2,
      whatsAppSentCount: 1
    },
    whatsAppTracking: {
      reviewSent: true,
      signingSent: false,
      totalSent: 1,
      limit: 2
    },
    statusDetails: {
      paymentStatus: 'Unbilled',
      stampStatus: 'Not Required',
      signerStatus: 'Pending Review'
    },
    formData: {
      turnover: '₹8.75 Cr',
      auditPeriod: 'FY 2025-26',
      taxAuditForm: 'GSTR-9 & 9C',
      reportingPartner: 'CA Rajesh Sharma, FCA',
      notes: 'Table 6B inward supplies reconciled; pending 8A GTA review.'
    }
  },
  {
    id: 'DOC-203',
    ref: 'ITR-2026-312',
    version: 'v1',
    title: 'ITR-3 Professional Income Computation & Capital Gains',
    docType: 'Income Tax',
    createdAt: '10 Nov 2026',
    createdDate: '2026-11-10',
    lastUpdated: '1 day ago',
    client: 'Dr. Vikram Sethi',
    clientType: 'Individual / Professional',
    clientId: 'CLI-103',
    status: 'Party Review',
    statusCode: 'party_review',
    stage: 'Review',
    isEditableDraft: false,
    clientApproval: {
      isApproved: false,
      versionApproved: null,
      approvedAt: null,
      approvedBy: null
    },
    correctionRequests: [
      {
        id: 'cr-301',
        author: 'Dr. Vikram Sethi',
        role: 'Client',
        requesterName: 'Dr. Vikram Sethi',
        requesterPhone: '+91 94480 33445',
        text: 'Kindly recheck medical equipment capital gain indexed cost under Section 48.',
        proposedFields: [
          {
            fieldId: 'notes',
            fieldLabel: 'Computation Notes',
            existingValue: 'Presumptive 44ADA not applicable due to turnover; regular books audited.',
            proposedValue: 'Presumptive 44ADA not applicable; Section 48 indexation applied for clinic ultrasound machinery.'
          }
        ],
        createdAt: '1 day ago',
        status: 'Pending',
        version: 'v1'
      }
    ],
    payment: {
      status: 'UNBILLED',
      amountPaise: 41300,
      orderId: null,
      receiptId: null,
      paidAt: null,
      method: null
    },
    execution: {
      isLocked: false,
      packetReady: false,
      stampRequired: false,
      stampStatus: 'NOT_REQUIRED',
      stampCertificateNo: null,
      signers: [
        {
          id: 'sig-301',
          name: 'Dr. Vikram Sethi',
          role: 'Assessee',
          email: 'dr.sethi@clinic.in',
          phone: '+91 94480 33445',
          status: 'PENDING',
          signedAt: null
        }
      ]
    },
    allowedSendAction: {
      actionKey: 'send_reminder',
      label: 'Send Portal Reminder',
      targetSignatory: 'Dr. Vikram Sethi',
      targetEmail: 'dr.sethi@clinic.in',
      phone: '+91 94480 33445',
      channel: 'portal_email',
      whatsAppLimit: 2,
      whatsAppSentCount: 1
    },
    whatsAppTracking: {
      reviewSent: true,
      signingSent: false,
      totalSent: 1,
      limit: 2
    },
    statusDetails: {
      paymentStatus: 'Unbilled',
      stampStatus: 'Not Applicable',
      signerStatus: 'Awaiting Client Review'
    },
    formData: {
      turnover: '₹1.15 Cr (Gross Receipts)',
      auditPeriod: 'AY 2026-27 (FY 2025-26)',
      taxAuditForm: 'ITR-3 Business & Profession',
      reportingPartner: 'CA Rajesh Sharma, FCA',
      notes: 'Presumptive 44ADA not applicable due to turnover; regular books audited.'
    }
  },
  {
    id: 'DOC-204',
    ref: 'ROC-2026-049',
    version: 'v1',
    title: 'Shareholders Resolution & Form MGT-14 Pack',
    docType: 'ROC Compliance',
    createdAt: '08 Nov 2026',
    createdDate: '2026-11-08',
    lastUpdated: '2 days ago',
    client: 'Apex Logistics India Pvt Ltd',
    clientType: 'Private Limited',
    clientId: 'CLI-104',
    status: 'Executing',
    statusCode: 'executing',
    stage: 'Signing',
    isEditableDraft: false,
    clientApproval: {
      isApproved: true,
      versionApproved: 'v1',
      approvedAt: '2026-11-09T11:00:00Z',
      approvedBy: 'Ramesh Nair (Director)'
    },
    correctionRequests: [],
    payment: {
      status: 'PAID',
      amountPaise: 82600,
      orderId: 'ORD-PAY-ROC-204',
      receiptId: 'ZD-RCP-2026-7731',
      paidAt: '2026-11-09T14:00:00Z',
      method: 'netbanking'
    },
    execution: {
      isLocked: true,
      packetReady: true,
      stampRequired: true,
      stampStatus: 'ISSUED',
      stampCertificateNo: 'IN-MH120499182A',
      signers: [
        {
          id: 'sig-401',
          name: 'Ramesh Nair',
          role: 'Director',
          email: 'ramesh@apexlogistics.in',
          phone: '+91 98200 44556',
          status: 'PENDING',
          signedAt: null
        }
      ]
    },
    allowedSendAction: {
      actionKey: 'send_invitation',
      label: 'Send Signing Invitation',
      targetSignatory: 'Ramesh Nair (Director)',
      targetEmail: 'ramesh@apexlogistics.in',
      phone: '+91 98200 44556',
      channel: 'portal_email',
      whatsAppLimit: 2,
      whatsAppSentCount: 1
    },
    whatsAppTracking: {
      reviewSent: true,
      signingSent: false,
      totalSent: 1,
      limit: 2
    },
    statusDetails: {
      paymentStatus: 'Paid',
      stampStatus: 'eStamped',
      signerStatus: 'Awaiting Signer DSC'
    },
    formData: {
      turnover: '₹65.00 Cr',
      auditPeriod: 'FY 2025-26',
      taxAuditForm: 'Section 117 / Form MGT-14',
      reportingPartner: 'CA Rajesh Sharma, FCA',
      notes: 'Resolution passed under Section 180(1)(c) for enhanced borrowing limit.'
    }
  },
  {
    id: 'DOC-205',
    ref: 'AGR-2026-017',
    version: 'v1',
    title: 'Partnership Deed Supplementary Reconstitution',
    docType: 'Deed / Agreement',
    createdAt: '05 Nov 2026',
    createdDate: '2026-11-05',
    lastUpdated: '3 days ago',
    client: 'Horizon Enterprises',
    clientType: 'Partnership',
    clientId: 'CLI-105',
    status: 'Draft',
    statusCode: 'draft',
    stage: 'Draft',
    isEditableDraft: true,
    clientApproval: {
      isApproved: false,
      versionApproved: null,
      approvedAt: null,
      approvedBy: null
    },
    correctionRequests: [],
    payment: {
      status: 'UNBILLED',
      amountPaise: 124900,
      orderId: null,
      receiptId: null,
      paidAt: null,
      method: null
    },
    execution: {
      isLocked: false,
      packetReady: false,
      stampRequired: true,
      stampStatus: 'PROCESSING',
      stampCertificateNo: null,
      signers: [
        {
          id: 'sig-501',
          name: 'Suresh Patel',
          role: 'Managing Partner',
          email: 'suresh@horizonenterprises.com',
          phone: '+91 98220 77889',
          status: 'PENDING',
          signedAt: null
        }
      ]
    },
    allowedSendAction: {
      actionKey: 'request_info',
      label: 'Request Information',
      targetSignatory: 'Suresh Patel (Managing Partner)',
      targetEmail: 'suresh@horizonenterprises.com',
      phone: '+91 98220 77889',
      channel: 'portal_email',
      whatsAppLimit: 2,
      whatsAppSentCount: 0
    },
    whatsAppTracking: {
      reviewSent: false,
      signingSent: false,
      totalSent: 0,
      limit: 2
    },
    statusDetails: {
      paymentStatus: 'Unbilled',
      stampStatus: 'Pending eStamp',
      signerStatus: 'Drafting'
    },
    formData: {
      turnover: '₹4.20 Cr',
      auditPeriod: 'Effective 01 Dec 2026',
      taxAuditForm: 'Indian Partnership Act 1932',
      reportingPartner: 'CA Rajesh Sharma, FCA',
      notes: 'Admission of incoming partner with ₹50 Lakh capital contribution.'
    }
  },
  {
    id: 'DOC-206',
    ref: 'AUD-2026-054',
    version: 'v1',
    title: 'Annual Audited Financial Statements FY 2024-25',
    docType: 'Statutory Audit',
    createdAt: '22 Oct 2026',
    createdDate: '2026-10-22',
    lastUpdated: '4 days ago',
    client: 'BlueStar Freight LLP',
    clientType: 'LLP',
    clientId: 'CLI-106',
    status: 'Completed',
    statusCode: 'completed',
    stage: 'Completed',
    isEditableDraft: false,
    clientApproval: {
      isApproved: true,
      versionApproved: 'v1',
      approvedAt: '2026-10-24T12:00:00Z',
      approvedBy: 'Kavita Menon (Partner)'
    },
    correctionRequests: [],
    payment: {
      status: 'PAID',
      amountPaise: 124900,
      orderId: 'ORD-PAY-AUD-206',
      receiptId: 'ZD-RCP-2026-5541',
      paidAt: '2026-10-24T15:30:00Z',
      method: 'wallet'
    },
    execution: {
      isLocked: true,
      packetReady: true,
      stampRequired: true,
      stampStatus: 'ISSUED',
      stampCertificateNo: 'IN-KL889912443Z',
      signers: [
        {
          id: 'sig-601',
          name: 'Kavita Menon',
          role: 'Designated Partner',
          email: 'kavita@bluestarfreight.in',
          phone: '+91 97410 88990',
          status: 'SIGNED',
          signedAt: '2026-10-25T11:45:00Z'
        },
        {
          id: 'sig-602',
          name: 'CA Rajesh Sharma',
          role: 'Statutory Auditor',
          email: 'ca.rajesh@sharma-associates.in',
          phone: '+91 98450 12345',
          status: 'SIGNED',
          signedAt: '2026-10-25T14:10:00Z'
        }
      ]
    },
    allowedSendAction: {
      actionKey: 'share_copy',
      label: 'Share Completed Copy',
      targetSignatory: 'Kavita Menon (Partner)',
      targetEmail: 'kavita@bluestarfreight.in',
      phone: '+91 97410 88990',
      channel: 'portal_email',
      whatsAppLimit: 2,
      whatsAppSentCount: 2
    },
    whatsAppTracking: {
      reviewSent: true,
      signingSent: true,
      totalSent: 2,
      limit: 2
    },
    statusDetails: {
      paymentStatus: 'Settled',
      stampStatus: 'eStamped',
      signerStatus: 'Completed & Executed'
    },
    completedAt: '25 Oct 2026, 14:10 IST',
    firmId: 'FIRM-001',
    finalFileAvailable: true,
    formData: {
      turnover: '₹22.40 Cr',
      auditPeriod: '01 Apr 2024 – 31 Mar 2025',
      taxAuditForm: 'Form 3CA / 3CD',
      reportingPartner: 'CA Rajesh Sharma, FCA',
      notes: 'Audited financial statements signed by designated partners and statutory auditor with UDIN 26014229ABXYZ1234.'
    }
  },
  {
    id: 'DOC-207',
    ref: 'ROC-2026-118',
    version: 'v1',
    title: 'AOC-4 Financial Statements Filing with ROC',
    docType: 'ROC Compliance',
    createdAt: '15 Oct 2026',
    createdDate: '2026-10-15',
    lastUpdated: '5 days ago',
    client: 'Apex BioLabs Private Limited',
    clientType: 'Private Limited',
    clientId: 'CLI-107',
    firmId: 'FIRM-001',
    status: 'Completed',
    statusCode: 'completed',
    stage: 'Completed',
    isEditableDraft: false,
    finalFileAvailable: false, // Simulates repository processing state
    clientApproval: {
      isApproved: true,
      versionApproved: 'v1',
      approvedAt: '2026-10-16T11:00:00Z',
      approvedBy: 'Dr. Neha Shah (Director)'
    },
    correctionRequests: [],
    payment: {
      status: 'PAID',
      amountPaise: 41300,
      orderId: 'ORD-PAY-ROC-207',
      receiptId: 'ZD-RCP-2026-4412',
      paidAt: '2026-10-16T12:30:00Z',
      method: 'wallet'
    },
    execution: {
      isLocked: true,
      packetReady: true,
      stampRequired: false,
      stampStatus: 'NOT_REQUIRED',
      stampCertificateNo: null,
      signers: [
        {
          id: 'sig-701',
          name: 'Dr. Neha Shah',
          role: 'Director',
          email: 'neha@apexbio.in',
          phone: '+91 98200 44556',
          status: 'SIGNED',
          signedAt: '2026-10-17T09:30:00Z'
        }
      ]
    },
    allowedSendAction: {
      actionKey: 'share_copy',
      label: 'Share Completed Copy',
      targetSignatory: 'Dr. Neha Shah (Director)',
      targetEmail: 'neha@apexbio.in',
      phone: '+91 98200 44556',
      channel: 'portal_email',
      whatsAppLimit: 2,
      whatsAppSentCount: 2
    },
    whatsAppTracking: {
      reviewSent: true,
      signingSent: true,
      totalSent: 2,
      limit: 2
    },
    statusDetails: {
      paymentStatus: 'Settled',
      stampStatus: 'Not Required',
      signerStatus: 'Completed & Executed'
    },
    completedAt: '17 Oct 2026, 09:30 IST',
    formData: {
      turnover: '₹14.80 Cr',
      auditPeriod: 'FY 2024-25',
      taxAuditForm: 'MCA Form AOC-4',
      reportingPartner: 'CA Rajesh Sharma, FCA',
      notes: 'XBRL taxonomy validated. Certified copy assembling in repository.'
    }
  }
];

export const DOCUMENT_STATUSES = [
  { id: 'ALL', label: 'All Statuses' },
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'Review / Party Review' },
  { id: 'corrections', label: 'Changes Requested' },
  { id: 'revised_review', label: 'Revised Review' },
  { id: 'approved_locked', label: 'Approved / Locked' },
  { id: 'awaiting_payment', label: 'Payment Pending' },
  { id: 'executing', label: 'Executing / Signing' },
  { id: 'completed', label: 'Completed & Filed' }
];

export const DOCUMENT_TYPES = [
  'All Types',
  'Statutory Audit',
  'GST Returns',
  'Income Tax',
  'ROC Compliance',
  'Deed / Agreement'
];

export default MOCK_CA_DOCUMENTS;
