import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  FileEdit,
  Mail,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  X,
  Building
} from 'lucide-react';
import { caDashboardService } from '../../services/api/caDashboardService.js';

export default function AttentionSection({ items = [], onActionTriggered: _onActionTriggered }) {
  const navigate = useNavigate();
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [diagnosticsModalItem, setDiagnosticsModalItem] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const handleAction = async (item) => {
    const actionKey = item.allowedAction?.actionKey;

    if (actionKey === 'send_portal_reminder') {
      setProcessingId(item.id);
      try {
        const res = await caDashboardService.sendReviewReminder(item.documentId, 'portal_email');
        setFeedbackMessage(`Sent via ${res.channel}: "${item.clientName}" notified for ${item.docRef}`);
        setTimeout(() => setFeedbackMessage(null), 4000);
      } finally {
        setProcessingId(null);
      }
    } else if (actionKey === 'inspect_gateway_log') {
      const diag = await caDashboardService.inspectGatewayIssue(item.documentId);
      setDiagnosticsModalItem({ ...item, diagnostics: diag });
    } else if (item.allowedAction?.route) {
      navigate(item.allowedAction.route);
    } else {
      navigate('/ca/documents');
    }
  };

  const getItemIcon = (stage) => {
    switch (stage) {
      case 'CA Review':
        return <FileEdit size={18} />;
      case 'Corrections':
        return <Clock size={18} />;
      case 'Party Review':
        return <Mail size={18} />;
      case 'Executing':
        return <ShieldAlert size={18} />;
      default:
        return <AlertTriangle size={18} />;
    }
  };

  const getStatusBadge = (item) => {
    const isUrgent = item.urgency === 'urgent';
    const isHigh = item.urgency === 'high';

    return (
      <span
        className={`zd-recent-status-badge ${
          isUrgent
            ? 'zd-recent-status-badge--expiring'
            : isHigh
            ? 'zd-recent-status-badge--pending'
            : 'zd-recent-status-badge--completed'
        }`}
      >
        <span>{item.status}</span>
      </span>
    );
  };

  return (
    <section aria-labelledby="heading-attention-section" className="ca-attention-section">
      <div className="zd-attention-card zd-glass-card">
        <div className="zd-attention-header">
          <div className="zd-attention-titles">
            <div className="zd-attention-title-row">
              <span className="zd-pulse-indicator" aria-hidden="true" />
              <h2 id="heading-attention-section" className="zd-attention-title">
                Needs Your Attention
              </h2>
            </div>
            <p className="zd-attention-subtitle">
              {items.length} actionable items requiring CA review, party follow-up, or manual gateway inspection
            </p>
          </div>
          <div className="zd-attention-badge-pill">
            <span>Portal & Email Reminders Only</span>
          </div>
        </div>

        {feedbackMessage && (
          <div className="ca-attention-toast" role="status">
            <CheckCircle2 size={16} color="#16a34a" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        <div className="zd-attention-items-list" role="list">
          {items.map((item) => (
            <div
              key={item.id}
              className={`zd-attention-row zd-attention-row--${item.urgency}`}
              role="listitem"
            >
              <div className="zd-attention-row__left">
                <div
                  className={`zd-attention-icon-box zd-attention-icon-box--${item.urgency}`}
                  aria-hidden="true"
                >
                  {getItemIcon(item.stage)}
                </div>

                <div className="zd-attention-content">
                  <div className="zd-attention-client-line">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Building size={13} aria-hidden="true" />
                      <span>{item.clientName}</span>
                    </span>
                    <span aria-hidden="true">•</span>
                    <span className="zd-recent-id-badge">{item.docRef}</span>
                    {getStatusBadge(item)}
                  </div>

                  <h3 className="zd-attention-doc-title">{item.documentTitle}</h3>

                  <div className="zd-attention-meta">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} aria-hidden="true" />
                      <span>{item.waitingDuration}</span>
                    </span>
                    {item.reminderChannel && (
                      <span>Channel: {item.reminderChannel}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="zd-attention-row__right">
                <button
                  type="button"
                  className={`zd-recent-action-btn ${
                    item.urgency === 'urgent'
                      ? 'zd-recent-action-btn--draft-pdf'
                      : 'zd-recent-action-btn--pdf'
                  }`}
                  style={{ width: 'auto', minWidth: 120, height: 36, padding: '0 14px' }}
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item)}
                  id={`btn-action-${item.id}`}
                >
                  <span>{processingId === item.id ? 'Dispatching…' : item.allowedAction.label}</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gateway Issue Diagnostic Inspection Modal (Strictly informative; no automatic retries) */}
      {diagnosticsModalItem && (
        <div
          className="modal-overlay"
          onClick={() => setDiagnosticsModalItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-diag-title"
        >
          <div
            className="zd-glass-card ca-diag-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ca-diag-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ca-diag-modal-icon">
                  <ShieldAlert size={20} color="#dc2626" />
                </div>
                <div>
                  <h3 id="modal-diag-title" style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Execution Gateway Diagnostics
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--zd-text-muted)', margin: '2px 0 0' }}>
                    {diagnosticsModalItem.documentTitle} ({diagnosticsModalItem.docRef})
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="zd-trend-refresh-btn"
                onClick={() => setDiagnosticsModalItem(null)}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="ca-diag-modal-body">
              <div className="ca-diag-alert-box">
                <span style={{ fontWeight: 700, fontSize: 13, color: '#991b1b' }}>
                  Issue: {diagnosticsModalItem.diagnostics?.status}
                </span>
                <p style={{ fontSize: 12.5, color: '#7f1d1d', marginTop: 4, lineHeight: 1.45 }}>
                  {diagnosticsModalItem.diagnostics?.reason}
                </p>
              </div>

              <div style={{ marginTop: 14 }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--zd-text-muted)', letterSpacing: '0.04em' }}>
                  Recommended Resolution (Manual)
                </h4>
                <p style={{ fontSize: 13, color: '#334155', marginTop: 4, lineHeight: 1.5 }}>
                  {diagnosticsModalItem.diagnostics?.suggestedAction}
                </p>
                <p style={{ fontSize: 11.5, color: '#64748b', marginTop: 8, fontStyle: 'italic', lineHeight: 1.45 }}>
                  Note: Automated payment or stamp retries are disabled to prevent duplicate state debits.
                  Please verify physical Class-3 USB token or request Aadhaar re-authentication manually.
                </p>
              </div>
            </div>

            <div className="ca-diag-modal-footer">
              <button
                type="button"
                className="zd-btn-action zd-btn-action--secondary"
                style={{ height: 38, padding: '0 16px', fontSize: 13 }}
                onClick={() => setDiagnosticsModalItem(null)}
              >
                Close Diagnostic
              </button>
              <button
                type="button"
                className="zd-btn-action zd-btn-action--primary"
                style={{ height: 38, padding: '0 16px', fontSize: 13 }}
                onClick={() => {
                  setDiagnosticsModalItem(null);
                  navigate(`/ca/documents?docId=${diagnosticsModalItem.documentId}`);
                }}
              >
                Open Document in Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
