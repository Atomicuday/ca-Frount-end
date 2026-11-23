import React, { useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Building,
  Calendar
} from 'lucide-react';
import { formatINR } from '../../../services/api/caBillingService.js';

export default function TransactionDetailsModal({ isOpen, onClose, transaction }) {
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

  if (!isOpen || !transaction) return null;

  const isCredit = transaction.type === 'TOPUP' || transaction.type === 'REFUND';
  const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="zd-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="txn-details-title">
      <div
        className="zd-modal-card zd-glass-card zd-txn-details-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`zd-modal-icon-badge ${isCredit ? 'zd-modal-icon-badge--green' : ''}`}>
              <FileText size={18} color={isCredit ? '#16a34a' : '#2563eb'} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 className="zd-modal-title" id="txn-details-title">
                  {transaction.id}
                </h2>
                <span
                  className={`badge ${
                    transaction.status === 'SETTLED'
                      ? 'badge-success'
                      : transaction.status === 'FAILED'
                      ? 'badge-warning'
                      : 'badge-info'
                  }`}
                >
                  {transaction.status === 'SETTLED' ? 'Settled' : transaction.status}
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

        {/* Big Amount Card */}
        <div className="zd-txn-hero-amount-card">
          <span className="zd-txn-amount-type">
            {isCredit ? 'Credit to CA Wallet' : 'Service Debit from CA Wallet'}
          </span>
          <div className="zd-txn-amount-value-row">
            <span className={`zd-txn-main-amount ${isCredit ? 'credit' : 'debit'}`}>
              {isCredit ? '+' : '−'}
              {formatINR(transaction.amountPaise)}
            </span>
          </div>
          <p className="zd-txn-desc-sub">{transaction.description}</p>
        </div>

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
            <strong className="zd-meta-val">{transaction.paymentSource}</strong>
          </div>

          <div className="zd-txn-meta-item">
            <div className="zd-meta-label">
              <span>Gateway / UTR Ref</span>
            </div>
            <strong className="zd-meta-val font-mono">{transaction.providerRef || '—'}</strong>
          </div>

          <div className="zd-txn-meta-item">
            <div className="zd-meta-label">
              <span>Document Reference</span>
            </div>
            <strong className="zd-meta-val font-mono">
              {transaction.docRef ? (
                <span style={{ color: '#2563eb' }}>{transaction.docRef}</span>
              ) : (
                <span style={{ color: '#94a3b8' }}>N/A (Wallet Top-up)</span>
              )}
            </strong>
          </div>
        </div>

        {/* Line Item Fee Breakdown */}
        {transaction.breakdown && (
          <div className="zd-txn-breakdown-box">
            <div className="zd-breakdown-title">Service Charge & Statutory Breakdown</div>
            <div className="zd-breakdown-row">
              <span>Base Platform Charge</span>
              <span>{formatINR(transaction.breakdown.basePaise)}</span>
            </div>
            {transaction.breakdown.gstPaise > 0 && (
              <div className="zd-breakdown-row">
                <span>GST (18% Statutory Rate)</span>
                <span>{formatINR(transaction.breakdown.gstPaise)}</span>
              </div>
            )}
            {transaction.breakdown.stampDutyPaise > 0 && (
              <div className="zd-breakdown-row zd-breakdown-row--highlight">
                <div>
                  <span>Government Stamp Duty</span>
                  <span className="zd-stamp-duty-hint">Non-taxable statutory passthrough</span>
                </div>
                <span>{formatINR(transaction.breakdown.stampDutyPaise)}</span>
              </div>
            )}
            <div className="zd-breakdown-divider" />
            <div className="zd-breakdown-row zd-breakdown-row--total">
              <strong>Total Transaction Amount</strong>
              <strong>{formatINR(transaction.amountPaise)}</strong>
            </div>
          </div>
        )}

        {/* Tax Invoice Summary Box */}
        <div className="zd-receipt-preview-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
                Official Tax Invoice / Receipt
              </span>
              <strong style={{ display: 'block', fontSize: 13, color: '#0f172a', marginTop: 2 }}>
                Invoice #{transaction.receiptId || 'ZD-REC-PENDING'}
              </strong>
            </div>
            <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
              SAC 998311
            </span>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
            Issued to R. Sharma & Associates (ICAI Reg # 014229S). GSTIN: 29AAACZ1122D1Z4.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="zd-modal-actions" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="zd-btn-action zd-btn-action--secondary"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="zd-btn-action zd-btn-action--primary"
            onClick={handlePrintReceipt}
          >
            <Download size={15} />
            <span>Download Official Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
