/**
 * Package Verification Modal Component
 * 
 * Interface for verifying package delivery with 6-digit authentication code
 * Validates suite number and auth code before marking package as delivered
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { FiCheckCircle, FiX, FiAlertCircle, FiShield, FiPackage } from 'react-icons/fi';
import { warehouseDocumentService } from '../../services/warehouseDocumentService';
import type { PackageVerificationRequest } from '../../services/warehouseDocumentService';
import { useWarehouseAuth } from '../../hooks/useWarehouseAuth';

// ============================================================================
// COMPONENT PROPS INTERFACE
// ============================================================================

interface PackageVerificationModalProps {
  packageId: string;
  packageTrackingNumber: string;
  onSuccess?: (result: any) => void;
  onClose: () => void;
}

// ============================================================================
// PACKAGE VERIFICATION MODAL COMPONENT
// ============================================================================

export const PackageVerificationModal: React.FC<PackageVerificationModalProps> = ({
  packageId,
  packageTrackingNumber,
  onSuccess,
  onClose
}) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Authentication state
  const { user } = useWarehouseAuth();

  // Form state
  const [suiteNumber, setSuiteNumber] = useState<string>('');
  const [authCode, setAuthCode] = useState<string>('');
  
  // UI state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // ========================================
  // EVENT HANDLERS
  // ========================================

  /**
   * Handle form submission
   * Validates inputs and calls verification service
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Validate inputs
    if (!suiteNumber.trim()) {
      setError('Please enter suite number');
      return;
    }

    if (!authCode.trim() || authCode.length !== 6) {
      setError('Please enter valid 6-digit authentication code');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    // Clear previous errors
    setError('');
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Prepare verification request
      const request: PackageVerificationRequest = {
        package_id: packageId,
        suite_number: suiteNumber.trim().toUpperCase(),
        auth_code: authCode.trim(),
        staff_id: user.id
      };

      // Call verification service
      const result = await warehouseDocumentService.verifyPackageDelivery(request);

      setVerificationResult(result);

      // If successful, trigger callback
      if (result.verified && onSuccess) {
        setTimeout(() => {
          onSuccess(result);
        }, 2000); // Show success message for 2 seconds
      }

    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify package. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Handle auth code input
   * Ensures only digits are entered and max 6 characters
   */
  const handleAuthCodeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 6) {
      setAuthCode(value);
    }
  };

  /**
   * Reset form for retry
   * Clears results and allows new verification attempt
   */
  const handleRetry = (): void => {
    setVerificationResult(null);
    setError('');
    setAuthCode('');
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FiShield className="text-3xl" />
                Package Verification
              </h2>
              <p className="text-purple-100 text-sm mt-1">
                Verify delivery with authentication code
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-purple-500 p-2 rounded-lg transition"
            >
              <FiX className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Package Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <FiPackage className="text-purple-600 text-2xl" />
              <div>
                <p className="text-sm text-gray-600">Tracking Number</p>
                <p className="font-mono font-bold text-gray-800">{packageTrackingNumber}</p>
              </div>
            </div>
          </div>

          {/* Verification Form */}
          {!verificationResult && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Suite Number Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Customer Suite Number
                </label>
                <input
                  type="text"
                  value={suiteNumber}
                  onChange={(e) => setSuiteNumber(e.target.value.toUpperCase())}
                  placeholder="Enter suite number (e.g., VC-001)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase font-mono"
                  disabled={isVerifying}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Customer's suite number for verification
                </p>
              </div>

              {/* Auth Code Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  6-Digit Authentication Code
                </label>
                <input
                  type="text"
                  value={authCode}
                  onChange={handleAuthCodeChange}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl font-bold tracking-widest"
                  disabled={isVerifying}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Code provided to customer at package intake
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <FiAlertCircle />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifying || !suiteNumber || authCode.length !== 6}
                className={`w-full py-3 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
                  isVerifying || !suiteNumber || authCode.length !== 6
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    Verify & Mark as Delivered
                  </>
                )}
              </button>
            </form>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className="space-y-4">
              {verificationResult.verified ? (
                // Success Message
                <div className="text-center py-6">
                  <div className="mb-4">
                    <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                      <FiCheckCircle className="text-green-600 text-5xl" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Verification Successful!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Package verified and marked as delivered
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Package ID:</span>
                        <span className="font-mono font-semibold">{verificationResult.package_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-semibold">{verificationResult.customer_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-semibold text-green-600">Delivered</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Close
                  </button>
                </div>
              ) : (
                // Failure Message
                <div className="text-center py-6">
                  <div className="mb-4">
                    <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                      <FiAlertCircle className="text-red-600 text-5xl" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    Verification Failed
                  </h3>
                  <p className="text-red-600 font-semibold mb-4">
                    {verificationResult.reason || 'Invalid credentials'}
                  </p>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                    <p className="text-sm text-gray-700">
                      <strong>Possible reasons:</strong>
                    </p>
                    <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                      <li>Incorrect authentication code</li>
                      <li>Suite number mismatch</li>
                      <li>Package not in 'arrived' status</li>
                      <li>Code already used</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          {!verificationResult && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                <FiShield className="inline mr-1" />
                All verification attempts are logged for security purposes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageVerificationModal;
