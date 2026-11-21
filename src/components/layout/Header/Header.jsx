import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  User,
  LogOut,
  Landmark,
  FileText,
  Users,
  LayoutDashboard,
  Check,
  ChevronDown,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCAAuth } from '../../../hooks/useCAAuth';
import ZapDocsLogo from '../../ZapDocsLogo';
import { NAV_ITEMS } from '../navigationItems';
import './Header.css';

export default function Header({
  activeNavId = 'dashboard',
  onNavigate,
  onOpenMobileMenu
}) {
  const { language, setLanguage, t, availableLanguages = [] } = useLanguage();
  const { user, logout } = useCAAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const profileRef = useRef(null);
  const langRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setProfileDropdownOpen(false);
    setLangDropdownOpen(false);
  }, [location.pathname]);

  const initials = user?.name
    ? user.name
        .replace(/^(CA|Dr|Mr|Ms)\s+/i, '')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'CA';

  const currentLangUpper = (language || 'EN').toUpperCase();

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
    navigate('/login');
  };

  return (
    <header className="zd-header topbar">
      <div className="zd-header__nav-row">
        <div className="zd-header__nav-left">
          {/* Mobile menu trigger */}
          <button
            type="button"
            className="topbar-menu-btn zd-header__menu-btn"
            id="btn-mobile-menu"
            onClick={onOpenMobileMenu}
            aria-label="Toggle navigation menu"
          >
            <Menu size={20} />
          </button>

          {/* Desktop Brand Logo */}
          <div
            className="zd-header__brand-block"
            onClick={() => (onNavigate ? onNavigate('dashboard') : navigate('/ca/dashboard'))}
            title="ZapDocs CA Portal"
          >
            <ZapDocsLogo size="md" badge="CA PORTAL" subtitle="Chartered Accountants Practice Suite" />
          </div>

          <div className="zd-header__brand-divider" aria-hidden="true" />

          {/* Center Navigation Bar across Desktop */}
          <nav className="zd-header__desktop-nav" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNavId === item.id;
              const IconComponent =
                item.id === 'dashboard'
                  ? LayoutDashboard
                  : item.id === 'clients'
                  ? Users
                  : item.id === 'documents'
                  ? FileText
                  : Landmark;

              return (
                <button
                  key={item.id}
                  type="button"
                  id={`nav-tab-${item.id}`}
                  className={`zd-nav-tab ${isActive ? 'active' : ''}`}
                  onClick={() => (onNavigate ? onNavigate(item.id) : navigate(item.route))}
                >
                  <IconComponent size={15} />
                  <span>{t(`nav_${item.id}`, item.label)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Language Selector and Profile Avatar */}
        <div className="zd-header__nav-right">
          {/* Language Selector Pill */}
          <div className="zd-header__lang-wrap" style={{ position: 'relative' }} ref={langRef}>
            <button
              type="button"
              className="zd-lang-pill-btn"
              id="btn-header-lang-toggle"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-label="Language Selector"
            >
              <span aria-hidden="true">🌐</span>
              <span>{currentLangUpper}</span>
              <ChevronDown size={13} />
            </button>

            {langDropdownOpen && (
              <div className="zd-lang-menu-dropdown">
                {availableLanguages.map((item) => {
                  const isSelected = language === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      id={`btn-lang-${item.code}`}
                      className={`zd-lang-menu-item ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setLanguage(item.code);
                        setLangDropdownOpen(false);
                      }}
                    >
                      <span>{item.fullLabel}</span>
                      {isSelected && <Check size={14} color="#0071e3" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Profile User Icon with Profile & Settings */}
          <div style={{ position: 'relative' }} ref={profileRef}>
            <button
              type="button"
              className="zd-icon-round-btn zd-icon-round-btn--user"
              id="btn-ca-profile"
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setLangDropdownOpen(false);
              }}
              title="CA Account & Settings"
              aria-label="CA Account & Settings"
            >
              <User size={16} />
            </button>

            {profileDropdownOpen && (
              <div className="zd-profile-dropdown" id="ca-profile-dropdown">
                {/* Profile Card Header */}
                <div className="zd-profile-card-header">
                  <div className="zd-profile-avatar">{initials}</div>
                  <div className="zd-profile-meta">
                    <div className="zd-profile-name">{user?.name || 'CA Rajesh Sharma'}</div>
                    <div className="zd-profile-firm">{user?.firmName || 'R. Sharma & Associates'}</div>
                    <div className="zd-profile-sub">{user?.email || 'rajesh.sharma@zapdocs.in'}</div>
                  </div>
                </div>

                {/* CA Credentials */}
                <div className="zd-profile-details">
                  <div className="zd-profile-detail-row">
                    <span className="zd-detail-label">Membership No.</span>
                    <span className="zd-detail-val">{user?.membershipNo || '058921'}</span>
                  </div>
                  <div className="zd-profile-detail-row">
                    <span className="zd-detail-label">Firm Reg. No.</span>
                    <span className="zd-detail-val">{user?.firmRegNo || '014298S'}</span>
                  </div>
                  <div className="zd-profile-detail-row">
                    <span className="zd-detail-label">COP Status</span>
                    <span className="badge badge-success">
                      <ShieldCheck size={11} /> Active
                    </span>
                  </div>
                </div>

                {/* Quick Nav Links: Profile & Settings under profile menu */}
                <div className="zd-profile-actions">
                  <button
                    type="button"
                    id="btn-profile-settings"
                    onClick={() => {
                      navigate('/ca/profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="zd-profile-action-btn"
                  >
                    <Settings size={14} />
                    <span>Profile & Firm Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="zd-profile-footer">
                  <button
                    type="button"
                    id="btn-profile-logout"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowLogoutDialog(true);
                    }}
                    className="zd-profile-logout-btn"
                  >
                    <LogOut size={14} />
                    <span>{t('logout', 'Log Out')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div
          className="modal-overlay"
          id="logout-confirmation-modal"
          onClick={() => setShowLogoutDialog(false)}
        >
          <div
            className="zd-card zd-logout-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Confirm Log Out</h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowLogoutDialog(false)}
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              Are you sure you want to log out of ZapDocs CA Portal?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowLogoutDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
