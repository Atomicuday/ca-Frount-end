/**
 * CA Client Management Service & Adapter
 * Manages client records, linked draft creation, and partial-failure handling.
 */
import { api } from './client.js';
import { caDocumentsService } from './caDocumentsService.js';

let localClientsStore = [
  {
    id: 'CLI-101',
    name: 'Acme Technologies Pvt Ltd',
    entityType: 'Company',
    companyName: 'Acme Technologies Pvt Ltd',
    contactPerson: 'Arun Kumar',
    phone: '+91 98860 11223',
    email: 'arun@acmetech.in',
    pan: 'AAACA1234A',
    gstin: '29AAACA1234A1Z5',
    cin: 'U72200KA2020PTC123456',
    address: 'Indiranagar 100ft Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    status: 'Active',
    filingStatus: 'Up to Date'
  },
  {
    id: 'CLI-102',
    name: 'Zenith Retail LLP',
    entityType: 'LLP',
    companyName: 'Zenith Retail LLP',
    contactPerson: 'Pooja Reddy',
    phone: '+91 98451 99887',
    email: 'pooja@zenithretail.in',
    pan: 'AABCZ5678B',
    gstin: '29AABCZ5678B1Z2',
    llpin: 'AAB-5678',
    address: 'Commercial Street',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    status: 'Active',
    filingStatus: 'GSTR-3B Due'
  },
  {
    id: 'CLI-103',
    name: 'Dr. Vikram Sethi',
    entityType: 'Individual',
    companyName: '',
    contactPerson: 'Dr. Vikram Sethi',
    phone: '+91 94480 33445',
    email: 'dr.sethi@clinic.in',
    pan: 'ABCDS9012K',
    gstin: '',
    address: 'Jayanagar 4th Block',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560011',
    status: 'Active',
    filingStatus: 'ITR Pending'
  },
  {
    id: 'CLI-104',
    name: 'Apex Logistics India Pvt Ltd',
    entityType: 'Company',
    companyName: 'Apex Logistics India Pvt Ltd',
    contactPerson: 'Ramesh Nair',
    phone: '+91 98200 44556',
    email: 'ramesh@apexlogistics.in',
    pan: 'AAACL9901M',
    gstin: '27AAACL9901M1Z8',
    cin: 'U60200MH2018PTC309112',
    address: 'Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400069',
    status: 'Active',
    filingStatus: 'ROC Due'
  },
  {
    id: 'CLI-105',
    name: 'Horizon Enterprises',
    entityType: 'Partnership',
    companyName: 'Horizon Enterprises',
    contactPerson: 'Suresh Patel',
    phone: '+91 98220 77889',
    email: 'suresh@horizonenterprises.com',
    pan: 'AABCH4455N',
    gstin: '24AABCH4455N1Z4',
    address: 'Ashram Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380009',
    status: 'Active',
    filingStatus: 'Draft Deed'
  },
  {
    id: 'CLI-106',
    name: 'BlueStar Freight LLP',
    entityType: 'LLP',
    companyName: 'BlueStar Freight LLP',
    contactPerson: 'Kavita Menon',
    phone: '+91 97410 88990',
    email: 'kavita@bluestarfreight.in',
    pan: 'AABCB6677P',
    gstin: '29AABCB6677P1Z1',
    llpin: 'AAC-9912',
    address: 'MG Road',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682016',
    status: 'Active',
    filingStatus: 'Up to Date'
  }
];

export const caClientService = {
  /**
   * Fetch all clients with optional search & type filter.
   */
  getClients: async ({ search = '', type = 'ALL' } = {}) => {
    try {
      const response = await api.get('/ca/clients', { search, type });
      if (Array.isArray(response)) {
        return response;
      }
    } catch {
      // Prototype fallback
    }

    let clients = [...localClientsStore];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.companyName && c.companyName.toLowerCase().includes(q)) ||
          c.contactPerson.toLowerCase().includes(q) ||
          (c.pan && c.pan.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
      );
    }

    if (type && type !== 'ALL') {
      clients = clients.filter((c) => {
        if (type === 'CORPORATE') return c.entityType === 'Company' || c.entityType?.includes('Limited');
        if (type === 'LLP') return c.entityType === 'LLP';
        if (type === 'INDIVIDUAL') return c.entityType === 'Individual';
        if (type === 'PARTNERSHIP') return c.entityType === 'Partnership';
        return c.entityType?.toLowerCase() === type.toLowerCase();
      });
    }

    return clients;
  },

  /**
   * Get client by ID.
   */
  getClientById: async (id) => {
    try {
      const res = await api.get(`/ca/clients/${id}`);
      if (res && res.client) return res.client;
    } catch {
      // Prototype fallback
    }
    return localClientsStore.find((c) => c.id === id) || null;
  },

  /**
   * Save or update client record alone.
   * Supports additionalFields array and preserves existing values on edits.
   */
  saveClient: async (clientData) => {
    try {
      const res = await api.post('/ca/clients', clientData);
      if (res && res.client) return res.client;
    } catch {
      // Prototype fallback
    }

    const clientId = clientData.id || `CLI-${Math.floor(100 + Math.random() * 900)}`;
    const existingIdx = localClientsStore.findIndex((c) => c.id === clientId);
    const existingClient = existingIdx >= 0 ? localClientsStore[existingIdx] : {};

    const savedClient = {
      ...existingClient,
      id: clientId,
      name: clientData.name || clientData.companyName || clientData.contactPerson || existingClient.name || 'Client',
      companyName: clientData.companyName !== undefined ? clientData.companyName : (existingClient.companyName || ''),
      entityType: clientData.clientType || clientData.entityType || existingClient.entityType || null,
      contactPerson: clientData.contactPerson !== undefined ? clientData.contactPerson : (existingClient.contactPerson || ''),
      phone: clientData.phone !== undefined ? clientData.phone : (existingClient.phone || ''),
      email: clientData.email !== undefined ? clientData.email : (existingClient.email || ''),
      // Security compliance: Never persist raw 12-digit Aadhaar. Store masked/token only.
      aadhaarMasked: clientData.aadhaarMasked || existingClient.aadhaarMasked || null,
      aadhaarLast4: clientData.aadhaarLast4 || existingClient.aadhaarLast4 || null,
      hasAadhaarProvided: Boolean(clientData.hasAadhaarProvided || existingClient.hasAadhaarProvided),
      pan: clientData.pan !== undefined ? clientData.pan : (existingClient.pan || ''),
      gstin: clientData.gstin !== undefined ? clientData.gstin : (existingClient.gstin || ''),
      cin: clientData.cin !== undefined ? clientData.cin : (existingClient.cin || ''),
      llpin: clientData.llpin !== undefined ? clientData.llpin : (existingClient.llpin || ''),
      address: clientData.address !== undefined ? clientData.address : (existingClient.address || ''),
      city: clientData.city !== undefined ? clientData.city : (existingClient.city || ''),
      state: clientData.state !== undefined ? clientData.state : (existingClient.state || ''),
      pincode: clientData.pincode !== undefined ? clientData.pincode : (existingClient.pincode || ''),
      notes: clientData.notes !== undefined ? clientData.notes : (existingClient.notes || ''),
      additionalFields: Array.isArray(clientData.additionalFields)
        ? clientData.additionalFields
        : (existingClient.additionalFields || []),
      status: existingClient.status || 'Active',
      filingStatus: existingClient.filingStatus || 'Draft Initialized'
    };

    if (existingIdx >= 0) {
      localClientsStore[existingIdx] = savedClient;
    } else {
      localClientsStore = [savedClient, ...localClientsStore];
    }

    return savedClient;
  },

  /**
   * Complete Add Client & Create Document transactional flow.
   * Handles partial failures: if draft creation fails, preserves the saved client.
   */
  saveClientAndDraft: async ({ clientPayload, template, templateFields, retrySavedClientId = null }) => {
    let savedClient = null;

    // 1. Save or reuse client
    if (retrySavedClientId) {
      savedClient = localClientsStore.find((c) => c.id === retrySavedClientId);
      if (!savedClient) {
        savedClient = await caClientService.saveClient(clientPayload);
      }
    } else {
      savedClient = await caClientService.saveClient(clientPayload);
    }

    // 2. Create linked draft document
    try {
      const documentTitle = `${template.name} – ${savedClient.name}`;
      const docRes = await caDocumentsService.createClientAndDocument({
        isNewClient: false,
        clientId: savedClient.id,
        clientName: savedClient.name,
        clientType: savedClient.entityType,
        pan: savedClient.pan,
        gstin: savedClient.gstin,
        contactPerson: savedClient.contactPerson,
        phone: savedClient.phone,
        email: savedClient.email,
        documentTitle,
        docType: template.category,
        notes: `Initialized via Add Client flow for template ${template.name}. Field values: ${JSON.stringify(templateFields)}`
      });

      // 3. Request one recipient-specific WhatsApp draft-review invitation through backend
      let notificationState = {
        sent: false,
        message: 'Notification pending dispatch.'
      };

      try {
        const notifRes = await caDocumentsService.requestDraftReviewNotification(docRes.document.id);
        notificationState = {
          sent: true,
          message: notifRes.message || 'WhatsApp draft-review invitation sent to recipient (Message 1 of 2).'
        };
      } catch (notifErr) {
        console.error('WhatsApp draft-review invitation delivery failed:', notifErr);
        notificationState = {
          sent: false,
          error: notifErr.message || 'WhatsApp notification delivery failed. Draft was preserved.'
        };
      }

      return {
        success: true,
        client: savedClient,
        document: docRes.document,
        savedState: `Client "${savedClient.name}" saved & linked draft "${docRes.document.ref}" created.`,
        notificationState,
        message: `Client "${savedClient.name}" saved & linked draft "${docRes.document.ref}" created. ${
          notificationState.sent ? 'Draft-review WhatsApp sent.' : 'Notification delivery pending.'
        }`
      };
    } catch (draftError) {
      console.error('Draft creation step failed after client was saved:', draftError);
      return {
        success: false,
        partialSuccess: true,
        client: savedClient,
        error: 'Client profile was successfully saved, but linked document draft creation encountered an issue. You can retry creating the draft without re-entering client details.',
        retrySavedClientId: savedClient.id
      };
    }
  }
};

export default caClientService;
