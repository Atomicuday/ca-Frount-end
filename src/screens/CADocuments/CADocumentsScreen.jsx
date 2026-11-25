import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Plus,
  FileText,
  Edit3,
  Pencil,
  Lock,
  MessageSquare,
  Send,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  CreditCard,
  FileCheck,
  Loader2,
  Eye,
  Download,
  Clock,
  Users,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { caDocumentsService } from '../../services/api/caDocumentsService';
import { caClientService } from '../../services/api/caClientService';
import { DOCUMENT_STATUSES, DOCUMENT_TYPES } from '../../mock/caDocumentsData';
import { LoadingState, ErrorState, TablePagination } from '../../components/shared';

import AddClientModal from './modals/AddClientModal';
import EditInputsModal from './modals/EditInputsModal';
import EditRequestsModal from './modals/EditRequestsModal';
import SendLinkModal from './modals/SendLinkModal';
import DocumentPreviewModal from './modals/DocumentPreviewModal';
import PaymentModal from './modals/PaymentModal';
import CompletionModal from './modals/CompletionModal';

import './CADocuments.css';

// Remove visible version labels (e.g. "v1", "v2", "(v2)", "(Draft Revision v2)") and format clean titles to match practice view
const cleanDocDisplayTitle = (title) => {
  if (!title) return '';
  return title
    .replace(/^FY\s+\d{4}-\d{2,4}\s+/i, '')
    .replace(/Professional\s+Income\s+Computation\s+&\s+Capital\s+Gains/i, 'Income Computation')
    .replace(/&\s+Form\s+MGT-14\s+Pack/i, '& MGT-14')
    .replace(/\s+Sheet$/i, '')
    .replace(/\s*\(Draft Revision.*?\)/gi, '')
    .replace(/\s*\(v\d+\)/gi, '')
    .replace(/\s+v\d+\b/gi, '')
    .trim();
};

export default function CADocumentsScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') || '';

  // Query & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [clientFilterName, setClientFilterName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Data & Async States
  const [documents, setDocuments] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI Popover & Modals
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef(null);
  const popoverRef = useRef(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 290 });

  const [activeModal, setActiveModal] = useState(null); // 'add_client' | 'edit_inputs' | 'edit_requests' | 'send_link' | 'preview'
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Resolve client name when filtered by clientId
  useEffect(() => {
    let isMounted = true;
    if (clientId) {
      caClientService
        .getClientById(clientId)
        .then((c) => {
          if (isMounted && c?.name) {
            setClientFilterName(c.name);
          }
        })
        .catch(() => {});
    } else {
      setClientFilterName('');
    }
    return () => {
      isMounted = false;
    };
  }, [clientId]);

  // Fallback to client name found in documents or clientId itself
  const displayClientName =
    clientFilterName ||
    documents.find((d) => String(d.clientId || '').toLowerCase() === String(clientId).toLowerCase())?.client ||
    clientId;

  // Live Toast Notification
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Calculate anchored position for filter popover relative to button and viewport
  const updatePopoverPosition = useCallback(() => {
    if (!filterButtonRef.current) return;
    const rect = filterButtonRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(300, window.innerWidth - 32);
    // Align right edge of popover with right edge of button
    let left = rect.right - popoverWidth;
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }
    const top = rect.bottom + 8;
    const maxHeight = Math.max(200, window.innerHeight - top - 16);
    setPopoverPos({ top, left, width: popoverWidth, maxHeight });
  }, []);

  // Close filter popover on outside click, Escape, and track resize/scroll
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(e.target)
      ) {
        setFiltersOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setFiltersOpen(false);
        filterButtonRef.current?.focus();
      }
    }

    if (filtersOpen) {
      updatePopoverPosition();
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', updatePopoverPosition);
      window.addEventListener('scroll', updatePopoverPosition, true);
      // Keyboard focus: Focus first interactive control when popover opens
      setTimeout(() => {
        const firstFocusable = popoverRef.current?.querySelector('select, button, input');
        firstFocusable?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [filtersOpen, updatePopoverPosition]);

  // Load documents from service
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await caDocumentsService.getDocuments({
        search: searchQuery,
        status: statusFilter,
        docType: typeFilter,
        dateRange: dateRangeFilter,
        clientId: clientId || null,
        page: currentPage,
        limit: pageSize
      });

      setDocuments(response.data || []);
      setTotalRecords(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      console.error('Failed to load CA documents:', err);
      setError('Unable to load document vault records. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, typeFilter, dateRangeFilter, clientId, currentPage, pageSize]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Reset pagination on search or filter change
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleApplyFilters = (newStatus, newType, newDate) => {
    setStatusFilter(newStatus);
    setTypeFilter(newType);
    setDateRangeFilter(newDate);
    setCurrentPage(1);
    setFiltersOpen(false);
  };

  // Dedicated action to clear the client filter while preserving any text search
  const handleClearClientFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('clientId');
    setSearchParams(nextParams);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setDateRangeFilter('ALL');
    setSearchQuery('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('clientId');
    setSearchParams(nextParams);
    setCurrentPage(1);
    setFiltersOpen(false);
  };

  const activeFilterCount =
    (statusFilter !== 'ALL' ? 1 : 0) +
    (typeFilter !== 'ALL' ? 1 : 0) +
    (dateRangeFilter !== 'ALL' ? 1 : 0) +
    (clientId ? 1 : 0);

  // Modal Handlers
  const handleClientCreated = async (payload) => {
    const res = await caDocumentsService.createClientAndDocument(payload);
    showToast(res.message, 'success');
    loadDocuments();
  };

  const handleSaveInputs = async (docId, formValues) => {
    const res = await caDocumentsService.updateDocumentInputs(docId, formValues);
    showToast(res.message, 'success');
    loadDocuments();
  };

  const handleForkRevision = async (docId) => {
    const res = await caDocumentsService.createDocumentRevision(docId);
    showToast(res.message, 'success');
    loadDocuments();
  };

  const handleResolveRequest = async (docId, reqId) => {
    const res = await caDocumentsService.resolveCorrectionRequest(docId, reqId, 'ACCEPT');
    showToast('Correction remark accepted and revised.', 'success');
    loadDocuments();
    setSelectedDoc(res.document || null);
    setActiveModal('payment');
  };

  const handleEditRequestDecisionCompleted = (docId, decision, result) => {
    loadDocuments();
    showToast(result.message || 'Correction request processed.', 'info');
    setSelectedDoc(result.document || { id: docId });
    setActiveModal('payment');
  };

  const handlePaymentSuccess = (updatedDoc, settlement) => {
    loadDocuments();
    showToast(settlement.message || 'Payment successfully verified.', 'success');
  };

  const [dispatchingDocId, setDispatchingDocId] = useState(null);

  const handleDispatchLink = async (docId, options) => {
    setDispatchingDocId(docId);
    try {
      const res = await caDocumentsService.dispatchLink(docId, options);
      showToast(res.message, 'success');
      loadDocuments();
      return res;
    } finally {
      setDispatchingDocId(null);
    }
  };

  const [downloadingDocId, setDownloadingDocId] = useState(null);

  const handleDownloadExecuted = async (doc) => {
    if (!doc || doc.statusCode !== 'completed') return;
    setDownloadingDocId(doc.id);
    try {
      const res = await caDocumentsService.downloadExecutedDocument(doc.id);
      showToast(`Certified PDF downloaded: ${res.fileName}`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast(err.message || 'Failed to download executed document.', 'error');
    } finally {
      setDownloadingDocId(null);
    }
  };

  // Status Configuration for Distinct Icons & Color Tokens
  const STATUS_CONFIG = {
    draft: {
      Icon: FileText,
      label: 'Draft',
      className: 'zd-status-icon-badge--slate',
      color: '#475569'
    },
    awaiting_info: {
      Icon: Clock,
      label: 'Awaiting Info',
      className: 'zd-status-icon-badge--amber',
      color: '#d97706'
    },
    corrections: {
      Icon: AlertTriangle,
      label: 'Changes Requested',
      className: 'zd-status-icon-badge--orange',
      color: '#ea580c'
    },
    revised_review: {
      Icon: RotateCcw,
      label: 'Revised Draft',
      className: 'zd-status-icon-badge--purple',
      color: '#7c3aed'
    },
    party_review: {
      Icon: Users,
      label: 'Party Review',
      className: 'zd-status-icon-badge--purple',
      color: '#7c3aed'
    },
    ca_review: {
      Icon: ShieldCheck,
      label: 'CA Review',
      className: 'zd-status-icon-badge--indigo',
      color: '#4f46e5'
    },
    approved_locked: {
      Icon: Lock,
      label: 'Approved & Locked',
      className: 'zd-status-icon-badge--blue',
      color: '#2563eb'
    },
    awaiting_payment: {
      Icon: CreditCard,
      label: 'Awaiting Payment',
      className: 'zd-status-icon-badge--pink',
      color: '#db2777'
    },
    executing: {
      Icon: Cpu,
      label: 'Executing',
      className: 'zd-status-icon-badge--cyan',
      color: '#0891b2'
    },
    completed: {
      Icon: CheckCircle2,
      label: 'Completed',
      className: 'zd-status-icon-badge--green',
      color: '#16a34a'
    }
  };

  const renderStatusIconBadge = (doc) => {
    const config = STATUS_CONFIG[doc.statusCode] || {
      Icon: FileText,
      label: doc.status || 'Draft',
      className: 'zd-status-icon-badge--blue',
      color: '#2563eb'
    };
    const { Icon, label, className, color } = config;

    const payStatus = doc.statusDetails?.paymentStatus || (doc.payment?.status === 'PAID' ? 'Paid' : 'Unbilled');
    const stampStatus = doc.statusDetails?.stampStatus || (doc.statusCode === 'completed' || doc.statusCode === 'executing' ? 'eStamped' : 'Not Required');
    const tooltipText = `Status: ${doc.status || label} • Payment: ${payStatus} • Stamp: ${stampStatus}`;

    return (
      <div className="zd-tooltip-wrap">
        <div
          tabIndex={0}
          role="img"
          className={`zd-status-icon-badge ${className}`}
          aria-label={`Document status: ${doc.status || label}. Payment: ${payStatus}. Stamp: ${stampStatus}.`}
          title={tooltipText}
        >
          <Icon size={18} color={color} aria-hidden="true" />
        </div>
        <span className="zd-tooltip-box zd-tooltip-box--wide" role="tooltip">
          <strong>{doc.status || label}</strong>
          <span className="zd-tooltip-sub">Pay: {payStatus} • Stamp: {stampStatus}</span>
        </span>
      </div>
    );
  };

  // Status text display (Text Only — no icon, colored badge, background box or circular container)
  const renderStatusText = (doc, isMobile = false) => {
    const payStatus = doc.statusDetails?.paymentStatus || (doc.payment?.status === 'PAID' ? 'Paid' : 'Unbilled');
    const stampStatus = doc.statusDetails?.stampStatus || (doc.statusCode === 'completed' || doc.statusCode === 'executing' ? 'eStamped' : 'Not Required');
    const tooltipText = `Status: ${doc.status} • Pay: ${payStatus} • Stamp: ${stampStatus}`;

    return (
      <span
        className={`zd-doc-status-text${isMobile ? ' zd-doc-status-text--mobile' : ''}`}
        title={tooltipText}
        aria-label={`Document status: ${doc.status}. Payment: ${payStatus}. Stamp: ${stampStatus}.`}
      >
        {doc.status}
      </span>
    );
  };

  // Status Badge Colors & Classifications (preserved for backward compatibility & mobile)
  const renderStatusBadge = (doc) => {
    let badgeClass = 'zd-doc-badge--blue';
    if (doc.statusCode === 'draft') badgeClass = 'zd-doc-badge--slate';
    if (doc.statusCode === 'awaiting_info') badgeClass = 'zd-doc-badge--amber';
    if (doc.statusCode === 'corrections') badgeClass = 'zd-doc-badge--orange';
    if (doc.statusCode === 'revised_review') badgeClass = 'zd-doc-badge--purple';
    if (doc.statusCode === 'party_review' || doc.statusCode === 'ca_review') badgeClass = 'zd-doc-badge--purple';
    if (doc.statusCode === 'approved_locked') badgeClass = 'zd-doc-badge--blue';
    if (doc.statusCode === 'awaiting_payment') badgeClass = 'zd-doc-badge--pink';
    if (doc.statusCode === 'executing') badgeClass = 'zd-doc-badge--cyan';
    if (doc.statusCode === 'completed') badgeClass = 'zd-doc-badge--green';

    return (
      <div className="zd-doc-status-stack">
        <span className={`zd-doc-status-badge ${badgeClass}`}>
          {doc.statusCode === 'completed' && <CheckCircle2 size={12} />}
          {doc.statusCode === 'corrections' && <AlertCircle size={12} />}
          <span>{doc.status}</span>
        </span>

        {/* Secondary Details: Payment, Stamp, Signer */}
        <div className="zd-doc-status-subtext">
          <span>Pay: {doc.statusDetails?.paymentStatus || 'Unbilled'}</span>
          <span className="zd-sep">•</span>
          <span>Stamp: {doc.statusDetails?.stampStatus || 'Pending'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="ca-documents-container">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className={`zd-floating-toast zd-floating-toast--${toastMessage.type}`}>
          <CheckCircle2 size={16} />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* 1. HEADER (Sketch Section 1) */}
      <header className="zd-docs-page-header">
        <div className="zd-docs-header-title-box">
          <h1 className="zd-docs-page-title">Documents</h1>
          <p className="zd-docs-page-sub">
            Manage drafts, reviews and completed documents
          </p>
        </div>

        {/* Right-Aligned "Add Client" Button (Sketch Top Right) */}
        <div className="zd-docs-header-action-row">
          <button
            type="button"
            id="btn-add-client-document"
            className="zd-btn-action zd-btn-action--primary zd-btn-add-client"
            onClick={() => setActiveModal('add_client')}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Add Client</span>
          </button>
        </div>
      </header>

      {/* 2. SEARCH AND FILTER TOOLBAR (Sketch Section 2) */}
      <div className="zd-docs-toolbar zd-glass-card">
        {/* Wide Search Field on Left */}
        <div className="zd-docs-search-wrap">
          <Search size={16} className="zd-docs-search-icon" aria-hidden="true" />
          <input
            type="text"
            id="input-docs-search"
            className="zd-docs-search-input"
            placeholder="Search by document title, reference ID, or client name..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search documents by title, reference ID, or client"
          />
          {searchQuery && (
            <button
              type="button"
              className="zd-docs-search-clear"
              onClick={() => handleSearchChange('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters Button on Right with Popover Portal */}
        <div className="zd-docs-filters-dropdown-wrap">
          <button
            ref={filterButtonRef}
            type="button"
            id="btn-docs-filter-toggle"
            className={`zd-btn-action zd-btn-action--secondary zd-btn-filter ${
              activeFilterCount > 0 ? 'active' : ''
            }`}
            onClick={() => {
              if (!filtersOpen) updatePopoverPosition();
              setFiltersOpen(!filtersOpen);
            }}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            aria-label="Toggle document filters popover"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="zd-filter-count-badge">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Popover rendered via Portal to guarantee rendering above the table and outside parent stacking contexts */}
      {filtersOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          className="zd-docs-filter-popover zd-docs-filter-popover--portal"
          id="docs-filter-popover"
          role="dialog"
          aria-label="Filter Documents"
          aria-modal="false"
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: `${popoverPos.width}px`,
            maxHeight: popoverPos.maxHeight ? `${popoverPos.maxHeight}px` : undefined,
            zIndex: 99999
          }}
        >
          <div className="zd-filter-popover-header">
            <strong>Filter Documents</strong>
            <button
              type="button"
              className="zd-link-btn"
              onClick={handleClearFilters}
              style={{ fontSize: 12 }}
            >
              Clear All
            </button>
          </div>

          {/* Status Filter */}
          <div className="zd-filter-group">
            <label htmlFor="filter-select-status" className="zd-filter-label">
              Document Status
            </label>
            <select
              id="filter-select-status"
              className="zd-form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {DOCUMENT_STATUSES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="zd-filter-group">
            <label htmlFor="filter-select-type" className="zd-filter-label">
              Document Type
            </label>
            <select
              id="filter-select-type"
              className="zd-form-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Created Date Range */}
          <div className="zd-filter-group">
            <label htmlFor="filter-select-date" className="zd-filter-label">
              Created Date Range
            </label>
            <select
              id="filter-select-date"
              className="zd-form-select"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
            >
              <option value="ALL">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days (Quarter)</option>
            </select>
          </div>

          <div className="zd-filter-popover-actions">
            <button
              type="button"
              className="zd-btn-action zd-btn-action--primary"
              style={{ width: '100%', height: 38 }}
              onClick={() => handleApplyFilters(statusFilter, typeFilter, dateRangeFilter)}
            >
              Apply Filters
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Active Client Filter Banner */}
      {clientId && (
        <div className="zd-client-filter-banner" role="status" aria-live="polite">
          <div className="zd-client-filter-content">
            <span className="zd-client-filter-label">Filtered by Client:</span>
            <strong className="zd-client-filter-name">{displayClientName}</strong>
            <span className="zd-client-filter-id">ID: {clientId}</span>
          </div>
          <button
            type="button"
            className="zd-clear-client-filter-btn"
            id="btn-clear-client-filter"
            onClick={handleClearClientFilter}
            aria-label="Clear client filter"
          >
            <X size={14} aria-hidden="true" />
            <span>Clear client filter</span>
          </button>
        </div>
      )}

      {/* Result Count and Quick Filter Summary */}
      <div className="zd-docs-summary-row">
        <span className="zd-docs-counter">
          Showing <strong>{documents.length}</strong> of <strong>{totalRecords}</strong> documents
        </span>

        {activeFilterCount > 0 && (
          <div className="zd-active-filter-chips">
            {clientId && (
              <span className="zd-filter-chip zd-filter-chip--client">
                Client: {displayClientName}
                <button
                  type="button"
                  onClick={handleClearClientFilter}
                  aria-label="Clear client filter"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="zd-filter-chip">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('ALL')} aria-label="Remove status filter">
                  ×
                </button>
              </span>
            )}
            {typeFilter !== 'ALL' && (
              <span className="zd-filter-chip">
                Type: {typeFilter}
                <button type="button" onClick={() => setTypeFilter('ALL')} aria-label="Remove type filter">
                  ×
                </button>
              </span>
            )}
            {dateRangeFilter !== 'ALL' && (
              <span className="zd-filter-chip">
                Period: {dateRangeFilter}
                <button type="button" onClick={() => setDateRangeFilter('ALL')} aria-label="Remove date filter">
                  ×
                </button>
              </span>
            )}
            <button type="button" className="zd-link-btn" onClick={handleClearFilters}>
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* 3. DOCUMENTS TABLE (Sketch Section 3) */}
      <div className="zd-docs-table-card zd-glass-card">
        {loading ? (
          <div style={{ padding: '60px 20px' }}>
            <LoadingState message="Loading practice document vault records…" />
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px' }}>
            <ErrorState message={error} onRetry={loadDocuments} />
          </div>
        ) : documents.length === 0 ? (
          <div className="zd-docs-empty-state">
            <FileText size={40} color="#94a3b8" />
            <h3 className="zd-empty-title">
              {clientId
                ? 'No documents found for this client'
                : searchQuery || activeFilterCount > 0
                ? 'No matching documents found'
                : 'No documents in practice vault'}
            </h3>
            <p className="zd-empty-sub">
              {clientId
                ? `No statutory or filing documents currently exist for ${displayClientName}.`
                : searchQuery || activeFilterCount > 0
                ? 'Try adjusting your search query or clearing status and type filters.'
                : 'Click "Add Client" above to initialize your first document draft.'}
            </p>
            {clientId ? (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--secondary"
                  id="btn-empty-clear-client-filter"
                  onClick={handleClearClientFilter}
                >
                  <X size={14} />
                  <span>Clear client filter</span>
                </button>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--primary"
                  onClick={() => setActiveModal('add_client')}
                >
                  <Plus size={14} aria-hidden="true" />
                  <span>Add Client & Create Document</span>
                </button>
              </div>
            ) : searchQuery || activeFilterCount > 0 ? (
              <button
                type="button"
                className="zd-btn-action zd-btn-action--secondary"
                onClick={handleClearFilters}
              >
                <RotateCcw size={14} />
                <span>Reset Filters</span>
              </button>
            ) : (
              <button
                type="button"
                className="zd-btn-action zd-btn-action--primary"
                onClick={() => setActiveModal('add_client')}
              >
                <Plus size={14} aria-hidden="true" />
                <span>Add Client & Create Document</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="zd-docs-table-scroll-wrap">
              <table className="zd-docs-table" aria-label="CA Documents Practice Vault">
                <colgroup>
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '9%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" aria-label="Document Details">DOCUMENT DETAILS</th>
                    <th scope="col" aria-label="Client">CLIENT</th>
                    <th scope="col" className="zd-th-center" aria-label="Edit Inputs">EDIT</th>
                    <th scope="col" className="zd-th-center" aria-label="Edit Request">REQUESTS</th>
                    <th scope="col" className="zd-th-center" aria-label="Payment">PAYMENT</th>
                    <th scope="col" className="zd-th-center" aria-label="Send Link">SEND LINK</th>
                    <th scope="col" aria-label="Document Status">STATUS</th>
                    <th scope="col" className="zd-th-center">QUICK ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const unresolvedRequests = (doc.correctionRequests || []).filter(
                      (r) => r.status === 'Pending' || r.status === 'pending'
                    );
                    const hasRequests = unresolvedRequests.length > 0;
                    const isLocked = doc.statusCode === 'executing' || doc.statusCode === 'completed' || (!doc.isEditableDraft && doc.statusCode === 'approved_locked');
                    const isEditable = !isLocked;
                    const isPaid = doc.payment?.status === 'PAID';
                    const isApproved = Boolean(doc.clientApproval?.isApproved);
                    const isCompleted = doc.statusCode === 'completed';

                    return (
                      <tr key={doc.id} className="zd-doc-table-row">
                        {/* Column 1: Document Details */}
                        <td>
                          <div className="zd-doc-details-cell">
                            <button
                              type="button"
                              className="zd-doc-title-link"
                              onClick={() => {
                                setSelectedDoc(doc);
                                if (isCompleted) {
                                  setActiveModal('completion');
                                } else {
                                  setActiveModal('preview');
                                }
                              }}
                              title="Click to preview document and filing history"
                            >
                              <FileText size={16} className="zd-doc-file-icon" color="#2563eb" aria-hidden="true" />
                              <span>{cleanDocDisplayTitle(doc.title)}</span>
                            </button>
                            <div className="zd-doc-ref-line">
                              <span className="zd-doc-ref-text">Ref: {doc.ref}</span>
                            </div>
                            <div className="zd-doc-secondary-meta">
                              {doc.docType} • Created {doc.createdAt}
                            </div>
                          </div>
                        </td>

                      {/* Column 2: Client */}
                      <td>
                        <div className="zd-doc-client-cell">
                          <strong className="zd-doc-client-name">{doc.client}</strong>
                          <span className="zd-doc-client-type">{doc.clientType}</span>
                        </div>
                      </td>

                      {/* Column 3: Edit */}
                      <td className="zd-td-center">
                        <div className="zd-doc-actions-cell zd-doc-actions-cell--center">
                          {isEditable ? (
                            <button
                              type="button"
                              className="zd-btn-table-action zd-btn-table-action--edit"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setActiveModal('edit_inputs');
                              }}
                              aria-label={`Edit inputs for ${cleanDocDisplayTitle(doc.title)}`}
                              title="Edit draft form inputs"
                            >
                              <Pencil size={12} aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="zd-btn-table-action zd-btn-table-action--locked"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setActiveModal('edit_inputs');
                              }}
                              aria-label={`Revise locked document ${cleanDocDisplayTitle(doc.title)}`}
                              title="Document locked for review/signing; click to create a new draft revision"
                            >
                              <Lock size={12} aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column 4: Requests */}
                      <td className="zd-td-center">
                        <div className="zd-doc-actions-cell zd-doc-actions-cell--center">
                          {hasRequests ? (
                            <button
                              type="button"
                              className="zd-btn-table-action zd-btn-table-action--requests"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setActiveModal('edit_requests');
                              }}
                              aria-label={`View ${unresolvedRequests.length} edit request${unresolvedRequests.length > 1 ? 's' : ''} for ${cleanDocDisplayTitle(doc.title)}`}
                              title={`View ${unresolvedRequests.length} client requested change${unresolvedRequests.length > 1 ? 's' : ''}`}
                            >
                              <span>Requests ({unresolvedRequests.length})</span>
                            </button>
                          ) : (
                            <span className="zd-table-dash" aria-hidden="true">—</span>
                          )}
                        </div>
                      </td>

                      {/* Column 5: Payment */}
                      <td className="zd-td-center">
                        <div className="zd-doc-actions-cell zd-doc-actions-cell--center">
                          {isPaid ? (
                            <span
                              className="zd-doc-status-badge zd-doc-badge--green"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setSelectedDoc(doc);
                                setActiveModal('payment');
                              }}
                              title={
                                isApproved
                                  ? 'Payment settled and verified. Click to view invoice.'
                                  : 'Payment successful — awaiting final document approval.'
                              }
                              aria-label={
                                isApproved
                                  ? `Payment settled for ${cleanDocDisplayTitle(doc.title)}. Click to view invoice.`
                                  : `Payment received for ${cleanDocDisplayTitle(doc.title)}. Awaiting final document approval.`
                              }
                            >
                              <span>Paid</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="zd-btn-table-action zd-btn-table-action--pay"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setActiveModal('payment');
                              }}
                              aria-label={`Pay statutory execution fee for ${cleanDocDisplayTitle(doc.title)}`}
                              title="Click to pay statutory execution fee"
                            >
                              <span>Pay Fee</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column 6: Send Link */}
                      <td className="zd-td-center">
                        <div className="zd-doc-actions-cell zd-doc-actions-cell--center">
                          {dispatchingDocId === doc.id ? (
                            <div className="zd-tooltip-wrap">
                              <button
                                type="button"
                                disabled
                                className="zd-btn-table-icon zd-btn-table-icon--disabled"
                                aria-label="Dispatching signing invitation…"
                              >
                                <Loader2 size={16} className="spinning" aria-hidden="true" />
                              </button>
                              <span className="zd-tooltip-box" role="tooltip">
                                Dispatching invitation…
                              </span>
                            </div>
                          ) : isCompleted ? (
                            <span className="zd-table-dash" aria-hidden="true">—</span>
                          ) : !isPaid ? (
                            <div className="zd-tooltip-wrap">
                              <button
                                type="button"
                                disabled
                                className="zd-btn-table-icon zd-btn-table-icon--disabled"
                                aria-label="Send signing link disabled (Payment required)"
                                title="Payment required before signing link can be generated"
                              >
                                <Send size={16} aria-hidden="true" />
                              </button>
                              <span className="zd-tooltip-box" role="tooltip">
                                Payment required before sending link
                              </span>
                            </div>
                          ) : !isApproved ? (
                            <div className="zd-tooltip-wrap">
                              <button
                                type="button"
                                disabled
                                className="zd-btn-table-icon zd-btn-table-icon--disabled"
                                aria-label="Send signing link disabled (Awaiting document approval)"
                                title="Payment successful — awaiting final document approval before signing link can be dispatched"
                              >
                                <Send size={16} aria-hidden="true" />
                              </button>
                              <span className="zd-tooltip-box" role="tooltip">
                                Awaiting approval before sending link
                              </span>
                            </div>
                          ) : !doc.execution?.packetReady ? (
                            <div className="zd-tooltip-wrap">
                              <button
                                type="button"
                                disabled
                                className="zd-btn-table-icon zd-btn-table-icon--disabled"
                                aria-label="Send signing link unavailable: Preparing execution packet and state stamping"
                                title="Preparing execution packet and state stamping"
                              >
                                <Send size={16} aria-hidden="true" />
                              </button>
                              <span className="zd-tooltip-box" role="tooltip">
                                Preparing execution packet…
                              </span>
                            </div>
                          ) : (
                            <div className="zd-tooltip-wrap">
                              <button
                                type="button"
                                className="zd-btn-table-icon zd-btn-table-icon--send"
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setActiveModal('send_link');
                                }}
                                aria-label={`Dispatch execution and signing link for ${cleanDocDisplayTitle(doc.title)}`}
                                title="Dispatch execution and signing link to signatories"
                              >
                                <Send size={16} aria-hidden="true" />
                                <span className="sr-only">Send Signing Link</span>
                              </button>
                              <span className="zd-tooltip-box" role="tooltip">
                                Send Signing Link
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 7: Status */}
                      <td>
                        {renderStatusText(doc)}
                      </td>

                      {/* Column 8: Quick Actions */}
                      <td className="zd-td-center">
                        <div className="zd-doc-actions-cell zd-doc-actions-cell--center zd-quick-actions-cell">
                          <div className="zd-tooltip-wrap">
                            <button
                              type="button"
                              className="zd-btn-table-icon zd-btn-table-icon--view"
                              onClick={() => {
                                setSelectedDoc(doc);
                                if (isCompleted) {
                                  setActiveModal('completion');
                                } else {
                                  setActiveModal('preview');
                                }
                              }}
                              aria-label={`View document preview for ${cleanDocDisplayTitle(doc.title)}`}
                              title="View Document"
                            >
                              <Eye size={16} aria-hidden="true" />
                              <span className="sr-only"><span>View Document</span></span>
                            </button>
                            <span className="zd-tooltip-box" role="tooltip">
                              View Document
                            </span>
                          </div>

                          {isCompleted && doc.finalFileAvailable !== false ? (
                            <div className="zd-tooltip-wrap">
                              <button
                                type="button"
                                className="zd-btn-table-icon zd-btn-table-icon--download"
                                onClick={() => handleDownloadExecuted(doc)}
                                disabled={downloadingDocId === doc.id}
                                aria-label={`Download executed PDF for ${cleanDocDisplayTitle(doc.title)}`}
                                title={
                                  downloadingDocId === doc.id
                                    ? 'Downloading executed document…'
                                    : 'Download Document'
                                }
                              >
                                {downloadingDocId === doc.id ? (
                                  <Loader2 size={16} className="spinning" aria-hidden="true" />
                                ) : (
                                  <Download size={16} aria-hidden="true" />
                                )}
                                <span className="sr-only"><span>Download Document</span></span>
                              </button>
                              <span className="zd-tooltip-box" role="tooltip">
                                {downloadingDocId === doc.id ? 'Downloading…' : 'Download Document'}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="zd-quick-actions-blur-slot"
                              aria-hidden="true"
                              title={doc.finalFileAvailable === false ? 'Final document processing' : 'Download unavailable'}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Document Record Cards (Active < 768px) */}
          <div className="ca-mobile-docs-list">
            {documents.map((doc) => {
              const unresolvedRequests = (doc.correctionRequests || []).filter(
                (r) => r.status === 'Pending' || r.status === 'pending'
              );
              const hasRequests = unresolvedRequests.length > 0;
              const isLocked = doc.statusCode === 'executing' || doc.statusCode === 'completed' || (!doc.isEditableDraft && doc.statusCode === 'approved_locked');
              const isEditable = !isLocked;
              const isPaid = doc.payment?.status === 'PAID';
              const isApproved = Boolean(doc.clientApproval?.isApproved);
              const isCompleted = doc.statusCode === 'completed';
              const isExecutingOrReady = (doc.statusCode === 'executing' || doc.execution?.packetReady) && isPaid && isApproved;
              const sendDisabledReason = !isPaid
                ? 'Payment is required before sending the signing link'
                : !isApproved
                ? 'Draft approval is required before sending the signing link'
                : 'Execution packet is still preparing';

              return (
                <div key={doc.id} className="ca-mobile-doc-card">
                  <div className="ca-mobile-doc-top">
                    <div className="ca-mobile-ref-group">
                      <span className="ca-mobile-label">Reference</span>
                      <span className="ca-mobile-ref">Ref: {doc.ref}</span>
                    </div>
                    <div className="ca-mobile-status-group">
                      <span className="ca-mobile-label">Status</span>
                      {renderStatusText(doc, true)}
                    </div>
                  </div>

                  <div className="ca-mobile-field-group">
                    <span className="ca-mobile-label">Document Details</span>
                    <button
                      type="button"
                      className="zd-doc-title-link"
                      style={{ fontSize: 14.5, fontWeight: 700 }}
                      onClick={() => {
                        setSelectedDoc(doc);
                        if (isCompleted) {
                          setActiveModal('completion');
                        } else {
                          setActiveModal('preview');
                        }
                      }}
                      title="Click to preview document and filing history"
                    >
                      <FileText size={16} className="zd-doc-title-icon" aria-hidden="true" />
                      <span>{cleanDocDisplayTitle(doc.title)}</span>
                    </button>
                    <div className="ca-mobile-subtags">
                      {doc.docType} • Created {doc.createdAt}
                    </div>
                  </div>

                  <div className="ca-mobile-field-group">
                    <span className="ca-mobile-label">Client</span>
                    <div className="ca-mobile-client-val">
                      <strong>{doc.client}</strong> <span style={{ color: '#64748b' }}>({doc.clientType})</span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="ca-mobile-actions-section">
                    <span className="ca-mobile-label">Actions</span>
                    <div className="ca-mobile-actions-grid">
                      {isEditable ? (
                        <button
                          type="button"
                          className="zd-btn-table-action zd-btn-table-action--edit"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setActiveModal('edit_inputs');
                          }}
                        >
                          <Edit3 size={13} aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="zd-btn-table-action zd-btn-table-action--locked"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setActiveModal('edit_inputs');
                          }}
                        >
                          <Lock size={12} aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                      )}

                      {hasRequests && (
                        <button
                          type="button"
                          className="zd-btn-table-action zd-btn-table-action--requests"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setActiveModal('edit_requests');
                          }}
                        >
                          <MessageSquare size={13} aria-hidden="true" />
                          <span>Requests ({unresolvedRequests.length})</span>
                        </button>
                      )}

                      {isPaid ? (
                        <button
                          type="button"
                          className="zd-btn-table-action zd-btn-table-action--paid"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setActiveModal('payment');
                          }}
                        >
                          <CheckCircle2 size={12} color="#16a34a" aria-hidden="true" />
                          <span>{isApproved ? 'Paid' : 'Paid (Awaiting Appr.)'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="zd-btn-table-action zd-btn-table-action--pay"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setActiveModal('payment');
                          }}
                        >
                          <CreditCard size={12} aria-hidden="true" />
                          <span>Pay Fee</span>
                        </button>
                      )}

                      {isCompleted ? (
                        <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
                          <button
                            type="button"
                            className="zd-btn-table-action zd-btn-table-action--view"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => {
                              setSelectedDoc(doc);
                              setActiveModal('preview');
                            }}
                          >
                            <Eye size={12} aria-hidden="true" />
                            <span>View Document</span>
                          </button>
                          <button
                            type="button"
                            className="zd-btn-table-action zd-btn-table-action--download"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={() => handleDownloadExecuted(doc)}
                            disabled={downloadingDocId === doc.id || doc.finalFileAvailable === false}
                          >
                            <Download size={12} aria-hidden="true" />
                            <span>{downloadingDocId === doc.id ? 'Downloading…' : 'Download Document'}</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={`zd-btn-table-action zd-btn-table-action--send ${
                            isExecutingOrReady ? '' : 'zd-btn-table-icon--disabled'
                          }`}
                          onClick={() => {
                            if (isExecutingOrReady) {
                              setSelectedDoc(doc);
                              setActiveModal('send_link');
                            }
                          }}
                          disabled={!isExecutingOrReady || dispatchingDocId === doc.id}
                          title={
                            isExecutingOrReady
                              ? 'Send signing link to client'
                              : `Send link disabled: ${sendDisabledReason}`
                          }
                        >
                          {dispatchingDocId === doc.id ? (
                            <RefreshCw size={13} className="zd-spin" aria-hidden="true" />
                          ) : (
                            <Send size={13} aria-hidden="true" />
                          )}
                          <span>Send Signing Link</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

        {/* Pagination Footer */}
        {!loading && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalRecords}
            totalPages={totalPages}
            itemName="documents"
            onPageChange={(p) => setCurrentPage(p)}
            loading={loading}
          />
        )}
      </div>

      {/* 4. MODALS WORKFLOW */}
      <AddClientModal
        isOpen={activeModal === 'add_client'}
        onClose={() => setActiveModal(null)}
        onClientCreated={handleClientCreated}
      />

      <EditInputsModal
        isOpen={activeModal === 'edit_inputs'}
        onClose={() => {
          setActiveModal(null);
          setSelectedDoc(null);
        }}
        document={selectedDoc}
        onSaveInputs={handleSaveInputs}
        onForkRevision={handleForkRevision}
      />

      <EditRequestsModal
        isOpen={activeModal === 'edit_requests'}
        onClose={() => {
          setActiveModal(null);
          setSelectedDoc(null);
        }}
        document={selectedDoc}
        onDecisionCompleted={handleEditRequestDecisionCompleted}
      />

      <PaymentModal
        isOpen={activeModal === 'payment'}
        onClose={() => {
          setActiveModal(null);
          setSelectedDoc(null);
        }}
        documentId={selectedDoc?.id}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <SendLinkModal
        isOpen={activeModal === 'send_link'}
        onClose={() => {
          setActiveModal(null);
          setSelectedDoc(null);
        }}
        document={selectedDoc}
        onDispatchLink={handleDispatchLink}
      />

      <DocumentPreviewModal
        isOpen={activeModal === 'preview'}
        onClose={() => {
          setActiveModal(null);
          setSelectedDoc(null);
        }}
        document={selectedDoc}
      />

      <CompletionModal
        isOpen={activeModal === 'completion'}
        onClose={() => {
          setActiveModal(null);
          setSelectedDoc(null);
        }}
        documentId={selectedDoc?.id}
        onOpenPreview={(docId) => {
          setSelectedDoc(documents.find((d) => d.id === docId) || selectedDoc);
          setActiveModal('preview');
        }}
      />
    </div>
  );
}
