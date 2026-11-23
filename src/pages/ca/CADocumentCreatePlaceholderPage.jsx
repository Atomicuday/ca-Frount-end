import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePlus, ArrowLeft, Users, FileText } from 'lucide-react';

export default function CADocumentCreatePlaceholderPage() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 16px' }}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => navigate('/ca/dashboard')}
        style={{ marginBottom: 16 }}
      >
        <ArrowLeft size={16} />
        <span>Back to Dashboard</span>
      </button>

      <div className="zd-card" style={{ padding: '36px 32px', textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--color-brand-light)',
            color: 'var(--color-brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}
        >
          <FilePlus size={28} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          Add Client & Create Document
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 28 }}>
          This minimal placeholder route connects the primary header action to the document creation workflow.
          In the full implementation, this step guides the CA through client KYC selection, template drafting,
          eStamp procurement, and multi-party signer routing.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/ca/clients')}
          >
            <Users size={15} />
            <span>View Clients Vault</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/ca/documents')}
          >
            <FileText size={15} />
            <span>Browse Documents Repository</span>
          </button>
        </div>
      </div>
    </div>
  );
}
