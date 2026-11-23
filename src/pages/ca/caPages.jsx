import React from 'react';
import CADashboardScreen from '../../screens/CADashboard/CADashboardScreen';
import CAClientsScreen from '../../screens/CAClients/CAClientsScreen';
import CADocumentsScreen from '../../screens/CADocuments/CADocumentsScreen';
import CAFinanceScreen from '../../screens/CAFinance/CAFinanceScreen';
import CAProfileScreen from '../../screens/CAProfile/CAProfileScreen';
import CADocumentCreatePlaceholderPage from './CADocumentCreatePlaceholderPage';

export const CADashboardPage = () => <CADashboardScreen />;
export const CAClientsPage = () => <CAClientsScreen />;
export const CADocumentsPage = () => <CADocumentsScreen />;
export const CAFinancePage = () => <CAFinanceScreen />;
export const CAProfilePage = () => <CAProfileScreen />;
export const CADocumentCreatePage = () => <CADocumentCreatePlaceholderPage />;
