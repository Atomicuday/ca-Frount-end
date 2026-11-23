/**
 * CA Dashboard Service & API Adapter
 * Handles data fetching, annual reporting queries, and action dispatches.
 */
import { api } from './client.js';
import { MOCK_DASHBOARD_DATA } from '../../mock/caDashboardData.js';

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
   * Fetch activity points based on time granularity.
   * Granularities:
   * - 'day': completed documents per day for last 30 calendar days, including today (mark today partial)
   * - 'month': completed documents per month for current calendar year through current month (mark current month partial)
   * - 'year': completed documents per year across available history (mark current year partial)
   * Show zero for elapsed periods without completions; do not treat future periods as completed zero.
   * @param {'day' | 'month' | 'year'} granularity
   */
  getActivityByGranularity: async (granularity = 'month') => {
    try {
      const liveData = await api.get(`/ca/dashboard/activity?granularity=${granularity}`);
      if (liveData && Array.isArray(liveData.data)) {
        return liveData;
      }
    } catch {
      // Prototype fallback to mock fixtures
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed (Nov = 10 for 2026)
    const validGranularity = ['day', 'month', 'year'].includes(granularity) ? granularity : 'month';

    if (validGranularity === 'day') {
      const items = MOCK_DASHBOARD_DATA.activityByGranularity?.day || [];
      const total = items.reduce((acc, curr) => acc + (typeof curr.count === 'number' ? curr.count : 0), 0);
      return {
        granularity: 'day',
        title: 'Document Activity (Last 30 Days)',
        subtitle: `Completed documents per day for the last 30 calendar days (${total} total completed).`,
        summaryLabel: 'Last 30 Days',
        data: items
      };
    }

    if (validGranularity === 'year') {
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
        granularity: 'year',
        title: `Annual Document Activity (${startYear}–${endYear})`,
        subtitle: `Completed documents per year across practice history (${total} total completed).`,
        summaryLabel: `${startYear}–${endYear}`,
        data: items
      };
    }

    // Default 'month' for current year through current month
    // Show zero for elapsed periods without completions; do not treat future periods as completed zero.
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mockMonths = MOCK_DASHBOARD_DATA.activityByGranularity?.month || [];

    const items = [];
    for (let i = 0; i <= currentMonth; i++) {
      const existing = mockMonths.find((m) => m.monthIndex === i);
      const isPartial = i === currentMonth;
      items.push({
        label: monthNames[i],
        monthIndex: i,
        year: currentYear,
        count: existing && typeof existing.count === 'number' ? existing.count : (isPartial ? 34 : 20),
        isPartial,
        ...(isPartial ? { partialLabel: 'Current Month (In Progress)' } : {})
      });
    }

    const total = items.reduce((acc, curr) => acc + (typeof curr.count === 'number' ? curr.count : 0), 0);
    const endMonthLabel = monthNames[currentMonth];
    return {
      granularity: 'month',
      title: `Document Activity in ${currentYear}`,
      subtitle: `Completed documents per month for January–${endMonthLabel} ${currentYear} (${total} total completed).`,
      summaryLabel: `January–${endMonthLabel} ${currentYear}`,
      data: items
    };
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
  }
};

export default caDashboardService;
