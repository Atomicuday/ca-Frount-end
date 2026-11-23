import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Building2
} from 'lucide-react';
import { useCAAuth } from '../../hooks/useCAAuth.js';
import { caDashboardService } from '../../services/api/caDashboardService.js';
import { getTimeBasedGreeting } from '../../utils/greeting.js';
import { LoadingState, ErrorState } from '../../components/shared.jsx';

import SummaryCards from './SummaryCards.jsx';
import PipelineChart from './PipelineChart.jsx';
import CategoryChart from './CategoryChart.jsx';
import ActivityChart from './ActivityChart.jsx';
import './CADashboard.css';

export default function CADashboardScreen() {
  const { user } = useCAAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Time-based greeting with live boundary update (every 30 seconds)
  const [greeting, setGreeting] = useState(() => getTimeBasedGreeting(new Date(), user?.name));

  useEffect(() => {
    const update = () => {
      setGreeting(getTimeBasedGreeting(new Date(), user?.name));
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [user?.name]);

  const fetchDashboardData = useCallback(async () => {
    setError(null);
    try {
      const data = await caDashboardService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load CA dashboard data:', err);
      setError('Unable to load practice dashboard metrics. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const firmName = user?.firmName || 'Chartered Accountants Practice Suite';

  if (loading && !dashboardData) {
    return <LoadingState message="Loading CA Practice metrics & statutory pipeline…" />;
  }

  if (error && !dashboardData) {
    return (
      <ErrorState
        message={error}
        onRetry={() => fetchDashboardData()}
      />
    );
  }

  return (
    <div className="ca-dashboard-container">
      {/* 1. TIME-BASED GREETING & FIRM INFORMATION */}
      <header className="zd-dashboard-hero-strip" aria-label="Dashboard Overview">
        <div className="zd-hero-strip__left">
          <div className="zd-hero-title-row">
            <h1 className="zd-hero-main-title">{greeting}</h1>
            <span className="zd-badge zd-badge--sm zd-demo-badge" title="Prototype mode synchronized with mock adapter">
              Demo data
            </span>
          </div>

          <div className="zd-hero-greeting-row">
            <span className="zd-hero-cop-badge">
              <ShieldCheck size={12} aria-hidden="true" />
              <span>COP Active • ICAI Reg.</span>
            </span>
            <span className="zd-hero-sep" aria-hidden="true">•</span>
            <span className="zd-hero-firm">
              <Building2 size={13} aria-hidden="true" />
              <span>{firmName}</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. EXACTLY THREE SUMMARY CARDS */}
      <SummaryCards
        summary={dashboardData?.summary}
      />

      {/* 3. TWO VISUALIZATION PANELS SIDE BY SIDE */}
      <div className="zd-analytics-grid-two-col">
        {/* Left: Current Documents (Horizontal Bar Chart) */}
        <PipelineChart
          stages={dashboardData?.pipelineStages || []}
        />

        {/* Right: Documents Created (Donut Chart) */}
        <CategoryChart
          categories={dashboardData?.categoriesCreated || []}
        />
      </div>

      {/* 4. FULL-WIDTH ACTIVITY GRAPH */}
      <ActivityChart />
    </div>
  );
}
