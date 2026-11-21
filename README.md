# ZapDocs CA Frontend (`ZapDocs-CA-FE`)

Chartered Accountants Practice Management, Tax Filings, Client Vault & Compliance Portal.

## Architecture Overview

Built using the exact architectural patterns and glassmorphism design system established in `ZapDocs-Realestate-FE`, adapted specifically for Chartered Accountants:

- **Framework**: React 19 + Vite 8
- **Routing & Layout**: `react-router-dom` (v7) with `CALayout`, desktop tab pills, and mobile slide-out navigation drawer
- **State & Context**:
  - `ThemeContext`: light/dark theme persistence with `data-theme` attribute
  - `LanguageContext`: i18n support across 5 regional languages (EN, HI, TE, KN, MR)
  - `CAAuthContext`: CA practitioner credentials, COP status, and session management
  - `CAStateContext`: practice management state (Clients, Documents, Finances, Modals, Toasts)
- **Design System**: Apple-inspired glassmorphism tokens (`--zd-glass-bg`, `--zd-glass-border`, `--zd-glass-blur`), Inter typography, responsive layouts
- **Core Modules**:
  - **Dashboard** (`/ca/dashboard`): Practice KPIs, active clients, pending filings, statutory deadlines
  - **Clients** (`/ca/clients`): Client management vault with search, entity type filters (Corporate, LLP, Individual), PAN/GSTIN tracking
  - **Documents** (`/ca/documents`): Tax & audit document repository with eSign status badges and category filtering
  - **Finance** (`/ca/finance`): Retainer billings, collection summaries, GST-compliant invoice tracking
  - **Profile & Settings** (`/ca/profile`): ICAI practitioner credentials, FRN, COP verification, bank & UPI settlements (nested under Profile menu)

## Clean Build Scripts (Security & Reliability)

Standard, secure build scripts are used directly via Vite and Node test runners without any obfuscated init wrappers:

- `npm run dev`: Starts local Vite development server
- `npm run build`: Generates production bundle with tree-shaking
- `npm run lint`: Fast linting with Oxlint
- `npm test`: Node.js native test runner executing architecture and design system validation suites
- `npm run preview`: Previews the production build locally
