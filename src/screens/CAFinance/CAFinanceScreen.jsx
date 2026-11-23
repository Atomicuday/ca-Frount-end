import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { caBillingService, formatINR } from '../../services/api/caBillingService.js';
import AddMoneyModal from './modals/AddMoneyModal.jsx';
import TransactionDetailsModal from './modals/TransactionDetailsModal.jsx';
import './CAFinance.css';

export default function CAFinanceScreen() {
  // Wallet State
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);

  // Spending Summary State
  const [spendingPeriod, setSpendingPeriod] = useState('current_fy'); // 'this_month' | 'last_30d' | 'current_fy' | 'all_time'
  const [spendingSummary, setSpendingSummary] = useState(null);
  const [spendingLoading, setSpendingLoading] = useState(true);

  // Transaction History State
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Toast State
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const transactionsSectionRef = useRef(null);

  // Live Toast
  const showToast = useCallback((message, type = 'success') => {
    setToastMessage({ message, type });
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch Wallet Balance
  const loadWallet = useCallback(async () => {
    try {
      setWalletLoading(true);
      const data = await caBillingService.getWalletBalance();
      setWallet(data);
    } catch (err) {
      console.error('Failed to load CA wallet:', err);
      showToast('Unable to load wallet balance. Showing cached figures.', 'error');
    } finally {
      setWalletLoading(false);
    }
  }, [showToast]);

  // Fetch Spending Summary
  const loadSpending = useCallback(async (period) => {
    try {
      setSpendingLoading(true);
      const data = await caBillingService.getSpendingSummary(period);
      setSpendingSummary(data);
    } catch (err) {
      console.error('Failed to load spending summary:', err);
    } finally {
      setSpendingLoading(false);
    }
  }, []);

  // Fetch Transactions List
  const loadTransactions = useCallback(async () => {
    try {
      setTransactionsLoading(true);
      const res = await caBillingService.getTransactions({
        search: searchTerm,
        service: serviceFilter,
        type: typeFilter,
        status: statusFilter,
        page: currentPage,
        limit: pageSize
      });
      setTransactions(res.data || []);
      setTotalTransactions(res.total || 0);
    } catch (err) {
      console.error('Failed to load billing transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  }, [searchTerm, serviceFilter, typeFilter, statusFilter, currentPage]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    loadSpending(spendingPeriod);
  }, [spendingPeriod, loadSpending]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Reset pagination on search or filter change
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setServiceFilter('ALL');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  // Top-Up Success Handler
  const handleTopUpSuccess = (newTxn, newBalancePaise, message) => {
    loadWallet();
    loadSpending(spendingPeriod);
    loadTransactions();
    showToast(message || `Wallet credited with ${formatINR(newTxn.amountPaise)}.`, 'success');
  };

  // View Wallet History scroll action
  const handleScrollToHistory = () => {
    setTypeFilter('TOPUP');
    setCurrentPage(1);
    if (transactionsSectionRef.current) {
      transactionsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open Details Modal
  const handleOpenDetails = (txn) => {
    setSelectedTxn(txn);
    setIsDetailsOpen(true);
  };

  const totalPages = Math.ceil(totalTransactions / pageSize) || 1;

  return (
    <div className="ca-finance-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`zd-floating-toast zd-floating-toast--${toastMessage.type}`} role="status">
          <CheckCircle2 size={16} />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="ca-page-header">
        <div className="ca-page-title-wrap">
          <h1 className="ca-page-title">Wallet & Billing</h1>
          <p className="ca-page-subtitle">
            Manage your wallet, service charges and payment history.
          </p>
        </div>
        <div className="ca-page-actions">
          <button
            type="button"
            className="zd-btn-action zd-btn-action--primary"
            id="btn-open-add-money-header"
            onClick={() => setIsAddMoneyOpen(true)}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Add Money</span>
          </button>
        </div>
      </div>

      {/* 2. CA WALLET PANEL */}
      <div className="zd-card ca-wallet-hero-card">
        <div className="ca-wallet-hero-main">
          <div className="ca-wallet-badge-row">
            <div className="ca-wallet-icon-badge">
              <Wallet size={20} color="#2563eb" />
            </div>
            <div className="ca-wallet-account-meta">
              <span className="ca-wallet-account-num">
                {wallet?.accountNumber || 'ZD-WAL-56291'}
              </span>
              <span className="ca-wallet-firm-tag">
                {wallet?.firmName || 'R. Sharma & Associates'}
              </span>
            </div>
          </div>

          <div className="ca-wallet-balance-group">
            <span className="ca-wallet-balance-label">Available Wallet Balance</span>
            <div className="ca-wallet-balance-val">
              {walletLoading ? (
                <span style={{ fontSize: 24, color: '#94a3b8' }}>Loading balance…</span>
              ) : (
                formatINR(wallet?.availableBalancePaise || 0)
              )}
            </div>
            <p className="ca-wallet-explanation">
              Use your balance to pay for eligible document services.
            </p>
          </div>
        </div>

        {/* Wallet Right Section: Reserved Balance & Quick Actions */}
        <div className="ca-wallet-hero-side">
          <div className="ca-wallet-reserved-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#64748b" />
              <span className="ca-reserved-label">Reserved Amount:</span>
            </div>
            <strong className="ca-reserved-value">
              {formatINR(wallet?.reservedBalancePaise || 0)}
            </strong>
            <span className="ca-reserved-sub">
              Held for in-flight statutory eSign & eStamp handshakes
            </span>
          </div>

          <div className="ca-wallet-actions-row">
            <button
              type="button"
              className="zd-btn-action zd-btn-action--primary"
              id="btn-open-add-money"
              onClick={() => setIsAddMoneyOpen(true)}
            >
              <Plus size={15} />
              <span>Add Money</span>
            </button>
            <button
              type="button"
              className="zd-btn-action zd-btn-action--secondary"
              id="btn-view-wallet-history"
              onClick={handleScrollToHistory}
            >
              <Clock size={14} />
              <span>View Wallet History</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. SPENDING SUMMARY SECTION */}
      <div className="ca-spending-section">
        <div className="ca-spending-header">
          <div>
            <h2 className="ca-section-title">Spending Summary</h2>
            <p className="ca-section-sub">
              {spendingSummary?.periodLabel
                ? `Showing spending for ${spendingSummary.periodLabel}.`
                : 'Showing platform fee & statutory stamp debits.'}
            </p>
          </div>

          {/* Period Filter Dropdown */}
          <div className="ca-period-filter-wrap">
            <Calendar size={15} className="ca-period-icon" />
            <select
              id="select-spending-period"
              className="ca-period-select"
              value={spendingPeriod}
              onChange={(e) => setSpendingPeriod(e.target.value)}
              aria-label="Select spending reporting period"
            >
              <option value="this_month">This Month (Nov 2026)</option>
              <option value="last_30d">Last 30 Days</option>
              <option value="current_fy">Current FY (2025-26)</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="ca-spending-grid">
          {/* Total Spent */}
          <div className="ca-spend-card ca-spend-card--primary">
            <span className="ca-spend-label">Total Spent</span>
            <strong className="ca-spend-value">
              {spendingLoading ? '—' : formatINR(spendingSummary?.totalSpendPaise || 0)}
            </strong>
            <span className="ca-spend-meta">
              Excludes wallet top-ups (credits).
              {spendingSummary?.refundsPaise > 0 && (
                <span className="ca-refund-tag">
                  {formatINR(spendingSummary.refundsPaise)} refunded
                </span>
              )}
            </span>
          </div>

          {/* eSign Spend */}
          <div className="ca-spend-card">
            <span className="ca-spend-label">eSign Spend</span>
            <strong className="ca-spend-value">
              {spendingLoading ? '—' : formatINR(spendingSummary?.esignSpendPaise || 0)}
            </strong>
            <span className="ca-spend-meta">
              Class-3 DSC token & Aadhaar OTP verifications
            </span>
          </div>

          {/* eStamp Spend */}
          <div className="ca-spend-card">
            <span className="ca-spend-label">eStamp Spend</span>
            <strong className="ca-spend-value">
              {spendingLoading ? '—' : formatINR(spendingSummary?.estampSpendPaise || 0)}
            </strong>
            <span className="ca-spend-meta">
              Includes {formatINR(spendingSummary?.stampDutyPassthroughPaise || 0)} govt stamp duty
            </span>
          </div>
        </div>
      </div>

      {/* 4. TRANSACTION HISTORY */}
      <div className="zd-card ca-transactions-card" ref={transactionsSectionRef}>
        <div className="ca-transactions-header">
          <div>
            <h2 className="ca-card-title">Billing & Transaction History</h2>
            <p className="ca-card-sub">
              Auditable platform ledger of wallet top-ups, service debits, and verified refunds.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="ca-txn-filter-bar">
          <div className="ca-txn-search-wrap">
            <Search size={15} className="ca-txn-search-icon" aria-hidden="true" />
            <input
              type="text"
              id="input-txn-search"
              placeholder="Search by transaction reference, description, or doc ID…"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="ca-txn-search-input"
              aria-label="Search transactions"
            />
          </div>

          {/* Service Dropdown Filter */}
          <div className="ca-txn-filter-select-group">
            <select
              id="filter-txn-service"
              className="ca-txn-filter-select"
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by service"
            >
              <option value="ALL">All Services</option>
              <option value="TOPUP">Wallet Top-ups</option>
              <option value="ESIGN">eSign Verifications</option>
              <option value="ESTAMP">eStamp Duty & Stamping</option>
              <option value="OTHER">Statutory Template Charges</option>
              <option value="REFUND">Refunds</option>
            </select>

            {/* Type Dropdown Filter */}
            <select
              id="filter-txn-type"
              className="ca-txn-filter-select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by transaction type"
            >
              <option value="ALL">All Types</option>
              <option value="TOPUP">Top-up (Credit)</option>
              <option value="SERVICE_DEBIT">Service Debit</option>
              <option value="REFUND">Refund (Credit)</option>
            </select>

            {/* Status Dropdown Filter */}
            <select
              id="filter-txn-status"
              className="ca-txn-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="SETTLED">Settled</option>
              <option value="FAILED">Failed</option>
            </select>

            {(searchTerm || serviceFilter !== 'ALL' || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                className="zd-link-btn"
                onClick={handleClearFilters}
                style={{ fontSize: 12, padding: '4px 8px' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="ca-table-wrap">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Reference ID</th>
                <th>Description / Service</th>
                <th>Doc Ref</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Payment Source</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Receipt / Details</th>
              </tr>
            </thead>
            <tbody>
              {transactionsLoading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                    Loading billing transactions…
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                    No transactions found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isCredit = txn.type === 'TOPUP' || txn.type === 'REFUND';
                  const dateStr = new Date(txn.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                  const timeStr = new Date(txn.date).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={txn.id}>
                      {/* Date & Time */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{dateStr}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{timeStr}</div>
                      </td>

                      {/* Transaction Reference */}
                      <td>
                        <span className="zd-txn-ref-badge">{txn.id}</span>
                      </td>

                      {/* Description / Service */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{txn.description}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          Category: {txn.serviceCategory}
                        </div>
                      </td>

                      {/* Document Reference */}
                      <td>
                        {txn.docRef ? (
                          <span className="zd-doc-ref-pill">{txn.docRef}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Type */}
                      <td>
                        <span
                          className={`badge ${
                            txn.type === 'TOPUP'
                              ? 'badge-success'
                              : txn.type === 'REFUND'
                              ? 'badge-info'
                              : 'badge-warning'
                          }`}
                        >
                          {txn.type === 'TOPUP'
                            ? 'Top-up'
                            : txn.type === 'REFUND'
                            ? 'Refund'
                            : 'Service Debit'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td>
                        <strong className={`zd-txn-table-amount ${isCredit ? 'credit' : 'debit'}`}>
                          {isCredit ? '+' : '−'}
                          {formatINR(txn.amountPaise)}
                        </strong>
                      </td>

                      {/* Payment Source */}
                      <td>
                        <div style={{ fontSize: 12.5, color: '#334155' }}>{txn.paymentSource}</div>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`badge ${
                            txn.status === 'SETTLED'
                              ? 'badge-success'
                              : txn.status === 'FAILED'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {txn.status === 'SETTLED' ? 'Settled' : txn.status}
                        </span>
                      </td>

                      {/* Receipt / Details Action */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          id={`btn-view-txn-${txn.id}`}
                          onClick={() => handleOpenDetails(txn)}
                          style={{ fontSize: 12, padding: '4px 10px' }}
                          title={`View receipt and breakdown for ${txn.id}`}
                        >
                          <FileText size={12} />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Mobile Responsive Transactions Cards List (Active < 768px) */}
          {!transactionsLoading && transactions.length > 0 && (
            <div className="ca-mobile-txns-list">
              {transactions.map((txn) => {
                const isCredit = txn.type === 'TOPUP' || txn.type === 'REFUND';
                const dateStr = new Date(txn.date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });
                const timeStr = new Date(txn.date).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={txn.id} className="ca-mobile-txn-card">
                    <div className="ca-mobile-txn-top">
                      <div>
                        <span className="zd-txn-ref-badge">{txn.id}</span>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                          {dateStr} • {timeStr}
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          txn.status === 'SETTLED'
                            ? 'badge-success'
                            : txn.status === 'FAILED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {txn.status === 'SETTLED' ? 'Settled' : txn.status}
                      </span>
                    </div>

                    <div className="ca-mobile-txn-desc">
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>
                        {txn.description}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        Category: {txn.serviceCategory}
                        {txn.docRef && (
                          <span style={{ marginLeft: 6 }}>
                            • Doc: <span className="zd-doc-ref-pill">{txn.docRef}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ca-mobile-txn-bottom">
                      <div>
                        <strong className={`zd-txn-table-amount ${isCredit ? 'credit' : 'debit'}`}>
                          {isCredit ? '+' : '−'}{formatINR(txn.amountPaise)}
                        </strong>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{txn.paymentSource}</div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline"
                        id={`btn-view-txn-mobile-${txn.id}`}
                        onClick={() => handleOpenDetails(txn)}
                        style={{ fontSize: 12, padding: '6px 12px', minHeight: 38 }}
                        title={`View receipt and breakdown for ${txn.id}`}
                      >
                        <FileText size={12} />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination bar */}
          {totalTransactions > 0 && (
            <div className="ca-pagination-bar">
              <span className="ca-pagination-info">
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, totalTransactions)} of {totalTransactions} transactions
              </span>
              <div className="ca-pagination-controls">
                <button
                  type="button"
                  className="ca-pagination-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous transactions page"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  className="ca-pagination-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next transactions page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. ADD MONEY MODAL */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        onSuccess={handleTopUpSuccess}
        currentBalancePaise={wallet?.availableBalancePaise || 0}
      />

      {/* 6. TRANSACTION DETAILS & RECEIPT MODAL */}
      <TransactionDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTxn(null);
        }}
        transaction={selectedTxn}
      />
    </div>
  );
}
