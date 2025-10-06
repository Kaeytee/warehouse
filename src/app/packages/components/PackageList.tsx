import React, { useState } from 'react';
import { Search, Filter, Plus, Download } from 'lucide-react';
import PackageCard from './PackageCard';

interface Package {
  id: string;
  trackingNumber: string;
  customerName: string;
  destination: string;
  status: 'received' | 'processing' | 'ready' | 'dispatched' | 'delivered';
  packageType: string;
  weight: number;
  receivedDate: string;
  estimatedDelivery?: string;
  value: number;
}

interface PackageListProps {
  packages?: Package[];
  onAddPackage?: () => void;
  onExportData?: () => void;
}

const PackageList: React.FC<PackageListProps> = ({ 
  packages = [], 
  onAddPackage, 
  onExportData 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Mock data if no packages provided
  const mockPackages: Package[] = [
    {
      id: 'PKG-001',
      trackingNumber: 'TT-2024-001',
      customerName: 'John Doe',
      destination: 'Accra, Ghana',
      status: 'ready',
      packageType: 'Electronics',
      weight: 2.5,
      receivedDate: '2024-01-15T10:00:00Z',
      estimatedDelivery: '2024-01-18T16:00:00Z',
      value: 500
    },
    {
      id: 'PKG-002',
      trackingNumber: 'TT-2024-002',
      customerName: 'Jane Smith',
      destination: 'Kumasi, Ghana',
      status: 'processing',
      packageType: 'Documents',
      weight: 0.5,
      receivedDate: '2024-01-16T14:30:00Z',
      estimatedDelivery: '2024-01-19T10:00:00Z',
      value: 50
    },
    {
      id: 'PKG-003',
      trackingNumber: 'TT-2024-003',
      customerName: 'Mike Johnson',
      destination: 'Tema, Ghana',
      status: 'received',
      packageType: 'Clothing',
      weight: 1.8,
      receivedDate: '2024-01-17T09:15:00Z',
      estimatedDelivery: '2024-01-20T14:00:00Z',
      value: 200
    }
  ];

  const displayPackages = packages.length > 0 ? packages : mockPackages;

  // Filter packages based on search and filters
  const filteredPackages = displayPackages.filter(pkg => {
    const matchesSearch = 
      pkg.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    const matchesType = typeFilter === 'all' || pkg.packageType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handlePackageSelect = (packageId: string) => {
    console.log('Selected package:', packageId);
    // Handle package selection - navigate to details page
  };

  const handlePackageRelease = (packageId: string) => {
    console.log('Release package:', packageId);
    // Handle package release workflow
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Package Management</h1>
          <p className="text-gray-600 mt-1">
            Showing {filteredPackages.length} of {displayPackages.length} packages
          </p>
        </div>
        <div className="flex space-x-3">
          {onExportData && (
            <button
              onClick={onExportData}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          )}
          {onAddPackage && (
            <button
              onClick={onAddPackage}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Statuses</option>
              <option value="received">Received</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Types</option>
              <option value="Electronics">Electronics</option>
              <option value="Documents">Documents</option>
              <option value="Clothing">Clothing</option>
              <option value="Food Items">Food Items</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Package Grid */}
      {filteredPackages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              packageData={pkg}
              onSelect={handlePackageSelect}
              onRelease={handlePackageRelease}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or filters to find packages.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageList;
