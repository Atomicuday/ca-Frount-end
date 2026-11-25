import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Users,
  Building,
  Phone,
  ExternalLink,
  CheckCircle2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { ROUTES } from '../../constants/routes.js';
import { caClientService } from '../../services/api/caClientService.js';
import AddClientModal from './modals/AddClientModal.jsx';
import TablePagination from '../../components/common/TablePagination.jsx';
import './CAClients.css';

export default function CAClientsScreen() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [draftTypeFilter, setDraftTypeFilter] = useState('ALL');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 280 });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modal and Toast states
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const addClientBtnRef = useRef(null);
  const filterBtnRef = useRef(null);
  const popoverRef = useRef(null);

  // Navigate to Documents page filtered by client ID
  const handleViewDocuments = useCallback((clientId) => {
    if (!clientId) return;
    navigate(`${ROUTES.CA_DOCUMENTS}?clientId=${encodeURIComponent(clientId)}`);
  }, [navigate]);

  // Live Toast Notification
  const showToast = useCallback((message, type = 'success') => {
    setToastMessage({ message, type });
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Load clients from service layer
  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await caClientService.getClients();
      setClients(data || []);
    } catch (err) {
      console.error('Failed to load CA clients:', err);
      showToast('Unable to load client records. Showing offline cache.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Handler for successful client and draft creation
  const handleClientAdded = useCallback((newClient, newDoc, message) => {
    loadClients();
    const alertMsg = message || `Client "${newClient.name}" created & linked draft initialized.`;
    showToast(alertMsg, 'success');
  }, [loadClients, showToast]);

  // Position calculation for Filters popover anchored below the Filters button
  const updatePopoverPosition = useCallback(() => {
    if (!filterBtnRef.current) return;
    const rect = filterBtnRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(290, window.innerWidth - 32);
    let left = rect.right - popoverWidth;
    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = window.innerWidth - popoverWidth - 16;
    }
    const top = rect.bottom + 8;
    setPopoverPos({ top, left, width: popoverWidth });
  }, []);

  // Dismiss popover on outside click, Escape, and keep aligned on resize/scroll
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        filterBtnRef.current &&
        !filterBtnRef.current.contains(e.target)
      ) {
        setFiltersOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setFiltersOpen(false);
        filterBtnRef.current?.focus();
      }
    }

    if (filtersOpen) {
      updatePopoverPosition();
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', updatePopoverPosition);
      window.addEventListener('scroll', updatePopoverPosition, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [filtersOpen, updatePopoverPosition]);

  // Filter application handlers
  const handleApplyFilters = () => {
    setTypeFilter(draftTypeFilter);
    setCurrentPage(1); // Reset pagination
    setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    setDraftTypeFilter('ALL');
    setTypeFilter('ALL');
    setCurrentPage(1); // Reset pagination, keep searchTerm intact
    setFiltersOpen(false);
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1); // Reset pagination on search
  };

  // Filter clients based on combined search query and applied type filter
  const filteredClients = clients.filter((client) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      client.name?.toLowerCase().includes(q) ||
      client.companyName?.toLowerCase().includes(q) ||
      client.pan?.toLowerCase().includes(q) ||
      client.gstin?.toLowerCase().includes(q) ||
      client.contactPerson?.toLowerCase().includes(q) ||
      client.phone?.includes(q);

    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'CORPORATE' && (client.entityType === 'Company' || client.entityType?.includes('Limited'))) ||
      (typeFilter === 'LLP' && client.entityType === 'LLP') ||
      (typeFilter === 'INDIVIDUAL' && client.entityType === 'Individual') ||
      (typeFilter === 'PARTNERSHIP' && client.entityType === 'Partnership');

    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1;
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const activeFilterCount = typeFilter !== 'ALL' ? 1 : 0;

  return (
    <div className="ca-clients-screen">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`zd-floating-toast zd-floating-toast--${toastMessage.type}`} role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Page Header with Single Add Client Button */}
      <div className="ca-page-header">
        <div className="ca-page-title-wrap">
          <h1 className="ca-page-title">Client Management Vault</h1>
          <p className="ca-page-subtitle">
            Manage your firm's corporate entities, LLPs, and individual tax clients
          </p>
        </div>
        <div className="ca-page-actions">
          <button
            type="button"
            className="zd-btn-action zd-btn-action--primary"
            id="btn-add-client"
            ref={addClientBtnRef}
            onClick={() => setIsAddClientOpen(true)}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="zd-card ca-filter-bar">
        {/* Search input on the left */}
        <div className="ca-search-input-wrap">
          <Search size={16} className="ca-search-icon" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by client name, PAN, GSTIN, or contact person…"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="ca-search-input"
            id="client-search-input"
            aria-label="Search clients"
          />
          {searchTerm && (
            <button
              type="button"
              className="ca-search-clear-btn"
              onClick={() => handleSearchChange('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters button on the right */}
        <div className="ca-filters-dropdown-wrap">
          <button
            ref={filterBtnRef}
            type="button"
            id="btn-clients-filter-toggle"
            className={`zd-btn-action zd-btn-action--secondary zd-btn-filter ${
              activeFilterCount > 0 ? 'active' : ''
            }`}
            onClick={() => {
              if (!filtersOpen) {
                setDraftTypeFilter(typeFilter);
                updatePopoverPosition();
              }
              setFiltersOpen(!filtersOpen);
            }}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            aria-label="Toggle client filters popover"
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="zd-filter-count-badge">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Popover via Portal: Appears above client list without clipping */}
      {filtersOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            className="zd-filter-popover-portal zd-glass-card"
            id="clients-filter-popover"
            role="dialog"
            aria-label="Filter Clients"
            aria-modal="false"
            style={{
              position: 'fixed',
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              width: `${popoverPos.width}px`,
              zIndex: 99999
            }}
          >
            <div className="zd-filter-popover-header">
              <strong>Filter Clients</strong>
              <button
                type="button"
                className="zd-link-btn"
                id="btn-clear-client-filter"
                onClick={handleClearFilters}
              >
                Clear
              </button>
            </div>

            <div className="zd-filter-group">
              <label htmlFor="filter-select-client-type" className="zd-filter-label">
                Client Type
              </label>
              <select
                id="filter-select-client-type"
                className="zd-form-select"
                value={draftTypeFilter}
                onChange={(e) => setDraftTypeFilter(e.target.value)}
              >
                <option value="ALL">All Clients</option>
                <option value="CORPORATE">Corporate</option>
                <option value="LLP">LLP</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="PARTNERSHIP">Partnership</option>
              </select>
            </div>

            <div className="zd-filter-popover-actions">
              <button
                type="button"
                id="btn-apply-client-filter"
                className="zd-btn-action zd-btn-action--primary"
                style={{ width: '100%', height: 38 }}
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Clients Table */}
      <div className="ca-table-wrap">
        <table className="ca-table">
          <thead>
            <tr>
              <th>Client / Entity Name</th>
              <th>Entity Type</th>
              <th>PAN / GSTIN</th>
              <th>Primary Contact</th>
              <th>Filing Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                  Loading client vault records…
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                  No clients found matching current filter criteria.
                </td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="client-entity-icon">
                        {client.entityType === 'Individual' ? <Users size={16} /> : <Building size={16} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                          {client.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          ID: {client.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{client.entityType}</span>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {client.pan || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {client.gstin || ''}
                    </div>
                  </td>
                  <td>
                    <div>{client.contactPerson || '—'}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Phone size={10} /> {client.phone || '—'}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        client.filingStatus?.includes('Due') || client.filingStatus?.includes('Pending')
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}
                    >
                      {client.filingStatus || 'Active'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline ca-btn-view-docs"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                      title={`View documents for ${client.name}`}
                      aria-label={`View documents for ${client.name}`}
                      onClick={() => handleViewDocuments(client.id)}
                    >
                      <span>View Documents</span>
                      <ExternalLink size={12} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Mobile View Client Cards (Active < 768px) */}
        {!isLoading && filteredClients.length > 0 && (
          <div className="ca-mobile-clients-list">
            {paginatedClients.map((client) => (
              <div key={client.id} className="ca-mobile-client-card">
                <div className="ca-mobile-client-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="client-entity-icon">
                      {client.entityType === 'Individual' ? <Users size={16} /> : <Building size={16} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--color-text-primary)' }}>
                        {client.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        ID: {client.id}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-info">{client.entityType}</span>
                </div>

                <div className="ca-mobile-client-meta-row">
                  <div>
                    <span className="ca-mobile-meta-label">PAN:</span>{' '}
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{client.pan || '—'}</span>
                  </div>
                  {client.gstin && (
                    <div>
                      <span className="ca-mobile-meta-label">GSTIN:</span>{' '}
                      <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{client.gstin}</span>
                    </div>
                  )}
                </div>

                <div className="ca-mobile-client-contact-row">
                  <div>
                    <span className="ca-mobile-meta-label">Contact:</span> {client.contactPerson || '—'}
                  </div>
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="ca-mobile-phone-link"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: 'var(--color-brand)',
                        textDecoration: 'none'
                      }}
                    >
                      <Phone size={11} /> {client.phone}
                    </a>
                  )}
                </div>

                <div className="ca-mobile-client-bottom">
                  <span
                    className={`badge ${
                      client.filingStatus?.includes('Due') || client.filingStatus?.includes('Pending')
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}
                  >
                    {client.filingStatus || 'Active'}
                  </span>

                  <button
                    type="button"
                    className="btn btn-outline ca-btn-view-docs"
                    style={{ fontSize: 12, padding: '6px 14px', minHeight: 38 }}
                    title={`View documents for ${client.name}`}
                    aria-label={`View documents for ${client.name}`}
                    onClick={() => handleViewDocuments(client.id)}
                  >
                    <span>View Documents</span>
                    <ExternalLink size={12} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination bar */}
        {!isLoading && (
          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredClients.length}
            totalPages={totalPages}
            itemName="clients"
            onPageChange={(p) => setCurrentPage(p)}
            loading={isLoading}
          />
        )}
      </div>

      {/* Add Client & Create Document Modal */}
      <AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onSuccess={handleClientAdded}
        triggerButtonRef={addClientBtnRef}
      />
    </div>
  );
}
