/**
 * StatusLocationMapping.ts
 * 
 * Centralized location mapping system for status-based tracking illusions
 * This file maps package statuses to geographic locations for OpenStreetMap integration
 * Creates realistic tracking experience without real-time GPS tracking
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { PackageStatus } from './StatusDefinitions';

/**
 * Geographic coordinate interface
 * Standard structure for latitude/longitude coordinates
 */
export interface LocationCoordinate {
  readonly latitude: number;          // Latitude coordinate
  readonly longitude: number;         // Longitude coordinate
  readonly accuracy?: number;         // Accuracy in meters (optional)
}

/**
 * Location point interface with full address information
 * Complete location data for tracking display
 */
export interface LocationPoint extends LocationCoordinate {
  state: any;
  facilityName: string;
  readonly address: string;           // Full street address
  readonly city: string;              // City name
  readonly region: string;            // State/region
  readonly country: string;           // Country name
  readonly postalCode?: string;       // Postal/ZIP code (optional)
  readonly landmark?: string;         // Notable landmark (optional)
  readonly facilityType: FacilityType; // Type of facility at this location
  
  // Routing metadata (optional properties used in route generation)
  readonly estimatedArrival?: string;  // Estimated arrival time at this location
  readonly expectedStatus?: PackageStatus; // Expected package status at this location
  readonly isMajorHub?: boolean;      // Whether this is a major cargo hub
}

/**
 * Facility type values
 * Categorizes different types of locations in the cargo network
 */
export const FacilityTypeValues = {
  WAREHOUSE: 'warehouse' as const,           // Main warehouse facility
  SORTING_CENTER: 'sorting_center' as const, // Package sorting facility
  DISTRIBUTION_HUB: 'distribution_hub' as const, // Regional distribution center
  DELIVERY_HUB: 'delivery_hub' as const,     // Local delivery center
  TRANSIT_POINT: 'transit_point' as const,   // Waypoint during transit
  CUSTOMER_LOCATION: 'customer_location' as const // Final delivery destination
} as const;

/**
 * Facility type type definition
 * Type-only construct for TypeScript type checking
 */
export type FacilityType = typeof FacilityTypeValues[keyof typeof FacilityTypeValues];

/**
 * Status location mapping interface
 * Links package statuses to specific geographic locations
 */
export interface StatusLocationMapping {
  readonly status: PackageStatus;     // Package status
  readonly location: LocationPoint;   // Geographic location
  readonly description: string;       // Human-readable description
  readonly estimatedDuration: number; // Time spent at this location (hours)
  readonly isVisible: boolean;        // Whether to show on customer tracking
  readonly icon: string;              // Map marker icon identifier
  readonly nextLocations?: LocationPoint[]; // Possible next locations
}

/**
 * Vanguard Cargo facility locations in Ghana
 * Real geographic coordinates for authentic tracking experience
 */
export const Vanguard_FACILITIES: Record<string, LocationPoint> = {
  // Main warehouse and headquarters
  ACCRA_MAIN_WAREHOUSE: {
    latitude: 5.6037,
    longitude: -0.1870,
    address: 'Vanguard Cargo Warehouse, Industrial Area',
    city: 'Accra',
    region: 'Greater Accra',
    country: 'Ghana',
    postalCode: 'GA-039-0001',
    landmark: 'Near Tema Station',
    facilityType: FacilityTypeValues.WAREHOUSE,
    facilityName: '',
    state: undefined
  },
  
  // Regional sorting centers
  ACCRA_SORTING_CENTER: {
    latitude: 5.6108,
    longitude: -0.1821,
    address: 'Vanguard Sorting Center, Spintex Road',
    city: 'Accra',
    region: 'Greater Accra',
    country: 'Ghana',
    postalCode: 'GA-039-0002',
    landmark: 'Spintex Road Junction',
    facilityType: FacilityTypeValues.SORTING_CENTER,
    facilityName: '',
    state: undefined
  },
  
  KUMASI_DISTRIBUTION_HUB: {
    latitude: 6.6885,
    longitude: -1.6244,
    address: 'Vanguard Distribution Hub, Adum',
    city: 'Kumasi',
    region: 'Ashanti',
    country: 'Ghana',
    postalCode: 'AK-039-5432',
    landmark: 'Near Kejetia Market',
    facilityType: FacilityTypeValues.DISTRIBUTION_HUB,
    facilityName: '',
    state: undefined
  },
  
  TAMALE_DELIVERY_HUB: {
    latitude: 9.4034,
    longitude: -0.8424,
    address: 'Vanguard Delivery Hub, Central Market Area',
    city: 'Tamale',
    region: 'Northern',
    country: 'Ghana',
    postalCode: 'NR-039-7890',
    landmark: 'Central Market',
    facilityType: FacilityTypeValues.DELIVERY_HUB,
    facilityName: '',
    state: undefined
  },
  
  CAPE_COAST_DELIVERY_HUB: {
    latitude: 5.1053,
    longitude: -1.2466,
    address: 'Vanguard Delivery Hub, Commercial Street',
    city: 'Cape Coast',
    region: 'Central',
    country: 'Ghana',
    postalCode: 'CR-039-2468',
    landmark: 'Near Cape Coast Castle',
    facilityType: FacilityTypeValues.DELIVERY_HUB,
    facilityName: '',
    state: undefined
  },
  
  // Transit waypoints for realistic tracking
  ACCRA_TEMA_HIGHWAY: {
    latitude: 5.6391,
    longitude: -0.0829,
    address: 'Accra-Tema Highway, Mile 7',
    city: 'Tema',
    region: 'Greater Accra',
    country: 'Ghana',
    landmark: 'Highway Mile 7',
    facilityType: FacilityTypeValues.TRANSIT_POINT,
    facilityName: '',
    state: undefined
  },
  
  KUMASI_HIGHWAY_JUNCTION: {
    latitude: 6.2084,
    longitude: -1.0901,
    address: 'Accra-Kumasi Highway, Nsawam Junction',
    city: 'Nsawam',
    region: 'Eastern',
    country: 'Ghana',
    landmark: 'Highway Junction',
    facilityType: FacilityTypeValues.TRANSIT_POINT,
    facilityName: '',
    state: undefined
  }
};

/**
 * Comprehensive status-to-location mapping
 * Defines where packages appear on the map for each status
 */
export const STATUS_LOCATION_MAPPINGS: StatusLocationMapping[] = [
  // 🔄 INTAKE PHASE LOCATIONS
  {
    status: PackageStatus.PENDING,
    location: Vanguard_FACILITIES.ACCRA_MAIN_WAREHOUSE,
    description: 'Package request received at main warehouse',
    estimatedDuration: 24,
    isVisible: true,
    icon: 'warehouse',
    nextLocations: [Vanguard_FACILITIES.ACCRA_SORTING_CENTER]
  },
  
  {
    status: PackageStatus.PROCESSING,
    location: Vanguard_FACILITIES.ACCRA_MAIN_WAREHOUSE,
    description: 'Package being processed and prepared for shipment',
    estimatedDuration: 12,
    isVisible: true,
    icon: 'processing',
    nextLocations: [Vanguard_FACILITIES.ACCRA_SORTING_CENTER]
  },
  
  // 📋 GROUPING PHASE LOCATIONS
  {
    status: PackageStatus.READY_FOR_GROUPING,
    location: Vanguard_FACILITIES.ACCRA_SORTING_CENTER,
    description: 'Package ready for grouping at sorting facility',
    estimatedDuration: 6,
    isVisible: false, // Internal status, not shown to customers
    icon: 'sorting',
    nextLocations: [Vanguard_FACILITIES.ACCRA_SORTING_CENTER]
  },
  
  {
    status: PackageStatus.GROUPED,
    location: Vanguard_FACILITIES.ACCRA_SORTING_CENTER,
    description: 'Package grouped with other shipments for efficient delivery',
    estimatedDuration: 4,
    isVisible: true,
    icon: 'grouped',
    nextLocations: [
      Vanguard_FACILITIES.KUMASI_DISTRIBUTION_HUB,
      Vanguard_FACILITIES.TAMALE_DELIVERY_HUB,
      Vanguard_FACILITIES.CAPE_COAST_DELIVERY_HUB
    ]
  },
  
  {
    status: PackageStatus.GROUP_CONFIRMED,
    location: Vanguard_FACILITIES.ACCRA_SORTING_CENTER,
    description: 'Shipment group confirmed and ready for dispatch',
    estimatedDuration: 2,
    isVisible: true,
    icon: 'confirmed',
    nextLocations: [
      Vanguard_FACILITIES.KUMASI_DISTRIBUTION_HUB,
      Vanguard_FACILITIES.TAMALE_DELIVERY_HUB,
      Vanguard_FACILITIES.CAPE_COAST_DELIVERY_HUB
    ]
  },
  
  // 🚚 SHIPPING PHASE LOCATIONS
  {
    status: PackageStatus.DISPATCHED,
    location: Vanguard_FACILITIES.ACCRA_SORTING_CENTER,
    description: 'Package dispatched from sorting center',
    estimatedDuration: 2,
    isVisible: true,
    icon: 'truck-departure',
    nextLocations: [
      Vanguard_FACILITIES.KUMASI_HIGHWAY_JUNCTION,
      Vanguard_FACILITIES.ACCRA_TEMA_HIGHWAY
    ]
  },
  
  {
    status: PackageStatus.IN_TRANSIT,
    location: Vanguard_FACILITIES.KUMASI_HIGHWAY_JUNCTION, // Dynamic based on destination
    description: 'Package in transit to destination',
    estimatedDuration: 24,
    isVisible: true,
    icon: 'truck-moving',
    nextLocations: [
      Vanguard_FACILITIES.KUMASI_DISTRIBUTION_HUB,
      Vanguard_FACILITIES.TAMALE_DELIVERY_HUB,
      Vanguard_FACILITIES.CAPE_COAST_DELIVERY_HUB
    ]
  },
  
  {
    status: PackageStatus.OUT_FOR_DELIVERY,
    location: Vanguard_FACILITIES.KUMASI_DISTRIBUTION_HUB, // Dynamic based on destination
    description: 'Package out for final delivery',
    estimatedDuration: 8,
    isVisible: true,
    icon: 'delivery-van',
    nextLocations: [] // Final destination varies by customer
  },
  
  {
    status: PackageStatus.DELIVERED,
    location: Vanguard_FACILITIES.KUMASI_DISTRIBUTION_HUB, // Will be customer location
    description: 'Package successfully delivered',
    estimatedDuration: 0,
    isVisible: true,
    icon: 'delivered',
    nextLocations: []
  },
  
  // ⚠️ EXCEPTION HANDLING LOCATIONS
  {
    status: PackageStatus.DELAYED,
    location: Vanguard_FACILITIES.KUMASI_HIGHWAY_JUNCTION, // Dynamic based on last known location
    description: 'Package delayed - investigating cause',
    estimatedDuration: 12,
    isVisible: true,
    icon: 'warning',
    nextLocations: []
  },
  
  {
    status: PackageStatus.RETURNED,
    location: Vanguard_FACILITIES.ACCRA_MAIN_WAREHOUSE,
    description: 'Package returned to sender',
    estimatedDuration: 0,
    isVisible: true,
    icon: 'return',
    nextLocations: []
  },
  
  {
    status: PackageStatus.LOST,
    location: Vanguard_FACILITIES.ACCRA_MAIN_WAREHOUSE,
    description: 'Package location unknown - investigation in progress',
    estimatedDuration: 0,
    isVisible: true,
    icon: 'lost',
    nextLocations: []
  }
];

/**
 * Location mapping service for status-based tracking
 */
export class LocationMappingService {
  formatLocationForDisplay(_location: LocationPoint) {
    throw new Error('Method not implemented.');
  }
  /**
   * Get location for a specific package status
   * @param status - Package status
   * @param destination - Optional destination for dynamic routing
   * @returns Location point for the status
   */
  static getLocationForStatus(
    status: PackageStatus,
    destination?: string
  ): LocationPoint {
    const mapping = STATUS_LOCATION_MAPPINGS.find(m => m.status === status);
    
    if (!mapping) {
      // Default to main warehouse if status not found
      return Vanguard_FACILITIES.ACCRA_MAIN_WAREHOUSE;
    }
    
    // For dynamic statuses, determine location based on destination
    if (this.isDynamicStatus(status) && destination) {
      return this.getDestinationHub(destination);
    }
    
    return mapping.location;
  }
  
  /**
   * Get status location mapping with full metadata
   * @param status - Package status
   * @returns Complete status location mapping
   */
  static getStatusLocationMapping(status: PackageStatus): StatusLocationMapping | null {
    return STATUS_LOCATION_MAPPINGS.find(m => m.status === status) || null;
  }
  
  /**
   * Check if a status has dynamic location based on destination
   * @param status - Package status
   * @returns True if location varies by destination
   */
  static isDynamicStatus(status: PackageStatus): boolean {
    const dynamicStatuses = [
      PackageStatus.IN_TRANSIT,
      PackageStatus.OUT_FOR_DELIVERY,
      PackageStatus.DELIVERED,
      PackageStatus.DELAYED
    ];
    
    return dynamicStatuses.includes(status);
  }
  
  /**
   * Get appropriate hub based on destination city
   * @param destination - Destination city name
   * @returns Location point for the destination hub
   */
  static getDestinationHub(destination: string): LocationPoint {
    const destinationLower = destination.toLowerCase();
    
    // Map destinations to appropriate hubs
    if (destinationLower.includes('kumasi')) {
      return Vanguard_FACILITIES.KUMASI_DISTRIBUTION_HUB;
    } else if (destinationLower.includes('tamale')) {
      return Vanguard_FACILITIES.TAMALE_DELIVERY_HUB;
    } else if (destinationLower.includes('cape coast')) {
      return Vanguard_FACILITIES.CAPE_COAST_DELIVERY_HUB;
    }
    
    // Default to Accra for unknown destinations
    return Vanguard_FACILITIES.ACCRA_MAIN_WAREHOUSE;
  }
  
  /**
   * Generate route waypoints between two locations
   * @param origin - Starting location
   * @param destination - Ending location
   * @returns Array of waypoints for realistic route display
   */
  static generateRouteWaypoints(
    origin: LocationPoint,
    destination: LocationPoint
  ): LocationPoint[] {
    const waypoints: LocationPoint[] = [origin];
    
    // Add highway junction if traveling between major cities
    if (origin.city === 'Accra' && destination.city === 'Kumasi') {
      waypoints.push(Vanguard_FACILITIES.KUMASI_HIGHWAY_JUNCTION);
    } else if (origin.city === 'Accra' && destination.city === 'Tema') {
      waypoints.push(Vanguard_FACILITIES.ACCRA_TEMA_HIGHWAY);
    }
    
    waypoints.push(destination);
    return waypoints;
  }
  
  /**
   * Get tracking timeline for a package journey
   * @param statuses - Array of statuses the package has gone through
   * @param destination - Package destination
   * @returns Array of location points with timestamps
   */
  static getTrackingTimeline(
    statuses: Array<{ status: PackageStatus; timestamp: string }>,
    destination?: string
  ): Array<{
    location: LocationPoint;
    status: PackageStatus;
    timestamp: string;
    description: string;
    isEstimated: boolean;
  }> {
    return statuses.map(({ status, timestamp }) => {
      const mapping = this.getStatusLocationMapping(status);
      const location = this.getLocationForStatus(status, destination);
      
      return {
        location,
        status,
        timestamp,
        description: mapping?.description || `Package status: ${status}`,
        isEstimated: false
      };
    });
  }
  
  /**
   * Calculate estimated delivery time based on destination
   * @param destination - Destination city
   * @param currentStatus - Current package status
   * @returns Estimated delivery timestamp
   */
  static calculateEstimatedDelivery(
    destination: string,
    currentStatus: PackageStatus
  ): string {
    const now = new Date();
    let hoursToAdd = 0;
    
    // Base delivery time by destination
    const destinationLower = destination.toLowerCase();
    if (destinationLower.includes('kumasi')) {
      hoursToAdd = 48; // 2 days to Kumasi
    } else if (destinationLower.includes('tamale')) {
      hoursToAdd = 72; // 3 days to Tamale
    } else if (destinationLower.includes('cape coast')) {
      hoursToAdd = 36; // 1.5 days to Cape Coast
    } else {
      hoursToAdd = 24; // 1 day for local delivery
    }
    
    // Adjust based on current status
    const statusMapping = this.getStatusLocationMapping(currentStatus);
    if (statusMapping) {
      hoursToAdd += statusMapping.estimatedDuration;
    }
    
    const estimatedDelivery = new Date(now.getTime() + (hoursToAdd * 60 * 60 * 1000));
    return estimatedDelivery.toISOString();
  }
  
  /**
   * Get map marker configuration for a status
   * @param status - Package status
   * @returns Map marker configuration object
   */
  static getMapMarkerConfig(status: PackageStatus): {
    facilityName: any;
    address: any;
    city: any;
    region: any;
    country: any;
    icon: string;
    color: string;
    size: 'small' | 'medium' | 'large';
    animation?: 'pulse' | 'bounce';
  } {
    // Get the status location mapping which contains the location data
    const mapping = this.getStatusLocationMapping(status);
    
    // Define marker visual configurations for each status
    const markerConfigs = {
      [PackageStatus.PENDING]: { icon: 'clock', color: '#6B7280', size: 'medium' as const },
      [PackageStatus.PROCESSING]: { icon: 'cog', color: '#3B82F6', size: 'medium' as const, animation: 'pulse' as const },
      [PackageStatus.READY_FOR_GROUPING]: { icon: 'package', color: '#F59E0B', size: 'small' as const },
      [PackageStatus.GROUPED]: { icon: 'layers', color: '#F59E0B', size: 'medium' as const },
      [PackageStatus.GROUP_CONFIRMED]: { icon: 'check-circle', color: '#F59E0B', size: 'medium' as const },
      [PackageStatus.DISPATCHED]: { icon: 'truck', color: '#3B82F6', size: 'medium' as const },
      [PackageStatus.SHIPPED]: { icon: 'shipping-fast', color: '#3B82F6', size: 'medium' as const },
      [PackageStatus.IN_TRANSIT]: { icon: 'navigation', color: '#3B82F6', size: 'medium' as const, animation: 'pulse' as const },
      [PackageStatus.OUT_FOR_DELIVERY]: { icon: 'map-pin', color: '#10B981', size: 'large' as const, animation: 'bounce' as const },
      [PackageStatus.DELIVERED]: { icon: 'check', color: '#8B5CF6', size: 'large' as const },
      [PackageStatus.DELAYED]: { icon: 'alert-triangle', color: '#F97316', size: 'medium' as const, animation: 'pulse' as const },
      [PackageStatus.RETURNED]: { icon: 'rotate-ccw', color: '#EF4444', size: 'medium' as const },
      [PackageStatus.LOST]: { icon: 'x-circle', color: '#EF4444', size: 'medium' as const },
      [PackageStatus.EXCEPTION]: { icon: 'alert-triangle', color: '#EF4444', size: 'medium' as const },
      [PackageStatus.CANCELLED]: { icon: 'x', color: '#EF4444', size: 'medium' as const }
    };
    
    // Get the marker config for the current status or use PENDING as fallback
    const markerConfig = markerConfigs[status] || markerConfigs[PackageStatus.PENDING];
    
    // If we have a valid mapping with location data, merge it with the marker config
    if (mapping && mapping.location) {
      // Extract the required location fields
      const { facilityName, address, city, region, country } = mapping.location;
      
      // Return the combined object with both location data and marker configuration
      return {
        facilityName,
        address,
        city,
        region,
        country,
        ...markerConfig
      };
    }
    
    // Fallback if no mapping is found - use default location with marker config
    // This ensures the return type is always satisfied
    return {
      facilityName: 'Unknown',
      address: 'N/A',
      city: 'N/A',
      region: 'N/A',
      country: 'N/A',
      ...markerConfig
    };
  }
}
