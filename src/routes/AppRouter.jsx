import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CAAuthProvider } from '../contexts/CAAuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ProtectedCARoute } from './ProtectedRoute';
import { CALayout } from '../layouts/CALayout';
import {
  CADashboardPage,
  CAClientsPage,
  CADocumentsPage,
  CAFinancePage,
  CAProfilePage
} from '../pages/ca/caPages';
import { NotFoundPage } from '../pages/NotFoundPage';

const CAApp = () => (
  <ProtectedCARoute>
    <CALayout />
  </ProtectedCARoute>
);

export const AppRouter = () => (
  <BrowserRouter>
    <ThemeProvider>
      <LanguageProvider>
        <CAAuthProvider>
          <Routes>
            {/* Direct entry: Redirect to CA Dashboard */}
            <Route path="/" element={<Navigate to="/ca/dashboard" replace />} />

            {/* Login alias: Redirect straight to CA Dashboard in prototype shell */}
            <Route path="/login" element={<Navigate to="/ca/dashboard" replace />} />
            <Route path="/ca/login" element={<Navigate to="/ca/dashboard" replace />} />

            {/* CA Portal routes nested under CALayout */}
            <Route path="/ca" element={<CAApp />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CADashboardPage />} />
              <Route path="clients" element={<CAClientsPage />} />
              <Route path="documents" element={<CADocumentsPage />} />
              <Route path="finance" element={<CAFinancePage />} />
              <Route path="profile" element={<CAProfilePage />} />
              <Route path="settings" element={<Navigate to="profile" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* 404 & Fallback */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/ca/dashboard" replace />} />
          </Routes>
        </CAAuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default AppRouter;
