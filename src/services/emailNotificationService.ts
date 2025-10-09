/**
 * Email Notification Service
 * 
 * Sends email notifications to users based on in-app notifications
 * Uses Resend API to send emails from noreply@vanguardcargo.co
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 * @date 2025-10-08
 */

import { supabase } from '../config/supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Notification type enumeration matching database schema
 */
export type NotificationType = 'package_update' | 'shipment_update' | 'system' | 'promotion';

/**
 * Email notification data structure
 */
interface EmailNotificationData {
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
}

/**
 * Email template data for rendering
 */
interface EmailTemplateData {
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  year: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Email sender configuration
 */
const EMAIL_CONFIG = {
  fromEmail: 'noreply@vanguardcargo.co',
  fromName: 'VanguardCargo',
  replyTo: 'support@vanguardcargo.co',
  companyName: 'VANGUARD CARGO LLC',
  companyAddress: '4700 Eisenhower Avenue ALX-E2, Alexandria, VA 22304, USA',
  supportEmail: 'support@vanguardcargo.co',
  supportPhone: '0303982320 | +233 544197819'
};

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Generate HTML email template with VanguardCargo branding
 */
const generateEmailHTML = (data: EmailTemplateData, type: NotificationType): string => {
  // Get emoji and color based on notification type
  const typeConfig = {
    package_update: { emoji: '📦', color: '#3B82F6', bgColor: '#EFF6FF' },
    shipment_update: { emoji: '🚚', color: '#8B5CF6', bgColor: '#F5F3FF' },
    system: { emoji: '🔔', color: '#6B7280', bgColor: '#F9FAFB' },
    promotion: { emoji: '🎁', color: '#10B981', bgColor: '#ECFDF5' }
  };

  const config = typeConfig[type] || typeConfig.system;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    /* Base styles for email clients */
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1F2937;
      background-color: #F9FAFB;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
    }
    .header {
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo-text {
      color: #FFFFFF;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .tagline {
      color: #FEE2E2;
      font-size: 14px;
      margin: 8px 0 0 0;
    }
    .notification-badge {
      background-color: ${config.bgColor};
      border-left: 4px solid ${config.color};
      padding: 20px;
      margin: 30px;
      border-radius: 8px;
    }
    .notification-type {
      color: ${config.color};
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 10px 0;
    }
    .notification-title {
      color: #111827;
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 12px 0;
    }
    .notification-message {
      color: #4B5563;
      font-size: 16px;
      line-height: 1.6;
      margin: 0;
    }
    .content {
      padding: 30px;
    }
    .greeting {
      font-size: 16px;
      color: #1F2937;
      margin-bottom: 20px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
    }
    .footer {
      background-color: #F9FAFB;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #E5E7EB;
    }
    .footer-text {
      color: #6B7280;
      font-size: 14px;
      margin: 5px 0;
    }
    .footer-link {
      color: #DC2626;
      text-decoration: none;
      font-weight: 600;
    }
    .divider {
      height: 1px;
      background-color: #E5E7EB;
      margin: 30px 0;
    }
    .info-box {
      background-color: #F3F4F6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .info-title {
      font-size: 14px;
      font-weight: 700;
      color: #374151;
      margin: 0 0 10px 0;
    }
    .info-text {
      font-size: 14px;
      color: #6B7280;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with branding -->
    <div class="header">
      <h1 class="logo-text">VANGUARDCARGO</h1>
      <p class="tagline">Your Trusted International Logistics Partner</p>
    </div>

    <!-- Main content -->
    <div class="content">
      <p class="greeting">Hello ${data.userName},</p>

      <!-- Notification badge -->
      <div class="notification-badge">
        <p class="notification-type">${config.emoji} ${type.replace('_', ' ')}</p>
        <h2 class="notification-title">${data.title}</h2>
        <p class="notification-message">${data.message}</p>
      </div>

      ${data.actionUrl ? `
      <div style="text-align: center;">
        <a href="${data.actionUrl}" class="cta-button">View Details</a>
      </div>
      ` : ''}

      <div class="divider"></div>

      <!-- Help information -->
      <div class="info-box">
        <p class="info-title">Need Help?</p>
        <p class="info-text">
          📧 Email: <a href="mailto:${EMAIL_CONFIG.supportEmail}" class="footer-link">${EMAIL_CONFIG.supportEmail}</a><br>
          📱 Phone: ${EMAIL_CONFIG.supportPhone}
        </p>
      </div>

      <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
        Thank you for choosing VanguardCargo for your international shipping needs!
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text"><strong>${EMAIL_CONFIG.companyName}</strong></p>
      <p class="footer-text">${EMAIL_CONFIG.companyAddress}</p>
      <p class="footer-text">
        <a href="https://www.vanguardcargo.co" class="footer-link">www.vanguardcargo.co</a>
      </p>
      <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
        © ${data.year} VanguardCargo. All rights reserved.
      </p>
      <p class="footer-text" style="font-size: 12px; color: #9CA3AF;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generate plain text email content (fallback for non-HTML clients)
 */
const generateEmailText = (data: EmailTemplateData, _type: NotificationType): string => {
  return `
Hello ${data.userName},

${data.title}

${data.message}

${data.actionUrl ? `View details: ${data.actionUrl}\n` : ''}

---
Need Help?
Email: ${EMAIL_CONFIG.supportEmail}
Phone: ${EMAIL_CONFIG.supportPhone}

Thank you for choosing VanguardCargo!

${EMAIL_CONFIG.companyName}
${EMAIL_CONFIG.companyAddress}
www.vanguardcargo.co

© ${data.year} VanguardCargo. All rights reserved.
This is an automated notification. Please do not reply to this email.
  `.trim();
};

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send email notification using Resend API
 * 
 * @param data - Email notification data
 * @returns Promise resolving to success status
 */
export const sendEmailNotification = async (data: EmailNotificationData): Promise<boolean> => {
  try {
    // Check if user has email notifications enabled
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('email_notifications')
      .eq('user_id', data.userId)
      .single();

    // Skip if email notifications are disabled
    if (preferences && preferences.email_notifications === false) {
      console.log(`📧 Email notifications disabled for user ${data.userId}`);
      return false;
    }

    // Prepare email template data
    const templateData: EmailTemplateData = {
      userName: data.userName,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      year: new Date().getFullYear()
    };

    // Generate HTML and text content
    const htmlContent = generateEmailHTML(templateData, data.type);
    const textContent = generateEmailText(templateData, data.type);

    // Prepare email payload for Resend API
    const emailPayload = {
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.fromEmail}>`,
      to: [data.userEmail],
      reply_to: EMAIL_CONFIG.replyTo,
      subject: data.title,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'category', value: data.type },
        { name: 'environment', value: process.env.NODE_ENV || 'development' }
      ]
    };

    // Get Resend API key from environment
    const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn('⚠️ VITE_RESEND_API_KEY not configured. Email notification skipped.');
      console.log('📧 Email would have been sent to:', data.userEmail);
      console.log('📧 Subject:', data.title);
      return false;
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully:', result.id);
    return true;

  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    return false;
  }
};

/**
 * Send email notification by notification ID
 * Fetches notification and user details, then sends email
 * 
 * @param notificationId - UUID of the notification
 * @returns Promise resolving to success status
 */
export const sendEmailByNotificationId = async (notificationId: string): Promise<boolean> => {
  try {
    // Fetch notification with user details
    const { data: notification, error } = await supabase
      .from('notifications')
      .select(`
        *,
        users:user_id (
          email,
          first_name,
          last_name
        )
      `)
      .eq('id', notificationId)
      .single();

    if (error || !notification) {
      console.error('Failed to fetch notification:', error);
      return false;
    }

    // Extract user data
    const user = notification.users as any;
    if (!user || !user.email) {
      console.error('No user email found for notification');
      return false;
    }

    // Prepare email data
    const emailData: EmailNotificationData = {
      userId: notification.user_id,
      userEmail: user.email,
      userName: `${user.first_name} ${user.last_name}`,
      title: notification.title,
      message: notification.message,
      type: notification.type as NotificationType,
      actionUrl: notification.action_url
    };

    // Send the email
    return await sendEmailNotification(emailData);

  } catch (error) {
    console.error('Error in sendEmailByNotificationId:', error);
    return false;
  }
};

// ============================================================================
// EXPORT
// ============================================================================

export default {
  sendEmailNotification,
  sendEmailByNotificationId
};
