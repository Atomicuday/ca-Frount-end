import React, { useState, useEffect } from 'react';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Bell
} from 'lucide-react';
import { caBulkImportService } from '../../services/api/caBulkImportService.js';
import './DueExpiringSection.css';

export default function DueExpiringSection({ onSendReminder, onSelectDocument: _onSelectDocument }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderToast, setReminderToast] = useState(null);

  const loadDueExpiringDocs = async () => {
    try {
      const docs = await caBulkImportService.getDueAndExpiringDocuments({ filter: activeFilter });
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load due/expiring documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueExpiringDocs();
  }, [activeFilter]);

  const handleRemind = (doc) => {
    if (onSendReminder) {
      onSendReminder(doc);
    } else {
      setReminderToast(`Dispatched portal/email reminder to ${doc.client} for ${doc.ref}`);
      setTimeout(() => setReminderToast(null), 3500);
    }
  };

  const FILTERS = [
    { key: 'All', label: 'All Tracked' },
    { key: 'Overdue', label: 'Overdue', isOverdue: true },
    { key: 'Due in 7 Days', label: 'Due in 7 Days' },
    { key: 'Due in 30 Days', label: 'Due in 30 Days' },
    { key: 'Expired', label: 'Expired', isExpired: true },
    { key: 'Expiring in 30 Days', label: 'Expiring in 30 Days' }
  ];

  const currentFilterLabel = FILTERS.find((f) => f.key === activeFilter)?.label || activeFilter;

  return (
    <div className="zd-due-expiring-card">
      <div
        className="zd-due-expiring-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded);
        }}
        aria-expanded={isExpanded}
      >
        <div className="zd-due-expiring-titles">
          <div className="zd-due-expiring-icon-badge" aria-hidden="true">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="zd-due-expiring-title">Due & Expiring Documents</h3>
            <p className="zd-due-expiring-subtitle">
              Monitor task deadlines, compliance filing targets, and legal charter validity
            </p>
          </div>
        </div>

        {/* Right Header Controls: Period/Status Dropdown, Scheduled Count & Collapse */}
        <div className="zd-due-header-right" onClick={(e) => e.stopPropagation()}>
          <div className="zd-due-dropdown-group">
            <label htmlFor="select-due-period-status" className="zd-due-dropdown-label">
              Period / Status
            </label>
            <div className="zd-due-select-wrap">
              <select
                id="select-due-period-status"
                className="zd-due-status-select"
                value={activeFilter}
                onChange={(e) => {
                  setActiveFilter(e.target.value);
                  if (!isExpanded) setIsExpanded(true);
                }}
                aria-label="Period or status filter for due and expiring documents"
              >
                {FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="zd-due-select-chevron" aria-hidden="true" />
            </div>
          </div>

          <span className="zd-due-badge zd-due-badge--urgent">
            {documents.length} Scheduled
          </span>

          <button
            type="button"
            className="zd-due-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse Due and Expiring section' : 'Expand Due and Expiring section'}
            title={isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {reminderToast && (
            <div
              style={{
                padding: '8px 20px',
                background: '#ecfdf5',
                color: '#065f46',
                fontSize: '12px',
                fontWeight: 600,
                borderBottom: '1px solid #a7f3d0'
              }}
            >
              ✓ {reminderToast}
            </div>
          )}

          <div className="zd-due-table-wrapper">
            {documents.length === 0 ? (
              <div className="zd-due-empty">
                {loading ? 'Checking statutory dates…' : `No documents match filter "${currentFilterLabel}".`}
              </div>
            ) : (
              <table className="zd-due-table">
                <thead>
                  <tr>
                    <th style={{ width: '24%' }}>Client Entity</th>
                    <th style={{ width: '28%' }}>Document Request</th>
                    <th style={{ width: '18%' }}>Target Date</th>
                    <th style={{ width: '16%' }}>Remaining / Overdue</th>
                    <th style={{ width: '14%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const hasDueDate = Boolean(doc.dueDate);
                    const relevantDate = doc.dueDate || doc.expiryDate;
                    const isDue = hasDueDate;

                    return (
                      <tr key={doc.id}>
                        <td>
                          <strong>{doc.client}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            ID: {doc.clientId || '—'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {doc.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {doc.ref} • {doc.status || 'Draft'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px', color: '#0f172a' }}>
                            {relevantDate}
                          </div>
                          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                            {isDue ? 'Due Date (Task Deadline)' : 'Expiry Date (Charter Validity)'}
                          </div>
                        </td>
                        <td>
                          {isDue ? (
                            doc.isDueOverdue ? (
                              <span className="zd-due-badge zd-due-badge--overdue">
                                ⚠️ Overdue by {Math.abs(doc.dueDaysRemaining)} days
                              </span>
                            ) : doc.dueDaysRemaining <= 7 ? (
                              <span className="zd-due-badge zd-due-badge--urgent">
                                Due in {doc.dueDaysRemaining} days
                              </span>
                            ) : (
                              <span className="zd-due-badge zd-due-badge--normal">
                                Due in {doc.dueDaysRemaining} days
                              </span>
                            )
                          ) : doc.isExpired ? (
                            <span className="zd-due-badge zd-due-badge--expired">
                              Expired {Math.abs(doc.expiryDaysRemaining)} days ago
                            </span>
                          ) : (
                            <span className="zd-due-badge zd-due-badge--normal">
                              Expires in {doc.expiryDaysRemaining} days
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="zd-due-remind-btn"
                            onClick={() => handleRemind(doc)}
                            title="Send portal/email notification to client"
                          >
                            <Bell size={13} />
                            <span>Remind</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
