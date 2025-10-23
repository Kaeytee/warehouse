# Deactivation Request Edge Function

## Overview
This Supabase Edge Function handles user deactivation requests from warehouse administrators. When a `warehouse_admin` attempts to deactivate a user, instead of performing the action directly, the system sends a detailed notification email to the support team for approval.

## Function Details

**Function Name:** `notify-support-user-deactivation`

**Purpose:** Send support notification when warehouse_admin requests user deactivation

**Trigger:** Called from frontend via `UserManagementService.notifySupportForDeactivation()`

## Environment Variables Required

Add these to your Supabase project settings:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx          # Your Resend API key
FROM_EMAIL=noreply@vanguardcargo.co      # Sender email address
SUPPORT_EMAIL=support@vanguardcargo.co   # Support team email
SUPABASE_URL=https://xxx.supabase.co     # Auto-provided
SUPABASE_SERVICE_ROLE_KEY=xxx            # Auto-provided
```

## Deployment

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref rsxxjcsmcrcxdmyuytzc
```

4. Deploy the function:
```bash
supabase functions deploy notify-support-user-deactivation
```

5. Set environment variables:
```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set FROM_EMAIL="Vanguard Cargo <noreply@vanguardcargo.co>"
supabase secrets set SUPPORT_EMAIL=support@vanguardcargo.co
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click **New Function**
4. Name it `notify-support-user-deactivation`
5. Copy the contents of `index.ts` into the function editor
6. Click **Deploy**
7. Go to **Settings** → **Edge Functions** → **Secrets**
8. Add the required environment variables

## Function Flow

1. **Frontend triggers** the function when warehouse_admin clicks deactivate
2. **Modal appears** asking for deactivation reason (minimum 20 characters)
3. **Function receives:**
   - `adminId` - ID of the warehouse_admin making the request
   - `targetUserId` - ID of the user to be deactivated
   - `reason` - Detailed justification for deactivation

4. **Function fetches:**
   - Admin user details (name, email, role, suite)
   - Target user details (name, email, role, suite)

5. **Email sent to support** containing:
   - Requesting administrator information
   - Target user information
   - Deactivation reason
   - Timestamp of request

6. **Support team** reviews and approves/denies the request manually

## Email Template Features

- Professional HTML email with Vanguard Cargo branding
- Clear sections for admin details, target user, and reason
- Mobile-responsive design
- Automated timestamp in EST timezone
- Reply-to set to admin's email for quick follow-up

## Testing

### Test the function locally:

```bash
supabase functions serve notify-support-user-deactivation --env-file .env.local
```

### Send a test request:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/notify-support-user-deactivation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "adminId": "test-admin-uuid",
    "targetUserId": "test-user-uuid",
    "reason": "Test reason for deactivation request"
  }'
```

## Security Considerations

- ✅ Function uses service role key to bypass RLS for reading user data
- ✅ CORS headers configured for frontend access
- ✅ Input validation for required fields
- ✅ Error handling with proper status codes
- ✅ Email only sent to configured support address (no user input for recipient)

## Integration Points

### Frontend Service
`src/services/UserManagementService.ts`
```typescript
static async notifySupportForDeactivation(
  adminId: string,
  targetUserId: string,
  reason: string
)
```

### UI Component
`src/components/modals/DeactivationReasonModal.tsx`
- Collects deactivation reason
- Validates minimum 20 characters
- Shows submission status

### Page Integration
`src/app/pages/UserManagement/UserManagement.tsx`
- Detects warehouse_admin role
- Shows modal on deactivate click
- Handles form submission

## Troubleshooting

### Function not found error
- Ensure function is deployed: `supabase functions deploy`
- Check function name matches exactly

### Email not sending
- Verify RESEND_API_KEY is set correctly
- Check Resend dashboard for API errors
- Ensure FROM_EMAIL domain is verified in Resend

### CORS errors
- CORS headers are already configured
- If issues persist, check browser console for specific error

### User data not fetched
- Verify SUPABASE_SERVICE_ROLE_KEY is set
- Check user IDs are valid UUIDs
- Review Supabase logs for RLS issues

## Monitoring

View function logs in Supabase Dashboard:
1. Go to **Edge Functions**
2. Select `notify-support-user-deactivation`
3. Click **Logs** tab
4. Filter by error level or time range

## Future Enhancements

- [ ] Add request tracking table to store all deactivation requests
- [ ] Create admin dashboard to approve/deny requests
- [ ] Send confirmation email to requesting admin
- [ ] Add Slack/Teams integration for instant notifications
- [ ] Implement automatic approval after X days if no action taken
