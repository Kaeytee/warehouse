import React from 'react';
import { Package, MapPin, Calendar, User, Tag } from 'lucide-react';

interface PackageCardProps {
  packageData: {
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
  };
  onSelect?: (packageId: string) => void;
  onRelease?: (packageId: string) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ packageData, onSelect, onRelease }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'dispatched':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <Package className="h-5 w-5 text-red-600 mr-2" />
          <div>
            <h3 className="font-semibold text-gray-900">{packageData.trackingNumber}</h3>
            <p className="text-sm text-gray-600">{packageData.id}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(packageData.status)}`}>
          {formatStatus(packageData.status)}
        </span>
      </div>

      {/* Package Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <User className="h-4 w-4 mr-2" />
          <span className="font-medium">{packageData.customerName}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{packageData.destination}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Tag className="h-4 w-4 mr-2" />
          <span>{packageData.packageType} • {packageData.weight}kg</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Received: {new Date(packageData.receivedDate).toLocaleDateString()}</span>
        </div>

        {packageData.estimatedDelivery && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Est. Delivery: {new Date(packageData.estimatedDelivery).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <span className="text-sm font-medium text-gray-700">
          Declared Value: ₵{packageData.value.toLocaleString()}
        </span>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => onSelect?.(packageData.id)}
          className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
        >
          View Details
        </button>
        {packageData.status === 'ready' && (
          <button
            onClick={() => onRelease?.(packageData.id)}
            className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors text-sm font-medium"
          >
            Release Package
          </button>
        )}
      </div>
    </div>
  );
};

export default PackageCard;
