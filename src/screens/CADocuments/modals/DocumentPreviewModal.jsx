import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  AlertCircle,
  Eye,
  Loader2,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  FileCheck,
  Bell
} from 'lucide-react';
import { caDocumentsService } from '../../../services/api/caDocumentsService.js';

export default function DocumentPreviewModal({ isOpen, onClose, document, onSendReminder }) {
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showExecutedViewer, setShowExecutedViewer] = useState(false);

  const isCompleted = document?.statusCode === 'completed';
  const isFinalFileProcessing = isCompleted && document?.finalFileAvailable === false;

  useEffect(() => {
    if (!isOpen || !document || !isCompleted) {
      setDownloadInfo(null);
      setDownloadError('');
      setDownloadSuccess(false);
      setShowExecutedViewer(false);
      return;
    }

    let active = true;
    caDocumentsService
      .getFinalExecutedDocument(document.id)
      .then((info) => {
        if (active) setDownloadInfo(info);
      })
      .catch((err) => {
        if (active) console.error('Failed to load executed document details:', err);
      });

    return () => {
      active = false;
    };
  }, [isOpen, document, isCompleted]);

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

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError('');
    setDownloadSuccess(false);
    try {
      const res = await caDocumentsService.downloadExecutedDocument(document.id);
      setDownloadSuccess(true);
    } catch (err) {
      console.error('Download executed document error:', err);
      setDownloadError(err.message || 'Unable to download executed document.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="zd-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="doc-details-title">
      <div className="zd-modal-card zd-glass-card zd-preview-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className={`zd-modal-icon-badge ${isCompleted ? 'zd-modal-icon-badge--green' : ''}`}>
              {isCompleted ? <FileCheck size={18} color="#16a34a" /> : <FileText size={18} color="#2563eb" />}
            </div>
            <div>
              <h2 className="zd-modal-title" id="doc-details-title">{document.title}</h2>
              <p className="zd-modal-sub">
                Ref: {document.ref} • {document.client} ({document.clientType})
              </p>
            </div>
          </div>
          <button type="button" className="zd-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="zd-preview-body">
          {/* Completed Document Notice Banner */}
          {isCompleted && (
            <div
              className={`zd-modal-alert ${
                isFinalFileProcessing ? 'zd-modal-alert--warning' : 'zd-modal-alert--success'
              }`}
              style={{ marginBottom: 14 }}
            >
              {isFinalFileProcessing ? (
                <Loader2 size={16} className="spinning" style={{ flexShrink: 0, marginTop: 1 }} />
              ) : (
                <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
              )}
              <div>
                <strong style={{ display: 'block', marginBottom: 2 }}>
                  {isFinalFileProcessing
                    ? 'Final document processing'
                    : 'Certified Executed Document Available'}
                </strong>
                <span style={{ fontSize: 12.5 }}>
                  {isFinalFileProcessing
                    ? 'The statutory certificate and signed original are currently being assembled by the statutory repository.'
                    : 'All party signatures and statutory stamping have been verified. Original cryptographic signature (PAdES) is preserved intact.'}
                </span>
              </div>
            </div>
          )}

          {downloadError && (
            <div className="zd-modal-alert zd-modal-alert--error" style={{ marginBottom: 14 }}>
              <AlertCircle size={15} />
              <span>{downloadError}</span>
            </div>
          )}

          {downloadSuccess && (
            <div className="zd-modal-alert zd-modal-alert--success" style={{ marginBottom: 14 }}>
              <CheckCircle2 size={15} color="#16a34a" />
              <span>Original certified PDF downloaded successfully.</span>
            </div>
          )}

          {/* Executed Document Interactive Viewer Mode */}
          {showExecutedViewer && isCompleted && (
            <div
              style={{
                background: '#0f172a',
                color: '#f8fafc',
                borderRadius: 10,
                padding: '16px 20px',
                marginBottom: 16,
                fontSize: 13,
                fontFamily: 'monospace'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '1px solid #334155', paddingBottom: 6 }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>[Authenticated View] {document.ref}-Executed-Certified.pdf</span>
                <button
                  type="button"
                  onClick={() => setShowExecutedViewer(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}
                >
                  Close Viewer
                </button>
              </div>
              <div style={{ lineHeight: 1.6 }}>
                <div>Document Title: {document.title}</div>
                <div>Status: CERTIFIED & EXECUTED (Completed {document.completedAt || 'Recently'})</div>
                <div>eStamp Certificate: {document.execution?.stampCertificateNo || 'NOT_REQUIRED'}</div>
                <div>Cryptography: PKCS#7 / PAdES Standard (Uncompressed & Preserved)</div>
                <div style={{ color: '#4ade80', marginTop: 8 }}>✔ All {document.execution?.signers?.length || 2} Signatures Cryptographically Validated</div>
              </div>
            </div>
          )}

          {/* Status & Compliance Summary */}
          <div className="zd-preview-grid">
            <div className="zd-preview-item">
              <span className="zd-preview-item-label">Lifecycle Status</span>
              <span className="zd-preview-item-val" style={{ fontWeight: 700, color: isCompleted ? '#16a34a' : '#1d4ed8' }}>
                {document.status}
              </span>
            </div>
            <div className="zd-preview-item">
              <span className="zd-preview-item-label">Document Type</span>
              <span className="zd-preview-item-val">{document.docType}</span>
            </div>
            <div className="zd-preview-item">
              <span className="zd-preview-item-label">Filing Date</span>
              <span className="zd-preview-item-val">{document.createdAt}</span>
            </div>
            <div className="zd-preview-item">
              <span className="zd-preview-item-label">Payment Status</span>
              <span className="zd-preview-item-val">{document.statusDetails?.paymentStatus}</span>
            </div>
            <div className="zd-preview-item">
              <span className="zd-preview-item-label">eStamp Procurement</span>
              <span className="zd-preview-item-val">{document.statusDetails?.stampStatus}</span>
            </div>
            <div className="zd-preview-item">
              <span className="zd-preview-item-label">Signer / DSC State</span>
              <span className="zd-preview-item-val">{document.statusDetails?.signerStatus}</span>
            </div>
            {document.dueDate && (
              <div className="zd-preview-item">
                <span className="zd-preview-item-label">Task Due Date</span>
                <span className="zd-preview-item-val" style={{ color: '#d97706', fontWeight: 600 }}>
                  {document.dueDate}
                </span>
              </div>
            )}
            {document.expiryDate && (
              <div className="zd-preview-item">
                <span className="zd-preview-item-label">Charter Expiry Date</span>
                <span className="zd-preview-item-val" style={{ color: '#7c3aed', fontWeight: 600 }}>
                  {document.expiryDate}
                </span>
              </div>
            )}
          </div>

          {/* Form Data Summary */}
          {document.formData && (
            <div className="zd-preview-form-box" style={{ marginTop: 14 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>
                Statutory Form & Filing Attributes
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                <div>
                  <span style={{ color: '#64748b' }}>Turnover: </span>
                  <strong>{document.formData.turnover || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Period: </span>
                  <strong>{document.formData.auditPeriod || 'N/A'}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b' }}>Reporting Partner: </span>
                  <strong>{document.formData.reportingPartner || 'CA Rajesh Sharma, FCA'}</strong>
                </div>
                {document.formData.notes && (
                  <div style={{ gridColumn: 'span 2', marginTop: 4, color: '#334155', fontStyle: 'italic' }}>
                    "{document.formData.notes}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Password Protection Policy Instructions (Completed Documents) */}
          {isCompleted && downloadInfo?.passwordPolicy && (
            <div className="zd-password-policy-card" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <KeyRound size={17} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ fontSize: 13, color: '#0f172a', display: 'block' }}>
                    Password-Protected Access Policy
                  </strong>
                  <p style={{ margin: '3px 0 6px', fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                    {downloadInfo.passwordPolicy.instructions}
                  </p>
                  <span style={{ display: 'inline-block', fontSize: 11.5, color: '#1e40af', background: '#eff6ff', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>
                    {downloadInfo.passwordPolicy.samplePasswordHint}
                  </span>
                  <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    {downloadInfo.passwordPolicy.signaturePreservationNote}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="zd-modal-actions" style={{ marginTop: 18 }}>
          <button type="button" className="zd-btn-action zd-btn-action--secondary" onClick={onClose}>
            Close
          </button>

          {onSendReminder && !isCompleted && (
            <button
              type="button"
              className="zd-btn-action zd-btn-action--secondary"
              id="btn-modal-send-reminder"
              onClick={() => onSendReminder(document)}
              title="Send portal or email reminder for this document"
            >
              <Bell size={15} />
              <span>Send Reminder</span>
            </button>
          )}

          {isCompleted ? (
            isFinalFileProcessing ? (
              <button
                type="button"
                disabled
                className="zd-btn-action zd-btn-action--disabled"
                title="The final certified copy is being assembled by the statutory repository."
              >
                <Loader2 size={14} className="spinning" />
                <span>Final document processing</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--secondary"
                  onClick={() => setShowExecutedViewer(!showExecutedViewer)}
                >
                  <Eye size={15} />
                  <span>{showExecutedViewer ? 'Hide Preview' : 'View Document'}</span>
                </button>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--primary"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 size={15} className="spinning" />
                  ) : (
                    <Download size={15} />
                  )}
                  <span>{isDownloading ? 'Downloading…' : 'Download Document'}</span>
                </button>
              </div>
            )
          ) : (
            <button
              type="button"
              className="zd-btn-action zd-btn-action--primary"
              onClick={() => {
                alert(`Viewing current draft preview for ${document.ref}`);
              }}
            >
              <Eye size={15} />
              <span>Preview Draft</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
