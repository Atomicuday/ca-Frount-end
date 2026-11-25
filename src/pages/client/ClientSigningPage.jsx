import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  KeyRound,
  Download,
  Eye,
  Loader2,
  Stamp,
  Users,
  Fingerprint,
  FileText
} from 'lucide-react';
import { caDocumentsService } from '../../services/api/caDocumentsService.js';
import './ClientWorkflow.css';

export default function ClientSigningPage() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Step 1: Portal Access OTP state (portal OTP success grants access ONLY, does not sign)
  const [isPortalAccessVerified, setIsPortalAccessVerified] = useState(false);
  const [portalOtp, setPortalOtp] = useState('');
  const [verifyingPortalOtp, setVerifyingPortalOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Step 2: Provider eSign state
  const [isProviderSigning, setIsProviderSigning] = useState(false);
  const [providerMethod, setProviderMethod] = useState('aadhaar'); // 'aadhaar' | 'dsc'
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [dscTokenPin, setDscTokenPin] = useState('');
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [selectedSignerId, setSelectedSignerId] = useState(null);

  // Step 3: Completion & Download info
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    if (!signingModalOpen && !isPreviewOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (signingModalOpen) setSigningModalOpen(false);
        else if (isPreviewOpen) setIsPreviewOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [signingModalOpen, isPreviewOpen]);

  // Load document by token or ID
  const loadDoc = async () => {
    try {
      const data = await caDocumentsService.getDocumentById(token);
      if (data) {
        setDoc(data);
        if (data.statusCode === 'completed') {
          try {
            const info = await caDocumentsService.getRecipientExecutedDocument(data.id, {
              isAccessVerified: true,
              assignedDocId: data.id
            });
            setDownloadInfo(info);
          } catch {
            const fallback = await caDocumentsService.getDocumentDownloadInfo(data.id);
            setDownloadInfo(fallback);
          }
        }
      } else {
        setError('Signing invitation link is invalid or has expired.');
      }
    } catch (err) {
      console.error('Failed to load signing document:', err);
      setError('Unable to load document details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoc();
  }, [token]);

  // Handle Portal Access OTP (Grants access only)
  const handleVerifyPortalAccess = (e) => {
    e.preventDefault();
    setOtpError('');

    if (!portalOtp || portalOtp.trim().length < 4) {
      setOtpError('Please enter the 4-digit verification code.');
      return;
    }

    setVerifyingPortalOtp(true);
    setTimeout(() => {
      // Portal OTP grants access to view the locked execution document
      setIsPortalAccessVerified(true);
      setVerifyingPortalOtp(false);
    }, 600);
  };

  // Open Provider eSign Dialog for a specific signer
  const handleOpenSignModal = (signerId) => {
    setSelectedSignerId(signerId);
    setAadhaarOtp('');
    setDscTokenPin('');
    setSigningModalOpen(true);
  };

  // Complete Provider eSign Authentication
  const handleCompleteProviderSign = async (e) => {
    if (e) e.preventDefault();
    setIsSubmittingSignature(true);
    try {
      const authResult = {
        method: providerMethod === 'aadhaar' ? 'Aadhaar eSign OTP' : 'Class-3 DSC Token',
        authenticatedAt: new Date().toISOString()
      };

      const res = await caDocumentsService.completeSignerSignature(doc.id, selectedSignerId, authResult);
      setDoc(res.document);
      setSigningModalOpen(false);

      if (res.isFullyCompleted) {
        try {
          const info = await caDocumentsService.getRecipientExecutedDocument(doc.id, {
            isAccessVerified: true,
            assignedDocId: doc.id
          });
          setDownloadInfo(info);
        } catch {
          const fallback = await caDocumentsService.getDocumentDownloadInfo(doc.id);
          setDownloadInfo(fallback);
        }
      }
    } catch (err) {
      console.error('Provider sign error:', err);
      setError(err.message || 'Signature authentication failed.');
    } finally {
      setIsSubmittingSignature(false);
    }
  };

  const handleDownloadOriginal = async () => {
    setIsDownloading(true);
    setDownloadError('');
    setDownloadSuccess(false);
    try {
      await caDocumentsService.downloadRecipientExecutedDocument(doc.id, {
        isAccessVerified: isPortalAccessVerified,
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

  if (loading) {
    return (
      <div className="zd-client-portal-wrapper">
        <header className="zd-client-header">
          <div className="zd-client-logo-box">
            <span className="zd-client-logo-text">ZapDocs</span>
            <span className="zd-client-secure-badge">
              <ShieldCheck size={13} />
              <span>Statutory Execution Vault</span>
            </span>
          </div>
        </header>
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <Loader2 size={36} className="spinning" color="#2563eb" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Connecting to execution and eSign service…</p>
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
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>Invitation Error</strong>
              <span>{error || 'Unable to load signing session.'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1: Portal Access Verification Gate (Grants portal access only; does NOT sign)
  if (!isPortalAccessVerified) {
    return (
      <div className="zd-client-portal-wrapper">
        <header className="zd-client-header">
          <div className="zd-client-logo-box">
            <span className="zd-client-logo-text">ZapDocs</span>
            <span className="zd-client-secure-badge">
              <ShieldCheck size={13} />
              <span>Signer Identity Verification</span>
            </span>
          </div>
        </header>

        <div className="zd-client-body">
          <div className="zd-verification-card">
            <div className="zd-verification-icon-badge">
              <Fingerprint size={26} color="#2563eb" />
            </div>

            <h2 className="zd-verification-title">Portal Access Verification</h2>
            <p className="zd-verification-sub">
              Access invitation for <strong>{doc.allowedSendAction?.targetSignatory || doc.client}</strong>. Please enter the 4-digit portal access code sent to your registered number (<code>{doc.allowedSendAction?.phone || '+91 98860 11223'}</code>).
            </p>

            <div className="zd-demo-badge-banner" style={{ marginBottom: 16, textAlign: 'left' }}>
              <Lock size={14} color="#2563eb" />
              <span>
                <strong>Notice:</strong> Portal access verification unlocks the execution packet for inspection. It does not sign the document.
              </span>
            </div>

            {otpError && (
              <div className="zd-modal-alert zd-modal-alert--error" style={{ marginBottom: 14, textAlign: 'left' }}>
                <AlertCircle size={15} />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPortalAccess}>
              <div style={{ marginBottom: 18 }}>
                <input
                  type="text"
                  maxLength={4}
                  className="zd-otp-input-field"
                  placeholder="••••"
                  value={portalOtp}
                  onChange={(e) => setPortalOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  autoFocus
                />
                <span style={{ display: 'block', fontSize: 11.5, color: '#64748b', marginTop: 8 }}>
                  Demo Sandbox: Enter any 4 digits (e.g. <code>1234</code>) to unlock portal access.
                </span>
              </div>

              <button
                type="submit"
                id="btn-verify-portal-access"
                className="zd-btn-action zd-btn-action--primary"
                style={{ width: '100%', height: 42 }}
                disabled={verifyingPortalOtp}
              >
                {verifyingPortalOtp ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    <span>Verifying Access…</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Execution Document</span>
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

  // STEP 2 & 3: Locked Execution View, Signer Progress, & Completion
  const signers = doc.execution?.signers || [];
  const allSignersSigned = signers.every((s) => s.status === 'SIGNED');
  const stampIssued = !doc.execution?.stampRequired || doc.execution?.stampStatus === 'ISSUED';
  const isFullyCompleted = doc.statusCode === 'completed' || (allSignersSigned && stampIssued);

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
        {/* Step Progress Trackers */}
        <div className="zd-signing-steps-bar">
          <div className="zd-step-pill completed">
            <CheckCircle2 size={14} color="#16a34a" />
            <span>Access Verified</span>
          </div>
          <div className="zd-step-divider" />

          <div className={`zd-step-pill ${allSignersSigned ? 'completed' : 'active'}`}>
            {allSignersSigned ? (
              <CheckCircle2 size={14} color="#16a34a" />
            ) : (
              <Loader2 size={14} className="spinning" color="#2563eb" />
            )}
            <span>
              Signatures ({signers.filter((s) => s.status === 'SIGNED').length}/{signers.length})
            </span>
          </div>
          <div className="zd-step-divider" />

          <div className={`zd-step-pill ${stampIssued ? 'completed' : 'active'}`}>
            <Stamp size={14} color={stampIssued ? '#16a34a' : '#2563eb'} />
            <span>{doc.execution?.stampRequired ? 'eStamp Issued' : 'Stamp Exempt'}</span>
          </div>
          <div className="zd-step-divider" />

          <div className={`zd-step-pill ${isFullyCompleted ? 'completed' : 'pending'}`}>
            <FileCheck size={14} color={isFullyCompleted ? '#16a34a' : '#94a3b8'} />
            <span>{isFullyCompleted ? 'Completed & Stored' : 'Final Verification'}</span>
          </div>
        </div>

        {/* COMPLETION SCREEN (Requirement 7 & 8) */}
        {isFullyCompleted ? (
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
                  {signers.length} Signatures Verified (PAdES)
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
              {doc.finalFileAvailable === false || (downloadInfo && (downloadInfo.isReady === false || downloadInfo.status === 'PROCESSING')) ? (
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
          /* IN-PROGRESS SIGNING VIEW */
          <div className="zd-review-hero-card">
            {/* eStamp Certificate Watermark Banner */}
            {doc.execution?.stampRequired && (
              <div className="zd-estamp-cert-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Stamp size={20} color="#854d0e" />
                  <div>
                    <strong style={{ fontSize: 13, color: '#713f12', display: 'block' }}>
                      Government Non-Judicial eStamp Issued
                    </strong>
                    <span style={{ fontSize: 11.5, color: '#854d0e' }}>
                      Certificate No: <code className="zd-estamp-cert-num">{doc.execution.stampCertificateNo || 'IN-KA99120488219M'}</code>
                    </span>
                  </div>
                </div>
                <span className="zd-badge zd-badge--green" style={{ fontSize: 11.5 }}>
                  Duty Paid (Govt Passthrough)
                </span>
              </div>
            )}

            {/* Document Header */}
            <div className="zd-review-header-row">
              <div className="zd-review-title-box">
                <h1 className="zd-review-doc-title">{doc.title}</h1>
                <div className="zd-review-meta-pills">
                  <span className="zd-order-template-badge">{doc.docType}</span>
                  <span className="zd-doc-ref-pill">Ref: {doc.ref}</span>
                  <span className="zd-version-pill">{doc.version || 'v1'} (Locked for Execution)</span>
                </div>
              </div>
            </div>

            {/* Signatories Execution Table */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Users size={16} color="#2563eb" />
                <strong style={{ fontSize: 14, color: '#0f172a' }}>Authorized Signatories & Status</strong>
              </div>

              <div className="zd-signers-list">
                {signers.map((s) => {
                  const isSigned = s.status === 'SIGNED';
                  return (
                    <div
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: isSigned ? '#f0fdf4' : '#ffffff',
                        border: `1px solid ${isSigned ? '#bbf7d0' : '#e2e8f0'}`,
                        borderRadius: 10,
                        marginBottom: 10
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: 13.5, color: '#0f172a' }}>{s.name}</strong>
                        <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>({s.role})</span>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                          {s.phone} • {s.email}
                        </div>
                      </div>

                      <div>
                        {isSigned ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600, fontSize: 12.5 }}>
                            <CheckCircle2 size={16} />
                            <span>Signed ({s.providerAuth || 'Aadhaar eSign'})</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            id={`btn-sign-${s.id}`}
                            className="zd-btn-action zd-btn-action--primary"
                            style={{ height: 34, fontSize: 12.5 }}
                            onClick={() => handleOpenSignModal(s.id)}
                          >
                            <Fingerprint size={14} />
                            <span>Sign Document</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Locked Content Notice */}
            <div className="zd-demo-badge-banner" style={{ marginTop: 20 }}>
              <Lock size={14} color="#2563eb" />
              <span>
                Document clauses and financial figures are locked. All signatures are recorded with cryptographic timestamps.
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Provider eSign Modal Simulator */}
      {signingModalOpen && (
        <div className="zd-modal-backdrop" onClick={() => setSigningModalOpen(false)}>
          <div className="zd-modal-card zd-glass-card zd-provider-esign-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="zd-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="zd-modal-icon-badge">
                  <Fingerprint size={20} color="#2563eb" />
                </div>
                <div>
                  <h3 className="zd-modal-title">Provider Statutory eSign</h3>
                  <p className="zd-modal-sub">UIDAI Aadhaar eSign / Controller of Certifying Authorities (CCA)</p>
                </div>
              </div>
              <button
                type="button"
                className="zd-modal-close-btn"
                onClick={() => setSigningModalOpen(false)}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCompleteProviderSign} className="zd-modal-body zd-provider-esign-form" style={{ padding: '0 24px 20px' }}>
              <div className="zd-modal-tab-group" style={{ marginBottom: 14 }}>
                <button
                  type="button"
                  className={`zd-modal-tab-btn ${providerMethod === 'aadhaar' ? 'active' : ''}`}
                  onClick={() => setProviderMethod('aadhaar')}
                >
                  Aadhaar OTP eSign
                </button>
                <button
                  type="button"
                  className={`zd-modal-tab-btn ${providerMethod === 'dsc' ? 'active' : ''}`}
                  onClick={() => setProviderMethod('dsc')}
                >
                  Class-3 DSC Token
                </button>
              </div>

              {providerMethod === 'aadhaar' ? (
                <div className="zd-form-field">
                  <label htmlFor="input-aadhaar-otp" className="zd-form-label">
                    Enter UIDAI Aadhaar OTP (6 Digits)
                  </label>
                  <input
                    id="input-aadhaar-otp"
                    type="text"
                    maxLength={6}
                    className="zd-form-input"
                    placeholder="e.g. 123456"
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    autoFocus
                  />
                  <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Demo Sandbox: Enter any 6 digits to simulate Aadhaar authentication.
                  </span>
                </div>
              ) : (
                <div className="zd-form-field">
                  <label htmlFor="input-dsc-pin" className="zd-form-label">
                    USB Crypto Token User PIN
                  </label>
                  <input
                    id="input-dsc-pin"
                    type="password"
                    maxLength={8}
                    className="zd-form-input"
                    placeholder="Enter Token PIN"
                    value={dscTokenPin}
                    onChange={(e) => setDscTokenPin(e.target.value)}
                    autoFocus
                  />
                  <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
                    Demo Sandbox: Enter any PIN to sign via hardware token.
                  </span>
                </div>
              )}

              <div className="zd-modal-actions" style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--secondary"
                  onClick={() => setSigningModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-provider-sign"
                  className="zd-btn-action zd-btn-action--primary"
                  disabled={isSubmittingSignature}
                >
                  {isSubmittingSignature ? (
                    <>
                      <Loader2 size={14} className="spinning" />
                      <span>Validating Certificate…</span>
                    </>
                  ) : (
                    <span>Authorize Signature</span>
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
          <div className="zd-modal-card zd-glass-card zd-preview-modal-card" onClick={(e) => e.stopPropagation()}>
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
