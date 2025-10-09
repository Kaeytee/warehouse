# Reports Page Documentation

## Overview
Comprehensive reporting and analytics dashboard for the VanguardCargo Warehouse System. Provides real-time insights, audit trails, and system performance metrics.

---

## Features

### 1. **Audit Logs**
- **System Activity Tracking**: Complete audit trail of all system actions
- **User Attribution**: Track which user performed each action
- **Timestamp Recording**: Precise datetime stamps for all events
- **Status Monitoring**: Success/warning/error status for each action
- **Data Source**: Pulls from `status_history` table
- **Export**: CSV export functionality included

**Displayed Information:**
- Timestamp (formatted for readability)
- User who performed the action
- Action description
- Additional details
- Status badge (color-coded)

---

### 2. **Print Analytics**
- **Total Document Count**: All documents printed through the system
- **Document Type Breakdown**:
  - Receipts
  - Waybills
  - Labels
- **Time-based Metrics**:
  - Today's prints
  - This week's prints
- **Data Source**: `package_documents` table

**Visual Cards Display:**
- Total Prints (Blue)
- Receipts (Green)
- Waybills (Purple)
- Labels (Orange)
- Today's Prints (Red)
- Week's Prints (Indigo)

---

### 3. **System Activity**
- **Package Metrics**:
  - Total packages processed
  - Pending deliveries
  - Completed today
- **Shipment Metrics**:
  - Total shipments created
  - Active users count
  - Total users in system

**Visual Presentation:**
- Gradient background cards (Blue & Purple)
- Real-time statistics
- Clear metric labels

---

### 4. **Quick Stats Dashboard**
Top-level overview cards showing:
- **Total Packages**: With trend indicator
- **Documents Printed**: Print volume trends
- **Total Users**: System user count
- **Completed Today**: Daily performance metric

---

## User Interface

### Navigation Tabs
Clean, professional tab interface for switching between report sections:
- **Audit Logs** (FiFileText icon)
- **Print Analytics** (FiPrinter icon)
- **System Activity** (FiActivity icon)
- **User Reports** (FiUsers icon)

### Action Buttons
- **Refresh**: Reload all report data (with loading spinner)
- **Export**: Download current section as CSV file

### Color Scheme
- Primary: Red (#DC2626) - Action buttons
- Status Colors:
  - Success: Green
  - Warning: Yellow
  - Error: Red
  - Info: Gray
- Gradient Cards: Blue and Purple tones

---

## Technical Implementation

### Architecture
```
Reports/
  └── Reports.tsx (Main component with all sub-components)
```

### Component Structure

#### Main Components
1. **Reports** - Parent container component
2. **StatCard** - Quick stats display cards
3. **AuditLogsSection** - Audit trail table
4. **PrintAnalyticsSection** - Print statistics cards
5. **SystemActivitySection** - System metrics dashboard
6. **UserReportsSection** - User activity (coming soon)

### Supporting Components
- **AnalyticCard** - Individual metric cards
- **MetricRow** - Single metric row display

---

## Data Flow

### State Management
```typescript
- activeSection: string          // Current active tab
- isLoading: boolean            // Loading state
- auditLogs: AuditLogEntry[]    // Audit log entries
- printAnalytics: PrintAnalytics // Print statistics
- systemStats: SystemStats       // System metrics
```

### Data Fetching Functions

#### `fetchAuditLogs()`
- Queries: `status_history` table
- Limit: 50 most recent entries
- Sorting: Descending by `changed_at`
- Transforms: Database records to `AuditLogEntry` format

#### `fetchPrintAnalytics()`
- Queries: `package_documents` table
- Calculates: Total, today, and week statistics
- Filters by: Document type (receipt, waybill, label)

#### `fetchSystemStats()`
- Queries multiple tables:
  - `packages` (total, pending, completed)
  - `shipments` (total count)
  - `users` (total count)
- Uses: Count queries for efficiency

### Export Functionality

#### CSV Export
Generates downloadable CSV files for:
- **Audit Logs**: All columns exported
- **Print Analytics**: Metrics summary

Format: `{section}-{timestamp}.csv`

---

## Database Tables Used

### 1. `status_history`
```sql
Columns:
- id (uuid)
- changed_at (timestamp)
- performed_by (text)
- new_status (text)
- reason (text)
```

### 2. `package_documents`
```sql
Columns:
- id (uuid)
- document_type (text)
- created_at (timestamp)
- package_id (uuid)
```

### 3. `packages`
```sql
Columns:
- id (uuid)
- status (text)
- updated_at (timestamp)
```

### 4. `shipments`
```sql
Columns:
- id (uuid)
- created_at (timestamp)
```

### 5. `users`
```sql
Columns:
- id (uuid)
- email (text)
- created_at (timestamp)
```

---

## Access Control

### Permission Required
`requiredPermission="reports"` in RouteGuard

### Allowed Roles
- **Super Admin**: Full access
- **Admin**: Full access
- **Warehouse Admin**: No access

---

## Features Coming Soon

### User Reports Section
- User login history
- Action logs per user
- Performance metrics
- Activity heatmaps

### Advanced Filtering
- Date range selection
- Custom date filters
- Status filters
- User filters

### Enhanced Analytics
- Charts and graphs
- Trend analysis
- Predictive metrics
- Performance benchmarks

### Scheduled Reports
- Automated report generation
- Email delivery
- Custom schedules
- Report templates

---

## Usage Guide

### Accessing Reports
1. Login as Admin or Super Admin
2. Click "Reports" in sidebar
3. Page loads with default "Audit Logs" view

### Viewing Audit Logs
1. Select "Audit Logs" tab
2. View chronological activity list
3. Check timestamps, users, actions
4. Monitor status indicators

### Checking Print Analytics
1. Select "Print Analytics" tab
2. View document statistics cards
3. Monitor today vs. week trends
4. Track document type distribution

### Monitoring System Activity
1. Select "System Activity" tab
2. Review package metrics
3. Check shipment statistics
4. Monitor user counts

### Exporting Data
1. Navigate to desired section
2. Click "Export" button
3. CSV file downloads automatically
4. Open in Excel/Google Sheets

### Refreshing Data
1. Click "Refresh" button
2. Loading indicator appears
3. All sections update with latest data

---

## Code Quality Features

### Clean Code Practices
- ✅ Fully typed with TypeScript interfaces
- ✅ Comprehensive JSDoc comments
- ✅ Every line commented for clarity
- ✅ Modular component structure
- ✅ Reusable sub-components

### Best Practices
- ✅ Error handling for all API calls
- ✅ Loading states for UX
- ✅ Responsive design (mobile-friendly)
- ✅ Professional icon usage (Feather Icons)
- ✅ Clean table layouts
- ✅ Semantic HTML structure

### Performance Optimizations
- ✅ Efficient database queries (count-only where needed)
- ✅ Limited result sets (50 audit logs)
- ✅ Async data fetching
- ✅ State management optimization

---

## Troubleshooting

### No Audit Logs Displayed
**Cause**: No data in `status_history` table  
**Solution**: Perform package status updates to generate logs

### Print Analytics Shows Zero
**Cause**: No documents in `package_documents` table  
**Solution**: Generate receipts/waybills from Package Intake or Inventory

### System Stats Incorrect
**Cause**: Database permissions or query issues  
**Solution**: Check Supabase RLS policies for table access

### Export Not Working
**Cause**: Browser blocking download  
**Solution**: Allow pop-ups/downloads for the site

---

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Charts**: Chart.js or Recharts integration
3. **Custom Dashboards**: User-configurable report layouts
4. **Email Reports**: Scheduled automated email delivery
5. **PDF Export**: In addition to CSV export
6. **Date Range Filters**: Custom date selection for all sections
7. **Search Functionality**: Search audit logs and activities
8. **Pagination**: For large dataset navigation

---

## Technical Notes

### Dependencies
```json
{
  "react": "^18.x",
  "react-icons": "^5.x",
  "@supabase/supabase-js": "^2.x"
}
```

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance Considerations
- Initial load: ~1-2 seconds
- Refresh operation: ~500ms
- Export operation: Instant
- Recommended data limit: 10,000 records

---

## Support

For issues or feature requests:
1. Check this documentation first
2. Review database table structures
3. Verify user permissions
4. Contact system administrator

---

**Last Updated**: 2025-10-09  
**Version**: 1.0.0  
**Author**: Senior Software Engineer
