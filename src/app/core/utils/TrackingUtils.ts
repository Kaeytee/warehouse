/**
 * TrackingUtils.ts
 * 
 * Utility functions for tracking operations
 * Provides helper methods for tracking ID generation, distance calculations, and other tracking-related utilities
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import type { TrackingPoint } from '../models/TrackingPoint';

/**
 * TrackingUtils class
 * Static utility methods for tracking operations
 */
export class TrackingUtils {
  /**
   * Generate a unique tracking ID
   * Format: TRK-XXXXXXXX where X is alphanumeric
   * @returns {string} Unique tracking ID
   */
  public static generateTrackingId(): string {
    // Generate random alphanumeric string of length 8
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TRK-${randomPart}`;
  }

  /**
   * Calculate total distance between tracking points
   * @param {TrackingPoint[]} trackingPoints - Array of tracking points
   * @returns {number} Total distance in kilometers
   */
  public static calculateTotalDistance(trackingPoints: TrackingPoint[]): number {
    if (!trackingPoints || trackingPoints.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    
    // Calculate distance between consecutive points
    for (let i = 0; i < trackingPoints.length - 1; i++) {
      const point1 = trackingPoints[i];
      const point2 = trackingPoints[i + 1];
      
      if (point1.location && point2.location) {
        const distance = this.calculateDistance(
          point1.location.latitude,
          point1.location.longitude,
          point2.location.latitude,
          point2.location.longitude
        );
        totalDistance += distance;
      }
    }
    
    return totalDistance;
  }

  /**
   * Calculate distance between two geographic coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Earth radius in kilometers
    const R = 6371;
    
    // Convert degrees to radians
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    // Haversine formula
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format a tracking ID for display
   * @param {string} trackingId - Raw tracking ID
   * @returns {string} Formatted tracking ID
   */
  public static formatTrackingId(trackingId: string): string {
    if (!trackingId) return '';
    
    // If already formatted, return as is
    if (trackingId.includes('-')) return trackingId;
    
    // Format as TRK-XXXXXXXX if not already formatted
    return trackingId.length > 8 
      ? `TRK-${trackingId.substring(0, 8)}`
      : `TRK-${trackingId}`;
  }
}
