import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquareQuote,
  Check,
  Clock,
  ShieldCheck,
  AlertCircle,
  XCircle,
  FileDiff
} from 'lucide-react';
import { caDocumentsService } from '../../../services/api/caDocumentsService.js';

export default function EditRequestsModal({ isOpen, onClose, document, onDecisionCompleted }) {
  const [resolvingId, setResolvingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !document) return null;

  const requests = document.correctionRequests || [];
  const unresolvedRequests = requests.filter((r) => r.status === 'Pending');

  const handleAccept = async (requestId) => {
    setResolvingId(requestId);
    setError('');
    try {
      const res = await caDocumentsService.resolveCorrectionRequest(document.id, requestId, 'ACCEPT');
      if (onDecisionCompleted) {
        onDecisionCompleted(document.id, 'ACCEPT', res);
      }
    } catch (err) {
      console.error('Failed to accept correction request:', err);
      setError(err.message || 'Unable to accept request.');
      setResolvingId(null);
    }
  };

  const handleOpenReject = (requestId) => {
    setRejectingId(requestId);
    setRejectReason('');
    setError('');
  };

  const handleConfirmReject = async (requestId) => {
    setResolvingId(requestId);
    setError('');
    try {
      const res = await caDocumentsService.resolveCorrectionRequest(document.id, requestId, 'REJECT', {
        rejectionReason: rejectReason || 'Retained statutory drafting formulation after partner review.'
      });
      setRejectingId(null);
      if (onDecisionCompleted) {
        onDecisionCompleted(document.id, 'REJECT', res);
      }
    } catch (err) {
      console.error('Failed to reject correction request:', err);
      setError(err.message || 'Unable to reject request.');
      setResolvingId(null);
    }
  };

  return (
    <div className="zd-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="edit-requests-title">
      <div className="zd-modal-card zd-glass-card zd-edit-requests-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="zd-modal-icon-badge zd-modal-icon-badge--amber">
              <MessageSquareQuote size={18} color="#d97706" />
            </div>
            <div>
              <h2 className="zd-modal-title" id="edit-requests-title">Correction Requests & Feedback</h2>
              <p className="zd-modal-sub">
                {document.ref} ({document.version || 'v1'}) • {document.client} ({unresolvedRequests.length} pending review)
              </p>
            </div>
          </div>
          <button type="button" className="zd-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="zd-requests-info-banner">
          <AlertCircle size={14} color="#2563eb" style={{ flexShrink: 0 }} />
          <span>
            <strong>Practice Review Protocol:</strong> Accepting changes generates a new draft revision, invalidates earlier approvals, and opens the execution quote window. Rejecting preserves the current draft and records your reason.
          </span>
        </div>

        {error && (
          <div className="zd-modal-alert zd-modal-alert--error" style={{ margin: '0 24px 14px' }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="zd-requests-list">
          {requests.length === 0 ? (
            <div className="zd-requests-empty">
              <ShieldCheck size={32} color="#10b981" />
              <h4 style={{ margin: '8px 0 2px', fontSize: 15, color: '#0f172a' }}>No Active Correction Requests</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                No feedback or field change requests are outstanding for {document.ref}.
              </p>
            </div>
          ) : (
            requests.map((req) => {
              const isResolved = req.status === 'Resolved';
              const isRejected = req.status === 'Rejected';
              const isPending = req.status === 'Pending';
              const isCurrentRejecting = rejectingId === req.id;
              const hasProposedFields = Array.isArray(req.proposedFields) && req.proposedFields.length > 0;

              return (
                <div key={req.id} className={`zd-request-item ${isResolved ? 'resolved' : isRejected ? 'rejected' : ''}`}>
                  <div className="zd-request-header">
                    <div className="zd-request-author-block">
                      <strong className="zd-request-author">{req.author || req.requesterName}</strong>
                      <span className="zd-request-role">• {req.role || 'Client Reviewer'}</span>
                      <span className="zd-version-tag">Ver: {req.version || document.version || 'v1'}</span>
                    </div>
                    <span className="zd-request-time">
                      <Clock size={11} />
                      <span>{req.createdAt}</span>
                    </span>
                  </div>

                  {/* Proposed Field Comparison Table */}
                  {hasProposedFields && (
                    <div className="zd-request-diff-box">
                      <div className="zd-diff-title">
                        <FileDiff size={13} color="#2563eb" />
                        <span>Proposed Field Values</span>
                      </div>
                      <table className="zd-diff-table">
                        <thead>
                          <tr>
                            <th>Field Name</th>
                            <th>Existing Value</th>
                            <th>Proposed Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {req.proposedFields.map((field, idx) => (
                            <tr key={idx}>
                              <td><strong>{field.fieldLabel || field.fieldId}</strong></td>
                              <td><span className="zd-diff-existing">{field.existingValue || '—'}</span></td>
                              <td><strong className="zd-diff-proposed">{field.proposedValue}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <p className="zd-request-text">{req.text}</p>

                  {/* Rejection Form Input */}
                  {isCurrentRejecting && (
                    <div className="zd-reject-reason-box">
                      <label htmlFor={`reject-reason-${req.id}`} className="zd-form-label" style={{ fontSize: 12 }}>
                        Reason for Rejecting Requested Change *
                      </label>
                      <textarea
                        id={`reject-reason-${req.id}`}
                        className="zd-form-textarea"
                        rows={2}
                        placeholder="Explain why this change cannot be accepted (e.g. Statutory requirement under Companies Act)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={{ fontSize: 12.5 }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="zd-btn-action zd-btn-action--secondary"
                          style={{ height: 30, fontSize: 12, padding: '0 10px' }}
                          onClick={() => setRejectingId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="zd-btn-action zd-btn-action--danger"
                          style={{ height: 30, fontSize: 12, padding: '0 12px' }}
                          onClick={() => handleConfirmReject(req.id)}
                          disabled={resolvingId === req.id}
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Footer Decision Badges or Action Buttons */}
                  <div className="zd-request-footer">
                    <span
                      className={`zd-badge zd-badge--sm ${
                        isResolved
                          ? 'zd-badge--green'
                          : isRejected
                          ? 'zd-badge--red'
                          : 'zd-badge--amber'
                      }`}
                    >
                      {isResolved ? 'Accepted (Revision Created)' : isRejected ? 'Rejected' : 'Pending Review'}
                    </span>

                    {isPending && !isCurrentRejecting && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="zd-btn-action zd-btn-action--secondary"
                          style={{ height: 32, fontSize: 12, padding: '0 12px' }}
                          onClick={() => handleOpenReject(req.id)}
                          disabled={resolvingId === req.id}
                        >
                          <XCircle size={13} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          className="zd-btn-action zd-btn-action--primary"
                          style={{ height: 32, fontSize: 12, padding: '0 14px' }}
                          onClick={() => handleAccept(req.id)}
                          disabled={resolvingId === req.id}
                        >
                          <Check size={13} />
                          <span>{resolvingId === req.id ? 'Applying…' : 'Accept & Revise'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="zd-modal-actions" style={{ marginTop: 18 }}>
          <button type="button" className="zd-btn-action zd-btn-action--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
