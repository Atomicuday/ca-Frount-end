import { useState } from 'react';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import MobileDrawer from '../MobileDrawer/MobileDrawer';
import './AppLayout.css';

export default function AppLayout({
  activeNavId = 'dashboard',
  onNavigate,
  user,
  onLogout,
  children
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="zd-app-shell zd-ca-shell">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar
        activeNavId={activeNavId}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Mobile Drawer (visible on narrow screens when triggered) */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeNavId={activeNavId}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
      />

      {/* Main View Area */}
      <div className="zd-main-wrapper">
        <Header
          activeNavId={activeNavId}
          onNavigate={onNavigate}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="zd-content-viewport" id="main-content">
          <div className="zd-content-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
