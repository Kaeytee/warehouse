# Integration Examples - VanguardCargo Warehouse

Complete code examples for integrating Phase 1 & 2 features into your existing pages.

---

## 📦 **Example 1: Enhanced Package Intake Page**

### **Update your PackageIntake component:**

```tsx
// src/app/pages/PackageIntake/PackageIntake.tsx

import React, { useState } from 'react';
import { FiPackage, FiCheckCircle } from 'react-icons/fi';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';
import { packageIntakeHelper } from '../../../utils/packageIntakeHelper';
import ReceiptViewer from '../../../components/warehouse/ReceiptViewer';

const PackageIntake: React.FC = () => {
  const { userId } = useWarehouseAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    suiteNumber: '',
    description: '',
    weight: '',
    declaredValue: '',
    storeName: '',
    vendorName: '',
    notes: ''
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPackage, setCreatedPackage] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  /**
   * Handle form submission with enhanced intake
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) return;

    setIsSubmitting(true);

    try {
      // Call enhanced intake helper
      const result = await packageIntakeHelper.performEnhancedIntake({
        userSuiteNumber: formData.suiteNumber,
        description: formData.description,
        warehouseStaffId: userId,
        weight: parseFloat(formData.weight) || undefined,
        declaredValue: parseFloat(formData.declaredValue) || undefined,
        storeName: formData.storeName || undefined,
        vendorName: formData.vendorName || undefined,
        notes: formData.notes || undefined,
        autoGenerateCodes: true,      // Generate barcode/QR automatically
        autoGenerateReceipt: true      // Generate receipt automatically
      });

      if (result.success) {
        setCreatedPackage(result);
        setShowSuccess(true);
        
        // Reset form
        setFormData({
          suiteNumber: '',
          description: '',
          weight: '',
          declaredValue: '',
          storeName: '',
          vendorName: '',
          notes: ''
        });

        // Show receipt after 1 second
        setTimeout(() => {
          if (result.receiptData) {
            setShowReceipt(true);
          }
        }, 1000);

      } else {
        alert(`Error: ${result.error}`);
      }

    } catch (error) {
      console.error('Package intake failed:', error);
      alert('Failed to create package. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Package Intake</h1>

      {/* Success Message with Auth Code */}
      {showSuccess && createdPackage && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FiCheckCircle className="text-green-600 text-4xl" />
            <div>
              <h3 className="text-xl font-bold text-green-800">
                Package Created Successfully!
              </h3>
              <p className="text-green-700">
                Package ID: {createdPackage.packageId}
              </p>
            </div>
          </div>

          {/* Prominent Auth Code Display */}
          <div className="bg-purple-100 border-2 border-purple-500 rounded-lg p-6 text-center">
            <p className="text-sm font-semibold text-purple-700 mb-2">
              CUSTOMER DELIVERY CODE
            </p>
            <p className="text-5xl font-bold text-purple-700 tracking-widest mb-2">
              {createdPackage.authCode}
            </p>
            <p className="text-sm text-purple-600">
              Give this code to the customer - Required for package pickup
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowReceipt(true)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              View Receipt
            </button>
            <button
              onClick={() => setShowSuccess(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Your existing form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields... */}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Creating Package...' : 'Create Package'}
        </button>
      </form>

      {/* Receipt Viewer Modal */}
      {showReceipt && createdPackage?.receiptData && (
        <ReceiptViewer
          receipt={createdPackage.receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  );
};

export default PackageIntake;
```

---

## 📋 **Example 2: Add Verification to Package List**

### **Update your package list/table component:**

```tsx
// In your package list component

import React, { useState } from 'react';
import EnhancedPackageDetailModal from '../../../components/warehouse/EnhancedPackageDetailModal';
import PackageVerificationModal from '../../../components/warehouse/PackageVerificationModal';

const PackageList: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  /**
   * Handle package row click
   */
  const handlePackageClick = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowDetails(true);
  };

  /**
   * Handle verification button click
   */
  const handleVerifyClick = (pkg: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    setSelectedPackage(pkg);
    setShowVerification(true);
  };

  /**
   * Handle successful verification
   */
  const handleVerificationSuccess = () => {
    // Refresh package list
    loadPackages();
    setShowVerification(false);
  };

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr>
            <th>Package ID</th>
            <th>Tracking</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr 
              key={pkg.id}
              onClick={() => handlePackageClick(pkg)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td>{pkg.package_id}</td>
              <td>{pkg.tracking_number}</td>
              <td>{pkg.status}</td>
              <td onClick={(e) => e.stopPropagation()}>
                {/* Show verify button only for arrived packages */}
                {pkg.status === 'arrived' && (
                  <button
                    onClick={(e) => handleVerifyClick(pkg, e)}
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                  >
                    Verify Delivery
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Enhanced Package Detail Modal */}
      {showDetails && selectedPackage && (
        <EnhancedPackageDetailModal
          packageData={selectedPackage}
          onClose={() => setShowDetails(false)}
          onUpdate={loadPackages}
        />
      )}

      {/* Verification Modal */}
      {showVerification && selectedPackage && (
        <PackageVerificationModal
          packageId={selectedPackage.id}
          packageTrackingNumber={selectedPackage.tracking_number}
          onSuccess={handleVerificationSuccess}
          onClose={() => setShowVerification(false)}
        />
      )}
    </div>
  );
};
```

---

## 🚚 **Example 3: Add Shipment Detail View**

### **Update your ShipmentHistory page:**

```tsx
// src/app/pages/ShipmentHistory/ShipmentHistory.tsx

import React, { useState } from 'react';
import ConsolidatedShipmentView from '../../../components/warehouse/ConsolidatedShipmentView';
import BarcodeQRDisplay from '../../../components/warehouse/BarcodeQRDisplay';

const ShipmentHistory: React.FC = () => {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [showShipmentView, setShowShipmentView] = useState(false);

  /**
   * Handle shipment row click
   */
  const handleShipmentClick = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    setShowShipmentView(true);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Shipment History</h1>

      <table className="w-full">
        <thead>
          <tr>
            <th>Tracking Number</th>
            <th>Packages</th>
            <th>Status</th>
            <th>Barcode</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((shipment) => (
            <tr 
              key={shipment.id}
              onClick={() => handleShipmentClick(shipment.id)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="font-mono">{shipment.tracking_number}</td>
              <td>{shipment.total_packages} packages</td>
              <td>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {shipment.status}
                </span>
              </td>
              <td onClick={(e) => e.stopPropagation()}>
                {/* Inline barcode display */}
                {shipment.barcode_data && (
                  <img 
                    src={shipment.barcode_data} 
                    alt="Barcode" 
                    className="h-12"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Consolidated Shipment View Modal */}
      {showShipmentView && selectedShipmentId && (
        <ConsolidatedShipmentView
          shipmentId={selectedShipmentId}
          onClose={() => setShowShipmentView(false)}
        />
      )}
    </div>
  );
};
```

---

## 🔐 **Example 4: Add Verification Logs to Admin Menu**

### **Update your routing:**

```tsx
// src/App.tsx or routes file

import { Route } from 'react-router-dom';
import VerificationLogsDashboard from './components/warehouse/VerificationLogsDashboard';

// Add route
<Route 
  path="/admin/verification-logs" 
  element={<VerificationLogsDashboard />} 
/>
```

### **Update your sidebar navigation:**

```tsx
// src/components/layout/Sidebar.tsx

const adminMenuItems = [
  // ... existing items
  {
    path: '/admin/verification-logs',
    label: 'Verification Logs',
    icon: <FiShield />,
    roles: ['admin', 'super_admin', 'warehouse_admin']
  }
];
```

---

## 📦 **Example 5: Status Update with Verification**

### **Update status change logic:**

```tsx
// In your package status update component

import React, { useState } from 'react';
import PackageVerificationModal from '../../../components/warehouse/PackageVerificationModal';

const PackageStatusUpdate: React.FC<{ package: any }> = ({ package: pkg }) => {
  const [showVerification, setShowVerification] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  /**
   * Handle status change
   * Requires verification for arrived -> delivered transition
   */
  const handleStatusChange = async (newStatus: string) => {
    // Check if verification is required
    if (pkg.status === 'arrived' && newStatus === 'delivered') {
      // Store pending status and show verification modal
      setPendingStatus(newStatus);
      setShowVerification(true);
      return;
    }

    // Update status directly for other transitions
    await updatePackageStatus(pkg.id, newStatus);
  };

  /**
   * Handle successful verification
   */
  const handleVerificationSuccess = async () => {
    // Status is already updated by verification
    // Just refresh and close
    setShowVerification(false);
    setPendingStatus(null);
    onUpdate();
  };

  return (
    <div>
      <select 
        value={pkg.status}
        onChange={(e) => handleStatusChange(e.target.value)}
        className="border rounded px-3 py-2"
      >
        <option value="received">Received</option>
        <option value="processing">Processing</option>
        <option value="arrived">Arrived</option>
        <option value="delivered">Delivered</option>
      </select>

      {/* Verification Modal */}
      {showVerification && (
        <PackageVerificationModal
          packageId={pkg.id}
          packageTrackingNumber={pkg.tracking_number}
          onSuccess={handleVerificationSuccess}
          onClose={() => {
            setShowVerification(false);
            setPendingStatus(null);
          }}
        />
      )}
    </div>
  );
};
```

---

## 🛠️ **Example 6: Batch Generate Codes for Existing Packages**

### **Migration script or admin utility:**

```tsx
// Admin utility component for one-time migration

import React, { useState } from 'react';
import { packageIntakeHelper } from '../../../utils/packageIntakeHelper';
import { supabase } from '../../../lib/supabase';
import { useWarehouseAuth } from '../../../hooks/useWarehouseAuth';

const BatchCodeGeneration: React.FC = () => {
  const { userId } = useWarehouseAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [result, setResult] = useState<any>(null);

  const handleBatchGenerate = async () => {
    if (!userId) return;

    setIsProcessing(true);
    setResult(null);

    try {
      // Get all packages without codes
      const { data: packages, error } = await supabase
        .from('packages')
        .select('id, tracking_number')
        .is('barcode_data', null)
        .limit(100); // Process in batches

      if (error) throw error;

      if (!packages || packages.length === 0) {
        alert('No packages found without codes');
        return;
      }

      // Generate codes for all
      const batchResult = await packageIntakeHelper.batchGenerateCodes(
        packages,
        userId,
        (completed, total) => {
          setProgress({ completed, total });
        }
      );

      setResult(batchResult);
      alert(`Generated codes for ${batchResult.successful} packages!`);

    } catch (error) {
      console.error('Batch generation failed:', error);
      alert('Failed to generate codes');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        Batch Code Generation
      </h2>
      <p className="text-gray-600 mb-6">
        Generate barcodes and QR codes for existing packages
      </p>

      <button
        onClick={handleBatchGenerate}
        disabled={isProcessing}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isProcessing ? 'Processing...' : 'Generate Codes for All Packages'}
      </button>

      {isProcessing && (
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-semibold mb-2">
              Progress: {progress.completed} / {progress.total}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ 
                  width: `${(progress.completed / progress.total) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-bold mb-2">Results:</h3>
          <p>✅ Successful: {result.successful}</p>
          <p>❌ Failed: {result.failed}</p>
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="font-semibold">Errors:</p>
              <ul className="list-disc list-inside text-sm">
                {result.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchCodeGeneration;
```

---

## 🎯 **Quick Integration Checklist**

### **Step 1: Update Package Intake**
```bash
✅ Import packageIntakeHelper
✅ Replace old intake function
✅ Display auth code prominently
✅ Show receipt automatically
```

### **Step 2: Add Package Details Modal**
```bash
✅ Import EnhancedPackageDetailModal
✅ Add click handler to package rows
✅ Show modal on click
```

### **Step 3: Add Shipment View**
```bash
✅ Import ConsolidatedShipmentView
✅ Add click handler to shipment rows
✅ Show modal with shipment details
```

### **Step 4: Add Verification**
```bash
✅ Import PackageVerificationModal
✅ Check status before delivery
✅ Show verification modal
✅ Update after success
```

### **Step 5: Add Admin Dashboard**
```bash
✅ Import VerificationLogsDashboard
✅ Add route
✅ Add to sidebar menu
```

---

## 📚 **Additional Resources**

- **IMPLEMENTATION_GUIDE.md** - Complete technical documentation
- **PHASE1_COMPLETION_SUMMARY.md** - Backend features reference
- **PHASE2_COMPLETION_SUMMARY.md** - Frontend components reference

---

**Need Help?** All components have comprehensive inline comments. Check the component files for detailed usage examples.
