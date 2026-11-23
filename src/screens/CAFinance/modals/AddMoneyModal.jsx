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
  ArrowRight
} from 'lucide-react';
import { caBillingService, formatINR } from '../../../services/api/caBillingService.js';
import { PAYMENT_METHODS, SUGGESTED_TOPUP_AMOUNTS } from '../../../mock/caBillingData.js';

export default function AddMoneyModal({ isOpen, onClose, onSuccess, currentBalancePaise = 0 }) {
  const [amount, setAmount] = useState('2000');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiOption, setUpiOption] = useState('qr'); // 'qr' | 'vpa'
  const [vpaId, setVpaId] = useState('');

  // Top-up lifecycle states: 'input' | 'processing' | 'success' | 'failed'
  const [step, setStep] = useState('input');
  const [activeOrder, setActiveOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [settledResult, setSettledResult] = useState(null);

  const amountInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount('2000');
      setPaymentMethod('upi');
      setUpiOption('qr');
      setVpaId('');
      setErrorMessage('');
      setActiveOrder(null);
      setSettledResult(null);
      setTimeout(() => amountInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

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

  // Handle order creation and simulated verified settlement
  const handleProceedToPayment = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!numericAmount || numericAmount < 100) {
      setErrorMessage('Minimum top-up amount is ₹100.');
      return;
    }
    if (numericAmount > 100000) {
      setErrorMessage('Maximum single top-up limit is ₹1,00,000.');
      return;
    }

    if (paymentMethod === 'upi' && upiOption === 'vpa' && (!vpaId || !vpaId.includes('@'))) {
      setErrorMessage('Please enter a valid UPI ID (e.g. username@okhdfcbank).');
      return;
    }

    try {
      setStep('processing');

      // 1. Create top-up order via service
      const order = await caBillingService.createTopUpOrder({
        amountRupees: numericAmount,
        paymentMethod
      });
      setActiveOrder(order);

      // 2. Simulate payment settlement handshake (1.2s delay for realism)
      setTimeout(async () => {
        try {
          const settlement = await caBillingService.verifyAndSettleTopUp(order.orderId);
          setSettledResult(settlement);
          setStep('success');
          if (onSuccess) {
            onSuccess(settlement.transaction, settlement.newAvailableBalancePaise, settlement.message);
          }
        } catch (settleErr) {
          console.error('Settlement error:', settleErr);
          setErrorMessage(settleErr.message || 'Settlement verification failed.');
          setStep('failed');
        }
      }, 1200);
    } catch (err) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'Unable to create payment order.');
      setStep('input');
    }
  };

  return (
    <div className="zd-modal-backdrop" onClick={step === 'processing' ? undefined : onClose} role="dialog" aria-modal="true" aria-labelledby="add-money-modal-title">
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
                Add Money to CA Wallet
              </h2>
              <p className="zd-modal-sub">
                Recharge your firm balance to fund in-flight eSign & eStamp executions.
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
          <ShieldCheck size={15} color="#2563eb" />
          <span>
            <strong>Verified Billing Sandbox:</strong> Real-time settlement simulation. Monetary balances are isolated to your firm account.
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
          <form onSubmit={handleProceedToPayment} className="zd-add-money-form">
            {/* Current Balance Row */}
            <div className="zd-wallet-current-info-bar">
              <span style={{ fontSize: 12.5, color: '#64748b' }}>Current Available Balance:</span>
              <strong style={{ fontSize: 14, color: '#0f172a' }}>{formatINR(currentBalancePaise)}</strong>
            </div>

            {/* Amount Field */}
            <div className="zd-form-field">
              <label htmlFor="input-topup-amount" className="zd-form-label">
                Enter Amount (INR) <span className="zd-required-star">*</span>
              </label>
              <div className="zd-amount-input-wrap">
                <span className="zd-amount-symbol">₹</span>
                <input
                  ref={amountInputRef}
                  id="input-topup-amount"
                  type="number"
                  min="100"
                  max="100000"
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
            <div className="zd-form-field" style={{ marginTop: 6 }}>
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
                      <QrCode size={64} color="#0f172a" />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <strong style={{ fontSize: 13, color: '#0f172a', display: 'block' }}>
                        Scan & Pay ₹{numericAmount.toLocaleString('en-IN')}
                      </strong>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>
                        Supports GPay, PhonePe, Paytm, BHIM and any mobile banking app.
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

            {/* Modal Actions */}
            <div className="zd-modal-actions" style={{ marginTop: 16 }}>
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
                disabled={!numericAmount || numericAmount < 100}
              >
                <span>Continue to Pay ₹{numericAmount.toLocaleString('en-IN')}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Processing Payment Handshake */}
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

        {/* STEP 3: Successful Verified Credit */}
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
              className="zd-btn-action zd-btn-action--primary"
              style={{ width: '100%', marginTop: 18 }}
              onClick={onClose}
            >
              Done & Return to Billing
            </button>
          </div>
        )}

        {/* STEP 4: Failed State */}
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
      </div>
    </div>
  );
}
