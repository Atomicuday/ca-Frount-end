/**
 * ZapDocs Centralized LocalStorage Keys for CA Portal
 * Provides scoped storage isolation.
 */
export const STORAGE_KEYS = {
  // Session & Authentication
  CA_SESSION: 'zd_ca_session',
  CA_USER: 'zd_ca_user',

  // Shared Preferences
  THEME: 'zd_theme',
  LANGUAGE: 'zd_lang',

  // CA Portal UI Preferences & State
  CA_PREFERENCES: 'zd_ca_pref',
  CA_FILTERS: 'zd_ca_filters',
  CA_TABLES: 'zd_ca_tables'
};

Object.freeze(STORAGE_KEYS);
export default STORAGE_KEYS;
