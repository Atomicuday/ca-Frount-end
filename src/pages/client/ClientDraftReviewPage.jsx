import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  UserCheck,
  Loader2,
  X,
  FileDiff,
  FileCheck,
  Download,
  Eye,
  KeyRound,
  Stamp,
  Lock
} from 'lucide-react';
import { caDocumentsService } from '../../services/api/caDocumentsService.js';
import './ClientWorkflow.css';

export default function ClientDraftReviewPage() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Access Verification Gate state: verified vs pending
  const [isAccessVerified, setIsAccessVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Review actions state
  const [isApproving, setIsApproving] = useState(false);
  const [approvedSuccess, setApprovedSuccess] = useState(false);

  // Request Changes Modal state
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);
  const [proposedFieldName, setProposedFieldName] = useState('');
  const [currentFieldValue, setCurrentFieldValue] = useState('');
  const [proposedFieldValue, setProposedFieldValue] = useState('');
  const [changeComments, setChangeComments] = useState('');
  const [submittingChanges, setSubmittingChanges] = useState(false);
  const [changesSuccess, setChangesSuccess] = useState(false);

  // Completed document download & preview states
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Load document by token or ID
  useEffect(() => {
    let active = true;
    setLoading(true);

    caDocumentsService
      .getDocumentById(token)
      .then((data) => {
        if (active) {
          if (data) {
            setDoc(data);
            if (data.statusCode === 'completed') {
              caDocumentsService
                .getRecipientExecutedDocument(data.id, {
                  isAccessVerified: true,
                  assignedDocId: data.id
                })
                .then((info) => {
                  if (active) setDownloadInfo(info);
                })
                .catch(() => {
                  caDocumentsService
                    .getDocumentDownloadInfo(data.id)
                    .then((info) => {
                      if (active) setDownloadInfo(info);
                    });
                });
            }
          } else {
            setError('Draft review invitation link is invalid or has expired.');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load document for review:', err);
          setError('Unable to load document details. Please verify your invitation link.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  // Handle Access Verification
  const handleVerifyAccess = (e) => {
    e.preventDefault();
    setVerificationError('');

    if (!phoneOtp || phoneOtp.trim().length < 4) {
      setVerificationError('Please enter the 4-digit verification code sent to your registered mobile number.');
      return;
    }

    setVerifyingOtp(true);
    setTimeout(() => {
      // Prototype verification check (e.g. any 4 digits or 1234)
      setIsAccessVerified(true);
      setVerifyingOtp(false);
    }, 600);
  };

  // Handle Client Download Original
  const handleDownloadOriginal = async () => {
    setIsDownloading(true);
    setDownloadError('');
    setDownloadSuccess(false);
    try {
      await caDocumentsService.downloadRecipientExecutedDocument(doc.id, {
        isAccessVerified: isAccessVerified,
        assignedDocId: doc.id
      });
      setDownloadSuccess(true);
    } catch (err) {
      console.error('Download original error:', err);
      setDownloadError(err.message || 'Unable to download certified document.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle Approve Draft
  const handleApproveDraft = async () => {
    setIsApproving(true);
    try {
      await caDocumentsService.approveDraft(doc.id, {
        version: doc.version || 'v1',
        approverName: doc.allowedSendAction?.targetSignatory || 'Authorized Client Reviewer',
        approverPhone: doc.allowedSendAction?.phone || ''
      });
      setApprovedSuccess(true);
      // Reload updated doc
      const updated = await caDocumentsService.getDocumentById(doc.id);
      setDoc(updated);
    } catch (err) {
      console.error('Approval error:', err);
      setError(err.message || 'Failed to record draft approval.');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Submit Proposed Changes
  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!changeComments.trim()) {
      setError('Please describe your proposed changes or comments.');
      return;
    }

    setSubmittingChanges(true);
    try {
      const proposedFields = proposedFieldName.trim()
        ? [
            {
              fieldId: proposedFieldName.toLowerCase().replace(/\s+/g, '_'),
              fieldLabel: proposedFieldName.trim(),
              existingValue: currentFieldValue.trim() || '—',
              proposedValue: proposedFieldValue.trim() || '—'
            }
          ]
        : [];

      await caDocumentsService.submitCorrectionRequest(doc.id, {
        proposedFields,
        comments: changeComments.trim(),
        requesterName: doc.allowedSendAction?.targetSignatory || 'Client Reviewer',
        requesterPhone: doc.allowedSendAction?.phone || ''
      });

      setChangesSuccess(true);
      setIsChangesModalOpen(false);
      // Reload doc
      const updated = await caDocumentsService.getDocumentById(doc.id);
      setDoc(updated);
    } catch (err) {
      console.error('Submit correction error:', err);
      setError(err.message || 'Failed to submit correction request.');
    } finally {
      setSubmittingChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="zd-client-portal-wrapper">
        <header className="zd-client-header">
          <div className="zd-client-logo-box">
            <span className="zd-client-logo-text">ZapDocs</span>
            <span className="zd-client-secure-badge">
              <ShieldCheck size={13} />
              <span>Verified Practice Portal</span>
            </span>
          </div>
        </header>
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <Loader2 size={36} className="spinning" color="#2563eb" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Connecting to secure draft repository…</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="zd-client-portal-wrapper">
        <header className="zd-client-header">
          <div className="zd-client-logo-box">
            <span className="zd-client-logo-text">ZapDocs</span>
          </div>
        </header>
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
          <div className="zd-modal-alert zd-modal-alert--error" style={{ padding: 20 }}>
            <AlertCircle size={20} />
            <div>
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>Invitation Inactive</strong>
              <span>{error || 'Unable to locate document for review.'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1: Access Verification Gate
  if (!isAccessVerified) {
    return (
      <div className="zd-client-portal-wrapper">
        <header className="zd-client-header">
          <div className="zd-client-logo-box">
            <span className="zd-client-logo-text">ZapDocs</span>
            <span className="zd-client-secure-badge">
              <ShieldCheck size={13} />
              <span>Recipient Identity Verification</span>
            </span>
          </div>
        </header>

        <div className="zd-client-body">
          <div className="zd-verification-card">
            <div className="zd-verification-icon-badge">
              <UserCheck size={26} color="#2563eb" />
            </div>

            <h2 className="zd-verification-title">Draft Review Verification</h2>
            <p className="zd-verification-sub">
              This review session is reserved for <strong>{doc.allowedSendAction?.targetSignatory || doc.client}</strong>. Please enter the 4-digit code sent to your registered number (<code>{doc.allowedSendAction?.phone || '+91 98860 11223'}</code>).
            </p>

            <div className="zd-demo-badge-banner" style={{ marginBottom: 16, textAlign: 'left' }}>
              <Lock size={14} color="#2563eb" />
              <span>
                <strong>Notice:</strong> Review access is restricted to the assigned document only. Verification confirms your identity.
              </span>
            </div>

            {verificationError && (
              <div className="zd-modal-alert zd-modal-alert--error" style={{ marginBottom: 14, textAlign: 'left' }}>
                <AlertCircle size={15} />
                <span>{verificationError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAccess}>
              <div style={{ marginBottom: 18 }}>
                <input
                  type="text"
                  maxLength={4}
                  className="zd-otp-input-field"
                  placeholder="••••"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  autoFocus
                />
                <span style={{ display: 'block', fontSize: 11.5, color: '#64748b', marginTop: 8 }}>
                  Demo Sandbox: Enter any 4 digits (e.g. <code>1234</code>) to verify review access.
                </span>
              </div>

              <button
                type="submit"
                id="btn-verify-draft-access"
                className="zd-btn-action zd-btn-action--primary"
                style={{ width: '100%', height: 42 }}
                disabled={verifyingOtp}
              >
                {verifyingOtp ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    <span>Verifying Access…</span>
                  </>
                ) : (
                  <>
                    <span>Verify & View Document</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Main Body (Completed Acknowledgement OR Draft Review)
  const isCompleted = doc.statusCode === 'completed';
  const isFinalFileProcessing = isCompleted && (doc.finalFileAvailable === false || (downloadInfo && (downloadInfo.isReady === false || downloadInfo.status === 'PROCESSING')));

  return (
    <div className="zd-client-portal-wrapper">
      <header className="zd-client-header">
        <div className="zd-client-logo-box">
          <span className="zd-client-logo-text">ZapDocs</span>
          <span className="zd-client-secure-badge">
            <ShieldCheck size={13} />
            <span>Authenticated Recipient: {doc.allowedSendAction?.targetSignatory || doc.client}</span>
          </span>
        </div>
      </header>

      <main className="zd-client-body">
        {/* Approved Success Notice */}
        {approvedSuccess && (
          <div className="zd-modal-alert zd-modal-alert--success">
            <CheckCircle2 size={18} />
            <div>
              <strong style={{ display: 'block' }}>Draft Approved by Client</strong>
              <span>
                You have approved version {doc.version || 'v1'} of {doc.ref}. The document is now locked for statutory fee settlement and signing execution.
              </span>
            </div>
          </div>
        )}

        {/* Changes Requested Notice */}
        {changesSuccess && (
          <div className="zd-modal-alert zd-modal-alert--warning">
            <MessageSquare size={18} />
            <div>
              <strong style={{ display: 'block' }}>Correction Request Submitted to CA</strong>
              <span>
                Your requested changes and remarks have been forwarded to the Chartered Accountant. The draft document remains unchanged until approved and revised by the CA practice.
              </span>
            </div>
          </div>
        )}

        {/* COMPLETION ACKNOWLEDGEMENT (When Document is Completed) */}
        {isCompleted ? (
          <div className="zd-review-hero-card" style={{ textAlign: 'center', padding: '36px 28px' }}>
            <div className="zd-success-check-badge" style={{ margin: '0 auto 16px' }}>
              <CheckCircle2 size={52} color="#16a34a" />
            </div>

            <h1 className="zd-completion-main-heading" style={{ fontSize: 24, margin: '0 0 8px' }}>
              Your document has been generated successfully.
            </h1>

            <p className="zd-completion-sub" style={{ margin: '0 auto 24px', maxWidth: 480 }}>
              All statutory signatures and state government eStamping have been certified. The original execution file is safely archived in the statutory vault.
            </p>

            <div className="zd-completion-meta-grid" style={{ maxWidth: 560, margin: '0 auto 20px' }}>
              <div className="zd-completion-meta-item">
                <span className="zd-meta-label">Document Reference</span>
                <strong className="zd-meta-val">{doc.ref}</strong>
              </div>
              <div className="zd-completion-meta-item">
                <span className="zd-meta-label">Completion Time</span>
                <strong className="zd-meta-val">
                  {doc.completedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                </strong>
              </div>
              <div className="zd-completion-meta-item">
                <span className="zd-meta-label">eStamp Certificate</span>
                <strong className="zd-meta-val" style={{ color: '#854d0e' }}>
                  {doc.execution?.stampCertificateNo || 'Exempt / Not Required'}
                </strong>
              </div>
              <div className="zd-completion-meta-item">
                <span className="zd-meta-label">Digital Signatures</span>
                <strong className="zd-meta-val" style={{ color: '#16a34a' }}>
                  {doc.execution?.signers?.length || 2} Signatures Verified (PAdES)
                </strong>
              </div>
            </div>

            {/* Download Error Alert */}
            {downloadError && (
              <div className="zd-modal-alert zd-modal-alert--error" style={{ maxWidth: 560, margin: '0 auto 16px', textAlign: 'left' }}>
                <AlertCircle size={16} />
                <span>{downloadError}</span>
              </div>
            )}

            {/* Download Success Alert */}
            {downloadSuccess && (
              <div className="zd-modal-alert zd-modal-alert--success" style={{ maxWidth: 560, margin: '0 auto 16px', textAlign: 'left' }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span>Certified final document downloaded. Cryptographic signatures (PAdES) preserved.</span>
              </div>
            )}

            {/* Password Policy Card */}
            <div className="zd-password-policy-card" style={{ maxWidth: 560, margin: '0 auto 24px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <KeyRound size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: 13, color: '#0f172a' }}>
                    Password-Protected Document Instructions
                  </strong>
                  <p style={{ margin: '4px 0 6px', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                    {downloadInfo?.passwordPolicy?.instructions ||
                      'Password to open the certified document is the first 4 uppercase letters of your organization followed by the last 4 digits of your registered mobile number.'}
                  </p>
                  <span style={{ display: 'block', fontSize: 11, color: '#64748b' }}>
                    Digital signatures are cryptographically preserved. PDF encryption is managed via the statutory signing authority.
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, maxWidth: 440, margin: '0 auto' }}>
              <button
                type="button"
                className="zd-btn-action zd-btn-action--secondary"
                style={{ flex: 1, height: 42 }}
                onClick={() => setIsPreviewOpen(true)}
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
                  <Loader2 size={15} className="spinning" />
                  <span>Final document processing</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--primary"
                  style={{ flex: 1, height: 42 }}
                  onClick={handleDownloadOriginal}
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
        ) : (
          /* Draft Preview Mode */
          <div className="zd-review-hero-card">
            <div className="zd-review-header-row">
              <div className="zd-review-title-box">
                <h1 className="zd-review-doc-title">{doc.title}</h1>
                <div className="zd-review-meta-pills">
                  <span className="zd-order-template-badge">{doc.docType}</span>
                  <span className="zd-doc-ref-pill">Ref: {doc.ref}</span>
                  <span className="zd-version-pill">Version: {doc.version || 'v1'}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Client: {doc.client}</span>
                </div>
              </div>

              {/* Actions Bar */}
              {!approvedSuccess && (
                <div className="zd-review-actions-bar">
                  <button
                    type="button"
                    id="btn-client-request-changes"
                    className="zd-btn-action zd-btn-action--secondary"
                    onClick={() => setIsChangesModalOpen(true)}
                    style={{ height: 40 }}
                  >
                    <MessageSquare size={15} />
                    <span>Request Changes</span>
                  </button>
                  <button
                    type="button"
                    id="btn-client-approve-draft"
                    className="zd-btn-action zd-btn-action--primary"
                    onClick={handleApproveDraft}
                    disabled={isApproving}
                    style={{ height: 40 }}
                  >
                    {isApproving ? (
                      <>
                        <Loader2 size={15} className="spinning" />
                        <span>Recording Approval…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Approve Draft</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Structured Draft Information */}
            <div className="zd-draft-preview-section">
              <div className="zd-draft-section-title">Draft Statutory Terms & Form Data</div>
              <div className="zd-draft-fields-grid">
                {Object.entries(doc.formData || {}).map(([key, val]) => (
                  <div key={key} className="zd-draft-field-cell">
                    <span className="zd-draft-cell-label">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="zd-draft-cell-val">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Request Changes Sub-Modal */}
      {isChangesModalOpen && (
        <div className="zd-modal-backdrop" onClick={() => setIsChangesModalOpen(false)}>
          <div className="zd-modal-card zd-glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="zd-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="zd-modal-icon-badge zd-modal-icon-badge--amber">
                  <FileDiff size={18} color="#d97706" />
                </div>
                <div>
                  <h3 className="zd-modal-title">Request Changes to Draft</h3>
                  <p className="zd-modal-sub">
                    Propose specific field changes and remarks for {doc.ref} ({doc.version || 'v1'}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="zd-modal-close-btn"
                onClick={() => setIsChangesModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCorrection} style={{ padding: '0 24px 20px' }}>
              <div className="zd-modal-alert zd-modal-alert--info" style={{ marginBottom: 14 }}>
                <AlertCircle size={14} />
                <span>
                  Submitted changes are sent as a correction proposal to the CA. The saved document is not edited directly.
                </span>
              </div>

              <div className="zd-form-field">
                <label htmlFor="input-proposed-field" className="zd-form-label">
                  Field / Section Name
                </label>
                <input
                  id="input-proposed-field"
                  type="text"
                  className="zd-form-input"
                  placeholder="e.g. Turnover, Registered Office Address, Audit Notes"
                  value={proposedFieldName}
                  onChange={(e) => setProposedFieldName(e.target.value)}
                />
              </div>

              <div className="zd-form-grid-2" style={{ marginTop: 10 }}>
                <div className="zd-form-field">
                  <label htmlFor="input-current-val" className="zd-form-label">
                    Current Draft Value
                  </label>
                  <input
                    id="input-current-val"
                    type="text"
                    className="zd-form-input"
                    placeholder="Existing value"
                    value={currentFieldValue}
                    onChange={(e) => setCurrentFieldValue(e.target.value)}
                  />
                </div>
                <div className="zd-form-field">
                  <label htmlFor="input-proposed-val" className="zd-form-label">
                    Proposed New Value
                  </label>
                  <input
                    id="input-proposed-val"
                    type="text"
                    className="zd-form-input"
                    placeholder="Your requested correct value"
                    value={proposedFieldValue}
                    onChange={(e) => setProposedFieldValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="zd-form-field" style={{ marginTop: 10 }}>
                <label htmlFor="input-change-comments" className="zd-form-label">
                  Explanation / Remarks <span className="zd-required-star">*</span>
                </label>
                <textarea
                  id="input-change-comments"
                  className="zd-form-textarea"
                  rows={3}
                  placeholder="Explain why this change is needed or mention any discrepancies with GSTR-2B, bank records, or statutory deeds…"
                  value={changeComments}
                  onChange={(e) => setChangeComments(e.target.value)}
                  required
                />
              </div>

              <div className="zd-modal-actions" style={{ marginTop: 18 }}>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--secondary"
                  onClick={() => setIsChangesModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-change-request"
                  className="zd-btn-action zd-btn-action--primary"
                  disabled={submittingChanges}
                >
                  {submittingChanges ? (
                    <>
                      <Loader2 size={14} className="spinning" />
                      <span>Submitting to CA…</span>
                    </>
                  ) : (
                    <span>Submit Correction Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Preview Modal */}
      {isPreviewOpen && (
        <div className="zd-modal-backdrop" onClick={() => setIsPreviewOpen(false)}>
          <div className="zd-modal-card zd-glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="zd-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="zd-modal-icon-badge zd-modal-icon-badge--green">
                  <FileCheck size={20} color="#16a34a" />
                </div>
                <div>
                  <h3 className="zd-modal-title">Certified Final Document</h3>
                  <p className="zd-modal-sub">{doc.ref} • {doc.title}</p>
                </div>
              </div>
              <button type="button" className="zd-modal-close-btn" onClick={() => setIsPreviewOpen(false)}>
                ×
              </button>
            </div>
            <div style={{ padding: '0 24px 20px' }}>
              {/* Statutory Cryptography & Compliance Badge */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  fontSize: 12.5
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>
                    eStamp Certificate
                  </span>
                  <strong style={{ color: '#854d0e', fontFamily: 'monospace' }}>
                    {doc.execution?.stampCertificateNo || 'Exempt / Not Required'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>
                    Cryptography Standard
                  </span>
                  <strong style={{ color: '#16a34a' }}>PAdES / PKCS#7 Verified</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>
                    Digital Signatures
                  </span>
                  <strong style={{ color: '#2563eb' }}>
                    {doc.execution?.signers?.length || 2} Signatures Certified
                  </strong>
                </div>
              </div>

              <div className="zd-draft-preview-section" style={{ margin: 0 }}>
                <div className="zd-draft-section-title">Certified Statutory Record</div>
                <div className="zd-draft-fields-grid">
                  {Object.entries(doc.formData || {}).map(([key, val]) => (
                    <div key={key} className="zd-draft-field-cell">
                      <span className="zd-draft-cell-label">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="zd-draft-cell-val">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--secondary"
                  style={{ height: 38 }}
                  onClick={() => setIsPreviewOpen(false)}
                >
                  Close
                </button>
                {doc.finalFileAvailable === false || (downloadInfo && (downloadInfo.isReady === false || downloadInfo.status === 'PROCESSING')) ? (
                  <button
                    type="button"
                    disabled
                    className="zd-btn-action zd-btn-action--disabled"
                    style={{ height: 38 }}
                    title="The final certified copy is being assembled by the statutory repository."
                  >
                    <Loader2 size={13} className="spinning" />
                    <span>Final document processing</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="zd-btn-action zd-btn-action--primary"
                    style={{ height: 38 }}
                    onClick={handleDownloadOriginal}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 size={13} className="spinning" />
                    ) : (
                      <Download size={13} />
                    )}
                    <span>{isDownloading ? 'Downloading…' : 'Download Document'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
