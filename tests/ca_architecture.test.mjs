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
import { caBillingService, formatINR } from '../src/services/api/caBillingService.js';
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

    // 1. "Add More" button exists
    assert.ok(content.includes('id="btn-add-more-details"'), 'Must have Add More button id="btn-add-more-details"');
    assert.ok(content.includes('<span>Add More</span>'), 'Button must display "Add More"');

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
    assert.ok(content.includes('Wallet & Billing'), 'Heading must be "Wallet & Billing"');
    assert.ok(
      content.includes('Manage your wallet, service charges and payment history.'),
      'Subtitle must match specification'
    );

    // 2. Removal of client finance content & Create Invoice button
    assert.ok(!content.includes('id="btn-create-invoice"'), 'Must remove Create Invoice button');
    assert.ok(!content.includes('+ Create Invoice'), 'Must remove "+ Create Invoice" text');
    assert.ok(!content.includes('Monthly Retainers'), 'Must remove Monthly Retainers');
    assert.ok(!content.includes('Collected This Month'), 'Must remove Collected This Month');
    assert.ok(!content.includes('Outstanding Invoices'), 'Must remove Outstanding Invoices');
    assert.ok(!content.includes('Recent Invoices & Retainer Receipts'), 'Must remove client invoice receipts');

    // 3. CA Wallet panel elements
    assert.ok(content.includes('ca-wallet-hero-card'), 'Must render wallet hero card');
    assert.ok(content.includes('Available Wallet Balance'), 'Must show available balance label');
    assert.ok(content.includes('Reserved Amount:'), 'Must show reserved amount label');
    assert.ok(content.includes('Use your balance to pay for eligible document services.'), 'Must show explanation');
    assert.ok(content.includes('id="btn-open-add-money"'), 'Must have Add Money button');
    assert.ok(content.includes('id="btn-view-wallet-history"'), 'Must have View Wallet History button');

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

  test('AddClientModal enforces compact 520px dialog sizing, single-column form, and accessible fixed header/footer', () => {
    const docModalPath = path.resolve(__dirname, '../src/screens/CADocuments/modals/AddClientModal.jsx');
    const clientModalPath = path.resolve(__dirname, '../src/screens/CAClients/modals/AddClientModal.jsx');
    const docCssPath = path.resolve(__dirname, '../src/screens/CADocuments/CADocuments.css');
    const clientCssPath = path.resolve(__dirname, '../src/screens/CAClients/CAClients.css');

    const docModalContent = fs.readFileSync(docModalPath, 'utf-8');
    const clientModalContent = fs.readFileSync(clientModalPath, 'utf-8');
    const docCssContent = fs.readFileSync(docCssPath, 'utf-8');
    const clientCssContent = fs.readFileSync(clientCssPath, 'utf-8');

    // 1. Both modals mount scrollable form body and fixed footer
    assert.ok(docModalContent.includes('zd-add-client-form-body'), 'CADocuments modal must structure scrollable form body');
    assert.ok(clientModalContent.includes('zd-add-client-form-body'), 'CAClients modal must structure scrollable form body');
    assert.ok(docModalContent.includes('zd-add-client-footer'), 'CADocuments modal must have zd-add-client-footer class');
    assert.ok(clientModalContent.includes('zd-add-client-footer'), 'CAClients modal must have zd-add-client-footer class');

    // 2. CSS enforces compact 520px max-width and responsive calc width
    assert.ok(docCssContent.includes('max-width: 520px'), 'CADocuments.css must constrain modal to max-width: 520px');
    assert.ok(clientCssContent.includes('max-width: 520px'), 'CAClients.css must constrain modal to max-width: 520px');
    assert.ok(docCssContent.includes('width: calc(100% - 32px)'), 'CADocuments.css must specify width: calc(100% - 32px)');
    assert.ok(clientCssContent.includes('width: calc(100% - 32px)'), 'CAClients.css must specify width: calc(100% - 32px)');

    // 3. CSS enforces max-height: calc(100dvh - 32px) / calc(100vh - 32px)
    assert.ok(docCssContent.includes('max-height: calc(100dvh - 32px)'), 'CADocuments.css must specify max-height: calc(100dvh - 32px)');
    assert.ok(clientCssContent.includes('max-height: calc(100dvh - 32px)'), 'CAClients.css must specify max-height: calc(100dvh - 32px)');

    // 4. CSS enforces single-column form layout
    assert.ok(docCssContent.includes('grid-template-columns: 1fr !important'), 'CADocuments.css must override grid to 1-column single stack');
    assert.ok(clientCssContent.includes('grid-template-columns: 1fr !important'), 'CAClients.css must override grid to 1-column single stack');

    // 5. CSS keeps header and footer fixed/accessible with 20-24px padding
    assert.ok(docCssContent.includes('padding: 20px 24px 16px;'), 'Header must have consistent 20-24px padding in CADocuments.css');
    assert.ok(clientCssContent.includes('padding: 20px 24px 16px;'), 'Header must have consistent 20-24px padding in CAClients.css');
    assert.ok(docCssContent.includes('overflow-y: auto;'), 'Form body must scroll internally');

    // 6. Mobile stacking on narrow screens
    assert.ok(docCssContent.includes('flex-direction: column-reverse;'), 'Footer actions must stack without overflowing on narrow screens');
    assert.ok(clientCssContent.includes('flex-direction: column-reverse;'), 'Footer actions must stack without overflowing on narrow screens');
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
    assert.ok(docsCss.includes('max-height: calc(100vh - 32px)') || docsCss.includes('max-height: calc(100dvh - 32px)'), 'Modals must be contained within viewport height');
    assert.ok(profileCss.includes('1023.98px'), 'Profile screen must adapt from 2-column to 1-column on tablet and mobile');
    assert.ok(clientWorkflowCss.includes('767.98px'), 'Client review and signing workflow must be responsive on mobile');
  });
});
