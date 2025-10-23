/**
 * Recipients Management Service
 * 
 * Handles all CRUD operations for saved recipients
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { supabase } from '../lib/supabase';

export interface SavedRecipient {
  id: string;
  user_id: string;
  nickname: string;
  recipient_name: string;
  recipient_phone: string | null;
  delivery_address: string;
  delivery_city: string;
  delivery_country: string;
  service_type: 'standard' | 'express' | 'overnight';
  is_default: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRecipientData {
  nickname: string;
  recipient_name: string;
  recipient_phone?: string | null;
  delivery_address: string;
  delivery_city: string;
  delivery_country: string;
  service_type: 'standard' | 'express' | 'overnight';
  is_default?: boolean;
}

export interface UpdateRecipientData extends Partial<CreateRecipientData> {
  id: string;
}

export class RecipientsService {
  /**
   * Get all saved recipients for a user
   */
  static async getAllRecipients(userId: string): Promise<SavedRecipient[]> {
    try {
      const { data, error } = await supabase.rpc('get_saved_recipients', {
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching recipients:', error);
      throw new Error('Failed to load recipients');
    }
  }

  /**
   * Create a new saved recipient
   */
  static async createRecipient(
    userId: string,
    recipientData: CreateRecipientData
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('save_recipient', {
        p_user_id: userId,
        p_nickname: recipientData.nickname,
        p_recipient_name: recipientData.recipient_name,
        p_recipient_phone: recipientData.recipient_phone || null,
        p_delivery_address: recipientData.delivery_address,
        p_delivery_city: recipientData.delivery_city,
        p_delivery_country: recipientData.delivery_country,
        p_service_type: recipientData.service_type,
        p_is_default: recipientData.is_default || false
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to create recipient');
      }

      return {
        success: true,
        message: 'Recipient created successfully'
      };
    } catch (error) {
      console.error('Error creating recipient:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create recipient'
      };
    }
  }

  /**
   * Update an existing saved recipient
   */
  static async updateRecipient(
    userId: string,
    recipientData: UpdateRecipientData
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('update_saved_recipient', {
        p_recipient_id: recipientData.id,
        p_user_id: userId,
        p_nickname: recipientData.nickname,
        p_recipient_name: recipientData.recipient_name,
        p_recipient_phone: recipientData.recipient_phone || null,
        p_delivery_address: recipientData.delivery_address,
        p_delivery_city: recipientData.delivery_city,
        p_delivery_country: recipientData.delivery_country,
        p_service_type: recipientData.service_type,
        p_is_default: recipientData.is_default
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to update recipient');
      }

      return {
        success: true,
        message: 'Recipient updated successfully'
      };
    } catch (error) {
      console.error('Error updating recipient:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update recipient'
      };
    }
  }

  /**
   * Delete a saved recipient
   */
  static async deleteRecipient(
    userId: string,
    recipientId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('delete_saved_recipient', {
        p_recipient_id: recipientId,
        p_user_id: userId
      });

      if (error) {
        throw error;
      }

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to delete recipient');
      }

      return {
        success: true,
        message: 'Recipient deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting recipient:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete recipient'
      };
    }
  }

  /**
   * Set a recipient as default (unsets all others)
   */
  static async setDefaultRecipient(
    userId: string,
    recipientId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // First, get the recipient to update
      const recipients = await this.getAllRecipients(userId);
      const recipient = recipients.find(r => r.id === recipientId);

      if (!recipient) {
        throw new Error('Recipient not found');
      }

      // Update with is_default = true (RPC function should handle unsetting others)
      const result = await this.updateRecipient(userId, {
        ...recipient,
        is_default: true
      });

      return result;
    } catch (error) {
      console.error('Error setting default recipient:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set default recipient'
      };
    }
  }

  /**
   * Get recipient by ID
   */
  static async getRecipientById(
    userId: string,
    recipientId: string
  ): Promise<SavedRecipient | null> {
    try {
      const recipients = await this.getAllRecipients(userId);
      return recipients.find(r => r.id === recipientId) || null;
    } catch (error) {
      console.error('Error fetching recipient:', error);
      return null;
    }
  }

  /**
   * Search recipients by nickname or recipient name
   */
  static async searchRecipients(
    userId: string,
    searchQuery: string
  ): Promise<SavedRecipient[]> {
    try {
      const recipients = await this.getAllRecipients(userId);
      
      if (!searchQuery.trim()) {
        return recipients;
      }

      const query = searchQuery.toLowerCase();
      return recipients.filter(r =>
        r.nickname.toLowerCase().includes(query) ||
        r.recipient_name.toLowerCase().includes(query) ||
        r.delivery_city.toLowerCase().includes(query) ||
        r.delivery_country.toLowerCase().includes(query)
      );
    } catch (error) {
      console.error('Error searching recipients:', error);
      return [];
    }
  }
}
