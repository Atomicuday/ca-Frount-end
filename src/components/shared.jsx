import React, { useState } from 'react';
import { Loader2, AlertCircle, FileX, ChevronDown, ChevronUp } from 'lucide-react';

export const TableSkeleton = ({ rows = 5, columns = 5 }) => (
  <div style={{ padding: '8px 0' }}>
    {Array.from({ length: rows }).map((_, rIdx) => (
      <div
        key={rIdx}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 16,
          padding: '14px 16px',
          borderBottom: '1px solid var(--color-border-subtle)'
        }}
      >
        {Array.from({ length: columns }).map((_, cIdx) => (
          <div
            key={cIdx}
            style={{
              height: 14,
              borderRadius: 4,
              backgroundColor: 'rgba(226, 232, 240, 0.65)',
              width: cIdx === 0 ? '65%' : '80%'
            }}
          />
        ))}
      </div>
    ))}
  </div>
);

export const LoadingState = ({ message = 'Loading CA Portal data…' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: 'var(--color-text-secondary)'
    }}
  >
    <Loader2
      size={24}
      style={{
        animation: 'spin 1s linear infinite',
        color: 'var(--color-brand)',
        marginBottom: 12
      }}
    />
    <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{message}</p>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const ErrorState = ({
  message = 'The service is temporarily unavailable. Please try again.',
  technicalDetails,
  onRetry
}) => {
  const [showTech, setShowTech] = useState(false);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 20px',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: 'var(--status-error-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--status-error)',
          marginBottom: 12
        }}
      >
        <AlertCircle size={22} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
        Unable to load data
      </p>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 420, marginBottom: 16 }}>
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry}>
          Try again
        </button>
      )}
      {technicalDetails && (
        <div style={{ marginTop: 14 }}>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => setShowTech(!showTech)}
          >
            Technical Details {showTech ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showTech && (
            <pre
              style={{
                marginTop: 8,
                padding: 10,
                background: 'var(--color-surface-subtle)',
                borderRadius: 6,
                fontSize: 11,
                textAlign: 'left'
              }}
            >
              {technicalDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export const EmptyState = ({ title = 'No records found', message, actionText, onAction }) => (
  <div
    style={{
      padding: '48px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        backgroundColor: 'var(--color-surface-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
        marginBottom: 14
      }}
    >
      <FileX size={24} />
    </div>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
      {title}
    </h3>
    {message && (
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 360, marginBottom: 16 }}>
        {message}
      </p>
    )}
    {actionText && onAction && (
      <button className="btn btn-primary" onClick={onAction}>
        {actionText}
      </button>
    )}
  </div>
);

export { default as TablePagination } from './common/TablePagination.jsx';
