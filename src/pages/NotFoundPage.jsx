import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        className="zd-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '40px 32px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'var(--color-surface-subtle)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-brand)',
            marginBottom: 16
          }}
        >
          <FileQuestion size={28} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--color-text-primary)' }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
          The requested route does not exist in the ZapDocs CA Portal.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/ca/dashboard')}
          style={{ width: '100%' }}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

export default NotFoundPage;
