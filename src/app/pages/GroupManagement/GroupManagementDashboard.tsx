/**
 * GroupManagementDashboard.tsx
 * 
 * Main Admin Group Management Dashboard Component
 * Provides comprehensive interface for managing package groups and batch operations
 * Features multiple views: overview, package selection, group creation, editing, and batch updates
 * 
 * Key Features:
 * - Dashboard overview with statistics and quick actions
 * - Package selection with advanced filtering capabilities
 * - Group creation and editing workflows
 * - Batch status update operations
 * - Real-time data refresh and error handling
 * 
 * @author Senior Software Engineer
 * @version 1.0.0 - Tailwind CSS implementation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FaBox, 
  FaUsers, 
  FaClipboardList, 
  FaSync,
  FaPlus,
  FaEdit,
  FaExclamationTriangle,
  FaHistory
} from 'react-icons/fa';
import type { Package } from '../../core/models/Package';
import { GroupPriority } from '../../core/models/ShipmentGroup';
import type { ShipmentGroup } from '../../core/models/ShipmentGroup';
import type { BatchUpdateData } from '../../core/models/BatchUpdateData';
import { PackageStatus } from '../../core/status/StatusDefinitions';
import { PackageService } from '../../core/services/PackageService';
import { GroupManagementService } from '../../core/services/GroupManagementService';
import { StatusUpdateService } from '../../core/services/StatusUpdateService';
import PackageSelector from './components/PackageSelector';
import GroupCreator from './components/GroupCreator';
import GroupEditor from './components/GroupEditor';
import BatchStatusUpdater from './components/BatchStatusUpdater';

enum DashboardView {
  OVERVIEW = 'overview',
  PACKAGE_SELECTION = 'selection',
  GROUP_CREATION = 'creation',
  GROUP_EDITING = 'editing',
  BATCH_UPDATE = 'batch'
}

interface DashboardStats {
  readonly totalPackages: number;
  readonly readyForGrouping: number;
  readonly groupedPackages: number;
  readonly activeGroups: number;
}

interface GroupCreationData {
  readonly name: string;
  readonly description: string;
  readonly priority: GroupPriority;
  readonly estimatedDelivery: string;
  readonly packageIds: string[];
}

interface GroupUpdateData {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly priority: GroupPriority;
  readonly estimatedDelivery: string;
  readonly packageIds: string[];
}

const GroupManagementDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<DashboardView>(DashboardView.OVERVIEW);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<ShipmentGroup | null>(null);
  const [selectedPackagesForGrouping, setSelectedPackagesForGrouping] = useState<Set<string>>(new Set());
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [groups, setGroups] = useState<ShipmentGroup[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPackages: 0,
    readyForGrouping: 0,
    groupedPackages: 0,
    activeGroups: 0
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadDashboardData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError('');

      const [packagesData, groupsData] = await Promise.all([
        PackageService.getPackages({
          status: [PackageStatus.PROCESSING, PackageStatus.GROUPED],
          limit: 1000
        }),
        GroupManagementService.getAllGroups()
      ]);

      setPackages(packagesData);
      setGroups(groupsData);
      setLastRefresh(new Date());

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const calculateStats = useMemo((): DashboardStats => {
    const totalPackages = packages.length;
    const readyForGrouping = packages.filter(pkg => pkg.status === PackageStatus.PROCESSING).length;
    const groupedPackages = packages.filter(pkg => pkg.status === PackageStatus.GROUPED).length;
    const activeGroups = groups.length;

    return {
      totalPackages,
      readyForGrouping,
      groupedPackages,
      activeGroups
    };
  }, [packages, groups]);

  useEffect(() => {
    setStats(calculateStats);
  }, [calculateStats]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleRefresh = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  const handlePackageSelection = useCallback((packageId: string) => {
    setSelectedPackagesForGrouping(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(packageId)) {
        newSelection.delete(packageId);
      } else {
        newSelection.add(packageId);
      }
      return newSelection;
    });
  }, []);

  const handleBulkSelection = useCallback((packageIds: string[], selected: boolean) => {
    setSelectedPackagesForGrouping(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        packageIds.forEach(id => newSelection.add(id));
      } else {
        packageIds.forEach(id => newSelection.delete(id));
      }
      return newSelection;
    });
  }, []);

  const handleNextStep = useCallback(() => {
    if (selectedPackagesForGrouping.size > 0) {
      setCurrentView(DashboardView.GROUP_CREATION);
    }
  }, [selectedPackagesForGrouping]);

  const handleCreateGroup = useCallback(async (groupData: GroupCreationData) => {
    try {
      await GroupManagementService.createGroup({
        name: groupData.name,
        description: groupData.description,
        priority: groupData.priority,
        estimatedDelivery: groupData.estimatedDelivery,
        packageIds: groupData.packageIds
      });
      await loadDashboardData();
      setCurrentView(DashboardView.OVERVIEW);
      setSelectedPackagesForGrouping(new Set());
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }, [loadDashboardData]);

 const handleUpdateGroup = useCallback(async (updateData: GroupUpdateData) => {
    try {
      await GroupManagementService.updateGroup(updateData);
      await loadDashboardData();
      setCurrentView(DashboardView.OVERVIEW);
      setSelectedGroupForEdit(null);
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }, [loadDashboardData]);

  const handleBatchUpdate = useCallback(async (updateData: BatchUpdateData) => {
    try {
      await StatusUpdateService.batchUpdateGroupStatus(
        updateData.groupIds,
        updateData.targetStatus,
        updateData.updateReason,
        updateData.estimatedCompletion
      );
      await loadDashboardData();
      setCurrentView(DashboardView.OVERVIEW);
    } catch (error) {
      console.error('Error performing batch update:', error);
      throw error;
    }
  }, [loadDashboardData]);

  const handleNavigateToView = useCallback((view: DashboardView, group?: ShipmentGroup) => {
    setCurrentView(view);
    if (view === DashboardView.GROUP_EDITING && group) {
      setSelectedGroupForEdit(group);
    } else {
      setSelectedGroupForEdit(null);
    }
  }, []);

  const handleReturnToOverview = useCallback(() => {
    setCurrentView(DashboardView.OVERVIEW);
    setSelectedGroupForEdit(null);
    setSelectedPackagesForGrouping(new Set());
  }, []);

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
          <FaBox className="w-6 h-6 text-gray-700" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Total Packages</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPackages}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
          <FaClipboardList className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Ready for Grouping</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.readyForGrouping}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <FaUsers className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Grouped Packages</p>
          <p className="text-3xl font-bold text-red-600">{stats.groupedPackages}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
          <FaUsers className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Active Groups</p>
          <p className="text-3xl font-bold text-green-600">{stats.activeGroups}</p>
        </div>
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <div className="bg-red-50 rounded-lg border border-gray-200 p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleNavigateToView(DashboardView.PACKAGE_SELECTION)}
          className="flex items-center justify-center gap-3 px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold text-sm"
          disabled={stats.readyForGrouping === 0}
        >
          <FaPlus className="w-5 h-5" />
          <span>Create Group</span>
        </button>

        <button
          onClick={() => handleNavigateToView(DashboardView.BATCH_UPDATE)}
          className="flex items-center justify-center gap-3 px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold text-sm"
          disabled={stats.activeGroups === 0}
        >
          <FaSync className="w-5 h-5" />
          <span>Batch Update</span>
        </button>

        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-3 px-5 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-semibold text-sm"
          disabled={isRefreshing}
        >
          <FaSync className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>

        <button
          onClick={() => handleNavigateToView(DashboardView.OVERVIEW)}
          className="flex items-center justify-center gap-3 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold text-sm"
        >
          <FaHistory className="w-5 h-5" />
          <span>View History</span>
        </button>
      </div>
    </div>
  );

  const renderRecentGroups = () => (
    <div className="bg-red-50 rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Groups</h3>
        <span className="text-sm text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</span>
      </div>
      
      {groups.length === 0 ? (
        <div className="text-center py-8">
          <FaUsers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No groups created yet</p>
          <p className="text-sm text-gray-400">Create your first group to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.slice(0, 5).map((group) => (
            <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{group.name}</h4>
                <p className="text-sm text-gray-600">{group.packageIds.length} packages</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  group.priority === GroupPriority.URGENT ? 'bg-red-100 text-red-800' :
                  group.priority === GroupPriority.HIGH ? 'bg-orange-100 text-orange-800' :
                  group.priority === GroupPriority.MEDIUM ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {group.priority.toUpperCase()}
                </span>
                <button
                  onClick={() => handleNavigateToView(DashboardView.GROUP_EDITING, group)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-2 focus:outline-red-600 focus:outline-offset-2"
                  title="Edit group"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div>
      {renderStatsCards()}
      {renderQuickActions()}
      {renderRecentGroups()}
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case DashboardView.PACKAGE_SELECTION:
        return (
          <PackageSelector
            packages={packages.filter(pkg => pkg.status === PackageStatus.PROCESSING)}
            selectedPackages={selectedPackagesForGrouping}
            onPackageSelection={handlePackageSelection}
            onBulkSelection={handleBulkSelection}
            onNext={handleNextStep}
            onCancel={handleReturnToOverview}
          />
        );

      case DashboardView.GROUP_CREATION:
        return (
          <GroupCreator
            packages={packages.filter(pkg => pkg.status === PackageStatus.PROCESSING)}
            selectedPackages={Array.from(selectedPackagesForGrouping)}
            onCreateGroup={handleCreateGroup}
            onCancel={handleReturnToOverview}
          />
        );

      case DashboardView.GROUP_EDITING:
        return (
          <GroupEditor
            group={selectedGroupForEdit}
            packages={packages}
            onUpdateGroup={handleUpdateGroup}
            onCancel={handleReturnToOverview}
          />
        );

      case DashboardView.BATCH_UPDATE:
        return (
          <BatchStatusUpdater
            groups={groups}
            packages={packages}
            onBatchUpdate={handleBatchUpdate}
            onCancel={handleReturnToOverview}
          />
        );

      default:
        return renderOverview();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-5 text-slate-500">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-4 border-t-red-600 rounded-full animate-spin mb-4"></div>
        <p className="text-base font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-red-50 min-h-screen font-sans">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-start items-stretch justify-between mb-8 p-6 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900 mb-2 leading-tight">Group Management Dashboard</h1>
          <p className="text-slate-500">Manage package groups and batch operations efficiently</p>
        </div>
        
        {currentView !== DashboardView.OVERVIEW && (
          <button
            onClick={handleReturnToOverview}
            className="mt-4 lg:mt-0 flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-semibold text-sm min-w-[120px] justify-center focus:outline-2 focus:outline-red-600 focus:outline-offset-2"
          >
            <FaHistory className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 py-4 px-5 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium">
          <FaExclamationTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-gray-200 min-h-[400px]">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default GroupManagementDashboard;