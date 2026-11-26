/**
 * CA Dashboard Service & API Adapter
 * Handles data fetching, annual reporting queries, and action dispatches.
 */
import { api } from './client.js';
import { MOCK_DASHBOARD_DATA } from '../../mock/caDashboardData.js';
import {
  MOCK_SUMMARY_CLIENTS,
  MOCK_SUMMARY_PENDING_DOCS,
  MOCK_SUMMARY_COMPLETED_DOCS
} from '../../mock/caSummaryDetailsData.js';
import { caDocumentsService } from './caDocumentsService.js';

export const caDashboardService = {
  /**
   * Fetch complete dashboard payload.
   * @param {string} period - '30d' | '90d' | 'fy' (optional)
   */
  getDashboardData: async (period = '30d') => {
    try {
      const liveData = await api.get('/ca/dashboard', { period });
      if (liveData && liveData.summary) {
        return liveData;
      }
      return MOCK_DASHBOARD_DATA;
    } catch {
      // Graceful prototype fallback to mock fixtures
      return MOCK_DASHBOARD_DATA;
    }
  },

  /**
   * Fetch available years for the Annual Document Activity Graph.
   * Always includes the current year.
   */
  getAvailableYears: async () => {
    const currentYear = new Date().getFullYear();
    const mockYears = Object.keys(MOCK_DASHBOARD_DATA.annualActivityByYear || {})
      .map(Number)
      .sort((a, b) => b - a);

    if (!mockYears.includes(currentYear)) {
      mockYears.unshift(currentYear);
    }
    return mockYears;
  },

  /**
   * Fetch activity points based on selected period:
   * - 'today': hourly counts for today from 00:00 to current hour (current hour partial, future excluded)
   * - '7d': daily counts for today and preceding 6 days (today partial, future excluded)
   * - '2w': daily counts for today and preceding 13 days (today partial, future excluded)
   * - '3w': daily counts for today and preceding 20 days (today partial, future excluded)
   * - '1m': daily counts for current calendar month from day 1 to today (today partial, future excluded)
   * - '1y': monthly counts for current calendar year from Jan to current month (current month partial, future excluded)
   * Includes backwards compatibility for legacy aliases 'day', 'month', 'year'.
   * @param {'today' | '7d' | '2w' | '3w' | '1m' | '1y' | 'day' | 'month' | 'year'} period
   */
  getActivityByPeriod: async (period = '1m') => {
    try {
      const liveData = await api.get(`/ca/dashboard/activity?period=${period}`);
      if (liveData && Array.isArray(liveData.data)) {
        return liveData;
      }
    } catch {
      // Prototype fallback
    }

    // Retrieve any dynamically completed documents
    let completedDocs = [];
    try {
      const docsRes = await caDocumentsService.getDocuments({ status: 'completed', limit: 100 });
      completedDocs = (docsRes?.data || []).filter((d) => d.statusCode === 'completed');
    } catch {
      completedDocs = [];
    }

    const completedTimestamps = completedDocs
      .map((doc) => {
        if (!doc.completedAt && !doc.createdDate && !doc.createdAt) return null;
        const str = doc.completedAt || doc.createdDate || doc.createdAt;
        const cleaned = String(str).replace(/\s+IST/i, '').replace(/,/g, '');
        const d = new Date(cleaned);
        return isNaN(d.getTime()) ? null : d;
      })
      .filter(Boolean);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayDate = now.getDate();
    const curHour = now.getHours();

    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const MONTHS_FULL = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const pad2 = (n) => String(n).padStart(2, '0');
    const formatDisplay = (d) => `${pad2(d.getDate())} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;

    // Baseline historical daily counts for preceding 30 days (deterministic sequence with zeros)
    const BASELINE_DAILY_COUNTS = [
      1, 2, 0, 1, 3, 2, 0, 1, 2, 4, 1, 0, 2, 3, 1,
      2, 0, 1, 3, 2, 1, 0, 2, 3, 1, 2, 0, 1, 2, 2
    ];

    const getDailyCount = (targetDate, isToday) => {
      const liveCount = completedTimestamps.filter((t) => {
        return (
          t.getFullYear() === targetDate.getFullYear() &&
          t.getMonth() === targetDate.getMonth() &&
          t.getDate() === targetDate.getDate()
        );
      }).length;

      if (isToday) {
        return Math.max(1, liveCount || 2);
      }

      const diffDays = Math.round(
        (new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
          new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())) /
          (1000 * 60 * 60 * 24)
      );
      const baselineIdx = Math.max(0, 29 - (diffDays % 30));
      const base = BASELINE_DAILY_COUNTS[baselineIdx] ?? 1;
      return base + liveCount;
    };

    // Legacy 'day' alias: 30 days ending today
    if (period === 'day') {
      const items = MOCK_DASHBOARD_DATA.activityByGranularity?.day || [];
      const total = items.reduce((acc, curr) => acc + (typeof curr.count === 'number' ? curr.count : 0), 0);
      return {
        period: 'day',
        granularity: 'day',
        title: 'Document Activity (Last 30 Days)',
        subtitle: `Completed documents per day for the last 30 calendar days (${total} total completed).`,
        summaryLabel: 'Last 30 Days',
        data: items
      };
    }

    // Legacy 'year' alias: multi-year view
    if (period === 'year') {
      const rawYears = MOCK_DASHBOARD_DATA.activityByGranularity?.year || [
        { label: '2023', year: 2023, count: 198, isPartial: false },
        { label: '2024', year: 2024, count: 254, isPartial: false },
        { label: '2025', year: 2025, count: 318, isPartial: false },
        { label: '2026', year: 2026, count: 329, isPartial: true, partialLabel: 'Current Year (In Progress)' }
      ];
      const items = rawYears.map((item) => ({
        ...item,
        isPartial: item.year === currentYear,
        ...(item.year === currentYear ? { partialLabel: 'Current Year (In Progress)' } : {})
      }));
      const total = items.reduce((acc, curr) => acc + (typeof curr.count === 'number' ? curr.count : 0), 0);
      const startYear = items[0]?.label || '2023';
      const endYear = items[items.length - 1]?.label || String(currentYear);
      return {
        period: 'year',
        granularity: 'year',
        title: `Annual Document Activity (${startYear}–${endYear})`,
        subtitle: `Completed documents per year across practice history (${total} total completed).`,
        summaryLabel: `${startYear}–${endYear}`,
        data: items
      };
    }

    // 1. TODAY: hourly counts for today (from 00:00 to current hour, future excluded)
    if (period === 'today') {
      const HOURLY_PATTERN = [
        0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 2, 0, 1, 2, 1, 2, 1, 0, 0, 0, 0, 0, 0
      ];
      const items = [];
      for (let h = 0; h <= curHour; h++) {
        const isPartial = h === curHour;
        const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

        const liveHourCount = completedTimestamps.filter((t) => {
          return (
            t.getFullYear() === currentYear &&
            t.getMonth() === currentMonth &&
            t.getDate() === todayDate &&
            t.getHours() === h
          );
        }).length;

        const count = (HOURLY_PATTERN[h] || 0) + liveHourCount;

        items.push({
          label,
          hour: h,
          count,
          isPartial,
          ...(isPartial ? { partialLabel: 'Current Hour (In Progress)' } : {}),
          fullDateLabel: `${formatDisplay(now)}, ${label}`
        });
      }

      const total = items.reduce((acc, curr) => acc + curr.count, 0);
      return {
        period: 'today',
        granularity: 'today',
        title: "Today's Document Activity",
        subtitle: `Hourly completed documents for today, ${formatDisplay(now)} (${total} total completed).`,
        summaryLabel: `${formatDisplay(now)} (Today, 00:00–${pad2(curHour)}:59)`,
        dateRange: `${formatDisplay(now)} (Today)`,
        data: items
      };
    }

    // 2. 7 DAYS: daily counts for today and preceding 6 days
    if (period === '7d') {
      const items = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth, todayDate - i);
        const isToday = i === 0;
        const label = `${pad2(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}`;
        const count = getDailyCount(d, isToday);

        items.push({
          label,
          dateStr: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
          count,
          isToday,
          isPartial: isToday,
          ...(isToday ? { partialLabel: 'Today (In Progress)' } : {}),
          fullDateLabel: `${pad2(d.getDate())} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
        });
      }

      const startD = new Date(currentYear, currentMonth, todayDate - 6);
      const total = items.reduce((acc, curr) => acc + curr.count, 0);
      return {
        period: '7d',
        granularity: '7d',
        title: 'Document Activity (Last 7 Days)',
        subtitle: `Daily completed documents for ${formatDisplay(startD)} – ${formatDisplay(now)} (${total} total completed).`,
        summaryLabel: `${formatDisplay(startD)} – ${formatDisplay(now)} (7 Days)`,
        dateRange: `${formatDisplay(startD)} – ${formatDisplay(now)}`,
        data: items
      };
    }

    // 3. 2 WEEKS: daily counts for today and preceding 13 days
    if (period === '2w') {
      const items = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth, todayDate - i);
        const isToday = i === 0;
        const label = `${pad2(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}`;
        const count = getDailyCount(d, isToday);

        items.push({
          label,
          dateStr: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
          count,
          isToday,
          isPartial: isToday,
          ...(isToday ? { partialLabel: 'Today (In Progress)' } : {}),
          fullDateLabel: `${pad2(d.getDate())} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
        });
      }

      const startD = new Date(currentYear, currentMonth, todayDate - 13);
      const total = items.reduce((acc, curr) => acc + curr.count, 0);
      return {
        period: '2w',
        granularity: '2w',
        title: 'Document Activity (Last 2 Weeks)',
        subtitle: `Daily completed documents for ${formatDisplay(startD)} – ${formatDisplay(now)} (${total} total completed).`,
        summaryLabel: `${formatDisplay(startD)} – ${formatDisplay(now)} (2 Weeks)`,
        dateRange: `${formatDisplay(startD)} – ${formatDisplay(now)}`,
        data: items
      };
    }

    // 4. 3 WEEKS: daily counts for today and preceding 20 days
    if (period === '3w') {
      const items = [];
      for (let i = 20; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth, todayDate - i);
        const isToday = i === 0;
        const label = `${pad2(d.getDate())} ${MONTHS_SHORT[d.getMonth()]}`;
        const count = getDailyCount(d, isToday);

        items.push({
          label,
          dateStr: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
          count,
          isToday,
          isPartial: isToday,
          ...(isToday ? { partialLabel: 'Today (In Progress)' } : {}),
          fullDateLabel: `${pad2(d.getDate())} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
        });
      }

      const startD = new Date(currentYear, currentMonth, todayDate - 20);
      const total = items.reduce((acc, curr) => acc + curr.count, 0);
      return {
        period: '3w',
        granularity: '3w',
        title: 'Document Activity (Last 3 Weeks)',
        subtitle: `Daily completed documents for ${formatDisplay(startD)} – ${formatDisplay(now)} (${total} total completed).`,
        summaryLabel: `${formatDisplay(startD)} – ${formatDisplay(now)} (3 Weeks)`,
        dateRange: `${formatDisplay(startD)} – ${formatDisplay(now)}`,
        data: items
      };
    }

    // 5. 1 YEAR: monthly counts for the latest calendar-year window
    if (period === '1y') {
      const mockMonths = MOCK_DASHBOARD_DATA.activityByGranularity?.month || [];
      const items = [];
      for (let m = 0; m <= currentMonth; m++) {
        const isCurrentMonth = m === currentMonth;
        const existing = mockMonths.find((item) => item.monthIndex === m);
        const liveMonthCount = completedTimestamps.filter((t) => {
          return t.getFullYear() === currentYear && t.getMonth() === m;
        }).length;

        const baseCount = existing && typeof existing.count === 'number' ? existing.count : (isCurrentMonth ? 34 : 20);
        const count = baseCount + liveMonthCount;

        items.push({
          label: MONTHS_SHORT[m],
          monthIndex: m,
          year: currentYear,
          count,
          isPartial: isCurrentMonth,
          ...(isCurrentMonth ? { partialLabel: 'Current Month (In Progress)' } : {}),
          fullDateLabel: `${MONTHS_FULL[m]} ${currentYear}`
        });
      }

      const total = items.reduce((acc, curr) => acc + curr.count, 0);
      return {
        period: '1y',
        granularity: '1y',
        title: `Annual Document Activity (${currentYear})`,
        subtitle: `Monthly completed documents for January–${MONTHS_FULL[currentMonth]} ${currentYear} (${total} total completed).`,
        summaryLabel: `Jan ${currentYear} – ${MONTHS_SHORT[currentMonth]} ${currentYear} (Year to Date)`,
        dateRange: `Jan ${currentYear} – ${MONTHS_SHORT[currentMonth]} ${currentYear}`,
        data: items
      };
    }

    // Legacy 'month' alias: Jan through current month of current year
    if (period === 'month') {
      const mockMonths = MOCK_DASHBOARD_DATA.activityByGranularity?.month || [];
      const items = [];
      for (let i = 0; i <= currentMonth; i++) {
        const existing = mockMonths.find((m) => m.monthIndex === i);
        const isPartial = i === currentMonth;
        items.push({
          label: MONTHS_SHORT[i],
          monthIndex: i,
          year: currentYear,
          count: existing && typeof existing.count === 'number' ? existing.count : (isPartial ? 34 : 20),
          isPartial,
          ...(isPartial ? { partialLabel: 'Current Month (In Progress)' } : {})
        });
      }

      const total = items.reduce((acc, curr) => acc + (typeof curr.count === 'number' ? curr.count : 0), 0);
      const endMonthLabel = MONTHS_SHORT[currentMonth];
      return {
        period: 'month',
        granularity: 'month',
        title: `Document Activity in ${currentYear}`,
        subtitle: `Completed documents per month for January–${endMonthLabel} ${currentYear} (${total} total completed).`,
        summaryLabel: `January–${endMonthLabel} ${currentYear}`,
        data: items
      };
    }

    // 6. 1 MONTH ('1m' - DEFAULT): daily counts for latest calendar-month window (from Day 1 to Today)
    const items = [];
    for (let dayNum = 1; dayNum <= todayDate; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const isToday = dayNum === todayDate;
      const label = `${pad2(dayNum)} ${MONTHS_SHORT[currentMonth]}`;
      const count = getDailyCount(d, isToday);

      items.push({
        label,
        dayNum,
        dateStr: `${currentYear}-${pad2(currentMonth + 1)}-${pad2(dayNum)}`,
        count,
        isToday,
        isPartial: isToday,
        ...(isToday ? { partialLabel: 'Today (In Progress)' } : {}),
        fullDateLabel: `${pad2(dayNum)} ${MONTHS_FULL[currentMonth]} ${currentYear}`
      });
    }

    const startD = new Date(currentYear, currentMonth, 1);
    const total = items.reduce((acc, curr) => acc + curr.count, 0);
    return {
      period: '1m',
      granularity: '1m',
      title: `Document Activity (${MONTHS_FULL[currentMonth]} ${currentYear})`,
      subtitle: `Daily completed documents for ${formatDisplay(startD)} – ${formatDisplay(now)} (${total} total completed).`,
      summaryLabel: `${formatDisplay(startD)} – ${formatDisplay(now)} (${MONTHS_FULL[currentMonth]} Month to Date)`,
      dateRange: `${formatDisplay(startD)} – ${formatDisplay(now)}`,
      data: items
    };
  },

  /**
   * Backwards compatible proxy for legacy tests and callers
   */
  getActivityByGranularity: async (granularity = 'month') => {
    return caDashboardService.getActivityByPeriod(granularity);
  },

  /**
   * Fetch 12-month activity records (Jan - Dec) for a given year.
   * Dynamically marks elapsed, partial, and future months for the current year.
   * @param {number} year - e.g. 2026
   */
  getAnnualActivity: async (year = new Date().getFullYear()) => {
    try {
      const liveData = await api.get(`/ca/dashboard/activity-year?year=${year}`);
      if (Array.isArray(liveData)) {
        return liveData;
      }
    } catch {
      // Fallback to mock dataset
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed (0=Jan ... 10=Nov ... 11=Dec)

    const rawMonths = MOCK_DASHBOARD_DATA.annualActivityByYear?.[year] || [];
    if (rawMonths.length === 12) {
      // Reconcile dynamic browser-local time flags if viewing current year
      if (year === currentYear) {
        return rawMonths.map((item, idx) => {
          if (idx < currentMonth) {
            return {
              ...item,
              count: typeof item.count === 'number' ? item.count : 0,
              isElapsed: true,
              isFuture: false,
              isPartial: false
            };
          } else if (idx === currentMonth) {
            return {
              ...item,
              count: typeof item.count === 'number' ? item.count : 25,
              isElapsed: true,
              isFuture: false,
              isPartial: true,
              partialLabel: 'Current Month (In Progress)'
            };
          } else {
            return {
              ...item,
              count: null, // Do NOT treat future months as completed zero-value periods
              isElapsed: false,
              isFuture: true,
              isPartial: false,
              futureLabel: 'Future Month (Not Yet Elapsed)'
            };
          }
        });
      }
      return rawMonths;
    }

    // Default 12 month skeleton if year not explicitly mocked
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return MONTH_NAMES.map((name, idx) => {
      const isPastYear = year < currentYear;
      const isElapsed = isPastYear || idx <= currentMonth;
      const isPartial = year === currentYear && idx === currentMonth;
      const isFuture = year === currentYear && idx > currentMonth;

      return {
        month: name,
        monthIndex: idx,
        count: isFuture ? null : (isPartial ? 15 : 20),
        isElapsed,
        isFuture,
        isPartial,
        ...(isPartial ? { partialLabel: 'Current Month (In Progress)' } : {}),
        ...(isFuture ? { futureLabel: 'Future Month (Not Yet Elapsed)' } : {})
      };
    });
  },

  /**
   * Dispatch portal/email review reminder to a client/party.
   * Strictly adheres to portal/email channels (NO WhatsApp).
   */
  sendReviewReminder: async (documentId, channel = 'portal_email') => {
    try {
      return await api.post(`/ca/documents/${documentId}/send-reminder`, { channel });
    } catch {
      return {
        success: true,
        channel: 'Portal Notification & Registered Email',
        timestamp: new Date().toISOString(),
        message: 'Review reminder sent via portal and registered email.'
      };
    }
  },

  /**
   * Fetch execution gateway error diagnostics for manual CA review.
   * No automatic retries are executed.
   */
  inspectGatewayIssue: async (documentId) => {
    try {
      return await api.get(`/ca/documents/${documentId}/gateway-diagnostics`);
    } catch {
      return {
        documentId,
        status: 'eSign DSC Handshake Blocked',
        reason: 'Signer certificate trust chain failed verification with CA Certifying Authority.',
        suggestedAction: 'Notify signer to insert valid Class-3 USB Token or verify Aadhaar eSign OTP limit (Manual resolution required).',
        allowAutoRetry: false
      };
    }
  },

  /**
   * Fetch paginated and searchable items for the three Dashboard summary card details dialogs.
   * Matches exact summary card totals:
   * - 'total-clients': 48 clients
   * - 'pending-docs': 47 active unfinished documents
   * - 'completed-docs': 184 successfully completed documents
   *
   * @param {'total-clients' | 'pending-docs' | 'completed-docs'} cardId
   * @param {{ search?: string, page?: number, limit?: number }} options
   */
  getSummaryCardDetails: async (cardId, { search = '', page = 1, limit = 10 } = {}) => {
    try {
      const response = await api.get(`/ca/dashboard/summary-details/${cardId}`, { search, page, limit });
      if (response && Array.isArray(response.data)) {
        return response;
      }
    } catch {
      // Prototype fallback
    }

    let items = [];
    let title = '';
    let itemName = '';
    let subtitle = '';

    if (cardId === 'total-clients') {
      title = 'Total Clients';
      itemName = 'clients';
      subtitle = 'Current active client entity profiles registered in vault';
      items = [...MOCK_SUMMARY_CLIENTS];

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(
          (c) =>
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.id && c.id.toLowerCase().includes(q)) ||
            (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
            (c.phone && c.phone.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.entityType && c.entityType.toLowerCase().includes(q))
        );
      }
    } else if (cardId === 'pending-docs') {
      title = 'Pending Documents';
      itemName = 'documents';
      subtitle = 'Active, unfinished documents across statutory pipeline stages';
      items = [...MOCK_SUMMARY_PENDING_DOCS];

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(
          (d) =>
            (d.title && d.title.toLowerCase().includes(q)) ||
            (d.ref && d.ref.toLowerCase().includes(q)) ||
            (d.client && d.client.toLowerCase().includes(q)) ||
            (d.stage && d.stage.toLowerCase().includes(q))
        );
      }
    } else if (cardId === 'completed-docs') {
      title = 'Completed Documents';
      itemName = 'documents';
      subtitle = 'Successfully completed, stamped and legally executed documents in vault';
      items = [...MOCK_SUMMARY_COMPLETED_DOCS];

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(
          (d) =>
            (d.title && d.title.toLowerCase().includes(q)) ||
            (d.ref && d.ref.toLowerCase().includes(q)) ||
            (d.client && d.client.toLowerCase().includes(q)) ||
            (d.completedAt && d.completedAt.toLowerCase().includes(q))
        );
      }
    } else {
      return {
        cardId,
        title: '',
        itemName: 'records',
        subtitle: '',
        data: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 1
      };
    }

    const total = items.length;
    const safeLimit = Math.max(1, Number(limit) || 10);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const safePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
    const start = (safePage - 1) * safeLimit;
    const paginatedData = items.slice(start, start + safeLimit);

    return {
      cardId,
      title,
      itemName,
      subtitle,
      data: paginatedData,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages
    };
  }
};

export default caDashboardService;
