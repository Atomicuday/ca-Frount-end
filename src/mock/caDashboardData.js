/**
 * ZapDocs CA Dashboard Mock Fixtures
 * High-fidelity, self-consistent mock dataset representing a Chartered Accountant's
 * document preparation, client review, and statutory execution pipeline.
 */

// Helper to generate 30 days of daily activity ending on reference date (23 Nov 2026)
const generate30DaysActivity = (refDate = new Date(2026, 10, 23)) => {
  const dailyCounts = [
    1, 2, 0, 1, 3, 2, 0, 1, 2, 4, 1, 0, 2, 3, 1,
    2, 0, 1, 3, 2, 1, 0, 2, 3, 1, 2, 0, 1, 2, 2
  ];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(refDate);
    d.setDate(d.getDate() - i);
    const day = String(d.getDate()).padStart(2, '0');
    const month = monthsShort[d.getMonth()];
    const countIndex = 29 - i;
    const isToday = i === 0;

    result.push({
      label: isToday ? 'Today' : `${day} ${month}`,
      shortDate: `${day} ${month}`,
      dateStr: d.toISOString().split('T')[0],
      count: dailyCounts[countIndex] ?? 1,
      isPartial: isToday,
      partialLabel: isToday ? 'Today (In Progress)' : undefined
    });
  }
  return result;
};

export const MOCK_DASHBOARD_DATA = {
  // 1. Summary Cards Data (Three core metrics + backwards compatibility)
  summary: {
    totalClients: 48,
    pendingDocuments: 47, // 14 Draft + 8 Info + 6 CA Review + 9 Party Review + 6 Payment + 4 Executing
    completedDocuments: 184, // Total all-time executed documents in vault
    // Kept for backwards compatibility with tests
    draftDocuments: 14,
    pendingApprovals: 15,
    pendingPayments: 6,
    completedInPeriod: {
      '30d': 42,
      '90d': 118,
      'fy': 184
    }
  },

  // 2. Needs Your Attention (Actionable alerts)
  attentionItems: [
    {
      id: 'att-1',
      clientId: 'cli-101',
      clientName: 'Acme Technologies Pvt Ltd',
      documentId: 'doc-201',
      documentTitle: 'FY 2025-26 Statutory Audit & Tax Audit 3CD',
      docRef: 'AUD-2026-081',
      stage: 'CA Review',
      status: 'Awaiting CA Review',
      waitingDuration: 'Waiting 2 days',
      waitingHours: 48,
      urgency: 'high',
      allowedAction: {
        label: 'Review Draft',
        actionKey: 'review_draft',
        route: '/ca/documents?docId=doc-201&action=review'
      }
    },
    {
      id: 'att-2',
      clientId: 'cli-102',
      clientName: 'Zenith Retail LLP',
      documentId: 'doc-202',
      documentTitle: 'GSTR-9 Annual Return Computation Sheet',
      docRef: 'GST-2026-104',
      stage: 'Corrections',
      status: 'Corrections Requested',
      waitingDuration: 'Waiting 18 hours',
      waitingHours: 18,
      urgency: 'medium',
      allowedAction: {
        label: 'Review Changes',
        actionKey: 'review_changes',
        route: '/ca/documents?docId=doc-202&action=changes'
      }
    },
    {
      id: 'att-3',
      clientId: 'cli-103',
      clientName: 'Dr. Vikram Sethi',
      documentId: 'doc-203',
      documentTitle: 'ITR-3 Professional Income Computation & Capital Gains',
      docRef: 'ITR-2026-312',
      stage: 'Party Review',
      status: 'Awaiting Client Approval',
      waitingDuration: 'Waiting 4 days',
      waitingHours: 96,
      urgency: 'high',
      reminderChannel: 'Portal / Email Notification',
      allowedAction: {
        label: 'Send Portal Reminder',
        actionKey: 'send_portal_reminder',
        notificationType: 'portal_email'
      }
    },
    {
      id: 'att-4',
      clientId: 'cli-104',
      clientName: 'Apex Logistics India Pvt Ltd',
      documentId: 'doc-204',
      documentTitle: 'Shareholders Resolution & Form MGT-14 Pack',
      docRef: 'ROC-2026-049',
      stage: 'Executing',
      status: 'eSign DSC Handshake Blocked',
      waitingDuration: 'Waiting 3 hours',
      waitingHours: 3,
      urgency: 'urgent',
      allowedAction: {
        label: 'Inspect Gateway Log',
        actionKey: 'inspect_gateway_log',
        route: '/ca/documents?docId=doc-204&action=inspect_dsc'
      }
    }
  ],

  // 3. Current Documents Breakdown (Horizontal Bar Chart)
  // Reconciles with Pending Documents (14 + 8 + 6 + 9 + 6 + 4 = 47)
  pipelineStages: [
    { id: 'draft', label: 'Draft', count: 14, color: '#64748b' },
    { id: 'awaiting_info', label: 'Awaiting Information', count: 8, color: '#f59e0b' },
    { id: 'ca_review', label: 'CA Review', count: 6, color: '#3b82f6' },
    { id: 'party_review', label: 'Party Review', count: 9, color: '#8b5cf6' },
    { id: 'awaiting_payment', label: 'Awaiting Payment', count: 6, color: '#ec4899' },
    { id: 'executing', label: 'Executing', count: 4, color: '#06b6d4' }
  ],

  // 4. Document Categories Created (Donut Chart Scope)
  // Total created across approved template catalog: 172
  categoriesCreated: [
    { category: 'Statutory Audit', count: 46, code: 'AUD', color: '#1d68ed' },
    { category: 'Tax Computation & ITR', count: 38, code: 'ITR', color: '#10b981' },
    { category: 'GST Annual & Monthly Returns', count: 32, code: 'GST', color: '#8b5cf6' },
    { category: 'ROC & Corporate Filings', count: 24, code: 'ROC', color: '#f59e0b' },
    { category: 'Certificates & Attestations', count: 18, code: 'CERT', color: '#06b6d4' },
    { category: 'LLP Agreements & Charters', count: 14, code: 'AGR', color: '#ec4899' }
  ],

  // 5. Activity by Granularity (Day / Month / Year)
  activityByGranularity: {
    // 30 calendar days including today
    day: generate30DaysActivity(new Date(2026, 10, 23)),

    // Current year through current month (Jan through Nov for 2026)
    month: [
      { label: 'Jan', monthIndex: 0, year: 2026, count: 24, isPartial: false },
      { label: 'Feb', monthIndex: 1, year: 2026, count: 28, isPartial: false },
      { label: 'Mar', monthIndex: 2, year: 2026, count: 45, isPartial: false },
      { label: 'Apr', monthIndex: 3, year: 2026, count: 18, isPartial: false },
      { label: 'May', monthIndex: 4, year: 2026, count: 22, isPartial: false },
      { label: 'Jun', monthIndex: 5, year: 2026, count: 25, isPartial: false },
      { label: 'Jul', monthIndex: 6, year: 2026, count: 21, isPartial: false },
      { label: 'Aug', monthIndex: 7, year: 2026, count: 28, isPartial: false },
      { label: 'Sep', monthIndex: 8, year: 2026, count: 38, isPartial: false },
      { label: 'Oct', monthIndex: 9, year: 2026, count: 46, isPartial: false },
      { label: 'Nov', monthIndex: 10, year: 2026, count: 34, isPartial: true, partialLabel: 'Current Month (In Progress)' }
    ],

    // Available history across years
    year: [
      { label: '2023', year: 2023, count: 198, isPartial: false },
      { label: '2024', year: 2024, count: 254, isPartial: false },
      { label: '2025', year: 2025, count: 318, isPartial: false },
      { label: '2026', year: 2026, count: 329, isPartial: true, partialLabel: 'Current Year (In Progress)' }
    ]
  },

  // Retain annualActivityByYear for backwards compatibility
  annualActivityByYear: {
    2026: [
      { month: 'Jan', monthIndex: 0, count: 24, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Feb', monthIndex: 1, count: 28, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Mar', monthIndex: 2, count: 45, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Apr', monthIndex: 3, count: 18, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'May', monthIndex: 4, count: 22, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Jun', monthIndex: 5, count: 25, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Jul', monthIndex: 6, count: 21, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Aug', monthIndex: 7, count: 28, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Sep', monthIndex: 8, count: 38, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Oct', monthIndex: 9, count: 46, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Nov', monthIndex: 10, count: 34, isElapsed: true, isFuture: false, isPartial: true, partialLabel: 'Current Month (In Progress)' },
      { month: 'Dec', monthIndex: 11, count: null, isElapsed: false, isFuture: true, isPartial: false, futureLabel: 'Future Month (Not Yet Elapsed)' }
    ],
    2025: [
      { month: 'Jan', monthIndex: 0, count: 20, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Feb', monthIndex: 1, count: 22, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Mar', monthIndex: 2, count: 40, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Apr', monthIndex: 3, count: 16, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'May', monthIndex: 4, count: 19, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Jun', monthIndex: 5, count: 22, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Jul', monthIndex: 6, count: 20, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Aug', monthIndex: 7, count: 25, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Sep', monthIndex: 8, count: 32, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Oct', monthIndex: 9, count: 38, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Nov', monthIndex: 10, count: 30, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Dec', monthIndex: 11, count: 34, isElapsed: true, isFuture: false, isPartial: false }
    ],
    2024: [
      { month: 'Jan', monthIndex: 0, count: 15, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Feb', monthIndex: 1, count: 18, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Mar', monthIndex: 2, count: 32, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Apr', monthIndex: 3, count: 12, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'May', monthIndex: 4, count: 15, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Jun', monthIndex: 5, count: 18, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Jul', monthIndex: 6, count: 16, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Aug', monthIndex: 7, count: 20, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Sep', monthIndex: 8, count: 26, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Oct', monthIndex: 9, count: 30, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Nov', monthIndex: 10, count: 24, isElapsed: true, isFuture: false, isPartial: false },
      { month: 'Dec', monthIndex: 11, count: 28, isElapsed: true, isFuture: false, isPartial: false }
    ]
  },

  // Backwards compatibility for existing activityTrends query
  activityTrends: {
    '30d': {
      weekly: [
        { period: '25 Oct - 31 Oct', count: 8, isPartial: false },
        { period: '01 Nov - 07 Nov', count: 11, isPartial: false },
        { period: '08 Nov - 14 Nov', count: 14, isPartial: false },
        { period: '15 Nov - 21 Nov', count: 9, isPartial: true, partialLabel: 'Current Week (In Progress)' }
      ],
      monthly: [
        { period: 'Nov 2026', count: 34, isPartial: true, partialLabel: 'Month in Progress' }
      ]
    },
    '90d': {
      weekly: [
        { period: 'Sep W3', count: 7, isPartial: false },
        { period: 'Sep W4', count: 9, isPartial: false },
        { period: 'Oct W1', count: 6, isPartial: false },
        { period: 'Oct W2', count: 8, isPartial: false },
        { period: 'Oct W3', count: 12, isPartial: false },
        { period: 'Oct W4', count: 10, isPartial: false },
        { period: 'Nov W1', count: 11, isPartial: false },
        { period: 'Nov W2', count: 14, isPartial: false },
        { period: 'Nov W3', count: 9, isPartial: true, partialLabel: 'Current Week (In Progress)' }
      ],
      monthly: [
        { period: 'Sep 2026', count: 38, isPartial: false },
        { period: 'Oct 2026', count: 46, isPartial: false },
        { period: 'Nov 2026', count: 34, isPartial: true, partialLabel: 'Month in Progress' }
      ]
    },
    'fy': {
      monthly: [
        { period: 'Apr 2026', count: 18, isPartial: false },
        { period: 'May 2026', count: 22, isPartial: false },
        { period: 'Jun 2026', count: 25, isPartial: false },
        { period: 'Jul 2026', count: 21, isPartial: false },
        { period: 'Aug 2026', count: 28, isPartial: false },
        { period: 'Sep 2026', count: 38, isPartial: false },
        { period: 'Oct 2026', count: 46, isPartial: false },
        { period: 'Nov 2026', count: 34, isPartial: true, partialLabel: 'Month in Progress' }
      ],
      weekly: [
        { period: 'Oct W3', count: 12, isPartial: false },
        { period: 'Oct W4', count: 10, isPartial: false },
        { period: 'Nov W1', count: 11, isPartial: false },
        { period: 'Nov W2', count: 14, isPartial: false },
        { period: 'Nov W3', count: 9, isPartial: true, partialLabel: 'Current Week' }
      ]
    }
  },

  // 6. Recent Documents Table
  recentDocuments: [
    {
      id: 'doc-201',
      title: 'FY 2025-26 Statutory Audit & Tax Audit 3CD',
      ref: 'AUD-2026-081',
      client: 'Acme Technologies Pvt Ltd',
      clientType: 'Private Limited',
      docType: 'Statutory Audit',
      documentStatus: 'Awaiting CA Review',
      statusCode: 'ca_review',
      paymentStatus: 'Paid',
      stampStatus: 'eStamped',
      signerStatus: 'Pending Partner Sign',
      lastUpdated: '2 hours ago',
      allowedActions: [
        { label: 'Review Draft', key: 'review_draft', primary: true },
        { label: 'View Details', key: 'view_details' }
      ]
    },
    {
      id: 'doc-202',
      title: 'GSTR-9 Annual Return Computation Sheet',
      ref: 'GST-2026-104',
      client: 'Zenith Retail LLP',
      clientType: 'LLP',
      docType: 'GST Compliance',
      documentStatus: 'Corrections Requested',
      statusCode: 'corrections',
      paymentStatus: 'Paid',
      stampStatus: 'Not Required',
      signerStatus: 'Pending Resubmission',
      lastUpdated: '5 hours ago',
      allowedActions: [
        { label: 'Review Changes', key: 'review_changes', primary: true },
        { label: 'View Details', key: 'view_details' }
      ]
    },
    {
      id: 'doc-203',
      title: 'ITR-3 Professional Income Computation & Capital Gains',
      ref: 'ITR-2026-312',
      client: 'Dr. Vikram Sethi',
      clientType: 'Individual / Professional',
      docType: 'Income Tax',
      documentStatus: 'Awaiting Party Approval',
      statusCode: 'party_review',
      paymentStatus: 'Pending',
      stampStatus: 'Not Applicable',
      signerStatus: 'Awaiting Client Review',
      lastUpdated: '1 day ago',
      allowedActions: [
        { label: 'View Approvals', key: 'view_approvals', primary: true },
        { label: 'Send Portal Reminder', key: 'send_portal_reminder' }
      ]
    },
    {
      id: 'doc-204',
      title: 'Shareholders Resolution & Form MGT-14 Pack',
      ref: 'ROC-2026-049',
      client: 'Apex Logistics India Pvt Ltd',
      clientType: 'Private Limited',
      docType: 'ROC Compliance',
      documentStatus: 'Executing (DSC Blocked)',
      statusCode: 'executing_issue',
      paymentStatus: 'Paid',
      stampStatus: 'eStamped',
      signerStatus: 'DSC Verification Error',
      lastUpdated: '2 days ago',
      allowedActions: [
        { label: 'Track Execution', key: 'track_execution', primary: true },
        { label: 'Inspect Gateway Log', key: 'inspect_log' }
      ]
    },
    {
      id: 'doc-205',
      title: 'Partnership Deed Supplementary Reconstitution',
      ref: 'AGR-2026-017',
      client: 'Horizon Enterprises',
      clientType: 'Partnership',
      docType: 'Deed / Agreement',
      documentStatus: 'In Draft',
      statusCode: 'draft',
      paymentStatus: 'Unbilled',
      stampStatus: 'Pending eStamp',
      signerStatus: 'Drafting',
      lastUpdated: '3 days ago',
      allowedActions: [
        { label: 'Continue Draft', key: 'continue_draft', primary: true },
        { label: 'View Details', key: 'view_details' }
      ]
    },
    {
      id: 'doc-206',
      title: 'Annual Audited Financial Statements FY 2024-25',
      ref: 'AUD-2026-054',
      client: 'BlueStar Freight LLP',
      clientType: 'LLP',
      docType: 'Statutory Audit',
      documentStatus: 'Completed & Filed',
      statusCode: 'completed',
      paymentStatus: 'Settled',
      stampStatus: 'eStamped',
      signerStatus: 'Fully Executed',
      lastUpdated: '4 days ago',
      allowedActions: [
        { label: 'Download Original', key: 'download_pdf', primary: true },
        { label: 'Audit Trail', key: 'audit_trail' }
      ]
    }
  ]
};
