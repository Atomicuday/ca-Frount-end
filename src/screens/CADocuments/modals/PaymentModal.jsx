import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Smartphone,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { caBillingService, formatINR } from '../../../services/api/caBillingService.js';

export default function PaymentModal({ isOpen, onClose, documentId, onPaymentSuccess }) {
  const [quote, setQuote] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment method: 'wallet' | 'upi' | 'cards' | 'netbanking'
  const [paymentMethod, setPaymentMethod] = useState('wallet');

  // Checkout lifecycle states: 'quote' | 'processing' | 'success' | 'failure'
  const [step, setStep] = useState('quote');
  const [isProcessing, setIsProcessing] = useState(false);
  const [settlementResult, setSettlementResult] = useState(null);

  const modalRef = useRef(null);

  // Load quote and wallet balance when modal opens
  useEffect(() => {
    if (!isOpen || !documentId) return;

    let active = true;
    setLoading(true);
    setError('');
    setStep('quote');
    setSettlementResult(null);

    Promise.all([
      caBillingService.getDocumentQuote(documentId),
      caBillingService.getWalletBalance()
    ])
      .then(([quoteData, walletData]) => {
        if (active) {
          setQuote(quoteData);
          setWallet(walletData);
          // Default to wallet if sufficient balance, else UPI
          if (walletData && walletData.availableBalancePaise >= quoteData.totalPayablePaise) {
            setPaymentMethod('wallet');
          } else {
            setPaymentMethod('upi');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load document payment quote:', err);
          setError(err.message || 'Unable to fetch authoritative price quote for this document.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, documentId]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape' && step !== 'processing') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, step, onClose]);

  if (!isOpen) return null;

  const totalPaise = quote?.totalPayablePaise || 0;
  const isWalletInsufficient =
    paymentMethod === 'wallet' && wallet && wallet.availableBalancePaise < totalPaise;

  const handlePay = async (e) => {
    if (e) e.preventDefault();
    if (!quote?.isPayable || isProcessing) return;

    if (paymentMethod === 'wallet' && isWalletInsufficient) {
      setError('Insufficient CA Wallet balance. Please add money or choose another payment method.');
      return;
    }

    setError('');
    setStep('processing');
    setIsProcessing(true);

    try {
      // 1. Create order through backend
      const order = await caBillingService.createDocumentPaymentOrder({
        docId: quote.docId,
        paymentMethod
      });

      // 2. Verified settlement handshake (1.2s delay for realism)
      setTimeout(async () => {
        try {
          const settlement = await caBillingService.verifyAndSettleDocumentPayment(order.orderId);
          setSettlementResult(settlement);
          setStep('success');
          setIsProcessing(false);
          if (onPaymentSuccess) {
            onPaymentSuccess(settlement.document, settlement);
          }
        } catch (settleErr) {
          console.error('Document payment settlement failed:', settleErr);
          setError(settleErr.message || 'Payment settlement verification failed.');
          setStep('failure');
          setIsProcessing(false);
        }
      }, 1200);
    } catch (orderErr) {
      console.error('Document order creation error:', orderErr);
      setError(orderErr.message || 'Unable to initialize payment checkout.');
      setStep('failure');
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="zd-modal-backdrop"
      onClick={step === 'processing' ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div
        className="zd-modal-card zd-glass-card zd-payment-modal-card"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        style={{ maxWidth: 640 }}
      >
        {/* Modal Header */}
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="zd-modal-icon-badge">
              <Receipt size={18} color="#2563eb" />
            </div>
            <div>
              <h2 className="zd-modal-title" id="payment-modal-title">
                Document Execution Checkout
              </h2>
              <p className="zd-modal-sub">
                Official statutory quote & verified settlement for {quote?.docRef || documentId}.
              </p>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              type="button"
              className="zd-modal-close-btn"
              onClick={onClose}
              aria-label="Close payment modal"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Loader2 size={36} className="spinning" color="#2563eb" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Fetching authoritative statutory price quote…
            </p>
          </div>
        ) : error && step !== 'failure' ? (
          <div style={{ padding: 24 }}>
            <div className="zd-modal-alert zd-modal-alert--error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <div className="zd-modal-actions" style={{ marginTop: 16 }}>
              <button type="button" className="zd-btn-action zd-btn-action--secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="zd-payment-modal-body">
            {/* STEP 1: Order Summary & Payment Method Selection */}
            {step === 'quote' && (
              <form onSubmit={handlePay}>
                {/* Already Paid & Status Banners */}
                {quote?.isPaid && (
                  <div
                    className={`zd-modal-alert ${
                      quote?.hasApproval ? 'zd-modal-alert--success' : 'zd-modal-alert--info'
                    }`}
                    style={{ marginBottom: 16 }}
                  >
                    {quote?.hasApproval ? (
                      <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    ) : (
                      <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    )}
                    <div>
                      <strong style={{ display: 'block', marginBottom: 2 }}>
                        {quote?.hasApproval
                          ? 'Payment Completed'
                          : 'Payment successful — awaiting final document approval.'}
                      </strong>
                      <span style={{ fontSize: 12.5 }}>
                        {quote?.hasApproval
                          ? 'This document execution packet has already been paid and verified.'
                          : 'Execution fee was already settled and verified. Signing link dispatch will unlock once the client approves this draft version.'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notice that payment can proceed ahead of client approval */}
                {!quote?.isPaid && !quote?.hasApproval && (
                  <div className="zd-modal-alert zd-modal-alert--info" style={{ marginBottom: 16 }}>
                    <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12.5 }}>
                      Payment can be settled now. Chargeable stamping and signing execution will remain on hold until final party approval is granted.
                    </span>
                  </div>
                )}

                {/* Order Summary Box */}
                <div className="zd-order-summary-box">
                  <div className="zd-order-header-row">
                    <div>
                      <span className="zd-order-label">Document Reference</span>
                      <strong className="zd-order-ref">{quote?.docRef} ({quote?.version})</strong>
                    </div>
                    <span className="zd-order-template-badge">{quote?.docType}</span>
                  </div>

                  <div className="zd-order-items-list">
                    {(quote?.items || []).map((item) => (
                      <div key={item.id} className="zd-order-item-row">
                        <div>
                          <span className="zd-item-label">{item.label}</span>
                          <span className="zd-item-sub">{item.description}</span>
                        </div>
                        <strong className="zd-item-amount">{formatINR(item.amountPaise)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="zd-order-total-divider" />
                  <div className="zd-order-total-row">
                    <div>
                      <strong style={{ fontSize: 14, color: '#0f172a' }}>Total Amount Payable</strong>
                      <span style={{ display: 'block', fontSize: 11.5, color: '#64748b' }}>
                        Includes all statutory taxes and government passthrough duty
                      </span>
                    </div>
                    <strong className="zd-order-grand-total">{formatINR(totalPaise)}</strong>
                  </div>
                </div>

                {/* Payment Methods Stack */}
                <div className="zd-payment-methods-section" style={{ marginTop: 18 }}>
                  <label className="zd-form-label" style={{ marginBottom: 8 }}>
                    Select Payment Method
                  </label>
                  <div className="zd-payment-methods-stack">
                    {/* Method 1: CA Wallet */}
                    <div
                      className={`zd-payment-method-item ${paymentMethod === 'wallet' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('wallet')}
                      role="radio"
                      aria-checked={paymentMethod === 'wallet'}
                      tabIndex={0}
                    >
                      <div className="zd-method-icon">
                        <Wallet size={18} color="#2563eb" />
                      </div>
                      <div className="zd-method-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="zd-method-title">CA Firm Wallet</span>
                          <span className="zd-recommended-badge">Fastest</span>
                        </div>
                        <span className="zd-method-desc">
                          Available balance: {formatINR(wallet?.availableBalancePaise || 0)}
                          {isWalletInsufficient && (
                            <span style={{ color: '#dc2626', fontWeight: 600, marginLeft: 4 }}>
                              (Insufficient Balance)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className={`zd-radio-dot ${paymentMethod === 'wallet' ? 'checked' : ''}`} />
                    </div>

                    {/* Method 2: UPI */}
                    <div
                      className={`zd-payment-method-item ${paymentMethod === 'upi' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('upi')}
                      role="radio"
                      aria-checked={paymentMethod === 'upi'}
                      tabIndex={0}
                    >
                      <div className="zd-method-icon">
                        <Smartphone size={18} color="#059669" />
                      </div>
                      <div className="zd-method-info">
                        <span className="zd-method-title">UPI Instant Gateway</span>
                        <span className="zd-method-desc">GPay, PhonePe, Paytm, BHIM and any mobile banking</span>
                      </div>
                      <div className={`zd-radio-dot ${paymentMethod === 'upi' ? 'checked' : ''}`} />
                    </div>

                    {/* Method 3: Cards */}
                    <div
                      className={`zd-payment-method-item ${paymentMethod === 'cards' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cards')}
                      role="radio"
                      aria-checked={paymentMethod === 'cards'}
                      tabIndex={0}
                    >
                      <div className="zd-method-icon">
                        <CreditCard size={18} color="#7c3aed" />
                      </div>
                      <div className="zd-method-info">
                        <span className="zd-method-title">Corporate Cards</span>
                        <span className="zd-method-desc">Visa, MasterCard, RuPay Corporate Credit/Debit</span>
                      </div>
                      <div className={`zd-radio-dot ${paymentMethod === 'cards' ? 'checked' : ''}`} />
                    </div>

                    {/* Method 4: Net Banking */}
                    <div
                      className={`zd-payment-method-item ${paymentMethod === 'netbanking' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('netbanking')}
                      role="radio"
                      aria-checked={paymentMethod === 'netbanking'}
                      tabIndex={0}
                    >
                      <div className="zd-method-icon">
                        <Building2 size={18} color="#0284c7" />
                      </div>
                      <div className="zd-method-info">
                        <span className="zd-method-title">Corporate Net Banking</span>
                        <span className="zd-method-desc">HDFC, ICICI, SBI, Axis and 50+ partner banks</span>
                      </div>
                      <div className={`zd-radio-dot ${paymentMethod === 'netbanking' ? 'checked' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Sandbox Info Notice */}
                <div className="zd-demo-badge-banner" style={{ marginTop: 14 }}>
                  <ShieldCheck size={14} color="#2563eb" />
                  <span>
                    <strong>Statutory Settlement Gateway:</strong> Zero raw credentials collected. Settlements are verified by the treasury gateway before execution packet release.
                  </span>
                </div>

                {/* Modal Footer Actions */}
                <div className="zd-modal-actions" style={{ marginTop: 18 }}>
                  <button type="button" className="zd-btn-action zd-btn-action--secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-confirm-doc-payment"
                    className="zd-btn-action zd-btn-action--primary"
                    disabled={!quote?.isPayable || quote?.isPaid || (paymentMethod === 'wallet' && isWalletInsufficient)}
                    title={
                      quote?.isPaid
                        ? 'Payment already settled for this document'
                        : isWalletInsufficient
                        ? 'Insufficient wallet balance'
                        : `Pay ${formatINR(totalPaise)}`
                    }
                  >
                    <span>
                      {quote?.isPaid
                        ? 'Payment Completed'
                        : `Pay ${formatINR(totalPaise)}`}
                    </span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Processing Payment State */}
            {step === 'processing' && (
              <div className="zd-topup-state-view" style={{ padding: '36px 16px' }}>
                <div className="zd-spinner-wrap">
                  <Loader2 size={44} className="spinning" color="#2563eb" />
                </div>
                <h3 style={{ margin: '16px 0 4px', fontSize: 17, color: '#0f172a' }}>
                  Verifying Treasury & Gateway Settlement…
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 400, textAlign: 'center', lineHeight: 1.5 }}>
                  Authorizing settlement of <strong>{formatINR(totalPaise)}</strong> for document{' '}
                  <strong style={{ color: '#0f172a' }}>{quote?.docRef}</strong> via{' '}
                  {paymentMethod === 'wallet' ? 'CA Firm Wallet' : 'Payment Gateway'}.
                </p>
                <span style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 12 }}>
                  Please do not refresh or close this window.
                </span>
              </div>
            )}

            {/* STEP 3: Successful Verified Payment State */}
            {step === 'success' && (
              <div className="zd-topup-state-view" style={{ padding: '24px 16px' }}>
                <div className="zd-success-check-badge">
                  <CheckCircle2 size={48} color="#16a34a" />
                </div>
                <h3 style={{ margin: '14px 0 4px', fontSize: 18, color: '#0f172a' }}>
                  {settlementResult?.hasPartyApproval
                    ? 'Payment Successful!'
                    : 'Payment successful — awaiting final document approval.'}
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 460 }}>
                  {settlementResult?.hasPartyApproval
                    ? `Execution fee of ${formatINR(totalPaise)} verified and settled. Execution packet is ready for signing link dispatch.`
                    : `Execution fee of ${formatINR(totalPaise)} verified and settled. Execution packet and signing link will be enabled automatically as soon as final document approval is completed.`}
                </p>

                <div className="zd-success-receipt-pill">
                  <div>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Receipt ID</span>
                    <strong style={{ fontSize: 13, fontFamily: 'monospace', color: '#0f172a' }}>
                      {settlementResult?.receiptId}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Settled Amount</span>
                    <strong style={{ fontSize: 15, color: '#16a34a' }}>
                      {formatINR(totalPaise)}
                    </strong>
                  </div>
                </div>

                <div className="zd-demo-notice-banner" style={{ marginTop: 16 }}>
                  <Info size={14} color="#1d4ed8" />
                  <span>
                    {settlementResult?.hasPartyApproval
                      ? 'The document has been locked and the execution packet is prepared. You can now dispatch the signing link to all signatories.'
                      : 'Payment is verified and recorded. Stamping and signing execution will remain on hold until final party approval is granted.'}
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-payment-done"
                  className="zd-btn-action zd-btn-action--primary"
                  style={{ width: '100%', marginTop: 20 }}
                  onClick={onClose}
                >
                  Done & Return to Documents
                </button>
              </div>
            )}

            {/* STEP 4: Failure State */}
            {step === 'failure' && (
              <div className="zd-topup-state-view" style={{ padding: '24px 16px' }}>
                <div className="zd-failed-icon-badge">
                  <AlertCircle size={48} color="#dc2626" />
                </div>
                <h3 style={{ margin: '14px 0 4px', fontSize: 18, color: '#0f172a' }}>
                  Payment Settlement Incomplete
                </h3>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                  {error || 'The payment gateway was unable to confirm settlement. No charges were made.'}
                </p>
                <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 12 }}>
                  <button
                    type="button"
                    className="zd-btn-action zd-btn-action--secondary"
                    style={{ flex: 1 }}
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="zd-btn-action zd-btn-action--primary"
                    style={{ flex: 1 }}
                    onClick={() => setStep('quote')}
                  >
                    Retry Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
