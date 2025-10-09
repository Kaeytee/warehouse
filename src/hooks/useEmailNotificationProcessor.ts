/**
 * Email Notification Processor Hook
 * 
 * Background service that processes pending email notifications
 * Checks the email queue periodically and sends emails
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @date 2025-10-08
 */

import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { sendEmailNotification } from '../services/emailNotificationService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Queued email notification data from database
 */
interface QueuedEmail {
  id: string;
  notification_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  title: string;
  message: string;
  notification_type: 'package_update' | 'shipment_update' | 'system' | 'promotion';
  action_url?: string;
  attempts: number;
}

/**
 * Email processor statistics
 */
interface ProcessorStats {
  processed: number;
  sent: number;
  failed: number;
  lastRun: Date | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Configuration for email processor
 */
const PROCESSOR_CONFIG = {
  // Check queue every 30 seconds
  intervalMs: 30000,
  
  // Process up to 10 emails per batch
  batchSize: 10,
  
  // Enable/disable processor
  enabled: true
};

// ============================================================================
// EMAIL PROCESSOR HOOK
// ============================================================================

/**
 * Hook to process email notification queue in background
 * 
 * Usage: Call this hook in your main App component to enable background processing
 * Example: useEmailNotificationProcessor();
 * 
 * @param enabled - Whether the processor should run (default: true)
 * @param intervalMs - Interval in milliseconds to check queue (default: 30000)
 */
export const useEmailNotificationProcessor = (
  enabled: boolean = PROCESSOR_CONFIG.enabled,
  intervalMs: number = PROCESSOR_CONFIG.intervalMs
) => {
  // Store statistics
  const statsRef = useRef<ProcessorStats>({
    processed: 0,
    sent: 0,
    failed: 0,
    lastRun: null
  });

  /**
   * Process a single email from the queue
   */
  const processEmail = async (email: QueuedEmail): Promise<boolean> => {
    try {
      console.log(`📧 Processing email to ${email.user_email}: ${email.title}`);

      // Send the email
      const success = await sendEmailNotification({
        userId: email.user_id,
        userEmail: email.user_email,
        userName: email.user_name,
        title: email.title,
        message: email.message,
        type: email.notification_type,
        actionUrl: email.action_url
      });

      // Mark as sent or failed in database
      if (success) {
        await supabase.rpc('mark_email_sent', { p_queue_id: email.id });
        console.log(`✅ Email sent successfully to ${email.user_email}`);
        return true;
      } else {
        await supabase.rpc('mark_email_failed', {
          p_queue_id: email.id,
          p_error_message: 'Email service returned failure'
        });
        console.log(`❌ Email failed to send to ${email.user_email}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error processing email ${email.id}:`, error);
      
      // Mark as failed with error message
      try {
        await supabase.rpc('mark_email_failed', {
          p_queue_id: email.id,
          p_error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (dbError) {
        console.error('Failed to mark email as failed in database:', dbError);
      }
      
      return false;
    }
  };

  /**
   * Process all pending emails in the queue
   */
  const processQueue = async (): Promise<void> => {
    try {
      // Fetch pending emails from queue
      const { data, error } = await supabase.rpc('get_pending_emails', {
        p_limit: PROCESSOR_CONFIG.batchSize
      });

      if (error) {
        console.error('Error fetching pending emails:', error);
        return;
      }

      // Parse the JSON result
      const pendingEmails: QueuedEmail[] = data || [];

      if (pendingEmails.length === 0) {
        console.log('📭 No pending emails to process');
        return;
      }

      console.log(`📬 Found ${pendingEmails.length} pending emails to process`);

      // Process each email sequentially
      let sentCount = 0;
      let failedCount = 0;

      for (const email of pendingEmails) {
        const success = await processEmail(email);
        if (success) {
          sentCount++;
        } else {
          failedCount++;
        }
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update statistics
      statsRef.current = {
        processed: statsRef.current.processed + pendingEmails.length,
        sent: statsRef.current.sent + sentCount,
        failed: statsRef.current.failed + failedCount,
        lastRun: new Date()
      };

      console.log(`📊 Email processing complete: ${sentCount} sent, ${failedCount} failed`);
      console.log(`📈 Total stats: ${statsRef.current.sent} sent, ${statsRef.current.failed} failed`);

    } catch (error) {
      console.error('Error processing email queue:', error);
    }
  };

  // Set up interval to process queue
  useEffect(() => {
    if (!enabled) {
      console.log('📧 Email notification processor disabled');
      return;
    }

    console.log(`📧 Email notification processor started (interval: ${intervalMs}ms)`);

    // Process immediately on mount
    processQueue();

    // Set up interval
    const intervalId = setInterval(processQueue, intervalMs);

    // Cleanup on unmount
    return () => {
      console.log('📧 Email notification processor stopped');
      clearInterval(intervalId);
    };
  }, [enabled, intervalMs]);

  // Return statistics for monitoring
  return statsRef.current;
};

// ============================================================================
// MANUAL TRIGGER FUNCTION
// ============================================================================

/**
 * Manually trigger email queue processing
 * Useful for testing or on-demand processing
 */
export const triggerEmailProcessing = async (): Promise<ProcessorStats> => {
  const stats: ProcessorStats = {
    processed: 0,
    sent: 0,
    failed: 0,
    lastRun: new Date()
  };

  try {
    // Fetch pending emails
    const { data, error } = await supabase.rpc('get_pending_emails', {
      p_limit: PROCESSOR_CONFIG.batchSize
    });

    if (error) {
      console.error('Error fetching pending emails:', error);
      return stats;
    }

    const pendingEmails: QueuedEmail[] = data || [];
    
    if (pendingEmails.length === 0) {
      console.log('📭 No pending emails to process');
      return stats;
    }

    console.log(`📬 Processing ${pendingEmails.length} pending emails`);

    // Process each email
    for (const email of pendingEmails) {
      try {
        const success = await sendEmailNotification({
          userId: email.user_id,
          userEmail: email.user_email,
          userName: email.user_name,
          title: email.title,
          message: email.message,
          type: email.notification_type,
          actionUrl: email.action_url
        });

        stats.processed++;

        if (success) {
          await supabase.rpc('mark_email_sent', { p_queue_id: email.id });
          stats.sent++;
        } else {
          await supabase.rpc('mark_email_failed', {
            p_queue_id: email.id,
            p_error_message: 'Email service returned failure'
          });
          stats.failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error);
        stats.failed++;
        
        try {
          await supabase.rpc('mark_email_failed', {
            p_queue_id: email.id,
            p_error_message: error instanceof Error ? error.message : 'Unknown error'
          });
        } catch (dbError) {
          console.error('Failed to update database:', dbError);
        }
      }
    }

    console.log(`📊 Processing complete: ${stats.sent} sent, ${stats.failed} failed`);
    return stats;

  } catch (error) {
    console.error('Error in manual email processing:', error);
    return stats;
  }
};

// ============================================================================
// EXPORT
// ============================================================================

export default useEmailNotificationProcessor;
