/**
 * Deactivation Reason Modal
 * 
 * Modal component for warehouse_admin to provide justification
 * when attempting to deactivate a user. Sends notification to support.
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { FiX, FiAlertCircle, FiSend } from 'react-icons/fi';

interface DeactivationReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  userName: string;
  userEmail: string;
}

/**
 * Modal for collecting deactivation reason from warehouse_admin
 * 
 * Enforces minimum character requirement and provides clear UI
 * for submitting deactivation requests to support team.
 */
const DeactivationReasonModal: React.FC<DeactivationReasonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userName,
  userEmail
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MIN_REASON_LENGTH = 20;
  const MAX_REASON_LENGTH = 500;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate reason
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(`Please provide at least ${MIN_REASON_LENGTH} characters explaining why this user should be deactivated.`);
      return;
    }

    if (reason.trim().length > MAX_REASON_LENGTH) {
      setError(`Reason must be ${MAX_REASON_LENGTH} characters or less.`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(reason.trim());
      
      // Reset form on success
      setReason('');
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setError(null);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const remainingChars = MAX_REASON_LENGTH - reason.length;
  const isReasonValid = reason.trim().length >= MIN_REASON_LENGTH && reason.length <= MAX_REASON_LENGTH;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FiAlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  User Deactivation Request
                </h2>
                <p className="text-orange-100 text-sm mt-1">
                  Approval required from support team
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <FiX className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Warning Alert */}
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="flex items-start">
              <FiAlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Important Notice
                </h3>
                <p className="text-sm text-yellow-700">
                  As a Warehouse Administrator, you need approval from the support team 
                  to deactivate users. Please provide a detailed reason for this request.
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              User to Deactivate:
            </h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-20">Name:</span>
                <span className="text-sm font-medium text-gray-900">{userName}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-600 w-20">Email:</span>
                <span className="text-sm font-medium text-gray-900">{userEmail}</span>
              </div>
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Deactivation <span className="text-red-600">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed explanation for why this user should be deactivated. Include any relevant incidents, policy violations, or business reasons..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-all resize-none ${
                error && reason.length > 0
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-orange-500 focus:border-orange-500'
              }`}
              rows={6}
              disabled={isSubmitting}
              maxLength={MAX_REASON_LENGTH}
            />
            
            {/* Character Counter */}
            <div className="flex items-center justify-between mt-2">
              <p className={`text-sm ${
                reason.trim().length < MIN_REASON_LENGTH 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {reason.trim().length < MIN_REASON_LENGTH
                  ? `${MIN_REASON_LENGTH - reason.trim().length} more characters needed`
                  : '✓ Minimum length met'
                }
              </p>
              <p className={`text-sm ${
                remainingChars < 50 ? 'text-orange-600 font-medium' : 'text-gray-500'
              }`}>
                {remainingChars} characters remaining
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong><br />
              Your request will be sent to the support team for review. 
              They will evaluate the reason and take appropriate action. 
              You will be notified once a decision is made.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isReasonValid}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <FiSend className="h-5 w-5" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeactivationReasonModal;
