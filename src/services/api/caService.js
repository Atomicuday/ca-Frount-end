/**
 * CA Domain API Service
 * Encapsulates endpoints for Dashboard, Clients, Documents, and Finance.
 */
import { api } from './client.js';
import { caDocumentsService } from './caDocumentsService.js';

export const caService = {
  // Practice metrics & Dashboard
  getDashboardMetrics: async () => {
    try {
      return await api.get('/ca/dashboard/metrics');
    } catch {
      // Prototype fallback
      return {
        activeClients: 48,
        pendingFilings: 12,
        completedReturns: 184,
        monthlyRetainers: 285000,
        gstDueCount: 5,
        incomeTaxDueCount: 7
      };
    }
  },

  // Clients
  getClients: async (params) => {
    try {
      return await api.get('/ca/clients', params);
    } catch {
      return [];
    }
  },

  getClientById: async (id) => {
    return await api.get(`/ca/clients/${id}`);
  },

  createClient: async (clientData) => {
    return await api.post('/ca/clients', clientData);
  },

  // Documents
  getDocuments: async (params) => {
    try {
      const res = await api.get('/ca/documents', params);
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
    } catch {
      // Prototype fallback
    }
    const res = await caDocumentsService.getDocuments(params);
    return res.data || [];
  },

  uploadDocument: async (docData) => {
    return await api.post('/ca/documents', docData);
  },

  // Finance
  getFinanceOverview: async () => {
    try {
      return await api.get('/ca/finance/overview');
    } catch {
      return {
        totalReceivables: 142000,
        collectedThisMonth: 185000,
        pendingInvoices: 8,
        upiEnabled: true
      };
    }
  },

  getInvoices: async (params) => {
    try {
      return await api.get('/ca/finance/invoices', params);
    } catch {
      return [];
    }
  }
};

export default caService;
