import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  Eye,
  FileDown,
  Clock,
  CircleCheck,
  AlertTriangle
} from 'lucide-react';

export default function RecentDocumentsTable({ documents = [] }) {
  const navigate = useNavigate();

  const handleActionClick = (action, doc) => {
    switch (action.key) {
      case 'continue_draft':
      case 'review_draft':
      case 'review_changes':
        navigate(`/ca/documents?docId=${doc.id}&action=${action.key}`);
        break;
      case 'view_approvals':
        navigate(`/ca/documents?docId=${doc.id}&tab=approvals`);
        break;
      case 'track_execution':
        navigate(`/ca/documents?docId=${doc.id}&tab=execution`);
        break;
      case 'download_pdf':
        alert(`Downloading original authenticated copy for ${doc.ref}`);
        break;
      default:
        navigate(`/ca/documents?docId=${doc.id}`);
        break;
    }
  };

  const getStatusBadge = (doc) => {
    const isCompleted = doc.statusCode === 'completed';
    const isPending = doc.statusCode === 'ca_review' || doc.statusCode === 'party_review';
    const isIssue = doc.statusCode === 'corrections' || doc.statusCode === 'executing_issue';
    const isDraft = doc.statusCode === 'draft';

    return (
      <span
        className={`zd-recent-status-badge ${
          isCompleted
            ? 'zd-recent-status-badge--completed'
            : isPending
            ? 'zd-recent-status-badge--pending'
            : isIssue
            ? 'zd-recent-status-badge--expiring'
            : 'zd-recent-status-badge--draft'
        }`}
      >
        {isCompleted && <CircleCheck size={12} />}
        {isPending && <Clock size={12} />}
        {isIssue && <AlertTriangle size={12} />}
        {isDraft && <FileText size={12} />}
        <span>{doc.documentStatus}</span>
      </span>
    );
  };

  return (
    <div className="zd-recent-agreements-card zd-glass-card" id="card-recent-documents">
      <div className="zd-recent-card-header">
        <div className="zd-recent-titles">
          <h3 className="zd-recent-title">Recent Documents & Filing Status</h3>
          <p className="zd-recent-subtitle">
            Audits, tax computations, resolutions, and regulatory forms in active processing.
          </p>
        </div>
        <button
          type="button"
          className="zd-recent-view-all-btn"
          id="btn-view-all-docs"
          onClick={() => navigate('/ca/documents')}
          title="Navigate to Documents Vault"
        >
          <span>View All Documents</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Desktop View Table matching reference layout */}
      <div className="zd-recent-table-wrap">
        <table className="zd-recent-table" id="recent-documents-table" aria-label="Recent documents list">
          <thead>
            <tr>
              <th>Document ID / Title</th>
              <th>Client / Entity</th>
              <th>Document Type</th>
              <th>Status Details</th>
              <th>Last Updated</th>
              <th className="zd-col-actions">Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="zd-recent-row">
                {/* Document Reference ID & Title */}
                <td className="zd-col-id">
                  <span className="zd-recent-id-badge">{doc.ref}</span>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <FileText size={14} color="#2563eb" aria-hidden="true" />
                    <span>{doc.title}</span>
                  </div>
                </td>

                {/* Client / Entity */}
                <td className="zd-col-client">
                  <div className="zd-client-primary">
                    <span className="zd-client-name">{doc.client}</span>
                    <span className="zd-client-tag">({doc.clientType})</span>
                  </div>
                </td>

                {/* Document Type Badge */}
                <td className="zd-col-type">
                  <span className="zd-recent-type-badge">{doc.docType}</span>
                </td>

                {/* Status Details */}
                <td className="zd-col-status">
                  <div className="zd-status-stack">
                    {getStatusBadge(doc)}
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      <span className="zd-recent-subbadge">Pay: {doc.paymentStatus}</span>
                      <span className="zd-recent-subbadge">Stamp: {doc.stampStatus}</span>
                    </div>
                  </div>
                </td>

                {/* Last Updated */}
                <td className="zd-col-date">
                  <span className="zd-recent-date">{doc.lastUpdated}</span>
                </td>

                {/* Quick Actions matching reference layout */}
                <td className="zd-col-actions" style={{ textAlign: 'right' }}>
                  <div className="zd-recent-actions-group">
                    <button
                      type="button"
                      id={`btn-view-${doc.id}`}
                      className="zd-recent-action-btn zd-recent-action-btn--view"
                      title={`View document preview & details (${doc.ref})`}
                      onClick={() => navigate(`/ca/documents?docId=${doc.id}`)}
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </button>

                    {(doc.allowedActions || []).map((action, aIdx) => (
                      <button
                        key={aIdx}
                        type="button"
                        id={`btn-act-${doc.id}-${action.key}`}
                        className={`zd-recent-action-btn ${
                          action.primary
                            ? 'zd-recent-action-btn--primary'
                            : 'zd-recent-action-btn--pdf'
                        }`}
                        onClick={() => handleActionClick(action, doc)}
                      >
                        {action.key === 'download_pdf' && <FileDown size={13} />}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View Compact Cards (< 768px) */}
      <div className="ca-mobile-cards-list" role="list">
        {documents.map((doc) => (
          <div key={doc.id} className="ca-mobile-doc-card" role="listitem">
            <div className="ca-mobile-doc-top">
              <span className="ca-mobile-ref">{doc.ref}</span>
              {getStatusBadge(doc)}
            </div>

            <h3 className="ca-mobile-title">{doc.title}</h3>

            <div className="ca-mobile-meta">
              <span>{doc.client}</span> • <span>{doc.docType}</span>
            </div>

            <div className="ca-mobile-subtags">
              <span>Payment: {doc.paymentStatus}</span> | <span>Stamp: {doc.stampStatus}</span>
            </div>

            <div className="ca-mobile-actions">
              <span className="ca-mobile-date">{doc.lastUpdated}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="zd-recent-action-btn zd-recent-action-btn--view"
                  style={{ height: 30, padding: '0 8px', fontSize: 11 }}
                  onClick={() => navigate(`/ca/documents?docId=${doc.id}`)}
                >
                  <Eye size={12} />
                  <span>View</span>
                </button>
                {(doc.allowedActions || []).map((action, aIdx) => (
                  <button
                    key={aIdx}
                    type="button"
                    className={`zd-recent-action-btn ${
                      action.primary ? 'zd-recent-action-btn--primary' : 'zd-recent-action-btn--pdf'
                    }`}
                    style={{ height: 30, padding: '0 8px', fontSize: 11 }}
                    onClick={() => handleActionClick(action, doc)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
