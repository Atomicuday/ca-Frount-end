import React from 'react';
import { LogOut, ShieldCheck, Settings } from 'lucide-react';
import ZapDocsLogo from '../../ZapDocsLogo';
import { NAV_ITEMS } from '../navigationItems';
import NavIcon from '../NavIcon';
import { useCAAuth } from '../../../hooks/useCAAuth';
import { useCAState } from '../../../hooks/useCAState';
import { useLanguage } from '../../../contexts/LanguageContext';
import './Sidebar.css';

export default function Sidebar({ activeNavId = 'dashboard', onNavigate, onLogout }) {
  const { user } = useCAAuth();
  const { clients, documents } = useCAState();
  const { t } = useLanguage();

  const initials = user?.name
    ? user.name
        .replace(/^(CA|Dr|Mr|Ms)\s+/i, '')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'CA';

  return (
    <aside className="zd-sidebar sidebar" aria-label="Main Navigation">
      <div className="zd-sidebar__brand">
        <ZapDocsLogo size="md" badge="CA" subtitle="Practice Suite" />
      </div>

      {/* Profile Chip */}
      <div className="ca-profile-chip">
        <div className="ca-chip-avatar">{initials}</div>
        <div className="ca-chip-meta">
          <div className="ca-chip-name">{user?.name || 'CA Rajesh Sharma'}</div>
          <div className="ca-chip-role">
            <ShieldCheck size={12} color="#0071e3" />
            <span>Fellow Chartered Accountant</span>
          </div>
        </div>
      </div>

      <nav className="zd-sidebar__nav">
        <div className="sidebar-section-label">Practice Modules</div>
        <ul className="zd-sidebar__list" role="list">
          {NAV_ITEMS.map((item) => {
            const isActive = activeNavId === item.id;
            let countBadge = null;
            if (item.id === 'clients') countBadge = clients.length;
            if (item.id === 'documents') countBadge = documents.length;

            return (
              <li key={item.id} className="zd-sidebar__item">
                <button
                  type="button"
                  className={`zd-sidebar__link ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate && onNavigate(item.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <NavIcon name={item.iconType} size={18} />
                    <span>{t(`nav_${item.id}`, item.label)}</span>
                  </div>
                  {countBadge !== null && (
                    <span className="ca-nav-count-badge">{countBadge}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-section-label" style={{ marginTop: 20 }}>Settings</div>
        <ul className="zd-sidebar__list" role="list">
          <li className="zd-sidebar__item">
            <button
              type="button"
              className={`zd-sidebar__link ${activeNavId === 'profile' ? 'active' : ''}`}
              onClick={() => onNavigate && onNavigate('profile')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Settings size={18} />
                <span>Profile & Settings</span>
              </div>
            </button>
          </li>
        </ul>
      </nav>

      {onLogout && (
        <div className="zd-sidebar__footer">
          <button type="button" className="ca-sidebar-logout-btn" onClick={onLogout}>
            <LogOut size={16} />
            <span>{t('logout', 'Log Out')}</span>
          </button>
        </div>
      )}
    </aside>
  );
}
