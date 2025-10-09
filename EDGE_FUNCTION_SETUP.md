# 📧 Automatic Email System - Edge Function Integration

## Overview
Your database now automatically calls your `send-notification-email` Edge Function when package/shipment status changes. **No frontend code needed!**

---

## ✅ What's Implemented

### 1. **Package Delivery Emails**
- Trigger: When package status changes to `'delivered'`
- Automatically fetches user email and package details
- Calls your Edge Function with complete data
- Customer receives delivery confirmation email

### 2. **Shipment Status Update Emails** (BONUS)
- Trigger: When shipment status changes (processing, in_transit, arrived, etc.)
- Sends email to ALL customers with packages in that shipment
- Status-specific messages for each transition
- Includes tracking number and action links

---

## 🔧 Setup Required (3 Minutes)

### Step 1: Get Your Supabase Credentials

Go to your Supabase Dashboard:
1. **Project URL**: Dashboard > Settings > API > Project URL
   - Example: `https://abcdefghijklmnop.supabase.co`
   - Extract just the reference: `abcdefghijklmnop`

2. **Anon Key**: Dashboard > Settings > API > Project API keys > `anon` `public`
   - Copy the long key (starts with `eyJ...`)

### Step 2: Update the SQL File

Open `/sql/86_auto_email_on_delivery.sql` and replace:

**Line 54:**
```sql
edge_function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-email';
```
Change `YOUR_PROJECT_REF` to your actual project reference.

**Line 55:**
```sql
supabase_anon_key := 'YOUR_ANON_KEY';
```
Change `YOUR_ANON_KEY` to your actual anon key.

**Do the same for Line 143-144** (shipment trigger function).

### Step 3: Run the SQL File

Execute the updated SQL file in Supabase SQL Editor:
```
/sql/86_auto_email_on_delivery.sql
```

### Step 4: Verify Installation

Check that triggers are active:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%email%';
```

Should show:
- `trigger_send_delivery_email` on `packages` table ✅
- `trigger_send_shipment_status_email` on `shipments` table ✅

---

## 📦 Data Your Edge Function Receives

### For Package Delivery:
```json
{
  "type": "package_delivered",
  "userId": "uuid-here",
  "userEmail": "customer@example.com",
  "userName": "John Doe",
  "packageId": "PKG251008UWNNWQ",
  "trackingNumber": "VC251008NKZQSAYQ",
  "suiteNumber": "A123",
  "deliveredAt": "2025-10-09T00:00:00Z",
  "notificationData": {
    "title": "📦 Package Delivered",
    "message": "Your package PKG251008UWNNWQ has been successfully delivered! You can pick it up at your convenience.",
    "actionUrl": "/packages/VC251008NKZQSAYQ"
  }
}
```

### For Shipment Status Update:
```json
{
  "type": "shipment_status_update",
  "userId": "uuid-here",
  "userEmail": "customer@example.com",
  "userName": "John Doe",
  "shipmentTracking": "VC251008SHIPMENT",
  "status": "arrived",
  "suiteNumber": "A123",
  "updatedAt": "2025-10-09T00:00:00Z",
  "notificationData": {
    "title": "🚚 Shipment Update: ARRIVED",
    "message": "Your shipment has arrived at the warehouse! Check your delivery codes. (Tracking: VC251008SHIPMENT)",
    "actionUrl": "/tracking/VC251008SHIPMENT"
  }
}
```

---

## 🧪 Testing

### Test Package Delivery Email:
```sql
-- Update a package to 'delivered'
UPDATE packages 
SET status = 'delivered' 
WHERE package_id = 'PKG251008UWNNWQ';

-- Check PostgreSQL logs for:
-- "✅ Email notification queued for user..."
```

### Test Shipment Status Email:
```sql
-- Update shipment status
UPDATE shipments 
SET status = 'arrived' 
WHERE tracking_number = 'VC251008SHIPMENT';

-- Should send email to all customers with packages in this shipment
```

### Check Edge Function Logs:
1. Go to Supabase Dashboard
2. Navigate to Edge Functions > `send-notification-email`
3. View Logs tab
4. Should see POST requests with the payload

---

## 🔄 Workflow Diagram

```
Package Status Changed to 'delivered'
          ↓
Database Trigger Fires
          ↓
trigger_delivery_email() Function Runs
          ↓
Fetches User Email & Package Details
          ↓
HTTP POST to Edge Function (via pg_net)
          ↓
Edge Function 'send-notification-email' Receives Data
          ↓
Edge Function Sends Email (Resend/SendGrid/etc.)
          ↓
Customer Receives Email ✅
```

**100% AUTOMATIC - NO FRONTEND INVOLVEMENT!**

---

## 🐛 Troubleshooting

### Email Not Sending?

1. **Check PostgreSQL Logs:**
   ```sql
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%http_post%';
   ```

2. **Check Edge Function Logs:**
   - Supabase Dashboard > Edge Functions > Logs

3. **Verify pg_net Extension:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```
   Should return 1 row. If not, re-run the SQL file.

4. **Test Edge Function Directly:**
   ```bash
   curl -X POST \
     https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-email \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"type":"package_delivered","userEmail":"test@test.com",...}'
   ```

5. **Check Trigger is Active:**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_send_delivery_email';
   ```

---

## 🎯 Benefits

✅ **Zero Frontend Code** - Everything happens in database  
✅ **Reliable** - Triggers guaranteed to fire on status change  
✅ **Scalable** - Handles any number of packages/shipments  
✅ **Fault Tolerant** - Errors don't block package updates  
✅ **Real-time** - Emails sent immediately on status change  
✅ **Auditable** - All requests logged in PostgreSQL and Edge Function logs  

---

## 📝 Summary

After setup, your system will:
- ✅ Automatically email customers when their package is delivered
- ✅ Automatically email customers when shipment status changes
- ✅ Include all relevant package/shipment details in emails
- ✅ Link customers to tracking pages in emails
- ✅ Work completely independent of frontend code

**Just update the 2 values (PROJECT_REF and ANON_KEY) and run the SQL!** 🚀
