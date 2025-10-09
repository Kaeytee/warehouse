# 📧 Automatic Email System - Quick Setup Guide

## What This Does
Database **automatically** sends emails via your Edge Function `send-notification-email` when:
- ✅ **Package status changes** (received → processing → shipped → in_transit → arrived → delivered)
- ✅ **Shipment status changes** (pending → processing → shipped → in_transit → arrived)

**NO FRONTEND CODE NEEDED!** Everything happens in Supabase.

---

## 🚀 3-Minute Setup

### Step 1: Get Your Credentials

From Supabase Dashboard > Settings > API:

1. **Project URL**: Copy the URL (e.g., `https://abcdefg.supabase.co`)
   - Extract just the reference: `abcdefg`

2. **Anon Key**: Copy the `anon public` key
   - Starts with `eyJ...`

### Step 2: Update SQL File

Open `/sql/86_auto_email_on_delivery.sql`:

**Find Line 98** and replace:
```sql
edge_function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-email';
```
Replace `YOUR_PROJECT_REF` with your actual reference.

**Find Line 99** and replace:
```sql
supabase_anon_key := 'YOUR_ANON_KEY';
```
Replace `YOUR_ANON_KEY` with your actual anon key.

**Find Line 224-225** and do the same replacements.

### Step 3: Run SQL File

Execute the updated file in Supabase SQL Editor:
```
sql/86_auto_email_on_delivery.sql
```

### Step 4: Test It!

Update a package status:
```sql
UPDATE packages 
SET status = 'arrived' 
WHERE package_id = 'PKG251008UWNNWQ';
```

Check:
- PostgreSQL logs: "✅ Email notification queued..."
- Edge Function logs: Should show POST request
- Customer's email: Should receive email

---

## 📦 What Your Edge Function Receives

### Package Status Change:
```json
{
  "to": "customer@example.com",
  "userName": "John Doe",
  "notificationTitle": "Package Arrived",
  "notificationMessage": "Great news! Your package PKG251008... has arrived at the warehouse and is ready for pickup. Check your delivery code in the app.",
  "notificationIcon": "✅",
  "notificationType": "package_update",
  "trackingNumber": "VC251008NKZQSAYQ",
  "packageId": "PKG251008UWNNWQ",
  "suiteNumber": "A123",
  "status": "arrived",
  "logToDatabase": false
}
```

### Shipment Status Change:
```json
{
  "to": "customer@example.com",
  "userName": "John Doe",
  "notificationTitle": "Shipment In Transit",
  "notificationMessage": "Your shipment VC251008... is currently in transit to the destination.",
  "notificationIcon": "🚚",
  "notificationType": "shipment_update",
  "trackingNumber": "VC251008SHIPMENT",
  "suiteNumber": "A123",
  "status": "in_transit",
  "logToDatabase": false
}
```

**Perfect match for your Edge Function's expected fields!** ✅

---

## 🎯 Status Messages

### Package Statuses:
- **📦 received**: "Package received at warehouse and being processed"
- **⚙️ processing**: "Package currently being processed"
- **🚚 shipped**: "Package has been shipped and is on its way"
- **🛫 in_transit**: "Package currently in transit to destination warehouse"
- **✅ arrived**: "Package arrived! Ready for pickup with delivery code"
- **🎉 delivered**: "Package successfully delivered!"

### Shipment Statuses:
- **📝 pending**: "Shipment created and pending processing"
- **⚙️ processing**: "Shipment being processed at facility"
- **📦 shipped**: "Shipment dispatched and on its way"
- **🚚 in_transit**: "Shipment in transit to destination"
- **✅ arrived**: "Shipment arrived! Check delivery codes"

---

## 🔍 How It Works

```
┌─────────────────────────────────────┐
│  Admin updates package/shipment     │
│  status in Supabase Dashboard       │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Database Trigger Fires             │
│  (trigger_send_delivery_email)      │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Function fetches user email        │
│  and builds status-specific message │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  HTTP POST to Edge Function         │
│  via pg_net extension               │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Edge Function receives payload     │
│  and sends email via Resend         │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  Customer receives email ✅         │
└─────────────────────────────────────┘
```

---

## ✅ Verification Commands

### Check triggers are active:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%email%';
```

Should show:
- `trigger_send_delivery_email` on `packages` ✅
- `trigger_send_shipment_status_email` on `shipments` ✅

### Check pg_net extension:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

Should return 1 row ✅

### Test package email:
```sql
UPDATE packages SET status = 'delivered' 
WHERE id = (SELECT id FROM packages LIMIT 1);
```

### Test shipment email:
```sql
UPDATE shipments SET status = 'in_transit' 
WHERE id = (SELECT id FROM shipments LIMIT 1);
```

---

## 🐛 Troubleshooting

**No email sent?**

1. Check PostgreSQL logs for "✅ Email notification queued..."
2. Verify Edge Function logs in Supabase Dashboard
3. Confirm `pg_net` extension is enabled
4. Test Edge Function directly with curl
5. Verify PROJECT_REF and ANON_KEY are correct

**Email sent but not received?**

1. Check Edge Function logs for errors
2. Verify Resend API key in Edge Function
3. Check spam folder
4. Verify user has valid email in database

---

## 🎉 Done!

Your system now automatically emails customers on **EVERY status change**.

**No frontend code. No manual triggers. Completely automatic.** 🚀
