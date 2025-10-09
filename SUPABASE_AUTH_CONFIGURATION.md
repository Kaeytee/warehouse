# Supabase Authentication Configuration

## Required Auth Settings for Production

### 1. Leaked Password Protection ✅

**Location:** Authentication → Policies → Password Protection

**Setting:** Enable leaked password protection
- ✅ Check passwords against HaveIBeenPwned.org database
- ✅ Prevent use of compromised passwords
- ✅ Force users to choose secure passwords

**Steps:**
1. Go to Supabase Dashboard
2. Navigate to Authentication → Policies
3. Find "Password Protection" section
4. Enable "Check for leaked passwords"
5. Save changes

### 2. Password Requirements

**Recommended Settings:**
- Minimum password length: 8 characters
- Require at least one uppercase letter
- Require at least one lowercase letter
- Require at least one number
- Require at least one special character

### 3. Session Settings

**Recommended:**
- Session timeout: 24 hours
- Refresh token rotation: Enabled
- Require email confirmation: Enabled

### 4. Email Templates

Customize email templates for:
- Email confirmation
- Password reset
- Magic link login
- Email change confirmation

### 5. Security Features

**Enable:**
- ✅ Leaked password protection
- ✅ Email confirmation required
- ✅ Multi-factor authentication (MFA) option
- ✅ Rate limiting on authentication endpoints

## Configuration Checklist

- [ ] Leaked password protection enabled
- [ ] Minimum password length set (8+ characters)
- [ ] Email confirmation required
- [ ] Custom email templates configured
- [ ] Session timeout configured
- [ ] Refresh token rotation enabled
- [ ] Rate limiting configured
- [ ] Production SMTP configured
- [ ] OAuth providers configured (if needed)
- [ ] Custom auth domains configured (if needed)

## Notes

All these settings should be configured in the Supabase Dashboard under:
- **Authentication** → Policies
- **Authentication** → Email Templates
- **Authentication** → Providers
- **Project Settings** → Auth

**Important:** These are UI-based settings and cannot be configured via SQL.
