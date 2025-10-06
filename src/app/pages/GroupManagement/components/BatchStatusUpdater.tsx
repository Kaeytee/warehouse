import React, { useState, useMemo, useCallback } from 'react';
import { 
  FaSync, 
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaExclamationTriangle,
  FaBox,
  FaUsers,
  FaHistory,
  FaFilter,
  FaSearch
} from 'react-icons/fa';
import type { ShipmentGroup } from '../../../core/models/ShipmentGroup';
import type { Package } from '../../../core/models/Package';
import { 
  PackageStatus, 
  StatusUtils,
  getValidStatusTransitions 
} from '../../../core/status/StatusDefinitions';
import { GroupStatus } from '../../../core/models/ShipmentGroup';
import type { BatchUpdateData } from '../../../core/models/BatchUpdateData';

interface BatchStatusUpdaterProps {
  readonly groups: ShipmentGroup[];
  readonly packages: Package[];
  readonly onBatchUpdate: (updateData: BatchUpdateData) => Promise<void>;
  readonly onCancel: () => void;
}

interface GroupFilter {
  readonly search: string;
  readonly status: string | 'all';
  readonly priority: string;
}

interface UpdateProgress {
  readonly total: number;
  readonly completed: number;
  readonly current: string;
  readonly errors: string[];
}

const BatchStatusUpdater: React.FC<BatchStatusUpdaterProps> = ({
  groups,
  packages,
  onBatchUpdate,
  onCancel
}) => {
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [targetStatus, setTargetStatus] = useState<GroupStatus | ''>('');
  const [updateReason, setUpdateReason] = useState<string>('');
  const [estimatedCompletion, setEstimatedCompletion] = useState<string>('');
  const [filter, setFilter] = useState<GroupFilter>({
    search: '',
    status: 'all',
    priority: 'all'
  });
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateProgress, setUpdateProgress] = useState<UpdateProgress | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const matchesName = group.name.toLowerCase().includes(searchTerm);
        const matchesDescription = group.description?.toLowerCase().includes(searchTerm) || false;
        if (!matchesName && !matchesDescription) return false;
      }
      
      if (filter.status !== 'all') {
        const groupPackages = packages.filter(pkg => group.packageIds.includes(pkg.id));
        const hasStatus = groupPackages.some(pkg => pkg.status === filter.status);
        if (!hasStatus) return false;
      }
      
      if (filter.priority !== 'all') {
        if (group.priority !== filter.priority) return false;
      }
      
      return true;
    });
  }, [groups, packages, filter]);

  const selectedGroups = useMemo(() => {
    return filteredGroups.filter(group => selectedGroupIds.has(group.id));
  }, [filteredGroups, selectedGroupIds]);

  const affectedPackages = useMemo(() => {
    const packageIds = new Set<string>();
    selectedGroups.forEach(group => {
      group.packageIds.forEach(id => packageIds.add(id));
    });
    return packages.filter(pkg => packageIds.has(pkg.id));
  }, [selectedGroups, packages]);

  const validStatuses = useMemo(() => {
    if (affectedPackages.length === 0) return [];
    
    const allValidStatuses = affectedPackages.map(pkg => 
      getValidStatusTransitions(pkg.status)
    );
    
    if (allValidStatuses.length === 0) return [];
    
    const packageToGroupStatus = (status: PackageStatus): GroupStatus => {
      switch(status) {
        case PackageStatus.PENDING: return 'pending_confirmation' as GroupStatus;
        case PackageStatus.PROCESSING: return 'draft' as GroupStatus;
        case PackageStatus.READY_FOR_GROUPING: return 'draft' as GroupStatus;
        case PackageStatus.GROUPED: return 'confirmed' as GroupStatus;
        case PackageStatus.GROUP_CONFIRMED: return 'confirmed' as GroupStatus;
        case PackageStatus.DISPATCHED: return 'dispatched' as GroupStatus;
        case PackageStatus.IN_TRANSIT: return 'in_transit' as GroupStatus;
        case PackageStatus.OUT_FOR_DELIVERY: return 'delivering' as GroupStatus;
        case PackageStatus.DELIVERED: return 'completed' as GroupStatus;
        case PackageStatus.DELAYED: return 'delayed' as GroupStatus;
        case PackageStatus.RETURNED: return 'returned' as GroupStatus;
        case PackageStatus.LOST: return 'exception' as GroupStatus;
        case PackageStatus.EXCEPTION: return 'exception' as GroupStatus;
        case PackageStatus.CANCELLED: return 'cancelled' as GroupStatus;
        default: return 'draft' as GroupStatus;
      }
    };
    
    const commonPackageStatuses = allValidStatuses.reduce((common, current) => 
      common.filter(status => current.includes(status))
    );
    
    return commonPackageStatuses.map(packageToGroupStatus);
  }, [affectedPackages]);

  const updateStats = useMemo(() => {
    const totalPackages = affectedPackages.length;
    const totalGroups = selectedGroups.length;
    
    const statusCounts = affectedPackages.reduce((counts, pkg) => {
      counts[pkg.status] = (counts[pkg.status] || 0) + 1;
      return counts;
    }, {} as Record<PackageStatus, number>);
    
    const priorityCounts = selectedGroups.reduce((counts, group) => {
      counts[group.priority] = (counts[group.priority] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return {
      totalPackages,
      totalGroups,
      statusCounts,
      priorityCounts
    };
  }, [affectedPackages, selectedGroups]);

  const handleGroupToggle = useCallback((groupId: string) => {
    setSelectedGroupIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllToggle = useCallback(() => {
    const allSelected = filteredGroups.every(group => selectedGroupIds.has(group.id));
    
    if (allSelected) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(filteredGroups.map(group => group.id)));
    }
  }, [filteredGroups, selectedGroupIds]);

  const handleFilterChange = useCallback(<K extends keyof GroupFilter>(
    field: K,
    value: GroupFilter[K]
  ) => {
    setFilter(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const validateUpdate = useCallback((): string => {
    if (selectedGroupIds.size === 0) {
      return 'Please select at least one group to update';
    }
    
    if (!targetStatus) {
      return 'Please select a target status';
    }
    
    if (!validStatuses.includes(targetStatus as GroupStatus)) {
      return 'Selected status is not valid for all selected packages';
    }
    
    return '';
  }, [selectedGroupIds.size, targetStatus, validStatuses]);

  const handleConfirmUpdate = useCallback(() => {
    const validationError = validateUpdate();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    setShowConfirmation(true);
  }, [validateUpdate]);

  const handleExecuteUpdate = useCallback(async () => {
    if (!targetStatus) return;
    
    setIsUpdating(true);
    setShowConfirmation(false);
    setUpdateProgress({
      total: selectedGroupIds.size,
      completed: 0,
      current: 'Preparing batch update...',
      errors: []
    });
    
    try {
      const updateData: BatchUpdateData = {
        groupIds: Array.from(selectedGroupIds),
        targetStatus: targetStatus as GroupStatus,
        updateReason: updateReason.trim() || undefined,
        estimatedCompletion: estimatedCompletion || undefined
      };
      
      setUpdateProgress(prev => prev ? {
        ...prev,
        current: 'Executing batch update...'
      } : null);
      
      await onBatchUpdate(updateData);
      
      setUpdateProgress(prev => prev ? {
        ...prev,
        completed: prev.total,
        current: 'Batch update completed successfully!'
      } : null);
      
      setTimeout(() => {
        setSelectedGroupIds(new Set());
        setTargetStatus('');
        setUpdateReason('');
        setEstimatedCompletion('');
        setUpdateProgress(null);
        setIsUpdating(false);
      }, 2000);
      
    } catch (error) {
      console.error('Batch update failed:', error);
      setUpdateProgress(prev => prev ? {
        ...prev,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
      } : null);
      setIsUpdating(false);
    }
  }, [selectedGroupIds, targetStatus, updateReason, estimatedCompletion, onBatchUpdate]);

  const getMinCompletionDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const renderGroupSelection = () => (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-5">
        <div className="mb-4 md:mb-0">
          <h3 className="text-lg font-semibold text-gray-900">Select Groups ({selectedGroupIds.size} selected)</h3>
          <p className="text-sm text-gray-500">Choose groups to update with the new status</p>
        </div>
        
        <button
          type="button"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={handleSelectAllToggle}
          disabled={filteredGroups.length === 0}
        >
          {filteredGroups.every(group => selectedGroupIds.has(group.id)) ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={filter.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filter.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending_confirmation">Pending Confirmation</option>
          <option value="confirmed">Confirmed</option>
          <option value="assigned">Assigned</option>
          <option value="loading">Loading</option>
          <option value="dispatched">Dispatched</option>
          <option value="in_transit">In Transit</option>
          <option value="delivering">Delivering</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="delayed">Delayed</option>
          <option value="exception">Exception</option>
          <option value="returned">Returned</option>
        </select>
        
        <select
          value={filter.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
          <option value="urgent">Urgent Priority</option>
        </select>
      </div>
      
      <div className="border border-gray-200 rounded-lg bg-white max-h-[500px] overflow-y-auto">
        {filteredGroups.map((group) => {
          const groupPackages = packages.filter(pkg => group.packageIds.includes(pkg.id));
          const isSelected = selectedGroupIds.has(group.id);
          
          return (
            <div
              key={group.id}
              className={`flex items-start p-4 gap-4 border-b border-gray-100 cursor-pointer transition-colors ${
                isSelected ? 'bg-red-50 border-l-4 border-l-red-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleGroupToggle(group.id)}
            >
              <div className="mt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleGroupToggle(group.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h4 className="text-base font-semibold text-gray-900">{group.name}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    group.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    group.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    group.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {group.priority.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FaBox className="text-gray-400 text-xs" />
                    {groupPackages.length} packages
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FaHistory className="text-gray-400 text-xs" />
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredGroups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <FaFilter className="text-3xl text-gray-300 mb-3" />
            <p>No groups match the current filters</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUpdateConfig = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">Update Configuration</h3>
      
      <div className="space-y-5 mb-6">
        <div>
          <label htmlFor="targetStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Target Status *
          </label>
          <select
            id="targetStatus"
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value as GroupStatus)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={isUpdating}
          >
            <option value="">Select target status</option>
            {validStatuses.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="updateReason" className="block text-sm font-medium text-gray-700 mb-1">
            Update Reason (Optional)
          </label>
          <textarea
            id="updateReason"
            value={updateReason}
            onChange={(e) => setUpdateReason(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Provide a reason for this batch update..."
            rows={3}
            maxLength={200}
            disabled={isUpdating}
          />
          <div className="text-xs text-gray-500 text-right">
            {updateReason.length}/200 characters
          </div>
        </div>
        
        <div>
          <label htmlFor="estimatedCompletion" className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Completion (Optional)
          </label>
          <input
            id="estimatedCompletion"
            type="date"
            value={estimatedCompletion}
            onChange={(e) => setEstimatedCompletion(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            min={getMinCompletionDate()}
            disabled={isUpdating}
          />
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Update Summary</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FaUsers className="text-gray-400 text-sm" />
            <span className="text-sm text-gray-600">{updateStats.totalGroups} groups selected</span>
          </div>
          <div className="flex items-center gap-2">
            <FaBox className="text-gray-400 text-sm" />
            <span className="text-sm text-gray-600">{updateStats.totalPackages} packages affected</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmationModal = () => {
    if (!showConfirmation) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setShowConfirmation(false)}
        />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Confirm Batch Update</h3>
            <button
              type="button"
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              onClick={() => setShowConfirmation(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="p-5">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-5">
              <FaExclamationTriangle className="text-yellow-600 mt-0.5" />
              <p className="text-yellow-800 text-sm">
                You are about to update <strong>{updateStats.totalGroups} groups</strong> and{' '}
                <strong>{updateStats.totalPackages} packages</strong> to status{' '}
                <strong>{StatusUtils.formatStatus(targetStatus as PackageStatus)}</strong>.
              </p>
            </div>
            
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">This action will:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>Update the status of all packages in selected groups</li>
                <li>Create new tracking points for status changes</li>
                <li>Update group modification timestamps</li>
                <li>Generate status history entries</li>
              </ul>
            </div>
            
            {updateReason && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Update Reason:</h4>
                <p className="text-sm text-gray-600">{updateReason}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 p-5 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              onClick={handleExecuteUpdate}
            >
              <FaCheck />
              Confirm Update
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUpdateProgress = () => {
    if (!updateProgress) return null;
    
    const progressPercentage = (updateProgress.completed / updateProgress.total) * 100;
    
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Updating Groups...</h3>
          <span className="text-gray-500 text-sm">
            {updateProgress.completed} of {updateProgress.total} completed
          </span>
        </div>
        
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <p className="text-gray-700 mb-6">{updateProgress.current}</p>
        
        {updateProgress.errors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <h4 className="text-red-700 font-medium mb-3">Errors:</h4>
            <ul className="list-disc pl-5 text-red-700 text-sm">
              {updateProgress.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Batch Status Update</h2>
          <p className="text-gray-600">Update multiple groups and packages simultaneously</p>
        </div>
        
        <button 
          type="button" 
          className="mt-4 lg:mt-0 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          onClick={onCancel}
        >
          <FaArrowLeft />
          Back to Dashboard
        </button>
      </div>
      
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}
      
      {updateProgress ? (
        renderUpdateProgress()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          <div>
            {renderGroupSelection()}
          </div>
          
          <div className="space-y-6">
            {renderUpdateConfig()}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                className="px-5 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-2"
                onClick={onCancel}
                disabled={isUpdating}
              >
                <FaTimes />
                Cancel
              </button>
              
              <button
                type="button"
                className="px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleConfirmUpdate}
                disabled={isUpdating || selectedGroupIds.size === 0 || !targetStatus}
              >
                <FaSync />
                Update {selectedGroupIds.size} Group{selectedGroupIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {renderConfirmationModal()}
    </div>
  );
};

export default BatchStatusUpdater;