# 🔐 Pickup Code System Documentation

## Overview

The Pickup Code System automatically generates secure 6-digit codes when shipments arrive, enabling verified package delivery with complete audit trails and security protections.

---

## 📋 Table of Contents

1. [System Flow](#system-flow)
2. [Database Schema](#database-schema)
3. [Security Features](#security-features)
4. [Deployment](#deployment)
5. [Usage Guide](#usage-guide)
6. [API Reference](#api-reference)
7. [Frontend Integration](#frontend-integration)
8. [Troubleshooting](#troubleshooting)

---

## 🔄 System Flow

### **Complete Lifecycle**

```
1. SHIPMENT CREATION
   └─> Packages consolidated into shipment
   └─> Status: "processing"

2. SHIPMENT DISPATCH
   └─> Shipment sent to destination
   └─> Status: "in_transit"

3. ⭐ SHIPMENT ARRIVAL (TRIGGER POINT)
   └─> Status changes to "arrived"
   └─> AUTOMATIC TRIGGER FIRES
       ├─> For each package in shipment:
       │   ├─> Generate unique 6-digit code
       │   ├─> Hash code with bcrypt
       │   ├─> Store hash in packages.pickup_code_hash
       │   ├─> Set expiry (default: 30 days)
       │   ├─> Reset failed attempts to 0
       │   └─> Log generation event
       └─> Return plaintext codes for notification delivery

4. CUSTOMER NOTIFICATION
   └─> System sends codes to customers
   └─> Via: In-app, Email, SMS (configured)
   └─> Customer receives: Package ID + 6-digit code

5. PACKAGE PICKUP (VERIFICATION)
   └─> Customer arrives at warehouse
   └─> Staff opens Delivery page
   └─> Enters: Suite number + 6-digit code
   └─> System verifies:
       ├─> Suite number matches package owner ✓
       ├─> Code hasn't expired ✓
       ├─> Code hasn't been used ✓
       ├─> Code matches hash ✓
       └─> Not rate-limited ✓
   └─> If all checks pass:
       ├─> Package status → "delivered"
       ├─> Mark code as used
       ├─> Log successful verification
       └─> Update collected_by & collected_at

6. COMPLETE
   └─> Package handed to customer
   └─> Audit trail preserved
```

---

## 🗄️ Database Schema

### **New Table: `pickup_code_verification_logs`**

Complete audit trail for all code generation and verification events.

```sql
CREATE TABLE pickup_code_verification_logs (
    id UUID PRIMARY KEY,
    package_id UUID NOT NULL,
    shipment_id UUID,
    tracking_number TEXT NOT NULL,
    action_type TEXT NOT NULL,  -- 'generate', 'verify', 'regenerate', 'expire'
    actor_type TEXT NOT NULL,   -- 'system', 'staff', 'customer'
    actor_id UUID,
    outcome TEXT NOT NULL,      -- 'success', 'failure', 'partial'
    verification_code TEXT,     -- Only for failed attempts
    failure_reason TEXT,
    metadata JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **New Columns in `packages` Table**

```sql
-- Secure code storage
pickup_code_hash TEXT                  -- Bcrypt hash of 6-digit code
pickup_code_generated_at TIMESTAMPTZ   -- When code was created
pickup_code_generated_by TEXT          -- 'system_shipment_arrival'
pickup_code_expires_at TIMESTAMPTZ     -- Expiration timestamp

-- Usage tracking
pickup_code_used_at TIMESTAMPTZ        -- When code was used
pickup_code_used_by UUID               -- Staff who verified

-- Rate limiting
pickup_code_failed_attempts INTEGER    -- Failed verification count
pickup_code_locked_until TIMESTAMPTZ   -- Lockout expiration

-- Delivery tracking
collected_by UUID                      -- Staff who handed package
collected_at TIMESTAMPTZ               -- Actual handover time
```

---

## 🔒 Security Features

### **1. Bcrypt Hashing**

- Codes stored as **one-way bcrypt hashes**
- No plaintext codes in database after generation
- Rainbow table attacks prevented
- Hash algorithm: `bf` (Blowfish) with automatic salt

```sql
-- Hashing
pickup_code_hash = crypt('123456', gen_salt('bf'))

-- Verification
crypt('123456', pickup_code_hash) = pickup_code_hash  -- True if match
```

### **2. Code Uniqueness**

- Collision detection before generation
- Checks against all active codes
- Maximum 100 generation attempts
- 900,000 possible combinations (100000-999999)

### **3. Rate Limiting**

- **Maximum 5 failed attempts** per package
- **30-minute lockout** after 5 failures
- Counter resets on successful verification
- Lockout enforced in verification function

### **4. Code Expiry**

- **Default: 30 days** from generation
- Configurable per generation
- Expired codes fail verification
- Admin can regenerate expired codes

### **5. Multi-Factor Validation**

Verification requires:
1. ✅ Correct suite number (package owner)
2. ✅ Correct 6-digit code
3. ✅ Code not expired
4. ✅ Code not already used
5. ✅ Package in "arrived" status
6. ✅ Not rate-limited

### **6. Complete Audit Trail**

- Every generation logged
- Every verification attempt logged (success/failure)
- IP addresses captured
- Staff IDs recorded
- Failure reasons documented

---

## 🚀 Deployment

### **Step 1: Run Master Deployment Script**

```bash
# Connect to your Supabase database
psql -h your-supabase-host -U postgres -d postgres

# Run master deployment
\i sql/00_DEPLOY_PICKUP_CODE_SYSTEM.sql
```

This will:
- Create all tables
- Add columns to packages table
- Create helper functions
- Install triggers
- Set up RLS policies

### **Step 2: Verify Installation**

```sql
-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'shipment_arrival_code_generation_trigger';

-- Check if logs table exists
SELECT COUNT(*) FROM pickup_code_verification_logs;

-- Check if package columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'packages' 
  AND column_name LIKE 'pickup_code%';
```

### **Step 3: Test Code Generation**

```sql
-- Create test shipment and mark as arrived
UPDATE shipments 
SET status = 'arrived' 
WHERE id = 'your-test-shipment-id';

-- Check if codes were generated
SELECT 
    package_id,
    tracking_number,
    pickup_code_generated_at IS NOT NULL as has_code,
    pickup_code_expires_at
FROM packages
WHERE linked_to_shipment_id = 'your-test-shipment-id';

-- Check generation logs
SELECT * FROM pickup_code_verification_logs
WHERE action_type = 'generate'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 📖 Usage Guide

### **For Warehouse Staff**

#### **Viewing Packages Ready for Pickup**

1. Navigate to **Delivery** page in warehouse app
2. View all arrived shipments and packages
3. See which packages have codes generated
4. Filter by shipment or search by suite/tracking

#### **Verifying Package Pickup**

1. Customer arrives with 6-digit code
2. Click "Verify & Deliver" on package
3. Enter customer's suite number
4. Enter 6-digit code provided by customer
5. Click "Verify & Mark Delivered"
6. System validates and updates status
7. Hand package to customer

#### **Handling Failed Verifications**

- **Wrong suite number**: Ask customer to verify their suite
- **Wrong code**: Ask customer to check notification
- **Expired code**: Use admin function to regenerate
- **Rate limited**: Wait 30 minutes or contact admin
- **No code generated**: Check if shipment is marked "arrived"

### **For Administrators**

#### **Regenerating Expired Codes**

```sql
-- Regenerate code for a package
SELECT regenerate_pickup_code(
    'package-uuid-here',
    'admin-user-id',
    30  -- Days until expiry
);

-- Returns: { success: true, new_code: "123456", expires_at: "..." }
```

#### **Viewing Verification Logs**

```sql
-- Get all logs for a package
SELECT get_package_verification_logs(
    'package-uuid',
    'admin-user-id'
);

-- Manual query
SELECT 
    action_type,
    outcome,
    failure_reason,
    created_at
FROM pickup_code_verification_logs
WHERE package_id = 'package-uuid'
ORDER BY created_at DESC;
```

#### **Monitoring Security**

```sql
-- Find packages with multiple failed attempts
SELECT 
    p.package_id,
    p.tracking_number,
    u.suite_number,
    p.pickup_code_failed_attempts,
    p.pickup_code_locked_until
FROM packages p
JOIN users u ON p.user_id = u.id
WHERE p.pickup_code_failed_attempts >= 3
ORDER BY p.pickup_code_failed_attempts DESC;

-- Recent failed verifications
SELECT 
    tracking_number,
    failure_reason,
    created_at
FROM pickup_code_verification_logs
WHERE action_type = 'verify'
  AND outcome = 'failure'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🔌 API Reference

### **Function: `generate_pickup_codes_for_shipment()`**

Auto-generates codes for all packages in a shipment.

**Parameters:**
- `p_shipment_id` (UUID) - Shipment ID
- `p_code_expiry_days` (INTEGER) - Days until expiry (default: 30)

**Returns:**
```json
{
  "success": true,
  "job_id": "uuid",
  "shipment_id": "uuid",
  "codes_generated": 5,
  "codes_failed": 0,
  "codes": [
    {
      "package_id": "uuid",
      "package_identifier": "PKG123",
      "tracking_number": "VC123456",
      "user_id": "uuid",
      "code": "123456",  // PLAINTEXT - for notification only
      "expires_at": "2025-02-06T..."
    }
  ],
  "message": "Generated 5 codes, 0 failed"
}
```

**Usage:**
```sql
-- Manual generation
SELECT generate_pickup_codes_for_shipment(
    'shipment-uuid-here',
    30  -- expiry days
);
```

---

### **Function: `verify_pickup_code()`**

Verifies pickup code and marks package as delivered.

**Parameters:**
- `p_package_id` (UUID) - Package UUID
- `p_suite_number` (TEXT) - Customer's suite number
- `p_pickup_code` (TEXT) - 6-digit code
- `p_staff_id` (UUID) - Staff performing verification
- `p_ip_address` (INET) - Optional IP for logging

**Returns:**
```json
// Success
{
  "success": true,
  "verified": true,
  "package_id": "PKG123",
  "tracking_number": "VC123456",
  "customer_name": "John Doe",
  "suite_number": "VC-001",
  "old_status": "arrived",
  "new_status": "delivered",
  "collected_at": "2025-01-07T...",
  "message": "Package successfully verified and marked as delivered"
}

// Failure
{
  "success": false,
  "verified": false,
  "message": "Invalid pickup code",
  "failed_attempts": 3,
  "max_attempts": 5
}
```

**Usage:**
```typescript
// In Delivery page
const { data, error } = await supabase.rpc('verify_pickup_code', {
  p_package_id: packageId,
  p_suite_number: suiteNumber.trim(),
  p_pickup_code: code.trim(),
  p_staff_id: userId,
  p_ip_address: null
});
```

---

### **Function: `regenerate_pickup_code()`**

Regenerates code for a package (admin only).

**Parameters:**
- `p_package_id` (UUID) - Package UUID
- `p_admin_id` (UUID) - Admin user ID
- `p_code_expiry_days` (INTEGER) - Days until expiry (default: 30)

**Returns:**
```json
{
  "success": true,
  "package_id": "PKG123",
  "tracking_number": "VC123456",
  "new_code": "789012",  // PLAINTEXT - send to customer
  "expires_at": "2025-02-06T...",
  "message": "Pickup code regenerated successfully"
}
```

---

## 🎨 Frontend Integration

### **Delivery Page Component**

Location: `/src/app/pages/Delivery/Delivery.tsx`

**Features:**
- Lists all arrived shipments
- Shows packages awaiting pickup
- Displays code status (ready, expired, locked)
- Verification modal with suite + code inputs
- Real-time validation feedback
- Auto-refresh after successful verification

**Key Functions:**
```typescript
// Fetch packages
const fetchPackagesAwaitingPickup = async () => {
  const { data } = await supabase
    .from('packages')
    .select(`...`)
    .eq('status', 'arrived');
};

// Verify code
const handleVerifyPickupCode = async () => {
  const { data } = await supabase.rpc('verify_pickup_code', {
    p_package_id: packageId,
    p_suite_number: suiteNumber,
    p_pickup_code: code,
    p_staff_id: userId
  });
};
```

### **Package Intake (Updated)**

- **Removed:** Auth code generation and display
- **Added:** Info message: "Pickup code will be auto-generated when shipment arrives"
- Codes now only generated when shipment status → "arrived"

---

## 🔧 Troubleshooting

### **Codes Not Generating**

**Problem:** Shipment marked as arrived but no codes generated

**Solutions:**
1. Check trigger is enabled:
   ```sql
   SELECT tgenabled FROM pg_trigger 
   WHERE tgname = 'shipment_arrival_code_generation_trigger';
   ```

2. Check packages are in correct status:
   ```sql
   SELECT status, COUNT(*) 
   FROM packages 
   WHERE linked_to_shipment_id = 'shipment-id'
   GROUP BY status;
   ```

3. Manual generation:
   ```sql
   SELECT generate_pickup_codes_for_shipment('shipment-id', 30);
   ```

---

### **Verification Failing**

**Problem:** Valid code rejected

**Checks:**
```sql
-- Check package details
SELECT 
    package_id,
    pickup_code_hash IS NOT NULL as has_code,
    pickup_code_expires_at,
    pickup_code_expires_at < NOW() as is_expired,
    pickup_code_used_at,
    pickup_code_failed_attempts,
    pickup_code_locked_until,
    status
FROM packages 
WHERE id = 'package-uuid';

-- Check customer suite
SELECT suite_number 
FROM users 
WHERE id = (SELECT user_id FROM packages WHERE id = 'package-uuid');
```

---

### **Rate Limiting Reset**

**Problem:** Customer locked out unfairly

**Admin Override:**
```sql
-- Reset failed attempts and unlock
UPDATE packages
SET 
    pickup_code_failed_attempts = 0,
    pickup_code_locked_until = NULL
WHERE id = 'package-uuid';
```

---

## 📊 Monitoring Queries

### **Daily Statistics**

```sql
SELECT 
    DATE(created_at) as date,
    action_type,
    outcome,
    COUNT(*) as count
FROM pickup_code_verification_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at), action_type, outcome
ORDER BY date DESC, action_type;
```

### **Security Alerts**

```sql
-- Packages with suspicious activity
SELECT 
    p.package_id,
    p.tracking_number,
    p.pickup_code_failed_attempts,
    COUNT(l.id) as total_attempts
FROM packages p
LEFT JOIN pickup_code_verification_logs l 
    ON p.id = l.package_id 
    AND l.action_type = 'verify'
    AND l.outcome = 'failure'
WHERE p.pickup_code_failed_attempts >= 3
GROUP BY p.id, p.package_id, p.tracking_number, p.pickup_code_failed_attempts
ORDER BY p.pickup_code_failed_attempts DESC;
```

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| Auto-generation on arrival | ✅ Complete |
| Bcrypt hashing | ✅ Secure |
| Rate limiting | ✅ Active (5 attempts) |
| Code expiry | ✅ Active (30 days) |
| Audit logging | ✅ Complete |
| Delivery page | ✅ Built |
| Admin tools | ✅ Available |
| Documentation | ✅ Complete |

**System is production-ready!** 🚀
