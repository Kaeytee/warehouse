#!/bin/bash

# 🚀 Quick Deployment Script for Deactivation Feature
# This script deploys the edge function and sets up environment variables

echo "🔥 Deploying Warehouse Admin Deactivation Approval Feature"
echo "=========================================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

echo "✅ Supabase CLI found"
echo ""

# Login to Supabase
echo "📝 Logging in to Supabase..."
supabase login

# Link to project
echo ""
echo "🔗 Linking to Vanguard Cargo project..."
supabase link --project-ref rsxxjcsmcrcxdmyuytzc

# Deploy edge function
echo ""
echo "📦 Deploying edge function: notify-support-user-deactivation..."
supabase functions deploy notify-support-user-deactivation

# Set environment variables
echo ""
echo "🔐 Setting up environment variables..."
echo "Please provide the following values:"
echo ""

# Get Resend API Key
read -p "Enter your Resend API Key (re_xxxxx): " RESEND_KEY
supabase secrets set RESEND_API_KEY="$RESEND_KEY"

# Set other variables
supabase secrets set FROM_EMAIL="Vanguard Cargo <noreply@vanguardcargo.co>"
supabase secrets set SUPPORT_EMAIL="support@vanguardcargo.co"

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Test the feature as warehouse_admin user"
echo "2. Try to deactivate a user - modal should appear"
echo "3. Check support email inbox for notification"
echo "4. Monitor function logs in Supabase dashboard"
echo ""
echo "📚 For detailed documentation, see:"
echo "   - DEACTIVATION_FEATURE.md"
echo "   - supabase/functions/notify-support-user-deactivation/README.md"
echo ""
echo "🎉 Happy testing!"
