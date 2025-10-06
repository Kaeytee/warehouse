/**
 * Customer Service and Package Release Types
 * Defines customer identification and package release processes
 */

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  nationalId?: string;
  registrationDate: string;
  isActive: boolean;
  totalPackages: number;
  lastActivity: string;
}

export interface CustomerLookupQuery {
  customerId?: string;
  phoneNumber?: string;
  emailAddress?: string;
  nationalId?: string;
  trackingNumber?: string;
}

export interface CustomerLookupResult {
  customer: Customer;
  packages: CustomerPackage[];
  shipments: CustomerShipment[];
  releaseHistory: PackageRelease[];
}

export interface CustomerPackage {
  id: string;
  trackingNumber: string;
  status: PackageStatus;
  shipmentId?: string;
  shipmentNumber?: string;
  estimatedArrival: string;
  actualArrival?: string;
  currentLocation: string;
  readyForPickup: boolean;
  canBeReleased: boolean;
  value: number;
  currency: string;
  specialRequirements: string[];
  documents: PackageDocument[];
}

export interface CustomerShipment {
  id: string;
  shipmentNumber: string;
  status: ShipmentStatus;
  packageCount: number;
  customerPackageCount: number;
  estimatedDelivery: string;
  actualArrival?: string;
  origin: string;
  destination: string;
}

export interface PackageReleaseEligibility {
  eligible: boolean;
  requirements: {
    statusCheck: boolean;
    paymentCheck: boolean;
    identityCheck: boolean;
    locationCheck: boolean;
    documentationCheck: boolean;
  };
  blockers: string[];
  actions: string[];
  authorizationLevel: AuthorizationLevel;
}

export type AuthorizationLevel = 
  | 'WORKER'
  | 'SPECIALIST' 
  | 'MANAGER'
  | 'ADMIN';

export interface IdentityVerification {
  method: VerificationMethod;
  value: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export type VerificationMethod = 
  | 'PHONE_SMS'
  | 'EMAIL_CODE'
  | 'PHOTO_ID'
  | 'BIOMETRIC'
  | 'SECONDARY_CONTACT';

export interface PackageRelease {
  id: string;
  packageId: string;
  customerId: string;
  sessionId: string;
  
  // Staff Information
  releasingStaffId: string;
  releasingStaffName: string;
  witnessStaffId?: string;
  witnessStaffName?: string;
  managerApprovalId?: string;
  managerApprovalName?: string;
  
  // Verification Details
  identityVerifications: IdentityVerification[];
  photoIdCaptured: boolean;
  
  // Documentation
  customerSignature?: string; // Base64
  staffSignature?: string; // Base64
  customerPhoto?: string; // Base64
  packagePhotos: string[]; // Base64 array
  
  // Release Details
  releaseType: ReleaseType;
  releaseReason: string;
  releaseNotes?: string;
  
  // Timing
  initiatedAt: string;
  completedAt?: string;
  
  // Status
  status: ReleaseStatus;
}

export type ReleaseType = 
  | 'NORMAL_PICKUP'
  | 'EARLY_RELEASE'
  | 'SPECIAL_CIRCUMSTANCES'
  | 'EMERGENCY_RELEASE';

export type ReleaseStatus = 
  | 'INITIATED'
  | 'IDENTITY_VERIFIED'
  | 'AUTHORIZED'
  | 'DOCUMENTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ReleaseSession {
  id: string;
  customerId: string;
  staffId: string;
  packageIds: string[];
  status: ReleaseStatus;
  startedAt: string;
  steps: ReleaseStep[];
  currentStep: number;
}

export interface ReleaseStep {
  step: number;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  startedAt?: string;
  completedAt?: string;
  data?: Record<string, unknown>;
}

export interface PackageDocument {
  id: string;
  type: DocumentType;
  filename: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  verified: boolean;
}

export type DocumentType = 
  | 'CUSTOMS_FORM'
  | 'INVOICE'
  | 'PACKING_LIST'
  | 'CERTIFICATE'
  | 'PHOTO'
  | 'SIGNATURE'
  | 'ID_DOCUMENT';

// Package and Shipment Status Types (imported from package.ts)
export type PackageStatus = 
  | 'AWAITING_PICKUP'
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'GROUPED'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'CUSTOMS_CLEARANCE'
  | 'ARRIVED'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED'
  | 'EXCEPTION';

export type ShipmentStatus = 
  | 'CREATED'
  | 'PREPARING'
  | 'READY'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'DELAYED'
  | 'CANCELLED';
