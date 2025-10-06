/**
 * BatchUpdateData.ts
 * 
 * Shared interface for batch update operations across the application
 * Used for group status updates in batch operations
 * 
 * @author Senior Software Engineer
 * @version 1.0.0
 */

import { GroupStatus } from './ShipmentGroup';

/**
 * BatchUpdateData interface
 * Defines the structure for batch status updates
 */
export interface BatchUpdateData {
  readonly groupIds: string[];           // Groups to update
  readonly targetStatus: GroupStatus;    // Target status for groups
  readonly updateReason?: string;        // Optional reason for update
  readonly estimatedCompletion?: string; // Optional completion date
}
