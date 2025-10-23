/**
 * Recipients Management Page
 * 
 * Dedicated page for managing saved recipients with full CRUD operations
 * Follows Vanguard Cargo design theme
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  FiBookmark,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiStar,
  FiMapPin,
  FiPhone,
  FiPackage,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import { RecipientsService, type SavedRecipient, type CreateRecipientData } from '../../../services/RecipientsService';
import RecipientFormModal from './RecipientFormModal';

const RecipientsManagement: React.FC = () => {
  const { user } = useWarehouseAuth();
  
  // State management
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<SavedRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<SavedRecipient | null>(null);

  /**
   * Load all recipients
   */
  const loadRecipients = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await RecipientsService.getAllRecipients(user.id);
      setRecipients(data);
      setFilteredRecipients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipients');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecipients();
    setRefreshing(false);
  };

  /**
   * Handle search
   */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRecipients(recipients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = recipients.filter(r =>
      r.nickname.toLowerCase().includes(query) ||
      r.recipient_name.toLowerCase().includes(query) ||
      r.delivery_city.toLowerCase().includes(query) ||
      r.delivery_country.toLowerCase().includes(query)
    );
    setFilteredRecipients(filtered);
  }, [searchQuery, recipients]);

  /**
   * Handle create recipient
   */
  const handleCreateRecipient = async (data: CreateRecipientData) => {
    if (!user?.id) return;

    const result = await RecipientsService.createRecipient(user.id, data);
    
    if (result.success) {
      setSuccess('Recipient created successfully!');
      setShowCreateModal(false);
      await loadRecipients();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      throw new Error(result.error || 'Failed to create recipient');
    }
  };

  /**
   * Handle update recipient
   */
  const handleUpdateRecipient = async (data: CreateRecipientData) => {
    if (!user?.id || !selectedRecipient) return;

    const result = await RecipientsService.updateRecipient(user.id, {
      ...data,
      id: selectedRecipient.id
    });
    
    if (result.success) {
      setSuccess('Recipient updated successfully!');
      setShowEditModal(false);
      setSelectedRecipient(null);
      await loadRecipients();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      throw new Error(result.error || 'Failed to update recipient');
    }
  };

  /**
   * Handle delete recipient
   */
  const handleDeleteRecipient = async (recipientId: string) => {
    if (!user?.id) return;
    
    if (!confirm('Are you sure you want to delete this recipient? This action cannot be undone.')) {
      return;
    }

    const result = await RecipientsService.deleteRecipient(user.id, recipientId);
    
    if (result.success) {
      setSuccess('Recipient deleted successfully!');
      await loadRecipients();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Failed to delete recipient');
      setTimeout(() => setError(null), 3000);
    }
  };

  /**
   * Handle set as default
   */
  const handleSetDefault = async (recipientId: string) => {
    if (!user?.id) return;

    const result = await RecipientsService.setDefaultRecipient(user.id, recipientId);
    
    if (result.success) {
      setSuccess('Default recipient updated!');
      await loadRecipients();
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || 'Failed to set default recipient');
      setTimeout(() => setError(null), 3000);
    }
  };

  /**
   * Handle edit click
   */
  const handleEditClick = (recipient: SavedRecipient) => {
    setSelectedRecipient(recipient);
    setShowEditModal(true);
  };

  // Load recipients on mount
  useEffect(() => {
    loadRecipients();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg shadow-red-500/20">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight flex items-center gap-3">
                <FiBookmark className="w-10 h-10" />
                Recipients Management
              </h1>
              <p className="mt-2 text-base sm:text-lg text-red-100">
                Manage saved recipients for faster shipment creation
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all border border-white/30"
              >
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-6 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 transition-all font-semibold shadow-lg"
              >
                <FiPlus className="mr-2" />
                Add Recipient
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <FiBookmark className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-green-700 font-medium">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <FiAlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by nickname, recipient name, city, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Recipients Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <FiRefreshCw className="animate-spin h-12 w-12 text-red-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading recipients...</p>
            </div>
          </div>
        ) : filteredRecipients.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FiBookmark className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchQuery ? 'No recipients found' : 'No saved recipients yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Save recipients to quickly create shipments without entering delivery details each time'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg"
                >
                  <FiPlus className="mr-2" />
                  Add Your First Recipient
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipients.map((recipient) => (
              <div
                key={recipient.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Card Header */}
                <div className={`px-6 py-4 ${recipient.is_default ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-b-2 border-yellow-200' : 'bg-gradient-to-r from-gray-50 to-white border-b border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {recipient.is_default && (
                          <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <h3 className="text-lg font-bold text-gray-900">
                          {recipient.nickname}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {recipient.recipient_name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FiMapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Delivery Address
                      </p>
                      <p className="text-sm text-gray-900 font-medium">
                        {recipient.delivery_address}
                      </p>
                      <p className="text-sm text-gray-600">
                        {recipient.delivery_city}, {recipient.delivery_country}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  {recipient.recipient_phone && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FiPhone className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Phone Number
                        </p>
                        <p className="text-sm text-gray-900 font-medium">
                          {recipient.recipient_phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Service Type */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiPackage className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Service Type
                      </p>
                      <p className="text-sm text-gray-900 font-medium capitalize">
                        {recipient.service_type}
                      </p>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Used {recipient.usage_count} time{recipient.usage_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2">
                  {!recipient.is_default && (
                    <button
                      onClick={() => handleSetDefault(recipient.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-all font-medium"
                      title="Set as default"
                    >
                      <FiStar className="w-4 h-4" />
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleEditClick(recipient)}
                    className={`${recipient.is_default ? 'flex-1' : ''} flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-all font-medium`}
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRecipient(recipient.id)}
                    className="flex items-center justify-center px-4 py-2 bg-white border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-all"
                    title="Delete recipient"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Summary */}
        {!loading && filteredRecipients.length > 0 && (
          <div className="mt-6 text-sm text-gray-600 text-center">
            Showing {filteredRecipients.length} of {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <RecipientFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRecipient}
          title="Add New Recipient"
          mode="create"
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRecipient && (
        <RecipientFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRecipient(null);
          }}
          onSubmit={handleUpdateRecipient}
          title="Edit Recipient"
          mode="edit"
          initialData={{
            nickname: selectedRecipient.nickname,
            recipient_name: selectedRecipient.recipient_name,
            recipient_phone: selectedRecipient.recipient_phone || undefined,
            delivery_address: selectedRecipient.delivery_address,
            delivery_city: selectedRecipient.delivery_city,
            delivery_country: selectedRecipient.delivery_country,
            service_type: selectedRecipient.service_type,
            is_default: selectedRecipient.is_default
          }}
        />
      )}
    </div>
  );
};

export default RecipientsManagement;
