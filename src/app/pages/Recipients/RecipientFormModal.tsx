/**
 * Recipient Form Modal
 * 
 * Modal component for creating/editing recipients
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { FiX, FiSave, FiStar } from 'react-icons/fi';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import type { CreateRecipientData } from '../../../services/RecipientsService';

interface RecipientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRecipientData) => Promise<void>;
  title: string;
  mode: 'create' | 'edit';
  initialData?: Partial<CreateRecipientData>;
}

/**
 * Get full country name from country code
 */
const getCountryName = (countryCode: string): string => {
  const countryNames: { [key: string]: string } = {
    'US': 'United States',
    'GB': 'United Kingdom',
    'CA': 'Canada',
    'GH': 'Ghana',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'ZA': 'South Africa',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'GR': 'Greece',
    'PT': 'Portugal',
    'IE': 'Ireland',
    'CN': 'China',
    'JP': 'Japan',
    'KR': 'South Korea',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'VE': 'Venezuela',
    'EC': 'Ecuador',
    'UY': 'Uruguay',
    'PY': 'Paraguay',
    'BO': 'Bolivia',
    'CR': 'Costa Rica',
    'PA': 'Panama',
    'SG': 'Singapore',
    'MY': 'Malaysia',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'PH': 'Philippines',
    'ID': 'Indonesia',
    'NZ': 'New Zealand',
    'AE': 'United Arab Emirates',
    'SA': 'Saudi Arabia',
    'IL': 'Israel',
    'TR': 'Turkey',
    'EG': 'Egypt',
    'MA': 'Morocco',
    'TN': 'Tunisia',
    'ET': 'Ethiopia',
    'TZ': 'Tanzania',
    'UG': 'Uganda',
    'RW': 'Rwanda'
  };
  return countryNames[countryCode] || countryCode;
};

const RecipientFormModal: React.FC<RecipientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  mode,
  initialData
}) => {
  const [formData, setFormData] = useState<CreateRecipientData>({
    nickname: initialData?.nickname || '',
    recipient_name: initialData?.recipient_name || '',
    recipient_phone: initialData?.recipient_phone || '',
    delivery_address: initialData?.delivery_address || '',
    delivery_city: initialData?.delivery_city || '',
    delivery_country: initialData?.delivery_country || '',
    service_type: initialData?.service_type || 'standard',
    is_default: initialData?.is_default || false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState<string>(initialData?.recipient_phone || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.nickname.trim()) {
      setError('Nickname is required');
      return;
    }

    if (!formData.recipient_name.trim()) {
      setError('Recipient name is required');
      return;
    }

    if (!formData.delivery_address.trim()) {
      setError('Delivery address is required');
      return;
    }

    if (!formData.delivery_city.trim()) {
      setError('City is required');
      return;
    }

    if (!formData.delivery_country.trim()) {
      setError('Country is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        recipient_phone: phoneValue || null
      });
      
      // Reset form on success (only for create mode)
      if (mode === 'create') {
        setFormData({
          nickname: '',
          recipient_name: '',
          recipient_phone: '',
          delivery_address: '',
          delivery_city: '',
          delivery_country: '',
          service_type: 'standard',
          is_default: false
        });
        setPhoneValue('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FiSave className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="text-red-100 text-sm mt-1">
                  {mode === 'create' ? 'Save recipient for future shipments' : 'Update recipient details'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Nickname */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-semibold text-gray-700 mb-2">
              Nickname <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="nickname"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="e.g., Mom, John NYC, Office Address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">A friendly name to identify this recipient</p>
          </div>

          {/* Recipient Name */}
          <div>
            <label htmlFor="recipient_name" className="block text-sm font-semibold text-gray-700 mb-2">
              Recipient Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="recipient_name"
              value={formData.recipient_name}
              onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
              placeholder="Full name of recipient"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isSubmitting}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="recipient_phone" className="block text-sm font-semibold text-gray-700 mb-2">
              Recipient Phone *
            </label>
            <PhoneInput
              international
              defaultCountry="US"
              value={phoneValue}
              onChange={(value) => {
                setPhoneValue(value || '');
                setFormData(prev => ({
                  ...prev,
                  recipient_phone: value || ''
                }));

                // Auto-populate country based on phone number country code
                if (value) {
                  try {
                    const phoneNumber = parsePhoneNumber(value);
                    if (phoneNumber && phoneNumber.country) {
                      const countryName = getCountryName(phoneNumber.country);
                      setFormData(prev => ({
                        ...prev,
                        delivery_country: countryName
                      }));
                    }
                  } catch (error) {
                    // Phone number not valid yet, ignore
                  }
                }
              }}
              className="phone-input-professional"
              placeholder="Enter phone number with country code"
              style={{
                width: '100%'
              }}
            />
            <style>{`
              .phone-input-professional .PhoneInputInput {
                padding: 0.75rem 1rem;
                border: 2px solid #E5E7EB;
                border-radius: 0.75rem;
                width: 100%;
                font-size: 1rem;
                line-height: 1.5;
                transition: all 0.2s ease-in-out;
                color: #111827;
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
              }
              .phone-input-professional .PhoneInputInput:hover {
                border-color: #D1D5DB;
              }
              .phone-input-professional .PhoneInputInput:focus {
                outline: none;
                border-color: #EF4444;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
              }
              .phone-input-professional .PhoneInputInput::placeholder {
                color: #9CA3AF;
              }
              .phone-input-professional .PhoneInputCountrySelect {
                padding: 0.75rem;
                border: 2px solid #E5E7EB;
                border-radius: 0.75rem 0 0 0.75rem;
                background: white;
                margin-right: -2px;
                transition: all 0.2s ease-in-out;
              }
              .phone-input-professional .PhoneInputCountrySelect:hover {
                border-color: #D1D5DB;
              }
              .phone-input-professional .PhoneInputCountrySelect:focus {
                outline: none;
                border-color: #EF4444;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
              }
            `}</style>
          </div>

          {/* Delivery Address */}
          <div>
            <label htmlFor="delivery_address" className="block text-sm font-semibold text-gray-700 mb-2">
              Delivery Address <span className="text-red-600">*</span>
            </label>
            <textarea
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              placeholder="Street address, building name, apartment number, etc."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* City & Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="delivery_city" className="block text-sm font-semibold text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                id="delivery_city"
                value={formData.delivery_city}
                onChange={(e) => setFormData({ ...formData, delivery_city: e.target.value })}
                placeholder="Enter city"
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-gray-900 placeholder-gray-400 hover:border-gray-300"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="delivery_country" className="block text-sm font-semibold text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                id="delivery_country"
                name="delivery_country"
                value={formData.delivery_country}
                readOnly
                required
                className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
                placeholder="Select phone country code first"
              />
            </div>
          </div>

          {/* Service Type */}
          <div>
            <label htmlFor="service_type" className="block text-sm font-semibold text-gray-700 mb-2">
              Preferred Service Type <span className="text-red-600">*</span>
            </label>
            <select
              id="service_type"
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="standard">Standard </option>
              <option value="express">Express</option>
              <option value="overnight">Overnight</option>
            </select>
          </div>

          {/* Set as Default */}
          <div className="flex items-center gap-3 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_default ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_default ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div className="flex-1">
              <label 
                className="block text-sm font-bold text-gray-900 cursor-pointer flex items-center gap-2"
                onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
              >
                <FiStar className={formData.is_default ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
                Set as Default Recipient
              </label>
              <p className="text-xs text-gray-600 mt-1">
                Auto-fill with this recipient's details when creating shipments
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>{mode === 'create' ? 'Creating...' : 'Updating...'}</span>
                </>
              ) : (
                <>
                  <FiSave className="h-5 w-5" />
                  <span>{mode === 'create' ? 'Create Recipient' : 'Update Recipient'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipientFormModal;
