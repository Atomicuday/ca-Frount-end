import React, { useState } from 'react';
import { ShieldCheck, Save, Check } from 'lucide-react';
import { useCAAuth } from '../../hooks/useCAAuth';
import './CAProfile.css';

export default function CAProfileScreen() {
  const { user, updateProfile } = useCAAuth();
  const [isSaved, setIsSaved] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || 'CA Rajesh Sharma, FCA',
    firmName: user?.firmName || 'R. Sharma & Associates',
    membershipNo: user?.membershipNo || '058921',
    firmRegNo: user?.firmRegNo || '014298S',
    email: user?.email || 'rajesh.sharma@zapdocs.in',
    phone: user?.phone || '+91 98450 12345',
    city: user?.city || 'Bengaluru',
    state: user?.state || 'Karnataka',
    bankAccount: '•••• •••• 9842 (HDFC Bank)',
    upiId: 'sharma.ca@hdfcbank'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="ca-profile-screen">
      <div className="ca-page-header">
        <div className="ca-page-title-wrap">
          <h1 className="ca-page-title">Profile & Practice Settings</h1>
          <p className="ca-page-subtitle">
            Manage your ICAI practitioner credentials, firm profile, and settlement preferences
          </p>
        </div>
      </div>

      <div className="ca-profile-grid">
        {/* Profile Card Summary */}
        <div className="zd-card ca-profile-summary-card">
          <div className="ca-profile-big-avatar">
            {formData.name
              .replace(/^(CA|Dr|Mr|Ms)\s+/i, '')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase()}
          </div>
          <h2 className="ca-summary-name">{formData.name}</h2>
          <p className="ca-summary-firm">{formData.firmName}</p>
          <div className="badge badge-success" style={{ margin: '8px 0 16px' }}>
            <ShieldCheck size={12} /> Certificate of Practice (COP) Active
          </div>

          <div className="ca-summary-info-list">
            <div className="ca-summary-info-row">
              <span className="ca-summary-label">ICAI Membership:</span>
              <span className="ca-summary-val">{formData.membershipNo}</span>
            </div>
            <div className="ca-summary-info-row">
              <span className="ca-summary-label">Firm Reg No (FRN):</span>
              <span className="ca-summary-val">{formData.firmRegNo}</span>
            </div>
            <div className="ca-summary-info-row">
              <span className="ca-summary-label">Jurisdiction State:</span>
              <span className="ca-summary-val">{formData.state}</span>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <form className="zd-card ca-profile-form-card" onSubmit={handleSubmit}>
          <div className="ca-form-section-title">Practitioner & Firm Details</div>

          <div className="ca-form-row">
            <div className="ca-form-group">
              <label htmlFor="ca-name">Full Practitioner Name</label>
              <input
                id="ca-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="ca-input"
              />
            </div>
            <div className="ca-form-group">
              <label htmlFor="ca-firm">Firm / Practice Name</label>
              <input
                id="ca-firm"
                type="text"
                value={formData.firmName}
                onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                className="ca-input"
              />
            </div>
          </div>

          <div className="ca-form-row">
            <div className="ca-form-group">
              <label htmlFor="ca-mem">ICAI Membership No.</label>
              <input
                id="ca-mem"
                type="text"
                value={formData.membershipNo}
                onChange={(e) => setFormData({ ...formData, membershipNo: e.target.value })}
                className="ca-input"
              />
            </div>
            <div className="ca-form-group">
              <label htmlFor="ca-frn">Firm Registration No. (FRN)</label>
              <input
                id="ca-frn"
                type="text"
                value={formData.firmRegNo}
                onChange={(e) => setFormData({ ...formData, firmRegNo: e.target.value })}
                className="ca-input"
              />
            </div>
          </div>

          <div className="ca-form-row">
            <div className="ca-form-group">
              <label htmlFor="ca-email">Registered Email</label>
              <input
                id="ca-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="ca-input"
              />
            </div>
            <div className="ca-form-group">
              <label htmlFor="ca-phone">Mobile Phone</label>
              <input
                id="ca-phone"
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="ca-input"
              />
            </div>
          </div>

          <div className="ca-form-section-title" style={{ marginTop: 18 }}>
            Bank & UPI Settlement Details
          </div>

          <div className="ca-form-row">
            <div className="ca-form-group">
              <label htmlFor="ca-bank">Primary Settlement Bank Account</label>
              <input
                id="ca-bank"
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                className="ca-input"
              />
            </div>
            <div className="ca-form-group">
              <label htmlFor="ca-upi">Firm UPI VPA</label>
              <input
                id="ca-upi"
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                className="ca-input"
              />
            </div>
          </div>

          <div className="ca-form-actions">
            <button type="submit" className="btn btn-primary">
              {isSaved ? <Check size={14} /> : <Save size={14} />}
              <span>{isSaved ? 'Changes Saved' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
