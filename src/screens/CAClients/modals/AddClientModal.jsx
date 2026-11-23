import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  FileText,
  User,
  ChevronDown,
  Search,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { caTemplateService } from '../../../services/api/caTemplateService.js';
import { caClientService } from '../../../services/api/caClientService.js';
import GlassSelect from '../../../components/common/GlassSelect.jsx';

export default function AddClientModal({ isOpen, onClose, onSuccess, triggerButtonRef, initialClient = null }) {
  // Modal & Async Loading
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState(null);

  // Template Selection
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const templateDropdownRef = useRef(null);

  // Aadhaar Number State (Numeric text mode, formatted, masked with eye toggle)
  const [aadhaar, setAadhaar] = useState('');
  const [showAadhaar, setShowAadhaar] = useState(false);

  // Basic Client Details
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Dynamic Extra Fields (e.g. Alternate Phone, Additional Email, Second Contact, etc.)
  const [additionalFields, setAdditionalFields] = useState([]);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [dialogFieldName, setDialogFieldName] = useState('');
  const [dialogFieldValue, setDialogFieldValue] = useState('');
  const [dialogError, setDialogError] = useState('');
  const fieldNameInputRef = useRef(null);

  // Template-Specific Schema Fields
  const [templateFields, setTemplateFields] = useState({});

  // Submission, Errors, Partial-Failure Retry
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [retrySavedClientId, setRetrySavedClientId] = useState(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const modalRef = useRef(null);

  // Selected template object
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  // Populate from initialClient if editing an existing client
  useEffect(() => {
    if (initialClient && isOpen) {
      setCompanyName(initialClient.companyName || '');
      setContactPerson(initialClient.contactPerson || '');
      if (initialClient.phone) {
        const parts = initialClient.phone.split(' ');
        if (parts.length > 1 && parts[0].startsWith('+')) {
          setCountryCode(parts[0]);
          setPhone(parts.slice(1).join(' '));
        } else {
          setPhone(initialClient.phone);
        }
      }
      setEmail(initialClient.email || '');
      setAdditionalFields(Array.isArray(initialClient.additionalFields) ? initialClient.additionalFields : []);
      if (initialClient.id) {
        setRetrySavedClientId(initialClient.id);
      }
    }
  }, [initialClient, isOpen]);

  // Check if form is dirty
  const isFormDirty = Boolean(
    selectedTemplateId ||
    companyName ||
    contactPerson ||
    aadhaar ||
    phone ||
    email ||
    additionalFields.length > 0 ||
    Object.keys(templateFields).length > 0
  );

  const resetAndClose = useCallback(() => {
    setShowDiscardConfirm(false);
    setSelectedTemplateId('');
    setCompanyName('');
    setContactPerson('');
    setAadhaar('');
    setShowAadhaar(false);
    setPhone('');
    setEmail('');
    setAdditionalFields([]);
    setIsFieldDialogOpen(false);
    setEditingFieldId(null);
    setDialogFieldName('');
    setDialogFieldValue('');
    setDialogError('');
    setTemplateFields({});
    setErrors({});
    setSubmitError(null);
    setRetrySavedClientId(null);
    onClose();

    // Restore focus to trigger button
    if (triggerButtonRef && triggerButtonRef.current) {
      setTimeout(() => triggerButtonRef.current.focus(), 50);
    }
  }, [onClose, triggerButtonRef]);

  // Aadhaar normalization & format helpers
  const normalizeAadhaar = (val) => {
    if (!val) return '';
    return String(val).replace(/\D/g, '').slice(0, 12);
  };

  const formatAadhaar = (val) => {
    if (!val) return '';
    const digits = normalizeAadhaar(val);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleAadhaarChange = (e) => {
    const raw = e.target.value;
    const clean = normalizeAadhaar(raw);
    setAadhaar(clean);
    if (errors.aadhaar) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.aadhaar;
        return next;
      });
    }
  };

  const validateAadhaar = (val) => {
    const clean = normalizeAadhaar(val);
    if (clean.length > 0 && clean.length !== 12) {
      setErrors((prev) => ({
        ...prev,
        aadhaar: 'Aadhaar number must be exactly 12 digits.'
      }));
      return false;
    }
    if (selectedTemplate?.requiresAadhaar && clean.length !== 12) {
      setErrors((prev) => ({
        ...prev,
        aadhaar: `${selectedTemplate.name} requires a 12-digit Aadhaar number.`
      }));
      return false;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.aadhaar;
      return next;
    });
    return true;
  };

  const handleAttemptClose = useCallback(() => {
    if (isFormDirty && !retrySavedClientId) {
      setShowDiscardConfirm(true);
    } else {
      resetAndClose();
    }
  }, [isFormDirty, retrySavedClientId, resetAndClose]);

  // Load published templates on open
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setTemplatesLoading(true);
    setTemplatesError(null);

    caTemplateService
      .getPublishedTemplates()
      .then((data) => {
        if (active) {
          setTemplates(data || []);
          setTemplatesLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          console.error('Failed to load templates:', err);
          setTemplatesError('Unable to load published document templates. Please try again.');
          setTemplatesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  // Handle template selection change: revalidate and exclude stale fields
  const handleSelectTemplate = (template) => {
    if (!template) {
      setSelectedTemplateId('');
      setTemplateFields({});
      return;
    }

    setSelectedTemplateId(template.id);
    setTemplateDropdownOpen(false);
    setTemplateSearchTerm('');

    // Pre-populate default values from template schema and exclude stale fields from previous template
    const newFields = {};
    if (template.fields) {
      template.fields.forEach((f) => {
        if (f.defaultValue) {
          newFields[f.id] = f.defaultValue;
        }
      });
    }
    setTemplateFields(newFields);

    // Clear template-specific errors
    setErrors((prev) => {
      const next = { ...prev };
      delete next.template;
      return next;
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target)) {
        setTemplateDropdownOpen(false);
      }
    }
    if (templateDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [templateDropdownOpen]);

  // Keyboard accessibility: Escape handling & dialog dismissals
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (isFieldDialogOpen) {
          setIsFieldDialogOpen(false);
        } else if (templateDropdownOpen) {
          setTemplateDropdownOpen(false);
        } else {
          handleAttemptClose();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFieldDialogOpen, templateDropdownOpen, handleAttemptClose]);

  // Determine if a field is required by the template schema
  const templateRequiresPan = Boolean(selectedTemplate?.fields?.some((f) => f.id === 'pan'));
  const templateRequiresGstin = Boolean(selectedTemplate?.fields?.some((f) => f.id === 'gstin'));
  const templateRequiresCin = Boolean(selectedTemplate?.fields?.some((f) => f.id === 'cin'));
  const templateRequiresLlpin = Boolean(selectedTemplate?.fields?.some((f) => f.id === 'llpin'));

  // Open dialog to add new extra field
  const handleOpenAddFieldDialog = () => {
    setEditingFieldId(null);
    setDialogFieldName('');
    setDialogFieldValue('');
    setDialogError('');
    setIsFieldDialogOpen(true);
    setTimeout(() => {
      fieldNameInputRef.current?.focus();
    }, 60);
  };

  // Open dialog to edit existing extra field
  const handleOpenEditFieldDialog = (field) => {
    setEditingFieldId(field.id);
    setDialogFieldName(field.label);
    setDialogFieldValue(field.value);
    setDialogError('');
    setIsFieldDialogOpen(true);
    setTimeout(() => {
      fieldNameInputRef.current?.focus();
    }, 60);
  };

  // Save new or edited field from dialog
  const handleSaveFieldDialog = (e) => {
    if (e) e.preventDefault();
    const trimmedName = dialogFieldName.trim();
    const trimmedVal = dialogFieldValue.trim();

    if (!trimmedName) {
      setDialogError('Field name is required.');
      return;
    }
    if (!trimmedVal) {
      setDialogError('Field value is required.');
      return;
    }

    if (editingFieldId) {
      setAdditionalFields((prev) =>
        prev.map((f) =>
          f.id === editingFieldId ? { ...f, label: trimmedName, value: trimmedVal } : f
        )
      );
    } else {
      const newField = {
        id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        label: trimmedName,
        value: trimmedVal
      };
      setAdditionalFields((prev) => [...prev, newField]);
    }

    setIsFieldDialogOpen(false);
    setEditingFieldId(null);
    setDialogFieldName('');
    setDialogFieldValue('');
    setDialogError('');
  };

  // Remove extra field by id
  const handleRemoveField = (fieldId) => {
    setAdditionalFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};

    // 1. Template is required
    if (!selectedTemplateId) {
      errs.template = 'Please select a document template.';
    }

    // 2. Contact person / primary contact name required
    if (!contactPerson.trim() || contactPerson.trim().length < 2) {
      errs.contactPerson = 'Primary contact name is required.';
    }

    // 3. Mobile number required (10 digits)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Valid 10-digit mobile number is required.';
    }

    // 4. Aadhaar format validation: optional unless template requires it
    const cleanAadhaar = normalizeAadhaar(aadhaar);
    if (selectedTemplate?.requiresAadhaar) {
      if (!cleanAadhaar || cleanAadhaar.length !== 12) {
        errs.aadhaar = `${selectedTemplate.name} requires a 12-digit Aadhaar number for statutory execution.`;
      }
    } else if (cleanAadhaar.length > 0 && cleanAadhaar.length !== 12) {
      errs.aadhaar = 'Aadhaar number must be exactly 12 digits.';
    }

    // 5. Email required if template specifies requiresEmail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (selectedTemplate?.requiresEmail) {
      if (!email.trim() || !emailRegex.test(email.trim())) {
        errs.email = `${selectedTemplate.name} requires a valid registered email address.`;
      }
    } else if (email.trim() && !emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    // 6. Template-specific required fields
    if (selectedTemplate && selectedTemplate.fields) {
      selectedTemplate.fields.forEach((f) => {
        if (f.required) {
          const val = templateFields[f.id];
          if (!val || (typeof val === 'string' && !val.trim())) {
            errs[f.id] = `${f.label} is mandatory for this template.`;
          }
        }
      });
    }

    // 7. Template PAN / GSTIN validation if present in template
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (templateRequiresPan && templateFields.pan && !panRegex.test(templateFields.pan.trim().toUpperCase())) {
      errs.pan = 'Enter valid 10-character PAN (e.g. AAACA1234A).';
    }

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (templateRequiresGstin && templateFields.gstin && !gstinRegex.test(templateFields.gstin.trim().toUpperCase())) {
      errs.gstin = 'Enter valid 15-character GSTIN (e.g. 29AAACA1234A1Z5).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanAadhaar = normalizeAadhaar(aadhaar);
      const clientPayload = {
        id: retrySavedClientId || undefined,
        clientType: initialClient?.entityType || initialClient?.clientType || null,
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        phone: `${countryCode} ${phone.trim()}`,
        email: email.trim(),
        // Security: Masked Aadhaar token only. Never log or persist plaintext 12-digit Aadhaar without ADV HSM vault.
        aadhaarMasked: cleanAadhaar ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}` : '',
        aadhaarLast4: cleanAadhaar ? cleanAadhaar.slice(-4) : '',
        hasAadhaarProvided: cleanAadhaar.length === 12,
        pan: (templateRequiresPan ? templateFields.pan : '')?.trim().toUpperCase() || '',
        gstin: (templateRequiresGstin ? templateFields.gstin : '')?.trim().toUpperCase() || '',
        cin: (templateRequiresCin ? templateFields.cin : '')?.trim().toUpperCase() || '',
        llpin: (templateRequiresLlpin ? templateFields.llpin : '')?.trim().toUpperCase() || '',
        additionalFields,
        notes: ''
      };

      // Sanitize template fields: strictly include active template schema fields to exclude stale values
      const cleanTemplateFields = {};
      if (selectedTemplate && Array.isArray(selectedTemplate.fields)) {
        selectedTemplate.fields.forEach((f) => {
          if (templateFields[f.id] !== undefined) {
            cleanTemplateFields[f.id] = templateFields[f.id];
          }
        });
      }

      const result = await caClientService.saveClientAndDraft({
        clientPayload,
        template: selectedTemplate,
        templateFields: cleanTemplateFields,
        retrySavedClientId
      });

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.client, result.document, result.message);
        }
        resetAndClose();
      } else if (result.partialSuccess) {
        // Partial failure: client saved, draft creation failed
        setRetrySavedClientId(result.retrySavedClientId);
        setSubmitError(result.error);
      } else {
        setSubmitError(result.error || 'Failed to save client. Please check entered information.');
      }
    } catch (err) {
      console.error('AddClient submission error:', err);
      setSubmitError(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter templates based on search term
  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(templateSearchTerm.toLowerCase().trim()) ||
      t.category.toLowerCase().includes(templateSearchTerm.toLowerCase().trim()) ||
      t.code.toLowerCase().includes(templateSearchTerm.toLowerCase().trim())
  );

  return (
    <div className="zd-modal-backdrop" onClick={handleAttemptClose} role="dialog" aria-modal="true" aria-labelledby="add-client-modal-title">
      <div
        className="zd-modal-card zd-glass-card zd-add-client-modal-card"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        {/* Modal Header */}
        <div className="zd-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="zd-modal-icon-badge">
              <User size={18} color="#2563eb" />
            </div>
            <div>
              <h2 className="zd-modal-title" id="add-client-modal-title">
                Add Client & Create Document
              </h2>
              <p className="zd-modal-sub">
                Register a new client entity and initialize the statutory drafting workflow.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="zd-modal-close-btn"
            onClick={handleAttemptClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="zd-add-client-form" noValidate>
          <div className="zd-add-client-form-body">
            {/* Partial Failure Warning Banner with Safe Retry */}
            {submitError && (
              <div className="zd-modal-alert zd-modal-alert--warning" style={{ marginBottom: 16 }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                    {retrySavedClientId ? 'Client Record Saved – Draft Creation Pending' : 'Submission Alert'}
                  </strong>
                  <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45 }}>{submitError}</p>
                  {retrySavedClientId && (
                    <button
                      type="button"
                      className="zd-btn-action zd-btn-action--primary"
                      style={{ height: 32, fontSize: 12, marginTop: 8, padding: '0 12px' }}
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      <RefreshCw size={13} className={isSubmitting ? 'spinning' : ''} />
                      <span>Retry Draft Creation Only</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* =========================================================================
              DOCUMENT TEMPLATE DROPDOWN (Searchable, published templates)
             ========================================================================= */}
          <div className="zd-form-field zd-template-field">
            <label htmlFor="select-document-template" className="zd-form-label">
              Document Template <span className="zd-required-star">*</span>
            </label>
            <GlassSelect
              id="select-document-template"
              options={templates.map((tpl) => ({
                value: tpl.id,
                label: tpl.name,
                category: tpl.category,
                code: tpl.code,
                description: tpl.description,
                raw: tpl
              }))}
              value={selectedTemplateId}
              onChange={(val, opt) => handleSelectTemplate(opt?.raw || templates.find((t) => t.id === val))}
              placeholder="Select a document template"
              searchable={true}
              searchPlaceholder="Search templates by title, code or category…"
              isLoading={templatesLoading}
              loadingText="Loading published document templates…"
              error={templatesError}
              hasError={Boolean(errors.template)}
              disabled={templatesLoading}
            />
            {errors.template && <div className="zd-field-error-text">{errors.template}</div>}
          </div>

          {/* =========================================================================
              BASIC CLIENT DETAILS (2 Columns Desktop, 1 Column Mobile)
             ========================================================================= */}
          <div className="zd-form-section-title">Client Entity & Contact Details</div>

          <div className="zd-form-grid-2">
            {/* Aadhaar Number (Replaces Client Entity Type Selector) */}
            <div className="zd-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label htmlFor="input-aadhaar" className="zd-form-label" style={{ marginBottom: 0 }}>
                  Aadhaar Number
                  {selectedTemplate?.requiresAadhaar && <span className="zd-required-star"> *</span>}
                </label>
                <span className="zd-field-subtext-badge">
                  {selectedTemplate?.requiresAadhaar ? 'Required by Template' : 'Optional'}
                </span>
              </div>
              <div className="zd-aadhaar-input-wrap">
                <input
                  id="input-aadhaar"
                  type={showAadhaar ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="off"
                  className={`zd-form-input zd-aadhaar-input ${errors.aadhaar ? 'is-invalid' : ''}`}
                  placeholder="Enter 12-digit Aadhaar number"
                  value={formatAadhaar(aadhaar)}
                  onChange={handleAadhaarChange}
                  onBlur={() => validateAadhaar(aadhaar)}
                  maxLength={14}
                />
                <button
                  type="button"
                  className="zd-aadhaar-eye-btn"
                  onClick={() => setShowAadhaar(!showAadhaar)}
                  aria-label={showAadhaar ? 'Hide Aadhaar number' : 'Show Aadhaar number'}
                >
                  {showAadhaar ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.aadhaar && <div className="zd-field-error-text">{errors.aadhaar}</div>}
              <span className="zd-field-hint" style={{ display: 'block', fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                Belongs to the primary contact person / authorized signatory, not the company.
              </span>
            </div>

            {/* Company / Entity Name */}
            <div className="zd-form-field">
              <label htmlFor="input-company-name" className="zd-form-label">
                Company / Entity Name
              </label>
              <input
                id="input-company-name"
                type="text"
                className={`zd-form-input ${errors.companyName ? 'is-invalid' : ''}`}
                placeholder="e.g. Acme Technologies Pvt Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              {errors.companyName && <div className="zd-field-error-text">{errors.companyName}</div>}
            </div>

            {/* Contact Person / Full Name */}
            <div className="zd-form-field">
              <label htmlFor="input-contact-person" className="zd-form-label">
                Primary Contact / Signatory Name <span className="zd-required-star">*</span>
              </label>
              <input
                id="input-contact-person"
                type="text"
                className={`zd-form-input ${errors.contactPerson ? 'is-invalid' : ''}`}
                placeholder="e.g. Arun Kumar"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
              {errors.contactPerson && <div className="zd-field-error-text">{errors.contactPerson}</div>}
            </div>

            {/* Mobile Number with Country Code */}
            <div className="zd-form-field">
              <label htmlFor="input-phone" className="zd-form-label">
                Mobile Number <span className="zd-required-star">*</span>
              </label>
              <div className="zd-phone-input-group">
                <select
                  className="zd-country-code-select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  aria-label="Country calling code"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+65">🇸🇬 +65</option>
                </select>
                <input
                  id="input-phone"
                  type="tel"
                  className={`zd-form-input ${errors.phone ? 'is-invalid' : ''}`}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                />
              </div>
              {errors.phone && <div className="zd-field-error-text">{errors.phone}</div>}
            </div>

            {/* Email Address */}
            <div className="zd-form-field">
              <label htmlFor="input-email" className="zd-form-label">
                Email Address{' '}
                {selectedTemplate?.requiresEmail ? (
                  <span className="zd-required-star">* (Required for {selectedTemplate.code})</span>
                ) : (
                  <span className="zd-optional-hint">(Optional)</span>
                )}
              </label>
              <input
                id="input-email"
                type="email"
                className={`zd-form-input ${errors.email ? 'is-invalid' : ''}`}
                placeholder="e.g. director@entity.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <div className="zd-field-error-text">{errors.email}</div>}
            </div>
          </div>

          {/* =========================================================================
              DYNAMIC EXTRA FIELDS ("Add More" button & list of added details)
             ========================================================================= */}
          <div className="zd-extra-fields-section">
            <div className="zd-extra-fields-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="zd-form-label" style={{ margin: 0 }}>Additional Details</span>
                <span className="zd-section-sub" style={{ margin: 0 }}>
                  Optional contact numbers, alternate emails, or custom practice fields
                </span>
              </div>
              <button
                type="button"
                id="btn-add-more-details"
                className="zd-btn-add-more"
                onClick={handleOpenAddFieldDialog}
              >
                <Plus size={14} aria-hidden="true" />
                <span>Add More</span>
              </button>
            </div>

            {additionalFields.length > 0 && (
              <div className="zd-extra-fields-list">
                {additionalFields.map((field) => (
                  <div key={field.id} className="zd-extra-field-card">
                    <div className="zd-extra-field-content">
                      <span className="zd-extra-field-label">{field.label}</span>
                      <span className="zd-extra-field-value">{field.value}</span>
                    </div>
                    <div className="zd-extra-field-actions">
                      <button
                        type="button"
                        className="zd-btn-field-icon"
                        onClick={() => handleOpenEditFieldDialog(field)}
                        title={`Edit ${field.label}`}
                        aria-label={`Edit ${field.label}`}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="zd-btn-field-icon zd-btn-field-icon--danger"
                        onClick={() => handleRemoveField(field.id)}
                        title={`Remove ${field.label}`}
                        aria-label={`Remove ${field.label}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =========================================================================
              TEMPLATE-SPECIFIC MANDATORY DETAILS (Separate and visible)
             ========================================================================= */}
          {selectedTemplate && selectedTemplate.fields && selectedTemplate.fields.length > 0 && (
            <div className="zd-template-specific-box">
              <div className="zd-form-section-title" style={{ marginTop: 0 }}>
                {selectedTemplate.name} – Statutory Requirements
              </div>
              <p className="zd-section-sub">
                Mandatory schema fields required for {selectedTemplate.category} generation:
              </p>

              <div className="zd-form-grid-2">
                {selectedTemplate.fields.map((field) => {
                  const hasErr = Boolean(errors[field.id]);
                  return (
                    <div key={field.id} className="zd-form-field">
                      <label htmlFor={`field-${field.id}`} className="zd-form-label">
                        {field.label} {field.required && <span className="zd-required-star">*</span>}
                      </label>
                      <input
                        id={`field-${field.id}`}
                        type={field.type || 'text'}
                        className={`zd-form-input ${hasErr ? 'is-invalid' : ''}`}
                        placeholder={field.placeholder || ''}
                        value={templateFields[field.id] || ''}
                        onChange={(e) => {
                          const val = field.type === 'text' && (field.id === 'pan' || field.id === 'gstin' || field.id === 'cin' || field.id === 'llpin')
                            ? e.target.value.toUpperCase()
                            : e.target.value;
                          setTemplateFields((prev) => ({ ...prev, [field.id]: val }));
                        }}
                      />
                      {field.helpText && <span className="zd-field-help">{field.helpText}</span>}
                      {hasErr && <div className="zd-field-error-text">{errors[field.id]}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>

          {/* =========================================================================
              MODAL FOOTER ACTIONS (Cancel & Submit)
             ========================================================================= */}
          <div className="zd-modal-actions zd-add-client-footer">
            <button
              type="button"
              className="zd-btn-action zd-btn-action--secondary"
              onClick={handleAttemptClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="zd-btn-action zd-btn-action--primary"
              id="btn-add-client-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  <span>Saving Client & Initializing Draft…</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </button>
          </div>
        </form>

        {/* =========================================================================
            FIELD-ENTRY DIALOG (Small dialog above parent modal with z-index: 1200)
           ========================================================================= */}
        {isFieldDialogOpen && (
          <div
            className="zd-field-dialog-overlay"
            onClick={() => setIsFieldDialogOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="field-dialog-title"
          >
            <div
              className="zd-field-dialog-card zd-glass-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="zd-field-dialog-header">
                <div>
                  <h3 id="field-dialog-title" className="zd-field-dialog-title">
                    {editingFieldId ? 'Edit Detail' : 'Add Detail'}
                  </h3>
                  <p className="zd-field-dialog-sub">
                    Add custom phone numbers, emails, alternate contacts or IDs.
                  </p>
                </div>
                <button
                  type="button"
                  className="zd-modal-close-btn"
                  onClick={() => setIsFieldDialogOpen(false)}
                  aria-label="Close detail dialog"
                >
                  <X size={16} />
                </button>
              </div>

              {dialogError && (
                <div className="zd-modal-alert zd-modal-alert--error" style={{ marginBottom: 12, padding: '8px 12px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{dialogError}</span>
                </div>
              )}

              <div className="zd-field-dialog-form">
                <div className="zd-form-field">
                  <label htmlFor="input-dialog-field-name" className="zd-form-label">
                    Field name <span className="zd-required-star">*</span>
                  </label>
                  <input
                    ref={fieldNameInputRef}
                    id="input-dialog-field-name"
                    type="text"
                    className="zd-form-input"
                    placeholder="e.g. Alternate Phone Number, Additional Email, Second Contact Name"
                    value={dialogFieldName}
                    onChange={(e) => {
                      setDialogFieldName(e.target.value);
                      if (dialogError) setDialogError('');
                    }}
                  />
                </div>

                <div className="zd-form-field">
                  <label htmlFor="input-dialog-field-value" className="zd-form-label">
                    Value <span className="zd-required-star">*</span>
                  </label>
                  <input
                    id="input-dialog-field-value"
                    type="text"
                    className="zd-form-input"
                    placeholder="Enter the detail"
                    value={dialogFieldValue}
                    onChange={(e) => {
                      setDialogFieldValue(e.target.value);
                      if (dialogError) setDialogError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveFieldDialog();
                      }
                    }}
                  />
                </div>

                <div className="zd-field-dialog-actions">
                  <button
                    type="button"
                    className="zd-btn-action zd-btn-action--secondary"
                    style={{ height: 34, fontSize: 12.5 }}
                    onClick={() => setIsFieldDialogOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="btn-save-custom-field"
                    className="zd-btn-action zd-btn-action--primary"
                    style={{ height: 34, fontSize: 12.5 }}
                    onClick={handleSaveFieldDialog}
                  >
                    {editingFieldId ? 'Save' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Confirmation Dialog */}
        {showDiscardConfirm && (
          <div className="zd-discard-confirm-overlay">
            <div className="zd-discard-confirm-dialog zd-glass-card">
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>
                Discard Unsaved Client Details?
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
                You have unsaved changes in the client creation form. If you close now, your entered details will be lost.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--secondary"
                  style={{ height: 36, fontSize: 12.5 }}
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  className="zd-btn-action zd-btn-action--primary"
                  style={{ height: 36, fontSize: 12.5, background: '#dc2626' }}
                  onClick={resetAndClose}
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
