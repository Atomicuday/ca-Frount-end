import React from 'react';
import { Plus, Landmark, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { useCAState } from '../../hooks/useCAState';
import { formatIndianCurrency } from '../../utils/validation';
import './CAFinance.css';

export default function CAFinanceScreen() {
  const { finances } = useCAState();

  return (
    <div className="ca-finance-screen">
      <div className="ca-page-header">
        <div className="ca-page-title-wrap">
          <h1 className="ca-page-title">Practice Finance & Billing</h1>
          <p className="ca-page-subtitle">
            Manage retainer billings, professional audit fee invoices, and UPI settlements
          </p>
        </div>
        <div className="ca-page-actions">
          <button type="button" className="btn btn-primary" id="btn-create-invoice">
            <Plus size={15} />
            <span>+ Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Finance Metrics */}
      <div className="ca-kpi-grid">
        <div className="ca-kpi-card">
          <div className="ca-kpi-icon-wrap" style={{ background: 'rgba(0, 113, 227, 0.1)', color: '#0071e3' }}>
            <Landmark size={24} />
          </div>
          <div className="ca-kpi-info">
            <span className="ca-kpi-label">Monthly Retainers</span>
            <span className="ca-kpi-value">{formatIndianCurrency(finances?.monthlyRetainers || 285000)}</span>
            <span className="ca-kpi-sub">Contracted retainer agreements</span>
          </div>
        </div>

        <div className="ca-kpi-card">
          <div className="ca-kpi-icon-wrap" style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="ca-kpi-info">
            <span className="ca-kpi-label">Collected This Month</span>
            <span className="ca-kpi-value">{formatIndianCurrency(finances?.collectedThisMonth || 195000)}</span>
            <span className="ca-kpi-sub">Direct UPI & Bank settlements</span>
          </div>
        </div>

        <div className="ca-kpi-card">
          <div className="ca-kpi-icon-wrap" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
            <Clock size={24} />
          </div>
          <div className="ca-kpi-info">
            <span className="ca-kpi-label">Outstanding Invoices</span>
            <span className="ca-kpi-value">{formatIndianCurrency(finances?.pendingInvoices || 90000)}</span>
            <span className="ca-kpi-sub">3 pending client disbursements</span>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="zd-card ca-finance-card">
        <div className="ca-card-header">
          <div>
            <h2 className="ca-card-title">Recent Invoices & Retainer Receipts</h2>
            <p className="ca-card-sub">GST compliant tax invoices issued to practice clients</p>
          </div>
        </div>

        <div className="ca-table-wrap">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Client Name</th>
                <th>Amount</th>
                <th>Billing Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(finances?.invoices || []).map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{inv.id}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{inv.client}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{formatIndianCurrency(inv.amount)}</span>
                  </td>
                  <td>{inv.date}</td>
                  <td>
                    <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }}>
                      <span>View</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
