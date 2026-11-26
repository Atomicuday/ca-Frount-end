import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertTriangle, Loader2, Users } from 'lucide-react';
import { caBulkImportService } from '../../../services/api/caBulkImportService.js';
import './BatchInviteModal.css';

export default function BatchInviteModal({
  isOpen,
  documents = [],
  onClose,
  onBatchComplete
}) {
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  // Filter documents that are in draft or awaiting_info
  const eligibleDocs = documents.filter(
    (d) => d.statusCode === 'draft' || d.statusCode === 'awaiting_info'
  );

  const handleStartDispatch = async () => {
    setSending(true);
    try {
      const docIds = eligibleDocs.map((d) => d.id);
      const res = await caBulkImportService.dispatchBatchDraftReview(docIds);
      setResults(res);
      if (onBatchComplete) {
        onBatchComplete(res);
      }
    } catch (err) {
      console.error('Batch invite error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="zd-batch-invite-overlay" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="zd-batch-invite-panel" role="dialog" aria-modal="true" aria-labelledby="zd-batch-invite-title">
        <header className="zd-batch-invite-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="zd-bulk-icon-badge" style={{ background: '#ede9fe', color: '#6d28d9' }}>
              <Send size={20} />
            </div>
            <div>
              <h2 id="zd-batch-invite-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Batch Draft Review Invitations
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Dispatch draft review access links to designated client signatories
              </p>
            </div>
          </div>
          <button type="button" className="zd-bulk-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </header>

        <div className="zd-batch-invite-body">
          {!results ? (
            <>
              <div className="zd-batch-summary-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="#2563eb" />
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                      {eligibleDocs.length} Signatories Selected
                    </span>
                  </div>
                  <span className="zd-status-pill zd-status-pill--valid">
                    {eligibleDocs.length} Eligible Requests
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                  Invitations will be dispatched via secure portal link and registered email/SMS according to practice notification policy.
                  Individual requests are processed independently; a transient failure on one document will not interrupt remaining dispatches.
                </p>
              </div>

              {eligibleDocs.length < documents.length && (
                <div className="zd-guidelines-box" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
                  <h4>Ineligible Documents Omitted</h4>
                  <p style={{ margin: 0 }}>
                    {documents.length - eligibleDocs.length} documents were omitted because they are already approved, executing, or have exceeded the statutory invitation limit.
                  </p>
                </div>
              )}

              <div className="zd-batch-doc-list">
                {eligibleDocs.map((doc) => (
                  <div key={doc.id} className="zd-batch-doc-row">
                    <div>
                      <strong>{doc.ref}</strong> — {doc.client}
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Signatory: {doc.allowedSendAction?.targetSignatory || doc.execution?.signers?.[0]?.name || 'Primary Signer'} ({doc.allowedSendAction?.targetEmail || doc.execution?.signers?.[0]?.email || 'Email'})
                      </div>
                    </div>
                    <span className="zd-status-pill zd-status-pill--valid">{doc.status || 'Draft'}</span>
                  </div>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>
                  I confirm dispatching draft review invitations to <strong>{eligibleDocs.length}</strong> client signatories.
                </span>
              </label>
            </>
          ) : (
            <div className="zd-results-box">
              <div
                className={`zd-results-icon-big ${
                  results.failedCount === 0 ? 'zd-results-icon-big--success' : 'zd-results-icon-big--partial'
                }`}
              >
                {results.failedCount === 0 ? <CheckCircle2 size={36} /> : <AlertTriangle size={36} />}
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Batch Dispatch Complete
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Successfully sent: <strong>{results.sentCount}</strong> / {results.total} invitations
                </p>
              </div>

              <div className="zd-batch-doc-list" style={{ width: '100%' }}>
                {results.results.map((r) => (
                  <div key={r.docId} className="zd-batch-doc-row">
                    <div>
                      <strong>{r.ref || r.docId}</strong> — {r.client || 'Client'}
                    </div>
                    <span className={`zd-status-pill ${r.success ? 'zd-status-pill--valid' : 'zd-status-pill--error'}`}>
                      {r.success ? 'Invitation Dispatched' : r.error}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="zd-batch-invite-footer">
          {!results ? (
            <>
              <button
                type="button"
                className="zd-btn-modal-action zd-btn-modal-action--secondary"
                onClick={onClose}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="zd-btn-modal-action zd-btn-modal-action--primary"
                onClick={handleStartDispatch}
                disabled={!confirmed || eligibleDocs.length === 0 || sending}
              >
                {sending ? <Loader2 size={16} className="zd-spinning-loader" /> : <Send size={15} />}
                <span>Send Invitations ({eligibleDocs.length})</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="zd-btn-modal-action zd-btn-modal-action--primary"
              onClick={onClose}
            >
              Done
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
