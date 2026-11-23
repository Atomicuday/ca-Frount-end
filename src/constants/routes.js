/**
 * Centralized Route Definitions for ZapDocs CA Portal
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CA_LOGIN: '/ca/login',
  CA_DASHBOARD: '/ca/dashboard',
  CA_CLIENTS: '/ca/clients',
  CA_DOCUMENTS: '/ca/documents',
  CA_DOCUMENT_CREATE: '/ca/documents/create',
  CA_FINANCE: '/ca/finance',
  CA_PROFILE: '/ca/profile',
  CA_SETTINGS: '/ca/profile',
  CLIENT_DRAFT_REVIEW: '/review/:token',
  CLIENT_SIGNING: '/sign/:token',
  NOT_FOUND: '/404'
};

export default ROUTES;
