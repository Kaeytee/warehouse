# Vanguard Cargo Warehouse Management System - User Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Authentication & Login](#authentication--login)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Dashboard](#dashboard)
6. [Package Management](#package-management)
7. [Shipment Operations](#shipment-operations)
8. [Inventory Management](#inventory-management)
9. [Analytics & Reports](#analytics--reports)
10. [User Management](#user-management)
11. [Troubleshooting](#troubleshooting)

---

## System Overview

### What is Vanguard Cargo WMS?
Vanguard Cargo Warehouse Management System (WMS) is a comprehensive web-based application designed to streamline warehouse operations, including:
- **Package intake and tracking**
- **Shipment creation and delivery**
- **Real-time inventory management**
- **Analytics and reporting**
- **Role-based access control**
- **User management**

### System Requirements
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Internet Connection**: Stable internet connection required
- **Screen Resolution**: Minimum 1280x720 (optimized for desktop)

---

## Getting Started

### Accessing the System
1. Open your web browser
2. Navigate to the Vanguard Cargo WMS URL
3. You will be redirected to the login page

### First Time Login
1. Enter your **work email** provided by your administrator
2. Enter your **temporary password**
3. Click **"Log In"** button
4. You will be automatically redirected to the dashboard

---

## Authentication & Login

### Login Process
1. **Navigate to Login Page**
   - Access the system URL
   - You'll see the Vanguard Cargo login screen

2. **Enter Credentials**
   - **Email Field**: Enter your work email address
   - **Password Field**: Enter your password
   - Both fields are required

3. **Submit Login**
   - Click the "Log In" button
   - System validates credentials
   - Shows loading spinner during authentication
   - Automatic redirect to dashboard on success

### Login States
- **Loading**: Spinner displayed while authenticating
- **Success**: Automatic redirect to dashboard (no manual refresh needed)
- **Error**: Red error message displayed with issue details

### Common Login Errors
| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Invalid login credentials" | Wrong email/password | Check credentials and try again |
| "Access denied: Insufficient permissions" | Account not authorized | Contact your administrator |
| "Please enter both email and password" | Empty fields | Fill in both fields |

### Security Features
- ✅ **Session Management**: Auto-logout after inactivity
- ✅ **Role-Based Access**: Only authorized users can access
- ✅ **Secure Authentication**: Password encryption and token-based auth
- ✅ **Session Persistence**: Stay logged in across browser refreshes

---

## User Roles & Permissions

### Role Hierarchy

#### 1. **Super Admin**
**Full System Access**
- ✅ Dashboard analytics
- ✅ Package intake
- ✅ Create shipments
- ✅ Delivery management
- ✅ Shipment history
- ✅ Analytics reports
- ✅ Inventory management
- ✅ User management (create, edit, delete users)
- ✅ System settings

#### 2. **Warehouse Admin**
**Operations Management**
- ✅ Dashboard analytics
- ✅ Package intake
- ✅ Create shipments
- ✅ Delivery management
- ✅ Shipment history
- ✅ Analytics reports
- ✅ Inventory management
- ❌ User management (limited)

#### 3. **Warehouse Staff**
**Day-to-Day Operations**
- ✅ Dashboard (limited view)
- ✅ Package intake
- ✅ Create shipments
- ✅ Delivery management
- ✅ Shipment history (view only)
- ❌ Analytics reports
- ❌ Inventory management
- ❌ User management

### Permission Levels
Each role has specific permissions mapped to system features:

```
ROLE_PERMISSIONS = {
  super_admin: ALL_PERMISSIONS,
  warehouse_admin: [
    'analytics_view',
    'intake_manage',
    'shipment_create',
    'delivery_manage',
    'inventory_manage',
    'reports_view'
  ],
  warehouse_staff: [
    'intake_manage',
    'shipment_create',
    'delivery_manage'
  ]
}
```

---

## Dashboard

### Overview
The dashboard is your central hub for monitoring warehouse operations.

### Key Metrics
1. **Total Packages**
   - Real-time count of all packages in the system
   - Color-coded status indicators

2. **Active Shipments**
   - Number of shipments currently in transit
   - Quick access to shipment details

3. **Deliveries Today**
   - Scheduled deliveries for the current day
   - Priority alerts for urgent deliveries

4. **Inventory Status**
   - Current warehouse capacity
   - Low stock warnings

### Quick Actions
- **New Package Intake**: Quick button to register new packages
- **Create Shipment**: Fast shipment creation
- **View Reports**: Access analytics dashboard
- **Search**: Global search for packages, shipments, or clients

### Navigation Menu
- **Left Sidebar**: Main navigation menu
  - Dashboard
  - Package Intake
  - Create Shipment
  - Delivery
  - Shipments
  - Analytics
  - Inventory
  - Users (admin only)
  - About

---

## Package Management

### Package Intake

#### Creating a New Package Entry
1. **Navigate to Package Intake**
   - Click "Package Intake" in the sidebar
   - Or use quick action button on dashboard

2. **Fill Package Information**
   - **Package ID**: Auto-generated unique identifier
   - **Client Name**: Select or enter client details
   - **Package Type**: Select from dropdown (Box, Envelope, Pallet, etc.)
   - **Weight**: Enter package weight (kg or lbs)
   - **Dimensions**: Length × Width × Height
   - **Description**: Brief package description
   - **Special Handling**: Check if required (Fragile, Hazardous, etc.)

3. **Submit Package**
   - Click "Register Package" button
   - System validates information
   - Success confirmation displayed
   - Package added to inventory

#### Package Status Tracking
- 🟢 **Received**: Package checked in
- 🟡 **Processing**: Being prepared for shipment
- 🔵 **Ready**: Ready for pickup/delivery
- 🟢 **In Transit**: Out for delivery
- ✅ **Delivered**: Successfully delivered
- ⚠️ **On Hold**: Requires attention
- 🔴 **Cancelled**: Shipment cancelled

### Bulk Package Import
**For Super Admin and Warehouse Admin:**
1. Download the package import template
2. Fill in package details (Excel/CSV format)
3. Upload file via bulk import tool
4. System validates and imports packages
5. Review import summary and errors (if any)

---

## Shipment Operations

### Creating a Shipment

#### Step 1: Select Packages
1. Go to "Create Shipment" page
2. Search for packages by:
   - Package ID
   - Client name
   - Date received
   - Status
3. Select packages to include in shipment
4. Review selected packages

#### Step 2: Shipment Details
1. **Shipment Information**
   - **Shipment ID**: Auto-generated
   - **Destination**: Enter delivery address
   - **Delivery Date**: Select target delivery date
   - **Priority**: Normal, Express, Urgent
   - **Carrier**: Select shipping carrier
   - **Tracking Number**: Auto-generated or manual entry

2. **Client Information**
   - **Recipient Name**: Full name
   - **Contact Number**: Phone number
   - **Email**: Notification email
   - **Delivery Instructions**: Special notes

3. **Submit Shipment**
   - Review all details
   - Click "Create Shipment" button
   - Confirmation and tracking information displayed

### Delivery Management

#### Managing Deliveries
1. **Navigate to Delivery Page**
   - View all scheduled deliveries
   - Filter by date, status, priority

2. **Update Delivery Status**
   - Click on delivery entry
   - Update status:
     - 📦 **Out for Delivery**
     - ✅ **Delivered**
     - ⚠️ **Attempted Delivery**
     - 🔙 **Returned**
   - Add delivery notes
   - Upload proof of delivery (signature/photo)

3. **Failed Delivery Handling**
   - Mark as "Attempted Delivery"
   - Add reason for failure
   - Schedule re-delivery
   - Notify client

### Shipment History

#### Viewing Shipment Records
1. **Navigate to Shipments Page**
   - View all historical shipments
   - Advanced filtering options

2. **Filter & Search**
   - **By Date Range**: Select start and end dates
   - **By Status**: Filter by delivery status
   - **By Client**: Search specific client
   - **By Package ID**: Find specific package

3. **Shipment Details**
   - Click on any shipment to view:
     - Complete package list
     - Timeline of events
     - Delivery status
     - Client information
     - Tracking history

4. **Export Options**
   - Export to PDF
   - Export to Excel/CSV
   - Print shipment details

---

## Inventory Management

### Inventory Dashboard

#### Overview
Real-time view of all warehouse inventory with advanced filtering and search capabilities.

#### Key Features
1. **Real-time Inventory Count**
   - Total packages in warehouse
   - Status breakdown
   - Storage location mapping

2. **Search & Filter**
   - Search by package ID
   - Filter by status
   - Filter by date received
   - Filter by client
   - Filter by storage location

3. **Inventory Actions**
   - **View Details**: Click package to see full information
   - **Update Status**: Change package status
   - **Move Location**: Update storage location
   - **Create Alert**: Set up notifications

### Storage Management
1. **Storage Zones**
   - Receiving area
   - Processing area
   - Storage racks (A1-Z99)
   - Shipping dock
   - Special handling area

2. **Moving Packages**
   - Select package
   - Choose new location
   - System updates inventory map
   - Audit trail recorded

### Low Stock Alerts
- Automatic notifications for:
  - Low packaging materials
  - Expiring items
  - Items requiring action

---

## Analytics & Reports

### Analytics Dashboard

#### Overview
Comprehensive analytics and reporting tool for data-driven decision making.

#### Available Reports

##### 1. **Package Volume Report**
- Daily/Weekly/Monthly package intake
- Trend analysis
- Peak hours identification
- Capacity planning data

##### 2. **Delivery Performance**
- On-time delivery rate
- Average delivery time
- Failed delivery analysis
- Carrier performance comparison

##### 3. **Client Analytics**
- Top clients by volume
- Client satisfaction metrics
- Revenue by client
- Client activity patterns

##### 4. **Financial Reports**
- Revenue tracking
- Cost analysis
- Profit margins
- Invoice summary

##### 5. **Operational Efficiency**
- Processing time metrics
- Staff productivity
- Warehouse utilization
- Bottleneck identification

#### Generating Reports
1. **Select Report Type**
2. **Choose Date Range**
3. **Apply Filters** (optional)
4. **Generate Report**
5. **Export Options**:
   - PDF format
   - Excel/CSV
   - Print
   - Email report

#### Report Scheduling
**Admin Feature:**
- Schedule automatic report generation
- Email reports to stakeholders
- Custom report intervals (daily, weekly, monthly)

---

## User Management

### User Administration
**Available to: Super Admin only**

#### Creating New Users
1. **Navigate to User Management**
   - Click "Users" in sidebar

2. **Add New User**
   - Click "Add New User" button
   - Fill in user details:
     - **First Name**: User's first name
     - **Last Name**: User's last name
     - **Email**: Work email (used for login)
     - **Role**: Select user role (Super Admin, Warehouse Admin, Staff)
     - **Status**: Active/Inactive
     - **Temporary Password**: Auto-generated

3. **Submit**
   - System creates user account
   - Welcome email sent to user
   - User appears in user list

#### Managing Existing Users

##### Editing User Details
1. Click on user in list
2. Edit user information
3. Save changes
4. User notified of changes (if applicable)

##### Changing User Role
1. Select user
2. Click "Change Role"
3. Select new role
4. Confirm changes
5. User permissions updated immediately

##### Deactivating Users
1. Select user
2. Click "Deactivate"
3. Confirm action
4. User loses system access
5. Can be reactivated later

##### Resetting Passwords
1. Select user
2. Click "Reset Password"
3. New temporary password generated
4. Send to user via email
5. User must change on first login

#### User List Features
- **Search**: Find users by name or email
- **Filter**: By role, status, department
- **Sort**: By name, role, last login
- **Export**: User list to CSV

---

## Troubleshooting

### Common Issues & Solutions

#### Authentication Issues

**Issue: Can't log in**
- ✅ Verify email and password are correct
- ✅ Check caps lock is off
- ✅ Clear browser cache and cookies
- ✅ Try different browser
- ✅ Contact administrator to verify account status

**Issue: Page keeps redirecting to login**
- ✅ Clear browser cache
- ✅ Enable cookies in browser settings
- ✅ Check internet connection
- ✅ Try logging out completely and logging back in

**Issue: "Access Denied" message**
- ✅ Verify your account has proper permissions
- ✅ Contact administrator to check your role
- ✅ Ensure you're accessing authorized pages

#### Performance Issues

**Issue: Slow page loading**
- ✅ Check internet connection speed
- ✅ Close unnecessary browser tabs
- ✅ Clear browser cache
- ✅ Update browser to latest version
- ✅ Try different browser

**Issue: Data not updating**
- ✅ Refresh the page (F5 or Ctrl+R)
- ✅ Check internet connection
- ✅ Log out and log back in
- ✅ Clear browser cache

#### Data Entry Issues

**Issue: Can't submit form**
- ✅ Check all required fields are filled
- ✅ Verify data format (email, phone, etc.)
- ✅ Check for error messages
- ✅ Ensure no special characters in text fields

**Issue: Package not appearing in inventory**
- ✅ Wait a few seconds and refresh
- ✅ Check if package was successfully submitted
- ✅ Verify you're looking at correct filters
- ✅ Search by package ID directly

#### Report Issues

**Issue: Report shows no data**
- ✅ Verify date range includes relevant data
- ✅ Check applied filters
- ✅ Ensure you have permission to view reports
- ✅ Try resetting filters

**Issue: Can't export report**
- ✅ Check browser popup blocker settings
- ✅ Verify sufficient disk space
- ✅ Try different export format
- ✅ Clear browser cache

### Getting Help

#### Support Channels
1. **Administrator**: Contact your system administrator
2. **Help Desk**: Submit support ticket
3. **User Manual**: Refer to this document
4. **Training**: Request additional training sessions

#### Reporting Bugs
When reporting issues, include:
- **What you were trying to do**
- **What happened instead**
- **Error messages** (screenshot if possible)
- **Browser and operating system**
- **Steps to reproduce**

---

## Best Practices

### Security Best Practices
- ✅ **Never share your password** with anyone
- ✅ **Log out** when leaving your workstation
- ✅ **Use strong passwords** (mix of letters, numbers, symbols)
- ✅ **Report suspicious activity** immediately
- ✅ **Keep browser updated** to latest version

### Data Entry Best Practices
- ✅ **Double-check information** before submitting
- ✅ **Use consistent naming conventions**
- ✅ **Include detailed descriptions** for packages
- ✅ **Update status promptly** to maintain accuracy
- ✅ **Document special handling requirements**

### Workflow Best Practices
- ✅ **Process packages promptly** upon arrival
- ✅ **Update delivery status** in real-time
- ✅ **Communicate delays** to clients immediately
- ✅ **Review reports regularly** to identify trends
- ✅ **Keep inventory organized** by location

---

## Appendix

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save current form |
| `Ctrl + F` | Search/Find |
| `Esc` | Close modal/dialog |
| `Tab` | Navigate between fields |
| `Enter` | Submit form (when focused) |

### Package Type Codes
| Code | Description |
|------|-------------|
| BOX | Standard box package |
| ENV | Envelope/Document |
| PAL | Pallet shipment |
| CRT | Crate |
| BAG | Bag/Sack |
| DRM | Drum/Barrel |
| TUB | Tube/Cylinder |

### Status Codes
| Code | Status | Description |
|------|--------|-------------|
| RCV | Received | Package checked in |
| PRC | Processing | Being prepared |
| RDY | Ready | Ready for shipment |
| TRN | In Transit | Out for delivery |
| DLV | Delivered | Successfully delivered |
| ATM | Attempted | Delivery attempted |
| HLD | On Hold | Requires attention |
| RTN | Returned | Returned to sender |
| CAN | Cancelled | Shipment cancelled |

### Priority Levels
| Level | Response Time | Description |
|-------|---------------|-------------|
| **Normal** | 3-5 business days | Standard delivery |
| **Express** | 1-2 business days | Expedited delivery |
| **Urgent** | Same day | Priority handling |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-11 | Initial user manual release |

---

## Contact & Support

### System Administrator
- **Email**: admin@vanguardcargo.com
- **Phone**: +1 (XXX) XXX-XXXX
- **Hours**: Monday - Friday, 8:00 AM - 6:00 PM

### Technical Support
- **Email**: support@vanguardcargo.com
- **Help Desk**: Submit ticket via portal
- **Emergency**: +1 (XXX) XXX-XXXX (24/7)

---

**© 2025 Vanguard Cargo Warehouse Management System. All rights reserved.**

*This user manual is confidential and intended for authorized users only.*
