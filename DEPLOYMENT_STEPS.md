# 🚀 Pickup Code System - Quick Deployment Guide

## Prerequisites
- ✅ Supabase project set up
- ✅ Database access credentials
- ✅ Frontend running (npm run dev)

---

## Step 1: Deploy Database (5 minutes)

### Connect to Supabase
```bash
# Using psql
psql -h your-supabase-host.supabase.co -U postgres -d postgres

# Or use Supabase SQL Editor in dashboard
```

### Run Deployment Script
```bash
# From sql directory
\i sql/00_DEPLOY_PICKUP_CODE_SYSTEM.sql
```

**This will:**
- ✅ Create `pickup_code_verification_logs` table
- ✅ Add pickup code columns to `packages` table
- ✅ Install auto-generation trigger
- ✅ Create all verification functions
- ✅ Set up RLS policies

---

## Step 2: Verify Installation (2 minutes)

### Check Tables
```sql
-- Verify logs table exists
SELECT COUNT(*) FROM pickup_code_verification_logs;

-- Check package columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'packages' 
  AND column_name LIKE 'pickup_code%';
```

### Check Trigger
```sql
-- Verify trigger is active
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'shipment_arrival_code_generation_trigger';
```

---

## Step 3: Test Code Generation (3 minutes)

### Create Test Scenario
```sql
-- 1. Find or create a test shipment
SELECT id, tracking_number, status 
FROM shipments 
WHERE status = 'in_transit' 
LIMIT 1;

-- 2. Mark it as arrived (this triggers code generation)
UPDATE shipments 
SET status = 'arrived' 
WHERE tracking_number = 'YOUR-TEST-TRACKING';

-- 3. Check if codes were generated
SELECT 
    package_id,
    tracking_number,
    pickup_code_generated_at IS NOT NULL as has_code,
    pickup_code_expires_at
FROM packages
WHERE linked_to_shipment_id = (
    SELECT id FROM shipments WHERE tracking_number = 'YOUR-TEST-TRACKING'
);

-- 4. View generation logs
SELECT 
    action_type,
    outcome,
    metadata,
    created_at
FROM pickup_code_verification_logs
WHERE action_type = 'generate'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result:**
- ✅ All packages should have `pickup_code_generated_at` filled
- ✅ Logs should show successful generation
- ✅ Codes expire in 30 days

---

## Step 4: Access Delivery Page (1 minute)

### Navigate to Delivery
1. Log into warehouse app
2. Click **"Delivery"** in sidebar
3. You should see:
   - Arrived shipments count
   - Packages awaiting pickup
   - Search and filter options

### Test Verification (Manual)

Since you don't have the plaintext code from the trigger (it's only returned once), you can:

**Option A: Check Logs (For Testing)**
```sql
-- Get a package with code
SELECT id, package_id, tracking_number
FROM packages
WHERE pickup_code_hash IS NOT NULL
LIMIT 1;

-- For testing only, regenerate code as admin
SELECT regenerate_pickup_code(
    'package-uuid-here',
    'your-admin-user-id',
    30
);
-- This returns: { new_code: "123456" }
```

**Option B: Use Verification Modal**
1. Click "Verify & Deliver" on any package
2. Enter suite number (get from package owner)
3. Enter 6-digit code (from regeneration or notification)
4. System validates and updates status

---

## Step 5: Production Setup (Optional)

### Adjust Code Expiry
```sql
-- Change default expiry to 60 days
SELECT generate_pickup_codes_for_shipment(
    'shipment-id',
    60  -- Days until expiry
);
```

### Set Up Notifications

The trigger returns plaintext codes - integrate with your notification system:

```typescript
// After shipment arrives, codes are in generation result
const result = await supabase.rpc('generate_pickup_codes_for_shipment', {
  p_shipment_id: shipmentId
});

// result.codes contains array with plaintext codes
for (const codeData of result.codes) {
  // Send to customer via email/SMS
  await sendNotification(codeData.user_id, {
    package_id: codeData.package_identifier,
    code: codeData.code,  // Plaintext 6-digit code
    expires_at: codeData.expires_at
  });
}
```

### Monitor Security
```sql
-- Daily check for suspicious activity
SELECT 
    p.package_id,
    p.pickup_code_failed_attempts,
    COUNT(l.id) as total_failed
FROM packages p
LEFT JOIN pickup_code_verification_logs l 
    ON p.id = l.package_id 
    AND l.outcome = 'failure'
WHERE p.pickup_code_failed_attempts >= 3
GROUP BY p.id, p.package_id, p.pickup_code_failed_attempts
ORDER BY p.pickup_code_failed_attempts DESC;
```

---

## 🎯 Complete Flow Summary

```
1. PACKAGE INTAKE
   └─> Staff logs package (no code yet)
   └─> Message: "Code will be generated on arrival"

2. SHIPMENT CREATION
   └─> Packages consolidated
   └─> Status: "processing"

3. SHIPMENT DISPATCH
   └─> Status: "in_transit"

4. ⭐ SHIPMENT ARRIVAL (AUTO TRIGGER)
   └─> UPDATE shipments SET status = 'arrived'
   └─> TRIGGER FIRES:
       ├─> Generate 6-digit codes for all packages
       ├─> Hash codes with bcrypt
       ├─> Store in database
       ├─> Return plaintext for notification
       └─> Log everything

5. CUSTOMER NOTIFICATION
   └─> You send codes via email/SMS/app
   └─> Customer receives code

6. DELIVERY
   └─> Customer comes to warehouse
   └─> Staff uses Delivery page
   └─> Enters suite + 6-digit code
   └─> System verifies → Status becomes "delivered"
```

---

## ✅ Verification Checklist

Before going live:

- [ ] SQL deployment completed successfully
- [ ] Trigger is active and working
- [ ] Test shipment generated codes
- [ ] Delivery page accessible in navigation
- [ ] Verification modal works
- [ ] Failed attempts increment properly
- [ ] Rate limiting activates after 5 failures
- [ ] Expired codes are rejected
- [ ] Audit logs are recording events
- [ ] Notification system integrated (optional)

---

## 🆘 Troubleshooting

### Codes Not Generating
**Problem:** Shipment marked arrived but no codes
**Solution:**
```sql
-- Manual generation
SELECT generate_pickup_codes_for_shipment('shipment-uuid', 30);
```

### Can't Verify Code
**Problem:** Valid code rejected
**Check:**
```sql
-- Package details
SELECT 
    package_id,
    status,
    pickup_code_hash IS NOT NULL as has_code,
    pickup_code_expires_at < NOW() as is_expired,
    pickup_code_used_at,
    pickup_code_failed_attempts,
    pickup_code_locked_until
FROM packages WHERE id = 'package-uuid';
```

### Rate Limited Unfairly
**Problem:** Customer locked out
**Admin Fix:**
```sql
UPDATE packages
SET 
    pickup_code_failed_attempts = 0,
    pickup_code_locked_until = NULL
WHERE id = 'package-uuid';
```

---

## 📚 Documentation

- **Full Documentation**: `PICKUP_CODE_SYSTEM.md`
- **SQL Files**: `sql/60_*.sql` and `sql/61_*.sql`
- **Frontend**: `src/app/pages/Delivery/Delivery.tsx`

---

## 🎉 You're Done!

The system is now fully operational:
- ✅ Auto-generates codes on arrival
- ✅ Secure bcrypt storage
- ✅ Rate limiting active
- ✅ Delivery page ready
- ✅ Complete audit trail

**Start using the Delivery page to verify packages!** 🚀
