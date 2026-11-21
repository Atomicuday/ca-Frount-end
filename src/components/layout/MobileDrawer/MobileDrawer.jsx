import React from 'react';
import { X, LogOut, ShieldCheck } from 'lucide-react';
import ZapDocsLogo from '../../ZapDocsLogo';
import { NAV_ITEMS } from '../navigationItems';
import NavIcon from '../NavIcon';
import { useLanguage } from '../../../contexts/LanguageContext';
import './MobileDrawer.css';

export default function MobileDrawer({
  isOpen,
  onClose,
  activeNavId = 'dashboard',
  onNavigate,
  user,
  onLogout
}) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="ca-drawer-overlay" onClick={onClose}>
      <div className="ca-drawer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ca-drawer-header">
          <ZapDocsLogo size="sm" badge="CA" subtitle="Practice Suite" />
          <button
            type="button"
            className="ca-drawer-close-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Card in Drawer (Clickable for Profile & Settings) */}
        <div
          className="ca-drawer-profile"
          onClick={() => {
            onNavigate && onNavigate('profile');
            onClose();
          }}
          style={{ cursor: 'pointer' }}
          title="Profile & Settings"
        >
          <div className="ca-drawer-avatar">
            {user?.name
              ? user.name
                  .replace(/^(CA|Dr|Mr|Ms)\s+/i, '')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()
              : 'CA'}
          </div>
          <div>
            <div className="ca-drawer-name">{user?.name || 'CA Rajesh Sharma'}</div>
            <div className="ca-drawer-role">
              <ShieldCheck size={12} color="#0071e3" />
              <span>Membership: {user?.membershipNo || '058921'}</span>
            </div>
          </div>
        </div>

        {/* Navigation items (Strictly the 4 core tabs) */}
        <nav className="ca-drawer-nav">
          <div className="ca-drawer-section-title">Navigation</div>
          <ul className="ca-drawer-list">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNavId === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`ca-drawer-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onNavigate && onNavigate(item.id);
                      onClose();
                    }}
                  >
                    <NavIcon name={item.iconType} size={18} />
                    <span>{t(`nav_${item.id}`, item.label)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {onLogout && (
          <div className="ca-drawer-footer">
            <button
              type="button"
              className="ca-drawer-logout-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
            >
              <LogOut size={16} />
              <span>{t('logout', 'Log Out')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
