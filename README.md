# Vanguard Cargo - Warehouse Management System

## Overview

Vanguard Cargo is a warehouse-to-warehouse international cargo platform that enables customers to ship packages from foreign countries to local warehouses for pickup. The warehouse system is the operational core that manages package processing, international shipping, and customer pickup coordination.

## Business Model

**Warehouse-to-Warehouse Pickup Service:**

- Customers submit requests for packages to be collected from foreign warehouses
- Packages are processed and shipped internationally to local warehouses
- Customers are notified when packages arrive at the local warehouse
- Customers visit the local warehouse to collect their packages (no home delivery)

## Features

- User authentication (register, login, forgot password)
- Protected client dashboard for package requests and tracking
- International shipment creation and tracking
- Warehouse staff management for package processing
- Customer notification system for pickup coordination
- Admin shipment management with barcode generation
- Responsive layout with sidebar and navbar
- **Admin Shipment History Barcode & Advanced Filter UI**
  - Barcode column displays a scannable PNG barcode for each shipment, generated from the tracking URL using `generateTrackingBarcode` utility.
  - Professional filter UI with status tabs, live search, and animated date filter dropdown, matching the "Awaiting Shipment List" reference exactly.
  - All filter state (status, search, date) handled with robust React state and clean OOP code.
  - Code is thoroughly commented and follows best practices for maintainability and extensibility.

## Recent UI Changes

- Navbar
  - Removed the global search bar from `src/components/layout/AppNavbar.tsx`.
  - Implemented live unread notifications count using Supabase on the `notifications` table with real-time updates.
    - Uses `TABLES.NOTIFICATIONS`, filters by `user_id`, `is_read = false`.
    - Subscribes via `subscribeToTable` to refresh count on inserts/updates/deletes.
- Authentication Loader
  - Eliminated the full-screen red "Authenticating..." loader by updating `src/components/RouteGuard.tsx`.
  - The app no longer blocks rendering during auth initialization; redirects happen only after auth state is known.
- Incoming Requests Page
  - Fixed a critical crash on the Incoming Requests page (`src/app/pages/IncomingRequest/IncomingRequest.tsx`) caused by multiple errors, including a `ReferenceError`.
  - Refactored the component to remove mock data and correctly fetch, filter, and display live package data from the `WarehouseService`.
  - Resolved all related type errors and cleaned up unused code.
- Supabase Foreign Key Fix
  - Corrected all Supabase queries in `src/services/WarehouseService.ts` to use the proper syntax for joining the `packages` and `users` tables.
  - This resolves the "Could not find a relationship" error and ensures all package data is fetched correctly.
- Package Intake Suite Number Format
  - Updated package intake interface to accept any suite number format (VC-001, S001, A123, etc.).
  - Previously the UI placeholder suggested only "VC-" format, but the system always supported any format.
  - Updated placeholder text and documentation to clarify format flexibility.

## Authentication & Test Credentials

The warehouse system uses role-based access control (RBAC) with three user roles and mock authentication for testing purposes.

### Login Format

- **Employee ID**: 10-digit number
- **Password**: 6-character string

### Test Credentials

#### Worker Role

- **Employee ID**: `1234567890` | **Password**: `work01`
- **Employee ID**: `2345678901` | **Password**: `work02`
- **Employee ID**: `3456789012` | **Password**: `work03`

**Permissions**: Dashboard, Incoming Requests, Shipment History, Inventory

#### Inventory Analyst Role

- **Employee ID**: `4567890123` | **Password**: `inv001`
- **Employee ID**: `5678901234` | **Password**: `inv002`
- **Employee ID**: `6789012345` | **Password**: `inv003`

**Permissions**: Dashboard, Shipment History, Analysis Report, Inventory

#### Manager Role

- **Employee ID**: `7890123456` | **Password**: `mgr001`
- **Employee ID**: `8901234567` | **Password**: `mgr002`
- **Employee ID**: `9012345678` | **Password**: `mgr003`
- **Employee ID**: `0123456789` | **Password**: `mgr004`

**Permissions**: Full access to all features (Dashboard, Incoming Requests, Create Shipment, Shipment History, Analysis Report, Inventory)

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```