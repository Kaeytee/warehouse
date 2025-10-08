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

### Core Functionality
- User authentication (register, login, forgot password)
- Protected client dashboard for package requests and tracking
- International shipment creation and tracking
- Warehouse staff management for package processing
- Customer notification system for pickup coordination
- Admin shipment management with barcode generation
- Responsive layout with sidebar and navbar

### New Advanced Features (Phase 1)

#### 📋 Digital Waybill Generation
- Automatic waybill generation for all shipments
- Comprehensive document including sender/receiver details, package inventory, tracking IDs
- Printable format with barcode and QR code integration
- Automatic download and print preview capabilities
- Stored in database for audit trail and reprinting

#### 📊 Barcode & QR Code System
- Automatic barcode generation for all packages and shipments using tracking IDs
- QR codes linking to public tracking endpoints
- Multiple format support (CODE128, CODE39, QR)
- Scannable codes for warehouse operations
- Printable and downloadable code formats

#### 🧾 Receipt Generation
- Package intake receipts generated automatically upon package arrival
- Shipment creation receipts for consolidated shipments
- Professional receipt layout with VanguardCargo branding
- Includes: suite number, package details, tracking ID, timestamps, barcode
- Complete audit trail with receipt history
- Print and download capabilities

#### 📥 Download All Documents as ZIP
- One-click download of all shipment-related documents
- Automatically bundles waybill and all package receipts into a single ZIP file
- Professional PDF generation with VanguardCargo branding
- Smart file naming: `Shipment_<TrackingNumber>_<Date>_Documents.zip`
- Individual files named clearly: `Waybill_<TrackingNumber>.pdf`, `Package_<PackageID>_Receipt.pdf`
- Uses jsPDF and html2canvas for high-quality PDF generation
- Loading state with progress indicator during generation
- Error handling for individual document failures without stopping the process

#### 📅 Automatic Estimated Delivery Calculation
- Automatically calculates estimated delivery date based on service type when creating shipments
- Service type delivery windows:
  - **Standard**: 5-7 business days
  - **Express**: 3-5 business days  
  - **Overnight**: 1-2 business days
- Displays calculated delivery date and timeframe in consolidated shipment view
- No manual date entry required - fully automated

#### 📦 Enhanced Consolidation System
- Packages linked to shipments via `linked_to_shipment_id` field
- Aggregated metrics: total weight, value, package count
- Suite number tracking for all packages in shipment
- Complete traceability from package to shipment
- Ability to unlink packages from shipments if needed

#### 🔐 Delivery Authentication Code System (Updated 2025-10-07)
- **Auto-generated unique 6-digit codes per customer** when shipment marked as "arrived"
- **Plain text storage** - customers can view their codes in client app
- **One code per customer** - all packages from same customer share one code
- **Secure delivery workflow** - codes cannot be verified from Shipment History page
- **Mandatory Delivery page verification** - staff must verify code + suite number
- **Complete audit trail** - all verification attempts logged with staff ID, timestamp, success/failure
- **One-time use** - codes invalidated after successful delivery
- See `DELIVERY_AUTH_SYSTEM.md` for complete documentation

#### ✅ Delivery Verification Process
- Shipments marked "arrived" trigger automatic code generation for all customers
- Customers retrieve codes via `get_customer_delivery_codes()` in client app
- Staff uses Delivery page to verify suite number + 6-digit code
- Package marked "delivered" only after successful verification
- `arrived → delivered` status transition blocked in Shipment History (must use Delivery page)
- Complete security logging in `package_verification_log` table

### Admin Shipment History UI
- Barcode column displays scannable PNG barcode for each shipment
- Professional filter UI with status tabs, live search, and date filtering
- Animated filter dropdown matching design standards
- Robust state management with clean OOP code
- Thoroughly commented for maintainability

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

#### 📊 Analytics Dashboard with Professional Charts (Updated 2025-10-08)
- **Modern Header Design**: Updated Analytics Dashboard header to match Inventory page styling with gradient banner
- **Professional Data Visualization**: Implemented complete charting system using Recharts library
  - **Distribution Analysis (Pie Chart)**: Shows breakdown by status/category with dynamic theming
  - **Volume Trends (Bar Chart)**: Displays activity trends over time (monthly/daily patterns)
  - **Performance Metrics (Area Chart)**: Visualizes warehouse operational metrics (shipment volume, package counts, weight distribution, user growth) - **no pricing/value data**
  - **Top Performers (Horizontal Bar Chart)**: Shows top destinations, stores by package volume, or most active users
- **Warehouse-Focused Metrics** (No Pricing):
  - Shipments: Total shipments and completed count trends
  - Packages: Package count and estimated weight by store
  - Users: User count and geographic percentage distribution
- **Responsive & Professional Design**:
  - All charts fully responsive with `ResponsiveContainer`
  - Custom tooltips with branded styling
  - Dynamic color schemes based on report type (red for shipments, purple for packages, emerald for users)
  - Professional loading states and empty data handling
  - Smooth animations and hover effects
- **Real Data Integration**: Charts pull live data from Supabase via `AnalyticsService`
- **Theme-Aware**: Charts change colors automatically when switching between report types
- **Clean Code Architecture**: Well-documented components with OOP principles and best practices

#### 👥 User Management System (Added 2025-10-08)
- **Comprehensive User Overview**: View all registered users with detailed information
  - User details: Name, email, contact information, suite number, role, status
  - Real-time statistics dashboard with 6 metric cards:
    - Total Users, Active Users, Inactive Users, Suspended Users, Clients, Admins
  - Professional table layout with sortable columns and hover effects
- **Status Management**: 
  - Activate/Deactivate users with one-click toggle
  - Status options: `active`, `inactive`, `suspended`, `reported`
  - Real-time status updates with database synchronization
  - Visual status badges with color coding (green/gray/red/yellow)
- **Advanced Filtering & Search**:
  - Filter by status: All, Active, Inactive, Suspended
  - Live search across name, email, and suite number
  - Click-to-filter stat cards for quick navigation
  - Results count display
- **Professional UI Design**:
  - Modern gradient header matching system design
  - Interactive stat cards with hover effects and animations
  - Responsive table design with proper overflow handling
  - Role badges distinguishing Administrators from Clients
  - Contact information display (phone & WhatsApp)
- **Service Architecture**:
  - `UserManagementService`: Clean OOP service class
  - Database integration via Supabase
  - Comprehensive error handling
  - Helper methods for formatting and color coding
- **Security & Permissions**:
  - Only administrators (super_admin, admin, warehouse_admin) can access
  - Protected route with role-based access control
  - Audit trail via updated_at timestamp
- **Files Created**:
  1. `src/services/UserManagementService.ts` - User management service with all business logic
  2. `src/app/pages/UserManagement/UserManagement.tsx` - Main user management component
  3. Updated `src/App.tsx` - Added route and navigation

#### 📞 Professional International Phone Input & Enhanced Form Design (Added 2025-10-08)
- **Smart Phone Number Field** in Create Shipment form:
  - International phone input with country code selection dropdown
  - Flag icons for visual country identification
  - Automatic phone number formatting based on country standards
  - Real-time validation of phone number format
  - Search functionality in country dropdown
- **Auto-Population Feature**:
  - Delivery country field automatically populates based on phone number's country code
  - Intelligent country name mapping (60+ countries supported)
  - Country field is **read-only** - populated only from phone country code selection
  - Gray background indicates non-editable field
- **Modern Professional Form Styling**:
  - **Rounded corners (rounded-xl)** for modern appearance
  - **2px borders** with gray-200 default color
  - **Enhanced padding** (px-4 py-3) for comfortable input
  - **Hover effects** - border darkens on hover
  - **Focus states** - Red ring (ring-2) with border color change
  - **Smooth transitions** - 200ms duration for all state changes
  - **Box shadows** - Subtle shadows for depth
  - **Section headers** with green gradient accent bars
  - **Bold labels** with proper spacing (mb-2)
  - **Consistent spacing** (gap-5) between form elements
  - **Professional textarea** with resize disabled
  - **Styled select dropdown** matching input design
- **Enhanced UX Features**:
  - One-click country selection from phone field
  - Reduces data entry errors
  - Faster form completion
  - Professional appearance matching modern web standards
  - Read-only country field prevents manual errors
  - Visual feedback on all interactions (hover, focus, active)
  - Consistent color scheme throughout form
- **Library Integration**:
  - Uses `react-phone-number-input` for robust international phone handling
  - Phone number parsing and validation
  - Country code detection and mapping

#### 🔍 Package Search in Create Shipment (Added 2025-10-08)
- **Real-Time Search Functionality** for Available Packages section:
  - Professional search input with icon and clear button
  - Live filtering as you type
  - Searches across multiple fields:
    - User name
    - Suite number
    - Package ID
    - Tracking number
    - Description
    - Store name
    - Vendor name
- **Smart Search Features**:
  - Case-insensitive search
  - Instant results (no delay)
  - Shows count: "X of Y packages" 
  - Clear button (X icon) appears when searching
  - "No results" message with clear search button
  - Select All button works with filtered results
- **Enhanced Package Management**:
  - Quickly find specific packages for shipment creation
  - Search by customer details (name, suite)
  - Search by package identifiers (ID, tracking)
  - Search by vendor/store information
- **Professional UI Design**:
  - Modern rounded input matching form style
  - Red accent theme for consistency
  - Hover and focus states
  - Smooth transitions
  - Clear visual feedback
- **File Updated**:
  - `src/app/pages/CreateShipment/CreateShipment.tsx` - Added search functionality with filtering logic

#### 🔧 Tracking Number Consistency Fix (Fixed 2025-10-08)
- **Fixed Tracking Number Mismatch** between creation and display:
  - ShipmentHistory interface now uses `tracking_number` instead of `shipment_number`
  - Direct mapping from database `tracking_number` field (no transformation)
  - Consistent tracking number display across all pages
  - Fixed search functionality to use correct field name
- **Root Cause**: Interface was using `shipment_number` while database has `tracking_number`
- **Impact**: Tracking numbers now match exactly between:
  - Create Shipment success message
  - Shipment History list
  - Client-facing displays
  - Search results
- **File Updated**:
  - `src/app/pages/ShipmentHistory/ShipmentHistory.tsx` - Fixed interface and field mappings

#### 🔐 6-Digit Verification for Delivery Status (Restored 2025-10-08)
- **Mandatory Verification** before marking packages as delivered in Shipment History:
  - Clicking "Mark as Delivered" now triggers a verification modal
  - Requires 6-digit pickup code input before status change
  - Cannot bypass verification - security enforced
- **Professional Verification Modal**:
  - Clean, modern design with red accent theme
  - Large centered input for 6-digit code
  - Monospace font with tracking for easy reading
  - Auto-focuses on input for quick entry
  - Visual progress indicator (6 dots showing digits entered)
  - Enter key support for quick submission
- **Smart Input Validation**:
  - Only accepts numeric digits (0-9)
  - Auto-limits to 6 digits
  - Clears on error for retry
  - Real-time digit count display
  - Prevents submission until all 6 digits entered
- **Error Handling**:
  - Clear error messages displayed in modal
  - Format validation (must be exactly 6 digits)
  - Integration ready for `verify_pickup_code()` database function
- **User Experience**:
  - Smooth animations (fade-in, zoom-in)
  - Backdrop blur effect
  - Cancel button to abort
  - Loading state during verification
  - Success feedback after verification
  - Modal closes automatically on success
- **Security Features**:
  - Status only updates after successful code verification
  - Prevents accidental delivery confirmation
  - Aligns with pickup code system in database (SQL files 60, 61)
- **File Updated**:
  - `src/app/pages/ShipmentHistory/ShipmentHistory.tsx` - Restored 6-digit verification logic for delivered status

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