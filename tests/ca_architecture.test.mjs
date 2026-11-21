import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ROUTES } from '../src/constants/routes.js';
import { NAV_ITEMS } from '../src/components/layout/navigationItems.js';
import { STORAGE_KEYS } from '../src/constants/storageKeys.js';
import { AVAILABLE_LANGUAGES, UI_TRANSLATIONS } from '../src/constants/translations.js';
import { caService } from '../src/services/api/caService.js';
import { isValidEmail, isValidPhone, isValidPAN, isValidGSTIN } from '../src/utils/validation.js';

describe('CA Portal Architecture Suite', () => {
  test('centralized route definitions include all core CA modules', () => {
    assert.equal(ROUTES.CA_DASHBOARD, '/ca/dashboard');
    assert.equal(ROUTES.CA_CLIENTS, '/ca/clients');
    assert.equal(ROUTES.CA_DOCUMENTS, '/ca/documents');
    assert.equal(ROUTES.CA_FINANCE, '/ca/finance');
    assert.equal(ROUTES.CA_PROFILE, '/ca/profile');
  });

  test('navigation items map to core CA views', () => {
    const ids = NAV_ITEMS.map((item) => item.id);
    assert.deepEqual(ids, ['dashboard', 'clients', 'documents', 'finance']);

    const routes = NAV_ITEMS.map((item) => item.route);
    assert.deepEqual(routes, [
      '/ca/dashboard',
      '/ca/clients',
      '/ca/documents',
      '/ca/finance'
    ]);
  });

  test('storage keys provide isolated CA portal namespaces', () => {
    assert.equal(STORAGE_KEYS.CA_SESSION, 'zd_ca_session');
    assert.equal(STORAGE_KEYS.CA_USER, 'zd_ca_user');
    assert.equal(STORAGE_KEYS.THEME, 'zd_theme');
    assert.equal(STORAGE_KEYS.LANGUAGE, 'zd_lang');
  });

  test('multilingual support provides 5 regional languages with key parity', () => {
    const codes = AVAILABLE_LANGUAGES.map((l) => l.code);
    assert.deepEqual(codes, ['en', 'hi', 'te', 'kn', 'mr']);

    for (const code of codes) {
      assert.ok(UI_TRANSLATIONS[code], `Missing translations for ${code}`);
      assert.ok(UI_TRANSLATIONS[code].nav_dashboard, `Missing nav_dashboard in ${code}`);
      assert.ok(UI_TRANSLATIONS[code].nav_clients, `Missing nav_clients in ${code}`);
      assert.ok(UI_TRANSLATIONS[code].nav_documents, `Missing nav_documents in ${code}`);
      assert.ok(UI_TRANSLATIONS[code].nav_finance, `Missing nav_finance in ${code}`);
    }
  });

  test('validation helpers validate Indian tax formats (PAN, GSTIN, Phone)', () => {
    assert.ok(isValidPAN('AAACA1234A'));
    assert.ok(!isValidPAN('INVALIDPAN'));

    assert.ok(isValidGSTIN('29AAACA1234A1Z5'));
    assert.ok(!isValidGSTIN('INVALIDGST'));

    assert.ok(isValidPhone('9845012345'));
    assert.ok(!isValidPhone('12345'));

    assert.ok(isValidEmail('ca.rajesh@zapdocs.in'));
    assert.ok(!isValidEmail('invalid-email'));
  });

  test('caService exposes standard API methods with prototype fallbacks', async () => {
    assert.equal(typeof caService.getDashboardMetrics, 'function');
    assert.equal(typeof caService.getClients, 'function');
    assert.equal(typeof caService.getDocuments, 'function');
    assert.equal(typeof caService.getFinanceOverview, 'function');

    const metrics = await caService.getDashboardMetrics();
    assert.ok(metrics.activeClients > 0);
    assert.ok(metrics.monthlyRetainers > 0);
  });
});
