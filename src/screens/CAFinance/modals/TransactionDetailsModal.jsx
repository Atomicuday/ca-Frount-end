import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Download,
  Building,
  Calendar,
  AlertCircle,
  Clock,
  RefreshCw,
  Info,
  CheckCircle2
} from 'lucide-react';
import { formatINR, caBillingService } from '../../../services/api/caBillingService.js';

export default function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
  onStatusReconciled,
  onRetryTopUp
}) {
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileMessage, setReconcileMessage] = useState('');
  const [currentTxn, setCurrentTxn] = useState(transaction);

  useEffect(() => {
    setCurrentTxn(transaction);
    setReconcileMessage('');
    setIsReconciling(false);
  }, [transaction]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !currentTxn) return null;

  const isCredit = currentTxn.type === 'TOPUP' || currentTxn.type === 'REFUND';
  const hasReceipt = Boolean(currentTxn.receiptId && currentTxn.status === 'SETTLED');
  const isPending = currentTxn.status === 'PENDING';
  const isFailed = currentTxn.status === 'FAILED';
  const isCancelled = currentTxn.status === 'CANCELLED';

  const formattedDate = new Date(currentTxn.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCheckStatus = async () => {
    try {
      setIsReconciling(true);
      setReconcileMessage('');
      const res = await caBillingService.checkPaymentStatus(currentTxn.id);
      if (res.transaction) {
        setCurrentTxn(res.transaction);
      }
      setReconcileMessage(res.message || 'Payment status updated.');
      if (onStatusReconciled) {
        onStatusReconciled(res.transaction || currentTxn);
      }
    } catch (err) {
      setReconcileMessage(err.message || 'Unable to reconcile payment status.');
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div
      className="zd-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="txn-details-title"
    >
      <div
        className="zd-modal-card zd-glass-card zd-txn-details-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              className={`zd-modal-icon-badge ${
                isCredit ? 'zd-modal-icon-badge--green' : isFailed ? 'zd-modal-icon-badge--red' : ''
              }`}
            >
              <FileText
                size={18}
                color={isCredit ? '#16a34a' : isFailed ? '#dc2626' : '#2563eb'}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 className="zd-modal-title" id="txn-details-title">
                  {currentTxn.id}
                </h2>
                <span
                  className={`badge ${
                    currentTxn.status === 'SETTLED'
                      ? 'badge-success'
                      : currentTxn.status === 'PENDING'
                      ? 'badge-warning'
                      : currentTxn.status === 'FAILED'
                      ? 'badge-danger'
                      : currentTxn.status === 'CANCELLED'
                      ? 'badge-secondary'
                      : 'badge-info'
                  }`}
                >
                  {currentTxn.status === 'SETTLED'
                    ? 'Settled'
                    : currentTxn.status === 'PENDING'
                    ? 'Pending'
                    : currentTxn.status === 'FAILED'
                    ? 'Failed'
                    : currentTxn.status === 'CANCELLED'
                    ? 'Cancelled'
                    : currentTxn.status}
                </span>
              </div>
              <p className="zd-modal-sub">Official Platform Billing Record</p>
            </div>
          </div>
          <button
            type="button"
            className="zd-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="zd-modal-body zd-txn-details-body">
          {/* Hero Amount Card */}
          <div className="zd-txn-hero-amount-card">
            <span className="zd-txn-amount-type">
              {currentTxn.type === 'TOPUP'
                ? 'Credit to CA Wallet'
                : currentTxn.type === 'REFUND'
                ? 'Refund to CA Wallet'
                : 'Service Debit from CA Wallet'}
            </span>
            <div className="zd-txn-amount-value-row">
              <span className={`zd-txn-main-amount ${isCredit ? 'credit' : 'debit'}`}>
                {isCredit ? '+' : '−'}
                {formatINR(currentTxn.amountPaise)}
              </span>
            </div>
            <p className="zd-txn-desc-sub">{currentTxn.description}</p>
          </div>

          {/* Pending Alert & Action */}
          {isPending && (
            <div className="zd-modal-alert zd-modal-alert--warning" style={{ margin: '14px 0 4px' }}>
              <Clock size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: 13, marginBottom: 2 }}>
                  Settlement Confirmation Pending
                </strong>
                <span style={{ fontSize: 12, lineHeight: 1.45, display: 'block' }}>
                  This payment has been submitted to the gateway. Settlement confirmation from the bank has not been received yet. Reconcile below to verify whether the funds have settled.
                </span>
              </div>
            </div>
          )}

          {/* Failed Alert & Safe Explanation */}
          {isFailed && (
            <div className="zd-modal-alert zd-modal-alert--error" style={{ margin: '14px 0 4px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: 13, marginBottom: 2 }}>
                  Transaction Failed
                </strong>
                <span style={{ fontSize: 12, lineHeight: 1.45, display: 'block' }}>
                  {currentTxn.failureReason ||
                    'Payment authorization failed or timed out at the banking gateway. No funds were debited from your firm account.'}
                </span>
              </div>
            </div>
          )}

          {/* Cancelled Alert */}
          {isCancelled && (
            <div className="zd-modal-alert zd-modal-alert--info" style={{ margin: '14px 0 4px' }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: 13, marginBottom: 2 }}>
                  Order Cancelled
                </strong>
                <span style={{ fontSize: 12, lineHeight: 1.45, display: 'block' }}>
                  {currentTxn.failureReason ||
                    'This order was cancelled by the user prior to gateway settlement. No charges were incurred.'}
                </span>
              </div>
            </div>
          )}

          {reconcileMessage && (
            <div className="zd-modal-alert zd-modal-alert--info" style={{ margin: '8px 0' }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>{reconcileMessage}</span>
            </div>
          )}

          {/* Detailed Metadata Grid */}
          <div className="zd-txn-meta-grid">
            <div className="zd-txn-meta-item">
              <div className="zd-meta-label">
                <Calendar size={13} />
                <span>Timestamp</span>
              </div>
              <strong className="zd-meta-val">{formattedDate}</strong>
            </div>

            <div className="zd-txn-meta-item">
              <div className="zd-meta-label">
                <Building size={13} />
                <span>Payment Source</span>
              </div>
              <strong className="zd-meta-val">{currentTxn.paymentSource}</strong>
            </div>

            <div className="zd-txn-meta-item">
              <div className="zd-meta-label">
                <span>Gateway / UTR Ref</span>
              </div>
              <strong className="zd-meta-val font-mono">{currentTxn.providerRef || '—'}</strong>
            </div>

            <div className="zd-txn-meta-item">
              <div className="zd-meta-label">
                <span>Document Reference</span>
              </div>
              <strong className="zd-meta-val font-mono">
                {currentTxn.docRef ? (
                  <span style={{ color: '#2563eb' }}>{currentTxn.docRef}</span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>N/A (Wallet Top-up)</span>
                )}
              </strong>
            </div>
          </div>

          {/* Line Item Fee Breakdown */}
          {currentTxn.breakdown && (
            <div className="zd-txn-breakdown-box">
              <div className="zd-breakdown-title">Service Charge & Statutory Breakdown</div>
              <div className="zd-breakdown-row">
                <span>Base Platform Charge</span>
                <span>{formatINR(currentTxn.breakdown.basePaise)}</span>
              </div>
              {currentTxn.breakdown.gstPaise > 0 && (
                <div className="zd-breakdown-row">
                  <span>GST (18% Statutory Rate)</span>
                  <span>{formatINR(currentTxn.breakdown.gstPaise)}</span>
                </div>
              )}
              {currentTxn.breakdown.stampDutyPaise > 0 && (
                <div className="zd-breakdown-row zd-breakdown-row--highlight">
                  <div>
                    <span>Government Stamp Duty</span>
                    <span className="zd-stamp-duty-hint">Non-taxable statutory passthrough</span>
                  </div>
                  <span>{formatINR(currentTxn.breakdown.stampDutyPaise)}</span>
                </div>
              )}
              <div className="zd-breakdown-divider" />
              <div className="zd-breakdown-row zd-breakdown-row--total">
                <strong>Total Transaction Amount</strong>
                <strong>{formatINR(currentTxn.amountPaise)}</strong>
              </div>
            </div>
          )}

          {/* Tax Invoice Summary Box - ONLY rendered when actual receipt exists */}
          {hasReceipt && (
            <div className="zd-receipt-preview-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#64748b',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {currentTxn.type === 'REFUND' ? 'Official Credit Note' : 'Official Tax Invoice / Receipt'}
                  </span>
                  <strong style={{ display: 'block', fontSize: 13, color: '#0f172a', marginTop: 2 }}>
                    Invoice #{currentTxn.receiptId}
                  </strong>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontWeight: 600
                  }}
                >
                  SAC 998311
                </span>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                Issued to R. Sharma & Associates (ICAI Reg # 014229S). GSTIN: 29AAACZ1122D1Z4.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="zd-modal-actions" style={{ marginTop: 'auto', flexShrink: 0 }}>
          <button
            type="button"
            className="zd-btn-action zd-btn-action--secondary"
            onClick={onClose}
          >
            Close
          </button>

          {isPending && (
            <button
              type="button"
              id="btn-reconcile-details"
              className="zd-btn-action zd-btn-action--primary"
              onClick={handleCheckStatus}
              disabled={isReconciling}
            >
              <RefreshCw size={14} className={isReconciling ? 'spinning' : ''} />
              <span>{isReconciling ? 'Checking Gateway…' : 'Check Payment Status'}</span>
            </button>
          )}

          {isFailed && onRetryTopUp && (
            <button
              type="button"
              className="zd-btn-action zd-btn-action--primary"
              onClick={() => {
                onClose();
                onRetryTopUp();
              }}
            >
              <span>Retry Top-up</span>
            </button>
          )}

          {hasReceipt && (
            <button
              type="button"
              className="zd-btn-action zd-btn-action--primary"
              onClick={handlePrintReceipt}
            >
              <Download size={15} />
              <span>Download Official Receipt</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
