/**
 * Mock fixtures for CA Wallet & ZapDocs Billing
 * All monetary amounts are represented as integer minor units (paise: ₹1 = 100 paise).
 * Scoped strictly to CA firm account "R. Sharma & Associates" (ICAI Firm Reg # 014229S).
 */

export const INITIAL_WALLET_STATE = {
  accountNumber: 'ZD-WAL-56291',
  firmId: 'FIRM-014229S',
  firmName: 'R. Sharma & Associates',
  caName: 'CA Rajesh Sharma, FCA',
  availableBalancePaise: 845000, // ₹8,450.00
  reservedBalancePaise: 120000,  // ₹1,200.00 (held for in-flight eSign & eStamp executions)
  currency: 'INR',
  minLimitPaise: 10000,          // Min top-up: ₹100
  maxLimitPaise: 10000000,       // Max top-up: ₹1,00,000
  isDemoState: true,
  provider: 'ZapDocs PayGateway (Razorpay / Cashfree Certified Partner)',
  lastReconciledAt: '2026-11-24T16:30:00Z'
};

export const WALLET_LIMITS = {
  minPaise: 10000,
  maxPaise: 10000000,
  minRupees: 100,
  maxRupees: 100000
};

export const INITIAL_BILLING_TRANSACTIONS = [
  {
    id: 'TXN-ZD-88450',
    date: '2026-11-24T10:15:00Z',
    description: 'Wallet Top-up (Awaiting Gateway Confirmation)',
    docRef: null,
    type: 'TOPUP',
    amountPaise: 100000, // ₹1,000.00
    paymentSource: 'UPI (Awaiting Gateway)',
    status: 'PENDING',
    providerRef: 'UPI-PEND-88450',
    serviceCategory: 'TOPUP',
    breakdown: {
      basePaise: 100000,
      gstPaise: 0,
      stampDutyPaise: 0
    },
    receiptId: null,
    recoveryAction: 'check_status'
  },
  {
    id: 'TXN-ZD-88421',
    date: '2026-11-21T16:30:00Z',
    description: 'Wallet Top-up',
    docRef: null,
    type: 'TOPUP', // Credit
    amountPaise: 200000, // ₹2,000.00
    paymentSource: 'UPI (PhonePe / HDFC)',
    status: 'SETTLED',
    providerRef: 'UPI-RR-9021884321',
    serviceCategory: 'TOPUP',
    breakdown: {
      basePaise: 200000,
      gstPaise: 0,
      stampDutyPaise: 0
    },
    receiptId: 'ZD-RCP-2026-1142'
  },
  {
    id: 'TXN-ZD-88390',
    date: '2026-11-19T14:15:00Z',
    description: 'eStamp Duty & Statutory Stamping',
    docRef: 'AUD-2026-081',
    type: 'SERVICE_DEBIT', // Debit
    amountPaise: 53000, // ₹530.00
    paymentSource: 'Wallet',
    status: 'SETTLED',
    providerRef: 'SHCIL-KA-881204',
    serviceCategory: 'ESTAMP',
    breakdown: {
      basePaise: 2542,
      gstPaise: 458,
      stampDutyPaise: 50000 // ₹500.00 Govt Duty + ₹30 Service Fee (incl 18% GST)
    },
    receiptId: 'ZD-INV-2026-9021'
  },
  {
    id: 'TXN-ZD-88352',
    date: '2026-11-18T11:45:00Z',
    description: 'Class-3 DSC eSign Verification Handshake',
    docRef: 'AUD-2026-081',
    type: 'SERVICE_DEBIT', // Debit
    amountPaise: 11800, // ₹118.00
    paymentSource: 'Wallet',
    status: 'SETTLED',
    providerRef: 'EMUDHRA-ES-44102',
    serviceCategory: 'ESIGN',
    breakdown: {
      basePaise: 10000,
      gstPaise: 1800,
      stampDutyPaise: 0
    },
    receiptId: 'ZD-INV-2026-8994'
  },
  {
    id: 'TXN-ZD-88310',
    date: '2026-11-15T09:20:00Z',
    description: 'Aadhaar OTP eSign Quota Debit',
    docRef: 'GST-2026-104',
    type: 'SERVICE_DEBIT', // Debit
    amountPaise: 5900, // ₹59.00
    paymentSource: 'Wallet',
    status: 'SETTLED',
    providerRef: 'NSDL-ESIGN-33910',
    serviceCategory: 'ESIGN',
    breakdown: {
      basePaise: 5000,
      gstPaise: 900,
      stampDutyPaise: 0
    },
    receiptId: 'ZD-INV-2026-8951'
  },
  {
    id: 'TXN-ZD-88285',
    date: '2026-11-12T17:00:00Z',
    description: 'Refund: Duplicate DSC Gateway Timed Out',
    docRef: 'ROC-2026-049',
    type: 'REFUND', // Credit
    amountPaise: 11800, // ₹118.00
    paymentSource: 'Wallet',
    status: 'SETTLED',
    providerRef: 'REFUND-GATEWAY-1102',
    serviceCategory: 'REFUND',
    breakdown: {
      basePaise: 10000,
      gstPaise: 1800,
      stampDutyPaise: 0
    },
    receiptId: 'ZD-CN-2026-0042'
  },
  {
    id: 'TXN-ZD-88240',
    date: '2026-11-10T12:30:00Z',
    description: 'Statutory ROC MCA Form MGT-14 Template Pack Fee',
    docRef: 'ROC-2026-049',
    type: 'SERVICE_DEBIT', // Debit
    amountPaise: 35400, // ₹354.00
    paymentSource: 'Wallet',
    status: 'SETTLED',
    providerRef: 'ZD-SRV-90112',
    serviceCategory: 'OTHER',
    breakdown: {
      basePaise: 30000,
      gstPaise: 5400,
      stampDutyPaise: 0
    },
    receiptId: 'ZD-INV-2026-8876'
  },
  {
    id: 'TXN-ZD-88210',
    date: '2026-11-08T14:10:00Z',
    description: 'Wallet Top-up (Cancelled by CA)',
    docRef: null,
    type: 'TOPUP',
    amountPaise: 200000,
    paymentSource: 'Net Banking (User Cancelled)',
    status: 'CANCELLED',
    providerRef: 'CANC-ORD-88210',
    serviceCategory: 'TOPUP',
    breakdown: {
      basePaise: 200000,
      gstPaise: 0,
      stampDutyPaise: 0
    },
    receiptId: null,
    failureReason: 'Top-up order was cancelled by user prior to gateway authorization.'
  },
  {
    id: 'TXN-ZD-88190',
    date: '2026-11-05T10:00:00Z',
    description: 'Wallet Top-up',
    docRef: null,
    type: 'TOPUP', // Credit
    amountPaise: 500000, // ₹5,000.00
    paymentSource: 'Net Banking (ICICI Corporate)',
    status: 'SETTLED',
    providerRef: 'NETBK-ICICI-449102',
    serviceCategory: 'TOPUP',
    breakdown: {
      basePaise: 500000,
      gstPaise: 0,
      stampDutyPaise: 0
    },
    receiptId: 'ZD-RCP-2026-1090'
  },
  {
    id: 'TXN-ZD-88150',
    date: '2026-10-28T15:20:00Z',
    description: 'eStamp Duty & Supplementary Deed Stamping',
    docRef: 'AGR-2026-017',
    type: 'SERVICE_DEBIT', // Debit
    amountPaise: 105300, // ₹1,053.00
    paymentSource: 'Wallet',
    status: 'SETTLED',
    providerRef: 'SHCIL-KA-776101',
    serviceCategory: 'ESTAMP',
    breakdown: {
      basePaise: 4492,
      gstPaise: 808,
      stampDutyPaise: 100000 // ₹1,000.00 Govt duty + ₹53 Platform & GST
    },
    receiptId: 'ZD-INV-2026-8710'
  },
  {
    id: 'TXN-ZD-88110',
    date: '2026-10-20T11:00:00Z',
    description: 'Class-3 DSC Token Verification Fee',
    docRef: 'AUD-2026-054',
    type: 'SERVICE_DEBIT', // Debit
    amountPaise: 11800, // ₹118.00
    paymentSource: 'Wallet',
    status: 'SETTLED',
    providerRef: 'EMUDHRA-ES-33120',
    serviceCategory: 'ESIGN',
    breakdown: {
      basePaise: 10000,
      gstPaise: 1800,
      stampDutyPaise: 0
    },
    receiptId: 'ZD-INV-2026-8640'
  },
  {
    id: 'TXN-ZD-88099',
    date: '2026-10-15T16:45:00Z',
    description: 'Wallet Top-up (Bank Gateway Failure)',
    docRef: null,
    type: 'TOPUP',
    amountPaise: 100000,
    paymentSource: 'UPI (Google Pay)',
    status: 'FAILED',
    providerRef: 'UPI-FAIL-402',
    serviceCategory: 'TOPUP',
    breakdown: {
      basePaise: 100000,
      gstPaise: 0,
      stampDutyPaise: 0
    },
    receiptId: null,
    failureReason: 'Bank gateway timeout during second-factor authorization.'
  }
];

export const PAYMENT_METHODS = [
  {
    id: 'upi',
    name: 'UPI (Instant Settlement)',
    description: 'Google Pay, PhonePe, Paytm, CRED or any bank UPI app / QR',
    icon: 'Smartphone',
    isRecommended: true
  },
  {
    id: 'netbanking',
    name: 'Corporate Net Banking',
    description: 'HDFC, ICICI, SBI, Axis, Kotak and 50+ supported Indian banks',
    icon: 'Building2',
    isRecommended: false
  },
  {
    id: 'card',
    name: 'Business Debit / Corporate Credit Card',
    description: 'Visa, MasterCard, RuPay (Commercial / Corporate Cards)',
    icon: 'CreditCard',
    isRecommended: false
  }
];

export const SUGGESTED_TOPUP_AMOUNTS = [500, 1000, 2000, 5000];
