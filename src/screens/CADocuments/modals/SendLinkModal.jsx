import React, { useState, useEffect } from 'react';
import { X, Send, Mail, CheckCircle2, AlertCircle, MessageCircle, ShieldCheck, Users } from 'lucide-react';
import { caDocumentsService } from '../../../services/api/caDocumentsService.js';

export default function SendLinkModal({ isOpen, onClose, document, onDispatchLink }) {
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState('');

  const handleClose = () => {
    setSuccessResult(null);
    setError('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen || !document) return null;

  const isPaid = document.payment?.status === 'PAID';
  const isSigningLink = isPaid && Boolean(document.clientApproval?.isApproved);

  const whatsAppTracking = document.whatsAppTracking || {
    reviewSent: false,
    signingSent: false,
    totalSent: 0,
    limit: 2
  };

  const currentSentCount = whatsAppTracking.totalSent || 0;
  const whatsAppLimit = whatsAppTracking.limit || 2;
  const isLimitReached = currentSentCount >= whatsAppLimit;

  const signers = document.execution?.signers || [
    {
      id: 'sig-primary',
      name: document.allowedSendAction?.targetSignatory || 'Authorized Signatory',
      role: 'Primary Signer',
      email: document.allowedSendAction?.targetEmail || 'contact@client.in',
      phone: document.allowedSendAction?.phone || '+91 98000 00000',
      status: 'PENDING'
    }
  ];

  const handleSend = async () => {
    setLoading(true);
    setError('');
    try {
      let result;
      if (isSigningLink) {
        result = await caDocumentsService.requestSigningInvitation(document.id, {
          sendWhatsApp: sendWhatsApp && !isLimitReached
        });
      } else {
        result = await caDocumentsService.requestDraftReviewNotification(document.id);
      }

      setSuccessResult(result);
      if (onDispatchLink) {
        onDispatchLink(document.id, result);
      }
    } catch (err) {
      console.error('Dispatch link error:', err);
      setError(err.message || 'Failed to dispatch document link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="zd-modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="send-link-modal-title">
      <div className="zd-modal-card zd-glass-card zd-send-link-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="zd-modal-icon-badge">
              <Send size={18} color="#2563eb" />
            </div>
            <div>
              <h2 className="zd-modal-title" id="send-link-modal-title">
                {isSigningLink ? 'Dispatch Execution & Signing Link' : 'Dispatch Draft Review Invitation'}
              </h2>
              <p className="zd-modal-sub">
                {document.ref} ({document.version || 'v1'}) • {document.client}
              </p>
            </div>
          </div>
          <button type="button" className="zd-modal-close-btn" onClick={handleClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Demo Gateway Banner */}
        <div className="zd-demo-notice-banner">
          <ShieldCheck size={14} color="#1d4ed8" />
          <span>
            <strong>Secure Recipient Delivery:</strong> Links are dispatched directly to the authorized party's verified channel. Second WhatsApp message completes the 2-message budget for this document.
          </span>
        </div>

        {successResult ? (
          <div className="zd-modal-body zd-send-success-box">
            <CheckCircle2 size={40} color="#10b981" />
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '10px 0 4px', color: '#0f172a' }}>
              Invitation Successfully Dispatched!
            </h3>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
              The statutory link for <strong>{document.ref}</strong> has been sent to designated signatories.
            </p>

            <div className="zd-delivery-receipt">
              <div className="zd-receipt-row">
                <span>Delivery ID:</span>
                <code>{successResult.deliveryId || `DEL-${Date.now()}`}</code>
              </div>
              <div className="zd-receipt-row">
                <span>Target Signatory:</span>
                <strong>{successResult.recipient || document.allowedSendAction?.targetSignatory}</strong>
              </div>
              <div className="zd-receipt-row">
                <span>Channels:</span>
                <span>{(successResult.channels || ['Secure Recipient Portal', 'Email', 'WhatsApp']).join(' • ')}</span>
              </div>
              <div className="zd-receipt-row">
                <span>Direct Access URL:</span>
                <a
                  href={successResult.signingUrl || successResult.reviewUrl || `/review/${document.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#2563eb', fontWeight: 600, fontSize: 12 }}
                >
                  {successResult.signingUrl || successResult.reviewUrl || `/review/${document.id}`}
                </a>
              </div>
            </div>

            <div className="zd-modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="zd-btn-action zd-btn-action--primary" onClick={handleClose}>
                Done & Return to Vault
              </button>
            </div>
          </div>
        ) : (
          <div className="zd-modal-body zd-send-modal-body">
            {error && (
              <div className="zd-modal-alert zd-modal-alert--error" style={{ marginBottom: 14 }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Signatories List */}
            <div className="zd-recipient-summary">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Users size={14} color="#2563eb" />
                <span className="zd-recipient-label">Authorized Signatories & Delivery Targets:</span>
              </div>
              {signers.map((s, idx) => (
                <div key={s.id || idx} className="zd-signer-preview-row">
                  <div>
                    <strong style={{ fontSize: 13, color: '#0f172a' }}>{s.name}</strong>
                    <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 6 }}>({s.role})</span>
                  </div>
                  <div className="zd-recipient-contact" style={{ margin: 0 }}>
                    <Mail size={12} />
                    <span>{s.email}</span>
                    <span className="zd-sep">•</span>
                    <span>{s.phone}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Channel Policy Breakdown */}
            <div className="zd-channel-selection-group" style={{ marginTop: 14 }}>
              <label className="zd-channel-option locked">
                <input type="checkbox" checked disabled readOnly />
                <div className="zd-channel-meta">
                  <strong>Portal Notification & Registered Email (Enforced)</strong>
                  <p>Statutory audit trails and legal invitations are strictly delivered via authenticated portal links.</p>
                </div>
              </label>

              <label className={`zd-channel-option ${isLimitReached ? 'disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={sendWhatsApp && !isLimitReached}
                  disabled={isLimitReached}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                />
                <div className="zd-channel-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageCircle size={14} color="#10b981" />
                    <strong>WhatsApp Dispatch ({currentSentCount + 1}/{whatsAppLimit})</strong>
                    {isLimitReached && (
                      <span className="zd-badge zd-badge--sm zd-badge--amber">Budget Limit Reached</span>
                    )}
                  </div>
                  <p>
                    {isSigningLink
                      ? 'Sends the second WhatsApp message for statutory signing. (Message 2 of 2 in budget).'
                      : 'Sends the first WhatsApp message for draft review. (Message 1 of 2 in budget).'}
                  </p>
                </div>
              </label>
            </div>

            <div className="zd-modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="zd-btn-action zd-btn-action--secondary" onClick={handleClose}>
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-send-link"
                className="zd-btn-action zd-btn-action--primary"
                onClick={handleSend}
                disabled={loading}
              >
                <Send size={14} />
                <span>{loading ? 'Dispatching…' : isSigningLink ? 'Send Signing Link' : 'Send Review Link'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
