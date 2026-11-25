/**
 * CA Billing & Wallet API Service
 * Handles firm wallet ledger, top-up lifecycle, verified settlement,
 * and ZapDocs platform spending reconciliation.
 *
 * Rules:
 * - All monetary values stored as integer minor units (paise: ₹1 = 100 paise).
 * - Top-ups are credits, never spending.
 * - Wallet is credited ONLY upon backend-verified settlement handshake.
 * - Client retainers and CA-to-client invoices are strictly excluded.
 */
import { api } from './client.js';
import {
  INITIAL_WALLET_STATE,
  INITIAL_BILLING_TRANSACTIONS,
  PAYMENT_METHODS,
  SUGGESTED_TOPUP_AMOUNTS,
  WALLET_LIMITS
} from '../../mock/caBillingData.js';

let walletStore = { ...INITIAL_WALLET_STATE };
let transactionsStore = [...INITIAL_BILLING_TRANSACTIONS];
let settledOrderIds = new Set();
let pendingOrdersStore = new Map();

/**
 * Calculate Indian Financial Year (April 1 – March 31).
 * E.g., Nov 2026 -> 'FY 2026-27', Jan 2026 -> 'FY 2025-26'.
 */
export function getCurrentFinancialYear(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-based: 3 is April
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = (startYear + 1).toString().slice(-2);
  return `FY ${startYear}-${endYearShort}`;
}

/**
 * Format integer paise into standard Indian Rupee string (e.g. ₹1,250.00).
 */
export function formatINR(paise, showDecimals = true) {
  if (typeof paise !== 'number' || isNaN(paise)) return '₹0.00';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(rupees);
}

export const caBillingService = {
  /**
   * Authorize firm access. Rejects unauthorized firm IDs to ensure tenant isolation.
   */
  assertFirmAuthorization: (firmId) => {
    if (firmId && firmId !== walletStore.firmId && firmId !== 'FIRM-014229S') {
      throw new Error('Unauthorized access: Cannot access wallet belonging to another firm.');
    }
    return true;
  },

  /**
   * Get wallet balance and reservation metadata.
   */
  getWalletBalance: async (firmId = null) => {
    if (firmId) {
      caBillingService.assertFirmAuthorization(firmId);
    }
    try {
      const res = await api.get('/ca/billing/wallet');
      if (res && res.availableBalancePaise !== undefined) {
        return res;
      }
    } catch {
      // Prototype fallback
    }
    return { ...walletStore };
  },

  /**
   * Get wallet transaction limits.
   */
  getWalletLimits: () => {
    return { ...WALLET_LIMITS };
  },

  /**
   * Get supported payment checkout methods.
   */
  getPaymentMethods: async () => {
    return [...PAYMENT_METHODS];
  },

  /**
   * Suggested quick top-up amounts (in Rupees).
   */
  getSuggestedAmounts: () => {
    return [...SUGGESTED_TOPUP_AMOUNTS];
  },

  /**
   * Demo adapter helper: simulate gateway outcomes.
   * Scenarios: 'SUCCESS' | 'PENDING' | 'FAILED'
   */
  setDemoScenarioForOrder: (orderId, scenario) => {
    const order = pendingOrdersStore.get(orderId);
    if (order) {
      order.simulatedOutcome = scenario;
    }
  },

  /**
   * Create a top-up checkout order.
   * Does NOT credit the wallet. Only creates a pending order to be settled.
   */
  createTopUpOrder: async ({ amountRupees, paymentMethod = 'upi', idempotencyKey = null }) => {
    const rupees = Number(amountRupees);
    if (!rupees || rupees < 100 || rupees > 100000) {
      throw new Error('Top-up amount must be between ₹100 and ₹1,00,000.');
    }

    const amountPaise = Math.round(rupees * 100);
    const orderId = idempotencyKey || `ORD-TOP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Check if this idempotency key was already created/settled
    if (settledOrderIds.has(orderId)) {
      throw new Error('This transaction order was already settled.');
    }

    const order = {
      orderId,
      amountPaise,
      amountRupees: rupees,
      currency: 'INR',
      paymentMethod,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      upiVpa: 'zapdocs.billing@hdfcbank',
      qrPayload: `upi://pay?pa=zapdocs.billing@hdfcbank&pn=ZapDocs%20Technologies&am=${rupees}&cu=INR&tr=${orderId}`
    };

    pendingOrdersStore.set(orderId, order);
    return order;
  },

  /**
   * Backend-verified settlement handshake.
   * Credits the wallet ONLY after verified settlement.
   * Prevents duplicate credits.
   */
  verifyAndSettleTopUp: async (orderId) => {
    if (!orderId) throw new Error('Order reference is required for verification.');

    if (settledOrderIds.has(orderId)) {
      throw new Error('Duplicate settlement attempt: this order has already been credited.');
    }

    const pendingOrder = pendingOrdersStore.get(orderId);
    if (!pendingOrder) {
      throw new Error('Order not found or expired. Please initiate a new top-up.');
    }

    // 1. Simulate gateway settlement verification
    const txnId = `TXN-ZD-${Math.floor(89000 + Math.random() * 9000)}`;
    const settledTxn = {
      id: txnId,
      date: new Date().toISOString(),
      description: 'Wallet Top-up',
      docRef: null,
      type: 'TOPUP',
      amountPaise: pendingOrder.amountPaise,
      paymentSource: pendingOrder.paymentMethod === 'upi' ? 'UPI (Verified Gateway)' : pendingOrder.paymentMethod === 'netbanking' ? 'Net Banking' : 'Corporate Card',
      status: 'SETTLED',
      providerRef: `GATEWAY-SETTLE-${orderId.substring(8)}`,
      serviceCategory: 'TOPUP',
      breakdown: {
        basePaise: pendingOrder.amountPaise,
        gstPaise: 0,
        stampDutyPaise: 0
      },
      receiptId: `ZD-RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };

    // 2. State mutation: Credit wallet & record in transaction ledger
    walletStore.availableBalancePaise += pendingOrder.amountPaise;
    walletStore.lastReconciledAt = new Date().toISOString();
    transactionsStore = [settledTxn, ...transactionsStore];

    // 3. Mark as settled to prevent replay attacks
    settledOrderIds.add(orderId);
    pendingOrdersStore.delete(orderId);

    return {
      success: true,
      status: 'SETTLED',
      transaction: settledTxn,
      newAvailableBalancePaise: walletStore.availableBalancePaise,
      message: `Top-up of ${formatINR(pendingOrder.amountPaise)} verified and settled successfully.`
    };
  },

  /**
   * Calculate spending summary strictly for ZapDocs document services in period.
   * Top-ups are credits and are strictly excluded from spending totals.
   */
  getSpendingSummary: async (period = 'current_fy') => {
    // Reconcile directly against settled service debits
    const now = new Date();
    const currentYear = now.getFullYear();

    const filteredDebits = transactionsStore.filter((t) => {
      if (t.type !== 'SERVICE_DEBIT' || t.status !== 'SETTLED') return false;
      const tDate = new Date(t.date);

      if (period === 'this_month') {
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === currentYear;
      }
      if (period === 'last_30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return tDate >= thirtyDaysAgo;
      }
      if (period === 'current_fy') {
        // FY starts April 1
        const fyStart = now.getMonth() >= 3 ? new Date(currentYear, 3, 1) : new Date(currentYear - 1, 3, 1);
        return tDate >= fyStart;
      }
      return true; // all_time
    });

    let totalSpendPaise = 0;
    let esignSpendPaise = 0;
    let estampSpendPaise = 0;
    let otherSpendPaise = 0;
    let stampDutyPassthroughPaise = 0;

    filteredDebits.forEach((t) => {
      totalSpendPaise += t.amountPaise;
      if (t.serviceCategory === 'ESIGN') {
        esignSpendPaise += t.amountPaise;
      } else if (t.serviceCategory === 'ESTAMP') {
        estampSpendPaise += t.amountPaise;
        if (t.breakdown?.stampDutyPaise) {
          stampDutyPassthroughPaise += t.breakdown.stampDutyPaise;
        }
      } else {
        otherSpendPaise += t.amountPaise;
      }
    });

    // Check refunds in period
    const refundsInPeriod = transactionsStore.filter((t) => {
      if (t.type !== 'REFUND' || t.status !== 'SETTLED') return false;
      const tDate = new Date(t.date);
      if (period === 'this_month') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === currentYear;
      if (period === 'last_30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return tDate >= thirtyDaysAgo;
      }
      if (period === 'current_fy') {
        const fyStart = now.getMonth() >= 3 ? new Date(currentYear, 3, 1) : new Date(currentYear - 1, 3, 1);
        return tDate >= fyStart;
      }
      return true;
    }).reduce((acc, t) => acc + t.amountPaise, 0);

    const netSpendPaise = Math.max(0, totalSpendPaise - refundsInPeriod);
    const currentFY = getCurrentFinancialYear(now);
    const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    return {
      period,
      periodLabel:
        period === 'this_month'
          ? `This Month (${monthName})`
          : period === 'last_30d'
          ? 'Last 30 Days'
          : period === 'current_fy'
          ? `Current ${currentFY}`
          : 'All Time History',
      totalSpendPaise,
      netSpendPaise,
      isGross: true,
      esignSpendPaise,
      estampSpendPaise,
      otherSpendPaise,
      stampDutyPassthroughPaise,
      refundsPaise: refundsInPeriod
    };
  },

  /**
   * Check status of a pending top-up payment order or transaction.
   * Reconciles gateway settlement without creating duplicate charges.
   */
  checkPaymentStatus: async (orderOrTxnId) => {
    if (!orderOrTxnId) throw new Error('Order or transaction reference is required.');

    // 1. If it's in pendingOrdersStore:
    if (pendingOrdersStore.has(orderOrTxnId)) {
      const pendingOrder = pendingOrdersStore.get(orderOrTxnId);
      if (pendingOrder.simulatedOutcome === 'FAILED') {
        pendingOrdersStore.delete(orderOrTxnId);
        const failedTxn = {
          id: `TXN-FAIL-${orderOrTxnId.slice(-6)}`,
          date: new Date().toISOString(),
          description: 'Wallet Top-up (Gateway Rejected)',
          docRef: null,
          type: 'TOPUP',
          amountPaise: pendingOrder.amountPaise,
          paymentSource: pendingOrder.paymentMethod === 'upi' ? 'UPI' : 'Bank Gateway',
          status: 'FAILED',
          providerRef: `FAIL-${orderOrTxnId}`,
          serviceCategory: 'TOPUP',
          breakdown: { basePaise: pendingOrder.amountPaise, gstPaise: 0, stampDutyPaise: 0 },
          receiptId: null,
          failureReason: 'Transaction was declined by payment gateway.'
        };
        transactionsStore = [failedTxn, ...transactionsStore];
        return {
          status: 'FAILED',
          message: 'Payment verification failed: Gateway declined transaction.',
          transaction: failedTxn
        };
      }
      if (pendingOrder.simulatedOutcome === 'PENDING') {
        return {
          status: 'PENDING',
          message: 'Payment is still awaiting gateway confirmation.',
          order: pendingOrder
        };
      }
      // Default / Success: settle the order
      return await caBillingService.verifyAndSettleTopUp(orderOrTxnId);
    }

    // 2. If it was already settled
    if (settledOrderIds.has(orderOrTxnId)) {
      const txn = transactionsStore.find((t) => t.providerRef?.includes(orderOrTxnId) || t.id === orderOrTxnId);
      return {
        status: 'SETTLED',
        message: 'This payment has already been verified and settled.',
        transaction: txn
      };
    }

    // 3. If it's a pending transaction in transactionsStore (e.g. TXN-ZD-88450)
    const existingTxn = transactionsStore.find((t) => t.id === orderOrTxnId);
    if (existingTxn) {
      if (existingTxn.status === 'PENDING') {
        // Reconcile pending transaction
        existingTxn.status = 'SETTLED';
        existingTxn.receiptId = `ZD-RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        existingTxn.reconciledAt = new Date().toISOString();
        if (existingTxn.type === 'TOPUP') {
          walletStore.availableBalancePaise += existingTxn.amountPaise;
          walletStore.lastReconciledAt = new Date().toISOString();
        }
        return {
          status: 'SETTLED',
          message: `Transaction ${orderOrTxnId} reconciled and settled successfully.`,
          transaction: existingTxn,
          newAvailableBalancePaise: walletStore.availableBalancePaise
        };
      }
      return {
        status: existingTxn.status,
        message: `Transaction is currently ${existingTxn.status}.`,
        transaction: existingTxn
      };
    }

    throw new Error('Payment order not found or expired.');
  },

  /**
   * Cancel an active pending top-up order.
   * Records as CANCELLED in transaction history without charging or crediting wallet.
   */
  cancelTopUpOrder: async (orderId) => {
    if (!orderId) throw new Error('Order reference is required.');
    const order = pendingOrdersStore.get(orderId);
    if (!order) {
      throw new Error('Order not found or already closed.');
    }

    const cancelledTxn = {
      id: `TXN-ZD-${Math.floor(88000 + Math.random() * 999)}`,
      date: new Date().toISOString(),
      description: 'Wallet Top-up (Cancelled by CA)',
      docRef: null,
      type: 'TOPUP',
      amountPaise: order.amountPaise,
      paymentSource: order.paymentMethod === 'upi' ? 'UPI' : 'Bank Gateway',
      status: 'CANCELLED',
      providerRef: `CANC-${orderId.slice(-8)}`,
      serviceCategory: 'TOPUP',
      breakdown: { basePaise: order.amountPaise, gstPaise: 0, stampDutyPaise: 0 },
      receiptId: null,
      failureReason: 'Top-up order cancelled by user before authorization.'
    };

    transactionsStore = [cancelledTxn, ...transactionsStore];
    pendingOrdersStore.delete(orderId);

    return {
      success: true,
      status: 'CANCELLED',
      message: 'Top-up order was cancelled.',
      transaction: cancelledTxn
    };
  },

  /**
   * Search, filter, and paginate ZapDocs platform billing transactions.
   */
  getTransactions: async ({
    search = '',
    service = 'ALL',
    type = 'ALL',
    status = 'ALL',
    page = 1,
    limit = 6
  } = {}) => {
    let results = [...transactionsStore];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.docRef && t.docRef.toLowerCase().includes(q)) ||
          (t.providerRef && t.providerRef.toLowerCase().includes(q))
      );
    }

    if (service && service !== 'ALL') {
      results = results.filter((t) => t.serviceCategory === service);
    }

    if (type && type !== 'ALL') {
      results = results.filter((t) => t.type === type);
    }

    if (status && status !== 'ALL') {
      results = results.filter((t) => t.status === status);
    }

    const total = results.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = results.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages
    };
  },

  /**
   * Get transaction details with breakdown.
   */
  getTransactionById: async (id) => {
    return transactionsStore.find((t) => t.id === id) || null;
  },

  /**
   * Get authoritative itemized pricing quote for a document.
   * Do not hardcode prices in browser or calculate stamp duty client-side.
   */
  getDocumentQuote: async (documentId) => {
    let doc = null;
    try {
      const docRes = await api.get(`/ca/documents/${documentId}`);
      if (docRes && docRes.document) doc = docRes.document;
    } catch {
      // Prototype fallback
    }

    if (!doc) {
      const { caDocumentsService } = await import('./caDocumentsService.js');
      doc = await caDocumentsService.getDocumentById(documentId);
    }

    if (!doc) throw new Error('Document not found for billing quotation.');

    const requiresStamp =
      doc.execution?.stampRequired ??
      (doc.docType?.includes('Audit') || doc.docType?.includes('Deed') || doc.docType?.includes('ROC'));

    const signersCount = doc.execution?.signers?.length || 2;
    const esignPaise = signersCount * 15000; // ₹150 per signer
    const stampDutyPaise = requiresStamp ? 50000 : 0; // ₹500 govt duty passthrough
    const stampFeePaise = requiresStamp ? 10000 : 0; // ₹100 stamping facilitation
    const platformPaise = 25000; // ₹250 platform fee
    const taxablePaise = esignPaise + stampFeePaise + platformPaise;
    const gstPaise = Math.round(taxablePaise * 0.18); // 18% statutory GST on service components
    const totalPayablePaise = esignPaise + stampDutyPaise + stampFeePaise + platformPaise + gstPaise;

    const isPaid = doc.payment?.status === 'PAID';
    const hasApproval = Boolean(doc.clientApproval?.isApproved);

    // Revised requirement: Payment is allowed after Accept or Reject without waiting for fresh party approval.
    // If already paid, payment is disabled to prevent duplicate charges.
    const isPayable = !isPaid;
    const blockingReason = isPaid
      ? 'Document fee has already been paid and settled.'
      : null;

    return {
      docId: doc.id,
      docRef: doc.ref,
      version: doc.version || 'v1',
      title: doc.title,
      docType: doc.docType,
      requiresStamp,
      isPayable,
      blockingReason,
      isPaid,
      hasApproval,
      existingPayment: isPaid ? doc.payment : null,
      items: [
        {
          id: 'esign',
          label: `eSign Verification Charges (${signersCount} Signers)`,
          description: 'Aadhaar OTP & Class-3 digital certificate verification',
          amountPaise: esignPaise
        },
        ...(requiresStamp
          ? [
              {
                id: 'stamp_duty',
                label: 'Government Stamp Duty (Passthrough)',
                description: 'Official state non-judicial eStamp duty (exempt from GST)',
                amountPaise: stampDutyPaise
              },
              {
                id: 'stamp_fee',
                label: 'eStamping Facilitation Fee',
                description: 'State treasury gateway handshake and eStamp certificate stamping',
                amountPaise: stampFeePaise
              }
            ]
          : []),
        {
          id: 'platform',
          label: 'Platform Infrastructure Service Fee',
          description: 'Statutory practice workflow, audit log persistence & secure vault storage',
          amountPaise: platformPaise
        },
        {
          id: 'gst',
          label: 'Statutory GST (18%)',
          description: '18% GST on platform, eSign & facilitation charges',
          amountPaise: gstPaise
        }
      ],
      totalPayablePaise,
      currency: 'INR'
    };
  },

  /**
   * Create payment order for document execution fee.
   */
  createDocumentPaymentOrder: async ({ docId, paymentMethod = 'wallet', idempotencyKey = null }) => {
    const quote = await caBillingService.getDocumentQuote(docId);

    if (quote.isPaid) {
      throw new Error('This document execution packet has already been paid for.');
    }

    if (!quote.isPayable) {
      throw new Error(quote.blockingReason || 'Document is not currently eligible for payment settlement.');
    }

    const orderId = idempotencyKey || `ORD-DOC-PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    if (settledOrderIds.has(orderId)) {
      throw new Error('This document payment order was already settled.');
    }

    const order = {
      orderId,
      docId,
      docRef: quote.docRef,
      amountPaise: quote.totalPayablePaise,
      paymentMethod,
      quote,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    pendingOrdersStore.set(orderId, order);
    return order;
  },

  /**
   * Verify and settle document payment order.
   * Debits wallet if wallet chosen, records transaction in billing ledger,
   * marks document as paid, and transitions to execution preparation.
   */
  verifyAndSettleDocumentPayment: async (orderId) => {
    if (!orderId) throw new Error('Order reference required for settlement.');

    if (settledOrderIds.has(orderId)) {
      throw new Error('Duplicate settlement attempt: this document payment order was already settled.');
    }

    const pendingOrder = pendingOrdersStore.get(orderId);
    if (!pendingOrder) {
      throw new Error('Document payment order not found or expired.');
    }

    const { docId, amountPaise, paymentMethod, docRef, quote } = pendingOrder;

    // Check CA Wallet balance if wallet method was chosen
    if (paymentMethod === 'wallet') {
      if (walletStore.availableBalancePaise < amountPaise) {
        throw new Error(
          `Insufficient CA Wallet balance (${formatINR(walletStore.availableBalancePaise)}). Required: ${formatINR(
            amountPaise
          )}. Please add money or choose another payment method.`
        );
      }
      // Debit CA Wallet
      walletStore.availableBalancePaise -= amountPaise;
      walletStore.lastReconciledAt = new Date().toISOString();
    }

    const txnId = `TXN-DOC-${Math.floor(70000 + Math.random() * 20000)}`;
    const receiptId = `ZD-RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const settledTxn = {
      id: txnId,
      date: new Date().toISOString(),
      description: `Execution Fee – ${docRef}`,
      docRef,
      type: 'SERVICE_DEBIT',
      amountPaise,
      paymentSource:
        paymentMethod === 'wallet'
          ? 'CA Firm Wallet'
          : paymentMethod === 'upi'
          ? 'UPI Gateway (Verified)'
          : paymentMethod === 'netbanking'
          ? 'Corporate Net Banking'
          : 'Corporate Card',
      status: 'SETTLED',
      providerRef: `SETTLE-DOC-${orderId.substring(12)}`,
      serviceCategory: quote?.requiresStamp ? 'ESTAMP' : 'ESIGN',
      breakdown: {
        basePaise: quote?.items?.find((i) => i.id === 'platform')?.amountPaise || 25000,
        gstPaise: quote?.items?.find((i) => i.id === 'gst')?.amountPaise || 0,
        stampDutyPaise: quote?.items?.find((i) => i.id === 'stamp_duty')?.amountPaise || 0
      },
      receiptId
    };

    transactionsStore = [settledTxn, ...transactionsStore];
    settledOrderIds.add(orderId);
    pendingOrdersStore.delete(orderId);

    // Update document in caDocumentsService
    const { caDocumentsService } = await import('./caDocumentsService.js');
    const doc = await caDocumentsService.getDocumentById(docId);
    let hasPartyApproval = false;
    if (doc) {
      doc.payment = {
        status: 'PAID',
        amountPaise,
        orderId,
        receiptId,
        method: paymentMethod,
        paidAt: new Date().toISOString()
      };

      hasPartyApproval = Boolean(doc.clientApproval?.isApproved);

      if (hasPartyApproval) {
        // Document was already party-approved: lock and prepare execution packet
        doc.statusDetails = {
          ...doc.statusDetails,
          paymentStatus: 'Paid',
          stampStatus: doc.execution?.stampRequired ? 'eStamped' : 'Not Required',
          signerStatus: 'Execution Packet Ready'
        };
        doc.stage = 'Ready to Invite';
        doc.status = 'Ready for Execution';
        doc.statusCode = 'executing';
        if (doc.execution) {
          doc.execution.isLocked = true;
          doc.execution.packetReady = true;
          if (doc.execution.stampRequired) {
            doc.execution.stampStatus = 'ISSUED';
            doc.execution.stampCertificateNo = `IN-KA${Math.floor(1000000000 + Math.random() * 9000000000)}M`;
          }
        }
        doc.allowedSendAction = {
          ...doc.allowedSendAction,
          actionKey: 'send_invitation',
          label: 'Send Signing Link'
        };
      } else {
        // Separation of Payment & Execution:
        // Do NOT mark document approved or locked merely because it is paid.
        // Do NOT start chargeable stamping or signing until required approvals pass.
        doc.statusDetails = {
          ...doc.statusDetails,
          paymentStatus: 'Paid',
          signerStatus: 'Awaiting Final Document Approval'
        };
        doc.stage = 'Payment Verified';
        doc.status = 'Paid / Awaiting Approval';
        if (doc.execution) {
          doc.execution.isLocked = false;
          doc.execution.packetReady = false;
        }
        doc.allowedSendAction = {
          ...doc.allowedSendAction,
          actionKey: 'awaiting_approval',
          label: 'Awaiting Document Approval'
        };
      }
    }

    return {
      success: true,
      receiptId,
      transaction: settledTxn,
      document: doc,
      amountPaise,
      newWalletBalancePaise: walletStore.availableBalancePaise,
      hasPartyApproval,
      message: hasPartyApproval
        ? `Payment of ${formatINR(amountPaise)} successfully verified and settled. Execution packet ready.`
        : 'Payment successful — awaiting final document approval.'
    };
  }
};

export default caBillingService;
