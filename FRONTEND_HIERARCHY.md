# Vanguard Cargo - Warehouse Frontend Structure

## Frontend Hierarchy Overview

This document defines the complete frontend hierarchy for the Vanguard Cargo warehouse system, aligning with the organizational structure and roles defined in the main warehouse documentation.

## Directory Structure

```
src/
├── app/
│   ├── auth/                           # Authentication & Authorization
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RoleSelector.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── RoleContext.tsx
│   │   └── hooks/
│   │       ├── useAuth.tsx
│   │       └── useRolePermissions.tsx
│   │
│   ├── dashboard/                      # Role-Based Dashboards
│   │   ├── executive/                  # Executive Level Dashboards
│   │   │   ├── TransportationManagerDashboard.tsx
│   │   │   ├── WarehouseManagerDashboard.tsx
│   │   │   ├── InventoryAnalystDashboard.tsx
│   │   │   ├── cargoAnalystDashboard.tsx
│   │   │   ├── CustomerServiceDashboard.tsx
│   │   │   └── ExportDocumentationDashboard.tsx
│   │   ├── operational/                # Operational Level Dashboards
│   │   │   ├── TransportationCoordinatorDashboard.tsx
│   │   │   ├── OrderFulfillmentDashboard.tsx
│   │   │   ├── WarehouseWorkerDashboard.tsx
│   │   │   ├── QualityControlDashboard.tsx
│   │   │   └── SecurityDashboard.tsx
│   │   └── components/
│   │       ├── DashboardCard.tsx
│   │       ├── StatsWidget.tsx
│   │       ├── QuickActions.tsx
│   │       └── NotificationPanel.tsx
│   │
│   ├── packages/                       # Package Management
│   │   ├── components/
│   │   │   ├── PackageList.tsx
│   │   │   ├── PackageCard.tsx
│   │   │   ├── PackageDetails.tsx
│   │   │   ├── PackageStatusBadge.tsx
│   │   │   ├── PackageSearch.tsx
│   │   │   ├── PackageFilters.tsx
│   │   │   └── BulkActionBar.tsx
│   │   ├── forms/
│   │   │   ├── CreatePackageForm.tsx
│   │   │   ├── UpdatePackageForm.tsx
│   │   │   ├── PackageReceiptForm.tsx
│   │   │   └── ProcessPackageForm.tsx
│   │   ├── modals/
│   │   │   ├── PackageDetailsModal.tsx
│   │   │   ├── StatusUpdateModal.tsx
│   │   │   ├── AssignStaffModal.tsx
│   │   │   └── DocumentUploadModal.tsx
│   │   └── pages/
│   │       ├── PackageListPage.tsx
│   │       ├── CreatePackagePage.tsx
│   │       ├── PackageDetailsPage.tsx
│   │       └── ProcessingQueuePage.tsx
│   │
│   ├── customer-service/               # Customer Identification & Release
│   │   ├── components/
│   │   │   ├── CustomerLookup.tsx
│   │   │   ├── CustomerDetails.tsx
│   │   │   ├── CustomerPackages.tsx
│   │   │   ├── IdentityVerification.tsx
│   │   │   ├── ReleaseAuthorization.tsx
│   │   │   └── DocumentCapture.tsx
│   │   ├── forms/
│   │   │   ├── CustomerSearchForm.tsx
│   │   │   ├── IdentityVerificationForm.tsx
│   │   │   ├── PackageReleaseForm.tsx
│   │   │   └── ReleaseDocumentationForm.tsx
│   │   ├── modals/
│   │   │   ├── CustomerLookupModal.tsx
│   │   │   ├── IdentityConfirmationModal.tsx
│   │   │   ├── ReleaseConfirmationModal.tsx
│   │   │   └── CameraModal.tsx
│   │   └── pages/
│   │       ├── CustomerServicePage.tsx
│   │       ├── PackageReleasePage.tsx
│   │       ├── ReleaseHistoryPage.tsx
│   │       └── CustomerInquiryPage.tsx
│   │
│   ├── pricing/                        # Currency & Pricing Management
│   │   ├── components/
│   │   │   ├── PricingCalculator.tsx
│   │   │   ├── CurrencyConverter.tsx
│   │   │   ├── ExchangeRateDisplay.tsx
│   │   │   ├── PricingBreakdown.tsx
│   │   │   └── PaymentStatus.tsx
│   │   ├── forms/
│   │   │   ├── PricingForm.tsx
│   │   │   ├── CurrencySettingsForm.tsx
│   │   │   └── PaymentProcessingForm.tsx
│   │   ├── modals/
│   │   │   ├── PricingCalculatorModal.tsx
│   │   │   ├── ExchangeRateModal.tsx
│   │   │   └── PaymentConfirmationModal.tsx
│   │   └── pages/
│   │       ├── PricingManagementPage.tsx
│   │       ├── ExchangeRatesPage.tsx
│   │       └── PaymentHistoryPage.tsx
│   │
│   ├── shipments/                      # Shipment Management
│   │   ├── components/
│   │   │   ├── ShipmentList.tsx
│   │   │   ├── ShipmentCard.tsx
│   │   │   ├── ShipmentDetails.tsx
│   │   │   ├── ShipmentStatusTracker.tsx
│   │   │   ├── PackageGrouping.tsx
│   │   │   └── ShipmentManifest.tsx
│   │   ├── forms/
│   │   │   ├── CreateShipmentForm.tsx
│   │   │   ├── UpdateShipmentForm.tsx
│   │   │   ├── AssignVehicleForm.tsx
│   │   │   └── DispatchForm.tsx
│   │   ├── modals/
│   │   │   ├── CreateShipmentModal.tsx
│   │   │   ├── ShipmentDetailsModal.tsx
│   │   │   ├── AssignPackagesModal.tsx
│   │   │   └── DispatchConfirmationModal.tsx
│   │   └── pages/
│   │       ├── ShipmentListPage.tsx
│   │       ├── CreateShipmentPage.tsx
│   │       ├── ShipmentDetailsPage.tsx
│   │       └── DispatchPage.tsx
│   │
│   ├── inventory/                      # Inventory Management
│   │   ├── components/
│   │   │   ├── InventoryGrid.tsx
│   │   │   ├── WarehouseMap.tsx
│   │   │   ├── LocationTracker.tsx
│   │   │   ├── StockLevels.tsx
│   │   │   └── MovementHistory.tsx
│   │   ├── forms/
│   │   │   ├── LocationAssignmentForm.tsx
│   │   │   ├── InventoryUpdateForm.tsx
│   │   │   └── StockTransferForm.tsx
│   │   ├── modals/
│   │   │   ├── LocationSelectionModal.tsx
│   │   │   ├── StockMovementModal.tsx
│   │   │   └── InventoryAuditModal.tsx
│   │   └── pages/
│   │       ├── InventoryOverviewPage.tsx
│   │       ├── WarehouseLayoutPage.tsx
│   │       ├── StockMovementPage.tsx
│   │       └── InventoryReportsPage.tsx
│   │
│   ├── staff/                          # Staff Management
│   │   ├── components/
│   │   │   ├── StaffList.tsx
│   │   │   ├── StaffCard.tsx
│   │   │   ├── RoleAssignment.tsx
│   │   │   ├── TaskAssignment.tsx
│   │   │   ├── PerformanceMetrics.tsx
│   │   │   └── ScheduleCalendar.tsx
│   │   ├── forms/
│   │   │   ├── CreateStaffForm.tsx
│   │   │   ├── UpdateStaffForm.tsx
│   │   │   ├── AssignTaskForm.tsx
│   │   │   └── ScheduleForm.tsx
│   │   ├── modals/
│   │   │   ├── StaffDetailsModal.tsx
│   │   │   ├── RoleSelectionModal.tsx
│   │   │   ├── TaskAssignmentModal.tsx
│   │   │   └── PerformanceReviewModal.tsx
│   │   └── pages/
│   │       ├── StaffManagementPage.tsx
│   │       ├── TaskManagementPage.tsx
│   │       ├── SchedulingPage.tsx
│   │       └── PerformanceReportsPage.tsx
│   │
│   ├── analytics/                      # Analytics & Reporting
│   │   ├── components/
│   │   │   ├── PerformanceCharts.tsx
│   │   │   ├── KPIWidgets.tsx
│   │   │   ├── TrendAnalysis.tsx
│   │   │   ├── ReportGenerator.tsx
│   │   │   └── DataVisualization.tsx
│   │   ├── charts/
│   │   │   ├── PackageVolumeChart.tsx
│   │   │   ├── ShipmentTimeline.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   └── EfficiencyMetrics.tsx
│   │   └── pages/
│   │       ├── AnalyticsDashboard.tsx
│   │       ├── PerformanceReports.tsx
│   │       ├── FinancialReports.tsx
│   │       └── OperationalReports.tsx
│   │
│   └── settings/                       # System Settings
│       ├── components/
│       │   ├── SystemConfiguration.tsx
│       │   ├── UserManagement.tsx
│       │   ├── RolePermissions.tsx
│       │   ├── NotificationSettings.tsx
│       │   └── IntegrationSettings.tsx
│       ├── forms/
│       │   ├── SystemSettingsForm.tsx
│       │   ├── UserSettingsForm.tsx
│       │   ├── NotificationForm.tsx
│       │   └── SecuritySettingsForm.tsx
│       └── pages/
│           ├── SystemSettingsPage.tsx
│           ├── UserManagementPage.tsx
│           ├── SecuritySettingsPage.tsx
│           └── IntegrationSettingsPage.tsx
│
├── components/                         # Shared Components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── Navigation.tsx
│   │   └── Breadcrumbs.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Toast.tsx
│   │   └── Tooltip.tsx
│   ├── forms/
│   │   ├── FormField.tsx
│   │   ├── FormError.tsx
│   │   ├── FormValidation.tsx
│   │   └── FormLayout.tsx
│   ├── data/
│   │   ├── DataTable.tsx
│   │   ├── DataGrid.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── Pagination.tsx
│   │   └── SortHeader.tsx
│   └── media/
│       ├── ImageUpload.tsx
│       ├── CameraCapture.tsx
│       ├── FileUpload.tsx
│       └── DocumentViewer.tsx
│
├── hooks/                              # Custom Hooks
│   ├── auth/
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   └── useRoles.ts
│   ├── data/
│   │   ├── usePackages.ts
│   │   ├── useShipments.ts
│   │   ├── useCustomers.ts
│   │   ├── useInventory.ts
│   │   └── useStaff.ts
│   ├── api/
│   │   ├── useApi.ts
│   │   ├── useQuery.ts
│   │   ├── useMutation.ts
│   │   └── useWebSocket.ts
│   └── ui/
│       ├── useModal.ts
│       ├── useToast.ts
│       ├── useForm.ts
│       └── useLocalStorage.ts
│
├── services/                           # API Services
│   ├── api/
│   │   ├── apiClient.ts
│   │   ├── authApi.ts
│   │   ├── packagesApi.ts
│   │   ├── shipmentsApi.ts
│   │   ├── customersApi.ts
│   │   ├── inventoryApi.ts
│   │   ├── staffApi.ts
│   │   ├── pricingApi.ts
│   │   └── analyticsApi.ts
│   ├── websocket/
│   │   ├── socketClient.ts
│   │   ├── packageUpdates.ts
│   │   └── notifications.ts
│   └── external/
│       ├── whatsappService.ts
│       ├── exchangeRateService.ts
│       └── documentService.ts
│
├── store/                              # State Management
│   ├── auth/
│   │   ├── authSlice.ts
│   │   ├── roleSlice.ts
│   │   └── permissionSlice.ts
│   ├── packages/
│   │   ├── packageSlice.ts
│   │   ├── statusSlice.ts
│   │   └── filtersSlice.ts
│   ├── shipments/
│   │   ├── shipmentSlice.ts
│   │   └── groupingSlice.ts
│   ├── customers/
│   │   ├── customerSlice.ts
│   │   └── releaseSlice.ts
│   ├── inventory/
│   │   ├── inventorySlice.ts
│   │   └── locationSlice.ts
│   ├── pricing/
│   │   ├── pricingSlice.ts
│   │   └── currencySlice.ts
│   └── index.ts
│
├── types/                              # TypeScript Types
│   ├── auth.ts
│   ├── package.ts
│   ├── shipment.ts
│   ├── customer.ts
│   ├── inventory.ts
│   ├── staff.ts
│   ├── pricing.ts
│   ├── analytics.ts
│   └── api.ts
│
├── utils/                              # Utility Functions
│   ├── constants.ts
│   ├── helpers.ts
│   ├── formatters.ts
│   ├── validators.ts
│   ├── permissions.ts
│   ├── statusMappings.ts
│   └── dateUtils.ts
│
└── assets/                             # Static Assets
    ├── images/
    ├── icons/
    └── styles/
```

## Role-Based Access Structure

### Executive Level Components
```typescript
// Transportation Manager
- Full access to all transportation and cargo operations
- Dashboard: Transportation metrics, shipment overview, performance analytics
- Components: TransportationManagerDashboard.tsx, ShipmentOverview.tsx

// Warehouse Manager  
- Complete warehouse operations management
- Dashboard: Warehouse metrics, staff performance, inventory status
- Components: WarehouseManagerDashboard.tsx, StaffManagement.tsx

// Inventory Analyst
- Inventory tracking and analysis capabilities
- Dashboard: Stock levels, movement analytics, location optimization
- Components: InventoryAnalystDashboard.tsx, InventoryAnalytics.tsx

// cargo Analyst
- Performance analysis and optimization tools
- Dashboard: KPIs, efficiency metrics, trend analysis
- Components: cargoAnalystDashboard.tsx, PerformanceMetrics.tsx

// Customer Service Representative
- Customer interaction and package release management
- Dashboard: Customer inquiries, release queue, communication tools
- Components: CustomerServiceDashboard.tsx, CustomerLookup.tsx

// Export Documentation Specialist
- International shipping documentation management
- Dashboard: Documentation queue, customs forms, compliance tracking
- Components: ExportDocumentationDashboard.tsx, DocumentManagement.tsx
```

### Operational Level Components
```typescript
// Transportation Coordinator
- Day-to-day shipping coordination
- Dashboard: Daily shipments, vehicle assignments, dispatch queue
- Components: TransportationCoordinatorDashboard.tsx, DispatchManagement.tsx

// Order Fulfillment Specialists
- Package preparation and fulfillment
- Dashboard: Processing queue, assigned packages, completion metrics
- Components: OrderFulfillmentDashboard.tsx, PackageProcessing.tsx

// Warehouse Workers
- Basic package operations and task management
- Dashboard: Assigned tasks, package locations, daily goals
- Components: WarehouseWorkerDashboard.tsx, TaskList.tsx

// Quality Control Staff
- Package inspection and quality assurance
- Dashboard: Inspection queue, quality metrics, issue tracking
- Components: QualityControlDashboard.tsx, InspectionForm.tsx

// Security Personnel
- Access control and security monitoring
- Dashboard: Access logs, security alerts, visitor management
- Components: SecurityDashboard.tsx, AccessControl.tsx
```

## Permission Matrix Implementation

```typescript
// types/permissions.ts
export interface RolePermissions {
  packages: {
    view: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    release: boolean;
  };
  shipments: {
    view: boolean;
    create: boolean;
    update: boolean;
    dispatch: boolean;
  };
  customers: {
    view: boolean;
    lookup: boolean;
    release: boolean;
    verify: boolean;
  };
  pricing: {
    view: boolean;
    calculate: boolean;
    update: boolean;
    approve: boolean;
  };
  staff: {
    view: boolean;
    create: boolean;
    update: boolean;
    assign: boolean;
  };
  analytics: {
    view: boolean;
    export: boolean;
    configure: boolean;
  };
  system: {
    configure: boolean;
    userManagement: boolean;
    backup: boolean;
  };
}

// utils/permissions.ts
export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  TRANSPORTATION_MANAGER: {
    packages: { view: true, create: true, update: true, delete: false, release: true },
    shipments: { view: true, create: true, update: true, dispatch: true },
    customers: { view: true, lookup: true, release: true, verify: true },
    pricing: { view: true, calculate: true, update: true, approve: true },
    staff: { view: true, create: false, update: true, assign: true },
    analytics: { view: true, export: true, configure: false },
    system: { configure: false, userManagement: false, backup: false }
  },
  WAREHOUSE_WORKER: {
    packages: { view: true, create: false, update: true, delete: false, release: false },
    shipments: { view: true, create: false, update: false, dispatch: false },
    customers: { view: false, lookup: false, release: false, verify: false },
    pricing: { view: false, calculate: false, update: false, approve: false },
    staff: { view: false, create: false, update: false, assign: false },
    analytics: { view: false, export: false, configure: false },
    system: { configure: false, userManagement: false, backup: false }
  }
  // ... other roles
};
```

This comprehensive frontend hierarchy provides:

1. **Role-Based Organization**: Separate components and pages for each organizational role
2. **Modular Structure**: Clear separation of concerns with reusable components
3. **Permission-Based Access**: Components that respect the role permission matrix
4. **Scalable Architecture**: Easy to extend and maintain as the system grows
5. **Type Safety**: Full TypeScript support with defined interfaces
6. **Shared Resources**: Common components, hooks, and utilities for consistency

The structure aligns perfectly with the warehouse organizational hierarchy and business requirements defined in the warehouse.md document.
