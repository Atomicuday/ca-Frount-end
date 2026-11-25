import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  QrCode,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Clock,
  Ban
} from 'lucide-react';
import { caBillingService, formatINR } from '../../../services/api/caBillingService.js';
import { PAYMENT_METHODS, SUGGESTED_TOPUP_AMOUNTS, WALLET_LIMITS } from '../../../mock/caBillingData.js';

export default function AddMoneyModal({
  isOpen,
  onClose,
  onSuccess,
  currentBalancePaise = 0,
  initialAmount = null
}) {
  const [amount, setAmount] = useState('2000');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiOption, setUpiOption] = useState('qr'); // 'qr' | 'vpa'
  const [vpaId, setVpaId] = useState('');

  // Top-up lifecycle states: 'input' | 'awaiting_payment' | 'processing' | 'pending' | 'success' | 'failed' | 'cancelled'
  const [step, setStep] = useState('input');
  const [activeOrder, setActiveOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingNotice, setPendingNotice] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [settledResult, setSettledResult] = useState(null);

  const amountInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      const startAmount = initialAmount && Number(initialAmount) >= 100 ? initialAmount.toString() : '2000';
      setAmount(startAmount);
      setPaymentMethod('upi');
      setUpiOption('qr');
      setVpaId('');
      setErrorMessage('');
      setPendingNotice('');
      setActiveOrder(null);
      setSettledResult(null);
      setIsCheckingStatus(false);
      setTimeout(() => amountInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialAmount]);

  // Handle Escape key
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

  const numericAmount = Number(amount) || 0;
  const minRupees = WALLET_LIMITS.minRupees;
  const maxRupees = WALLET_LIMITS.maxRupees;

  // Step 1: Create Order and Transition to Provider Hosted Checkout
  const handleProceedToPayment = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!numericAmount || numericAmount < minRupees) {
      setErrorMessage(`Minimum top-up amount is ₹${minRupees}.`);
      return;
    }
    if (numericAmount > maxRupees) {
      setErrorMessage(`Maximum single top-up limit is ₹${maxRupees.toLocaleString('en-IN')}.`);
      return;
    }

    if (paymentMethod === 'upi' && upiOption === 'vpa' && (!vpaId || !vpaId.includes('@'))) {
      setErrorMessage('Please enter a valid UPI ID (e.g. username@okhdfcbank).');
      return;
    }

    try {
      setStep('processing');
      const order = await caBillingService.createTopUpOrder({
        amountRupees: numericAmount,
        paymentMethod
      });
      setActiveOrder(order);
      setStep('awaiting_payment');
    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'Unable to create payment order.');
      setStep('input');
    }
  };

  // Step 2a: Simulate Verified Settlement
  const handleSimulateSuccess = async () => {
    if (!activeOrder) return;
    setErrorMessage('');
    setStep('processing');

    setTimeout(async () => {
      try {
        const settlement = await caBillingService.verifyAndSettleTopUp(activeOrder.orderId);
        setSettledResult(settlement);
        setStep('success');
        if (onSuccess) {
          onSuccess(settlement.transaction, settlement.newAvailableBalancePaise, settlement.message);
        }
      } catch (err) {
        console.error('Settlement error:', err);
        setErrorMessage(err.message || 'Payment settlement verification failed.');
        setStep('failed');
      }
    }, 1100);
  };

  // Step 2b: Simulate Pending Gateway Outcome
  const handleSimulatePending = () => {
    if (!activeOrder) return;
    caBillingService.setDemoScenarioForOrder(activeOrder.orderId, 'PENDING');
    setStep('pending');
    setPendingNotice('Transaction is registered with the gateway. Awaiting bank confirmation.');
  };

  // Step 2c: Simulate Gateway Failure
  const handleSimulateFailure = () => {
    if (!activeOrder) return;
    caBillingService.setDemoScenarioForOrder(activeOrder.orderId, 'FAILED');
    setStep('processing');

    setTimeout(async () => {
      try {
        await caBillingService.checkPaymentStatus(activeOrder.orderId);
      } catch {
        // expected failure in status check
      }
      setErrorMessage('Bank gateway timed out during authorization. No funds were debited.');
      setStep('failed');
    }, 900);
  };

  // Step 2d: Cancel Order
  const handleCancelOrder = async () => {
    if (!activeOrder) {
      onClose();
      return;
    }
    try {
      await caBillingService.cancelTopUpOrder(activeOrder.orderId);
      setStep('cancelled');
    } catch {
      onClose();
    }
  };

  // Step 3: Check Payment Status for Pending Orders
  const handleCheckStatus = async () => {
    if (!activeOrder) return;
    try {
      setIsCheckingStatus(true);
      setPendingNotice('');
      const res = await caBillingService.checkPaymentStatus(activeOrder.orderId);
      if (res.status === 'SETTLED') {
        setSettledResult(res);
        setStep('success');
        if (onSuccess) {
          onSuccess(res.transaction, res.newAvailableBalancePaise, res.message);
        }
      } else if (res.status === 'FAILED') {
        setErrorMessage(res.message || 'Payment failed.');
        setStep('failed');
      } else {
        setPendingNotice('Bank has not settled this order yet. You can check again or close to reconcile later.');
      }
    } catch (err) {
      setPendingNotice(err.message || 'Unable to verify status at this moment.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div
      className="zd-modal-backdrop"
      onClick={step === 'processing' ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-money-modal-title"
    >
      <div
        className="zd-modal-card zd-glass-card zd-add-money-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="zd-modal-icon-badge">
              <Smartphone size={18} color="#2563eb" />
            </div>
            <div>
              <h2 className="zd-modal-title" id="add-money-modal-title">
                {step === 'awaiting_payment'
                  ? 'Payment Gateway Checkout'
                  : step === 'pending'
                  ? 'Payment Status Pending'
                  : 'Add Money to CA Wallet'}
              </h2>
              <p className="zd-modal-sub">
                {step === 'awaiting_payment'
                  ? `Order Ref: ${activeOrder?.orderId || 'PENDING'}`
                  : step === 'pending'
                  ? 'Awaiting authoritative settlement from your bank'
                  : 'Recharge firm balance to fund in-flight eSign & eStamp executions.'}
              </p>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              type="button"
              className="zd-modal-close-btn"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Demo Simulation Notice Banner */}
        <div className="zd-demo-badge-banner">
          <ShieldCheck size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>Provider-Hosted Checkout Abstraction:</strong> Zero raw card or bank credentials collected. Balance is credited strictly upon backend settlement handshake.
          </span>
        </div>

        {errorMessage && (
          <div className="zd-modal-alert zd-modal-alert--error" style={{ marginBottom: 14 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Form Input */}
        {step === 'input' && (
          <form onSubmit={handleProceedToPayment} className="zd-modal-body zd-add-money-form">
            {/* Current Balance Row */}
            <div className="zd-wallet-current-info-bar">
              <span style={{ fontSize: 12.5, color: '#64748b' }}>Current Available Balance:</span>
              <strong style={{ fontSize: 14, color: '#0f172a' }}>{formatINR(currentBalancePaise)}</strong>
            </div>

            {/* Amount Field */}
            <div className="zd-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label htmlFor="input-topup-amount" className="zd-form-label" style={{ margin: 0 }}>
                  Enter Amount (INR) <span className="zd-required-star">*</span>
                </label>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>
                  Min ₹{minRupees} • Max ₹{maxRupees.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="zd-amount-input-wrap">
                <span className="zd-amount-symbol">₹</span>
                <input
                  ref={amountInputRef}
                  id="input-topup-amount"
                  type="number"
                  min={minRupees}
                  max={maxRupees}
                  step="50"
                  className="zd-amount-input"
                  placeholder="2,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Quick Amount Suggestion Chips */}
              <div className="zd-suggested-chips-row">
                {SUGGESTED_TOPUP_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`zd-suggested-chip ${numericAmount === amt ? 'selected' : ''}`}
                    onClick={() => setAmount(amt.toString())}
                  >
                    +₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="zd-form-field" style={{ marginTop: 8 }}>
              <label className="zd-form-label">Select Payment Method</label>
              <div className="zd-payment-methods-stack">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = paymentMethod === method.id;
                  return (
                    <div
                      key={method.id}
                      className={`zd-payment-method-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod(method.id)}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                    >
                      <div className="zd-method-icon">
                        {method.id === 'upi' ? (
                          <Smartphone size={18} color="#2563eb" />
                        ) : method.id === 'netbanking' ? (
                          <Building2 size={18} color="#059669" />
                        ) : (
                          <CreditCard size={18} color="#7c3aed" />
                        )}
                      </div>
                      <div className="zd-method-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="zd-method-title">{method.name}</span>
                          {method.isRecommended && (
                            <span className="zd-recommended-badge">Recommended</span>
                          )}
                        </div>
                        <span className="zd-method-desc">{method.description}</span>
                      </div>
                      <div className={`zd-radio-dot ${isSelected ? 'checked' : ''}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sub-options for UPI */}
            {paymentMethod === 'upi' && (
              <div className="zd-upi-sub-panel">
                <div className="zd-upi-tabs">
                  <button
                    type="button"
                    className={`zd-upi-tab ${upiOption === 'qr' ? 'active' : ''}`}
                    onClick={() => setUpiOption('qr')}
                  >
                    <QrCode size={14} />
                    <span>Instant UPI QR</span>
                  </button>
                  <button
                    type="button"
                    className={`zd-upi-tab ${upiOption === 'vpa' ? 'active' : ''}`}
                    onClick={() => setUpiOption('vpa')}
                  >
                    <Smartphone size={14} />
                    <span>Enter UPI ID</span>
                  </button>
                </div>

                {upiOption === 'qr' ? (
                  <div className="zd-upi-qr-preview-box">
                    <div className="zd-qr-placeholder">
                      <QrCode size={60} color="#0f172a" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong style={{ fontSize: 13, color: '#0f172a', display: 'block' }}>
                        Scan & Pay ₹{numericAmount.toLocaleString('en-IN')}
                      </strong>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>
                        Supports GPay, PhonePe, Paytm, BHIM and mobile banking.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="zd-form-field" style={{ marginTop: 8 }}>
                    <label htmlFor="input-vpa-id" className="zd-form-label" style={{ fontSize: 11.5 }}>
                      Virtual Payment Address (UPI ID)
                    </label>
                    <input
                      id="input-vpa-id"
                      type="text"
                      className="zd-form-input"
                      placeholder="e.g. ca.rajesh@okhdfcbank"
                      value={vpaId}
                      onChange={(e) => setVpaId(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Order Total & Fee Summary Box before Confirmation */}
            <div className="zd-order-fee-summary" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#64748b', marginBottom: 4 }}>
                <span>Top-up Amount:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>₹{numericAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#64748b', marginBottom: 6 }}>
                <span>Convenience / Gateway Fee:</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>₹0.00 (Free)</span>
              </div>
              <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0 8px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                <span>Total Payable:</span>
                <span style={{ color: '#2563eb' }}>₹{numericAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="zd-modal-actions" style={{ marginTop: 'auto', flexShrink: 0, paddingTop: 16 }}>
              <button
                type="button"
                className="zd-btn-action zd-btn-action--secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-confirm-topup"
                className="zd-btn-action zd-btn-action--primary"
                disabled={!numericAmount || numericAmount < minRupees || numericAmount > maxRupees}
              >
                <span>Continue to Payment</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Awaiting Payment in Provider-Hosted Checkout */}
        {step === 'awaiting_payment' && activeOrder && (
          <div className="zd-modal-body zd-checkout-step">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                Provider-Hosted Checkout
              </span>
              <h3 style={{ margin: '4px 0 6px', fontSize: 18, color: '#0f172a' }}>
                Awaiting Payment: ₹{activeOrder.amountRupees.toLocaleString('en-IN')}
              </h3>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                Order <span className="font-mono">{activeOrder.orderId}</span> • Method:{' '}
                {activeOrder.paymentMethod.toUpperCase()}
              </p>
            </div>

            {/* Provider simulator action card */}
            <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldCheck size={16} color="#2563eb" />
                <strong style={{ fontSize: 13, color: '#0f172a' }}>
                  Gateway Sandbox Simulation Controls
                </strong>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Simulate your payment gateway response to verify backend ledger reconciliation, pending status handling, or failure recovery without real money movement:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  id="btn-simulate-settle"
                  className="zd-btn-action zd-btn-action--primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleSimulateSuccess}
                >
                  <CheckCircle2 size={15} />
                  <span>Simulate Successful Settlement (₹{activeOrder.amountRupees})</span>
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    id="btn-simulate-pending"
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: 12, padding: '8px 10px' }}
                    onClick={handleSimulatePending}
                  >
                    <Clock size={14} />
                    <span>Simulate Pending</span>
                  </button>

                  <button
                    type="button"
                    id="btn-simulate-failure"
                    className="btn btn-outline"
                    style={{ flex: 1, fontSize: 12, padding: '8px 10px', color: '#dc2626', borderColor: '#fca5a5' }}
                    onClick={handleSimulateFailure}
                  >
                    <AlertCircle size={14} />
                    <span>Simulate Gateway Fail</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="zd-modal-actions" style={{ marginTop: 'auto', flexShrink: 0, paddingTop: 10 }}>
              <button
                type="button"
                className="zd-btn-action zd-btn-action--secondary"
                onClick={handleCancelOrder}
              >
                Cancel Payment Order
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Pending Outcome with Status Check */}
        {step === 'pending' && (
          <div className="zd-topup-state-view">
            <div className="zd-pending-icon-badge" style={{ width: 54, height: 54, borderRadius: '50%', background: '#fffbeb', border: '1.5px solid #fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Clock size={32} color="#d97706" />
            </div>
            <h3 style={{ margin: '14px 0 4px', fontSize: 17, color: '#0f172a' }}>
              Awaiting Gateway Settlement
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748b', textAlign: 'center', maxWidth: 400, lineHeight: 1.5 }}>
              Payment order <strong className="font-mono">{activeOrder?.orderId}</strong> is registered. The bank has not sent the settlement callback yet.
            </p>

            {pendingNotice && (
              <div className="zd-modal-alert zd-modal-alert--info" style={{ marginBottom: 14, width: '100%' }}>
                <span>{pendingNotice}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                type="button"
                id="btn-modal-check-status"
                className="zd-btn-action zd-btn-action--primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
              >
                <RefreshCw size={15} className={isCheckingStatus ? 'spinning' : ''} />
                <span>{isCheckingStatus ? 'Checking Settlement…' : 'Check Payment Status'}</span>
              </button>

              <button
                type="button"
                className="zd-btn-action zd-btn-action--secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onClose}
              >
                Close & Check Later from Transactions
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Processing Payment Handshake */}
        {step === 'processing' && (
          <div className="zd-topup-state-view">
            <div className="zd-spinner-wrap">
              <Loader2 size={42} className="spinning" color="#2563eb" />
            </div>
            <h3 style={{ margin: '14px 0 4px', fontSize: 16, color: '#0f172a' }}>
              Verifying Payment Settlement…
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b', maxWidth: 360, textAlign: 'center', lineHeight: 1.5 }}>
              Connecting with Payment Gateway to verify settlement for order{' '}
              <strong style={{ color: '#0f172a' }}>{activeOrder?.orderId}</strong>.
            </p>
            <span style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 12 }}>
              Please do not refresh or close this window.
            </span>
          </div>
        )}

        {/* STEP 5: Successful Verified Credit */}
        {step === 'success' && (
          <div className="zd-topup-state-view">
            <div className="zd-success-check-badge">
              <CheckCircle2 size={44} color="#16a34a" />
            </div>
            <h3 style={{ margin: '14px 0 4px', fontSize: 17, color: '#0f172a' }}>
              Wallet Credited Successfully!
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
              {settledResult?.message || `₹${numericAmount.toLocaleString('en-IN')} has been added to your balance.`}
            </p>

            <div className="zd-success-receipt-pill">
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>New Available Balance</span>
                <strong style={{ fontSize: 16, color: '#16a34a' }}>
                  {formatINR(settledResult?.newAvailableBalancePaise)}
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Transaction Ref</span>
                <strong style={{ fontSize: 12.5, fontFamily: 'monospace', color: '#0f172a' }}>
                  {settledResult?.transaction?.id}
                </strong>
              </div>
            </div>

            <button
              type="button"
              id="btn-topup-done"
              className="zd-btn-action zd-btn-action--primary"
              style={{ width: '100%', marginTop: 18 }}
              onClick={onClose}
            >
              Done & Return
            </button>
          </div>
        )}

        {/* STEP 6: Failed State */}
        {step === 'failed' && (
          <div className="zd-topup-state-view">
            <div className="zd-failed-icon-badge">
              <AlertCircle size={44} color="#dc2626" />
            </div>
            <h3 style={{ margin: '14px 0 4px', fontSize: 17, color: '#0f172a' }}>
              Top-up Verification Failed
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
              {errorMessage || 'The payment gateway was unable to confirm settlement.'}
            </p>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button
                type="button"
                className="zd-btn-action zd-btn-action--secondary"
                style={{ flex: 1 }}
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="button"
                className="zd-btn-action zd-btn-action--primary"
                style={{ flex: 1 }}
                onClick={() => setStep('input')}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: Cancelled State */}
        {step === 'cancelled' && (
          <div className="zd-topup-state-view">
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <Ban size={28} color="#64748b" />
            </div>
            <h3 style={{ margin: '14px 0 4px', fontSize: 17, color: '#0f172a' }}>
              Payment Cancelled
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
              The payment order was cancelled. No money was deducted from your account.
            </p>
            <button
              type="button"
              className="zd-btn-action zd-btn-action--secondary"
              style={{ width: '100%' }}
              onClick={onClose}
            >
              Return to Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
