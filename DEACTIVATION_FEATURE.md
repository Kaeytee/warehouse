# 🔥 Spicy Feature: Warehouse Admin Deactivation Approval Workflow

## Overview
This feature restricts `warehouse_admin` users from directly deactivating users. Instead, they must provide a detailed justification which is sent to the support team for approval via email.

## Key Changes

### 1. Permission Updates ✅
**Files Modified:**
- `src/types/warehouse.ts`
- `src/app/auth/contexts/AuthContext.tsx`

**What Changed:**
- Added `user_management` permission to `warehouse_admin` role
- Set `staffManagement: true` for `warehouse_admin` in AuthContext
- This allows warehouse admins to access the `/users` route

### 2. New Modal Component 🎨
**File Created:** `src/components/modals/DeactivationReasonModal.tsx`

**Features:**
- Beautiful gradient design with orange/red theme
- Enforces minimum 20 characters for reason
- Maximum 500 characters with live counter
- Real-time validation feedback
- Loading states during submission
- Clear user information display
- Informative alert boxes explaining the workflow

**UX Elements:**
- Warning notice about approval requirement
- User details card showing who will be deactivated
- Character counter (green when valid, red when too short)
- Submit button disabled until valid reason provided
- Loading spinner during submission
- Clear error messages

### 3. Edge Function 📧
**File Created:** `supabase/functions/notify-support-user-deactivation/index.ts`

**Function Name:** `notify-support-user-deactivation`

**What It Does:**
1. Receives deactivation request from frontend
2. Fetches requesting admin details from database
3. Fetches target user details from database
4. Generates professional HTML email
5. Sends email to support team via Resend API

**Email Content:**
- 🚨 Alert banner with Vanguard Cargo branding
- 👤 Requesting administrator section (name, email, role, suite)
- 🎯 Target user section (name, email, role, suite)
- 📝 Deactivation reason in highlighted box
- ⏰ Timestamp of request (EST timezone)
- 📱 Mobile-responsive design

**Environment Variables Required:**
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@vanguardcargo.co
SUPPORT_EMAIL=support@vanguardcargo.co
```

### 4. Service Layer Update 🛠️
**File Modified:** `src/services/UserManagementService.ts`

**New Method Added:**
```typescript
static async notifySupportForDeactivation(
  adminId: string,
  targetUserId: string,
  reason: string
): Promise<{ success: boolean; message?: string; error?: string }>
```

**What It Does:**
- Calls the Supabase Edge Function
- Handles success/error responses
- Returns user-friendly messages

### 5. User Management Page Updates 🖥️
**File Modified:** `src/app/pages/UserManagement/UserManagement.tsx`

**Changes Made:**

#### State Management:
```typescript
// New modal state
const [deactivationModal, setDeactivationModal] = useState<{
  isOpen: boolean;
  targetUser: User | null;
}>({
  isOpen: false,
  targetUser: null
});
```

#### Updated handleStatusUpdate Function:
```typescript
const handleStatusUpdate = async (userId, newStatus) => {
  // Check if warehouse_admin is trying to deactivate
  const isWarehouseAdmin = currentUser?.role === 'warehouse_admin';
  const isDeactivating = newStatus === 'inactive' || newStatus === 'suspended';

  if (isWarehouseAdmin && isDeactivating) {
    // Show modal instead of direct action
    setDeactivationModal({ isOpen: true, targetUser });
    return;
  }

  // For admin/superadmin or activation, proceed directly
  // ... existing code
}
```

#### New Handler:
```typescript
const handleDeactivationRequest = async (reason: string) => {
  // Send notification to support
  const result = await UserManagementService.notifySupportForDeactivation(
    currentUser.id,
    deactivationModal.targetUser.id,
    reason
  );

  if (!result.success) {
    throw new Error(result.error);
  }

  // Show success message
  alert('✅ Request sent to support team successfully!');
}
```

#### Modal Integration:
```tsx
{/* Deactivation Reason Modal for warehouse_admin */}
{deactivationModal.isOpen && deactivationModal.targetUser && (
  <DeactivationReasonModal
    isOpen={deactivationModal.isOpen}
    onClose={() => setDeactivationModal({ isOpen: false, targetUser: null })}
    onSubmit={handleDeactivationRequest}
    userName={UserManagementService.formatUserName(deactivationModal.targetUser)}
    userEmail={deactivationModal.targetUser.email}
  />
)}
```

#### UI Enhancement:
- Updated deactivate button tooltip for warehouse_admin:
  - Shows: "Request deactivation (requires approval)"
  - For admin/superadmin: "Deactivate user"

## User Flow

### For warehouse_admin:
1. Navigate to `/users` page ✅ (now accessible)
2. Click deactivate button (red X icon)
3. Modal appears asking for reason
4. Enter minimum 20 characters explaining why
5. Submit request
6. Email sent to support team
7. Success message shown
8. Support team reviews and takes action manually

### For admin/superadmin:
1. Navigate to `/users` page
2. Click deactivate button
3. User immediately deactivated (no modal)
4. No email sent - direct action

### For support team:
1. Receive professional email notification
2. Email contains:
   - Who made the request (admin details)
   - Who needs to be deactivated (user details)
   - Detailed reason provided
   - Timestamp of request
3. Review request
4. Take appropriate action (approve/deny)
5. Optionally reply to admin via email

## Security Features

✅ **Input Validation:**
- Minimum 20 characters for reason
- Maximum 500 characters
- Trimmed whitespace
- Frontend and backend validation

✅ **Access Control:**
- Route guard checks `user_management` permission
- Button conditionally renders based on role
- Edge function validates all inputs

✅ **Email Security:**
- Support email hardcoded (no user input)
- Admin email verified from database
- No injection vulnerabilities
- CORS properly configured

✅ **Data Privacy:**
- Only necessary user info sent to support
- No sensitive data exposed in email
- Encrypted transmission (HTTPS)

## Deployment Steps

### 1. Deploy Edge Function

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref rsxxjcsmcrcxdmyuytzc

# Deploy function
supabase functions deploy notify-support-user-deactivation

# Set environment variables
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set FROM_EMAIL="Vanguard Cargo <noreply@vanguardcargo.co>"
supabase secrets set SUPPORT_EMAIL=support@vanguardcargo.co
```

### 2. Verify Resend API
- Ensure domain `vanguardcargo.co` is verified in Resend
- Confirm API key has send permissions
- Test email delivery

### 3. Test the Feature

**As warehouse_admin:**
1. Login as warehouse_admin user
2. Go to User Management page
3. Try to deactivate a user
4. Modal should appear
5. Enter reason and submit
6. Check support email inbox

**As admin/superadmin:**
1. Login as admin or superadmin
2. Go to User Management page
3. Deactivate a user
4. Should work immediately (no modal)

### 4. Monitor
- Check Supabase Edge Function logs
- Monitor Resend dashboard for email delivery
- Review support team feedback

## Files Changed Summary

### Created Files (4):
1. `supabase/functions/notify-support-user-deactivation/index.ts` - Edge function
2. `supabase/functions/notify-support-user-deactivation/README.md` - Function docs
3. `src/components/modals/DeactivationReasonModal.tsx` - Modal component
4. `DEACTIVATION_FEATURE.md` - This file

### Modified Files (4):
1. `src/types/warehouse.ts` - Added user_management to warehouse_admin
2. `src/app/auth/contexts/AuthContext.tsx` - Set staffManagement: true
3. `src/services/UserManagementService.ts` - Added notifySupportForDeactivation method
4. `src/app/pages/UserManagement/UserManagement.tsx` - Integrated modal and workflow

## Benefits

✅ **Accountability:** All deactivation requests from warehouse_admin are logged via email

✅ **Oversight:** Support team reviews every request before action

✅ **Documentation:** Email trail provides audit history

✅ **User Experience:** Clear, beautiful modal explains the process

✅ **Flexibility:** Admin/superadmin can still act immediately when needed

✅ **Security:** Prevents accidental or malicious deactivations

## Future Enhancements

- [ ] Store deactivation requests in database table
- [ ] Create admin dashboard to approve/deny requests
- [ ] Send confirmation email to requesting admin
- [ ] Add Slack/Teams integration
- [ ] Implement auto-approval after timeout
- [ ] Add request withdrawal capability
- [ ] Track request status (pending/approved/denied)

## Testing Checklist

- [ ] warehouse_admin can access /users route
- [ ] warehouse_admin sees modal when clicking deactivate
- [ ] Modal enforces minimum 20 characters
- [ ] Modal shows character counter
- [ ] Submit button disabled until valid reason
- [ ] Email sent to support successfully
- [ ] Email contains all required information
- [ ] Email formatting is correct
- [ ] Admin can activate users without modal
- [ ] Admin/superadmin can deactivate without modal
- [ ] Error handling works for failed submissions
- [ ] Loading states display correctly
- [ ] Modal closes on success
- [ ] Success message shown to user

---

**Implementation Status:** ✅ Complete

**Ready for:** Testing & Deployment

**Developer:** GitHub Copilot

**Date:** October 23, 2025
