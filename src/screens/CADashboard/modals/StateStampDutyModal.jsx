import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Landmark,
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  CheckCircle2,
  Info
} from 'lucide-react';
import { caStampDutyService } from '../../../services/api/caStampDutyService.js';
import './StateStampDutyModal.css';

export default function StateStampDutyModal({
  isOpen,
  onClose,
  triggerElementId,
  documentType = null
}) {
  const modalRef = useRef(null);
  const dropdownRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedDocTypeId, setSelectedDocTypeId] = useState(
    typeof documentType === 'string' ? documentType : documentType?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ items: [], documentType: null, prompt: null });
  const [expandedStateCode, setExpandedStateCode] = useState(null);

  // Load document types on mount/open
  useEffect(() => {
    let active = true;
    async function init() {
      if (!isOpen) return;
      try {
        const types = await caStampDutyService.getDocumentTypes();
        if (active) {
          setDocumentTypes(types);
        }
      } catch (err) {
        console.error('Failed to load document types:', err);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Sync selectedDocTypeId if prop changes
  useEffect(() => {
    if (documentType) {
      const id = typeof documentType === 'string' ? documentType : documentType.id;
      setSelectedDocTypeId(id);
    }
  }, [documentType]);

  // Fetch summary data whenever selectedDocTypeId changes
  useEffect(() => {
    let active = true;
    async function loadSummary() {
      if (!isOpen) return;
      setLoading(true);
      try {
        const result = await caStampDutyService.getAllStatesDutySummary(selectedDocTypeId || null);
        if (active) {
          setData(result);
          setExpandedStateCode(null);
        }
      } catch (err) {
        console.error('Failed to load state stamp duty data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      active = false;
    };
  }, [isOpen, selectedDocTypeId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Focus management & keyboard navigation (Escape to close, focus trap)
  useEffect(() => {
    if (!isOpen) return;

    lastActiveElementRef.current = document.activeElement;
    document.body.classList.add('zd-modal-open-scroll-lock');

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
          return;
        }
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('zd-modal-open-scroll-lock');
      if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
        lastActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, isDropdownOpen]);

  // Filtered document types for the searchable selector
  const filteredDocTypes = useMemo(() => {
    if (!searchQuery.trim()) return documentTypes;
    const q = searchQuery.toLowerCase();
    return documentTypes.filter(
      (dt) => dt.name.toLowerCase().includes(q) || (dt.category && dt.category.toLowerCase().includes(q))
    );
  }, [documentTypes, searchQuery]);

  const selectedDocTypeObj = useMemo(() => {
    return documentTypes.find((dt) => dt.id === selectedDocTypeId) || null;
  }, [documentTypes, selectedDocTypeId]);

  const handleSelectDocType = (dt) => {
    setSelectedDocTypeId(dt.id);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const handleClearDocType = (e) => {
    e.stopPropagation();
    setSelectedDocTypeId('');
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  const toggleExpandRow = (stateCode) => {
    setExpandedStateCode((prev) => (prev === stateCode ? null : stateCode));
  };

  if (!isOpen) return null;

  return (
    <div
      className="zd-stamp-duty-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="zd-stamp-duty-modal-title"
        className="zd-stamp-duty-modal-panel zd-stamp-duty-modal-panel--wide"
      >
        {/* Header */}
        <header className="zd-stamp-duty-modal-header">
          <div className="zd-stamp-duty-modal-header-info">
            <div className="zd-stamp-duty-icon-badge" aria-hidden="true">
              <Landmark size={20} />
            </div>
            <div>
              <h2 id="zd-stamp-duty-modal-title" className="zd-stamp-duty-modal-title">
                State Stamp Duty
              </h2>
              <p className="zd-stamp-duty-modal-subtitle">
                {selectedDocTypeObj
                  ? `Comparing state-wise statutory schedules for ${selectedDocTypeObj.name}`
                  : 'Compare verified state stamp duty rates across Indian jurisdictions'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="zd-stamp-duty-close-btn"
            onClick={onClose}
            aria-label="Close State Stamp Duty dialog"
          >
            <X size={18} />
          </button>
        </header>

        {/* Top Searchable Document Type Selector */}
        <div className="zd-stamp-duty-selector-bar">
          <div className="zd-doc-type-dropdown-wrapper" ref={dropdownRef}>
            <label htmlFor="input-search-document-type" className="zd-doc-type-label">
              Document Type:
            </label>
            <div className="zd-doc-type-search-input-box">
              <Search size={16} className="zd-search-icon" aria-hidden="true" />
              <input
                id="input-search-document-type"
                data-testid="input-search-document-type"
                type="text"
                className="zd-doc-type-search-input"
                placeholder={
                  selectedDocTypeObj
                    ? selectedDocTypeObj.name
                    : 'Search or select document type…'
                }
                value={isDropdownOpen ? searchQuery : (selectedDocTypeObj ? selectedDocTypeObj.name : searchQuery)}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (!isDropdownOpen) setIsDropdownOpen(true);
                }}
                autoComplete="off"
                aria-expanded={isDropdownOpen}
                aria-haspopup="listbox"
              />
              {selectedDocTypeId && (
                <button
                  type="button"
                  className="zd-doc-type-clear-btn"
                  onClick={handleClearDocType}
                  title="Clear document type selection"
                  aria-label="Clear document type selection"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                className="zd-doc-type-toggle-btn"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-label="Toggle document type options"
              >
                <ChevronDown
                  size={16}
                  style={{
                    transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>
            </div>

            {/* Dropdown Options Menu */}
            {isDropdownOpen && (
              <div className="zd-doc-type-options-menu" role="listbox">
                {filteredDocTypes.length === 0 ? (
                  <div className="zd-doc-type-empty-option">
                    No matching document types found
                  </div>
                ) : (
                  filteredDocTypes.map((dt) => {
                    const isSelected = dt.id === selectedDocTypeId;
                    return (
                      <div
                        key={dt.id}
                        role="option"
                        aria-selected={isSelected}
                        className={`zd-doc-type-option ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleSelectDocType(dt)}
                      >
                        <div className="zd-doc-type-option-content">
                          <span className="zd-doc-type-option-name">{dt.name}</span>
                          {dt.category && (
                            <span className="zd-doc-type-option-cat">{dt.category}</span>
                          )}
                        </div>
                        {isSelected && <CheckCircle2 size={16} className="zd-option-check" />}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="zd-stamp-duty-modal-body">
          {loading ? (
            <div className="zd-stamp-duty-state-container" aria-live="polite">
              <Loader2 size={28} className="zd-spinning-loader" />
              <p className="zd-state-loading-text">Loading state stamp duty rates…</p>
            </div>
          ) : !selectedDocTypeId ? (
            /* Prompt before a document type is selected */
            <div className="zd-stamp-duty-prompt-container">
              <div className="zd-stamp-duty-prompt-icon-wrap" aria-hidden="true">
                <FileText size={32} />
              </div>
              <h3 className="zd-stamp-duty-prompt-title">
                Select a document type to compare state-wise duty.
              </h3>
              <p className="zd-stamp-duty-prompt-subtitle">
                Choose an instrument above (such as Partnership Deed, LLP Agreement, or Power of Attorney)
                to view verified state-wise statutory fees, percentages, slabs, and official gazette citations.
              </p>
            </div>
          ) : (
            /* Clean Table with State / UT | Stamp Duty */
            <div className="zd-stamp-duty-table-wrapper">
              <table className="zd-stamp-duty-table">
                <thead>
                  <tr>
                    <th scope="col" style={{ width: '42%' }}>State / UT</th>
                    <th scope="col" style={{ width: '58%' }}>Stamp Duty</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => {
                    const isExpanded = expandedStateCode === item.stateCode;
                    return (
                      <React.Fragment key={item.stateCode}>
                        <tr
                          className={`zd-stamp-duty-row ${isExpanded ? 'is-expanded' : ''}`}
                          onClick={() => toggleExpandRow(item.stateCode)}
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleExpandRow(item.stateCode);
                            }
                          }}
                        >
                          <td className="zd-state-cell">
                            <span className="zd-state-name">{item.stateName}</span>
                            <span className="zd-state-code">{item.stateCode}</span>
                          </td>
                          <td className="zd-duty-cell">
                            <div className="zd-duty-cell-content">
                              <span
                                className={`zd-duty-badge zd-duty-badge--${
                                  item.status === 'not_applicable'
                                    ? 'exempt'
                                    : item.status === 'unverified'
                                    ? 'unverified'
                                    : 'verified'
                                }`}
                              >
                                {item.duty}
                              </span>
                              <span className="zd-expand-indicator" title="Click to view statutory basis & details">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </span>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Rate Details Drawer */}
                        {isExpanded && (
                          <tr className="zd-details-row">
                            <td colSpan={2} className="zd-details-cell">
                              <div className="zd-rate-details-panel">
                                <div className="zd-details-grid">
                                  <div className="zd-details-item">
                                    <span className="zd-details-label">Calculation Basis</span>
                                    <span className="zd-details-value">{item.calculationBasisLabel || item.calculationBasis}</span>
                                  </div>
                                  <div className="zd-details-item">
                                    <span className="zd-details-label">Statutory Article</span>
                                    <span className="zd-details-value">{item.articleReference}</span>
                                  </div>
                                  <div className="zd-details-item">
                                    <span className="zd-details-label">Calculation Inputs & Conditions</span>
                                    <span className="zd-details-value">{item.calculationInputs}</span>
                                  </div>
                                  <div className="zd-details-item">
                                    <span className="zd-details-label">Effective Date</span>
                                    <span className="zd-details-value">{item.effectiveDate}</span>
                                  </div>
                                  <div className="zd-details-item">
                                    <span className="zd-details-label">Last Verified Date</span>
                                    <span className="zd-details-value">{item.lastVerifiedDate}</span>
                                  </div>
                                  <div className="zd-details-item">
                                    <span className="zd-details-label">Official Source</span>
                                    <span className="zd-details-value">
                                      {item.officialSourceUrl ? (
                                        <a
                                          href={item.officialSourceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="zd-official-source-link"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {item.officialSource}
                                          <ExternalLink size={12} className="zd-external-icon" />
                                        </a>
                                      ) : (
                                        <span>{item.officialSource}</span>
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {item.conditions && (
                                  <div className="zd-details-notes">
                                    <strong>Statutory Notes:</strong> {item.conditions}
                                  </div>
                                )}

                                <div className="zd-statutory-notice-box">
                                  <div className="zd-notice-row">
                                    <Info size={14} className="zd-notice-icon" />
                                    <span>{item.statutoryNotice}</span>
                                  </div>
                                  <div className="zd-notice-row">
                                    <Info size={14} className="zd-notice-icon" />
                                    <span>{item.denominationNotice}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Single Short Note and Close Button */}
        <footer className="zd-stamp-duty-modal-footer">
          <p className="zd-footer-brief-note">
            Reference rates only. Final duty depends on document details and applicable rules.
          </p>
          <button
            type="button"
            className="zd-stamp-duty-done-btn"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
