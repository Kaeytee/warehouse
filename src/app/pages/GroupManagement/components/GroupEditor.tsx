/**
 * GroupEditor.tsx
 * 
 * Group Editing Component for Group Management Dashboard
 * Allows admins to edit existing shipment groups and manage their packages
 * 
 * @author Senior Software Engineer
 * @version 2.0.0 - Tailwind CSS Implementation
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  FaEdit, 
  FaCalendar, 
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaBox,
  FaUser,
  FaMapMarkerAlt,
  FaWeight,
  FaPlus
} from 'react-icons/fa';
import type { Package } from '../../../core/models/Package';
import type { ShipmentGroup } from '../../../core/models/ShipmentGroup';
import { GroupPriority } from '../../../core/models/ShipmentGroup';
import { StatusUtils } from '../../../core/status/StatusDefinitions';

interface GroupEditorProps {
  readonly group: ShipmentGroup | null;
  readonly packages: Package[];
  readonly onUpdateGroup: (groupData: GroupUpdateData) => Promise<void>;
  readonly onCancel: () => void;
}

interface GroupUpdateData {
  readonly id: string;
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

const GroupEditor: React.FC<GroupEditorProps> = ({
  group,
  packages,
  onUpdateGroup,
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
  const [groupPackageIds, setGroupPackageIds] = useState<Set<string>>(new Set());
  const [availablePackages, setAvailablePackages] = useState<Package[]>([]);
  const [showAddPackages, setShowAddPackages] = useState<boolean>(false);

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        priority: group.priority,
        estimatedDelivery: group.estimatedDelivery ? 
          new Date(group.estimatedDelivery).toISOString().split('T')[0] : ''
      });
      setGroupPackageIds(new Set(group.packageIds));
    }
  }, [group]);

  useEffect(() => {
    if (group) {
      const available = packages.filter(pkg => 
        !pkg.groupId || pkg.groupId === group.id
      );
      setAvailablePackages(available);
    }
  }, [group, packages]);

  const groupPackages = useMemo(() => {
    return packages.filter(pkg => groupPackageIds.has(pkg.id));
  }, [packages, groupPackageIds]);

  const packagesToAdd = useMemo(() => {
    return availablePackages.filter(pkg => !groupPackageIds.has(pkg.id));
  }, [availablePackages, groupPackageIds]);

  const groupStats = useMemo(() => {
    const totalWeight = groupPackages.reduce((sum, pkg) => sum + pkg.weight, 0);
    const totalVolume = groupPackages.reduce((sum, pkg) => {
      const { length, width, height } = pkg.dimensions;
      return sum + (length * width * height / 1000000);
    }, 0);
    
    const priorityCounts = groupPackages.reduce((counts, pkg) => {
      counts[pkg.priority] = (counts[pkg.priority] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return {
      totalPackages: groupPackages.length,
      totalWeight: totalWeight.toFixed(1),
      totalVolume: totalVolume.toFixed(3),
      priorityCounts
    };
  }, [groupPackages]);

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
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors['name'] = 'Group name is required';
    } else if (formData.name.trim().length < 3) {
      errors['name'] = 'Group name must be at least 3 characters';
    } else if (formData.name.trim().length > 50) {
      errors['name'] = 'Group name must be less than 50 characters';
    }
    
    if (!formData.description.trim()) {
      errors['description'] = 'Group description is required';
    } else if (formData.description.trim().length < 10) {
      errors['description'] = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      errors['description'] = 'Description must be less than 500 characters';
    }
    
    if (!formData.estimatedDelivery) {
      errors['estimatedDelivery'] = 'Estimated delivery date is required';
    } else {
      const deliveryDate = new Date(formData.estimatedDelivery);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deliveryDate < today) {
        errors['estimatedDelivery'] = 'Delivery date cannot be in the past';
      }
    }
    
    if (groupPackageIds.size === 0) {
      errors['general'] = 'At least one package must be in the group';
    }
    
    return errors as ValidationErrors;
  }, [formData, groupPackageIds.size]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!group) return;
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const updateData: GroupUpdateData = {
        id: group.id,
        name: formData.name.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        estimatedDelivery: formData.estimatedDelivery,
        packageIds: Array.from(groupPackageIds)
      };
      
      await onUpdateGroup(updateData);
      
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to update group. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [group, formData, groupPackageIds, validateForm, onUpdateGroup]);

  const handleRemovePackage = useCallback((packageId: string) => {
    setGroupPackageIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(packageId);
      return newSet;
    });
  }, []);

  const handleAddPackage = useCallback((packageId: string) => {
    setGroupPackageIds(prev => new Set([...prev, packageId]));
  }, []);

  const getMinDeliveryDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getStatusBadgeClass = useCallback((status: string): string => {
    switch (status) {
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'grouped': return 'bg-red-100 text-red-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-gray-500">
        <FaEdit className="text-6xl text-gray-300 mb-6" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Group Selected</h3>
        <p className="text-base">Please select a group to edit</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 pb-5 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Edit Group: {group.name}</h2>
          <p className="text-base text-gray-600">Modify group settings and manage packages</p>
        </div>
        
        <button 
          type="button" 
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          onClick={onCancel}
        >
          <FaArrowLeft className="w-4 h-4" />
          Back to Dashboard
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
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter a descriptive name for this group"
                maxLength={50}
                disabled={isSubmitting}
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
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Describe the purpose or contents of this group"
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority Selection */}
              <div>
                <label htmlFor="groupPriority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="groupPriority"
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value as GroupPriority)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isSubmitting}
                >
                  <option value={GroupPriority.LOW}>Low Priority</option>
                  <option value={GroupPriority.MEDIUM}>Medium Priority</option>
                  <option value={GroupPriority.HIGH}>High Priority</option>
                  <option value={GroupPriority.URGENT}>Urgent Priority</option>
                </select>
              </div>
              
              {/* Estimated Delivery Date */}
              <div>
                <label htmlFor="estimatedDelivery" className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Delivery *
                </label>
                <div className="relative">
                  <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="estimatedDelivery"
                    type="date"
                    value={formData.estimatedDelivery}
                    onChange={(e) => handleFieldChange('estimatedDelivery', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      errors.estimatedDelivery ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    min={getMinDeliveryDate()}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.estimatedDelivery && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FaExclamationTriangle className="w-3 h-3" />
                    {errors.estimatedDelivery}
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                disabled={isSubmitting || groupPackageIds.size === 0}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating Group...
                  </>
                ) : (
                  <>
                    <FaCheck className="w-4 h-4" />
                    Update Group
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Summary Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Group Statistics */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaBox className="w-5 h-5 text-red-600" />
              Group Statistics
            </h3>
            
            <div className="space-y-3">
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
          </div>

          {/* Package Management */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                Group Packages ({groupPackages.length})
              </h3>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  packagesToAdd.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
                onClick={() => setShowAddPackages(!showAddPackages)}
                disabled={packagesToAdd.length === 0}
              >
                <FaPlus className="w-4 h-4" />
                Add Packages
              </button>
            </div>
            
            {showAddPackages && packagesToAdd.length > 0 && (
              <div className="p-4 bg-red-50 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Available Packages</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {packagesToAdd.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{pkg.trackingNumber}</p>
                        <p className="text-xs text-gray-500 truncate">{pkg.clientName}</p>
                      </div>
                      <button
                        type="button"
                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                        onClick={() => handleAddPackage(pkg.id)}
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="max-h-96 overflow-y-auto">
              {groupPackages.map((pkg) => (
                <div key={pkg.id} className="flex items-start justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{pkg.trackingNumber}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(pkg.status.toLowerCase())}`}>
                        {StatusUtils.formatStatus(pkg.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FaUser className="text-gray-400" />
                        <span>{pkg.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FaMapMarkerAlt className="text-gray-400" />
                        <span className="truncate">{pkg.destination.address || `${pkg.destination.city}, ${pkg.destination.country}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FaWeight className="text-gray-400" />
                        <span>{pkg.weight.toFixed(1)} kg</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    onClick={() => handleRemovePackage(pkg.id)}
                    title="Remove from group"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {groupPackages.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                  <FaBox className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm">No packages in this group</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupEditor;