import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/layout/Header/Header';
import MobileDrawer from '../components/layout/MobileDrawer/MobileDrawer';
import { CAStateProvider } from '../contexts/CAStateContext';
import { useCAAuth } from '../hooks/useCAAuth';

import '../components/layout/AppLayout/AppLayout.css';
import '../components/layout/Header/Header.css';
import '../caPrototype.css';

const ROUTE_TO_NAV = {
  'dashboard': 'dashboard',
  'clients': 'clients',
  'documents': 'documents',
  'finance': 'finance',
  'profile': 'profile'
};

const NAV_TO_ROUTE = {
  'dashboard': '/ca/dashboard',
  'clients': '/ca/clients',
  'documents': '/ca/documents',
  'finance': '/ca/finance',
  'profile': '/ca/profile'
};

export function CALayout() {
  const { user, logout } = useCAAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathSegment = location.pathname.replace(/^\/ca\/?/, '').split('/')[0] || 'dashboard';
  const activeNavId = ROUTE_TO_NAV[pathSegment] || 'dashboard';

  function handleNavigate(navId) {
    const path = NAV_TO_ROUTE[navId] || '/ca/dashboard';
    navigate(path);
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <CAStateProvider>
      <div className="zd-app-shell zd-ca-shell">
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeNavId={activeNavId}
          onNavigate={handleNavigate}
          user={user}
          onLogout={handleLogout}
        />

        <div className="zd-main-wrapper">
          <Header
            activeNavId={activeNavId}
            onNavigate={handleNavigate}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />

          <main className="zd-content-viewport" id="main-content">
            <div className="zd-content-container">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </CAStateProvider>
  );
}

export default CALayout;
