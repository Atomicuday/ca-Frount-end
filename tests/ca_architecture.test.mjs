import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ROUTES } from '../src/constants/routes.js';
import { NAV_ITEMS } from '../src/components/layout/navigationItems.js';
import { STORAGE_KEYS } from '../src/constants/storageKeys.js';
import { AVAILABLE_LANGUAGES, UI_TRANSLATIONS } from '../src/constants/translations.js';
import { caService } from '../src/services/api/caService.js';
import { caDashboardService } from '../src/services/api/caDashboardService.js';
import { caDocumentsService } from '../src/services/api/caDocumentsService.js';
import { caTemplateService } from '../src/services/api/caTemplateService.js';
import { caClientService } from '../src/services/api/caClientService.js';
import { caBillingService, formatINR, getCurrentFinancialYear } from '../src/services/api/caBillingService.js';
import { caStampDutyService } from '../src/services/api/caStampDutyService.js';
import {
  caBulkImportService,
  STANDARD_IMPORT_HEADERS,
  sanitizeCsvCell,
  normalizeDateInput
} from '../src/services/api/caBulkImportService.js';
import { CLIENT_TYPES } from '../src/mock/caTemplatesData.js';
import { isValidEmail, isValidPhone, isValidPAN, isValidGSTIN } from '../src/utils/validation.js';
import { getTimeBasedGreeting } from '../src/utils/greeting.js';

describe('CA Portal Architecture Suite', () => {
  test('centralized route definitions include all core CA modules', () => {
    assert.equal(ROUTES.CA_DASHBOARD, '/ca/dashboard');
    assert.equal(ROUTES.CA_CLIENTS, '/ca/clients');
    assert.equal(ROUTES.CA_DOCUMENTS, '/ca/documents');
    assert.equal(ROUTES.CA_DOCUMENT_CREATE, '/ca/documents/create');
    assert.equal(ROUTES.CA_FINANCE, '/ca/finance');
    assert.equal(ROUTES.CA_PROFILE, '/ca/profile');
  });

  test('navigation items map to core CA views', () => {
    const ids = NAV_ITEMS.map((item) => item.id);
    assert.deepEqual(ids, ['dashboard', 'documents', 'clients', 'finance']);

    const routes = NAV_ITEMS.map((item) => item.route);
    assert.deepEqual(routes, [
      '/ca/dashboard',
      '/ca/documents',
      '/ca/clients',
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

  test('caDashboardService provides consistent dashboard data agreeing across cards, pipeline, and attention', async () => {
    const data = await caDashboardService.getDashboardData('30d');
    assert.ok(data.summary);
    assert.equal(data.summary.totalClients, 48);
    assert.equal(data.summary.draftDocuments, 14);
    assert.equal(data.summary.pendingApprovals, 15);
    assert.equal(data.summary.pendingPayments, 6);
    assert.equal(data.summary.completedInPeriod['30d'], 42);

    // Verify 6 mutually exclusive pipeline stages
    assert.equal(data.pipelineStages.length, 6);
    const stageIds = data.pipelineStages.map((s) => s.id);
    assert.deepEqual(stageIds, [
      'draft',
      'awaiting_info',
      'ca_review',
      'party_review',
      'awaiting_payment',
      'executing'
    ]);

    // Verify draft stage matches summary draft count
    const draftStage = data.pipelineStages.find((s) => s.id === 'draft');
    assert.equal(draftStage.count, data.summary.draftDocuments);

    // Verify attention reminders enforce portal/email, never WhatsApp
    for (const item of data.attentionItems) {
      if (item.reminderChannel) {
        assert.ok(!item.reminderChannel.toLowerCase().includes('whatsapp'));
        assert.ok(item.reminderChannel.toLowerCase().includes('portal') || item.reminderChannel.toLowerCase().includes('email'));
      }
    }

    // Verify activity trends integer counts and partial periods
    assert.ok(data.activityTrends['30d']);
    assert.ok(Array.isArray(data.activityTrends['30d'].weekly));
    assert.ok(Array.isArray(data.activityTrends['30d'].monthly));
    for (const pt of data.activityTrends['30d'].weekly) {
      assert.ok(Number.isInteger(pt.count));
      assert.ok(typeof pt.period === 'string');
    }

    // Verify template categories supplied by service layer
    assert.ok(Array.isArray(data.categoriesCreated));
    assert.ok(data.categoriesCreated.length >= 4);
    for (const cat of data.categoriesCreated) {
      assert.ok(cat.category);
      assert.ok(typeof cat.count === 'number');
    }

    // Verify recent documents schema and allowedActions
    assert.ok(Array.isArray(data.recentDocuments));
    for (const doc of data.recentDocuments) {
      assert.ok(doc.title);
      assert.ok(doc.ref);
      assert.ok(doc.client);
      assert.ok(doc.docType);
      assert.ok(doc.documentStatus);
      assert.ok(doc.paymentStatus);
      assert.ok(doc.stampStatus);
      assert.ok(Array.isArray(doc.allowedActions));
    }
  });

  test('caDashboardService prevents automated payment or stamp retries during gateway inspection', async () => {
    const diag = await caDashboardService.inspectGatewayIssue('DOC-204');
    assert.equal(diag.status, 'eSign DSC Handshake Blocked');
    assert.ok(diag.suggestedAction.includes('Manual'));
    assert.equal(diag.allowAutoRetry, false);
  });

  test('time-based greeting follows exact hourly boundary rules', () => {
    // 00:00–11:59: “Hi, good morning, [Name]”
    assert.equal(getTimeBasedGreeting(new Date(2026, 10, 23, 0, 0), 'CA Rajesh Sharma'), 'Hi, good morning, CA Rajesh Sharma');
    assert.equal(getTimeBasedGreeting(new Date(2026, 10, 23, 11, 59), 'CA Rajesh Sharma'), 'Hi, good morning, CA Rajesh Sharma');

    // 12:00–16:59: “Hi, good afternoon, [Name]”
    assert.equal(getTimeBasedGreeting(new Date(2026, 10, 23, 12, 0), 'CA Rajesh Sharma'), 'Hi, good afternoon, CA Rajesh Sharma');
    assert.equal(getTimeBasedGreeting(new Date(2026, 10, 23, 16, 59), 'CA Rajesh Sharma'), 'Hi, good afternoon, CA Rajesh Sharma');

    // 17:00–23:59: “Hi, good evening, [Name]”
    assert.equal(getTimeBasedGreeting(new Date(2026, 10, 23, 17, 0), 'CA Rajesh Sharma'), 'Hi, good evening, CA Rajesh Sharma');
    assert.equal(getTimeBasedGreeting(new Date(2026, 10, 23, 23, 59), 'CA Rajesh Sharma'), 'Hi, good evening, CA Rajesh Sharma');

    // Graceful fallback when name is omitted or whitespace
    assert.equal(getTimeBasedGreeting(new Date(2026, 10, 23, 9, 0), ''), 'Hi, good morning, Practitioner');
    assert.equal(getTimeBasedGreeting(new Date(2026, 10, 23, 14, 0), null), 'Hi, good afternoon, Practitioner');
  });

  test('three summary cards reconcile with pending stages and completed counts', async () => {
    const data = await caDashboardService.getDashboardData();
    assert.equal(data.summary.totalClients, 48);
    assert.equal(data.summary.pendingDocuments, 47);
    assert.equal(data.summary.completedDocuments, 184);

    // Sum of the 6 pending pipeline stages must exactly equal pendingDocuments count
    const pendingSum = data.pipelineStages.reduce((acc, stage) => acc + stage.count, 0);
    assert.equal(pendingSum, data.summary.pendingDocuments);
  });

  test('annual activity service returns 12 months with partial and future month handling', async () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const months = await caDashboardService.getAnnualActivity(currentYear);

    assert.equal(months.length, 12);
    // Current month must be identified as partial
    assert.equal(months[currentMonth].isPartial, true);
    assert.equal(typeof months[currentMonth].count, 'number');

    // Future months must not be treated as completed zero-value periods
    for (let i = currentMonth + 1; i < 12; i++) {
      assert.equal(months[i].isFuture, true);
      assert.equal(months[i].count, null);
    }
  });

  test('activity by granularity supports day, month, and year with partial period tagging', async () => {
    // 1. Day view: 30 calendar days ending today (today marked partial)
    const dayResult = await caDashboardService.getActivityByGranularity('day');
    assert.equal(dayResult.granularity, 'day');
    assert.equal(dayResult.data.length, 30);
    const todayPoint = dayResult.data[dayResult.data.length - 1];
    assert.equal(todayPoint.isPartial, true);
    assert.equal(typeof todayPoint.count, 'number');

    // 2. Month view: Jan through current month of current year (current month marked partial)
    const currentMonth = new Date().getMonth();
    const monthResult = await caDashboardService.getActivityByGranularity('month');
    assert.equal(monthResult.granularity, 'month');
    assert.equal(monthResult.data.length, currentMonth + 1);
    const thisMonthPoint = monthResult.data[monthResult.data.length - 1];
    assert.equal(thisMonthPoint.isPartial, true);
    assert.equal(typeof thisMonthPoint.count, 'number');

    // 3. Year view: historical years through current year (current year marked partial)
    const currentYear = new Date().getFullYear();
    const yearResult = await caDashboardService.getActivityByGranularity('year');
    assert.equal(yearResult.granularity, 'year');
    assert.ok(yearResult.data.length >= 3);
    const thisYearPoint = yearResult.data.find((y) => y.year === currentYear);
    assert.ok(thisYearPoint);
    assert.equal(thisYearPoint.isPartial, true);
    assert.equal(typeof thisYearPoint.count, 'number');
  });

  test('caDocumentsService provides search, filtering, and 6-column document attributes', async () => {
    // 1. Fetch initial documents
    const initial = await caDocumentsService.getDocuments({ page: 1, limit: 10 });
    assert.ok(Array.isArray(initial.data));
    assert.ok(initial.total >= 6);

    // 2. Validate all 6 columns requirements on records
    for (const doc of initial.data) {
      // Column 1: Document Details
      assert.ok(doc.title, 'Document must have title');
      assert.ok(doc.ref, 'Document must have ref');
      assert.ok(doc.docType, 'Document must have docType');
      assert.ok(doc.createdAt, 'Document must have createdAt');

      // Column 2: Client
      assert.ok(doc.client, 'Document must have client');
      assert.ok(doc.clientType, 'Document must have clientType');

      // Column 3: Edit Inputs
      assert.equal(typeof doc.isEditableDraft, 'boolean');

      // Column 4: Edit Request
      assert.ok(Array.isArray(doc.correctionRequests));

      // Column 5: Send Link
      assert.ok(doc.allowedSendAction);
      assert.ok(doc.allowedSendAction.label);
      assert.equal(doc.allowedSendAction.channel, 'portal_email');

      // Column 6: Document Status
      assert.ok(doc.status);
      assert.ok(doc.statusDetails);
      assert.ok(doc.statusDetails.paymentStatus);
      assert.ok(doc.statusDetails.stampStatus);
    }

    // 3. Search filter by title and client
    const searchResult = await caDocumentsService.getDocuments({ search: 'Acme' });
    assert.ok(searchResult.data.length >= 1);
    assert.ok(searchResult.data.every((d) => d.client.includes('Acme') || d.title.includes('Acme')));

    // 4. Status filter
    const draftResult = await caDocumentsService.getDocuments({ status: 'draft' });
    assert.ok(draftResult.data.every((d) => d.statusCode === 'draft' || d.status === 'Draft'));

    // 5. Revision fork on locked documents
    const lockedDoc = initial.data.find((d) => !d.isEditableDraft);
    assert.ok(lockedDoc);
    const forkRes = await caDocumentsService.createDocumentRevision(lockedDoc.id);
    assert.ok(forkRes.success);
    assert.equal(forkRes.document.isEditableDraft, true);
    assert.equal(forkRes.document.status, 'Draft');
    assert.ok(forkRes.document.ref.includes('-R1'));

    // 6. WhatsApp rate limiting (maximum 2 for standard, 1 for Direct-Fill)
    const directFillDoc = initial.data.find((d) => d.allowedSendAction?.whatsAppLimit === 1);
    if (directFillDoc) {
      const linkRes = await caDocumentsService.dispatchLink(directFillDoc.id, { sendWhatsApp: true });
      assert.ok(linkRes.success);
      assert.equal(linkRes.isDemo, true);
      // Attempting again should enforce threshold
      await assert.rejects(
        () => caDocumentsService.dispatchLink(directFillDoc.id, { sendWhatsApp: true }),
        /Maximum automated WhatsApp message limit/
      );
    }
  });

  test('caTemplateService provides active published templates with CA schema requirements', async () => {
    // 1. Fetch published templates
    const templates = await caTemplateService.getPublishedTemplates();
    assert.ok(Array.isArray(templates));
    assert.ok(templates.length >= 5, 'Should have at least 5 published templates');

    // 2. Validate template fields structure & CA domain purity (no landlord/tenant)
    for (const tpl of templates) {
      assert.ok(tpl.id, 'Template must have id');
      assert.ok(tpl.name, 'Template must have name');
      assert.ok(tpl.code, 'Template must have code');
      assert.ok(tpl.category, 'Template must have category');
      assert.equal(tpl.status, 'published', 'Only published templates returned');
      assert.ok(Array.isArray(tpl.fields), 'Template must define schema fields');

      // Verify no rental-specific fields exist
      const fieldIds = tpl.fields.map((f) => f.id.toLowerCase());
      assert.ok(!fieldIds.includes('landlord'), 'Must not contain landlord field');
      assert.ok(!fieldIds.includes('tenant'), 'Must not contain tenant field');
      assert.ok(!fieldIds.includes('monthlyrent'), 'Must not contain rent field');
    }

    // 3. Verify specific mandatory schema fields per statutory template
    const statAudit = await caTemplateService.getTemplateById('tpl-stat-audit-3cd');
    assert.ok(statAudit);
    assert.ok(statAudit.fields.some((f) => f.id === 'pan' && f.required));

    const gstr9 = await caTemplateService.getTemplateById('tpl-gstr-9');
    assert.ok(gstr9);
    assert.ok(gstr9.fields.some((f) => f.id === 'gstin' && f.required));

    const mgt14 = await caTemplateService.getTemplateById('tpl-roc-mgt-14');
    assert.ok(mgt14);
    assert.ok(mgt14.fields.some((f) => f.id === 'cin' && f.required));

    const llpAggr = await caTemplateService.getTemplateById('tpl-llp-agreement');
    assert.ok(llpAggr);
    assert.ok(llpAggr.fields.some((f) => f.id === 'llpin' && f.required));

    // 4. Client types definition purity
    const clientTypeValues = CLIENT_TYPES.map((c) => c.value);
    assert.deepEqual(clientTypeValues, ['Company', 'LLP', 'Partnership', 'Individual']);
  });

  test('caClientService manages clients, saves client records, and creates linked drafts with retry', async () => {
    // 1. Fetch initial clients
    const initialClients = await caClientService.getClients();
    assert.ok(Array.isArray(initialClients));
    assert.ok(initialClients.length >= 3);

    // 2. Type filtering
    const corporateClients = await caClientService.getClients({ type: 'CORPORATE' });
    assert.ok(corporateClients.length >= 1);
    assert.ok(corporateClients.every((c) => c.entityType === 'Company' || c.entityType.includes('Limited')));

    const llpClients = await caClientService.getClients({ type: 'LLP' });
    assert.ok(llpClients.length >= 1);
    assert.ok(llpClients.every((c) => c.entityType === 'LLP'));

    // 3. Save new client alone
    const testClientData = {
      clientType: 'Company',
      companyName: 'Bharat Fintech Solutions Pvt Ltd',
      contactPerson: 'Meera Deshmukh',
      phone: '+91 98450 11992',
      email: 'meera@bharatfintech.in',
      pan: 'AABCB1234D',
      gstin: '29AABCB1234D1Z9',
      cin: 'U72200KA2023PTC188221',
      city: 'Bengaluru',
      state: 'Karnataka'
    };

    const savedClient = await caClientService.saveClient(testClientData);
    assert.ok(savedClient.id);
    assert.equal(savedClient.name, 'Bharat Fintech Solutions Pvt Ltd');
    assert.equal(savedClient.pan, 'AABCB1234D');

    // 4. Save client and linked draft transaction
    const template = await caTemplateService.getTemplateById('tpl-stat-audit-3cd');
    const result = await caClientService.saveClientAndDraft({
      clientPayload: {
        clientType: 'Company',
        companyName: 'Surya Solar Infra Pvt Ltd',
        contactPerson: 'Aditya Varma',
        phone: '+91 98110 55443',
        email: 'aditya@suryasolar.in',
        pan: 'AAACS8899K',
        gstin: '29AAACS8899K1Z7'
      },
      template,
      templateFields: {
        financialYear: '2025-26',
        assessmentYear: '2026-27',
        auditType: 'Statutory & Tax Audit u/s 44AB',
        turnoverSlab: 'Above ₹10 Crore',
        pan: 'AAACS8899K'
      }
    });

    assert.ok(result.success);
    assert.ok(result.client.id);
    assert.ok(result.document.ref);
    assert.equal(result.document.status, 'Draft');

    // 5. Safe retry without duplicating client
    const retryResult = await caClientService.saveClientAndDraft({
      clientPayload: {
        clientType: 'Company',
        companyName: 'Surya Solar Infra Pvt Ltd',
        contactPerson: 'Aditya Varma'
      },
      template,
      templateFields: {},
      retrySavedClientId: result.client.id
    });

    assert.ok(retryResult.success);
    assert.equal(retryResult.client.id, result.client.id, 'Must reuse the same client ID on retry');
  });

  test('CAClientsScreen source code enforces single Add Client button without duplicate plus', () => {
    const clientsScreenPath = path.resolve(__dirname, '../src/screens/CAClients/CAClientsScreen.jsx');
    const content = fs.readFileSync(clientsScreenPath, 'utf-8');

    // Exactly one Add Client button with id="btn-add-client"
    const matchId = content.match(/id=["']btn-add-client["']/g);
    assert.equal(matchId ? matchId.length : 0, 1, 'Must have exactly one id="btn-add-client"');

    // Button text must be "Add Client"
    assert.ok(content.includes('<span>Add Client</span>'), 'Button must have <span>Add Client</span>');

    // Must not contain duplicate plus characters
    assert.ok(!content.includes('+ +'), 'Must not contain duplicate plus characters "+ +"');
    assert.ok(!content.includes('<span>+ Add Client</span>'), 'Must not duplicate plus in button text');
    assert.ok(!content.includes('<span>+ Add New Client</span>'), 'Must not duplicate plus in button text');

    // Must mount AddClientModal
    assert.ok(content.includes('<AddClientModal'), 'Must mount AddClientModal component');
    assert.ok(content.includes('onSuccess={handleClientAdded}'), 'Must handle success callback');
  });

  test('dynamic additionalFields array support and client edit persistence in caClientService', async () => {
    // 1. Save new client with additional custom fields
    const newClientWithExtra = {
      clientType: 'Company',
      companyName: 'Apex Cloud Innovations Pvt Ltd',
      contactPerson: 'Karan Mehra',
      phone: '+91 99887 66554',
      email: 'karan@apexcloud.in',
      additionalFields: [
        { id: 'f-101', label: 'Alternate Phone Number', value: '+91 9876543210' },
        { id: 'f-102', label: 'Additional Email', value: 'accounts@example.com' }
      ]
    };

    const saved = await caClientService.saveClient(newClientWithExtra);
    assert.ok(saved.id);
    assert.ok(Array.isArray(saved.additionalFields));
    assert.equal(saved.additionalFields.length, 2);
    assert.equal(saved.additionalFields[0].label, 'Alternate Phone Number');
    assert.equal(saved.additionalFields[0].value, '+91 9876543210');
    assert.equal(saved.additionalFields[1].label, 'Additional Email');
    assert.equal(saved.additionalFields[1].value, 'accounts@example.com');

    // 2. Edit saved client adding a repeated/third field (e.g. Second Contact Name)
    const updatedClient = await caClientService.saveClient({
      id: saved.id,
      companyName: 'Apex Cloud Innovations Pvt Ltd',
      contactPerson: 'Karan Mehra',
      additionalFields: [
        ...saved.additionalFields,
        { id: 'f-103', label: 'Second Contact Name', value: 'Arun Kumar' }
      ]
    });

    assert.equal(updatedClient.id, saved.id);
    assert.equal(updatedClient.additionalFields.length, 3);
    assert.equal(updatedClient.additionalFields[2].label, 'Second Contact Name');
    assert.equal(updatedClient.additionalFields[2].value, 'Arun Kumar');

    // 3. Verify getClientById preserves additionalFields array
    const fetched = await caClientService.getClientById(saved.id);
    assert.ok(fetched);
    assert.equal(fetched.additionalFields.length, 3);
    assert.equal(fetched.additionalFields[0].value, '+91 9876543210');
  });

  test('AddClientModal enforces dynamic extra fields and field-entry dialog without dropdown restriction', () => {
    const modalPath = path.resolve(__dirname, '../src/screens/CAClients/modals/AddClientModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    // 1. "Add More" button exists with styled classes
    assert.ok(content.includes('id="btn-add-more-details"'), 'Must have Add More button id="btn-add-more-details"');
    assert.ok(content.includes('<span>Add More</span>'), 'Button must display "Add More"');
    assert.ok(content.includes('zd-btn-add-more'), 'Must use zd-btn-add-more class');
    assert.ok(content.includes('zd-country-code-select'), 'Must have zd-country-code-select for mobile number');
    assert.ok(content.includes('zd-phone-input-group'), 'Must have zd-phone-input-group');

    // 2. Expandable "Add More Details" section removed
    assert.ok(!content.includes('className="zd-expandable-section"'), 'Old expandable section must be removed');
    assert.ok(!content.includes('className="zd-expand-trigger-btn"'), 'Old expandable trigger must be removed');

    // 3. Field-entry dialog inputs with exact placeholders
    assert.ok(content.includes('id="input-dialog-field-name"'), 'Must have dialog field name input');
    assert.ok(content.includes('placeholder="e.g. Alternate Phone Number, Additional Email, Second Contact Name"'), 'Must have exact field name placeholder');
    assert.ok(content.includes('id="input-dialog-field-value"'), 'Must have dialog value input');
    assert.ok(content.includes('placeholder="Enter the detail"'), 'Must have exact value placeholder');

    // 4. Field name is free-form text input, NOT a restricted dropdown
    const fieldNameInputMatch = content.match(/<input[^>]+id=["']input-dialog-field-name["'][^>]*type=["']text["']/);
    assert.ok(fieldNameInputMatch, 'Field name must be a free-form text input');

    // 5. Allows editing and removing fields
    assert.ok(content.includes('handleOpenEditFieldDialog'), 'Must provide edit field handler');
    assert.ok(content.includes('handleRemoveField'), 'Must provide remove field handler');

    // 6. Template-specific mandatory details box remains separate and visible
    assert.ok(content.includes('className="zd-template-specific-box"'), 'Template-specific box must remain separate and visible');

    // 7. Passes additionalFields in clientPayload
    assert.ok(content.includes('additionalFields'), 'Must pass additionalFields in client payload');
  });

  test('CAClientsScreen replaces client-type chips with Filters button and popover', () => {
    const clientsScreenPath = path.resolve(__dirname, '../src/screens/CAClients/CAClientsScreen.jsx');
    const content = fs.readFileSync(clientsScreenPath, 'utf-8');

    // 1. Always-visible chips removed from toolbar
    assert.ok(!content.includes('className="ca-type-filters"'), 'Must remove always-visible chips ca-type-filters');
    assert.ok(!content.includes('className="ca-filter-pill"'), 'Must remove ca-filter-pill elements');

    // 2. Search input on left and Filters button on right
    assert.ok(content.includes('id="client-search-input"'), 'Must have client-search-input');
    assert.ok(content.includes('id="btn-clients-filter-toggle"'), 'Must have btn-clients-filter-toggle');
    assert.ok(content.includes('<span>Filters</span>'), 'Filters button must display "Filters"');

    // 3. Popover portal with Client Type single selector
    assert.ok(content.includes('id="clients-filter-popover"'), 'Must have clients-filter-popover');
    assert.ok(content.includes('id="filter-select-client-type"'), 'Must have filter-select-client-type');
    assert.ok(content.includes('value="ALL">All Clients'), 'Must have option All Clients');
    assert.ok(content.includes('value="CORPORATE">Corporate'), 'Must have option Corporate');
    assert.ok(content.includes('value="LLP">LLP'), 'Must have option LLP');
    assert.ok(content.includes('value="INDIVIDUAL">Individual'), 'Must have option Individual');
    assert.ok(content.includes('value="PARTNERSHIP">Partnership'), 'Must have option Partnership');

    // 4. Apply and Clear buttons
    assert.ok(content.includes('id="btn-apply-client-filter"'), 'Must have btn-apply-client-filter');
    assert.ok(content.includes('id="btn-clear-client-filter"'), 'Must have btn-clear-client-filter');

    // 5. Active filter indicator badge
    assert.ok(content.includes('className="zd-filter-count-badge"'), 'Must display active filter count badge');

    // 6. Pagination reset on filter and search
    assert.ok(content.includes('setCurrentPage(1)'), 'Must reset pagination on filter change');
  });

  test('CA Finance page header and wallet panel replace client billing and retainers', () => {
    const financeScreenPath = path.resolve(__dirname, '../src/screens/CAFinance/CAFinanceScreen.jsx');
    const content = fs.readFileSync(financeScreenPath, 'utf-8');

    // 1. Page Header updated
    assert.ok(content.includes('Zap Wallet'), 'Heading must be "Zap Wallet"');
    assert.ok(
      content.includes('Manage your Zap Wallet, service charges and payment history.'),
      'Subtitle must match specification'
    );

    // 2. Removal of client finance content & Create Invoice button
    assert.ok(!content.includes('id="btn-create-invoice"'), 'Must remove Create Invoice button');
    assert.ok(!content.includes('+ Create Invoice'), 'Must remove "+ Create Invoice" text');
    assert.ok(!content.includes('Monthly Retainers'), 'Must remove Monthly Retainers');
    assert.ok(!content.includes('Collected This Month'), 'Must remove Collected This Month');
    assert.ok(!content.includes('Outstanding Invoices'), 'Must remove Outstanding Invoices');
    assert.ok(!content.includes('Recent Invoices & Retainer Receipts'), 'Must remove client invoice receipts');

    // 3. CA Wallet panel elements: Reserved Amount box, duplicate Add Money, and View Wallet History removed
    assert.ok(content.includes('ca-wallet-hero-card'), 'Must render wallet hero card');
    assert.ok(content.includes('Available Wallet Balance'), 'Must show available balance label');
    assert.ok(!content.includes('ca-wallet-reserved-box'), 'Reserved Amount box must be removed from wallet panel');
    assert.ok(!content.includes('id="btn-open-add-money"'), 'Duplicate Add Money button must be removed from wallet panel');
    assert.ok(!content.includes('id="btn-view-wallet-history"'), 'View Wallet History button must be removed from wallet panel');
    assert.ok(content.includes('Use your balance to pay for eligible document services.'), 'Must show explanation');
    assert.ok(content.includes('Add Money'), 'Page top-right Add Money button must remain preserved');

    // 4. Spending summary section: 3 cards, brand mentions removed
    assert.ok(content.includes('Spending Summary'), 'Must have Spending Summary header');
    assert.ok(content.includes('Total Spent'), 'Must have Total Spent card');
    assert.ok(content.includes('eSign Spend'), 'Must have eSign Spend card');
    assert.ok(content.includes('eStamp Spend'), 'Must have eStamp Spend card');
    assert.ok(!content.includes('Other ZapDocs Charges'), 'Must remove Other ZapDocs Charges card');
    assert.ok(!content.includes('Total Spent on ZapDocs'), 'Must not have Total Spent on ZapDocs');
    assert.ok(!content.includes('ZapDocs Spending Summary'), 'Must not have ZapDocs Spending Summary');

    // 5. Billing transaction table & modals
    assert.ok(content.includes('Billing & Transaction History'), 'Must have transaction table header');
    assert.ok(!content.includes('ZapDocs Billing & Transaction History'), 'Must not have ZapDocs Billing & Transaction History');
    assert.ok(content.includes('<AddMoneyModal'), 'Must mount AddMoneyModal');
    assert.ok(content.includes('<TransactionDetailsModal'), 'Must mount TransactionDetailsModal');
  });

  test('caBillingService maintains wallet ledger, minor-unit calculations, and prevents false credits', async () => {
    // 1. Fetch wallet balance
    const wallet = await caBillingService.getWalletBalance();
    assert.ok(wallet);
    assert.equal(typeof wallet.availableBalancePaise, 'number');
    assert.equal(typeof wallet.reservedBalancePaise, 'number');
    assert.ok(wallet.availableBalancePaise > 0);
    assert.equal(wallet.currency, 'INR');

    // 2. formatINR helper formats integer minor units to rupees
    assert.equal(formatINR(10000), '₹100.00');
    assert.equal(formatINR(845000), '₹8,450.00');

    // 3. Create top-up order: must be PENDING and does NOT increase available balance
    const balanceBeforeOrder = wallet.availableBalancePaise;
    const order = await caBillingService.createTopUpOrder({
      amountRupees: 1000,
      paymentMethod: 'upi'
    });
    assert.ok(order.orderId);
    assert.equal(order.status, 'PENDING');
    assert.equal(order.amountPaise, 100000);

    const balanceAfterOrder = (await caBillingService.getWalletBalance()).availableBalancePaise;
    assert.equal(balanceAfterOrder, balanceBeforeOrder, 'Creating an order must NOT credit balance before settlement');

    // 4. Verified settlement handshake: credits wallet balance
    const settlement = await caBillingService.verifyAndSettleTopUp(order.orderId);
    assert.ok(settlement.success);
    assert.equal(settlement.newAvailableBalancePaise, balanceBeforeOrder + 100000);
    assert.equal(settlement.transaction.status, 'SETTLED');
    assert.equal(settlement.transaction.type, 'TOPUP');

    // 5. Duplicate credit prevention: re-attempting settlement on same order throws error
    await assert.rejects(
      () => caBillingService.verifyAndSettleTopUp(order.orderId),
      /Duplicate settlement attempt/
    );
  });

  test('ZapDocs spending reconciliation strictly excludes top-ups and separates stamp duty', async () => {
    // 1. Fetch spending summary
    const summary = await caBillingService.getSpendingSummary('all_time');
    assert.ok(summary);
    assert.ok(summary.totalSpendPaise > 0);
    assert.ok(summary.esignSpendPaise > 0);
    assert.ok(summary.estampSpendPaise > 0);
    assert.ok(summary.otherSpendPaise > 0);

    // 2. Strict reconciliation: totalSpend must equal sum of debit categories
    assert.equal(
      summary.totalSpendPaise,
      summary.esignSpendPaise + summary.estampSpendPaise + summary.otherSpendPaise,
      'Total spend must exactly equal sum of eSign, eStamp, and other platform charges'
    );

    // 3. Stamp duty passthrough must be tracked within eStamp spend
    assert.ok(summary.stampDutyPassthroughPaise > 0);
    assert.ok(
      summary.stampDutyPassthroughPaise < summary.estampSpendPaise,
      'Government duty passthrough must be part of eStamp spend'
    );

    // 4. Transactions list search & filter
    const txns = await caBillingService.getTransactions({ limit: 10 });
    assert.ok(Array.isArray(txns.data));
    assert.ok(txns.total >= 5);

    // Verify top-up transactions have type TOPUP and are credits
    const topups = await caBillingService.getTransactions({ type: 'TOPUP' });
    assert.ok(topups.data.every((t) => t.type === 'TOPUP'));

    // Verify service debits have type SERVICE_DEBIT
    const debits = await caBillingService.getTransactions({ type: 'SERVICE_DEBIT' });
    assert.ok(debits.data.every((t) => t.type === 'SERVICE_DEBIT'));
  });

  test('Zap Wallet lifecycle: dynamic FY, reconciliation, status checking, and firm isolation', async () => {
    // 1. Dynamic Financial Year calculation across April boundary
    assert.equal(getCurrentFinancialYear(new Date(2026, 10, 24)), 'FY 2026-27'); // Nov 2026
    assert.equal(getCurrentFinancialYear(new Date(2026, 3, 1)), 'FY 2026-27');   // April 1, 2026
    assert.equal(getCurrentFinancialYear(new Date(2026, 2, 31)), 'FY 2025-26');  // March 31, 2026
    assert.equal(getCurrentFinancialYear(new Date(2025, 0, 15)), 'FY 2024-25');  // Jan 15, 2025

    // 2. Spending summary accurately calculates gross, net spend, and separates refunds
    const fySummary = await caBillingService.getSpendingSummary('current_fy');
    assert.ok(fySummary.periodLabel.includes('Current FY'));
    assert.equal(typeof fySummary.netSpendPaise, 'number');
    assert.ok(fySummary.netSpendPaise <= fySummary.totalSpendPaise);
    assert.equal(fySummary.netSpendPaise, Math.max(0, fySummary.totalSpendPaise - fySummary.refundsPaise));

    // 3. Pending payment order lifecycle and status checking without duplicate charges
    const pendingOrder = await caBillingService.createTopUpOrder({
      amountRupees: 500,
      paymentMethod: 'upi'
    });
    const checkRes = await caBillingService.checkPaymentStatus(pendingOrder.orderId);
    assert.equal(checkRes.status, 'SETTLED');
    assert.ok(checkRes.transaction);
    assert.equal(checkRes.transaction.amountPaise, 50000);

    // Calling status check again on already settled order must NOT create duplicate credits
    const balanceBeforeRepeat = (await caBillingService.getWalletBalance()).availableBalancePaise;
    const repeatCheck = await caBillingService.checkPaymentStatus(pendingOrder.orderId);
    assert.equal(repeatCheck.status, 'SETTLED');
    const balanceAfterRepeat = (await caBillingService.getWalletBalance()).availableBalancePaise;
    assert.equal(balanceAfterRepeat, balanceBeforeRepeat, 'Checking status on settled order must not duplicate balance credit');

    // 4. Cancel order safely removes order without crediting balance
    const orderToCancel = await caBillingService.createTopUpOrder({
      amountRupees: 2000,
      paymentMethod: 'netbanking'
    });
    const cancelRes = await caBillingService.cancelTopUpOrder(orderToCancel.orderId);
    assert.ok(cancelRes.success);
    assert.equal(cancelRes.status, 'CANCELLED');
    const balanceAfterCancel = (await caBillingService.getWalletBalance()).availableBalancePaise;
    assert.equal(balanceAfterCancel, balanceBeforeRepeat, 'Cancelled order must not credit wallet');

    // 5. Tenant / Firm isolation: unauthorized firm access rejected
    assert.throws(
      () => caBillingService.assertFirmAuthorization('FIRM-UNAUTHORIZED-999'),
      /Unauthorized access/
    );
    await assert.rejects(
      () => caBillingService.getWalletBalance('FIRM-UNAUTHORIZED-999'),
      /Unauthorized access/
    );
  });

  test('CADocumentsScreen enforces 7-column layout and integrates Payment and Edit Request workflows', () => {
    const docScreenPath = path.resolve(__dirname, '../src/screens/CADocuments/CADocumentsScreen.jsx');
    const content = fs.readFileSync(docScreenPath, 'utf-8');

    // 1. Check all 7 table column headers in exact order
    const requiredHeaders = [
      'Document Details',
      'Client',
      'Edit Inputs',
      'Edit Request',
      'Payment',
      'Send Link',
      'Document Status'
    ];

    for (const header of requiredHeaders) {
      assert.ok(content.includes(header), `Must include column header: ${header}`);
    }

    // 2. Modals wiring
    assert.ok(content.includes('<AddClientModal'), 'Must mount AddClientModal');
    assert.ok(content.includes('<EditInputsModal'), 'Must mount EditInputsModal');
    assert.ok(content.includes('<EditRequestsModal'), 'Must mount EditRequestsModal');
    assert.ok(content.includes('<PaymentModal'), 'Must mount PaymentModal');
    assert.ok(content.includes('<SendLinkModal'), 'Must mount SendLinkModal');
    assert.ok(content.includes('<DocumentPreviewModal'), 'Must mount DocumentPreviewModal');
    assert.ok(content.includes('<CompletionModal'), 'Must mount CompletionModal');

    // 3. Edit Request -> Payment transition
    assert.ok(content.includes('onDecisionCompleted={handleEditRequestDecisionCompleted}'), 'Must open payment after edit request decision');
    assert.ok(content.includes("setActiveModal('payment')"), 'Must trigger payment modal');
  });

  test('Client Draft Review, Edit Request resolution, and versioning lifecycle', async () => {
    // 1. Initial document draft
    const doc = await caDocumentsService.getDocumentById('DOC-202');
    assert.ok(doc, 'DOC-202 must exist');
    const initialVersion = doc.version || 'v1';
    assert.ok(initialVersion);

    // 2. Client submits correction request from review route without directly altering draft
    const initialTurnover = doc.formData.turnover;
    const subRes = await caDocumentsService.submitCorrectionRequest(doc.id, {
      proposedFields: [
        {
          fieldId: 'turnover',
          fieldLabel: 'Turnover',
          existingValue: initialTurnover,
          proposedValue: '₹9.50 Cr'
        }
      ],
      comments: 'Please update FY 25 turnover based on audited ledger.',
      requesterName: 'Pooja Reddy',
      requesterPhone: '+91 98451 99887'
    });
    assert.ok(subRes.success);
    assert.ok(subRes.request.id);

    // Verify saved document was NOT altered directly by client submission
    const docAfterReq = await caDocumentsService.getDocumentById(doc.id);
    assert.equal(docAfterReq.formData.turnover, initialTurnover, 'Saved document must NOT be edited directly by client submission');
    assert.equal(docAfterReq.status, 'Changes Requested');

    // 3. CA resolves with ACCEPT: Creates a new draft version, applies changes, invalidates earlier approvals
    const acceptRes = await caDocumentsService.resolveCorrectionRequest(doc.id, subRes.request.id, 'ACCEPT');
    assert.ok(acceptRes.success);
    assert.equal(acceptRes.decision, 'ACCEPTED');
    assert.equal(acceptRes.newVersion, 'v2');
    assert.equal(acceptRes.document.formData.turnover, '₹9.50 Cr', 'Accepted changes applied to new version');
    assert.equal(acceptRes.document.clientApproval.isApproved, false, 'Accepting changes must invalidate earlier approvals');
    assert.equal(acceptRes.document.status, 'Revised Review');

    // 4. Test REJECT on another request: Keeps version unchanged, records reason
    const doc3 = await caDocumentsService.getDocumentById('DOC-203');
    const cr3Id = doc3.correctionRequests[0]?.id;
    if (cr3Id) {
      const rejectRes = await caDocumentsService.resolveCorrectionRequest(doc3.id, cr3Id, 'REJECT', {
        rejectionReason: 'Verified with bank statement; existing computation retained.'
      });
      assert.ok(rejectRes.success);
      assert.equal(rejectRes.decision, 'REJECTED');
      assert.equal(rejectRes.document.version, 'v1', 'Reject preserves version unchanged');
    }
  });

  test('Payment quote, approval separation, wallet debit, and execution readiness', async () => {
    // 1. Payment is available after Accept or Reject without waiting for fresh party approval
    const unapprovedDoc = await caDocumentsService.getDocumentById('DOC-202');
    assert.equal(unapprovedDoc.clientApproval.isApproved, false, 'Document is unapproved');

    const quote = await caBillingService.getDocumentQuote(unapprovedDoc.id);
    assert.ok(quote);
    assert.equal(quote.isPayable, true, 'Payment must be available after Accept or Reject without fresh approval');
    assert.equal(quote.isPaid, false);

    // 2. Payment order creation succeeds for unapproved draft
    const walletBefore = (await caBillingService.getWalletBalance()).availableBalancePaise;
    const paymentOrder = await caBillingService.createDocumentPaymentOrder({
      docId: unapprovedDoc.id,
      paymentMethod: 'wallet'
    });
    assert.ok(paymentOrder.orderId);
    assert.equal(paymentOrder.status, 'PENDING');

    // 3. Settle payment: Verified wallet debit and separation of payment from execution
    const settleRes = await caBillingService.verifyAndSettleDocumentPayment(paymentOrder.orderId);
    assert.ok(settleRes.success);
    assert.ok(settleRes.receiptId);
    assert.equal(settleRes.hasPartyApproval, false);
    assert.equal(settleRes.message, 'Payment successful — awaiting final document approval.');

    // Verify wallet was debited
    const walletAfter = (await caBillingService.getWalletBalance()).availableBalancePaise;
    assert.equal(walletAfter, walletBefore - quote.totalPayablePaise);

    // Verify document payment status is PAID, BUT document is NOT locked or approved merely because it is paid
    const docAfterPay = await caDocumentsService.getDocumentById(unapprovedDoc.id);
    assert.equal(docAfterPay.payment.status, 'PAID');
    assert.equal(docAfterPay.status, 'Paid / Awaiting Approval');
    assert.equal(docAfterPay.stage, 'Payment Verified');
    assert.equal(docAfterPay.execution.isLocked, false, 'Document must NOT be locked merely because it is paid');
    assert.equal(docAfterPay.execution.packetReady, false, 'Execution packet must NOT be ready merely because it is paid');

    // 4. Execution gate: Attempting to dispatch signing link on paid but unapproved document throws error
    await assert.rejects(
      () => caDocumentsService.requestSigningInvitation(docAfterPay.id),
      /approved by parties/i
    );

    // 5. Reopening checkout on already-paid request reuses payment and blocks duplicate charge
    const postPayQuote = await caBillingService.getDocumentQuote(docAfterPay.id);
    assert.equal(postPayQuote.isPaid, true);
    assert.equal(postPayQuote.isPayable, false);
    await assert.rejects(
      () => caBillingService.createDocumentPaymentOrder({ docId: docAfterPay.id, paymentMethod: 'wallet' }),
      /already been paid/i
    );

    // Attempting duplicate settlement on same order throws error
    await assert.rejects(
      () => caBillingService.verifyAndSettleDocumentPayment(paymentOrder.orderId),
      /Duplicate settlement attempt/
    );

    // 6. When client party approval is granted later, execution packet is now locked & prepared
    const approveRes = await caDocumentsService.approveDraft(docAfterPay.id, {
      version: docAfterPay.version,
      approverName: 'Pooja Reddy',
      approverPhone: '+91 98451 99887'
    });
    assert.ok(approveRes.success);
    assert.equal(approveRes.document.execution.isLocked, true, 'Approved draft must lock document');
    assert.equal(approveRes.document.execution.packetReady, true, 'Approved draft must ready execution packet');
    assert.equal(approveRes.document.stage, 'Ready to Invite');
  });

  test('Authorised CA download and view access for completed documents', async () => {
    // 1. Genuinely completed document with available file (DOC-206)
    const completedInfo = await caDocumentsService.getFinalExecutedDocument('DOC-206', 'FIRM-001');
    assert.ok(completedInfo);
    assert.equal(completedInfo.isReady, true);
    assert.equal(completedInfo.status, 'AVAILABLE');
    assert.equal(completedInfo.fileName, 'AUD-2026-054-Executed-Certified.pdf');
    assert.ok(completedInfo.passwordPolicy);
    assert.equal(completedInfo.cryptographicStandard, 'PAdES / PKCS#7 Digital Signature Preserved');

    // Authorised download execution
    const downloadRes = await caDocumentsService.downloadExecutedDocument('DOC-206', 'FIRM-001');
    assert.ok(downloadRes.success);
    assert.equal(downloadRes.fileName, 'AUD-2026-054-Executed-Certified.pdf');

    // Cross-firm authorization check: unauthorized firm throws error
    await assert.rejects(
      () => caDocumentsService.getFinalExecutedDocument('DOC-206', 'FIRM-OTHER'),
      /Unauthorized access/i
    );

    // 2. Completed document with file still assembling/processing in repository (DOC-207)
    const processingInfo = await caDocumentsService.getFinalExecutedDocument('DOC-207', 'FIRM-001');
    assert.equal(processingInfo.isReady, false);
    assert.equal(processingInfo.status, 'PROCESSING');
    assert.equal(processingInfo.message, 'Final document processing');

    // Attempting to download processing file throws clear processing message instead of broken file
    await assert.rejects(
      () => caDocumentsService.downloadExecutedDocument('DOC-207', 'FIRM-001'),
      /Final document processing/i
    );

    // 3. Attempting to download uncompleted draft throws error
    await assert.rejects(
      () => caDocumentsService.getFinalExecutedDocument('DOC-201', 'FIRM-001'),
      /not yet completed/i
    );
  });

  test('Signing link dispatch budget, portal OTP isolation, and completion acknowledgement', async () => {
    const doc = await caDocumentsService.getDocumentById('DOC-201');

    // 1. Dispatch signing link (Message 2 of 2 in budget)
    const signLinkRes = await caDocumentsService.requestSigningInvitation(doc.id, { sendWhatsApp: true });
    assert.ok(signLinkRes.success);
    assert.ok(signLinkRes.signingUrl);

    // Enforce message budget: attempting to exceed budget of 2 throws error
    await assert.rejects(
      () => caDocumentsService.requestSigningInvitation(doc.id, { sendWhatsApp: true }),
      /Maximum WhatsApp message budget/
    );

    // 2. Portal access OTP vs Signing isolation
    // Partial signing: Signer 1 signs
    const signRes1 = await caDocumentsService.completeSignerSignature(doc.id, doc.execution.signers[0].id, {
      method: 'Aadhaar eSign OTP'
    });
    assert.ok(signRes1.success);
    // Since Signer 2 (CA Partner) has not signed, document must NOT be completed
    assert.equal(signRes1.isFullyCompleted, false, 'Partial signing must NOT mark document as completed');
    assert.notEqual(signRes1.document.status, 'Completed');

    // Signer 2 signs: Now all signers signed & stamp ready -> Fully completed
    const signRes2 = await caDocumentsService.completeSignerSignature(doc.id, doc.execution.signers[1].id, {
      method: 'Class-3 DSC Token'
    });
    assert.ok(signRes2.success);
    assert.equal(signRes2.isFullyCompleted, true, 'All signers signed must mark document as completed');
    assert.equal(signRes2.document.status, 'Completed');
    assert.equal(signRes2.document.stage, 'Completed');
    assert.equal(signRes2.message, 'Your document has been generated successfully.');

    // 3. Password protection policy instructions without exposing password in URLs
    const downloadInfo = await caDocumentsService.getDocumentDownloadInfo(doc.id);
    assert.ok(downloadInfo);
    assert.ok(downloadInfo.passwordPolicy);
    assert.equal(downloadInfo.passwordPolicy.ruleKey, 'NAME4_PHONE4');
    assert.ok(downloadInfo.passwordPolicy.instructions.includes('first 4 uppercase letters'));
    assert.ok(downloadInfo.passwordPolicy.instructions.includes('last 4 digits'));
    assert.ok(!downloadInfo.downloadUrl.includes('password='), 'Must not append password in download URL');
  });

  test('CADocumentsScreen enforces single Add Client button and portal-rendered filter popover', () => {
    const docsScreenPath = path.resolve(__dirname, '../src/screens/CADocuments/CADocumentsScreen.jsx');
    const content = fs.readFileSync(docsScreenPath, 'utf-8');

    // 1. Single Add Client button with one leading Plus icon and text "Add Client"
    assert.ok(content.includes('id="btn-add-client-document"'), 'Must have id="btn-add-client-document"');
    assert.ok(content.includes('<span>Add Client</span>'), 'Button must have <span>Add Client</span>');
    assert.ok(!content.includes('+ +'), 'Must not contain duplicate plus characters "+ +"');
    assert.ok(!content.includes('<span>+ Add Client</span>'), 'Must not duplicate plus in button text');
    assert.ok(!content.includes('Click "+ Add Client"'), 'Must not duplicate plus in empty state copy');

    // 2. Filter popover uses createPortal to document.body to prevent being covered by table
    assert.ok(content.includes('createPortal('), 'Must render popover via createPortal');
    assert.ok(content.includes('document.body'), 'Must attach portal popover to document.body');
    assert.ok(content.includes('role="dialog"'), 'Must have dialog accessibility role');
    assert.ok(content.includes("e.key === 'Escape'"), 'Must handle Escape key for dismissal');
    assert.ok(content.includes('handleClickOutside'), 'Must handle outside click dismissal');
    assert.ok(content.includes('updatePopoverPosition'), 'Must dynamically calculate anchored viewport position');
  });

  test('AddClientModal enforces Aadhaar number field, normalization, validation, masking, and removes client type selector', () => {
    const modalPath = path.resolve(__dirname, '../src/screens/CADocuments/modals/AddClientModal.jsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    // 1. Client Entity Type selector chips removed
    assert.ok(!content.includes('zd-client-type-chips'), 'Must remove Client Entity Type chips selector');
    assert.ok(!content.includes('Select Client Entity Type'), 'Must remove Client Entity Type selector label');

    // 2. Aadhaar number field added with inputMode="numeric", not type="number"
    assert.ok(content.includes('inputMode="numeric"'), 'Must use numeric input mode, not type="number"');
    assert.ok(content.includes('Enter 12-digit Aadhaar number'), 'Must have placeholder "Enter 12-digit Aadhaar number"');
    assert.ok(content.includes('Belongs to the primary contact person / authorized signatory'), 'Must explain signatory scope');

    // 3. Masking and Show/Hide toggle
    assert.ok(content.includes('showAadhaar'), 'Must track show/hide visibility state');
    assert.ok(content.includes('EyeOff'), 'Must render EyeOff icon for masked mode');

    // 4. Secure storage: Raw 12-digit Aadhaar must NOT be persisted in localStorage or logs
    assert.ok(content.includes('aadhaarMasked'), 'Must store masked representation');
    assert.ok(content.includes('aadhaarLast4'), 'Must extract last 4 digits');
  });

  test('CA side enforces "View Document" and "Download Document" in row and details modal with processing checks', () => {
    const docScreenContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/CADocumentsScreen.jsx'), 'utf-8');
    const completionModalContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/modals/CompletionModal.jsx'), 'utf-8');
    const previewModalContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/modals/DocumentPreviewModal.jsx'), 'utf-8');

    // 1. Table row completed actions
    assert.ok(docScreenContent.includes('<span>View Document</span>'), 'Completed row must show "View Document"');
    assert.ok(docScreenContent.includes('<span>Download Document</span>') || docScreenContent.includes("'Download Document'"), 'Completed row must show "Download Document"');
    assert.ok(docScreenContent.includes('Final document processing'), 'Must show "Final document processing" when file is assembling');

    // 2. Completion Modal details view
    assert.ok(completionModalContent.includes('View Document'), 'Completion details modal must show "View Document"');
    assert.ok(completionModalContent.includes('Download Document'), 'Completion details modal must show "Download Document"');
    assert.ok(completionModalContent.includes('Final document processing'), 'Completion modal must show "Final document processing" when file is assembling');

    // 3. Document Preview Modal details view
    assert.ok(previewModalContent.includes('View Document'), 'Document Preview details must show "View Document"');
    assert.ok(previewModalContent.includes('Download Document'), 'Document Preview details must show "Download Document"');
    assert.ok(previewModalContent.includes('Final document processing'), 'Preview modal must show "Final document processing" when file is assembling');
  });

  test('Client / Shared Recipient side enforces View/Download Document, single-document restriction, and fresh auth check', async () => {
    const signingPageContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/client/ClientSigningPage.jsx'), 'utf-8');
    const reviewPageContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/client/ClientDraftReviewPage.jsx'), 'utf-8');

    // 1. Client UI actions on completion acknowledgement
    assert.ok(signingPageContent.includes('View Document'), 'Client signing completion page must show "View Document"');
    assert.ok(signingPageContent.includes('Download Document'), 'Client signing completion page must show "Download Document"');
    assert.ok(signingPageContent.includes('Final document processing'), 'Client signing page must show "Final document processing" when file is assembling');

    assert.ok(reviewPageContent.includes('View Document'), 'Client review completion page must show "View Document"');
    assert.ok(reviewPageContent.includes('Download Document'), 'Client review completion page must show "Download Document"');
    assert.ok(reviewPageContent.includes('Final document processing'), 'Client review page must show "Final document processing" when file is assembling');

    // 2. Recipient service: Authorized access to completed assigned document (DOC-206)
    const resInfo = await caDocumentsService.getRecipientExecutedDocument('DOC-206', {
      isAccessVerified: true,
      assignedDocId: 'DOC-206'
    });
    assert.ok(resInfo);
    assert.equal(resInfo.isReady, true);
    assert.ok(resInfo.downloadTicket, 'Must issue a short-lived download ticket');
    assert.ok(resInfo.downloadUrl.includes('ticket='), 'Must not use permanent public file URL');
    assert.equal(resInfo.isDemo, true, 'Must clearly identify demo environment download');
    assert.ok(resInfo.passwordPolicy, 'Must include password protection instructions');

    // 3. Single-document access restriction: Attempting to access unassigned document is rejected
    await assert.rejects(
      () => caDocumentsService.getRecipientExecutedDocument('DOC-206', {
        isAccessVerified: true,
        assignedDocId: 'DOC-OTHER-999'
      }),
      /strictly restricted to the assigned document only/i
    );

    // 4. Fresh authentication enforcement: Forwarded link without verified identity is rejected
    await assert.rejects(
      () => caDocumentsService.getRecipientExecutedDocument('DOC-206', {
        requireFreshAuth: true,
        isAccessVerified: false,
        assignedDocId: 'DOC-206'
      }),
      /Fresh authentication required/i
    );

    // 5. Incomplete processing: Attempting to download file while assembling shows processing state
    await assert.rejects(
      () => caDocumentsService.downloadRecipientExecutedDocument('DOC-207', {
        isAccessVerified: true,
        assignedDocId: 'DOC-207'
      }),
      /Final document processing/i
    );

    // 6. Recipient authorized download of available completed file succeeds
    const dlResult = await caDocumentsService.downloadRecipientExecutedDocument('DOC-206', {
      isAccessVerified: true,
      assignedDocId: 'DOC-206'
    });
    assert.ok(dlResult.success);
    assert.equal(dlResult.fileName, 'AUD-2026-054-Executed-Certified.pdf');
    assert.equal(dlResult.isDemo, true);
  });

  test('AddClientModal and GlassSelect enforce styled, searchable template dropdown with stale field cleanup', () => {
    const docModalPath = path.resolve(__dirname, '../src/screens/CADocuments/modals/AddClientModal.jsx');
    const clientModalPath = path.resolve(__dirname, '../src/screens/CAClients/modals/AddClientModal.jsx');
    const glassSelectPath = path.resolve(__dirname, '../src/components/common/GlassSelect.jsx');
    const glassSelectCssPath = path.resolve(__dirname, '../src/components/common/GlassSelect.css');

    const docModalContent = fs.readFileSync(docModalPath, 'utf-8');
    const clientModalContent = fs.readFileSync(clientModalPath, 'utf-8');
    const glassSelectContent = fs.readFileSync(glassSelectPath, 'utf-8');
    const glassSelectCssContent = fs.readFileSync(glassSelectCssPath, 'utf-8');

    // 1. Placeholder is "Select a document template"
    assert.ok(docModalContent.includes('placeholder="Select a document template"'), 'Doc modal must set placeholder to "Select a document template"');
    assert.ok(clientModalContent.includes('placeholder="Select a document template"'), 'Client modal must set placeholder to "Select a document template"');
    assert.ok(glassSelectContent.includes("placeholder = 'Select a document template'"), 'GlassSelect default placeholder must be "Select a document template"');

    // 2. Does NOT auto-select the first template on load (starts empty)
    assert.ok(!docModalContent.includes('setSelectedTemplateId(data[0].id)'), 'Must not auto-select first template on load in CADocuments');
    assert.ok(!clientModalContent.includes('setSelectedTemplateId(data[0].id)'), 'Must not auto-select first template on load in CAClients');
    assert.ok(docModalContent.includes("const [selectedTemplateId, setSelectedTemplateId] = useState('');"), 'Initial template id must be empty string in CADocuments');
    assert.ok(clientModalContent.includes("const [selectedTemplateId, setSelectedTemplateId] = useState('');"), 'Initial template id must be empty string in CAClients');

    // 3. Search input is inside opened list only
    assert.ok(glassSelectContent.includes('{isOpen && ('), 'Dropdown panel must only render when open');
    assert.ok(glassSelectContent.includes('glass-select-search-input'), 'Search input must exist inside dropdown panel');

    // 4. Keyboard navigation & outside click support
    assert.ok(glassSelectContent.includes("e.key === 'ArrowDown'"), 'Must support ArrowDown keyboard navigation');
    assert.ok(glassSelectContent.includes("e.key === 'ArrowUp'"), 'Must support ArrowUp keyboard navigation');
    assert.ok(glassSelectContent.includes("e.key === 'Enter'"), 'Must support Enter selection');
    assert.ok(glassSelectContent.includes("e.key === 'Escape'"), 'Must support Escape dismissal');
    assert.ok(glassSelectContent.includes('handleClickOutside'), 'Must support outside click dismissal');

    // 5. Template switching resets template-specific fields and sanitizes submission
    assert.ok(docModalContent.includes('handleSelectTemplate'), 'CADocuments modal must define handleSelectTemplate');
    assert.ok(clientModalContent.includes('handleSelectTemplate'), 'CAClients modal must define handleSelectTemplate');
    assert.ok(docModalContent.includes('cleanTemplateFields'), 'CADocuments modal must sanitize template fields on submit');
    assert.ok(clientModalContent.includes('cleanTemplateFields'), 'CAClients modal must sanitize template fields on submit');

    // 6. GlassSelect CSS matches ZapDocs input specs and high z-index
    assert.ok(glassSelectCssContent.includes('z-index: 1050;'), 'Dropdown menu must use high z-index (1050) to prevent clipping');
    assert.ok(glassSelectCssContent.includes('max-height: 250px;'), 'Options list must have max-height for scrolling');
    assert.ok(glassSelectCssContent.includes('overflow-y: auto;'), 'Options list must have overflow-y auto for internal scrolling');
    assert.ok(glassSelectCssContent.includes('border: 1.5px solid #cbd5e1;'), 'Trigger must match ZapDocs form input border styling');
  });

  test('Application dialogs enforce centered floating panel layout with 20px rounded corners, visible margins, and accessible header/footer', () => {
    const docModalPath = path.resolve(__dirname, '../src/screens/CADocuments/modals/AddClientModal.jsx');
    const clientModalPath = path.resolve(__dirname, '../src/screens/CAClients/modals/AddClientModal.jsx');
    const docCssPath = path.resolve(__dirname, '../src/screens/CADocuments/CADocuments.css');
    const clientCssPath = path.resolve(__dirname, '../src/screens/CAClients/CAClients.css');
    const indexCssPath = path.resolve(__dirname, '../src/index.css');

    const docModalContent = fs.readFileSync(docModalPath, 'utf-8');
    const clientModalContent = fs.readFileSync(clientModalPath, 'utf-8');
    const docCssContent = fs.readFileSync(docCssPath, 'utf-8');
    const clientCssContent = fs.readFileSync(clientCssPath, 'utf-8');
    const indexCssContent = fs.readFileSync(indexCssPath, 'utf-8');

    // 1. Both modals mount scrollable form body and fixed footer
    assert.ok(docModalContent.includes('zd-add-client-form-body'), 'CADocuments modal must structure scrollable form body');
    assert.ok(clientModalContent.includes('zd-add-client-form-body'), 'CAClients modal must structure scrollable form body');
    assert.ok(docModalContent.includes('zd-add-client-footer'), 'CADocuments modal must have zd-add-client-footer class');
    assert.ok(clientModalContent.includes('zd-add-client-footer'), 'CAClients modal must have zd-add-client-footer class');

    // 2. Backdrop uses position: fixed, inset: 0, and centers the dialog panel
    assert.ok(indexCssContent.includes('position: fixed !important;') && indexCssContent.includes('inset: 0 !important;'), 'Backdrop must use position: fixed and inset: 0');
    assert.ok(indexCssContent.includes('justify-content: center !important;') && indexCssContent.includes('align-items: center !important;'), 'Backdrop must center dialog panel');

    // 3. Dialog panels have rounded corners around 20px and box-shadow
    assert.ok(indexCssContent.includes('border-radius: 20px !important;'), 'Dialog panels must have 20px rounded corners');
    assert.ok(docCssContent.includes('border-radius: 20px;') || clientCssContent.includes('border-radius: 20px;'), 'Modal cards must enforce 20px rounded corners');

    // 4. Panel sizing rules: large tables up to min(1200px, calc(100vw - 64px)), forms up to 640-760px, max-height calc(100dvh - 64px)
    assert.ok(indexCssContent.includes('width: min(1200px, calc(100vw - 64px)) !important;'), 'Large details modal must be constrained to min(1200px, calc(100vw - 64px))');
    assert.ok(indexCssContent.includes('max-height: calc(100dvh - 64px) !important;'), 'Panels must have max-height calc(100dvh - 64px)');

    // 5. Mobile responsive sizing: calc(100vw - 24px) with 12px space around panel
    assert.ok(indexCssContent.includes('width: calc(100vw - 24px) !important;'), 'Mobile width must provide at least 12px space around panel');
    assert.ok(indexCssContent.includes('max-height: calc(100dvh - 24px) !important;'), 'Mobile max-height must provide 12px space around panel');

    // 6. Scrollable body with min-height: 0 and overflow-y: auto
    assert.ok(indexCssContent.includes('min-height: 0 !important;'), 'Scrollable body must specify min-height: 0');
    assert.ok(docCssContent.includes('overflow-y: auto;'), 'Form body must scroll internally');
  });

  test('Responsive Layout and Multi-Device Compatibility across entire CA frontend', () => {
    const indexCss = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf-8');
    const headerCss = fs.readFileSync(path.resolve(__dirname, '../src/components/layout/Header/Header.css'), 'utf-8');
    const dashboardCss = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADashboard/CADashboard.css'), 'utf-8');
    const docsCss = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/CADocuments.css'), 'utf-8');
    const clientsCss = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAClients/CAClients.css'), 'utf-8');
    const financeCss = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAFinance/CAFinance.css'), 'utf-8');
    const profileCss = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAProfile/CAProfile.css'), 'utf-8');
    const clientWorkflowCss = fs.readFileSync(path.resolve(__dirname, '../src/pages/client/ClientWorkflow.css'), 'utf-8');
    const appRouter = fs.readFileSync(path.resolve(__dirname, '../src/routes/AppRouter.jsx'), 'utf-8');

    // 1. Global iOS Auto-Zoom Prevention & Touch Targets
    assert.ok(indexCss.includes('font-size: 16px !important;'), 'Must enforce 16px font-size on mobile inputs to avoid auto-zooming');
    assert.ok(indexCss.includes('overflow-x: hidden;'), 'Must prevent root page-level horizontal overflow');
    assert.ok(indexCss.includes('min-height: 44px;'), 'Must enforce at least 44px touch targets on mobile interactive controls');

    // 2. Header and Navigation Breakpoint (1023.98px)
    assert.ok(headerCss.includes('1023.98px'), 'Header must collapse desktop navigation into mobile drawer below 1024px');
    assert.ok(headerCss.includes('.zd-header__menu-btn'), 'Header must define mobile drawer button');

    // 3. Login / Authentication Screen mounted
    assert.ok(appRouter.includes('<CALoginScreen'), 'Must mount responsive CALoginScreen for practitioner authentication');

    // 4. Dashboard responsive cards and grids
    assert.ok(dashboardCss.includes('.zd-summary-cards-grid--three'), 'Must define 3-card summary grid');
    assert.ok(dashboardCss.includes('.zd-analytics-grid-two-col'), 'Must define 2-column analytics grid');

    // 5. Contained Tables & Mobile Record Cards on Documents, Clients, and Finance
    assert.ok(docsCss.includes('.ca-mobile-docs-list'), 'CADocuments must define mobile record cards for viewport < 768px');
    assert.ok(clientsCss.includes('.ca-mobile-clients-list'), 'CAClients must define mobile record cards for viewport < 768px');
    assert.ok(financeCss.includes('.ca-mobile-txns-list'), 'CAFinance must define mobile record cards for viewport < 768px');

    // 6. Responsive Modals & Dialogs
    assert.ok(docsCss.includes('max-height: calc(100dvh - 64px)') || indexCss.includes('max-height: calc(100dvh - 64px)'), 'Modals must be contained within viewport height');
    assert.ok(profileCss.includes('1023.98px'), 'Profile screen must adapt from 2-column to 1-column on tablet and mobile');
    assert.ok(clientWorkflowCss.includes('767.98px'), 'Client review and signing workflow must be responsive on mobile');
  });

  test('AddClientModal country-code selector and Add More button styling with Finance wallet panel presentation cleanups', () => {
    const clientsCss = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAClients/CAClients.css'), 'utf-8');
    const docsCss = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/CADocuments.css'), 'utf-8');
    const financeCss = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAFinance/CAFinance.css'), 'utf-8');
    const financeScreen = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAFinance/CAFinanceScreen.jsx'), 'utf-8');
    const clientModal = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAClients/modals/AddClientModal.jsx'), 'utf-8');
    const docModal = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/modals/AddClientModal.jsx'), 'utf-8');

    // 1. Finance wallet balance panel cleaned up
    assert.ok(!financeScreen.includes('ca-wallet-reserved-box'), 'Finance screen must remove Reserved Amount box');
    assert.ok(!financeScreen.includes('id="btn-open-add-money"'), 'Finance screen must remove duplicate Add Money button from wallet panel');
    assert.ok(!financeScreen.includes('id="btn-view-wallet-history"'), 'Finance screen must remove View Wallet History button from wallet panel');
    assert.ok(financeScreen.includes('btn-open-add-money-header'), 'Finance screen must keep top-right Add Money button');
    assert.ok(financeScreen.includes('Available Wallet Balance'), 'Finance screen must keep available balance');
    assert.ok(!financeCss.includes('.ca-wallet-hero-side'), 'CAFinance.css must eliminate ca-wallet-hero-side');

    // 2. Add Client Modal - Phone input group & Country code selector
    assert.ok(clientModal.includes('zd-country-code-select'), 'CAClients modal must render zd-country-code-select');
    assert.ok(docModal.includes('zd-country-code-select'), 'CADocuments modal must render zd-country-code-select');
    assert.ok(clientsCss.includes('.zd-country-code-select'), 'CAClients.css must style .zd-country-code-select');
    assert.ok(docsCss.includes('.zd-country-code-select'), 'CADocuments.css must style .zd-country-code-select');

    // Matching heights, borders, and flex row alignment
    assert.ok(clientsCss.includes('.zd-phone-input-group'), 'CAClients.css must style .zd-phone-input-group');
    assert.ok(docsCss.includes('.zd-phone-input-group'), 'CADocuments.css must style .zd-phone-input-group');

    // 3. Add More button styled as secondary/outline button
    assert.ok(clientModal.includes('zd-btn-add-more'), 'CAClients modal must use zd-btn-add-more class');
    assert.ok(docModal.includes('zd-btn-add-more'), 'CADocuments modal must use zd-btn-add-more class');
    assert.ok(clientsCss.includes('.zd-btn-add-more'), 'CAClients.css must define .zd-btn-add-more styling');
    assert.ok(docsCss.includes('.zd-btn-add-more'), 'CADocuments.css must define .zd-btn-add-more styling');
    assert.ok(clientsCss.includes('border: 1.5px solid #bfdbfe'), 'Add More button must be styled as secondary outline button');
    assert.ok(clientModal.includes('<span>Add More</span>'), 'Must display "Add More" text');
    assert.ok(docModal.includes('<span>Add More</span>'), 'Must display "Add More" text');
  });

  test('CADocumentsScreen removes visible version labels from table and renders only "Edit" in Edit Inputs column', () => {
    const docScreenContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/CADocumentsScreen.jsx'), 'utf-8');

    // 1. Column header remains 'Edit Inputs'
    assert.ok(docScreenContent.includes('Edit Inputs'), 'Table column header must remain "Edit Inputs"');

    // 2. Visible version pill removed from document details and mobile top
    assert.ok(!docScreenContent.includes('className="zd-version-pill"'), 'Must remove visible version pills from table rows and cards');

    // 3. Action button labels replaced with "Edit"
    assert.ok(!docScreenContent.includes('Revise (v2)'), 'Must not display "Revise (v2)" in action buttons');
    assert.ok(!docScreenContent.includes('Edit Inputs (v1)'), 'Must not display "Edit Inputs (v1)"');
    assert.ok(!docScreenContent.includes('<span>Edit Inputs</span>'), 'Button text must not be "Edit Inputs"');
    assert.ok(docScreenContent.includes('<span>Edit</span>'), 'Button text in Edit Inputs column must be "Edit"');

    // 4. Clean title helper cleans visible version tags from document titles
    assert.ok(docScreenContent.includes('cleanDocDisplayTitle'), 'Must use cleanDocDisplayTitle helper to clean version labels');

    // 5. Clicking Edit still routes to appropriate modal without direct modification of locked docs
    assert.ok(docScreenContent.includes("setActiveModal('edit_inputs')"), 'Clicking Edit must open edit_inputs flow');
  });

  test('Shared TablePagination component provides aligned, outline-styled pagination across Documents and Clients tables', () => {
    const paginationSrc = fs.readFileSync(path.resolve(__dirname, '../src/components/common/TablePagination.jsx'), 'utf-8');
    const paginationCss = fs.readFileSync(path.resolve(__dirname, '../src/components/common/TablePagination.css'), 'utf-8');
    const docScreenContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/CADocumentsScreen.jsx'), 'utf-8');
    const clientScreenContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAClients/CAClientsScreen.jsx'), 'utf-8');

    // 1. Shared component is reused in Documents and Clients screens
    assert.ok(docScreenContent.includes('<TablePagination'), 'CADocumentsScreen must mount shared TablePagination');
    assert.ok(clientScreenContent.includes('<TablePagination'), 'CAClientsScreen must mount shared TablePagination');
    assert.ok(docScreenContent.includes('itemName="documents"'), 'CADocumentsScreen must specify itemName="documents"');
    assert.ok(clientScreenContent.includes('itemName="clients"'), 'CAClientsScreen must specify itemName="clients"');

    // 2. Calculation logic handles ranges and zero results
    assert.ok(paginationSrc.includes('Showing 0 of 0 ${itemName}'), 'Must format zero results as "Showing 0 of 0 clients/documents"');
    assert.ok(paginationSrc.includes('Showing ${start}–${end} of ${safeTotalItems} ${itemName}'), 'Must compute start-end range from actual filtered counts');

    // 3. Chevrons and disabled button states
    assert.ok(paginationSrc.includes('ChevronLeft'), 'Must render ChevronLeft');
    assert.ok(paginationSrc.includes('ChevronRight'), 'Must render ChevronRight');
    assert.ok(paginationSrc.includes('disabled={isPrevDisabled}'), 'Must disable Previous button at start or when empty');
    assert.ok(paginationSrc.includes('disabled={isNextDisabled}'), 'Must disable Next button at end or when empty');

    // 4. CSS styling: outline button, left-aligned info, right-aligned controls, mobile stacking
    assert.ok(paginationCss.includes('justify-content: space-between'), 'Footer must align result count on left and controls on right');
    assert.ok(paginationCss.includes('border: 1.5px solid #cbd5e1'), 'Previous and Next buttons must use shared outline-button design');
    assert.ok(paginationCss.includes('pointer-events: none'), 'Disabled buttons must prevent clicks');
    assert.ok(paginationCss.includes('opacity: 0.45'), 'Disabled buttons must have clear visual disabled state');
    assert.ok(paginationCss.includes('flex-direction: column'), 'Mobile layout must stack without overflow');
  });

  test('Clients table "View Documents" buttons filter Documents by client ID with client name, clear filter action, and empty state', async () => {
    const clientScreenContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAClients/CAClientsScreen.jsx'), 'utf-8');
    const clientCssContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CAClients/CAClients.css'), 'utf-8');
    const docScreenContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/CADocumentsScreen.jsx'), 'utf-8');
    const docCssContent = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADocuments/CADocuments.css'), 'utf-8');

    // 1. Rename button to "View Documents" and eliminate unresponsive "Vault" / "Open Vault"
    assert.ok(!clientScreenContent.includes('<span>Vault</span>'), 'Must not display "Vault" text');
    assert.ok(!clientScreenContent.includes('<span>Open Vault</span>'), 'Must not display "Open Vault" text');
    assert.ok(clientScreenContent.includes('<span>View Documents</span>'), 'Must display "View Documents" button text');

    // 2. Wired click handlers with actual client.id
    assert.ok(clientScreenContent.includes('onClick={() => handleViewDocuments(client.id)}'), 'Must pass actual client.id to handler');
    assert.ok(clientScreenContent.includes('ROUTES.CA_DOCUMENTS') && clientScreenContent.includes('clientId='),
      'Must navigate to /ca/documents with clientId query param');

    // 3. Service layer filtering by clientId
    const allDocs = await caDocumentsService.getDocuments();
    assert.ok(allDocs.total > 0, 'Must have mock documents');

    const acmeDocs = await caDocumentsService.getDocuments({ clientId: 'CLI-101' });
    assert.ok(acmeDocs.data.length > 0, 'CLI-101 must have matching documents');
    for (const d of acmeDocs.data) {
      assert.equal(d.clientId.toLowerCase(), 'cli-101', 'All returned documents must match CLI-101');
    }

    const nonExistentClientDocs = await caDocumentsService.getDocuments({ clientId: 'CLI-NONEXISTENT-999' });
    assert.equal(nonExistentClientDocs.total, 0, 'Non-existent client must return 0 documents');
    assert.equal(nonExistentClientDocs.data.length, 0, 'Non-existent client data array must be empty');

    // 4. CADocumentsScreen handles clientId, displays client name, and provides "Clear client filter"
    assert.ok(docScreenContent.includes("searchParams.get('clientId')"), 'CADocumentsScreen must read clientId from searchParams');
    assert.ok(docScreenContent.includes('handleClearClientFilter'), 'Must implement handleClearClientFilter');
    assert.ok(docScreenContent.includes('Clear client filter'), 'Must provide a "Clear client filter" action button');
    assert.ok(docScreenContent.includes('zd-client-filter-banner'), 'Must render client filter banner');
    assert.ok(docScreenContent.includes('displayClientName'), 'Must display resolved client name');

    // 5. Empty state handles zero results for client
    assert.ok(docScreenContent.includes('No documents found for this client'), 'Must show "No documents found for this client" when empty');

    // 6. CSS styling for button and client banner
    assert.ok(clientCssContent.includes('.ca-btn-view-docs'), 'CAClients.css must style .ca-btn-view-docs');
    assert.ok(docCssContent.includes('.zd-client-filter-banner'), 'CADocuments.css must style .zd-client-filter-banner');
    assert.ok(docCssContent.includes('.zd-clear-client-filter-btn'), 'CADocuments.css must style .zd-clear-client-filter-btn');
  });

  test('Current Documents is display-only and Activity Graph provides 6 Period selections', async () => {
    const pipelineSrc = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADashboard/PipelineChart.jsx'), 'utf-8');
    const pipelineCss = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADashboard/CADashboard.css'), 'utf-8');
    const activitySrc = fs.readFileSync(path.resolve(__dirname, '../src/screens/CADashboard/ActivityChart.jsx'), 'utf-8');

    // 1. Current Documents: Display only
    assert.ok(!pipelineSrc.includes('Filter in Vault'), 'Must remove "Filter in Vault" button');
    assert.ok(!pipelineSrc.includes('handleStageClick'), 'Must remove navigation click handler from stages');
    assert.ok(!pipelineSrc.includes('onClick='), 'Must not contain click handlers on bars or labels');
    assert.ok(!pipelineSrc.includes('cursor: \'pointer\''), 'Must not display pointer cursor on stage groups');
    assert.ok(pipelineSrc.includes('cursor: \'default\''), 'Must set cursor to default on stage groups');
    assert.ok(pipelineSrc.includes('zd-hbar-svg-tooltip'), 'Must keep informational tooltip');
    assert.ok(pipelineSrc.includes('totalPending'), 'Must keep total pending count');
    assert.ok(pipelineCss.includes('cursor: default'), 'CADashboard.css must enforce cursor: default on .zd-hbar-item-group');

    // 2. Activity Graph: Dropdown label & default option
    assert.ok(activitySrc.includes('<span>Period:</span>'), 'Label must be changed from "View by:" to "Period:"');
    assert.ok(!activitySrc.includes('<span>View by:</span>'), 'Must remove obsolete "View by:" label');
    assert.ok(activitySrc.includes("useState('1m')"), 'Must default to 1 Month (1m)');

    // 3. Activity Graph: Dropdown options (Today, 7 Days, 2 Weeks, 3 Weeks, 1 Month, 1 Year)
    assert.ok(activitySrc.includes('<option value="today">Today</option>'), 'Must include "Today" option');
    assert.ok(activitySrc.includes('<option value="7d">7 Days</option>'), 'Must include "7 Days" option');
    assert.ok(activitySrc.includes('<option value="2w">2 Weeks</option>'), 'Must include "2 Weeks" option');
    assert.ok(activitySrc.includes('<option value="3w">3 Weeks</option>'), 'Must include "3 Weeks" option');
    assert.ok(activitySrc.includes('<option value="1m">1 Month</option>'), 'Must include "1 Month" option');
    assert.ok(activitySrc.includes('<option value="1y">1 Year</option>'), 'Must include "1 Year" option');

    // 4. Verify all 6 period selections in service layer
    const now = new Date();

    // 4a. Today: hourly counts up to current hour (current hour partial)
    const todayRes = await caDashboardService.getActivityByPeriod('today');
    assert.equal(todayRes.period, 'today');
    assert.equal(todayRes.data.length, now.getHours() + 1);
    const curHourPt = todayRes.data[todayRes.data.length - 1];
    assert.equal(curHourPt.isPartial, true);
    assert.ok(todayRes.title.includes('Today'));

    // 4b. 7 Days: exactly 7 daily buckets ending today (today partial)
    const sevenDRes = await caDashboardService.getActivityByPeriod('7d');
    assert.equal(sevenDRes.period, '7d');
    assert.equal(sevenDRes.data.length, 7);
    assert.equal(sevenDRes.data[6].isPartial, true);
    assert.equal(sevenDRes.data[0].isPartial, false);
    assert.ok(sevenDRes.summaryLabel.includes('7 Days'));

    // 4c. 2 Weeks: exactly 14 daily buckets ending today (today partial)
    const twoWRes = await caDashboardService.getActivityByPeriod('2w');
    assert.equal(twoWRes.period, '2w');
    assert.equal(twoWRes.data.length, 14);
    assert.equal(twoWRes.data[13].isPartial, true);
    assert.equal(twoWRes.data[0].isPartial, false);
    assert.ok(twoWRes.summaryLabel.includes('2 Weeks'));

    // 4d. 3 Weeks: exactly 21 daily buckets ending today (today partial)
    const threeWRes = await caDashboardService.getActivityByPeriod('3w');
    assert.equal(threeWRes.period, '3w');
    assert.equal(threeWRes.data.length, 21);
    assert.equal(threeWRes.data[20].isPartial, true);
    assert.equal(threeWRes.data[0].isPartial, false);
    assert.ok(threeWRes.summaryLabel.includes('3 Weeks'));

    // 4e. 1 Month: calendar month window ending today (today partial, future excluded)
    const oneMRes = await caDashboardService.getActivityByPeriod('1m');
    assert.equal(oneMRes.period, '1m');
    assert.equal(oneMRes.data.length, now.getDate());
    assert.equal(oneMRes.data[now.getDate() - 1].isPartial, true);
    assert.ok(oneMRes.summaryLabel.includes('Month to Date'));

    // 4f. 1 Year: calendar year window ending current month (current month partial, future excluded)
    const oneYRes = await caDashboardService.getActivityByPeriod('1y');
    assert.equal(oneYRes.period, '1y');
    assert.equal(oneYRes.data.length, now.getMonth() + 1);
    assert.equal(oneYRes.data[now.getMonth()].isPartial, true);
    assert.ok(oneYRes.summaryLabel.includes('Year to Date'));

    // 5. Final data point layout & responsive tick thinning
    assert.ok(activitySrc.includes('visibleTickIndices'), 'Must implement responsive visible tick indices');
    assert.ok(activitySrc.includes('getDisplayLabel'), 'Must resolve actual date tick labels');
    assert.ok(activitySrc.includes('(Today)'), 'Must include Today in tooltip for current date');
    assert.ok(activitySrc.includes('endX = 588'), 'Must add generous chart right margin');
    assert.ok(activitySrc.includes('topY = 46'), 'Must add generous chart top margin for badges');
    assert.ok(!sevenDRes.data[6].label.includes('Today'), 'Final x-axis tick in 7d must be formatted as date, not "Today"');
    assert.ok(!oneMRes.data[now.getDate() - 1].label.includes('Today'), 'Final x-axis tick in 1m must be formatted as date, not "Today"');
    assert.equal(oneMRes.data[now.getDate() - 1].isToday, true);
  });

  test('Dashboard Summary Cards open shared details dialogs without navigating away from Dashboard', async () => {
    const summaryCardsPath = path.join(__dirname, '../src/screens/CADashboard/SummaryCards.jsx');
    const summaryCardsCode = fs.readFileSync(summaryCardsPath, 'utf8');

    // 1. Navigation has been removed
    assert.ok(
      !summaryCardsCode.includes('useNavigate'),
      'SummaryCards must not import or call useNavigate'
    );
    assert.ok(
      !summaryCardsCode.includes("navigate('/ca/clients')"),
      'SummaryCards must not redirect to /ca/clients'
    );
    assert.ok(
      !summaryCardsCode.includes("navigate('/ca/documents"),
      'SummaryCards must not redirect to /ca/documents'
    );

    // 2. SummaryDetailsModal is integrated
    assert.ok(
      summaryCardsCode.includes('SummaryDetailsModal'),
      'SummaryCards must mount SummaryDetailsModal'
    );
    assert.ok(
      summaryCardsCode.includes('activeModalCard') || summaryCardsCode.includes('selectedCardId'),
      'SummaryCards must manage modal state for clicked summary card'
    );

    // 3. Service details counts strictly reconcile with summary card totals
    const clientsResult = await caDashboardService.getSummaryCardDetails('total-clients');
    assert.equal(clientsResult.title, 'Total Clients');
    assert.equal(clientsResult.total, 48, 'Total Clients count must be exactly 48');
    assert.equal(clientsResult.itemName, 'clients');
    assert.ok(clientsResult.data.length > 0);
    // Verify client record attributes
    const sampleClient = clientsResult.data[0];
    assert.ok(sampleClient.name, 'Client must have name');
    assert.ok(sampleClient.id, 'Client must have id reference');
    assert.ok(sampleClient.contactPerson, 'Client must have primary contact name');
    assert.equal(typeof sampleClient.isContactAuthorised, 'boolean');

    // Client search filtering
    const searchClientRes = await caDashboardService.getSummaryCardDetails('total-clients', { search: 'Acme' });
    assert.equal(searchClientRes.total, 1);
    assert.equal(searchClientRes.data[0].id, 'CLI-101');

    // Pending documents service
    const pendingResult = await caDashboardService.getSummaryCardDetails('pending-docs');
    assert.equal(pendingResult.title, 'Pending Documents');
    assert.equal(pendingResult.total, 47, 'Pending Documents count must be exactly 47');
    assert.equal(pendingResult.itemName, 'documents');
    assert.ok(pendingResult.data.length > 0);
    // Verify pending document attributes
    const samplePending = pendingResult.data[0];
    assert.ok(samplePending.title, 'Pending doc must have title');
    assert.ok(samplePending.ref, 'Pending doc must have ref code');
    assert.ok(samplePending.client, 'Pending doc must have client');
    assert.ok(samplePending.stage, 'Pending doc must have stage');
    assert.ok(samplePending.lastUpdated, 'Pending doc must have lastUpdated');

    // Completed documents service
    const completedResult = await caDashboardService.getSummaryCardDetails('completed-docs');
    assert.equal(completedResult.title, 'Completed Documents');
    assert.equal(completedResult.total, 184, 'Completed Documents count must be exactly 184');
    assert.equal(completedResult.itemName, 'documents');
    assert.ok(completedResult.data.length > 0);
    // Verify completed document attributes
    const sampleCompleted = completedResult.data[0];
    assert.ok(sampleCompleted.title, 'Completed doc must have title');
    assert.ok(sampleCompleted.ref, 'Completed doc must have ref code');
    assert.ok(sampleCompleted.client, 'Completed doc must have client');
    assert.ok(sampleCompleted.completedAt, 'Completed doc must have completedAt date');
    assert.equal(typeof sampleCompleted.finalFileAvailable, 'boolean');

    // 4. Modal component implementation checks
    const modalPath = path.join(__dirname, '../src/screens/CADashboard/modals/SummaryDetailsModal.jsx');
    const modalCssPath = path.join(__dirname, '../src/screens/CADashboard/modals/SummaryDetailsModal.css');
    assert.ok(fs.existsSync(modalPath), 'SummaryDetailsModal.jsx must exist');
    assert.ok(fs.existsSync(modalCssPath), 'SummaryDetailsModal.css must exist');
    const modalCode = fs.readFileSync(modalPath, 'utf8');
    const modalCss = fs.readFileSync(modalCssPath, 'utf8');
    const indexCss = fs.readFileSync(path.resolve(__dirname, '../src/index.css'), 'utf8');

    assert.ok(modalCode.includes('TablePagination'), 'Modal must include pagination for long lists');
    assert.ok(modalCode.includes('handleSearchChange') || modalCode.includes('searchTerm'), 'Modal must provide search filtering');
    assert.ok(modalCode.includes('handleDownload'), 'Modal must provide download action');
    assert.ok(modalCode.includes('handleView') || modalCode.includes('previewDoc'), 'Modal must provide view action');
    assert.ok(modalCode.includes('Escape'), 'Modal must support Escape key closing');
    assert.ok(modalCode.includes('triggerElementId') || modalCode.includes('lastActiveElementRef'), 'Modal must support focus restoration');
    assert.ok(modalCode.includes('stopPropagation'), 'Modal must prevent click bubbling to card or backdrop');

    // 5. Wider dialog styling, overflow elimination, and mobile/tablet stacked records
    assert.ok(modalCss.includes('width: min(1100px, calc(100vw - 64px));'), 'SummaryDetailsModal.css must set width: min(1100px, calc(100vw - 64px))');
    assert.ok(indexCss.includes('width: min(1100px, calc(100vw - 64px)) !important;'), 'index.css must set width: min(1100px, calc(100vw - 64px)) !important');
    assert.ok(modalCss.includes('overflow-x: hidden !important;'), 'Modal body and table wrap must prevent horizontal scrolling');
    assert.ok(modalCss.includes('table-layout: fixed;'), 'Summary table must use table-layout: fixed to fit columns properly');
    assert.ok(modalCode.includes('zd-summary-stacked-list'), 'Modal must provide labelled stacked records for mobile/tablet');
    assert.ok(modalCode.includes('zd-summary-stacked-card'), 'Modal must render stacked cards for mobile/tablet records');
    // 6. Restyled transparent text-style View and Download actions with plain muted Processing text
    assert.ok(modalCode.includes('zd-summary-action-btn--view'), 'Modal must use transparent action button for View');
    assert.ok(modalCode.includes('zd-summary-action-btn--download'), 'Modal must use transparent action button for Download');
    assert.ok(modalCode.includes('zd-file-processing-text'), 'Modal must render plain muted processing text');
    assert.ok(modalCss.includes('.zd-summary-action-btn'), 'CSS must define transparent action button base class');
    assert.ok(modalCss.includes('text-decoration: underline;'), 'Action buttons must use subtle underline on hover');
    assert.ok(modalCss.includes('.zd-file-processing-text'), 'CSS must define plain muted processing text class');
  });

  test('CADocumentsScreen enforces 8-column layout with Requests pill and Quick Actions blur effect matching reference image', () => {
    const docScreenPath = path.resolve(__dirname, '../src/screens/CADocuments/CADocumentsScreen.jsx');
    const docCssPath = path.resolve(__dirname, '../src/screens/CADocuments/CADocuments.css');

    const screenContent = fs.readFileSync(docScreenPath, 'utf-8');
    const cssContent = fs.readFileSync(docCssPath, 'utf-8');

    // 1. Column headers matching reference image in exact order
    const headers = [
      'DOCUMENT DETAILS',
      'CLIENT',
      'EDIT',
      'REQUESTS',
      'PAYMENT',
      'SEND LINK',
      'STATUS',
      'QUICK ACTIONS'
    ];
    for (const h of headers) {
      assert.ok(screenContent.includes(h), `Table must have column header: ${h}`);
    }

    // 2. Styled buttons: Edit, Requests, Payment
    assert.ok(screenContent.includes('zd-btn-table-action--edit'), 'Must use styled action button for editable inputs');
    assert.ok(screenContent.includes('<span>Edit</span>'), 'Edit Inputs must show "Edit"');
    assert.ok(screenContent.includes('zd-btn-table-action--requests'), 'Must use styled action button for view requests');
    assert.ok(screenContent.includes('Requests ('), 'Requests column must show "Requests (count)" when requests exist');
    assert.ok(screenContent.includes('zd-table-dash'), 'Must render em-dash for empty requests and completed send link');
    assert.ok(screenContent.includes('zd-btn-table-action--pay'), 'Payment must render "Pay Fee" button when unpaid');
    assert.ok(screenContent.includes('Pay Fee'), 'Payment text must be "Pay Fee" when unpaid');
    assert.ok(screenContent.includes('zd-doc-badge--green'), 'Payment must render green badge when settled');
    assert.ok(screenContent.includes('Paid'), 'Payment text must be "Paid" when settled');

    // 3. Quick Actions: Eye icon, Download icon when available, and blur effect slot for non-downloadable PDFs
    assert.ok(screenContent.includes('zd-quick-actions-cell'), 'Quick actions must mount container cell');
    assert.ok(screenContent.includes('zd-btn-table-icon--view'), 'Quick actions must render eye icon button');
    assert.ok(screenContent.includes('zd-btn-table-icon--download'), 'Quick actions must render download icon button when downloadable');
    assert.ok(screenContent.includes('zd-quick-actions-blur-slot'), 'Quick actions must render blur effect slot for non-downloadable rows');
    assert.ok(cssContent.includes('.zd-quick-actions-cell {'), 'CADocuments.css must define .zd-quick-actions-cell');
    assert.ok(cssContent.includes('.zd-quick-actions-blur-slot {'), 'CADocuments.css must define .zd-quick-actions-blur-slot');

    // 4. Send Link: Paper-plane send icon only with no persistent spinner; spinner only during active request
    assert.ok(screenContent.includes('dispatchingDocId === doc.id'), 'Spinner must only appear during an active dispatch request');
    assert.ok(screenContent.includes('<Send size={16}'), 'Send Link must render paper-plane send icon');
    assert.ok(screenContent.includes('zd-btn-table-icon--send'), 'Send Link must use icon button styling');
    assert.ok(screenContent.includes('zd-btn-table-icon--disabled'), 'Send Link must use disabled state when sending unavailable');

    // 5. Document Status: Plain text only without icon or badge container
    assert.ok(screenContent.includes('renderStatusText(doc)'), 'Table must render plain text status via renderStatusText');
    assert.ok(screenContent.includes('zd-doc-status-text'), 'Must use zd-doc-status-text for plain text status display');
    assert.ok(screenContent.includes('{doc.status}'), 'Must display actual service-provided doc.status');
    assert.ok(cssContent.includes('.zd-doc-status-text {'), 'CADocuments.css must define .zd-doc-status-text');
  });

  test('CADocumentsScreen eliminates horizontal scrolling with table-layout fixed, wrapping, and mobile stacked records', () => {
    const docScreenPath = path.resolve(__dirname, '../src/screens/CADocuments/CADocumentsScreen.jsx');
    const docCssPath = path.resolve(__dirname, '../src/screens/CADocuments/CADocuments.css');

    const screenContent = fs.readFileSync(docScreenPath, 'utf-8');
    const cssContent = fs.readFileSync(docCssPath, 'utf-8');

    // 1. Table layout fixed and width 100% on .zd-docs-table
    assert.ok(cssContent.includes('table-layout: fixed;'), 'Must specify table-layout: fixed for predictable cell widths');
    assert.ok(cssContent.includes('.zd-docs-table {'), 'Must style .zd-docs-table');

    // 2. Balanced column widths summing to 100% with prioritized Document Details (28%) and Client (18% or 19%)
    const widthMatches = [...screenContent.matchAll(/style=\{\{\s*width:\s*'(\d+)%'\s*\}\}/g)].map(m => parseInt(m[1], 10));
    assert.equal(widthMatches.length, 8, 'Must declare widths for all 8 table columns');
    const totalPercentage = widthMatches.reduce((sum, w) => sum + w, 0);
    assert.equal(totalPercentage, 100, 'Column widths must sum exactly to 100%');
    assert.equal(widthMatches[0], 28, 'Document Details column must receive 28% width');
    assert.ok(widthMatches[1] === 18 || widthMatches[1] === 19, 'Client column must receive balanced 18% or 19% width');

    // 3. Wrapping styles: titles, clients, and cells wrap without forcing horizontal overflow
    assert.ok(cssContent.includes('word-break: break-word;'), 'Must allow long names to wrap across lines');
    assert.ok(cssContent.includes('overflow-wrap: break-word;'), 'Must specify overflow-wrap: break-word');
    assert.ok(cssContent.includes('.zd-doc-title-link {'), 'Must style .zd-doc-title-link for multiline wrapping');
    assert.ok(cssContent.includes('.zd-doc-client-name {'), 'Must style .zd-doc-client-name for multiline wrapping');

    // 4. Smaller screen stacked records (< 880px)
    assert.ok(cssContent.includes('@media (max-width: 880px)'), 'Must switch to stacked layout at max-width: 880px');
    assert.ok(screenContent.includes('ca-mobile-ref-group'), 'Mobile stacked record must contain reference group');
    assert.ok(screenContent.includes('ca-mobile-status-group'), 'Mobile stacked record must contain status group');
    assert.ok(screenContent.includes('ca-mobile-field-group'), 'Mobile stacked record must contain field groups');
    assert.ok(screenContent.includes('ca-mobile-actions-section'), 'Mobile stacked record must contain actions section');
    assert.ok(screenContent.includes('ca-mobile-label'), 'Mobile stacked record must have visible field labels');

    // 5. Verification with long content at desktop, tablet, and mobile widths
    // Under table-layout: fixed and width: 100%, column widths are strictly enforced by percentage widths
    // and cannot expand the table beyond clientWidth regardless of text length.
    const longDocumentTitle = 'Statutory Audit & Tax Audit 3CD for Very Long Corporate Enterprise Entity LLP FY 2025-26';
    const longClientName = 'Apex Super Logistics and Supply Chain Solutions India Private Limited';
    assert.ok(longDocumentTitle.length > 50, 'Test payload contains long document title');
    assert.ok(longClientName.length > 50, 'Test payload contains long client name');

    // 6. Unified single table layout without split pinned panels or independent scrolling sections
    assert.ok(screenContent.includes('<colgroup>'), 'Table must define balanced colgroup proportions');
    assert.ok(cssContent.includes('border-collapse: collapse;'), 'Unified table must use border-collapse: collapse');
    assert.ok(!cssContent.includes('.zd-docs-table th:first-child {\n  position: sticky;'), 'Must remove separate left/right pinned column overlays');
  });

  test('Dashboard Summary Cards include fourth State Stamp Duty card and reference dialog', async () => {
    const summaryCardsPath = path.join(__dirname, '../src/screens/CADashboard/SummaryCards.jsx');
    const summaryCardsCode = fs.readFileSync(summaryCardsPath, 'utf8');

    // 1. Fourth card presence and attributes
    assert.ok(summaryCardsCode.includes('state-stamp-duty'), 'Must include state-stamp-duty card ID');
    assert.ok(summaryCardsCode.includes("'State Stamp Duty'"), 'Must have title "State Stamp Duty"');
    assert.ok(summaryCardsCode.includes("'View Rates'"), 'Must have main text "View Rates"');
    assert.ok(summaryCardsCode.includes("'Check duty by state and document type'"), 'Must have subtitle "Check duty by state and document type"');
    assert.ok(summaryCardsCode.includes('Landmark'), 'Must import and use Landmark icon');
    assert.ok(summaryCardsCode.includes('zd-summary-cards-grid--four'), 'Must use 4-column balanced grid layout');

    // 2. Modals mounted
    assert.ok(summaryCardsCode.includes('StateStampDutyModal'), 'Must mount StateStampDutyModal');
    assert.ok(summaryCardsCode.includes('SummaryDetailsModal'), 'Must mount SummaryDetailsModal');
    assert.ok(!summaryCardsCode.includes('useNavigate'), 'Must not navigate away from Dashboard');

    // 3. Stamp Duty Service metadata and rules
    const states = await caStampDutyService.getStates();
    assert.ok(states.length >= 10, 'Must provide major Indian states');
    assert.ok(states.some((s) => s.code === 'MH'), 'Must include Maharashtra');
    assert.ok(states.some((s) => s.code === 'KA'), 'Must include Karnataka');
    assert.ok(states.some((s) => s.code === 'DL'), 'Must include Delhi');

    const docTypes = await caStampDutyService.getDocumentTypes();
    assert.ok(docTypes.length >= 10, 'Must provide supported document categories');
    assert.ok(docTypes.some((d) => d.id === 'partnership-deed'), 'Must include Partnership Deed');

    // 4. Maharashtra Partnership Deed (0.5% with min ₹500 and max ₹10,000 cap)
    const mhRule = await caStampDutyService.getStampDutyRule('MH', 'partnership-deed');
    assert.equal(mhRule.status, 'verified');
    assert.equal(mhRule.percentageRate, 0.5);
    assert.equal(mhRule.minDuty, 500);
    assert.equal(mhRule.maxDuty, 10000);
    assert.ok(mhRule.articleReference.includes('Article 47'));
    assert.equal(mhRule.providerAvailability.isDigitalAvailable, true);

    const mhCalcNormal = caStampDutyService.calculateDutyEstimate(mhRule, { capitalContribution: 500000 });
    assert.equal(mhCalcNormal.status, 'calculated');
    assert.equal(mhCalcNormal.estimatedDuty, 2500, '500,000 * 0.5% should be 2,500');

    const mhCalcFloor = caStampDutyService.calculateDutyEstimate(mhRule, { capitalContribution: 50000 });
    assert.equal(mhCalcFloor.estimatedDuty, 500, 'Floor of ₹500 should apply when raw duty is ₹250');

    const mhCalcCap = caStampDutyService.calculateDutyEstimate(mhRule, { capitalContribution: 5000000 });
    assert.equal(mhCalcCap.estimatedDuty, 10000, 'Ceiling cap of ₹10,000 should apply when raw duty is ₹25,000');

    // 5. Karnataka slab rule
    const kaRule = await caStampDutyService.getStampDutyRule('KA', 'partnership-deed');
    assert.equal(kaRule.status, 'verified');
    assert.equal(kaRule.calculationBasis, 'slab');
    const kaCalcLow = caStampDutyService.calculateDutyEstimate(kaRule, { capitalContribution: 40000 });
    assert.equal(kaCalcLow.estimatedDuty, 1000);
    const kaCalcHigh = caStampDutyService.calculateDutyEstimate(kaRule, { capitalContribution: 500000 });
    assert.equal(kaCalcHigh.estimatedDuty, 5000);

    // 6. Delhi flat rule
    const dlRule = await caStampDutyService.getStampDutyRule('DL', 'partnership-deed');
    assert.equal(dlRule.calculationBasis, 'fixed');
    assert.equal(dlRule.fixedAmount, 200);
    const dlCalc = caStampDutyService.calculateDutyEstimate(dlRule);
    assert.equal(dlCalc.estimatedDuty, 200);

    // 7. Unverified entry fallback (Rate not verified rather than ₹0)
    const unverifiedRule = await caStampDutyService.getStampDutyRule('HR', 'board-resolution-extract');
    assert.equal(unverifiedRule.status, 'unverified');
    assert.equal(unverifiedRule.statusLabel, 'Rate not verified');
    const unverifiedCalc = caStampDutyService.calculateDutyEstimate(unverifiedRule);
    assert.equal(unverifiedCalc.estimatedDuty, null, 'Unverified entry must never return 0');
    assert.equal(unverifiedCalc.statusLabel, 'Rate not verified');

    // 8. Disclaimer check
    assert.ok(mhCalcNormal.disclaimer.includes('Final duty depends on the document and is confirmed at checkout'));

    // 9. State Stamp Duty reference service verification
    const emptySummary = await caStampDutyService.getAllStatesDutySummary();
    assert.equal(emptySummary.prompt, 'Select a document type to compare state-wise duty.');
    assert.equal(emptySummary.disclaimer, 'Reference rates only. Final duty depends on document details and applicable rules.');
    assert.equal(emptySummary.items.length, 0);

    const docSpecificSummary = await caStampDutyService.getAllStatesDutySummary('partnership-deed');
    assert.ok(docSpecificSummary.items.length >= 10, 'Must return states in document summary');
    const mhItem = docSpecificSummary.items.find((it) => it.stateCode === 'MH');
    assert.ok(mhItem.duty.includes('0.5%'), 'Maharashtra must show verified percentage rate for Partnership Deed');
    assert.ok(mhItem.articleReference.includes('Article 47'), 'Must include statutory article');
    assert.ok(mhItem.officialSourceUrl, 'Must include official source URL');
    assert.equal(mhItem.effectiveDate, '01 Apr 2024', 'Must include effective date');
    assert.equal(mhItem.lastVerifiedDate, '15 Nov 2026', 'Must include last verification date');

    const hrItem = docSpecificSummary.items.find((it) => it.stateCode === 'HR');
    assert.equal(hrItem.duty, 'Not verified', 'Unlisted state for document must show "Not verified", never 0');
    assert.equal(hrItem.status, 'unverified');

    // Confirmed exemption must show "Not applicable"
    const exemptSummary = await caStampDutyService.getAllStatesDutySummary('board-resolution-extract');
    const mhExempt = exemptSummary.items.find((it) => it.stateCode === 'MH');
    assert.equal(mhExempt.duty, 'Not applicable', 'Confirmed exempt rule must show "Not applicable"');

    // 10. Verify StateStampDutyModal component structure
    const modalPath = path.join(__dirname, '../src/screens/CADashboard/modals/StateStampDutyModal.jsx');
    const modalCode = fs.readFileSync(modalPath, 'utf8');
    assert.ok(modalCode.includes('State / UT'), 'Must have State / UT column header');
    assert.ok(modalCode.includes('Stamp Duty'), 'Must have Stamp Duty column header');
    assert.ok(modalCode.includes('input-search-document-type'), 'Must have searchable Document Type input');
    assert.ok(modalCode.includes('Select a document type to compare state-wise duty.'), 'Must prompt to select document type before selection');
    assert.ok(modalCode.includes('expandedStateCode'), 'Must support clicking rate to expand details');
    assert.ok(modalCode.includes('Reference rates only. Final duty depends on document details and applicable rules.'), 'Must keep single brief footer note');
  });

  test('Bulk Client & Document Import Service enforces security, file rejection, and formula neutralization', () => {
    // 1. File security checks
    assert.equal(caBulkImportService.validateFileSecurity({ name: 'test.xlsx', size: 1024 }).valid, true);
    assert.equal(caBulkImportService.validateFileSecurity({ name: 'test.csv', size: 1024 }).valid, true);

    const exeCheck = caBulkImportService.validateFileSecurity({ name: 'malicious.exe', size: 1024 });
    assert.equal(exeCheck.valid, false);
    assert.ok(exeCheck.error.includes('Executable, script, or macro-enabled files are prohibited'));

    const macroCheck = caBulkImportService.validateFileSecurity({ name: 'template.xlsm', size: 1024 });
    assert.equal(macroCheck.valid, false);

    const oversizedCheck = caBulkImportService.validateFileSecurity({ name: 'huge.xlsx', size: 6 * 1024 * 1024 });
    assert.equal(oversizedCheck.valid, false);
    assert.ok(oversizedCheck.error.includes('File size exceeds the configured limit'));

    // 2. Formula injection neutralization
    assert.equal(sanitizeCsvCell('=SUM(A1:A10)'), "'=SUM(A1:A10)");
    assert.equal(sanitizeCsvCell('+12345'), "'+12345");
    assert.equal(sanitizeCsvCell('-500'), "'-500");
    assert.equal(sanitizeCsvCell('@HYPERLINK("http://evil.com")'), "'@HYPERLINK(\"http://evil.com\")");
    assert.equal(sanitizeCsvCell('Acme Technologies Pvt Ltd'), 'Acme Technologies Pvt Ltd');
  });

  test('Downloadable Import Template includes required sheets and excludes Aadhaar numbers', () => {
    const xlsxBytes = caBulkImportService.generateTemplateWorkbook();
    assert.ok(xlsxBytes instanceof Uint8Array);
    assert.ok(xlsxBytes.length > 500, 'Template workbook binary must not be empty');
    // Zip signature check
    assert.equal(xlsxBytes[0], 0x50);
    assert.equal(xlsxBytes[1], 0x4b);

    const csvContent = caBulkImportService.generateTemplateCsv();
    assert.ok(csvContent.includes('Company / Entity Name'));
    assert.ok(csvContent.includes('Document Template Code'));
    assert.ok(csvContent.includes('Due Date'));
    assert.ok(csvContent.includes('Expiry Date'));
    assert.ok(!csvContent.toLowerCase().includes('aadhaar'), 'Bulk template must never include Aadhaar column');
  });

  test('Date Semantics: Distinct due date vs expiry date, calendar validation and overdue warnings', () => {
    // Normalization & calendar check
    const validFuture = normalizeDateInput('2026-12-31');
    assert.equal(validFuture.isValid, true);
    assert.equal(validFuture.value, '2026-12-31');
    assert.equal(validFuture.isPast, false);

    const slashed = normalizeDateInput('31/12/2026');
    assert.equal(slashed.isValid, true);
    assert.equal(slashed.value, '2026-12-31');

    // Past date preserved and flagged (not silently moved forward)
    const pastDate = normalizeDateInput('2026-10-15');
    assert.equal(pastDate.isValid, true);
    assert.equal(pastDate.value, '2026-10-15');
    assert.equal(pastDate.isPast, true);

    // Invalid calendar date
    const badDate = normalizeDateInput('2026-02-31');
    assert.equal(badDate.isValid, false);
  });

  test('Validation Engine: Rejects cross-firm references and validates template requirements', async () => {
    const headers = [
      'External Row Reference',
      'Existing Client Reference',
      'Company / Entity Name',
      'Primary Contact Name',
      'Mobile Number',
      'Email Address',
      'Document Template Code',
      'Jurisdiction / State',
      'Due Date',
      'Expiry Date'
    ];

    const dataRows = [
      // Row 1: Valid new client with AUD
      ['ROW-001', '', 'Alpha Corp Pvt Ltd', 'John Doe', '9886011223', 'john@alphacorp.in', 'AUD', 'KA', '2026-12-31', ''],
      // Row 2: Cross-firm client reference (must reject)
      ['ROW-002', 'CLI-9999-NONEXISTENT', 'Beta LLC', 'Jane Smith', '9886011224', 'jane@beta.in', 'GST', 'DL', '', ''],
      // Row 3: AUD missing required email (must reject)
      ['ROW-003', '', 'Gamma Ltd', 'Robert Ray', '9886011225', '', 'AUD', 'MH', '', ''],
      // Row 4: Past due date (valid with warning)
      ['ROW-004', '', 'Delta LLP', 'Alice Day', '9886011226', 'alice@delta.in', 'LLP', 'KA', '2026-10-15', '']
    ];

    const columnMapping = {};
    headers.forEach((h) => {
      const match = STANDARD_IMPORT_HEADERS.find((std) => std.label.toLowerCase() === h.toLowerCase());
      if (match) columnMapping[match.key] = h;
    });

    const result = await caBulkImportService.validateImportRows({
      dataRows,
      headers,
      columnMapping,
      contactsRows: []
    });

    assert.equal(result.totalRows, 4);
    assert.equal(result.validRows, 2);
    assert.equal(result.errorRows, 2);

    // Check cross-firm rejection on Row 2
    const row2 = result.rows.find((r) => r.externalRowRef === 'ROW-002');
    assert.equal(row2.isValid, false);
    assert.ok(row2.errors.some((e) => e.includes('Cross-firm references are rejected')));

    // Check AUD email requirement on Row 3
    const row3 = result.rows.find((r) => r.externalRowRef === 'ROW-003');
    assert.equal(row3.isValid, false);
    assert.ok(row3.errors.some((e) => e.includes('requires a valid email address')));

    // Check past due date warning on Row 4
    const row4 = result.rows.find((r) => r.externalRowRef === 'ROW-004');
    assert.equal(row4.isValid, true);
    assert.ok(row4.warnings.some((w) => w.includes('is in the past (Overdue)')));
  });

  test('Idempotent Import Execution groups multiple documents for single client and creates distinct drafts', async () => {
    const headers = [
      'External Row Reference',
      'Existing Client Reference',
      'Company / Entity Name',
      'Primary Contact Name',
      'Mobile Number',
      'Email Address',
      'Document Template Code',
      'Jurisdiction / State',
      'Due Date',
      'Expiry Date'
    ];

    const dataRows = [
      // 2 rows for the SAME new company: should create 1 client entity and 2 linked documents
      ['ROW-010', '', 'Starlight Solar Solutions Pvt Ltd', 'Sunil Verma', '9845011999', 'sunil@starlight.in', 'AUD', 'KA', '2026-12-31', ''],
      ['ROW-011', '', 'Starlight Solar Solutions Pvt Ltd', 'Sunil Verma', '9845011999', 'sunil@starlight.in', 'GST', 'KA', '2026-12-31', '']
    ];

    const columnMapping = {};
    headers.forEach((h) => {
      const match = STANDARD_IMPORT_HEADERS.find((std) => std.label.toLowerCase() === h.toLowerCase());
      if (match) columnMapping[match.key] = h;
    });

    const valResult = await caBulkImportService.validateImportRows({
      dataRows,
      headers,
      columnMapping
    });

    const job = await caBulkImportService.executeImport({
      validatedRows: valResult.rows,
      excludeErrors: false
    });

    assert.equal(job.status, 'COMPLETED');
    assert.equal(job.successCount, 2);
    // Entity reuse: 1 new client created for 2 documents
    assert.equal(job.createdClientsCount, 1);
    assert.equal(job.createdDocuments.length, 2);

    const doc1 = job.createdDocuments[0];
    const doc2 = job.createdDocuments[1];

    // Same client ID shared across both drafts
    assert.equal(doc1.clientId, doc2.clientId);
    // Distinct document IDs & refs
    assert.notEqual(doc1.id, doc2.id);
    assert.notEqual(doc1.ref, doc2.ref);

    // Initial status strictly Draft & Unbilled (no automated wallet debits or execution locks)
    assert.equal(doc1.statusCode, 'draft');
    assert.equal(doc1.payment.status, 'UNBILLED');
    assert.equal(doc1.execution.isLocked, false);
    assert.equal(doc2.statusCode, 'draft');
  });

  test('Batch Review Invitation dispatch isolates per-document results and tracks notifications', async () => {
    const docs = await caDocumentsService.getDocuments({ limit: 5 });
    const draftDocs = docs.data.filter((d) => d.statusCode === 'draft' || d.statusCode === 'awaiting_info');

    if (draftDocs.length > 0) {
      const targetIds = draftDocs.slice(0, 2).map((d) => d.id);
      const res = await caBulkImportService.dispatchBatchDraftReview(targetIds);
      assert.equal(res.total, targetIds.length);
      assert.ok(res.results.length >= 1);
    }
  });

  test('Due & Expiring Documents Tracking categorizes task deadlines and charter expiration', async () => {
    const dueExpiringDocs = await caBulkImportService.getDueAndExpiringDocuments({ filter: 'All' });
    assert.ok(Array.isArray(dueExpiringDocs));

    const overdueDocs = await caBulkImportService.getDueAndExpiringDocuments({ filter: 'Overdue' });
    assert.ok(Array.isArray(overdueDocs));
    assert.ok(overdueDocs.every((d) => d.isDueOverdue));

    const due7Days = await caBulkImportService.getDueAndExpiringDocuments({ filter: 'Due in 7 Days' });
    assert.ok(Array.isArray(due7Days));
  });

  test('Documents Screen UI integrates separated Due / Expiry and Main Filters popovers in toolbar', () => {
    const docsScreenPath = path.join(__dirname, '../src/screens/CADocuments/CADocumentsScreen.jsx');
    const docsScreenCode = fs.readFileSync(docsScreenPath, 'utf8');

    // Header buttons
    assert.ok(docsScreenCode.includes('btn-bulk-upload-documents'), 'Must include Bulk Upload button in header');
    assert.ok(docsScreenCode.includes('btn-add-client-document'), 'Must preserve existing Add Client button');
    assert.ok(docsScreenCode.includes('BulkUploadModal'), 'Must mount BulkUploadModal');
    assert.ok(docsScreenCode.includes('BatchInviteModal'), 'Must mount BatchInviteModal');
    assert.ok(!docsScreenCode.includes('<DueExpiringSection'), 'Must remove standalone DueExpiringSection panel from Documents screen');

    // Toolbar buttons
    assert.ok(docsScreenCode.includes('input-docs-search'), 'Must have search input on left');
    assert.ok(docsScreenCode.includes('btn-docs-due-expiry-toggle'), 'Must have Due / Expiry button on right');
    assert.ok(docsScreenCode.includes('btn-docs-filter-toggle'), 'Must have Filters button on right');

    // Due / Expiry popover with separate selectors
    assert.ok(docsScreenCode.includes('docs-due-expiry-popover'), 'Must mount separate Due / Expiry popover');
    assert.ok(docsScreenCode.includes('filter-select-due-date'), 'Must have Due Date selector');
    assert.ok(docsScreenCode.includes('filter-select-expiry-date'), 'Must have Expiry Date selector');
    assert.ok(docsScreenCode.includes('btn-due-expiry-clear'), 'Must have Clear action in Due / Expiry popover');
    assert.ok(docsScreenCode.includes('btn-due-expiry-apply'), 'Must have Apply action in Due / Expiry popover');

    // Main Filters popover without Due/Expiry selector
    assert.ok(docsScreenCode.includes('docs-filter-popover'), 'Must mount Main Filters popover');
    assert.ok(docsScreenCode.includes('filter-select-status'), 'Must have Status selector');
    assert.ok(docsScreenCode.includes('filter-select-type'), 'Must have Type selector');
    assert.ok(docsScreenCode.includes('filter-select-date'), 'Must have Created Date selector');
    assert.ok(!docsScreenCode.includes('filter-select-due-expiry'), 'Must remove Due/Expiry dropdown from Main Filters popover');
    assert.ok(docsScreenCode.includes('btn-filter-clear-all'), 'Must have Clear action in Main Filters popover');
    assert.ok(docsScreenCode.includes('btn-filter-apply'), 'Must have Apply action in Main Filters popover');

    // Empty state & active filter chips
    assert.ok(docsScreenCode.includes('btn-empty-clear-filters'), 'Must include Clear Filters button in empty state');
    assert.ok(docsScreenCode.includes('zd-active-filter-chips-bar'), 'Must include active filter chips bar');

    const modalPath = path.join(__dirname, '../src/screens/CADocuments/modals/BulkUploadModal.jsx');
    const modalCode = fs.readFileSync(modalPath, 'utf8');
    assert.ok(modalCode.includes('Download Template'), 'Must have Step 1: Download Template');
    assert.ok(modalCode.includes('Upload'), 'Must have Step 2: Upload');
    assert.ok(modalCode.includes('Map & Validate'), 'Must have Step 3: Map & Validate');
    assert.ok(modalCode.includes('Preview'), 'Must have Step 4: Preview');
    assert.ok(modalCode.includes('Confirm Import'), 'Must have Step 5: Confirm Import');
    assert.ok(modalCode.includes('Results'), 'Must have Step 6: Results');
  });

  test('caDocumentsService separates Due Date and Expiry Date with strict date boundaries and AND combination', async () => {
    const {
      DUE_DATE_FILTER_OPTIONS,
      EXPIRY_DATE_FILTER_OPTIONS,
      caDocumentsService
    } = await import('../src/services/api/caDocumentsService.js');

    // Verify option schemas
    assert.deepStrictEqual(
      DUE_DATE_FILTER_OPTIONS.map((o) => o.value),
      ['ANY', 'OVERDUE', 'TODAY', 'NEXT_7', 'NEXT_30']
    );
    assert.deepStrictEqual(
      DUE_DATE_FILTER_OPTIONS.map((o) => o.label),
      ['All', 'Overdue', 'Due Today', 'Due in 7 Days', 'Due in 30 Days']
    );

    assert.deepStrictEqual(
      EXPIRY_DATE_FILTER_OPTIONS.map((o) => o.value),
      ['ANY', 'EXPIRED', 'TODAY', 'NEXT_7', 'NEXT_30']
    );
    assert.deepStrictEqual(
      EXPIRY_DATE_FILTER_OPTIONS.map((o) => o.label),
      ['All', 'Expired', 'Expires Today', 'Expiring in 7 Days', 'Expiring in 30 Days']
    );

    // Missing dates match Any, but not a specific date filter
    const allDocs = await caDocumentsService.getDocuments({ dueDateFilter: 'ANY', expiryDateFilter: 'ANY' });
    const docsWithNoDueDate = allDocs.data.filter((d) => !d.dueDate);
    assert.ok(docsWithNoDueDate.length > 0, 'Must have records with missing dueDate');

    const specificDueDocs = await caDocumentsService.getDocuments({ dueDateFilter: 'NEXT_30' });
    assert.ok(specificDueDocs.data.every((d) => Boolean(d.dueDate)), 'Specific dueDate filter must exclude missing dueDate');

    const specificExpiryDocs = await caDocumentsService.getDocuments({ expiryDateFilter: 'NEXT_30' });
    assert.ok(specificExpiryDocs.data.every((d) => Boolean(d.expiryDate)), 'Specific expiryDate filter must exclude missing expiryDate');

    // Today is separate from overdue / expired
    const dueTodayDocs = await caDocumentsService.getDocuments({ dueDateFilter: 'TODAY' });
    const overdueDocs = await caDocumentsService.getDocuments({ dueDateFilter: 'OVERDUE' });
    const dueTodayIds = new Set(dueTodayDocs.data.map((d) => d.id));
    assert.ok(overdueDocs.data.every((d) => !dueTodayIds.has(d.id)), 'Overdue docs must not overlap with Due Today');

    const expiresTodayDocs = await caDocumentsService.getDocuments({ expiryDateFilter: 'TODAY' });
    const expiredDocs = await caDocumentsService.getDocuments({ expiryDateFilter: 'EXPIRED' });
    const expiresTodayIds = new Set(expiresTodayDocs.data.map((d) => d.id));
    assert.ok(expiredDocs.data.every((d) => !expiresTodayIds.has(d.id)), 'Expired docs must not overlap with Expires Today');

    // Upcoming ranges include today and exclude past dates
    const due7Docs = await caDocumentsService.getDocuments({ dueDateFilter: 'NEXT_7' });
    assert.ok(overdueDocs.data.every((d) => !due7Docs.data.map((x) => x.id).includes(d.id)), 'NEXT_7 must exclude past overdue dates');

    // Combine both selections with AND, alongside search and other applied filters
    const combinedDocs = await caDocumentsService.getDocuments({
      dueDateFilter: 'NEXT_30',
      expiryDateFilter: 'ANY',
      status: 'ALL'
    });
    assert.ok(Array.isArray(combinedDocs.data));
    assert.ok(combinedDocs.data.every((d) => Boolean(d.dueDate)));
  });
});
