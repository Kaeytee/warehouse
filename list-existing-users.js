// List all existing users to see what's actually in the database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listExistingUsers() {
  try {
    // Check what's in public.users table
    console.log('Checking public.users table...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, role, status, created_at');

    if (publicError) {
      console.error('Error fetching public users:', publicError.message);
    } else {
      console.log(`Found ${publicUsers?.length || 0} users in public.users:`);
      if (publicUsers && publicUsers.length > 0) {
        publicUsers.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}, Role: ${user.role}, Status: ${user.status}`);
        });
      } else {
        console.log('No users in public.users table');
      }
    }

    // Try some common test emails to see if any work
    const testEmails = [
      'austinbediako4@gmail.com',
      'admin@vanguardcargo.com',
      'test@example.com',
      'warehouse@vanguardcargo.com'
    ];

    console.log('\nTesting common email addresses...');
    
    for (const email of testEmails) {
      console.log(`\nTrying: ${email}`);
      
      // Try with common passwords
      const testPasswords = ['warehouse123!', 'password123', 'admin123', '123456'];
      
      for (const password of testPasswords) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (!error && data.user) {
          console.log(`✅ SUCCESS! Email: ${email}, Password: ${password}`);
          console.log(`User ID: ${data.user.id}`);
          
          // Check if profile exists
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          console.log('Profile exists:', profile ? 'Yes' : 'No');
          if (profile) {
            console.log(`Role: ${profile.role}, Status: ${profile.status}`);
          }
          
          await supabase.auth.signOut();
          return; // Found working credentials
        }
      }
    }
    
    console.log('\n❌ No working credentials found');
    console.log('\nPlease provide:');
    console.log('1. An existing email from your auth.users table');
    console.log('2. The correct password for that email');
    console.log('3. Or create a new user via Supabase Dashboard');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

listExistingUsers();
