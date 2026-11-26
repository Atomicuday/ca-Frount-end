import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  RotateCcw,
  Users,
  ShieldCheck,
  Loader2,
  Send
} from 'lucide-react';
import {
  caBulkImportService,
  STANDARD_IMPORT_HEADERS,
  TEMPLATE_CODE_CATALOG
} from '../../../services/api/caBulkImportService.js';
import './BulkUploadModal.css';

export default function BulkUploadModal({
  isOpen,
  onClose,
  onImportSuccess,
  onOpenBatchInvite
}) {
  const [currentStep, setCurrentStep] = useState(1); // 1 to 6
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');

  // Parsed Data
  const [uploadedHeaders, setUploadedHeaders] = useState([]);
  const [dataRows, setDataRows] = useState([]);
  const [contactsRows, setContactsRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});

  // Validation Data
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [previewFilter, setPreviewFilter] = useState('ALL'); // 'ALL' | 'VALID' | 'ERROR' | 'WARN'

  // Confirm & Execution
  const [excludeErrors, setExcludeErrors] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importJob, setImportJob] = useState(null);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedFile(null);
      setFileError(null);
      setValidationResult(null);
      setImportJob(null);
      setExcludeErrors(false);
    }
  }, [isOpen]);

  // Focus trap & Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // --- Step 1: Template Downloads ---
  const handleDownloadExcelTemplate = () => {
    try {
      const bytes = caBulkImportService.generateTemplateWorkbook();
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ZapDocs_Bulk_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download template error:', err);
    }
  };

  const handleDownloadCsvTemplate = () => {
    try {
      const csvContent = caBulkImportService.generateTemplateCsv();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ZapDocs_Bulk_Import_Template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download CSV error:', err);
    }
  };

  // --- Step 2: File Upload & Inspection ---
  const handleFileSelect = (file) => {
    setFileError(null);
    if (!file) return;

    // Security check
    const secResult = caBulkImportService.validateFileSecurity(file);
    if (!secResult.valid) {
      setFileError(secResult.error);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcessUploadedFile = async () => {
    if (!selectedFile) return;
    setParsing(true);
    setParseProgress('Inspecting file headers and scanning worksheets…');
    try {
      const parsed = await caBulkImportService.parseUploadedFile(selectedFile);
      setUploadedHeaders(parsed.headers);
      setDataRows(parsed.dataRows);
      setContactsRows(parsed.contactsRows);

      const initialMap = caBulkImportService.generateInitialMapping(parsed.headers);
      setColumnMapping(initialMap);

      setCurrentStep(3); // Go to Map & Validate
    } catch (err) {
      setFileError(err.message || 'Failed to parse file. Please verify file contents.');
    } finally {
      setParsing(false);
      setParseProgress('');
    }
  };

  // --- Step 3: Column Mapping & Trigger Validation ---
  const handleMappingChange = (fieldKey, uploadedColName) => {
    setColumnMapping((prev) => ({
      ...prev,
      [fieldKey]: uploadedColName
    }));
  };

  const handleRunValidation = async () => {
    setValidating(true);
    try {
      const result = await caBulkImportService.validateImportRows({
        dataRows,
        headers: uploadedHeaders,
        columnMapping,
        contactsRows
      });
      setValidationResult(result);
      setCurrentStep(4); // Go to Preview
    } catch (err) {
      setFileError(err.message);
    } finally {
      setValidating(false);
    }
  };

  // --- Step 4: Preview & Error Report ---
  const handleDownloadErrorReport = () => {
    if (!validationResult) return;
    const csvContent = caBulkImportService.generateErrorReportCsv(validationResult.rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZapDocs_Validation_Errors_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Step 5: Confirm & Execution ---
  const handleExecuteImport = async () => {
    if (!validationResult) return;
    setImporting(true);
    try {
      const job = await caBulkImportService.executeImport({
        validatedRows: validationResult.rows,
        excludeErrors
      });
      setImportJob(job);
      setCurrentStep(6); // Go to Results
    } catch (err) {
      setFileError(err.message || 'Import execution failed.');
    } finally {
      setImporting(false);
    }
  };

  // --- Step 6: Results Download ---
  const handleDownloadResultsCsv = () => {
    if (!importJob) return;
    const csvContent = caBulkImportService.generateResultsCsv(importJob);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ZapDocs_Import_Results_${importJob.jobId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Retry Failed Rows
  const handleRetryFailedRows = () => {
    if (!importJob || !validationResult) return;
    const failedRowRefs = new Set((importJob.failedRows || []).map((f) => f.externalRowRef));
    const unimportedRows = validationResult.rows.filter(
      (r) => !r.importSuccess || failedRowRefs.has(r.externalRowRef)
    );
    setValidationResult((prev) => ({
      ...prev,
      totalRows: unimportedRows.length,
      validRows: unimportedRows.filter((r) => r.isValid).length,
      errorRows: unimportedRows.filter((r) => !r.isValid).length,
      rows: unimportedRows
    }));
    setPreviewFilter('ALL');
    setCurrentStep(4); // Return to Preview
  };

  const STEPS = [
    { num: 1, title: 'Download Template' },
    { num: 2, title: 'Upload' },
    { num: 3, title: 'Map & Validate' },
    { num: 4, title: 'Preview' },
    { num: 5, title: 'Confirm Import' },
    { num: 6, title: 'Results' }
  ];

  return (
    <div className="zd-bulk-modal-overlay" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="zd-bulk-modal-title"
        className="zd-bulk-modal-panel"
      >
        {/* Header */}
        <header className="zd-bulk-modal-header">
          <div className="zd-bulk-header-left">
            <div className="zd-bulk-icon-badge" aria-hidden="true">
              <UploadCloud size={22} />
            </div>
            <div>
              <h2 id="zd-bulk-modal-title" className="zd-bulk-modal-title">
                Bulk Client & Document Import
              </h2>
              <p className="zd-bulk-modal-subtitle">
                Create multiple client document requests in batch via verified Excel or CSV
              </p>
            </div>
          </div>
          <button
            type="button"
            className="zd-bulk-close-btn"
            onClick={onClose}
            aria-label="Close bulk upload dialog"
          >
            <X size={18} />
          </button>
        </header>

        {/* 6-Step Stepper Progress Bar */}
        <div style={{ padding: '6px 24px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', fontSize: '11.5px', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={14} />
          <span><strong>Demo Prototype Mode:</strong> Client matching and import jobs run against local browser storage. Production requires authoritative backend API authentication and database transactions.</span>
        </div>

        <nav aria-label="Bulk Upload Steps" className="zd-bulk-stepper">
          {STEPS.map((s, idx) => {
            const isDone = currentStep > s.num;
            const isActive = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  className={`zd-bulk-step-item ${
                    isActive ? 'zd-bulk-step-item--active' : isDone ? 'zd-bulk-step-item--done' : ''
                  }`}
                >
                  <span className="zd-bulk-step-num">
                    {isDone ? '✓' : s.num}
                  </span>
                  <span>{s.title}</span>
                </div>
                {idx < STEPS.length - 1 && <span className="zd-bulk-step-sep" aria-hidden="true">›</span>}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Modal Body */}
        <div className="zd-bulk-modal-body">
          {fileError && (
            <div className="zd-guidelines-box" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
              <h4>Validation Alert</h4>
              <p style={{ margin: 0 }}>{fileError}</p>
            </div>
          )}

          {/* STEP 1: DOWNLOAD TEMPLATE */}
          {currentStep === 1 && (
            <>
              <div className="zd-template-download-card">
                <div className="zd-template-download-row">
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      Official Import Templates
                    </h3>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                      Pre-formatted templates with Instructions, Data, and Contacts sheets
                    </p>
                  </div>
                  <div className="zd-template-download-actions">
                    <button
                      type="button"
                      className="zd-btn-download-tpl zd-btn-download-tpl--excel"
                      onClick={handleDownloadExcelTemplate}
                    >
                      <Download size={15} />
                      <span>Download Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      className="zd-btn-download-tpl zd-btn-download-tpl--csv"
                      onClick={handleDownloadCsvTemplate}
                    >
                      <Download size={15} />
                      <span>Download CSV (.csv)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Statutory Rules & Guidelines */}
              <div className="zd-guidelines-box">
                <h4>Statutory Import Guidelines</h4>
                <ul>
                  <li><strong>One Row = One Request:</strong> Each row in the Data sheet creates one document draft.</li>
                  <li><strong>Client Reuse:</strong> Multiple rows can specify the same client (or use <em>Existing Client Reference</em>) without duplicating the client entity.</li>
                  <li><strong>Separate Date Semantics:</strong> <em>Due Date</em> is the task/filing deadline; <em>Expiry Date</em> is agreement cessation. Use <code>YYYY-MM-DD</code>.</li>
                  <li><strong>Identity & Aadhaar Safeguard:</strong> Omitting Aadhaar from bulk templates is an operational security control to avoid plaintext credential exposure in files. Full legal compliance requires adherence to statutory UIDAI guidelines, consent recording, and authorized individual e-KYC.</li>
                  <li><strong>Format Restrictions:</strong> Only <code>.xlsx</code> and <code>.csv</code> are permitted. Executables and macros are blocked.</li>
                </ul>
              </div>

              {/* Template Code Guide */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                  Document Template Catalog & Approved Codes
                </h4>
                <div className="zd-catalog-table-wrap">
                  <table className="zd-catalog-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Template Name</th>
                        <th>Category</th>
                        <th>Email Mandatory?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TEMPLATE_CODE_CATALOG.map((t) => (
                        <tr key={t.code}>
                          <td>
                            <span className="zd-catalog-code-badge">{t.code}</span>
                          </td>
                          <td><strong>{t.name}</strong></td>
                          <td>{t.category}</td>
                          <td>{t.requiresEmail ? 'Yes (Mandatory)' : 'Optional'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* STEP 2: UPLOAD */}
          {currentStep === 2 && (
            <>
              <div
                className="zd-upload-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".xlsx,.csv"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
                <div className="zd-upload-icon-circle">
                  <UploadCloud size={28} />
                </div>
                <div>
                  <p className="zd-upload-text-main">
                    Drag and drop your filled spreadsheet here, or click to browse
                  </p>
                  <p className="zd-upload-text-sub">
                    Supports .xlsx and .csv files up to 5 MB (Max 500 rows per batch)
                  </p>
                </div>
              </div>

              {selectedFile && (
                <div className="zd-file-selected-box">
                  <div className="zd-file-selected-left">
                    <FileSpreadsheet size={24} color="#1d4ed8" />
                    <div>
                      <div className="zd-file-name">{selectedFile.name}</div>
                      <div className="zd-file-size">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Valid format detected
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="zd-bulk-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {parsing && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Loader2 size={24} className="zd-spinning-loader" />
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    {parseProgress}
                  </p>
                </div>
              )}
            </>
          )}

          {/* STEP 3: MAP & VALIDATE */}
          {currentStep === 3 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    Verify Column Mapping
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Map columns from <strong>{selectedFile?.name}</strong> ({dataRows.length} rows detected) to statutory fields
                  </p>
                </div>
              </div>

              <div className="zd-mapping-table-wrap">
                <table className="zd-mapping-table">
                  <thead>
                    <tr>
                      <th>Standard Expected Field</th>
                      <th>Requirement</th>
                      <th>Mapped Column from File</th>
                      <th>Sample Data (Row 1)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STANDARD_IMPORT_HEADERS.map((std) => {
                      const selectedCol = columnMapping[std.key] || '';
                      const colIdx = uploadedHeaders.indexOf(selectedCol);
                      const sampleVal = colIdx >= 0 && dataRows[0] ? dataRows[0][colIdx] : '—';
                      return (
                        <tr key={std.key}>
                          <td>
                            <strong>{std.label}</strong>
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', color: std.required ? '#b91c1c' : '#64748b', fontWeight: 600 }}>
                              {std.required ? 'Required' : 'Optional'}
                            </span>
                          </td>
                          <td>
                            <select
                              className="zd-mapping-select"
                              value={selectedCol}
                              onChange={(e) => handleMappingChange(std.key, e.target.value)}
                            >
                              <option value="">-- Do Not Import / Not Mapped --</option>
                              {uploadedHeaders.map((uh) => (
                                <option key={uh} value={uh}>
                                  {uh}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ color: '#475569', fontSize: '12px' }}>
                            {sampleVal || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* STEP 4: PREVIEW */}
          {currentStep === 4 && validationResult && (
            <>
              {/* Summary Stats Cards */}
              <div className="zd-preview-stats-grid">
                <div className="zd-preview-stat-card" onClick={() => setPreviewFilter('ALL')} style={{ cursor: 'pointer' }}>
                  <span className="zd-preview-stat-val">{validationResult.totalRows}</span>
                  <span className="zd-preview-stat-lbl">Total Requests</span>
                </div>
                <div className="zd-preview-stat-card" onClick={() => setPreviewFilter('VALID')} style={{ cursor: 'pointer' }}>
                  <span className="zd-preview-stat-val zd-preview-stat-val--valid">
                    {validationResult.validRows}
                  </span>
                  <span className="zd-preview-stat-lbl">Valid & Ready</span>
                </div>
                <div className="zd-preview-stat-card" onClick={() => setPreviewFilter('ERROR')} style={{ cursor: 'pointer' }}>
                  <span className="zd-preview-stat-val zd-preview-stat-val--error">
                    {validationResult.errorRows}
                  </span>
                  <span className="zd-preview-stat-lbl">Errors</span>
                </div>
                <div className="zd-preview-stat-card" onClick={() => setPreviewFilter('WARN')} style={{ cursor: 'pointer' }}>
                  <span className="zd-preview-stat-val zd-preview-stat-val--warn">
                    {validationResult.warningRows}
                  </span>
                  <span className="zd-preview-stat-lbl">Warnings</span>
                </div>
                <div className="zd-preview-stat-card">
                  <span className="zd-preview-stat-val zd-preview-stat-val--match">
                    {validationResult.clientMatchesCount}
                  </span>
                  <span className="zd-preview-stat-lbl">Existing Client Links</span>
                </div>
              </div>

              {/* Actions & Filters Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`zd-status-pill ${previewFilter === 'ALL' ? 'zd-status-pill--valid' : ''}`}
                    onClick={() => setPreviewFilter('ALL')}
                  >
                    All ({validationResult.totalRows})
                  </button>
                  <button
                    type="button"
                    className={`zd-status-pill ${previewFilter === 'VALID' ? 'zd-status-pill--valid' : ''}`}
                    onClick={() => setPreviewFilter('VALID')}
                  >
                    Valid ({validationResult.validRows})
                  </button>
                  {validationResult.errorRows > 0 && (
                    <button
                      type="button"
                      className={`zd-status-pill ${previewFilter === 'ERROR' ? 'zd-status-pill--error' : ''}`}
                      onClick={() => setPreviewFilter('ERROR')}
                    >
                      Errors ({validationResult.errorRows})
                    </button>
                  )}
                  {validationResult.warningRows > 0 && (
                    <button
                      type="button"
                      className={`zd-status-pill ${previewFilter === 'WARN' ? 'zd-status-pill--warn' : ''}`}
                      onClick={() => setPreviewFilter('WARN')}
                    >
                      Warnings ({validationResult.warningRows})
                    </button>
                  )}
                </div>

                {validationResult.errorRows > 0 && (
                  <button
                    type="button"
                    className="zd-btn-modal-action zd-btn-modal-action--secondary"
                    onClick={handleDownloadErrorReport}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Download size={14} />
                    <span>Download Error Report</span>
                  </button>
                )}
              </div>

              {/* Preview Table */}
              <div className="zd-preview-table-wrap">
                <table className="zd-preview-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Client / Entity</th>
                      <th>Template</th>
                      <th>Due Date</th>
                      <th>Expiry Date</th>
                      <th>Validation Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationResult.rows
                      .filter((r) => {
                        if (previewFilter === 'VALID') return r.isValid;
                        if (previewFilter === 'ERROR') return !r.isValid;
                        if (previewFilter === 'WARN') return r.warnings.length > 0;
                        return true;
                      })
                      .map((r) => (
                        <tr
                          key={r.rowNumber}
                          className={!r.isValid ? 'zd-preview-row--error' : r.warnings.length > 0 ? 'zd-preview-row--warn' : ''}
                        >
                          <td>
                            <strong>{r.externalRowRef}</strong>
                          </td>
                          <td>
                            <div>{r.companyName || r.contactPerson}</div>
                            {r.matchedClient && (
                              <div style={{ fontSize: '10.5px', color: '#1d4ed8' }}>
                                Linked to {r.matchedClient.id} ({r.matchedClient.name})
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="zd-catalog-code-badge">{r.templateCode}</span>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {r.resolvedTemplate?.name || 'Unknown'}
                            </div>
                          </td>
                          <td>
                            {r.dueDate ? (
                              <span style={{ color: r.isDueOverdue ? '#b91c1c' : '#0f172a' }}>
                                {r.dueDate} {r.isDueOverdue && '⚠️ (Overdue)'}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {r.expiryDate ? (
                              <span style={{ color: r.isExpiryPast ? '#b91c1c' : '#0f172a' }}>
                                {r.expiryDate} {r.isExpiryPast && '⚠️ (Expired)'}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {r.isValid ? (
                              r.warnings.length > 0 ? (
                                <div>
                                  <span className="zd-status-pill zd-status-pill--warn">Valid with Warning</span>
                                  <div style={{ fontSize: '10.5px', color: '#92400e', marginTop: '2px' }}>
                                    {r.warnings[0]}
                                  </div>
                                </div>
                              ) : (
                                <span className="zd-status-pill zd-status-pill--valid">Valid</span>
                              )
                            ) : (
                              <div>
                                <span className="zd-status-pill zd-status-pill--error">Invalid</span>
                                <div style={{ fontSize: '10.5px', color: '#b91c1c', marginTop: '2px' }}>
                                  {r.errors[0]}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* STEP 5: CONFIRM IMPORT */}
          {currentStep === 5 && validationResult && (
            <div className="zd-confirm-box">
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Confirm Batch Request Creation
              </h3>

              <div className="zd-confirm-list">
                <div className="zd-confirm-item">
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>
                    <strong>{excludeErrors ? validationResult.validRows : validationResult.totalRows}</strong> document requests selected for creation.
                  </span>
                </div>
                <div className="zd-confirm-item">
                  <CheckCircle2 size={16} color="#3b82f6" />
                  <span>
                    Existing client entities will be reused where verified; new entities will be created once.
                  </span>
                </div>
                <div className="zd-confirm-item">
                  <CheckCircle2 size={16} color="#6366f1" />
                  <span>
                    Each document will receive a unique draft ID, revision history, and payment quotation.
                  </span>
                </div>
              </div>

              {validationResult.errorRows > 0 && (
                <label className="zd-confirm-exclude-check">
                  <input
                    type="checkbox"
                    checked={excludeErrors}
                    onChange={(e) => setExcludeErrors(e.target.checked)}
                  />
                  <span>
                    Exclude <strong>{validationResult.errorRows}</strong> invalid rows and import the <strong>{validationResult.validRows}</strong> valid records.
                  </span>
                </label>
              )}

              {validationResult.errorRows > 0 && !excludeErrors && (
                <div className="zd-guidelines-box" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
                  <h4>Blocking Errors Detected</h4>
                  <p style={{ margin: 0 }}>
                    Please check "Exclude invalid rows" above to proceed with the valid selection, or return to Map & Validate to fix mappings.
                  </p>
                </div>
              )}

              <div className="zd-security-notice">
                <ShieldCheck size={18} color="#1d4ed8" />
                <span>
                  <strong>Idempotent Workflow Guarantee:</strong> No WhatsApp invitations, wallet debits, stamp paper purchases, or signing links will be dispatched automatically during import.
                </span>
              </div>
            </div>
          )}

          {/* STEP 6: RESULTS */}
          {currentStep === 6 && importJob && (
            <div className="zd-results-box">
              <div
                className={`zd-results-icon-big ${
                  importJob.failedCount === 0 ? 'zd-results-icon-big--success' : 'zd-results-icon-big--partial'
                }`}
              >
                {importJob.failedCount === 0 ? <CheckCircle2 size={36} /> : <AlertTriangle size={36} />}
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {importJob.status === 'COMPLETED' ? 'Import Completed Successfully' : 'Import Partially Completed'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Batch Reference: <strong>{importJob.jobId}</strong>
                </p>
              </div>

              <div className="zd-preview-stats-grid" style={{ width: '100%', maxWidth: '520px' }}>
                <div className="zd-preview-stat-card">
                  <span className="zd-preview-stat-val zd-preview-stat-val--valid">
                    {importJob.successCount}
                  </span>
                  <span className="zd-preview-stat-lbl">Drafts Created</span>
                </div>
                <div className="zd-preview-stat-card">
                  <span className="zd-preview-stat-val zd-preview-stat-val--match">
                    {importJob.createdClientsCount}
                  </span>
                  <span className="zd-preview-stat-lbl">Clients Registered</span>
                </div>
                {importJob.failedCount > 0 && (
                  <div className="zd-preview-stat-card">
                    <span className="zd-preview-stat-val zd-preview-stat-val--error">
                      {importJob.failedCount}
                    </span>
                    <span className="zd-preview-stat-lbl">Failed Rows</span>
                  </div>
                )}
              </div>

              <div className="zd-results-actions">
                <button
                  type="button"
                  className="zd-btn-modal-action zd-btn-modal-action--secondary"
                  onClick={handleDownloadResultsCsv}
                >
                  <Download size={15} />
                  <span>Download Results (.csv)</span>
                </button>
                {importJob.failedCount > 0 && (
                  <button
                    type="button"
                    className="zd-btn-modal-action zd-btn-modal-action--secondary"
                    onClick={handleRetryFailedRows}
                    style={{ borderColor: '#f59e0b', color: '#b45309' }}
                  >
                    <RotateCcw size={15} />
                    <span>Retry Failed Rows ({importJob.failedCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  className="zd-btn-modal-action zd-btn-modal-action--primary"
                  onClick={() => {
                    onClose();
                    if (onImportSuccess) onImportSuccess(importJob);
                  }}
                >
                  <FileText size={15} />
                  <span>View Imported Documents</span>
                </button>
                {importJob.successCount > 0 && onOpenBatchInvite && (
                  <button
                    type="button"
                    className="zd-btn-modal-action zd-btn-modal-action--secondary"
                    onClick={() => {
                      onClose();
                      onOpenBatchInvite(importJob.createdDocuments);
                    }}
                  >
                    <Send size={15} />
                    <span>Batch Invite Signers ({importJob.successCount})</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Navigation */}
        <footer className="zd-bulk-modal-footer">
          <div>
            {currentStep > 1 && currentStep < 6 && (
              <button
                type="button"
                className="zd-btn-modal-action zd-btn-modal-action--secondary"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={importing || validating}
              >
                <ChevronLeft size={16} />
                <span>Back</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {currentStep === 1 && (
              <button
                type="button"
                className="zd-btn-modal-action zd-btn-modal-action--primary"
                onClick={() => setCurrentStep(2)}
              >
                <span>Continue to Upload</span>
                <ChevronRight size={16} />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                className="zd-btn-modal-action zd-btn-modal-action--primary"
                onClick={handleProcessUploadedFile}
                disabled={!selectedFile || parsing}
              >
                {parsing ? <Loader2 size={16} className="zd-spinning-loader" /> : <ChevronRight size={16} />}
                <span>Process File</span>
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                className="zd-btn-modal-action zd-btn-modal-action--primary"
                onClick={handleRunValidation}
                disabled={validating}
              >
                {validating ? <Loader2 size={16} className="zd-spinning-loader" /> : <ChevronRight size={16} />}
                <span>Validate Data</span>
              </button>
            )}

            {currentStep === 4 && (
              <button
                type="button"
                className="zd-btn-modal-action zd-btn-modal-action--primary"
                onClick={() => setCurrentStep(5)}
              >
                <span>Proceed to Confirmation</span>
                <ChevronRight size={16} />
              </button>
            )}

            {currentStep === 5 && (
              <button
                type="button"
                className="zd-btn-modal-action zd-btn-modal-action--primary"
                onClick={handleExecuteImport}
                disabled={
                  importing ||
                  (validationResult?.errorRows > 0 && !excludeErrors)
                }
              >
                {importing ? <Loader2 size={16} className="zd-spinning-loader" /> : <CheckCircle2 size={16} />}
                <span>Confirm & Create Documents</span>
              </button>
            )}

            {currentStep === 6 && (
              <button
                type="button"
                className="zd-btn-modal-action zd-btn-modal-action--primary"
                onClick={onClose}
              >
                <span>Done</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
