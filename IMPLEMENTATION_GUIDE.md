# VanguardCargo Warehouse - Implementation Guide
## Advanced Features: Waybill, Barcode, QR, Receipt, and Verification

**Author**: Senior Software Engineer  
**Date**: 2025-10-07  
**Version**: 1.0.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema Changes](#database-schema-changes)
3. [Backend Functions](#backend-functions)
4. [Frontend Services](#frontend-services)
5. [Installation & Setup](#installation--setup)
6. [Usage Examples](#usage-examples)
7. [API Reference](#api-reference)
8. [Security Considerations](#security-considerations)

---

## Overview

This implementation adds comprehensive document generation, verification, and tracking capabilities to the VanguardCargo Warehouse system:

### ✨ Key Features

- **Digital Waybill Generation**: Comprehensive shipment documents with all details
- **Barcode & QR Code System**: Automatic code generation for tracking
- **Receipt Generation**: Professional receipts for intake and shipments
- **Enhanced Consolidation**: Complete package-to-shipment traceability
- **6-Digit Authentication**: Secure package delivery verification
- **Verification Endpoint**: Complete audit trail of delivery confirmations

---

## Database Schema Changes

### New Tables

#### 1. `receipts` Table
Stores all generated receipts for packages and shipments.

```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY,
    receipt_number TEXT UNIQUE NOT NULL,
    receipt_type TEXT CHECK (receipt_type IN ('package_intake', 'shipment_created', 'delivery_confirmation')),
    package_id UUID REFERENCES packages(id),
    shipment_id UUID REFERENCES shipments(id),
    user_id UUID NOT NULL REFERENCES users(id),
    suite_number TEXT NOT NULL,
    warehouse_name TEXT DEFAULT 'VanguardCargo Warehouse',
    receipt_data JSONB NOT NULL,
    barcode_data TEXT,
    generated_by UUID NOT NULL REFERENCES users(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    printed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `package_verification_log` Table
Complete audit trail of all verification attempts.

```sql
CREATE TABLE package_verification_log (
    id UUID PRIMARY KEY,
    package_id UUID NOT NULL REFERENCES packages(id),
    suite_number TEXT NOT NULL,
    auth_code_entered TEXT NOT NULL,
    verification_success BOOLEAN NOT NULL,
    failure_reason TEXT,
    verified_by UUID NOT NULL REFERENCES users(id),
    verified_by_role TEXT NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Modified Tables

#### `packages` Table - New Columns
```sql
ALTER TABLE packages ADD COLUMN
    barcode_data TEXT,
    qr_code_data TEXT,
    linked_to_shipment_id UUID REFERENCES shipments(id),
    delivery_auth_code TEXT,
    auth_code_generated_at TIMESTAMP WITH TIME ZONE,
    auth_code_used_at TIMESTAMP WITH TIME ZONE,
    auth_code_used_by UUID REFERENCES users(id);
```

#### `shipments` Table - New Columns
```sql
ALTER TABLE shipments ADD COLUMN
    barcode_data TEXT,
    qr_code_data TEXT,
    waybill_data JSONB,
    waybill_generated_at TIMESTAMP WITH TIME ZONE,
    total_packages INTEGER DEFAULT 0,
    combined_suite_numbers TEXT[];
```

---

## Backend Functions

### 1. Waybill Generation

**Function**: `generate_waybill(p_shipment_id, p_generated_by)`

Generates comprehensive digital waybill for shipment.

```sql
SELECT * FROM generate_waybill(
    'shipment-uuid',
    'staff-uuid'
);
```

**Returns**:
```json
{
  "success": true,
  "waybill": {
    "waybill_number": "VC240001",
    "generated_at": "2025-10-07T10:30:00Z",
    "shipment_details": { ... },
    "sender": { ... },
    "receiver": { ... },
    "packages": [ ... ],
    "barcode_data": "data:image/png;base64,...",
    "qr_code_data": "data:image/png;base64,..."
  }
}
```

### 2. Receipt Generation

**Function**: `generate_package_intake_receipt(p_package_id, p_staff_id)`

Creates receipt after package intake.

```sql
SELECT * FROM generate_package_intake_receipt(
    'package-uuid',
    'staff-uuid'
);
```

**Returns**:
```json
{
  "success": true,
  "receipt_id": "uuid",
  "receipt_number": "RCP-20251007-0001",
  "receipt_data": { ... }
}
```

### 3. Package Verification

**Function**: `verify_package_delivery(p_package_id, p_suite_number, p_auth_code, p_staff_id)`

Verifies 6-digit code and marks package as delivered.

```sql
SELECT * FROM verify_package_delivery(
    'package-uuid',
    'VC-001',
    '123456',
    'staff-uuid'
);
```

**Returns**:
```json
{
  "success": true,
  "verified": true,
  "package_id": "PKG240001",
  "tracking_number": "VC240001",
  "customer_name": "John Doe",
  "message": "Package verified successfully"
}
```

### 4. Enhanced Consolidation

**Function**: `create_shipment_from_packages_enhanced(...)`

Creates shipment with complete package linking and metrics.

```sql
SELECT * FROM create_shipment_from_packages_enhanced(
    ARRAY['pkg-uuid-1', 'pkg-uuid-2'],
    'staff-uuid',
    'Recipient Name',
    '+233123456789',
    '123 Main St',
    'Accra',
    'Ghana',
    'express'
);
```

**Returns**:
```json
{
  "success": true,
  "shipment_id": "uuid",
  "tracking_number": "VC240001",
  "packages_count": 2,
  "total_weight": 5.5,
  "total_value": 250.00,
  "suite_numbers": ["VC-001", "VC-002"]
}
```

---

## Frontend Services

### 1. Warehouse Document Service

Located at: `src/services/warehouseDocumentService.ts`

```typescript
import { warehouseDocumentService } from '@/services/warehouseDocumentService';

// Generate waybill
const waybill = await warehouseDocumentService.generateWaybill(
    shipmentId,
    userId
);

// Generate receipt
const receipt = await warehouseDocumentService.generatePackageIntakeReceipt(
    packageId,
    staffId
);

// Verify package delivery
const result = await warehouseDocumentService.verifyPackageDelivery({
    package_id: 'uuid',
    suite_number: 'VC-001',
    auth_code: '123456',
    staff_id: 'staff-uuid'
});
```

### 2. Barcode & QR Code Generator

Located at: `src/utils/barcodeQRGenerator.ts`

```typescript
import { barcodeQRGenerator } from '@/utils/barcodeQRGenerator';

// Generate barcode
const barcode = await barcodeQRGenerator.generateBarcode('VC240001');

// Generate QR code
const qrCode = await barcodeQRGenerator.generateQRCode('https://...');

// Generate complete package codes
const codes = await barcodeQRGenerator.generatePackageCodes('VC240001');

// Download barcode
barcodeQRGenerator.downloadBarcode('VC240001');

// Print QR code
barcodeQRGenerator.printQRCode('https://...', 'Label');
```

---

## Installation & Setup

### Step 1: Run Database Migrations

Execute the SQL files in order:

```bash
# Connect to your Supabase database
psql -h your-db-host -U postgres -d your-database

# Run migrations in order
\i sql/51_add_waybill_barcode_auth_fields.sql
\i sql/52_waybill_barcode_receipt_functions.sql
\i sql/53_receipt_verification_functions.sql
\i sql/54_enhanced_consolidation_functions.sql
```

### Step 2: Install NPM Dependencies

```bash
npm install qrcode @types/qrcode @types/jsbarcode
```

The following are already installed:
- `jsbarcode` - for barcode generation
- `html2canvas` - for capturing components
- `jspdf` - for PDF generation

### Step 3: Update Environment Variables

No new environment variables required. All features use existing Supabase configuration.

### Step 4: Build and Test

```bash
# Type check
npm run type-check

# Build
npm run build

# Run development server
npm run dev
```

---

## Usage Examples

### Example 1: Package Intake with Auto-Generated Codes

```typescript
// 1. Perform package intake (generates auth code automatically)
const intakeResult = await supabase.rpc('warehouse_package_intake_enhanced', {
    p_user_suite_number: 'VC-001',
    p_description: 'Electronics',
    p_warehouse_staff_id: staffId,
    p_weight: 2.5,
    p_declared_value: 150.00
});

// 2. Generate barcode and QR code
const packageId = intakeResult.data.package_uuid;
const trackingNumber = intakeResult.data.tracking_number;

const codes = await barcodeQRGenerator.generatePackageCodes(trackingNumber);

// 3. Store codes in database
await warehouseDocumentService.storePackageCodes(
    packageId,
    codes.barcode.dataUrl,
    codes.qrCode.dataUrl,
    staffId
);

// 4. Generate receipt
const receipt = await warehouseDocumentService.generatePackageIntakeReceipt(
    packageId,
    staffId
);

// 5. Display 6-digit auth code to customer
console.log('Your delivery code:', intakeResult.data.auth_code);
```

### Example 2: Create Shipment with Waybill

```typescript
// 1. Create consolidated shipment
const shipmentResult = await supabase.rpc('create_shipment_from_packages_enhanced', {
    p_package_ids: [packageId1, packageId2],
    p_warehouse_staff_id: staffId,
    p_recipient_name: 'John Doe',
    p_recipient_phone: '+233123456789',
    p_delivery_address: '123 Main St',
    p_delivery_city: 'Accra',
    p_delivery_country: 'Ghana'
});

const shipmentId = shipmentResult.data.shipment_id;
const trackingNumber = shipmentResult.data.tracking_number;

// 2. Generate codes
const codes = await barcodeQRGenerator.generateShipmentCodes(trackingNumber);

// 3. Store codes
await warehouseDocumentService.storeShipmentCodes(
    shipmentId,
    codes.barcode.dataUrl,
    codes.qrCode.dataUrl,
    staffId
);

// 4. Generate waybill
const waybill = await warehouseDocumentService.generateWaybill(
    shipmentId,
    staffId
);

// 5. Generate receipt
const receipt = await warehouseDocumentService.generateShipmentReceipt(
    shipmentId,
    staffId
);
```

### Example 3: Verify Package Delivery

```typescript
// 1. Customer arrives to collect package
// Staff scans package barcode or enters tracking number

// 2. Customer provides 6-digit code and suite number

// 3. Verify package
const verificationResult = await warehouseDocumentService.verifyPackageDelivery({
    package_id: packageId,
    suite_number: 'VC-001',
    auth_code: '123456',
    staff_id: staffId
});

// 4. Check result
if (verificationResult.verified) {
    // Package successfully verified and marked as delivered
    console.log('Package released to:', verificationResult.customer_name);
} else {
    // Verification failed
    console.error('Verification failed:', verificationResult.reason);
    // Reasons could be:
    // - Invalid authentication code
    // - Suite number mismatch
    // - Package not in arrived status
    // - Code already used
}

// 5. View verification logs (admin only)
const logs = await warehouseDocumentService.getVerificationLogs(
    packageId,
    staffId
);
```

---

## API Reference

### TypeScript Interfaces

```typescript
// Waybill Data
interface WaybillData {
  waybill_number: string;
  generated_at: string;
  shipment_details: ShipmentDetails;
  sender: SenderInfo;
  receiver: ReceiverInfo;
  packages: PackageInfo[];
  barcode_data: string | null;
  qr_code_data: string | null;
  warehouse_info: WarehouseInfo;
}

// Receipt Data
interface ReceiptData {
  receipt_id: string;
  receipt_number: string;
  receipt_type: 'package_intake' | 'shipment_created' | 'delivery_confirmation';
  receipt_data: any;
  generated_at: string;
}

// Verification Request
interface PackageVerificationRequest {
  package_id: string;
  suite_number: string;
  auth_code: string;
  staff_id: string;
}

// Verification Result
interface PackageVerificationResult {
  success: boolean;
  verified: boolean;
  package_id?: string;
  tracking_number?: string;
  customer_name?: string;
  message: string;
  reason?: string;
}
```

---

## Security Considerations

### 1. Authentication Code Security

- ✅ Codes are stored securely in database
- ✅ One-time use only (marked as used after successful verification)
- ✅ Complete audit trail of all attempts
- ✅ Staff ID logged for accountability
- ✅ Timestamp tracking for security analysis

### 2. Role-Based Access Control

All operations require appropriate permissions:

- **Waybill Generation**: Admin, Warehouse Admin, Super Admin
- **Receipt Generation**: Admin, Warehouse Admin, Super Admin
- **Package Verification**: Admin, Warehouse Admin, Super Admin
- **Code Storage**: Admin, Warehouse Admin, Super Admin

### 3. Data Privacy

- Receipts are only accessible to:
  - The customer who owns the package/shipment
  - Admin staff with proper permissions
- Row Level Security (RLS) policies enforce access control
- Verification logs are admin-only

### 4. Audit Trail

Every action is logged:
- Receipt generation (who, when, what)
- Waybill generation (staff ID, timestamp)
- Verification attempts (success/failure, reason, staff ID)
- Code usage (when used, by whom)

---

## Automation Compatibility

All features are compatible with existing automation:

✅ **112-Hour Auto-Shipment Rule**: Works seamlessly  
✅ **Automatic Code Generation**: Integrated into intake process  
✅ **Receipt Generation**: Can be triggered automatically or manually  
✅ **Barcode/QR Generation**: Automatic or on-demand  

---

## Troubleshooting

### Issue: Barcode not generating

**Solution**: Ensure `jsbarcode` is installed and tracking number is valid.

```bash
npm install jsbarcode @types/jsbarcode
```

### Issue: QR code generation fails

**Solution**: Check that `qrcode` package is installed.

```bash
npm install qrcode @types/qrcode
```

### Issue: Database functions not found

**Solution**: Run migrations in correct order:

```bash
psql -f sql/51_add_waybill_barcode_auth_fields.sql
psql -f sql/52_waybill_barcode_receipt_functions.sql
psql -f sql/53_receipt_verification_functions.sql
psql -f sql/54_enhanced_consolidation_functions.sql
```

### Issue: Permission denied on function calls

**Solution**: Ensure RLS policies are applied and user has correct role.

```sql
-- Check user role
SELECT role FROM users WHERE id = 'user-uuid';

-- Should be one of: 'admin', 'superadmin', 'warehouse_admin', 'super_admin'
```

---

## Next Steps

### Phase 2: Frontend UI Components (Pending)

1. **Waybill Viewer Component**: Display and print waybills
2. **Receipt Viewer Component**: Professional receipt display
3. **Verification Modal**: Staff interface for package verification
4. **Barcode Scanner Integration**: Use device camera for scanning
5. **Consolidation Dashboard**: Enhanced shipment grouping UI

### Future Enhancements

- Email delivery of receipts to customers
- SMS notification with auth code
- Mobile app for customer verification
- Batch barcode printing
- Advanced analytics dashboard

---

## Support

For questions or issues:

1. Check this implementation guide
2. Review code comments in service files
3. Examine database function documentation
4. Test with provided examples

---

**End of Implementation Guide**
