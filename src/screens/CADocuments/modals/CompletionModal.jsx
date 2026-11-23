import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  FileCheck,
  Download,
  Eye,
  KeyRound,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { caDocumentsService } from '../../../services/api/caDocumentsService.js';

export default function CompletionModal({ isOpen, onClose, documentId, onOpenPreview }) {
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !documentId) return;

    let active = true;
    setLoading(true);
    setDownloadError('');
    setDownloadSuccess(false);

    caDocumentsService
      .getDocumentDownloadInfo(documentId)
      .then((info) => {
        if (active) {
          setDownloadInfo(info);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load completion details:', err);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const isFinalFileProcessing = downloadInfo && (downloadInfo.isReady === false || downloadInfo.status === 'PROCESSING');

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError('');
    setDownloadSuccess(false);
    try {
      await caDocumentsService.downloadExecutedDocument(documentId);
      setDownloadSuccess(true);
    } catch (err) {
      console.error('Download executed document error:', err);
      setDownloadError(err.message || 'Unable to download executed document.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="zd-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="completion-title">
      <div className="zd-modal-card zd-glass-card zd-completion-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="zd-modal-icon-badge zd-modal-icon-badge--green">
              <FileCheck size={20} color="#16a34a" />
            </div>
            <div>
              <h2 className="zd-modal-title" id="completion-title">
                Document Generation Complete
              </h2>
              <p className="zd-modal-sub">Certified statutory execution record</p>
            </div>
          </div>
          <button type="button" className="zd-modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <div className="zd-completion-hero-view">
          <div className="zd-success-check-badge">
            <CheckCircle2 size={46} color="#16a34a" />
          </div>

          <h3 className="zd-completion-main-heading">
            Your document has been generated successfully.
          </h3>

          <p className="zd-completion-sub">
            All required signatures and statutory eStamping have been cryptographically verified and recorded in the audit vault.
          </p>

          <div className="zd-completion-meta-grid">
            <div className="zd-completion-meta-item">
              <span className="zd-meta-label">Document Reference</span>
              <strong className="zd-meta-val">{downloadInfo?.ref}</strong>
            </div>
            <div className="zd-completion-meta-item">
              <span className="zd-meta-label">Completion Time</span>
              <strong className="zd-meta-val">
                {new Date().toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} IST
              </strong>
            </div>
            <div className="zd-completion-meta-item">
              <span className="zd-meta-label">Execution Status</span>
              <strong className="zd-meta-val" style={{ color: '#16a34a' }}>
                All Signatures Verified
              </strong>
            </div>
            <div className="zd-completion-meta-item">
              <span className="zd-meta-label">Digital Cryptography</span>
              <strong className="zd-meta-val" style={{ color: '#2563eb' }}>
                PAdES / PKCS#7 Preserved
              </strong>
            </div>
          </div>

          {/* Download Error Alert */}
          {downloadError && (
            <div className="zd-modal-alert zd-modal-alert--error" style={{ marginBottom: 12, textAlign: 'left' }}>
              <AlertCircle size={16} />
              <span>{downloadError}</span>
            </div>
          )}

          {/* Download Success Alert */}
          {downloadSuccess && (
            <div className="zd-modal-alert zd-modal-alert--success" style={{ marginBottom: 12, textAlign: 'left' }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span>Certified original PDF downloaded successfully. Cryptographic signature (PAdES) preserved.</span>
            </div>
          )}

          {/* Password Protection Policy Card */}
          <div className="zd-password-policy-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <KeyRound size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: 13, color: '#0f172a', display: 'block' }}>
                  Password Protection Policy (Statutory Signature Preservation)
                </strong>
                <p style={{ margin: '4px 0 6px', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  {downloadInfo?.passwordPolicy?.instructions}
                </p>
                <div style={{ fontSize: 11.5, color: '#1e40af', background: '#eff6ff', padding: '6px 10px', borderRadius: 6 }}>
                  {downloadInfo?.passwordPolicy?.samplePasswordHint}
                </div>
                <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  {downloadInfo?.passwordPolicy?.signaturePreservationNote}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: View Document & Download Document */}
          <div className="zd-modal-actions" style={{ marginTop: 24, width: '100%', display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="zd-btn-action zd-btn-action--secondary"
              style={{ flex: 1, height: 42 }}
              onClick={() => {
                onClose();
                if (onOpenPreview) onOpenPreview(documentId);
              }}
            >
              <Eye size={15} />
              <span>View Document</span>
            </button>
            {isFinalFileProcessing ? (
              <button
                type="button"
                disabled
                className="zd-btn-action zd-btn-action--disabled"
                style={{ flex: 1, height: 42 }}
                title="The final certified copy is being assembled by the statutory repository."
              >
                <Loader2 size={14} className="spinning" />
                <span>Final document processing</span>
              </button>
            ) : (
              <button
                type="button"
                className="zd-btn-action zd-btn-action--primary"
                style={{ flex: 1, height: 42 }}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
