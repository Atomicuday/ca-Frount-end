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
  CAProfilePage,
  CADocumentCreatePage
} from '../pages/ca/caPages';
import ClientDraftReviewPage from '../pages/client/ClientDraftReviewPage';
import ClientSigningPage from '../pages/client/ClientSigningPage';
import CALoginScreen from '../screens/CALogin/CALoginScreen';
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

            {/* Practitioner Authentication Routes */}
            <Route path="/login" element={<CALoginScreen />} />
            <Route path="/ca/login" element={<CALoginScreen />} />

            {/* Recipient-Facing Routes: Draft Review & Statutory Signing */}
            <Route path="/review/:token" element={<ClientDraftReviewPage />} />
            <Route path="/sign/:token" element={<ClientSigningPage />} />

            {/* CA Portal routes nested under CALayout */}
            <Route path="/ca" element={<CAApp />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CADashboardPage />} />
              <Route path="clients" element={<CAClientsPage />} />
              <Route path="documents" element={<CADocumentsPage />} />
              <Route path="documents/create" element={<CADocumentCreatePage />} />
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
