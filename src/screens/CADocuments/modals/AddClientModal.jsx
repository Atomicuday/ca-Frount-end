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
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { caTemplateService } from '../../../services/api/caTemplateService.js';
import { caClientService } from '../../../services/api/caClientService.js';
import GlassSelect from '../../../components/common/GlassSelect.jsx';

export default function AddClientModal({ isOpen, onClose, onClientCreated }) {
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

  // Submission & Feedback
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submissionFeedback, setSubmissionFeedback] = useState(null);

  const modalRef = useRef(null);

  // Selected template object
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  const resetAndClose = useCallback(() => {
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
    setSubmissionFeedback(null);
    onClose();
  }, [onClose]);

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
          // Do not automatically select the first template for a new form
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

  // Handle template selection: updates template ID, populates defaults, and purges stale fields
  const handleSelectTemplate = (template) => {
    if (!template) {
      setSelectedTemplateId('');
      setTemplateFields({});
      return;
    }
    setSelectedTemplateId(template.id);
    if (errors.template) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.template;
        return next;
      });
    }

    // Populate defaults from new template schema and exclude stale fields from previous template
    const newFields = {};
    if (template.fields) {
      template.fields.forEach((f) => {
        if (f.defaultValue) {
          newFields[f.id] = f.defaultValue;
        }
      });
    }
    setTemplateFields(newFields);
  };

  // Handle outside click for custom template dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target)) {
        setTemplateDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [templateDropdownOpen]);

  // Keyboard accessibility: Escape handling
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        if (isFieldDialogOpen) {
          setIsFieldDialogOpen(false);
        } else if (templateDropdownOpen) {
          setTemplateDropdownOpen(false);
        } else {
          resetAndClose();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFieldDialogOpen, templateDropdownOpen, resetAndClose]);

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
    setTimeout(() => fieldNameInputRef.current?.focus(), 60);
  };

  // Open dialog to edit existing extra field
  const handleOpenEditFieldDialog = (field) => {
    setEditingFieldId(field.id);
    setDialogFieldName(field.label);
    setDialogFieldValue(field.value);
    setDialogError('');
    setIsFieldDialogOpen(true);
    setTimeout(() => fieldNameInputRef.current?.focus(), 60);
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
        prev.map((f) => (f.id === editingFieldId ? { ...f, label: trimmedName, value: trimmedVal } : f))
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

  const handleRemoveField = (fieldId) => {
    setAdditionalFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  // Form Validation
  const validateForm = () => {
    const errs = {};

    if (!selectedTemplateId) {
      errs.template = 'Please select a document template.';
    }

    if (!contactPerson.trim() || contactPerson.trim().length < 2) {
      errs.contactPerson = 'Primary contact name is required.';
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Valid 10-digit mobile number is required.';
    }

    // Aadhaar format validation: optional unless template requires it
    const cleanAadhaar = normalizeAadhaar(aadhaar);
    if (selectedTemplate?.requiresAadhaar) {
      if (!cleanAadhaar || cleanAadhaar.length !== 12) {
        errs.aadhaar = `${selectedTemplate.name} requires a 12-digit Aadhaar number for statutory execution.`;
      }
    } else if (cleanAadhaar.length > 0 && cleanAadhaar.length !== 12) {
      errs.aadhaar = 'Aadhaar number must be exactly 12 digits.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (selectedTemplate?.requiresEmail) {
      if (!email.trim() || !emailRegex.test(email.trim())) {
        errs.email = `${selectedTemplate.name} requires a valid registered email address.`;
      }
    } else if (email.trim() && !emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

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

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit Handler: Saves client, creates linked draft, requests WhatsApp review invitation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmissionFeedback(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const cleanAadhaar = normalizeAadhaar(aadhaar);
      const clientPayload = {
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
        templateFields: cleanTemplateFields
      });

      if (result.success) {
        setSubmissionFeedback({
          savedState: result.savedState,
          notificationState: result.notificationState,
          document: result.document
        });

        if (onClientCreated) {
          onClientCreated(result);
        }

        setTimeout(() => {
          resetAndClose();
        }, 1600);
      } else {
        setSubmitError(result.error || 'Failed to save client and initialize draft.');
      }
    } catch (err) {
      console.error('AddClient submission error:', err);
      setSubmitError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(templateSearchTerm.toLowerCase().trim()) ||
      t.category.toLowerCase().includes(templateSearchTerm.toLowerCase().trim()) ||
      t.code.toLowerCase().includes(templateSearchTerm.toLowerCase().trim())
  );

  return (
    <div className="zd-modal-backdrop" onClick={resetAndClose} role="dialog" aria-modal="true" aria-labelledby="add-client-modal-title">
      <div className="zd-modal-card zd-glass-card zd-add-client-modal-card" onClick={(e) => e.stopPropagation()} ref={modalRef}>
        {/* Header */}
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
                Select a template, enter contact details, and initialize statutory draft review.
              </p>
            </div>
          </div>
          <button type="button" className="zd-modal-close-btn" onClick={resetAndClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="zd-add-client-form">
          <div className="zd-add-client-form-body">
            {submitError && (
              <div className="zd-modal-alert zd-modal-alert--error" style={{ marginBottom: 14 }}>
                <AlertCircle size={16} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Separate Saved State and Notification Delivery State Feedback */}
            {submissionFeedback && (
              <div className="zd-submission-success-banner" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 600 }}>
                  <Check size={16} />
                  <span>{submissionFeedback.savedState}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: submissionFeedback.notificationState?.sent ? '#0284c7' : '#d97706', fontSize: 12.5, marginTop: 4 }}>
                  <MessageCircle size={14} />
                  <span>
                    {submissionFeedback.notificationState?.sent
                      ? submissionFeedback.notificationState.message
                      : `Notification status: ${submissionFeedback.notificationState?.error || 'Pending delivery'}`}
                  </span>
                </div>
              </div>
            )}

            {/* SECTION 1: Document Template Dropdown */}
          <div className="zd-form-field">
            <label htmlFor="select-document-template" className="zd-form-label">
              Select Document Template <span className="zd-required-star">*</span>
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
              searchPlaceholder="Search templates by name, code or category…"
              isLoading={templatesLoading}
              loadingText="Loading published templates…"
              error={templatesError}
              hasError={Boolean(errors.template)}
              disabled={templatesLoading}
            />
            {errors.template && <span className="zd-field-error">{errors.template}</span>}
          </div>

          {/* SECTION 2: Aadhaar Number Field (Replaces Client Entity Type Selector) */}
          <div className="zd-form-field" style={{ marginTop: 6 }}>
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
                className={`zd-form-input zd-aadhaar-input ${errors.aadhaar ? 'error' : ''}`}
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
            {errors.aadhaar && <span className="zd-field-error">{errors.aadhaar}</span>}
            <span className="zd-field-hint" style={{ display: 'block', fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
              Belongs to the primary contact person / authorized signatory, not the company.
            </span>
          </div>

          {/* SECTION 3: Basic Contact Information */}
          <div className="zd-form-grid-2">
            <div className="zd-form-field">
              <label htmlFor="input-company-name" className="zd-form-label">
                Company / Entity Name
              </label>
              <input
                id="input-company-name"
                type="text"
                className={`zd-form-input ${errors.companyName ? 'error' : ''}`}
                placeholder="e.g. Acme Technologies Pvt Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              {errors.companyName && <span className="zd-field-error">{errors.companyName}</span>}
            </div>

            <div className="zd-form-field">
              <label htmlFor="input-contact-person" className="zd-form-label">
                Primary Contact Person <span className="zd-required-star">*</span>
              </label>
              <input
                id="input-contact-person"
                type="text"
                className={`zd-form-input ${errors.contactPerson ? 'error' : ''}`}
                placeholder="e.g. Arun Kumar"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
              />
              {errors.contactPerson && <span className="zd-field-error">{errors.contactPerson}</span>}
            </div>

            <div className="zd-form-field">
              <label htmlFor="input-phone" className="zd-form-label">
                Mobile Number (for WhatsApp Draft Link) <span className="zd-required-star">*</span>
              </label>
              <div className="zd-phone-input-group">
                <span className="zd-phone-prefix">{countryCode}</span>
                <input
                  id="input-phone"
                  type="tel"
                  className={`zd-form-input zd-phone-field ${errors.phone ? 'error' : ''}`}
                  placeholder="98860 11223"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              {errors.phone && <span className="zd-field-error">{errors.phone}</span>}
            </div>

            <div className="zd-form-field">
              <label htmlFor="input-email" className="zd-form-label">
                Official Email Address
              </label>
              <input
                id="input-email"
                type="email"
                className={`zd-form-input ${errors.email ? 'error' : ''}`}
                placeholder="arun@acmetech.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <span className="zd-field-error">{errors.email}</span>}
            </div>
          </div>

          {/* Dynamic Extra Fields List */}
          {additionalFields.length > 0 && (
            <div className="zd-extra-fields-container" style={{ marginTop: 10 }}>
              <span className="zd-extra-fields-heading">Additional Contact Details</span>
              <div className="zd-extra-fields-list">
                {additionalFields.map((field) => (
                  <div key={field.id} className="zd-extra-field-row">
                    <div className="zd-extra-field-content">
                      <span className="zd-extra-field-label">{field.label}:</span>
                      <strong className="zd-extra-field-value">{field.value}</strong>
                    </div>
                    <div className="zd-extra-field-actions">
                      <button
                        type="button"
                        className="zd-extra-action-btn"
                        onClick={() => handleOpenEditFieldDialog(field)}
                        title={`Edit ${field.label}`}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="zd-extra-action-btn zd-extra-action-btn--delete"
                        onClick={() => handleRemoveField(field.id)}
                        title={`Remove ${field.label}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add More Button */}
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              className="zd-btn-action zd-btn-action--secondary"
              id="btn-add-more-fields"
              onClick={handleOpenAddFieldDialog}
              style={{ fontSize: 12.5, height: 34, gap: 6 }}
            >
              <Plus size={14} />
              <span>Add More Details</span>
            </button>
          </div>

          {/* SECTION 4: Template-Specific Fields */}
          {selectedTemplate && selectedTemplate.fields && selectedTemplate.fields.length > 0 && (
            <div className="zd-template-schema-section" style={{ marginTop: 16 }}>
              <span className="zd-section-label">
                Required Fields for {selectedTemplate.name}
              </span>
              <div className="zd-form-grid-2" style={{ marginTop: 8 }}>
                {selectedTemplate.fields.map((field) => (
                  <div key={field.id} className="zd-form-field">
                    <label htmlFor={`field-${field.id}`} className="zd-form-label">
                      {field.label} {field.required && <span className="zd-required-star">*</span>}
                    </label>
                    <input
                      id={`field-${field.id}`}
                      type="text"
                      className={`zd-form-input ${errors[field.id] ? 'error' : ''}`}
                      placeholder={field.placeholder || `Enter ${field.label}`}
                      value={templateFields[field.id] || ''}
                      onChange={(e) =>
                        setTemplateFields({
                          ...templateFields,
                          [field.id]: e.target.value
                        })
                      }
                    />
                    {errors[field.id] && <span className="zd-field-error">{errors[field.id]}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* Fixed/Accessible Footer Actions */}
          <div className="zd-modal-actions zd-add-client-footer">
            <button type="button" className="zd-btn-action zd-btn-action--secondary" onClick={resetAndClose}>
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-add-client"
              className="zd-btn-action zd-btn-action--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="spinning" />
                  <span>Initializing Draft & Dispatching…</span>
                </>
              ) : (
                <span>Save Client & Create Draft</span>
              )}
            </button>
          </div>
        </form>

        {/* Small Dialog for "Add More" Field Entry */}
        {isFieldDialogOpen && (
          <div className="zd-submodal-backdrop" onClick={() => setIsFieldDialogOpen(false)}>
            <div className="zd-submodal-card zd-glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="zd-submodal-header">
                <h3 className="zd-submodal-title">{editingFieldId ? 'Edit Detail' : 'Add Contact Detail'}</h3>
                <button
                  type="button"
                  className="zd-modal-close-btn"
                  onClick={() => setIsFieldDialogOpen(false)}
                  aria-label="Close dialog"
                >
                  <X size={16} />
                </button>
              </div>

              {dialogError && (
                <div className="zd-modal-alert zd-modal-alert--error" style={{ marginBottom: 12 }}>
                  <AlertCircle size={14} />
                  <span>{dialogError}</span>
                </div>
              )}

              <form onSubmit={handleSaveFieldDialog}>
                <div className="zd-form-field">
                  <label htmlFor="input-dialog-field-name" className="zd-form-label">
                    Field Name <span className="zd-required-star">*</span>
                  </label>
                  <input
                    ref={fieldNameInputRef}
                    id="input-dialog-field-name"
                    type="text"
                    className="zd-form-input"
                    placeholder="e.g. Alternate Phone Number, Additional Email, Second Contact Name"
                    value={dialogFieldName}
                    onChange={(e) => setDialogFieldName(e.target.value)}
                  />
                </div>

                <div className="zd-form-field" style={{ marginTop: 10 }}>
                  <label htmlFor="input-dialog-field-value" className="zd-form-label">
                    Value <span className="zd-required-star">*</span>
                  </label>
                  <input
                    id="input-dialog-field-value"
                    type="text"
                    className="zd-form-input"
                    placeholder="Enter the detail"
                    value={dialogFieldValue}
                    onChange={(e) => setDialogFieldValue(e.target.value)}
                  />
                </div>

                <div className="zd-modal-actions" style={{ marginTop: 16 }}>
                  <button
                    type="button"
                    className="zd-btn-action zd-btn-action--secondary"
                    onClick={() => setIsFieldDialogOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" id="btn-save-extra-field" className="zd-btn-action zd-btn-action--primary">
                    {editingFieldId ? 'Save Changes' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
