/**
 * GroupCreator.tsx
 * 
 * Group Creation Component for Group Management Dashboard
 * Handles the creation of new shipment groups with selected packages
 * Features form validation, package preview, and group configuration
 * 
 * @author Senior Software Engineer
 * @version 3.0.0 - Full Tailwind CSS implementation
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  FaBox,
  FaTrash,
  FaCheck,
  FaCalendar,
  FaExclamationTriangle,
  FaUsers,
  FaArrowLeft
} from 'react-icons/fa';
import type { Package } from '../../../core/models/Package';
import { PackagePriority } from '../../../core/models/Package';
import { GroupPriority } from '../../../core/models/ShipmentGroup';
import { PackageStatus, StatusUtils } from '../../../core/status/StatusDefinitions';

interface GroupCreatorProps {
  readonly selectedPackages: string[];
  readonly packages: Package[];
  readonly onCreateGroup: (groupData: GroupCreationData) => Promise<void>;
  readonly onCancel: () => void;
}

interface GroupCreationData {
  readonly name: string;
  readonly description: string;
  readonly priority: GroupPriority;
  readonly estimatedDelivery: string;
  readonly packageIds: string[];
}

interface ValidationErrors {
  readonly name?: string;
  readonly description?: string;
  readonly estimatedDelivery?: string;
  readonly general?: string;
}

const GroupCreator: React.FC<GroupCreatorProps> = ({
  selectedPackages,
  packages,
  onCreateGroup,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: GroupPriority.MEDIUM,
    estimatedDelivery: ''
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [removedPackages, setRemovedPackages] = useState<Set<string>>(new Set());

  const selectedPackageObjects = useMemo(() => {
    return packages.filter(pkg => 
      selectedPackages.includes(pkg.id) && !removedPackages.has(pkg.id)
    );
  }, [packages, selectedPackages, removedPackages]);

  const groupStats = useMemo(() => {
    const totalWeight = selectedPackageObjects.reduce((sum, pkg) => sum + pkg.weight, 0);
    const totalVolume = selectedPackageObjects.reduce((sum, pkg) => {
      const { length, width, height } = pkg.dimensions;
      return sum + (length * width * height / 1000000);
    }, 0);
    
    const priorityCounts = selectedPackageObjects.reduce((counts, pkg) => {
      counts[pkg.priority] = (counts[pkg.priority] || 0) + 1;
      return counts;
    }, {} as Record<PackagePriority, number>);
    
    return {
      totalPackages: selectedPackageObjects.length,
      totalWeight: totalWeight.toFixed(1),
      totalVolume: totalVolume.toFixed(3),
      priorityCounts
    };
  }, [selectedPackageObjects]);

  const minDeliveryDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  const handleFieldChange = useCallback(<K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const validateForm = useCallback((): ValidationErrors => {
    const mutableErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      mutableErrors.name = 'Group name is required';
    } else if (formData.name.trim().length < 3) {
      mutableErrors.name = 'Group name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      mutableErrors.name = 'Group name must be less than 50 characters';
    }

    if (!formData.description.trim()) {
      mutableErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      mutableErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      mutableErrors.description = 'Description must be less than 500 characters';
    }

    if (!formData.estimatedDelivery) {
      mutableErrors.estimatedDelivery = 'Estimated delivery date is required';
    } else {
      const deliveryDate = new Date(formData.estimatedDelivery);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate <= today) {
        mutableErrors.estimatedDelivery = 'Delivery date must be in the future';
      }
    }

    if (selectedPackageObjects.length === 0) {
      mutableErrors.general = 'At least one package must be selected for the group';
    }

    return mutableErrors as ValidationErrors;
  }, [formData, selectedPackageObjects]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const groupData: GroupCreationData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        estimatedDelivery: formData.estimatedDelivery,
        packageIds: selectedPackageObjects.map(pkg => pkg.id)
      };

      await onCreateGroup(groupData);
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create group. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedPackageObjects, validateForm, onCreateGroup]);

  const handleRemovePackage = useCallback((packageId: string) => {
    setRemovedPackages(prev => new Set([...prev, packageId]));
  }, []);

  const handleRestorePackage = useCallback((packageId: string) => {
    setRemovedPackages(prev => {
      const newSet = new Set(prev);
      newSet.delete(packageId);
      return newSet;
    });
  }, []);

  const getPriorityBadgeClass = useCallback((priority: PackagePriority): string => {
    switch (priority) {
      case PackagePriority.URGENT: return 'bg-red-100 text-red-800 border-red-200';
      case PackagePriority.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200';
      case PackagePriority.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case PackagePriority.LOW: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusBadgeClass = useCallback((status: PackageStatus): string => {
    switch (status) {
      case PackageStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case PackageStatus.PROCESSING: return 'bg-red-100 text-red-800';
      case PackageStatus.SHIPPED: return 'bg-green-100 text-green-800';
      case PackageStatus.DELIVERED: return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl min-h-[600px]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 pb-5 border-b border-gray-200">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Create New Group
          </h2>
          <p className="text-base text-gray-600">
            Configure group settings and review selected packages for batch processing.
          </p>
        </div>
        
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          Back to Selection
        </button>
      </div>

      {/* Error Banner */}
      {errors.general && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <FaExclamationTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{errors.general}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                Group Name *
              </label>
              <input
                id="groupName"
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Enter a descriptive name for this group"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                maxLength={50}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FaExclamationTriangle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.name.length}/50 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="groupDescription"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Describe the purpose and contents of this group"
                rows={4}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                maxLength={500}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FaExclamationTriangle className="w-3 h-3" />
                  {errors.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Priority Selection */}
            <div>
              <label htmlFor="groupPriority" className="block text-sm font-medium text-gray-700 mb-2">
                Group Priority
              </label>
              <select
                id="groupPriority"
                value={formData.priority}
                onChange={(e) => handleFieldChange('priority', e.target.value as GroupPriority)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {Object.values(GroupPriority).map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Priority affects processing order and resource allocation
              </p>
            </div>

            {/* Estimated Delivery Date */}
            <div>
              <label htmlFor="estimatedDelivery" className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Delivery Date *
              </label>
              <div className="relative">
                <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  id="estimatedDelivery"
                  type="date"
                  value={formData.estimatedDelivery}
                  onChange={(e) => handleFieldChange('estimatedDelivery', e.target.value)}
                  min={minDeliveryDate}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    errors.estimatedDelivery ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.estimatedDelivery && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FaExclamationTriangle className="w-3 h-3" />
                  {errors.estimatedDelivery}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Target delivery date for all packages in this group
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting || selectedPackageObjects.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Group...
                  </>
                ) : (
                  <>
                    <FaCheck className="w-4 h-4" />
                    Create Group
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Summary Section */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaUsers className="w-5 h-5 text-red-600" />
              Group Summary
            </h3>

            {/* Group Statistics */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total Packages:</span>
                <span className="font-semibold text-gray-900">{groupStats.totalPackages}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total Weight:</span>
                <span className="font-semibold text-gray-900">{groupStats.totalWeight} kg</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-600">Total Volume:</span>
                <span className="font-semibold text-gray-900">{groupStats.totalVolume} m³</span>
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Priority Distribution</h4>
              <div className="space-y-2">
                {Object.entries(groupStats.priorityCounts).map(([priority, count]) => (
                  <div key={priority} className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadgeClass(priority as PackagePriority)}`}>
                      {priority.toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Package List */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Packages</h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {selectedPackageObjects.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pkg.trackingNumber}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {pkg.clientName}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(pkg.status)}`}>
                          {StatusUtils.formatStatus(pkg.status)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityBadgeClass(pkg.priority)}`}>
                          {pkg.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemovePackage(pkg.id)}
                      className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove from group"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {selectedPackageObjects.length === 0 && (
                  <div className="text-center py-8">
                    <FaBox className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No packages selected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Removed Packages */}
            {removedPackages.size > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Removed Packages</h4>
                <div className="space-y-2">
                  {packages
                    .filter(pkg => removedPackages.has(pkg.id))
                    .map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {pkg.trackingNumber}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {pkg.clientName}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleRestorePackage(pkg.id)}
                          className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCreator;