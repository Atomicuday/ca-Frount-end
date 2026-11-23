import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  User,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { useCAAuth } from '../../hooks/useCAAuth';
import ZapDocsLogo from '../../components/ZapDocsLogo';
import './CALogin.css';

export default function CALoginScreen() {
  const navigate = useNavigate();
  const { login } = useCAAuth();

  const [authMode, setAuthMode] = useState('icai'); // 'icai' | 'otp'
  const [membershipNo, setMembershipNo] = useState('058921');
  const [password, setPassword] = useState('••••••••');
  const [phone, setPhone] = useState('9845012345');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'icai') {
        if (!membershipNo.trim()) {
          setError('Please enter your 6-digit ICAI membership number.');
          setLoading(false);
          return;
        }
        await login(membershipNo, password);
        navigate('/ca/dashboard');
      } else {
        if (!otpSent) {
          if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
            setError('Please enter a valid 10-digit registered mobile number.');
            setLoading(false);
            return;
          }
          setOtpSent(true);
          setLoading(false);
          return;
        }
        if (!otp || otp.trim().length < 4) {
          setError('Please enter the 4-digit verification code.');
          setLoading(false);
          return;
        }
        await login(phone, otp);
        navigate('/ca/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoAccess = async () => {
    setLoading(true);
    try {
      await login('058921', 'demo');
      navigate('/ca/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ca-login-wrapper">
      <div className="ca-login-container">
        {/* Brand Header */}
        <div className="ca-login-header-block">
          <ZapDocsLogo size="lg" badge="CA PORTAL" subtitle="Chartered Accountants Practice Suite" />
        </div>

        {/* Login Card */}
        <div className="ca-login-card">
          <div className="ca-login-title-row">
            <h1 className="ca-login-title">Practitioner Portal Sign In</h1>
            <p className="ca-login-sub">
              Access your firm's compliance vault, client filings, and statutory execution
            </p>
          </div>

          {/* Auth Method Tabs */}
          <div className="ca-login-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'icai'}
              className={`ca-login-tab-btn ${authMode === 'icai' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('icai');
                setError('');
              }}
            >
              <ShieldCheck size={14} />
              <span>ICAI Member ID</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === 'otp'}
              className={`ca-login-tab-btn ${authMode === 'otp' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('otp');
                setError('');
              }}
            >
              <Smartphone size={14} />
              <span>Mobile OTP</span>
            </button>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: 12.5,
                marginBottom: 16
              }}
              role="alert"
            >
              <AlertCircle size={15} flexShrink={0} />
              <span>{error}</span>
            </div>
          )}

          <form className="ca-login-form" onSubmit={handleLoginSubmit}>
            {authMode === 'icai' ? (
              <>
                <div className="ca-login-field">
                  <label htmlFor="input-membership-no" className="ca-login-label">
                    <span>ICAI Membership Number</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>6-Digit MRN</span>
                  </label>
                  <div className="ca-login-input-wrap">
                    <User size={16} className="ca-login-input-icon" aria-hidden="true" />
                    <input
                      id="input-membership-no"
                      type="text"
                      className="ca-login-input"
                      placeholder="e.g. 058921"
                      value={membershipNo}
                      onChange={(e) => setMembershipNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="ca-login-field">
                  <label htmlFor="input-ca-password" className="ca-login-label">
                    <span>Portal Password</span>
                  </label>
                  <div className="ca-login-input-wrap">
                    <KeyRound size={16} className="ca-login-input-icon" aria-hidden="true" />
                    <input
                      id="input-ca-password"
                      type="password"
                      className="ca-login-input"
                      placeholder="Enter practitioner password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="ca-login-field">
                  <label htmlFor="input-ca-phone" className="ca-login-label">
                    <span>Registered Mobile Number</span>
                  </label>
                  <div className="ca-login-input-wrap">
                    <Smartphone size={16} className="ca-login-input-icon" aria-hidden="true" />
                    <input
                      id="input-ca-phone"
                      type="tel"
                      className="ca-login-input"
                      placeholder="10-digit mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={otpSent}
                      required
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="ca-login-field">
                    <label htmlFor="input-ca-otp" className="ca-login-label">
                      <span>4-Digit Verification OTP</span>
                    </label>
                    <div className="ca-login-input-wrap">
                      <KeyRound size={16} className="ca-login-input-icon" aria-hidden="true" />
                      <input
                        id="input-ca-otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="ca-login-input"
                        placeholder="Enter OTP (e.g. 1234)"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="ca-login-actions">
              <button
                type="submit"
                className="btn btn-primary ca-login-submit-btn"
                disabled={loading}
              >
                <span>
                  {authMode === 'otp' && !otpSent
                    ? 'Send Verification OTP'
                    : loading
                    ? 'Signing In…'
                    : 'Sign In to CA Vault'}
                </span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="btn btn-outline ca-login-demo-btn"
                onClick={handleInstantDemoAccess}
                disabled={loading}
                title="Immediate access with pre-configured mock CA credentials"
              >
                <Sparkles size={14} color="#0071e3" />
                <span>Instant Demo Access (CA Rajesh Sharma)</span>
              </button>
            </div>
          </form>

          <div className="ca-login-badge-row">
            <span className="ca-login-badge">
              <CheckCircle2 size={13} color="#16a34a" /> 256-Bit SSL Encrypted
            </span>
            <span>•</span>
            <span className="ca-login-badge">
              <CheckCircle2 size={13} color="#16a34a" /> ICAI Guidelines Compliant
            </span>
          </div>
        </div>

        <p className="ca-login-footer-notes">
          ZapDocs Compliance & Statutory Execution Suite for Indian Chartered Accountants.
        </p>
      </div>
    </div>
  );
}
