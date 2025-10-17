# How to Clear All Shipment Data

## ⚠️ WARNING
**This will DELETE all shipment data permanently!**

Only use this if you want to start fresh while keeping your user accounts.

---

## What Gets Deleted
- ❌ All shipments
- ❌ All packages  
- ❌ All saved recipients
- ❌ All receipts and waybills
- ❌ All notifications
- ❌ All verification logs

## What Gets Kept
- ✅ Users and authentication
- ✅ Roles and permissions
- ✅ System configuration

---

## How to Run

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com
2. Select your VanguardCargo project
3. Click **SQL Editor** → **New Query**

### Step 2: Copy and Run
1. Open file: `sql/CLEAR_ALL_DATA.sql`
2. Copy **entire contents** (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor
4. Click **Run** (or Ctrl+Enter)

### Step 3: Verify
The script will output:
```
✅ SUCCESS: All shipment data cleared!
✅ Authentication data preserved!

Current Database State:
  👥 Users: 5 (KEPT)
  📦 Packages: 0 (should be 0)
  🚚 Shipments: 0 (should be 0)
  📝 Saved Recipients: 0 (should be 0)
```

---

## After Running

You can now:
- ✅ Login with existing user accounts
- ✅ Create new shipments from scratch
- ✅ Start with clean data
- ✅ All functionality works normally

---

## If You Need to Keep Some Data

Edit the `CLEAR_ALL_DATA.sql` file and comment out sections you want to keep:

```sql
-- Keep notifications
-- DELETE FROM notifications;

-- Keep saved recipients
-- DELETE FROM saved_recipients;
```

---

## Quick Reference

**File:** `sql/CLEAR_ALL_DATA.sql`  
**Safe to run:** Yes (only deletes shipment data)  
**Reversible:** No (data is permanently deleted)  
**Backup needed:** Only if you want to restore data later

---

**Last Updated:** 2025-10-17  
**Version:** 1.0.0
