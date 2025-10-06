// Simple Node.js script to create test user
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  try {
    console.log('Creating user with email: austinbediako4@gmail.com');
    
    // Step 1: Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'austinbediako4@gmail.com',
      password: 'warehouse123!',
      options: {
        data: {
          first_name: 'Austin',
          last_name: 'Bediako'
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError.message);
      return;
    }

    console.log('User created in auth system:', authData.user?.email);
    
    // Step 2: Wait for trigger to create profile
    console.log('Waiting for user profile creation...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Update user profile with warehouse role
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        role: 'warehouse_admin',
        status: 'active',
        first_name: 'Austin',
        last_name: 'Bediako'
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating user profile:', updateError.message);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('Email: austinbediako4@gmail.com');
    console.log('Password: warehouse123!');
    console.log('Role: warehouse_admin');
    
  } catch (error) {
    console.error('Error creating test user:', error.message);
  }
}

createTestUser();
