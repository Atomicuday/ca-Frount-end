import React, { useState, useEffect } from 'react';
import { X, Edit3, Lock, AlertTriangle, FilePlus2, CheckCircle2 } from 'lucide-react';

export default function EditInputsModal({ isOpen, onClose, document, onSaveInputs, onForkRevision }) {
  const [formData, setFormData] = useState(() => ({
    title: document?.title || '',
    turnover: document?.formData?.turnover || '',
    auditPeriod: document?.formData?.auditPeriod || '',
    notes: document?.formData?.notes || ''
  }));

  const [loading, setLoading] = useState(false);
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

  const isEditable = document.isEditableDraft;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isEditable) return;

    setLoading(true);
    setError('');
    try {
      await onSaveInputs(document.id, formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update document inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleFork = async () => {
    setLoading(true);
    setError('');
    try {
      await onForkRevision(document.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate revision.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="zd-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="zd-modal-card zd-glass-card zd-edit-inputs-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`zd-modal-icon-badge ${!isEditable ? 'zd-modal-icon-badge--amber' : ''}`}>
              {isEditable ? <Edit3 size={18} color="#2563eb" /> : <Lock size={18} color="#d97706" />}
            </div>
            <div>
              <h2 className="zd-modal-title">
                {isEditable ? 'Edit Document Inputs' : 'Locked Document Version'}
              </h2>
              <p className="zd-modal-sub">
                {document.ref} • {document.client} ({document.clientType})
              </p>
            </div>
          </div>
          <button type="button" className="zd-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {!isEditable ? (
          <div className="zd-modal-locked-content zd-modal-body">
            <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="zd-modal-alert zd-modal-alert--warning">
                <AlertTriangle size={18} />
                <div>
                  <strong style={{ display: 'block', fontSize: 13.5, marginBottom: 3 }}>
                    Direct Editing Disabled for {document.status} Stage
                  </strong>
                  <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: 0 }}>
                    This document has progressed beyond initial drafting. To preserve statutory compliance, audit trail integrity, and previously captured signatures, direct modifications to this version are locked.
                  </p>
                </div>
              </div>

              <div className="zd-revision-info-box">
                <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
                  How to make changes:
                </h4>
                <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  You can create a <strong>Draft Revision (v2)</strong>. This generates a fresh, editable draft clone with all current inputs pre-filled. The existing locked document ({document.ref}) will remain archived and unchanged.
                </p>
              </div>
            </div>

            <div className="zd-modal-actions" style={{ marginTop: 'auto', paddingTop: 20 }}>
              <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="zd-btn-action zd-btn-action--secondary" onClick={onClose}>
                  Close
                </button>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--primary"
                  onClick={handleFork}
                  disabled={loading}
                >
                  <FilePlus2 size={15} />
                  <span>{loading ? 'Generating…' : 'Create Revision (Draft v2)'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="zd-modal-form" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <div className="zd-modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                  <div className="zd-modal-alert zd-modal-alert--error">
                    <span>{error}</span>
                  </div>
                )}

                <div className="zd-form-field">
                  <label htmlFor="edit-doc-title" className="zd-form-label">
                    Document Title *
                  </label>
                  <input
                    id="edit-doc-title"
                    type="text"
                    className="zd-form-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="zd-form-grid-2">
                  <div className="zd-form-field">
                    <label htmlFor="edit-doc-turnover" className="zd-form-label">
                      Turnover / Subject Value
                    </label>
                    <input
                      id="edit-doc-turnover"
                      type="text"
                      className="zd-form-input"
                      value={formData.turnover}
                      onChange={(e) => setFormData({ ...formData, turnover: e.target.value })}
                      placeholder="e.g. ₹4.20 Cr"
                    />
                  </div>

                  <div className="zd-form-field">
                    <label htmlFor="edit-doc-period" className="zd-form-label">
                      Audit / Execution Period
                    </label>
                    <input
                      id="edit-doc-period"
                      type="text"
                      className="zd-form-input"
                      value={formData.auditPeriod}
                      onChange={(e) => setFormData({ ...formData, auditPeriod: e.target.value })}
                      placeholder="e.g. FY 2025-26"
                    />
                  </div>
                </div>

                <div className="zd-form-field">
                  <label htmlFor="edit-doc-notes" className="zd-form-label">
                    Clauses & Form Notes
                  </label>
                  <textarea
                    id="edit-doc-notes"
                    className="zd-form-textarea"
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Specific clauses, schedules, or partner notes..."
                  />
                </div>
              </div>
            </div>

            <div className="zd-modal-footer">
              <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="zd-btn-action zd-btn-action--secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="zd-btn-action zd-btn-action--primary" disabled={loading}>
                  <CheckCircle2 size={15} />
                  <span>{loading ? 'Saving…' : 'Save Inputs'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
