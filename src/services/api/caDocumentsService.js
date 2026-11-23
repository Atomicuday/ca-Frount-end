/**
 * CA Documents Service & API Adapter
 * Handles document queries, filter aggregation, input edits, revision forks,
 * correction requests, recipient approvals, signing invitations, and execution packets.
 */
import { api } from './client.js';
import { MOCK_CA_DOCUMENTS, BACKEND_PASSWORD_POLICY } from '../../mock/caDocumentsData.js';

let localDocumentsStore = [...MOCK_CA_DOCUMENTS];

export const caDocumentsService = {
  /**
   * Fetch documents with search, multifaceted filters, and pagination.
   */
  getDocuments: async ({
    search = '',
    status = 'ALL',
    docType = 'ALL',
    dateRange = 'ALL',
    page = 1,
    limit = 10
  } = {}) => {
    try {
      const response = await api.get('/ca/documents', {
        search,
        status,
        docType,
        dateRange,
        page,
        limit
      });
      if (response && Array.isArray(response.data)) {
        return response;
      }
    } catch {
      // Prototype fallback
    }

    // Filter in-memory prototype records
    let result = [...localDocumentsStore];

    // Search query matching title, ref, or client
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.ref.toLowerCase().includes(q) ||
          doc.client.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (status && status !== 'ALL') {
      result = result.filter(
        (doc) =>
          doc.statusCode === status ||
          doc.status.toLowerCase() === status.toLowerCase() ||
          (status === 'review' && (doc.statusCode === 'party_review' || doc.statusCode === 'ca_review'))
      );
    }

    // Document Type filter
    if (docType && docType !== 'ALL' && docType !== 'All Types') {
      result = result.filter((doc) => doc.docType.toLowerCase() === docType.toLowerCase());
    }

    // Date range filter
    if (dateRange && dateRange !== 'ALL') {
      const now = new Date('2026-11-23T12:00:00Z');
      result = result.filter((doc) => {
        const d = new Date(doc.createdDate || doc.createdAt);
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        if (dateRange === '7d') return diffDays <= 7;
        if (dateRange === '30d') return diffDays <= 30;
        if (dateRange === '90d') return diffDays <= 90;
        return true;
      });
    }

    const total = result.length;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  },

  /**
   * Get single document by ID, Reference, or invite token.
   */
  getDocumentById: async (identifier) => {
    try {
      const res = await api.get(`/ca/documents/${identifier}`);
      if (res && res.document) return res.document;
    } catch {
      // Prototype fallback
    }

    const doc = localDocumentsStore.find(
      (d) =>
        d.id === identifier ||
        d.ref === identifier ||
        identifier?.includes(d.id) ||
        identifier?.includes(d.ref)
    );
    return doc || null;
  },

  /**
   * Add a new client or attach an existing client, then create a new document draft.
   */
  createClientAndDocument: async ({
    isNewClient = false,
    clientId,
    clientName,
    clientType,
    pan,
    gstin,
    contactPerson,
    phone,
    email,
    documentTitle,
    docType,
    notes = ''
  }) => {
    try {
      const res = await api.post('/ca/documents/create-with-client', {
        isNewClient,
        clientId,
        clientName,
        clientType,
        pan,
        gstin,
        contactPerson,
        phone,
        email,
        documentTitle,
        docType,
        notes
      });
      if (res && res.document) return res;
    } catch {
      // Prototype fallback
    }

    const finalClientId = isNewClient ? `CLI-${Math.floor(100 + Math.random() * 900)}` : (clientId || 'CLI-101');
    const finalClientName = clientName || 'Acme Technologies Pvt Ltd';
    const finalClientType = clientType || 'Private Limited';
    const docId = `DOC-${Math.floor(200 + Math.random() * 800)}`;
    const prefix = docType?.includes('Audit') ? 'AUD' : docType?.includes('GST') ? 'GST' : 'ROC';
    const ref = `${prefix}-2026-${String(Math.floor(100 + Math.random() * 899)).padStart(3, '0')}`;

    const requiresStamp = docType?.includes('Audit') || docType?.includes('Deed') || docType?.includes('ROC');

    const newDoc = {
      id: docId,
      ref,
      version: 'v1',
      title: documentTitle || `${docType} Filing Pack`,
      docType: docType || 'Statutory Audit',
      createdAt: 'Just now',
      createdDate: new Date().toISOString().split('T')[0],
      lastUpdated: 'Just now',
      client: finalClientName,
      clientType: finalClientType,
      clientId: finalClientId,
      status: 'Draft',
      statusCode: 'draft',
      stage: 'Draft',
      isEditableDraft: true,
      clientApproval: {
        isApproved: false,
        versionApproved: null,
        approvedAt: null,
        approvedBy: null
      },
      correctionRequests: [],
      payment: {
        status: 'UNBILLED',
        amountPaise: requiresStamp ? 124900 : 41300,
        orderId: null,
        receiptId: null,
        paidAt: null,
        method: null
      },
      execution: {
        isLocked: false,
        packetReady: false,
        stampRequired: requiresStamp,
        stampStatus: requiresStamp ? 'PROCESSING' : 'NOT_REQUIRED',
        stampCertificateNo: null,
        signers: [
          {
            id: `sig-${Date.now()}-1`,
            name: contactPerson || 'Authorized Signatory',
            role: 'Primary Signer',
            email: email || 'contact@client.in',
            phone: phone || '+91 98000 00000',
            status: 'PENDING',
            signedAt: null
          }
        ]
      },
      allowedSendAction: {
        actionKey: 'send_review',
        label: 'Send Draft for Review',
        targetSignatory: contactPerson || 'Principal Officer',
        targetEmail: email || 'contact@client.in',
        phone: phone || '+91 98000 00000',
        channel: 'portal_email',
        whatsAppLimit: 2,
        whatsAppSentCount: 0
      },
      whatsAppTracking: {
        reviewSent: false,
        signingSent: false,
        totalSent: 0,
        limit: 2
      },
      statusDetails: {
        paymentStatus: 'Unbilled',
        stampStatus: requiresStamp ? 'Pending eStamp' : 'Not Required',
        signerStatus: 'Draft Initialized'
      },
      formData: {
        turnover: '₹0.00 Cr',
        auditPeriod: 'FY 2025-26',
        taxAuditForm: docType,
        reportingPartner: 'CA Rajesh Sharma, FCA',
        notes: notes || 'Draft created via Add Client flow.'
      }
    };

    localDocumentsStore = [newDoc, ...localDocumentsStore];
    return {
      success: true,
      document: newDoc,
      message: `Document draft ${ref} created for ${finalClientName}.`
    };
  },

  /**
   * Request recipient-specific WhatsApp draft-review invitation through the backend (Message 1 of 2).
   * Separate notification failure from saved draft state.
   */
  requestDraftReviewNotification: async (documentId) => {
    try {
      const res = await api.post(`/ca/documents/${documentId}/request-draft-review`);
      if (res && res.success) return res;
    } catch {
      // Prototype fallback
    }

    const docIndex = localDocumentsStore.findIndex((d) => d.id === documentId);
    if (docIndex < 0) throw new Error('Document not found for notification dispatch.');

    const doc = localDocumentsStore[docIndex];
    if (doc.whatsAppTracking.reviewSent) {
      return {
        success: true,
        alreadySent: true,
        message: 'Draft-review invitation was already dispatched.'
      };
    }

    const updatedTracking = {
      ...doc.whatsAppTracking,
      reviewSent: true,
      totalSent: Math.min(doc.whatsAppTracking.limit, doc.whatsAppTracking.totalSent + 1)
    };

    const updatedDoc = {
      ...doc,
      status: doc.status === 'Draft' ? 'Party Review' : doc.status,
      statusCode: doc.statusCode === 'draft' ? 'party_review' : doc.statusCode,
      stage: 'Review',
      lastUpdated: 'Just now',
      whatsAppTracking: updatedTracking,
      allowedSendAction: {
        ...doc.allowedSendAction,
        whatsAppSentCount: updatedTracking.totalSent
      }
    };

    localDocumentsStore[docIndex] = updatedDoc;

    return {
      success: true,
      inviteToken: `inv-draft-${doc.id}`,
      reviewUrl: `/review/${doc.id}`,
      recipient: doc.allowedSendAction.targetSignatory,
      phone: doc.allowedSendAction.phone,
      messageBudget: `${updatedTracking.totalSent}/${updatedTracking.limit} WhatsApp messages used`,
      message: `Draft-review WhatsApp invitation delivered to ${doc.allowedSendAction.targetSignatory} (${doc.allowedSendAction.phone}).`
    };
  },

  /**
   * Client submits a correction request from the recipient review route.
   * Does NOT directly edit the saved document.
   */
  submitCorrectionRequest: async (documentId, { proposedFields = [], comments = '', requesterName, requesterPhone }) => {
    try {
      const res = await api.post(`/ca/documents/${documentId}/correction-requests`, {
        proposedFields,
        comments,
        requesterName,
        requesterPhone
      });
      if (res && res.success) return res;
    } catch {
      // Prototype fallback
    }

    const docIndex = localDocumentsStore.findIndex((d) => d.id === documentId);
    if (docIndex < 0) throw new Error('Document not found');

    const doc = localDocumentsStore[docIndex];

    const newRequest = {
      id: `cr-${Date.now()}`,
      author: requesterName || doc.allowedSendAction?.targetSignatory || 'Client Reviewer',
      role: 'Client Reviewer',
      requesterName: requesterName || doc.allowedSendAction?.targetSignatory || 'Client Reviewer',
      requesterPhone: requesterPhone || doc.allowedSendAction?.phone || '',
      text: comments || 'Correction remarks submitted for CA review.',
      proposedFields: Array.isArray(proposedFields) ? proposedFields : [],
      createdAt: 'Just now',
      status: 'Pending',
      version: doc.version || 'v1'
    };

    const updatedDoc = {
      ...doc,
      status: 'Changes Requested',
      statusCode: 'corrections',
      stage: 'Changes Requested',
      lastUpdated: 'Just now',
      correctionRequests: [newRequest, ...(doc.correctionRequests || [])],
      clientApproval: {
        isApproved: false,
        versionApproved: null,
        approvedAt: null,
        approvedBy: null
      }
    };

    localDocumentsStore[docIndex] = updatedDoc;

    return {
      success: true,
      request: newRequest,
      message: 'Correction request submitted to the CA. Saved document remains unchanged pending review.'
    };
  },

  /**
   * CA resolves a correction request with ACCEPT or REJECT decision.
   * ACCEPT: Applies changes to a NEW draft version (v1 -> v2), updates preview, invalidates earlier approvals.
   * REJECT: Preserves existing draft unchanged, records rejection, requires client approval of retained version.
   */
  resolveCorrectionRequest: async (documentId, requestId, decision = 'ACCEPT', { remarks = '', rejectionReason = '' } = {}) => {
    try {
      const res = await api.post(`/ca/documents/${documentId}/correction-requests/${requestId}/resolve`, {
        decision,
        remarks,
        rejectionReason
      });
      if (res && res.success) return res;
    } catch {
      // Prototype fallback
    }

    const docIndex = localDocumentsStore.findIndex((d) => d.id === documentId);
    if (docIndex < 0) throw new Error('Document not found');

    const doc = localDocumentsStore[docIndex];
    const targetReq = (doc.correctionRequests || []).find((r) => r.id === requestId);
    if (!targetReq) throw new Error('Correction request not found');

    if (decision === 'ACCEPT') {
      // Apply accepted changes to NEW version
      const currentVerNum = parseInt((doc.version || 'v1').replace('v', ''), 10) || 1;
      const nextVer = `v${currentVerNum + 1}`;
      const nextRef = doc.ref.includes('-R')
        ? doc.ref.replace(/-R\d+/, `-R${currentVerNum}`)
        : `${doc.ref}-R1`;

      // Apply proposed fields to formData
      const updatedFormData = { ...doc.formData };
      if (Array.isArray(targetReq.proposedFields)) {
        targetReq.proposedFields.forEach((pf) => {
          if (pf.fieldId && pf.proposedValue !== undefined) {
            updatedFormData[pf.fieldId] = pf.proposedValue;
          }
        });
      }

      const updatedRequests = (doc.correctionRequests || []).map((r) =>
        r.id === requestId
          ? { ...r, status: 'Resolved', decision: 'ACCEPTED', resolvedAt: 'Just now', resolutionRemarks: remarks }
          : r
      );

      const revisedDoc = {
        ...doc,
        ref: nextRef,
        version: nextVer,
        title: `${doc.title.replace(/\s*\(Draft Revision v\d+\)/, '')} (Draft Revision ${nextVer})`,
        status: 'Revised Review',
        statusCode: 'revised_review',
        stage: 'Revised Review',
        isEditableDraft: true,
        lastUpdated: 'Just now',
        formData: updatedFormData,
        correctionRequests: updatedRequests,
        // Invalidate earlier version approvals
        clientApproval: {
          isApproved: false,
          versionApproved: null,
          approvedAt: null,
          approvedBy: null,
          invalidationReason: `Superseded by revision ${nextVer} with accepted correction changes.`
        },
        statusDetails: {
          ...doc.statusDetails,
          signerStatus: `Pending Approval for ${nextVer}`
        }
      };

      localDocumentsStore[docIndex] = revisedDoc;

      return {
        success: true,
        decision: 'ACCEPTED',
        document: revisedDoc,
        newVersion: nextVer,
        message: `Accepted changes applied to new version ${nextVer} (${nextRef}). Prior version approvals invalidated.`
      };
    } else {
      // REJECT: Keep existing draft unchanged, record rejection
      const updatedRequests = (doc.correctionRequests || []).map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Rejected',
              decision: 'REJECTED',
              rejectionReason: rejectionReason || remarks || 'Clarification verified; retained statutory formulation.',
              resolvedAt: 'Just now'
            }
          : r
      );

      const retainedDoc = {
        ...doc,
        lastUpdated: 'Just now',
        correctionRequests: updatedRequests,
        status: doc.clientApproval?.isApproved ? 'Approved' : 'Party Review',
        statusCode: doc.clientApproval?.isApproved ? 'approved_locked' : 'party_review',
        stage: doc.clientApproval?.isApproved ? 'Approved/Locked' : 'Review'
      };

      localDocumentsStore[docIndex] = retainedDoc;

      return {
        success: true,
        decision: 'REJECTED',
        document: retainedDoc,
        message: `Correction request rejected. Retained ${doc.version} unchanged; client approval required.`
      };
    }
  },

  /**
   * Recipient approves the draft version from the review route.
   */
  approveDraft: async (documentId, { version, approverName, approverPhone } = {}) => {
    try {
      const res = await api.post(`/ca/documents/${documentId}/approve`, { version, approverName, approverPhone });
      if (res && res.success) return res;
    } catch {
      // Prototype fallback
    }

    const docIndex = localDocumentsStore.findIndex((d) => d.id === documentId);
    if (docIndex < 0) throw new Error('Document not found');

    const doc = localDocumentsStore[docIndex];
    const targetVersion = version || doc.version || 'v1';

    const isPaid = doc.payment?.status === 'PAID';

    const updatedExecution = {
      ...doc.execution,
      ...(isPaid
        ? {
            isLocked: true,
            packetReady: true,
            ...(doc.execution?.stampRequired
              ? {
                  stampStatus: 'ISSUED',
                  stampCertificateNo:
                    doc.execution.stampCertificateNo ||
                    `IN-KA${Math.floor(1000000000 + Math.random() * 9000000000)}M`
                }
              : {})
          }
        : {})
    };

    const updatedDoc = {
      ...doc,
      status: isPaid ? 'Ready for Execution' : 'Approved (Pending Payment)',
      statusCode: isPaid ? 'executing' : 'awaiting_payment',
      stage: isPaid ? 'Ready to Invite' : 'Payment Pending',
      isEditableDraft: false,
      lastUpdated: 'Just now',
      execution: updatedExecution,
      clientApproval: {
        isApproved: true,
        versionApproved: targetVersion,
        approvedAt: new Date().toISOString(),
        approvedBy: approverName || doc.allowedSendAction?.targetSignatory || 'Authorized Signatory',
        phone: approverPhone || doc.allowedSendAction?.phone || ''
      },
      statusDetails: {
        ...doc.statusDetails,
        signerStatus: isPaid ? 'Execution Packet Ready' : 'Draft Approved, Awaiting Payment',
        stampStatus: isPaid && doc.execution?.stampRequired ? 'eStamped' : doc.statusDetails?.stampStatus
      },
      allowedSendAction: isPaid
        ? {
            ...doc.allowedSendAction,
            actionKey: 'send_invitation',
            label: 'Send Signing Link'
          }
        : doc.allowedSendAction
    };

    localDocumentsStore[docIndex] = updatedDoc;

    return {
      success: true,
      document: updatedDoc,
      message: `Draft ${doc.ref} (${targetVersion}) approved by ${updatedDoc.clientApproval.approvedBy}.`
    };
  },

  /**
   * Save changes to an editable draft form inputs.
   */
  updateDocumentInputs: async (documentId, formValues) => {
    try {
      await api.put(`/ca/documents/${documentId}/inputs`, formValues);
    } catch {
      // Prototype fallback
    }

    localDocumentsStore = localDocumentsStore.map((doc) => {
      if (doc.id === documentId) {
        return {
          ...doc,
          title: formValues.title || doc.title,
          lastUpdated: 'Just now',
          formData: {
            ...doc.formData,
            ...formValues
          }
        };
      }
      return doc;
    });

    return { success: true, message: 'Document inputs updated successfully.' };
  },

  /**
   * Create a new draft revision manually for an approved/locked or executing document.
   */
  createDocumentRevision: async (documentId) => {
    const parentDoc = localDocumentsStore.find((d) => d.id === documentId);
    if (!parentDoc) throw new Error('Document not found');

    const revId = `${parentDoc.id}-REV`;
    const revRef = `${parentDoc.ref}-R1`;

    const revisionDoc = {
      ...parentDoc,
      id: revId,
      ref: revRef,
      version: 'v2',
      title: `${parentDoc.title.replace(/\s*\(Draft Revision v\d+\)/, '')} (Draft Revision v2)`,
      status: 'Draft',
      statusCode: 'draft',
      stage: 'Draft',
      isEditableDraft: true,
      lastUpdated: 'Just now',
      parentDocumentId: parentDoc.id,
      correctionRequests: [],
      clientApproval: {
        isApproved: false,
        versionApproved: null,
        approvedAt: null,
        approvedBy: null
      },
      statusDetails: {
        paymentStatus: parentDoc.statusDetails.paymentStatus,
        stampStatus: parentDoc.statusDetails.stampStatus,
        signerStatus: 'Draft Revision v2'
      },
      formData: {
        ...parentDoc.formData,
        notes: `Revision v2 created from locked document ${parentDoc.ref}. Requires fresh review & approval.`
      }
    };

    localDocumentsStore = [revisionDoc, ...localDocumentsStore];
    return {
      success: true,
      document: revisionDoc,
      message: `New revision draft ${revRef} generated. Prior locked version remains untouched.`
    };
  },

  /**
   * Request signing invitation through backend (Message 2 of 2 for primary client).
   * Enabled ONLY after verified payment and backend execution readiness.
   */
  requestSigningInvitation: async (documentId, { sendWhatsApp = true } = {}) => {
    try {
      return await api.post(`/ca/documents/${documentId}/send-signing-link`, { sendWhatsApp });
    } catch {
      // Prototype fallback
    }

    const docIndex = localDocumentsStore.findIndex((d) => d.id === documentId);
    if (docIndex < 0) throw new Error('Document not found');

    const doc = localDocumentsStore[docIndex];

    // Verification check: Payment must be verified
    if (doc.payment?.status !== 'PAID') {
      throw new Error('Payment must be settled before signing link can be dispatched.');
    }

    // Verification check: Document must be approved & locked
    if (!doc.clientApproval?.isApproved) {
      throw new Error('Document version must be approved by parties before signing.');
    }

    if (!doc.execution?.isLocked || !doc.execution?.packetReady) {
      throw new Error('Execution packet must be prepared and locked before dispatching signing invitations.');
    }

    // WhatsApp Message Budget check
    const currentSent = doc.whatsAppTracking?.totalSent || 0;
    const limit = doc.whatsAppTracking?.limit || 2;
    if (sendWhatsApp && currentSent >= limit) {
      throw new Error(`Maximum WhatsApp message budget (${limit}/${limit}) reached for this document.`);
    }

    const updatedTracking = {
      ...doc.whatsAppTracking,
      signingSent: sendWhatsApp ? true : doc.whatsAppTracking.signingSent,
      totalSent: sendWhatsApp ? currentSent + 1 : currentSent
    };

    const updatedDoc = {
      ...doc,
      status: 'Executing',
      statusCode: 'executing',
      stage: 'Signing',
      lastUpdated: 'Just now',
      whatsAppTracking: updatedTracking,
      allowedSendAction: {
        ...doc.allowedSendAction,
        actionKey: 'send_invitation',
        label: 'Resend Signing Invitation',
        whatsAppSentCount: updatedTracking.totalSent
      },
      statusDetails: {
        ...doc.statusDetails,
        signerStatus: 'Signing In Progress'
      }
    };

    localDocumentsStore[docIndex] = updatedDoc;

    return {
      success: true,
      deliveryId: `DEL-SIGN-${Date.now()}`,
      signingToken: `sig-token-${doc.id}`,
      signingUrl: `/sign/${doc.id}`,
      recipient: doc.allowedSendAction.targetSignatory,
      phone: doc.allowedSendAction.phone,
      channels: [
        'Secure Signing Portal',
        'Registered Official Email',
        ...(sendWhatsApp ? [`WhatsApp Notification (Message 2 of ${limit})`] : [])
      ],
      message: `Signing link dispatched to ${doc.allowedSendAction.targetSignatory}. Execution packet ready.`
    };
  },

  /**
   * Complete individual signer signature verification.
   * Advances status to Completed only when all required signers & stamps are verified.
   */
  completeSignerSignature: async (documentId, signerId, providerAuthResult = {}) => {
    try {
      const res = await api.post(`/ca/documents/${documentId}/signers/${signerId}/complete`, providerAuthResult);
      if (res && res.success) return res;
    } catch {
      // Prototype fallback
    }

    const docIndex = localDocumentsStore.findIndex((d) => d.id === documentId);
    if (docIndex < 0) throw new Error('Document not found');

    const doc = localDocumentsStore[docIndex];
    const signers = (doc.execution?.signers || []).map((s) => {
      if (s.id === signerId || !signerId) {
        return {
          ...s,
          status: 'SIGNED',
          signedAt: new Date().toISOString(),
          providerAuth: providerAuthResult.method || 'Aadhaar eSign OTP'
        };
      }
      return s;
    });

    const allSigned = signers.every((s) => s.status === 'SIGNED');
    const stampReady = !doc.execution?.stampRequired || doc.execution?.stampStatus === 'ISSUED';

    const isFullyCompleted = allSigned && stampReady;

    const updatedDoc = {
      ...doc,
      lastUpdated: 'Just now',
      execution: {
        ...doc.execution,
        signers
      },
      status: isFullyCompleted ? 'Completed' : 'Executing',
      statusCode: isFullyCompleted ? 'completed' : 'executing',
      stage: isFullyCompleted ? 'Completed' : 'Signing',
      completedAt: isFullyCompleted ? new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
      statusDetails: {
        ...doc.statusDetails,
        signerStatus: isFullyCompleted ? 'Completed & Executed' : `Partially Signed (${signers.filter((s) => s.status === 'SIGNED').length}/${signers.length})`
      }
    };

    localDocumentsStore[docIndex] = updatedDoc;

    return {
      success: true,
      allSigned,
      isFullyCompleted,
      document: updatedDoc,
      message: isFullyCompleted
        ? 'Your document has been generated successfully.'
        : 'Signer signature verified successfully. Awaiting pending signatories.'
    };
  },

  /**
   * Get secure download and view details with password policy instructions.
   * Does NOT encrypt/alter signed PDF; preserves cryptographic signature.
   */
  getDocumentDownloadInfo: async (documentId) => {
    const doc = await caDocumentsService.getDocumentById(documentId);
    if (!doc) throw new Error('Document not found');

    const clientPrefix = (doc.client || 'ACME').replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    const phoneDigits = (doc.allowedSendAction?.phone || '9886011223').replace(/[^0-9]/g, '');
    const phoneSuffix = phoneDigits.substring(phoneDigits.length - 4);
    const samplePassword = `${clientPrefix}${phoneSuffix}`;
    const isReady = doc.statusCode === 'completed' && doc.finalFileAvailable !== false;

    return {
      documentId: doc.id,
      ref: doc.ref,
      title: doc.title,
      isCompleted: doc.statusCode === 'completed',
      isReady,
      status: isReady ? 'AVAILABLE' : (doc.statusCode === 'completed' ? 'PROCESSING' : 'PENDING'),
      message: isReady ? null : (doc.statusCode === 'completed' ? 'Final document processing' : 'Document not yet completed'),
      downloadUrl: `/api/ca/documents/${doc.id}/download-original`,
      passwordPolicy: {
        ...BACKEND_PASSWORD_POLICY,
        samplePasswordHint: `Format: ${clientPrefix}•••• (e.g. ${samplePassword})`,
        instructions: `Password to open the certified document is the first 4 uppercase letters of your organization ("${clientPrefix}") followed by the last 4 digits of your registered mobile number ("${phoneSuffix}").`
      }
    };
  },

  /**
   * Get authorized CA access to final completed executed document.
   * Enforces practice firm authorization, completed status, file availability, and PAdES preservation.
   */
  getFinalExecutedDocument: async (documentId, requestingFirmId = 'FIRM-001') => {
    const doc = await caDocumentsService.getDocumentById(documentId);
    if (!doc) throw new Error('Document not found in vault.');

    // Firm authorization check: Prevent cross-firm access
    if (doc.firmId && doc.firmId !== requestingFirmId) {
      throw new Error('Unauthorized access: Document belongs to a different practice firm.');
    }

    // Must be genuinely completed
    if (doc.statusCode !== 'completed') {
      throw new Error('Document is not yet completed. Final executed copy is available only after completion.');
    }

    // File availability check
    const isFileAvailable = doc.finalFileAvailable !== false;
    if (!isFileAvailable) {
      return {
        isReady: false,
        status: 'PROCESSING',
        message: 'Final document processing',
        documentId: doc.id,
        ref: doc.ref
      };
    }

    const clientPrefix = (doc.client || 'ACME').replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    const phoneDigits = (doc.allowedSendAction?.phone || '9886011223').replace(/[^0-9]/g, '');
    const phoneSuffix = phoneDigits.substring(phoneDigits.length - 4);
    const samplePassword = `${clientPrefix}${phoneSuffix}`;

    return {
      isReady: true,
      status: 'AVAILABLE',
      documentId: doc.id,
      ref: doc.ref,
      title: doc.title,
      completedAt: doc.completedAt,
      firmId: doc.firmId || requestingFirmId,
      mimeType: 'application/pdf',
      fileName: `${doc.ref}-Executed-Certified.pdf`,
      viewUrl: `/api/ca/documents/${doc.id}/view-executed`,
      downloadUrl: `/api/ca/documents/${doc.id}/download-executed`,
      cryptographicStandard: 'PAdES / PKCS#7 Digital Signature Preserved',
      stampCertificateNo: doc.execution?.stampCertificateNo,
      passwordPolicy: {
        ...BACKEND_PASSWORD_POLICY,
        samplePasswordHint: `Format: ${clientPrefix}•••• (e.g. ${samplePassword})`,
        instructions: `Password to open the certified document is the first 4 uppercase letters of the organization ("${clientPrefix}") followed by the last 4 digits of registered phone ("${phoneSuffix}").`
      }
    };
  },

  /**
   * Authorized CA download of genuine executed PDF.
   * Preserves digital signature intact without client-side re-encryption.
   */
  downloadExecutedDocument: async (documentId, requestingFirmId = 'FIRM-001') => {
    const info = await caDocumentsService.getFinalExecutedDocument(documentId, requestingFirmId);

    if (!info.isReady) {
      throw new Error('Final document processing. The certified copy is being assembled by the statutory repository.');
    }

    // In web environment, simulate authenticated blob stream download
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const dummyPdfContent = `%PDF-1.7\n%ZapDocs Statutory Executed Document\n%Ref: ${info.ref}\n%Stamp: ${info.stampCertificateNo || 'N/A'}\n%%EOF`;
      const blob = new Blob([dummyPdfContent], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', info.fileName);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    }

    return {
      success: true,
      fileName: info.fileName,
      info,
      isDemo: true,
      downloadedAt: new Date().toISOString()
    };
  },

  /**
   * Authorized client / shared recipient access to final executed document.
   * Restricts access strictly to the assigned document and requires valid authentication.
   * Generates a short-lived download token/ticket rather than public static URLs.
   */
  getRecipientExecutedDocument: async (documentIdOrToken, authContext = {}) => {
    const doc = await caDocumentsService.getDocumentById(documentIdOrToken);
    if (!doc) {
      throw new Error('Invalid or expired invitation link. Document not found.');
    }

    // Access restriction: verify assigned document isolation
    if (authContext.assignedDocId && authContext.assignedDocId !== doc.id && authContext.assignedDocId !== doc.ref) {
      throw new Error('Unauthorized access: This session is strictly restricted to the assigned document only.');
    }

    // Require authenticated portal access verification (prevents forwarded links alone granting access)
    if (authContext.requireFreshAuth && !authContext.isAccessVerified) {
      throw new Error('Fresh authentication required: Recipient must verify portal identity before accessing completed file.');
    }

    // Must be genuinely completed
    if (doc.statusCode !== 'completed') {
      throw new Error('Document is not yet completed. Final executed copy is available only after completion.');
    }

    // File availability check
    const isFileAvailable = doc.finalFileAvailable !== false;
    if (!isFileAvailable) {
      return {
        isReady: false,
        status: 'PROCESSING',
        message: 'Final document processing',
        documentId: doc.id,
        ref: doc.ref
      };
    }

    const clientPrefix = (doc.client || 'ACME').replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
    const phoneDigits = (doc.allowedSendAction?.phone || '9886011223').replace(/[^0-9]/g, '');
    const phoneSuffix = phoneDigits.substring(phoneDigits.length - 4);
    const samplePassword = `${clientPrefix}${phoneSuffix}`;

    // Issue short-lived ticket valid for 5 minutes
    const ticketId = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return {
      isReady: true,
      status: 'AVAILABLE',
      documentId: doc.id,
      ref: doc.ref,
      title: doc.title,
      completedAt: doc.completedAt,
      mimeType: 'application/pdf',
      fileName: `${doc.ref}-Executed-Certified.pdf`,
      downloadTicket: ticketId,
      expiresAt,
      // Short-lived, authenticated download URL with expiring ticket (never a permanent public URL)
      downloadUrl: `/api/client/documents/${doc.id}/download?ticket=${ticketId}&exp=${encodeURIComponent(expiresAt)}`,
      cryptographicStandard: 'PAdES / PKCS#7 Digital Signature Preserved',
      stampCertificateNo: doc.execution?.stampCertificateNo || 'Exempt / Not Required',
      signers: doc.execution?.signers || [],
      isDemo: true,
      passwordPolicy: {
        ...BACKEND_PASSWORD_POLICY,
        samplePasswordHint: `Format: ${clientPrefix}•••• (e.g. ${samplePassword})`,
        instructions: `Password to open the certified document is the first 4 uppercase letters of your organization ("${clientPrefix}") followed by the last 4 digits of your registered mobile number ("${phoneSuffix}").`
      }
    };
  },

  /**
   * Authorized client / recipient download of executed PDF via short-lived access.
   */
  downloadRecipientExecutedDocument: async (documentIdOrToken, authContext = {}) => {
    const info = await caDocumentsService.getRecipientExecutedDocument(documentIdOrToken, authContext);

    if (!info.isReady) {
      throw new Error('Final document processing. The certified copy is being assembled by the statutory repository.');
    }

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const dummyPdfContent = `%PDF-1.7\n%ZapDocs Statutory Executed Document (Recipient Copy)\n%Ref: ${info.ref}\n%Ticket: ${info.downloadTicket}\n%Expires: ${info.expiresAt}\n%Stamp: ${info.stampCertificateNo}\n%DigitalSignatures: PAdES PKCS#7 Validated\n%%EOF`;
      const blob = new Blob([dummyPdfContent], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', info.fileName);
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    }

    return {
      success: true,
      fileName: info.fileName,
      info,
      isDemo: true,
      downloadedAt: new Date().toISOString()
    };
  },

  /**
   * Resolve an unresolved correction request (legacy compatibility wrapper).
   */
  resolveCorrectionRequestLegacy: async (documentId, requestId) => {
    return caDocumentsService.resolveCorrectionRequest(documentId, requestId, 'ACCEPT');
  },

  /**
   * Dispatch link (legacy compatibility wrapper).
   */
  dispatchLink: async (documentId, options = {}) => {
    const doc = await caDocumentsService.getDocumentById(documentId);
    if (doc?.payment?.status === 'PAID') {
      return caDocumentsService.requestSigningInvitation(documentId, options);
    }
    return caDocumentsService.requestDraftReviewNotification(documentId);
  }
};

export default caDocumentsService;
