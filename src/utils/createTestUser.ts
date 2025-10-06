
/**
 * Utility to create test warehouse user
 * Run this once to create your test user account
 */

import { supabase } from '../config/supabase';

export const createTestUser = async () => {
  try {
    // Step 1: Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'austinbediako4@gmail.com',
      password: 'warehouse123!', // Use a strong password
      options: {
        data: {
          first_name: 'Austin',
          last_name: 'Bediako',
          role: 'warehouse_admin'
        }
      }
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      console.error('No user data returned from signup');
      return { success: false, error: 'No user data returned' };
    }

    console.log('User created successfully:', authData.user.email);
    
    // Step 2: The trigger function should automatically create the user profile
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Update the user role to warehouse_admin
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
      console.error('Error updating user profile:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('User profile updated successfully');
    
    return { 
      success: true, 
      message: 'Test user created successfully',
      user: authData.user 
    };

  } catch (error) {
    console.error('Error creating test user:', error);
    return { success: false, error: 'Failed to create test user' };
  }
};

// Uncomment and run this in browser console to create the user
// createTestUser().then(result => console.log('Result:', result));
