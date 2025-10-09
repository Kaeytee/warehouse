/**
 * Supabase Connection Test Utility
 * 
 * Run this to diagnose connection issues
 */

import { supabase } from '../config/supabase';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...');
  
  // Test 1: Check auth session
  const { data: session, error: sessionError } = await supabase.auth.getSession();
  console.log('1. Auth Session:', session ? '✅ Active' : '❌ None', sessionError);
  
  // Test 2: Simple count query on users
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('count', { count: 'exact', head: true });
  console.log('2. Users Table Access:', usersError ? `❌ ${usersError.message}` : '✅ Success', usersData);
  
  // Test 3: Simple count query on packages
  const { data: packagesData, error: packagesError } = await supabase
    .from('packages')
    .select('count', { count: 'exact', head: true });
  console.log('3. Packages Table Access:', packagesError ? `❌ ${packagesError.message}` : '✅ Success', packagesData);
  
  // Test 4: Check RLS status
  console.log('4. Testing RLS status...');
  const { data: rlsTest, error: rlsError } = await supabase
    .from('users')
    .select('id')
    .limit(1);
  console.log('   RLS Test:', rlsError ? `❌ ${rlsError.message}` : `✅ Success (${rlsTest?.length} rows)`);
  
  // Test 5: Check auth headers
  const headers = await supabase.auth.getSession().then(({ data }) => ({
    hasToken: !!data.session?.access_token,
    tokenLength: data.session?.access_token?.length || 0
  }));
  console.log('5. Auth Headers:', headers);
  
  return {
    session: !!session,
    usersAccess: !usersError,
    packagesAccess: !packagesError,
    rlsWorking: !rlsError,
    authToken: headers.hasToken
  };
}
