# Vanguard Cargo - Warehouse Management System

**Complete warehouse operations management system with role-based access control**

---

## 📖 User Documentation

**[USER_GUIDE.md](./USER_GUIDE.md)** - Complete user guide for warehouse administrators and staff

This comprehensive guide covers everything warehouse users need to know:
- ✅ **Getting Started** - First-time login and system overview
- ✅ **Daily Operations** - Step-by-step workflows for common tasks
- ✅ **Package Intake** - How to register and process incoming packages
- ✅ **Shipment Creation** - Creating and managing shipments
- ✅ **Delivery Management** - Tracking and confirming deliveries
- ✅ **Inventory Management** - Monitoring warehouse inventory
- ✅ **Analytics & Reports** - Generating performance reports
- ✅ **Troubleshooting** - Solutions to common problems

---

## Overview

Vanguard Cargo is a warehouse-to-warehouse international cargo platform that enables customers to ship packages from foreign countries to local warehouses for pickup. The warehouse system is the operational core that manages package processing, international shipping, and customer pickup coordination.

### Business Model

**Warehouse-to-Warehouse Pickup Service:**
- Customers submit requests for packages to be collected from foreign warehouses
- Packages are processed and shipped internationally to local warehouses
- Customers are notified when packages arrive at the local warehouse
- Customers visit the local warehouse to collect their packages

---

## Key Features

### Core Operations
- 🔐 **Secure Authentication** - Role-based access control
- 📦 **Package Intake** - Register and track incoming packages
- 🚚 **Shipment Management** - Create and track shipments
- 📍 **Delivery Tracking** - Real-time delivery status
- 📊 **Analytics Dashboard** - Performance insights
- 👥 **User Management** - Admin controls for staff
- 🔔 **Notifications** - Automatic customer alerts
- 📱 **Responsive Design** - Works on all devices

### Advanced Features
- 📋 **Digital Waybill Generation** - Professional shipping documents
- 📊 **Barcode & QR Codes** - Quick scanning and tracking
- 🧾 **Receipt Generation** - Package and shipment receipts
- 🔐 **Delivery Verification** - 6-digit secure pickup codes
- 📈 **Analytics & Reporting** - Comprehensive performance metrics
- 🔒 **Role-Based Permissions** - Granular access control

---

## User Roles

### Super Admin
Full system access including:
- ✅ All operational features
- ✅ User management
- ✅ System configuration
- ✅ All reports and analytics

### Warehouse Admin
Operations management:
- ✅ Package intake
- ✅ Shipment creation
- ✅ Delivery management
- ✅ Inventory management
- ✅ Analytics and reports

### Warehouse Staff
Daily operations:
- ✅ Package intake
- ✅ Shipment creation
- ✅ Delivery updates
- ❌ Limited analytics access
- ❌ No user management

---

## Quick Start

### For Warehouse Users

**See [USER_GUIDE.md](./USER_GUIDE.md)** for complete instructions.

Quick steps:
1. Open the Vanguard Cargo website
2. Log in with your email and password
3. You'll be taken to your dashboard
4. Follow the guide for specific tasks

### For Developers

**Prerequisites:**
- Node.js 18+
- pnpm package manager
- Supabase account

**Installation:**
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
pnpm run dev

# Build for production
pnpm run build
```

**Environment Variables:**
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

---

## Technology Stack

### Frontend
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool
- TailwindCSS - Styling
- React Router - Navigation
- Recharts - Data visualization
- Lucide React - Icons

### Backend
- Supabase - Backend as a Service
- PostgreSQL - Database
- Row Level Security - Data access control
- Supabase Auth - Authentication

### Libraries
- JsBarcode - Barcode generation
- QRCode.react - QR code generation
- React-to-print - Document printing
- Date-fns - Date manipulation

---

## System Architecture

### Authentication Flow
1. User logs in with email/password
2. Supabase validates credentials
3. System checks user role from database
4. User redirected to dashboard with appropriate permissions

### Package Flow
1. **Intake** - Package registered in system
2. **Inspection** - Quality check and verification
3. **Ready** - Available for shipment
4. **In Shipment** - Added to active shipment
5. **Out for Delivery** - With courier
6. **Delivered** - Successfully received by customer

### Shipment Flow
1. **Creation** - Select packages and create shipment
2. **Waybill Generation** - Automatic document creation
3. **Label Printing** - Barcode and shipping labels
4. **Dispatch** - Hand over to courier
5. **Tracking** - Real-time status updates
6. **Delivery Confirmation** - Customer receipt

---

## Security Features

### Authentication Security
- ✅ Secure password hashing
- ✅ JWT token-based authentication
- ✅ Automatic session management
- ✅ Role-based access control

### Data Security
- ✅ Row Level Security (RLS) policies
- ✅ Encrypted data transmission (HTTPS)
- ✅ Secure API endpoints
- ✅ Input validation and sanitization

### Operational Security
- ✅ Delivery verification codes
- ✅ Audit logging for all actions
- ✅ User activity tracking
- ✅ Secure document generation

---

## Development

### Project Structure
```
src/
├── app/              # Application pages
│   ├── pages/        # Page components
│   └── login.tsx     # Login page
├── components/       # Reusable components
│   ├── layout/       # Layout components
│   └── ui/           # UI components
├── hooks/            # Custom React hooks
├── services/         # API service layer
├── types/            # TypeScript definitions
├── lib/              # Utility libraries
└── config/           # Configuration files
```

### Key Services
- **warehouseAuthService.ts** - Authentication logic
- **warehousePackageService.ts** - Package operations
- **warehouseShipmentService.ts** - Shipment operations
- **warehouseDocumentService.ts** - Document generation
- **AnalyticsService.ts** - Analytics and reporting
- **DashboardService.ts** - Dashboard data
- **UserManagementService.ts** - User administration

---

## Support

### For Warehouse Users
- **User Guide:** [USER_GUIDE.md](./USER_GUIDE.md)
- **Email:** support@vanguardcargo.com
- **Phone:** [Your support number]

### For Developers
- **Issues:** Report bugs via GitHub Issues
- **Documentation:** Check inline code comments
- **Contributions:** Pull requests welcome

---

## Database Schema

### Core Tables
- **users / user_profiles** - User accounts
- **packages** - Package information
- **shipments** - Shipment records
- **package_shipments** - Package-shipment relationships
- **warehouses** - Warehouse locations
- **notifications** - System notifications
- **package_status_history** - Status audit trail
- **package_receipts** - Receipt records

---

## License

Proprietary - © 2025 Vanguard Cargo. All rights reserved.

---

## Version

**Current Version:** 1.0.0

### Recent Updates
- ✅ Complete authentication system with role-based access
- ✅ Package intake and management
- ✅ Shipment creation and tracking
- ✅ Delivery management with verification codes
- ✅ Analytics and reporting dashboard
- ✅ Document generation (waybills, receipts)
- ✅ Barcode and QR code system
- ✅ User management for administrators
- ✅ Comprehensive user guide for end users

---

**For complete usage instructions, see [USER_GUIDE.md](./USER_GUIDE.md)**
