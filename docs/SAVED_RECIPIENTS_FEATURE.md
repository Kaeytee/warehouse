# Saved Recipients Feature

## Overview

The Saved Recipients feature allows warehouse staff to save recipient details for future use, eliminating the need to manually enter the same information repeatedly when creating shipments. This feature significantly improves workflow efficiency for frequent shipments to the same recipients.

---

## Features

### Core Functionality
- ✅ **Save Recipient Details** - Store complete recipient information with a friendly nickname
- ✅ **Quick Selection** - Select saved recipients from a dropdown menu
- ✅ **Auto-Fill Form** - Automatically populate all recipient fields when selecting a saved recipient
- ✅ **Default Recipients** - Mark frequently used recipients as default
- ✅ **Usage Tracking** - Track how many times each recipient has been used
- ✅ **Easy Management** - Delete saved recipients with one click

### Saved Information
Each saved recipient includes:
- Nickname (e.g., "Mom's House", "Office NYC", "John - Ghana")
- Recipient Name
- Recipient Phone Number (international format)
- Delivery Address
- Delivery City
- Delivery Country
- Preferred Service Type (standard, express, overnight)

---

## How to Use

### Saving a Recipient

1. **Navigate to Create Shipment page**
   - Go to Dashboard → Create Shipment

2. **Fill in recipient details**
   - Enter all recipient information in the form
   - Include name, phone, address, city, and country

3. **Enable the "Save for future use" toggle**
   - Located at the bottom of the form, just above the Submit button
   - Toggle switch appears in a green section

4. **Optional: Enter a nickname**
   - Leave blank for auto-generated nickname (e.g., "John Smith - New York")
   - Or enter a custom nickname (e.g., "Mom", "Office", "John NYC")

5. **Optional: Set as default**
   - Check "Set as default recipient" checkbox
   - Only one recipient can be marked as default

6. **Submit the shipment**
   - Click "Create Shipment" button
   - Recipient will be automatically saved after successful shipment creation

### Using a Saved Recipient

1. **Navigate to Create Shipment page**

2. **Open the Saved Recipients dropdown**
   - Located at the top of the Shipment Details section

3. **Select a recipient**
   - All saved recipients appear in the dropdown
   - Default recipient is marked with ⭐
   - Usage count shows how many times each was used
   - Format: `[Nickname] - [Name] ([City], [Country]) • Used [X]x`

4. **Form auto-fills**
   - All recipient fields are automatically populated
   - You can still edit any field if needed

5. **Continue with shipment**
   - Select packages and complete the shipment as normal

### Deleting a Saved Recipient

1. **Select the recipient** from the dropdown

2. **Click the trash icon** (🗑️) next to the dropdown

3. **Confirm deletion** when prompted

4. The recipient is permanently removed

---

## Technical Implementation

### Database Schema

**Table: `saved_recipients`**
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- nickname (TEXT, NOT NULL)
- recipient_name (TEXT, NOT NULL)
- recipient_phone (TEXT)
- delivery_address (TEXT, NOT NULL)
- delivery_city (TEXT, NOT NULL)
- delivery_country (TEXT, NOT NULL)
- service_type (TEXT, DEFAULT 'standard')
- is_default (BOOLEAN, DEFAULT FALSE)
- usage_count (INTEGER, DEFAULT 0)
- last_used_at (TIMESTAMP WITH TIME ZONE)
- created_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- updated_at (TIMESTAMP WITH TIME ZONE, DEFAULT NOW())
- UNIQUE(user_id, nickname)
```

### SQL Functions

**1. `get_saved_recipients(p_user_id UUID)`**
- Retrieves all saved recipients for a user
- Ordered by: default first, most used, most recent
- Returns complete recipient information

**2. `save_recipient(...)`**
- Saves a new recipient to the database
- Validates required fields
- Ensures only one default per user
- Prevents duplicate nicknames per user

**3. `update_saved_recipient(...)`**
- Updates an existing saved recipient
- Verifies ownership before updating
- Manages default recipient status

**4. `delete_saved_recipient(p_recipient_id UUID, p_user_id UUID)`**
- Deletes a saved recipient
- Verifies ownership before deletion

**5. `mark_recipient_used(p_recipient_id UUID, p_user_id UUID)`**
- Increments usage count when recipient is used
- Updates last_used_at timestamp
- Called automatically during shipment creation

### Security

**Row Level Security (RLS) Policies:**
- Users can only view their own saved recipients
- Users can only create/update/delete their own recipients
- Warehouse admins can view all recipients (for support)
- Complete isolation between users

### Frontend Integration

**Component: `CreateShipment.tsx`**
- Added saved recipients dropdown above recipient form
- "Save Current" button to save current form data
- Modal dialog for entering nickname
- Auto-fill functionality when selecting recipient
- Delete button for quick removal
- Usage tracking integration

---

## Benefits

### For Warehouse Staff
- ⚡ **Faster Shipment Creation** - No need to retype common recipient details
- 🎯 **Reduced Errors** - Pre-saved information ensures accuracy
- 💪 **Improved Productivity** - Focus on package selection rather than data entry
- 📊 **Usage Insights** - See which recipients are used most frequently

### For Operations
- 🚀 **Increased Efficiency** - Process more shipments in less time
- ✅ **Quality Control** - Consistent recipient information
- 📈 **Better Tracking** - Monitor frequently used recipients
- 🔄 **Workflow Optimization** - Streamlined repetitive tasks

---

## Usage Examples

### Example 1: Regular Customer Shipments
**Scenario:** Shipping packages to a customer in Ghana monthly

1. **First Time:**
   - Enter customer details manually
   - Enable "Save for future use" toggle
   - Optionally enter nickname: "John - Accra"
   - Submit shipment (recipient auto-saves)

2. **Subsequent Times:**
   - Select "John - Accra" from dropdown
   - All fields auto-fill
   - Continue with package selection

**Time Saved:** ~2-3 minutes per shipment

### Example 2: Office Deliveries
**Scenario:** Frequent shipments to company office

1. **Setup:**
   - Enter office details
   - Enable toggle, enter nickname: "Head Office"
   - Check "Set as default"
   - Submit shipment

2. **Usage:**
   - Office details auto-selected by default
   - Quick package selection and shipment creation

**Time Saved:** ~5 minutes per day for frequent office shipments

### Example 3: Multiple Locations for Same Person
**Scenario:** Customer receives shipments at home and work

1. **Save Both Addresses:**
   - First shipment: Enable toggle, nickname "Customer Name - Home"
   - Second shipment: Enable toggle, nickname "Customer Name - Office"

2. **Easy Selection:**
   - Choose appropriate location from dropdown
   - System tracks usage of each location

---

## Best Practices

### Naming Recipients
✅ **Good Examples:**
- "Mom - NYC"
- "Office HQ"
- "John Smith - Ghana"
- "Warehouse B"

❌ **Avoid:**
- Vague names like "Address 1"
- Only first names without context
- Too long nicknames

### Managing Recipients
- 🗑️ **Delete unused recipients** - Keep the list clean and relevant
- ⭐ **Set default wisely** - Choose your most frequent recipient
- ✏️ **Update information** - Keep addresses current (use delete + save new for now)
- 📊 **Monitor usage** - Review which recipients are used most

### Data Entry
- ✅ **Verify information** before saving
- ✅ **Include complete phone numbers** with country code
- ✅ **Use full addresses** with all necessary details
- ✅ **Double-check city and country** for international shipments

---

## Troubleshooting

### Issue: Can't save recipient
**Solution:** Ensure all required fields are filled:
- Recipient Name
- Delivery Address
- Delivery City
- Delivery Country

### Issue: Duplicate nickname error
**Solution:** Each nickname must be unique. Choose a different name or delete the existing one first.

### Issue: Recipient doesn't appear in dropdown
**Solution:** 
- Refresh the page
- Verify you're logged in
- Check that the recipient was successfully saved

### Issue: Can't delete recipient
**Solution:**
- Ensure you own the recipient
- Check your internet connection
- Try refreshing the page

---

## Migration Instructions

### For Database Administrators

**Run the migration script:**
```bash
# Execute the SQL migration
psql -d your_database -f sql/87_saved_recipients_feature.sql
```

**Verify installation:**
```sql
-- Check table exists
SELECT * FROM saved_recipients LIMIT 1;

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%recipient%';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'saved_recipients';
```

### For Frontend Deployment

**No additional steps required:**
- Feature is already integrated in `CreateShipment.tsx`
- No environment variables needed
- No additional packages required

---

## Future Enhancements

### Planned Features
- 📝 **Edit Recipients** - Update existing recipients without deleting
- 📤 **Export/Import** - Share recipient lists between users
- 🏷️ **Tags/Categories** - Organize recipients by type or region
- 🔍 **Search** - Find recipients quickly in large lists
- 📊 **Analytics** - View most-used recipients and patterns
- 👥 **Shared Recipients** - Team-wide recipient lists for common customers

### Under Consideration
- Auto-suggest recipients based on patterns
- Recipient verification with address validation APIs
- Integration with customer database
- Bulk recipient import from CSV

---

## Support

### For Questions or Issues
- **Technical Issues:** Check troubleshooting section above
- **Feature Requests:** Document and submit to development team
- **Bug Reports:** Include steps to reproduce and screenshots

### Documentation
- **SQL Migration:** `/sql/87_saved_recipients_feature.sql`
- **Frontend Component:** `/src/app/pages/CreateShipment/CreateShipment.tsx`
- **Main Documentation:** `/README.md`
- **User Guide:** `/USER_GUIDE.md`

---

## Version History

**Version 1.0.0** - October 17, 2025
- Initial release
- Core save/load/delete functionality
- Usage tracking
- Default recipient support
- Full RLS security implementation

---

**Feature Status:** ✅ Production Ready

**Last Updated:** October 17, 2025
