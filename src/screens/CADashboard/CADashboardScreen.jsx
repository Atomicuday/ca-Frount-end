import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  CheckCircle,
  Landmark,
  Plus,
  ArrowUpRight,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useCAState } from '../../hooks/useCAState';
import { useCAAuth } from '../../hooks/useCAAuth';
import { formatIndianCurrency } from '../../utils/validation';
import './CADashboard.css';

export default function CADashboardScreen() {
  const navigate = useNavigate();
  const { user } = useCAAuth();
  const { clients, documents, finances } = useCAState();

  return (
    <div className="ca-dashboard-screen">
      {/* Welcome Banner */}
      <div className="ca-welcome-banner zd-card">
        <div>
          <h1 className="ca-welcome-title">
            Welcome back, {user?.name || 'CA Rajesh Sharma'} 👋
          </h1>
          <p className="ca-welcome-sub">
            {user?.firmName || 'R. Sharma & Associates'} • Practice Suite & Tax Compliance Hub
          </p>
        </div>
        <div className="ca-welcome-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/ca/clients')}
          >
            <Users size={14} />
            <span>Manage Clients</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/ca/documents')}
          >
            <Plus size={14} />
            <span>+ New Filing / Document</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="ca-kpi-grid">
        <div className="ca-kpi-card" onClick={() => navigate('/ca/clients')} style={{ cursor: 'pointer' }}>
          <div className="ca-kpi-icon-wrap" style={{ background: 'rgba(0, 113, 227, 0.1)', color: '#0071e3' }}>
            <Users size={24} />
          </div>
          <div className="ca-kpi-info">
            <span className="ca-kpi-label">Active Clients</span>
            <span className="ca-kpi-value">{clients.length || 48}</span>
            <span className="ca-kpi-sub">Corporate & Individuals</span>
          </div>
        </div>

        <div className="ca-kpi-card" onClick={() => navigate('/ca/documents')} style={{ cursor: 'pointer' }}>
          <div className="ca-kpi-icon-wrap" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
            <Clock size={24} />
          </div>
          <div className="ca-kpi-info">
            <span className="ca-kpi-label">Pending Filings</span>
            <span className="ca-kpi-value">12</span>
            <span className="ca-kpi-sub">GST & Tax returns due</span>
          </div>
        </div>

        <div className="ca-kpi-card" onClick={() => navigate('/ca/documents')} style={{ cursor: 'pointer' }}>
          <div className="ca-kpi-icon-wrap" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
            <CheckCircle size={24} />
          </div>
          <div className="ca-kpi-info">
            <span className="ca-kpi-label">Completed Returns</span>
            <span className="ca-kpi-value">184</span>
            <span className="ca-kpi-sub">FY 2025-26 audits & returns</span>
          </div>
        </div>

        <div className="ca-kpi-card" onClick={() => navigate('/ca/finance')} style={{ cursor: 'pointer' }}>
          <div className="ca-kpi-icon-wrap" style={{ background: 'rgba(147, 51, 234, 0.1)', color: '#9333ea' }}>
            <Landmark size={24} />
          </div>
          <div className="ca-kpi-info">
            <span className="ca-kpi-label">Monthly Retainers</span>
            <span className="ca-kpi-value">{formatIndianCurrency(finances?.monthlyRetainers || 285000)}</span>
            <span className="ca-kpi-sub">82% collected</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Compliance Deadlines & Recent Documents */}
      <div className="ca-dashboard-split">
        {/* Left Column: Recent Practice Activity */}
        <div className="zd-card ca-dashboard-card">
          <div className="ca-card-header">
            <div>
              <h2 className="ca-card-title">Recent Document Activity</h2>
              <p className="ca-card-sub">Latest audits, tax computations, and client submissions</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/ca/documents')}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="ca-recent-list">
            {documents.slice(0, 4).map((doc) => (
              <div key={doc.id} className="ca-recent-item">
                <div className="ca-recent-icon">
                  <FileText size={18} color="#0071e3" />
                </div>
                <div className="ca-recent-meta">
                  <div className="ca-recent-name">{doc.title}</div>
                  <div className="ca-recent-client">{doc.clientName} • {doc.category}</div>
                </div>
                <div className="ca-recent-status">
                  <span className={`badge ${doc.status === 'eSigned' ? 'badge-success' : 'badge-warning'}`}>
                    {doc.status}
                  </span>
                  <span className="ca-recent-date">{doc.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Upcoming Filing Deadlines */}
        <div className="zd-card ca-dashboard-card">
          <div className="ca-card-header">
            <div>
              <h2 className="ca-card-title">Statutory Deadlines</h2>
              <p className="ca-card-sub">Urgent GST, TDS and Income Tax deadlines</p>
            </div>
          </div>

          <div className="ca-deadline-list">
            <div className="ca-deadline-item urgent">
              <div className="ca-deadline-badge">
                <AlertTriangle size={15} />
                <span>Due in 3 Days</span>
              </div>
              <div className="ca-deadline-info">
                <h4>GSTR-3B Monthly Return (Oct 2026)</h4>
                <p>Applies to regular taxpayers with turnover &gt; ₹5 Cr</p>
              </div>
            </div>

            <div className="ca-deadline-item">
              <div className="ca-deadline-badge info">
                <Clock size={15} />
                <span>Due 07 Dec</span>
              </div>
              <div className="ca-deadline-info">
                <h4>TDS/TCS Deposit (Nov 2026)</h4>
                <p>Challan ITNS 281 deposit for corporate deductions</p>
              </div>
            </div>

            <div className="ca-deadline-item">
              <div className="ca-deadline-badge info">
                <Clock size={15} />
                <span>Due 15 Dec</span>
              </div>
              <div className="ca-deadline-info">
                <h4>Advance Tax 3rd Installment (75%)</h4>
                <p>Individuals and corporate entities liability evaluation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
