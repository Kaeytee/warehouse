# Vanguard Cargo WMS - Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables](#environment-variables)
3. [Database Types Generation](#database-types-generation)
4. [Build and Deployment](#build-and-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ Required Files
- [x] `.env` file with Supabase credentials
- [x] `src/types/database.types.ts` (generic types included)
- [x] All npm dependencies installed
- [x] Build script configured in `package.json`

### ✅ Environment Setup
- [ ] Node.js 18+ installed
- [ ] pnpm package manager installed
- [ ] Supabase project created
- [ ] Database schema deployed to Supabase

---

## Environment Variables

### Required Variables
Create a `.env` file in the project root with the following:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Optional Configuration
VITE_APP_ENV=production
VITE_LOG_LEVEL=info
```

### Getting Supabase Credentials
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy **Project URL** → `VITE_SUPABASE_URL`
5. Copy **anon/public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Database Types Generation

### Option 1: Generate Actual Types (Recommended)

**Install Supabase CLI:**
```bash
npm install -g supabase
```

**Login to Supabase:**
```bash
supabase login
```

**Generate Types:**
```bash
# Replace YOUR_PROJECT_ID with your actual Supabase project ID
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

**Find Your Project ID:**
- Go to Supabase Dashboard → Settings → General
- Copy the **Reference ID**

### Option 2: Use Generic Types (Current Setup)

The project currently uses generic database types that allow all operations. This is suitable for:
- ✅ Quick deployments
- ✅ Rapid prototyping
- ✅ When database schema is frequently changing

**Trade-offs:**
- ❌ No compile-time type checking for database queries
- ❌ No autocompletion for table/column names
- ❌ Potential runtime errors if schema changes

### Updating to Actual Types

1. **Generate types** (see Option 1 above)
2. **Rebuild the project:**
   ```bash
   pnpm run build
   ```
3. **Commit the changes:**
   ```bash
   git add src/types/database.types.ts
   git commit -m "chore: update database types"
   git push
   ```

---

## Build and Deployment

### Local Build

**Install Dependencies:**
```bash
pnpm install
```

**Build for Production:**
```bash
pnpm run build
```

**Preview Production Build:**
```bash
pnpm run preview
```

### Vercel Deployment

#### Initial Setup

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link Project:**
   ```bash
   vercel link
   ```

4. **Set Environment Variables:**
   ```bash
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
   ```

#### Deploy

**Deploy to Production:**
```bash
vercel --prod
```

**Deploy to Preview:**
```bash
vercel
```

#### Automatic Deployment

Vercel automatically deploys when you push to GitHub:
- **main branch** → Production deployment
- **other branches** → Preview deployment

### Other Platforms

#### Netlify

1. Connect repository to Netlify
2. Set build command: `pnpm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

#### Railway

1. Connect GitHub repository
2. Add environment variables
3. Railway auto-detects build settings
4. Deploy automatically on push

---

## Troubleshooting

### Build Errors

#### Error: "Property 'X' does not exist on type 'never'"

**Cause:** Database types not properly generated

**Fix:**
1. Regenerate database types:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
   ```
2. Rebuild:
   ```bash
   pnpm run build
   ```

**Temporary Fix:**
The generic database types in `src/types/database.types.ts` should allow the build to pass.

#### Error: "Missing Supabase environment variables"

**Cause:** Environment variables not set

**Fix:**
1. Verify `.env` file exists
2. Check variable names match exactly:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Restart dev server after adding variables

#### Error: "Command failed with exit code 2"

**Cause:** TypeScript compilation errors

**Fix:**
1. Check error messages in build output
2. Ensure all imports are correct
3. Verify database types are properly configured
4. Run type checking:
   ```bash
   pnpm run type-check
   ```

### Runtime Errors

#### Error: "Auth: No such host is known"

**Cause:** Incorrect Supabase URL

**Fix:**
1. Verify `VITE_SUPABASE_URL` in `.env`
2. Ensure URL format: `https://your-project-id.supabase.co`
3. No trailing slash

#### Error: "Invalid API key"

**Cause:** Wrong or expired Supabase anon key

**Fix:**
1. Get fresh anon key from Supabase dashboard
2. Update `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`
3. Restart application

#### Error: "PGRST116: The result contains 0 rows"

**Cause:** Database query returned no results

**Fix:**
1. Check if data exists in database
2. Verify database permissions (RLS policies)
3. Check query filters

---

## Database Schema Deployment

### Initial Setup

1. **Connect to Supabase:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

2. **Run Migrations:**
   ```bash
   # If you have migration files
   supabase db push
   ```

3. **Verify Schema:**
   - Go to Supabase Dashboard → Table Editor
   - Verify all tables exist
   - Check RLS policies are enabled

### Required Tables

Ensure these tables exist in your database:
- `users` / `user_profiles`
- `packages`
- `shipments`
- `package_shipments`
- `warehouses`
- `notifications`
- `package_status_history`
- `package_receipts`

### Row Level Security (RLS)

⚠️ **Important:** RLS must be configured for production use

**Enable RLS on all tables:**
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

**Create policies based on user roles**

---

## Performance Optimization

### Build Optimization

**Vite Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['lucide-react', 'recharts']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

### Deployment Optimization

1. **Enable compression** (Vercel/Netlify do this automatically)
2. **Use CDN** for static assets
3. **Enable caching** headers
4. **Minify assets** (enabled by default in production build)

---

## Monitoring and Logging

### Production Logging

**Environment Configuration:**
```env
VITE_APP_ENV=production
VITE_LOG_LEVEL=error  # Only log errors in production
```

### Vercel Analytics

Enable in `vercel.json`:
```json
{
  "framework": "vite",
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "analytics": true
}
```

### Supabase Monitoring

1. Go to Supabase Dashboard → **Logs**
2. Monitor:
   - API requests
   - Database queries
   - Authentication events
   - Realtime connections

---

## Security Checklist

### Pre-Production Security

- [ ] Environment variables not committed to Git
- [ ] RLS policies enabled on all tables
- [ ] API keys are using anon key (not service role key)
- [ ] HTTPS enabled (automatic on Vercel/Netlify)
- [ ] CORS configured properly
- [ ] Authentication required for all protected routes
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS protection enabled
- [ ] Content Security Policy configured

### Post-Deployment Verification

1. **Test Authentication:**
   - [ ] Login works correctly
   - [ ] Logout clears session
   - [ ] Protected routes require authentication
   - [ ] Unauthorized access redirects to login

2. **Test Database Access:**
   - [ ] Users can only see their own data
   - [ ] Admin users have proper permissions
   - [ ] RLS policies are enforced

3. **Test Application Features:**
   - [ ] Package intake works
   - [ ] Shipment creation works
   - [ ] Analytics display correctly
   - [ ] User management works (for admins)

---

## Rollback Strategy

### Vercel Rollback

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments**
4. Find previous working deployment
5. Click **...** → **Promote to Production**

### Database Rollback

```bash
# Revert last migration
supabase db reset

# Or restore from backup
# Go to Supabase Dashboard → Database → Backups
```

---

## Support and Resources

### Documentation
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Getting Help
- Check USER_MANUAL.md for application features
- Review error logs in deployment platform
- Check Supabase logs for database issues
- Verify environment variables are set correctly

---

## Quick Reference Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm run dev

# Type checking
pnpm run type-check

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Generate database types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts

# Deploy to Vercel
vercel --prod

# View deployment logs
vercel logs
```

---

**Last Updated:** 2025-10-11
**Version:** 1.0.0
