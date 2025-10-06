# Vanguard Cargo - Warehouse System: The Operational Core

## Executive Summary

**This warehouse system IS the Vanguard Cargo platform.** Every business decision, data flow, user interaction, and system integration flows through this warehouse backbone. This document serves as the definitive operational redprint for backend developers, system architects, and business stakeholders to understand and implement the complete cargo operation.

### Why This Document Is Critical
- **For Backend Developers**: This is your implementation roadmap - every API, database table, and business rule is defined here
- **For System Architects**: This shows how all platform components integrate and depend on the warehouse core
- **For Business Stakeholders**: This defines what the system does, how it works, and why each component exists
- **For QA/Testing**: This provides the complete workflow and edge cases that must be validated

### Platform Architecture Reality
The client app is essentially a user interface that communicates with this warehouse system. The warehouse system:
- Processes every client request into actionable operations
- Manages all physical and digital package lifecycles  
- Orchestrates all shipment and delivery operations
- Enforces all business rules and data integrity
- Provides all tracking, status, and communication capabilities

## System Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Client App        │    │   Warehouse Core    │    │   Super Admin       │
│   (Request Submit)  │────┤   (Main Operations) ├────│   (System Control)  │
│   - Submit requests │    │   - Process requests│    │   - User management │
│   - Track packages  │    │   - Create packages │    │   - System config   │
│   - View status     │    │   - Build shipments │    │   - Analytics       │
└─────────────────────┘    │   - Track & notify  │    └─────────────────────┘
                           │   - Manage inventory│
                           │   - Handle delivery │
                           └─────────────────────┘
                                      │
                              ┌───────▼────────┐
                              │  Spring Boot   │
                              │  Backend API   │
                              │  + PostgreSQL  │
                              └────────────────┘
```

## Table of Contents

1. [Core Business Logic](#core-business-logic)
2. [Request-to-Package Workflow](#request-to-package-workflow)
3. [Package Management System](#package-management-system)
4. [Shipment Creation & Management](#shipment-creation--management)
5. [Status Management & Tracking](#status-management--tracking)
6. [Inventory & Warehouse Operations](#inventory--warehouse-operations)
7. [Client Communication System](#client-communication-system)
8. [Staff Management & Roles](#staff-management--roles)
9. [Integration with Client System](#integration-with-client-system)
10. [Data Models & Database Design](#data-models--database-design)
11. [API Endpoints](#api-endpoints)
12. [Security & Access Control](#security--access-control)
13. [Frontend Integration Requirements](#frontend-integration-requirements)
14. [Currency Handling & Pricing System](#currency-handling--pricing-system)
15. [Scalability and Performance](#scalability-and-performance)
16. [International Expansion Plan](#international-expansion-plan)
17. [Monitoring and Alerts](#monitoring-and-alerts)
18. [Future Production](#future-production)

## Business Logic Framework: Pure International cargo

### Package Types - Official Definition
**There are ONLY two package types in the entire Vanguard Cargo system:**
1. **DOCUMENT**: Legal documents, contracts, certificates, official papers
2. **NON_DOCUMENT**: Everything else - goods, products, personal items, equipment

*This is definitive. No other package types exist. Any documentation or code suggesting otherwise is incorrect and must be updated.*

### Delivery Types - Service Levels (Air Freight Primary)
**Current Primary Service:**
1. **AIR**: International air freight - fast, reliable cross-border shipping (PRIMARY SERVICE)

**Future Expansion Ready:**
2. **GROUND**: Cross-border ground transportation (future trucks/trains between countries)
3. **SEA**: International sea freight for large shipments (future cost-effective option)
4. **EXPRESS**: Premium express international service (future high-priority option)

### Core Business Model - Pure International cargo
**Vanguard Cargo operates EXCLUSIVELY as an international cargo company:**
- **No Domestic Services**: We do not handle deliveries within the same country
- **Cross-Border Only**: All packages move between different countries
- **Current Routes**: Ghana ↔ USA exclusively
- **Future Expansion**: Additional countries (Nigeria, UK, etc.) following same cross-border model

### Origin Country Selection Rules - Critical Business Logic
**Client Country Restriction Logic:**
- **Ghana Clients**: Can ONLY select USA as origin country (cannot select Ghana)
- **USA Clients**: Can ONLY select Ghana as origin country (cannot select USA)
- **Future Countries**: Each client can select any origin country EXCEPT their own country

**UI Implementation Rule:**
```
Client's Country = Ghana → Origin Country Dropdown = [USA, Future Countries] (Ghana disabled/hidden)
Client's Country = USA → Origin Country Dropdown = [Ghana, Future Countries] (USA disabled/hidden)
```

**Business Justification:**
- Prevents impossible domestic requests
- Enforces international cargo business model
- Ensures all requests are cross-border by design

### The Universal Workflow - Every Package Follows This Path (International Only)
```
CLIENT REQUEST → ORIGIN WAREHOUSE → INTERNATIONAL SHIPPING → DESTINATION WAREHOUSE → CUSTOMER PICKUP
      │                │                   │                      │                      │
      │                │                   │                      │                      │
   (Client App)    (Origin Country)    (Air Freight)        (Destination Country)  (Warehouse Pickup)
   - Submit info   - Process package   - Ship internationally  - Clear customs       - Notify customer
   - Get tracking  - Prepare export    - Track transit        - Process arrival      - Customer pickup
   - Track status  - Ship package      - Handle cargo     - Store in warehouse   - Confirm collection
```

**This workflow is immutable. Every package moves between countries and ends with warehouse pickup - no home delivery exists.**

**Example Flows:**

- Ghana Client → USA Origin Package → Air Freight to Ghana → Ghana Warehouse Pickup
- USA Client → Ghana Origin Package → Air Freight to USA → USA Warehouse Pickup

### Critical Business Rules - Non-Negotiable (Updated for International Focus)

**Data Integrity Rules:**
1. **One Request = One Package**: Every client request generates exactly one warehouse package
2. **Unique Tracking**: Every package gets a unique tracking number (TT + 12 digits)
3. **Status Progression**: Packages can only move forward through status sequence (no backwards)
4. **Audit Trail**: Every status change, location change, and action must be logged with timestamp and user
5. **Cross-Border Only**: All requests must have different origin country and client country

**Package Type Rules:**
1. **DOCUMENT packages**: Must use special handling zone, enhanced security, dedicated storage
2. **NON_DOCUMENT packages**: Standard processing workflow, regular storage areas
3. **No mixed shipments**: Document and non-document packages cannot be in same shipment
4. **Type cannot change**: Once set, package type is immutable throughout lifecycle

**Delivery Type Rules (Air Freight Primary):**
1. **AIR**: Primary service - international air freight, expedited processing, airport coordination
2. **GROUND**: Future service - cross-border ground transportation between countries
3. **SEA**: Future service - international bulk shipping, port facility coordination
4. **EXPRESS**: Future service - premium international express service

**International Request Rules:**
1. **Origin Country ≠ Client Country**: System must enforce this rule at request creation
2. **Cross-Border Processing**: Origin country processes, destination country delivers
3. **No Domestic Requests**: Requests within same country are not allowed
4. **Country Validation**: UI must prevent clients from selecting their own country as origin

**Shipment Grouping Rules (International Focus):**
1. **Compatible types only**: Same delivery type packages can be grouped
2. **Same route logic**: Packages following same international route (e.g., USA → Ghana)
3. **Size/weight limits**: Must respect aircraft/container capacity constraints
4. **International coordination**: Groups must align with international shipping schedules

**Exception Handling Rules:**
1. **Damage**: Immediate photo documentation, client notification, damage report creation
2. **Customs Issues**: Automatic notification to both origin and destination warehouses
3. **Missing packages**: Full investigation protocol involving both countries
4. **Address issues**: Client communication required before international shipping

```
Client Request → Package Creation → Physical Receipt → Processing → Shipment → Warehouse Arrival → Customer Pickup
     │               │                    │              │           │              │                    │
     │               │                    │              │           │              │                    │
   CLIENT         WAREHOUSE           WAREHOUSE      WAREHOUSE   WAREHOUSE      WAREHOUSE           CLIENT
   SUBMITS        CREATES             RECEIVES       PROCESSES   SHIPS          STORES             PACKAGE
   REQUEST        PACKAGE             PACKAGE        PACKAGE     PACKAGE        PACKAGE            PACKAGE
```

### Core Responsibilities

1. **Request Processing**: Convert client requests into actionable packages
2. **Package Management**: Track physical packages through warehouse operations
3. **Shipment Orchestration**: Group packages into efficient international shipments
4. **Status Communication**: Keep all stakeholders informed of progress
5. **Customer Pickup Coordination**: Notify customers when packages arrive at local warehouse for pickup
6. **Exception Handling**: Manage delays, issues, and special requirements

### Exception Handling Workflows

**Critical Edge Cases and Resolution Protocols:**

**Customs Delays and Rejections:**
```
1. Customs Rejection Detection
   ↓
2. Immediate Notification to Both Warehouses
   ↓
3. Document Request from Client
   ↓
4. Re-submission Process
   ↓
5. Resolution Tracking and Communication
```

**Lost Package Protocol:**
1. **Initial Investigation**: 24-hour trace across all warehouse locations
2. **Cross-Border Coordination**: Contact partner warehouses in origin/destination countries
3. **Client Notification**: Immediate alert with investigation timeline
4. **Insurance Claim**: Process compensation if package cannot be located
5. **System Update**: Mark package as "LOST" with complete audit trail

**Partial Shipment Arrivals:**
1. **Shipment Reconciliation**: Compare manifest against physical arrivals
2. **Missing Package Identification**: Log discrepancies immediately
3. **Origin Warehouse Contact**: Coordinate with sending facility
4. **Client Communication**: Notify affected customers of delays
5. **Expedited Processing**: Priority handling for delayed packages when they arrive

**Escalation Matrix for Cross-Border Issues:**
- **Level 1**: Warehouse Staff (0-4 hours)
- **Level 2**: Warehouse Manager (4-24 hours)
- **Level 3**: Transportation Manager + International Coordinator (24+ hours)
- **Level 4**: Executive Team + Legal (Critical issues)

### Critical Success Factors

- **Data Integrity**: Every request must become a trackable package
- **Status Accuracy**: Real-time status updates across all systems
- **Communication**: Proactive client and staff notifications
- **Efficiency**: Optimal resource utilization and cost management
- **Scalability**: System must handle growing package volumes

### Database Architecture & Data Flow - Pure International cargo

**Why Normalized Data Matters:**
The warehouse system uses a fully normalized database design to eliminate redundancy and ensure data integrity. This means the client app sends only essential, unique data, while the warehouse system manages all relationships and derived information.

**Client App Responsibility (International Requests Only):**
```
Client Sends:
- User ID (references existing user record)
- Origin country (MUST be different from client's country)
- Origin city (text string)
- Package type (DOCUMENT | NON_DOCUMENT enum)
- Delivery type (AIR primary, others for future)
- Package category and description (text)
- Special requirements (optional text)
```

**System Validation Rules:**
```
Request Validation:
- Client country ≠ Origin country (enforced at API level)
- Origin country must be in approved countries list
- Client country determines available origin options
- UI prevents selection of client's own country
```

**Warehouse System Adds:**
```
Warehouse Creates:
- Package ID (new UUID)
- Tracking number (generated: TT + 12 digits)
- Physical measurements (when package arrives)
- Warehouse location tracking
- Status history (complete audit trail)
- Processing notes and staff assignments
- Images and documentation
- International shipment coordination data
- Customs documentation
```

**Database Relationship Model (International Focus):**
```
Users (shared table - includes country field)
├── Package_Requests (from client app - origin_country ≠ user.country)
│   └── Packages (created by origin warehouse) [1:1 relationship]
│       ├── Status_History [1:many]
│       ├── Package_Images [1:many]
│       ├── International_Shipping [1:1]
│       └── Customs_Documentation [1:1]
│           └── Shipments (international groups) [many:1]
│               ├── Shipment_Status_History [1:many]
│               └── International_cargo [1:1]
```

**Benefits of This Approach:**
1. **No Data Duplication**: User info stored once, referenced everywhere
2. **Consistency**: Changes to user data automatically reflect across all packages
3. **Efficiency**: JOINs in warehouse system provide complete data views
4. **Scalability**: Minimal data transfer between client and warehouse
5. **Integrity**: Foreign key constraints prevent orphaned or invalid data
6. **International Validation**: Enforces cross-border business rules at database level

### Phase 1: Request Reception (International Validation)
```
Client submits international request → Warehouse receives notification → Staff reviews request
```

**What Warehouse Receives from Client App:**
- Request ID and request number
- Client information (via user ID reference)
- Origin details (country, city) - MUST be different from client's country
- Package type (Document/Non-Document)
- Delivery type (Air primary, others for future expansion)
- Package category and description

**International Request Validation:**
1. **Country Validation**: Verify origin country ≠ client country
2. **Service Availability**: Confirm international shipping available to client's country
3. **Route Validation**: Ensure origin → destination route is supported
4. **Customs Compliance**: Verify package type allowed for international shipping

**Warehouse Actions:**
1. **Request Validation**: Verify all required information is present and valid
2. **International Route Check**: Confirm service availability for origin/destination pair
3. **Cost Estimation**: Calculate international shipping costs and delivery timeframes
4. **Request Approval**: Approve or request additional information

### Phase 2: Package Creation (International Package Setup)
```
Approved international request → Create package record → Generate tracking number → Notify client
```

**International Package Creation Process:**
1. **Package Record Creation**: Create warehouse package from approved international request
2. **International Tracking Number**: Assign unique tracking number (format: TT + 12 digits)
3. **International Barcode**: Create scannable barcode for cross-border tracking
4. **Initial Status Setting**: Set package status to "AWAITING_PICKUP"
5. **International Route Setup**: Configure origin → destination routing information
6. **Client Notification**: Inform client of package creation and international tracking details

### Phase 3: Physical Reception (Origin Country Processing)
```
Client delivers package to origin warehouse → International inspection → Package acceptance → Status update
```

**International Reception Workflow:**
1. **Package Arrival**: Client brings physical package to origin country warehouse
2. **International Verification**: Match physical package with international shipping record
3. **Export Inspection**: Check package condition, weight, dimensions for international shipping
4. **Documentation**: Take photos, record any discrepancies, prepare export documentation
5. **International Acceptance**: Accept package into origin warehouse for international processing
6. **Status Update**: Change status to "RECEIVED"

### Phase 4: International Processing (Origin Country Preparation)
```
Package in origin warehouse → International processing queue → Export preparation → Ready for international shipment
```

**International Processing Steps:**
1. **Export Queue Management**: Prioritize packages based on international shipping schedules
2. **International Processing**: Inspect, weigh, measure, label for international shipping
3. **Export Documentation**: Prepare customs forms, shipping manifests, export declarations
4. **International Quality Control**: Verify all international shipping requirements are met
5. **Status Update**: Change status to "PROCESSED"

## Package Management System

### Package Lifecycle States

```
AWAITING_PICKUP → RECEIVED → PROCESSING → PROCESSED → GROUPED → SHIPPED → DELIVERED
       │             │           │           │           │          │         │
       │             │           │           │           │          │         │
   Created but    Physical    Being      Ready for   Added to   Left      Reached
   not yet        package     processed  shipment    shipment   warehouse destination
   received       arrived     by staff   creation    group      facility  
```

### Package Data Structure

**Core Package Information:**
- Package ID (internal warehouse identifier)
- Request ID (links back to client request)
- Tracking Number (client-facing identifier)
- Client ID (links to client who submitted request)
- Package type (Document/Non-Document)
- Origin details (country, city from request)
- Package details (category, description from request)

**Warehouse-Specific Data:**
- Physical dimensions (length, width, height)
- Weight (actual measured weight)
- Condition notes (damage, special handling requirements)
- Location in warehouse (shelf, zone, area)
- Processing notes (staff observations, special instructions)
- Images (receipt, processing, damage documentation)

**Status and Tracking:**
- Current status
- Status history (complete audit trail)
- Assigned staff member
- Processing priority level
- Estimated processing completion time
- Target shipment date

### Package Processing Operations

**Standard Processing Workflow:**
1. **Intake Inspection**: Verify package matches digital record
2. **Dimension/Weight Recording**: Measure and record physical characteristics
3. **Condition Assessment**: Document any damage or special conditions
4. **Labeling**: Apply warehouse labels and tracking barcodes
5. **Storage Assignment**: Assign location in warehouse
6. **Processing Completion**: Mark as ready for shipment

**Special Handling Procedures:**
- **Document Packages**: Enhanced security, special storage area
- **Fragile Items**: Special packaging, careful handling protocols
- **High-Value Items**: Additional security measures, insurance documentation
- **International Packages**: Customs documentation, compliance checks

### Mixed Package Handling

**Edge Case: Client Submits Mixed Document/Non-Document Items**

When a client attempts to submit a single request containing both document and non-document items, the warehouse system implements the following protocol:

**Automatic Separation Workflow:**
1. **Intake Detection**: Staff identifies mixed package contents during physical inspection
2. **Package Splitting**: Create separate DOCUMENT and NON_DOCUMENT package records
3. **New Tracking Numbers**: Generate distinct tracking numbers for each separated package
4. **Client Notification**: Automatically notify client of package separation
5. **Individual Processing**: Each separated package follows its respective workflow

**Implementation Details:**
```typescript
// API Endpoint for Package Separation
POST /api/warehouse/packages/{id}/separate
{
  originalPackageId: UUID;
  separatedPackages: [
    {
      packageType: "DOCUMENT";
      description: string;
      items: string[];
    },
    {
      packageType: "NON_DOCUMENT";
      description: string;
      items: string[];
    }
  ];
  staffId: UUID;
  separationReason: string;
}

Response: {
  originalPackageId: UUID;
  newPackages: [
    {
      id: UUID;
      trackingNumber: string;
      packageType: string;
    }
  ];
  clientNotificationSent: boolean;
}
```

**Client Communication for Separated Packages:**
- Immediate SMS/email notification explaining separation
- New tracking numbers provided for each separated package
- Clear explanation of different processing timelines
- Updated pricing calculation for each separated package

## Shipment Creation & Management

### Shipment Grouping Logic

**Automatic Grouping Criteria:**
1. **Destination-Based**: Group packages going to same region/country
2. **Service Type**: Group by delivery type (Ground/Air/Sea/Express)
3. **Size/Weight Optimization**: Maximize vehicle/container utilization
4. **Delivery Timeline**: Group packages with similar deadlines
5. **Special Requirements**: Group packages with similar handling needs

### Shipment Creation Process

**Phase 1: Package Selection**
```
Processed packages → Grouping algorithm → Create shipment groups → Assign resources
```

**Selection Criteria:**
- All packages must have status "PROCESSED"
- Compatible destinations and service types
- Optimal size/weight combinations
- Similar delivery timeframes

**Phase 2: Shipment Assembly**
```
Selected packages → Physical consolidation → Shipment documentation → Departure preparation
```

**Assembly Steps:**
1. **Package Consolidation**: Physically group packages for shipment
2. **Shipment Documentation**: Create manifests, shipping labels, customs forms
3. **Final Inspection**: Verify all packages are included and properly documented
4. **Resource Assignment**: Assign vehicle, driver, route
5. **Departure Scheduling**: Set departure time and estimated arrival

### Shipment Types

**Ground Shipments:**
- Regional delivery within same country
- Standard delivery timeframes
- Cost-effective for bulk packages
- Regular departure schedules

**Air Shipments:**
- International and expedited delivery
- Premium pricing for speed
- Weight and size restrictions
- Coordination with airline schedules

**Sea Shipments:**
- International bulk delivery
- Longest transit times but most economical
- Container-based shipping
- Port coordination requirements

**Express Shipments:**
- Highest priority packages
- Guaranteed delivery timeframes
- Premium pricing structure
- Dedicated transportation resources

## Status Management & Tracking

### Unified Status System

**Client App Status (Client View):**
- SUBMITTED: Request submitted and received
- UNDER_REVIEW: Warehouse reviewing request  
- PROCESSING: Package being processed in warehouse
- READY_FOR_PICKUP: Package ready for collection/shipment
- COMPLETED: Package delivered to destination

**Warehouse Status (Internal Operations):**
- AWAITING_PICKUP: Package created, waiting for physical delivery
- RECEIVED: Physical package received at warehouse
- PROCESSING: Package being processed by warehouse staff
- PROCESSED: Package ready for shipment assignment
- GROUPED: Package assigned to shipment group
- SHIPPED: Package left warehouse in shipment
- IN_TRANSIT: Package en route to destination
- DELIVERED: Package delivered to final recipient
- EXCEPTION: Issue requiring special attention

### Status Synchronization

**Client App Status Mapping:**
```
Warehouse Status    →    Client App Status
AWAITING_PICKUP     →    UNDER_REVIEW
RECEIVED            →    PROCESSING  
PROCESSING          →    PROCESSING
PROCESSED           →    PROCESSING
GROUPED             →    READY_FOR_PICKUP
SHIPPED             →    READY_FOR_PICKUP
IN_TRANSIT          →    READY_FOR_PICKUP
DELIVERED           →    COMPLETED
EXCEPTION           →    PROCESSING (with notes)
```

### Tracking Number System

**Enhanced Format**: TT + 12 digits with check digits (e.g., TT123456789012)
- **TT**: Vanguard Cargo identifier
- **12 digits**: UUID-based or sequential number with Luhn algorithm check digits for validation

**Production-Ready Generation Algorithm:**
```typescript
// Secure tracking number generation
export class TrackingNumberGenerator {
  private static counter = 0;
  
  static generateTrackingNumber(): string {
    // Use timestamp + counter + random for uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const counter = (++this.counter % 1000).toString().padStart(3, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const baseNumber = timestamp + counter + random;
    const checkDigit = this.calculateLuhnCheckDigit(baseNumber);
    
    return `TT${baseNumber}${checkDigit}`;
  }
  
  private static calculateLuhnCheckDigit(number: string): string {
    const digits = number.split('').reverse().map(Number);
    let sum = 0;
    
    for (let i = 0; i < digits.length; i++) {
      let digit = digits[i];
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    
    return ((10 - (sum % 10)) % 10).toString();
  }
  
  static validateTrackingNumber(trackingNumber: string): boolean {
    if (!trackingNumber.match(/^TT\d{12}$/)) return false;
    
    const numberPart = trackingNumber.slice(2);
    const checkDigit = numberPart.slice(-1);
    const baseNumber = numberPart.slice(0, -1);
    
    return checkDigit === this.calculateLuhnCheckDigit(baseNumber);
  }
}
```

**Database Constraints:**
```sql
-- Ensure tracking number uniqueness
ALTER TABLE packages ADD CONSTRAINT unique_tracking_number UNIQUE (trackingNumber);

-- Add check constraint for format validation
ALTER TABLE packages ADD CONSTRAINT valid_tracking_format 
  CHECK (trackingNumber ~ '^TT\d{12}$');
```

**Tracking Capabilities:**
- Real-time status updates across international borders
- Location tracking with GPS coordinates
- Estimated delivery times with customs delays factored
- Exception notifications with automatic escalation
- Delivery confirmation with digital signature capture
- Multi-language tracking interface

## Inventory & Warehouse Operations

### Physical Warehouse Layout

**Zone Organization:**
1. **Receiving Zone**: Incoming package inspection and acceptance
2. **Processing Zone**: Package processing and preparation
3. **Storage Zones**: Organized by package type and delivery schedule
4. **Staging Zone**: Packages ready for shipment assignment
5. **Shipping Zone**: Shipment consolidation and departure
6. **Special Handling Zone**: High-value, fragile, or document packages

### Inventory Management

**Package Location Tracking:**
- Zone assignment (which area of warehouse)
- Shelf/bay location (specific storage location)
- Movement history (when moved and by whom)
- Storage duration (time in each location)

**Inventory Operations:**
1. **Receiving**: Log package arrival and assign initial location
2. **Movement**: Track all package movements within warehouse
3. **Processing**: Update location during processing activities
4. **Staging**: Move processed packages to shipment staging area
5. **Shipping**: Log package departure from warehouse

### Warehouse Staff Operations

**Staff Roles and Responsibilities:**

**Warehouse Workers:**
- Package receiving and inspection
- Physical package processing
- Package movement and organization
- Barcode scanning and status updates

**Warehouse Managers:**
- Shipment planning and creation
- Staff supervision and task assignment
- Exception handling and problem resolution
- Quality control and process oversight

**HR Staff:**
- Staff scheduling and management
- Training and compliance
- Performance monitoring
- Client communication when needed

**Warehouse Admin:**
- Overall operations management
- System configuration and optimization
- Reporting and analytics
- Integration with other systems

### Warehouse Staff Hierarchy & Organizational Structure

**Executive Level Management:**
- **Transportation Manager**: Oversees all shipping and cargo operations
  - **Transportation Coordinator**: Reports to Transportation Manager, handles day-to-day shipping coordination
- **Warehouse Manager**: Manages warehouse operations and staff
- **Inventory Analyst**: Tracks and analyzes inventory levels and movements
- **cargo Analyst**: Analyzes cargo performance and optimization opportunities
- **Customer Service Representative**: Handles customer inquiries and communication
- **Export Documentation Specialist**: Manages all international shipping documentation and customs requirements

**Operational Level Staff:**
- **Order Fulfillment Specialists**: Report to Transportation Coordinator, handle package preparation and fulfillment
- **Warehouse Workers**: Handle physical package operations and movements
- **Quality Control Staff**: Ensure package condition and processing standards
- **Security Personnel**: Maintain warehouse security and access control

**Role-Specific Permissions Matrix:**

| Role | Package View | Status Update | Shipment Creation | Customer Release | System Admin |
|------|-------------|---------------|-------------------|------------------|--------------|
| Transportation Manager | All | Yes | Yes | Yes | Limited |
| Transportation Coordinator | Assigned | Yes | Yes | Yes | No |
| Warehouse Manager | All | Yes | Yes | Yes | Limited |
| Order Fulfillment Specialists | Assigned | Limited | No | No | No |
| Inventory Analyst | All | Limited | No | No | No |
| cargo Analyst | All | No | No | No | No |
| Customer Service Rep | Customer-specific | Limited | No | Yes | No |
| Export Documentation | International | Limited | No | No | No |
| Warehouse Workers | Assigned | Limited | No | No | No |
| Warehouse Admin | All | Yes | Yes | Yes | Full |

## Client Communication System

### Communication Channels

**Automated Notifications:**
- Status change notifications (SMS, email, WhatsApp)
- Delivery confirmations
- Exception alerts
- Delivery scheduling

**On-Demand Communication:**

- Package status inquiries
- Special handling requests
- Pickup coordination and scheduling
- Issue resolution

### Notification Triggers

**Automatic Triggers:**

1. **Package Created**: When request becomes package
2. **Package Received**: When physical package arrives at origin warehouse
3. **Processing Complete**: When package ready for international shipment
4. **Shipped**: When package leaves origin warehouse for international transit
5. **Arrived at Local Warehouse**: When package reaches destination warehouse and is ready for pickup
6. **Package Collected**: When customer picks up package from local warehouse
7. **Exception**: When issues arise requiring attention

### WhatsApp Integration

**Use Cases:**

- Quick status updates with package photos
- Pickup coordination and scheduling with customers
- Exception handling and problem resolution
- Pickup confirmation with photos and ID verification

**Message Templates:**

- Status update messages
- Pickup scheduling messages (with warehouse address and hours)
- Exception notification messages
- Pickup confirmation messages

### WhatsApp Integration Details

**Rate Limits and Cost Management:**
- **Message Limits**: 1,000 messages per day per phone number (WhatsApp Business API)
- **Cost Structure**: $0.0055 per message for service messages, $0.0395 for marketing messages
- **Rate Limiting**: Maximum 50 messages per minute per recipient
- **Cost Optimization**: Use template messages to reduce costs by 60%

**Message Security and Encryption:**
```typescript
// Encrypted tracking number transmission
interface SecureWhatsAppMessage {
  recipient: string;
  templateName: string;
  parameters: {
    trackingNumber: string; // Encrypted before transmission
    customerName: string;
    status: string;
    estimatedDate?: string;
  };
  encryptionKey: string;
  messageType: 'STATUS_UPDATE' | 'PICKUP_READY' | 'EXCEPTION_ALERT';
}

// Implementation
class WhatsAppSecurityManager {
  static encryptTrackingNumber(trackingNumber: string): string {
    // Use AES-256 encryption for tracking numbers
    return CryptoJS.AES.encrypt(trackingNumber, process.env.WHATSAPP_ENCRYPTION_KEY).toString();
  }
  
  static generateSecureDeepLink(trackingNumber: string): string {
    const encrypted = this.encryptTrackingNumber(trackingNumber);
    return `https://track.Vanguard.com/secure/${encrypted}`;
  }
}
```

**Fallback Communication Channels:**
1. **Primary**: WhatsApp Business API
2. **Secondary**: SMS via Twilio (if WhatsApp delivery fails)
3. **Tertiary**: Email notification
4. **Emergency**: Voice call for high-value packages

**Delivery Status Monitoring:**
```typescript
// API Endpoint for WhatsApp delivery tracking
GET /api/warehouse/whatsapp/delivery-status
Query Parameters:
- messageId: string
- startDate: ISO date
- endDate: ISO date
- recipient?: string

Response: {
  deliveryStats: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
  failureReasons: [
    {
      recipient: string;
      reason: string;
      fallbackUsed: boolean;
      retryCount: number;
    }
  ];
  costAnalysis: {
    totalCost: number;
    averageCostPerMessage: number;
    monthlyProjection: number;
  };
}
```

**Template-Based Messaging System:**
```typescript
// Standard message templates
const WHATSAPP_TEMPLATES = {
  PACKAGE_CREATED: {
    name: "package_created",
    text: "Hello {{1}}! Your package {{2}} has been created and is being processed. Track it at: {{3}}",
    variables: ["customerName", "trackingNumber", "trackingLink"]
  },
  READY_FOR_PICKUP: {
    name: "ready_for_pickup",
    text: "📦 Good news {{1}}! Package {{2}} is ready for pickup at our {{3}} warehouse. Address: {{4}}. Hours: {{5}}",
    variables: ["customerName", "trackingNumber", "warehouseLocation", "address", "hours"]
  },
  CUSTOMS_DELAY: {
    name: "customs_delay",
    text: "⚠️ {{1}}, package {{2}} is delayed at customs. Additional documentation needed: {{3}}. Please contact us.",
    variables: ["customerName", "trackingNumber", "requiredDocs"]
  }
};
```

**Retry Mechanism with Exponential Backoff:**
```typescript
class WhatsAppRetryManager {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1 second
  
  static async sendWithRetry(message: WhatsAppMessage, attempt = 1): Promise<boolean> {
    try {
      const result = await WhatsAppAPI.send(message);
      return result.success;
    } catch (error) {
      if (attempt >= this.MAX_RETRIES) {
        // Use fallback channel
        await this.useFallbackChannel(message);
        return false;
      }
      
      const delay = this.BASE_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.sendWithRetry(message, attempt + 1);
    }
  }
}
```

### Multilingual Notifications

**Language Support Framework:**
- **Primary Languages**: English (default), Twi (Ghana), Spanish (USA Hispanic communities)
- **Future Expansion**: French, Yoruba, Igbo (Nigeria preparation), Arabic (Middle East expansion)

**Database Schema for Notification Preferences:**
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(20) CHECK (channel IN ('WHATSAPP', 'SMS', 'EMAIL', 'VOICE')),
  language VARCHAR(10) DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  priority_order INTEGER DEFAULT 1,
  time_preference JSONB, -- {"start": "08:00", "end": "20:00", "timezone": "GMT"}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, channel)
);

-- Indexes for performance
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_active ON notification_preferences(is_active);
```

**Multilingual Message Templates:**
```typescript
// Localized message templates
const MULTILINGUAL_TEMPLATES = {
  PACKAGE_READY: {
    en: "Hello {{customerName}}! Your package {{trackingNumber}} is ready for pickup at {{location}}.",
    tw: "Akwaaba {{customerName}}! Wo package {{trackingNumber}} ato hɔ wɔ {{location}}.",
    es: "¡Hola {{customerName}}! Tu paquete {{trackingNumber}} está listo para recoger en {{location}}."
  },
  CUSTOMS_DELAY: {
    en: "Package {{trackingNumber}} is delayed at customs. Documents needed: {{documents}}",
    tw: "Package {{trackingNumber}} gyina customs so. Documents a ehia: {{documents}}",
    es: "El paquete {{trackingNumber}} está retrasado en aduana. Documentos necesarios: {{documents}}"
  }
};

// Implementation
class MultilingualNotificationService {
  static async sendLocalizedNotification(
    userId: string, 
    templateKey: string, 
    variables: Record<string, string>
  ): Promise<void> {
    const preferences = await this.getUserNotificationPreferences(userId);
    
    for (const preference of preferences.filter(p => p.is_active)) {
      const template = MULTILINGUAL_TEMPLATES[templateKey][preference.language] 
        || MULTILINGUAL_TEMPLATES[templateKey]['en']; // Fallback to English
      
      const message = this.interpolateTemplate(template, variables);
      
      try {
        await this.sendViaChannel(preference.channel, userId, message);
      } catch (error) {
        // Use retry mechanism with next priority channel
        await this.retryWithFallback(userId, message, preference);
      }
    }
  }
}
```

**Retry Mechanism with Exponential Backoff:**
```typescript
class NotificationRetryManager {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAYS = [1000, 3000, 9000]; // 1s, 3s, 9s
  
  static async retryWithExponentialBackoff(
    notification: NotificationPayload,
    attempt: number = 1
  ): Promise<boolean> {
    try {
      const result = await NotificationService.send(notification);
      
      // Log successful delivery
      await this.logDeliveryStatus(notification.id, 'DELIVERED', attempt);
      return true;
      
    } catch (error) {
      await this.logDeliveryStatus(notification.id, 'FAILED', attempt, error.message);
      
      if (attempt >= this.MAX_RETRIES) {
        // Final fallback: Add to manual review queue
        await this.addToManualReviewQueue(notification);
        return false;
      }
      
      // Wait before retry
      const delay = this.RETRY_DELAYS[attempt - 1];
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryWithExponentialBackoff(notification, attempt + 1);
    }
  }
  
  private static async addToManualReviewQueue(notification: NotificationPayload): Promise<void> {
    await DatabaseService.insert('failed_notifications', {
      notification_id: notification.id,
      user_id: notification.userId,
      content: notification.message,
      channel: notification.channel,
      failure_reason: 'MAX_RETRIES_EXCEEDED',
      requires_manual_intervention: true,
      created_at: new Date()
    });
    
    // Alert staff to manual intervention
    await StaffAlertService.send({
      type: 'NOTIFICATION_FAILURE',
      priority: 'HIGH',
      message: `Manual intervention required for notification ${notification.id}`,
      userId: notification.userId
    });
  }
}

## Staff Management & Roles

### Role-Based Access Control

**Warehouse Workers:**
- View assigned packages and tasks
- Update package status and location
- Scan barcodes and record activities
- Access basic package information

**Warehouse Managers:**
- View all packages and shipments
- Create and modify shipments
- Assign tasks to workers
- Handle exceptions and issues
- Access reporting and analytics

**HR Staff:**
- Manage staff schedules and assignments
- Access client communication tools
- View package information for client support
- Manage staff training and compliance

**Warehouse Admin:**
- Full system access and control
- System configuration and optimization
- User management within warehouse
- Integration with other platform components

### Task Management

**Daily Operations:**
- Package receiving and processing tasks
- Shipment creation and management tasks
- Inventory organization and maintenance
- Client communication and support

**Task Assignment:**
- Automatic task assignment based on workload
- Manual task assignment for special requirements
- Priority-based task ordering
- Real-time task status tracking

## Integration with Client System

### Data Synchronization

**Real-Time Integration:**
- Package status updates sync immediately to client app
- Request changes from client app sync to warehouse
- Client profile updates available in warehouse system
- Real-time inventory and capacity information

**Shared Database Architecture:**
```
PostgreSQL Database
├── Users (shared across platforms)
├── Package_Requests (created by client app)
├── Packages (created by warehouse from requests)
├── Shipments (created by warehouse)
├── Status_History (tracking complete lifecycle)
└── Notifications (cross-platform communications)
```

### Integration Points

**Client App → Warehouse:**
- New request notifications
- Client profile updates  
- Special handling requests
- Delivery preferences

**Warehouse → Client App:**
- Package status updates
- Tracking information updates
- Delivery confirmations
- Exception notifications

## Data Models & Database Design

### Core Entities

**Package (Warehouse Core Entity):**
```
Package {
  id: UUID (primary key)
  requestId: UUID (foreign key to package_requests)
  trackingNumber: string (unique, format: TTxxxxxxxxxxxx)
  userId: UUID (foreign key to users - client)
  
  // From original request
  originCountry: string
  originCity: string
  packageType: DOCUMENT | NON_DOCUMENT
  deliveryType: GROUND | AIR | SEA | EXPRESS
  packageCategory: string
  packageDescription: string
  
  // Warehouse-specific data
  physicalDimensions: {
    length: number
    width: number  
    height: number
    weight: number
  }
  
  warehouseLocation: {
    zone: string
    shelf: string
    position: string
  }
  
  condition: {
    status: string
    notes: string
    images: string[]
  }
  
  processingInfo: {
    assignedStaff: UUID
    priority: HIGH | MEDIUM | LOW
    processingNotes: string
    estimatedCompletion: timestamp
  }
  
  status: WarehousePackageStatus
  statusHistory: StatusHistoryEntry[]
  
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: UUID
  lastModifiedBy: UUID
}
```

**Shipment (Grouping Entity):**
```
Shipment {
  id: UUID (primary key)
  shipmentNumber: string (unique, format: SHPxxxxxxxxxxxx)
  packageIds: UUID[] (foreign keys to packages)
  
  shipmentType: GROUND | AIR | SEA | EXPRESS
  destinationRegion: string
  
  cargo: {
    vehicleId: UUID
    driverId: UUID
    route: RoutePoint[]
    departureTime: timestamp
    estimatedArrival: timestamp
    actualArrival: timestamp
  }
  
  consolidation: {
    totalPackages: number
    totalWeight: number
    totalVolume: number
    containerInfo: string
  }
  
  status: ShipmentStatus
  statusHistory: StatusHistoryEntry[]
  
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: UUID
}
```

**Status History (Audit Trail):**
```
StatusHistory {
  id: UUID (primary key)
  entityId: UUID (package or shipment ID)
  entityType: PACKAGE | SHIPMENT
  
  previousStatus: string
  newStatus: string
  statusTimestamp: timestamp
  
  location: LocationPoint
  updatedBy: UUID (staff member)
  updateReason: string
  notes: string
  
  automaticUpdate: boolean
  systemSource: string
  
  createdAt: timestamp
}
```

### Database Relationships

**Core Relationships:**
- Users (1) → Package_Requests (Many)
- Package_Requests (1) → Packages (1) 
- Packages (Many) → Shipments (Many) - Many-to-Many through junction table
- Users (1) → Status_History (Many) - for staff updates
- Packages (1) → Status_History (Many)
- Shipments (1) → Status_History (Many)

**Referential Integrity:**
- All foreign keys enforced with proper constraints
- Cascade deletion rules for related entities
- Audit trails preserved even after entity deletion

### Customs Documentation

**International Shipping Documentation Schema:**
```sql
CREATE TABLE customs_documentation (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  
  -- Export Documentation (Origin Country)
  export_permit VARCHAR(255),
  export_declaration_number VARCHAR(100),
  hs_code VARCHAR(50) NOT NULL, -- Harmonized System Code
  commodity_description TEXT NOT NULL,
  declared_value DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  
  -- Import Documentation (Destination Country)
  import_permit VARCHAR(255),
  import_declaration_number VARCHAR(100),
  
  -- Status Tracking
  customs_status VARCHAR(20) DEFAULT 'PENDING' 
    CHECK (customs_status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'UNDER_REVIEW')),
  rejection_reason TEXT,
  additional_docs_required JSONB,
  
  -- Document Storage
  documents JSONB, -- {"invoice": "url", "packing_list": "url", "certificate": "url"}
  
  -- Audit Trail
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  last_updated_by UUID REFERENCES users(id),
  
  -- Indexes for performance
  CONSTRAINT valid_hs_code CHECK (hs_code ~ '^\d{4,10}$')
);

-- Performance indexes
CREATE INDEX idx_customs_package_id ON customs_documentation(package_id);
CREATE INDEX idx_customs_status ON customs_documentation(customs_status);
CREATE INDEX idx_customs_created_at ON customs_documentation(created_at);
```

### Performance Optimizations

**Critical Database Indexes for Scale:**
```sql
-- Package tracking performance
CREATE INDEX idx_packages_tracking_number ON packages(trackingNumber);
CREATE INDEX idx_packages_status ON packages(status);
CREATE INDEX idx_packages_created_at ON packages(createdAt);
CREATE INDEX idx_packages_user_id ON packages(userId);

-- Request processing optimization  
CREATE INDEX idx_package_requests_user_id ON package_requests(userId);
CREATE INDEX idx_package_requests_status ON package_requests(status);
CREATE INDEX idx_package_requests_origin_country ON package_requests(originCountry);

-- Status history optimization
CREATE INDEX idx_status_history_entity ON status_history(entityId, entityType);
CREATE INDEX idx_status_history_timestamp ON status_history(statusTimestamp);
CREATE INDEX idx_status_history_status ON status_history(newStatus);

-- Shipment performance
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_destination ON shipments(destinationRegion);
CREATE INDEX idx_shipments_departure ON shipments(departureTime);

-- Composite indexes for common queries
CREATE INDEX idx_packages_user_status ON packages(userId, status);
CREATE INDEX idx_packages_country_type ON packages(originCountry, packageType);
```

**Partitioning Strategy for Large Tables:**
```sql
-- Partition status_history by month for performance
CREATE TABLE status_history (
  id UUID,
  entityId UUID,
  entityType VARCHAR(20),
  previousStatus VARCHAR(50),
  newStatus VARCHAR(50),
  statusTimestamp TIMESTAMP,
  location JSONB,
  updatedBy UUID,
  updateReason TEXT,
  notes TEXT,
  automaticUpdate BOOLEAN,
  systemSource VARCHAR(50),
  createdAt TIMESTAMP
) PARTITION BY RANGE (createdAt);

-- Create monthly partitions
CREATE TABLE status_history_2025_01 PARTITION OF status_history
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
  
CREATE TABLE status_history_2025_02 PARTITION OF status_history
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Auto-create future partitions with pg_partman extension
```

**Archive Strategy for Data Retention:**
```sql
-- Archive completed packages after 2 years
CREATE TABLE packages_archive (LIKE packages INCLUDING ALL);

-- Archive function
CREATE OR REPLACE FUNCTION archive_old_packages()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Move packages completed more than 2 years ago to archive
  WITH moved_packages AS (
    DELETE FROM packages 
    WHERE status = 'DELIVERED' 
    AND updatedAt < NOW() - INTERVAL '2 years'
    RETURNING *
  )
  INSERT INTO packages_archive SELECT * FROM moved_packages;
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Log archival activity
  INSERT INTO system_logs (action, details, timestamp)
  VALUES ('PACKAGE_ARCHIVE', json_build_object('count', archived_count), NOW());
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule monthly archival
SELECT cron.schedule('archive-packages', '0 2 1 * *', 'SELECT archive_old_packages();');
```

## API Endpoints

### Request Processing API Endpoints (International Focus)
```
GET  /api/warehouse/requests/pending           # Get new international requests awaiting processing
POST /api/warehouse/requests/{id}/approve      # Approve international request and create package
POST /api/warehouse/requests/{id}/reject       # Reject international request with reason
GET  /api/warehouse/requests/{id}/details      # Get complete international request details with client info
GET  /api/warehouse/requests/international     # Get cross-border requests for current warehouse
PUT  /api/warehouse/requests/{id}/export       # Mark request ready for international export
```

### Exception Handling API Endpoints
```
POST /api/warehouse/exceptions/report          # Log issues like customs rejections or missing packages
PUT  /api/warehouse/exceptions/{id}/update     # Update exception status and resolution steps
GET  /api/warehouse/exceptions                 # Get all active exceptions with filters
POST /api/warehouse/exceptions/{id}/resolve    # Mark exception as resolved with details
GET  /api/warehouse/exceptions/escalated       # Get exceptions requiring management attention
```

**Example Payloads for Exception Handling:**

**Report Exception:**
```json
POST /api/warehouse/exceptions/report

Request:
{
  "packageId": "550e8400-e29b-41d4-a716-446655440000",
  "exceptionType": "CUSTOMS_DELAY",
  "severity": "HIGH",
  "details": "Customs rejected due to missing HS code classification",
  "reportedBy": "550e8400-e29b-41d4-a716-446655440001",
  "timestamp": "2025-07-02T10:00:00Z",
  "affectedServices": ["EXPORT_PROCESSING", "CUSTOMER_NOTIFICATION"],
  "estimatedResolutionTime": "24_HOURS"
}

Response:
{
  "exceptionId": "550e8400-e29b-41d4-a716-446655440002",
  "status": "REPORTED",
  "assignedTo": "550e8400-e29b-41d4-a716-446655440003",
  "escalationLevel": "LEVEL_1",
  "createdAt": "2025-07-02T10:00:00Z",
  "expectedResolution": "2025-07-03T10:00:00Z"
}
```

**Resolve Exception:**
```json
POST /api/warehouse/exceptions/{id}/resolve

Request:
{
  "exceptionId": "550e8400-e29b-41d4-a716-446655440002",
  "resolution": "Provided missing HS code 8517.12.00 for mobile phones",
  "resolutionSteps": [
    "Contacted client for product specifications",
    "Researched correct HS code classification", 
    "Updated customs documentation",
    "Resubmitted to customs authority"
  ],
  "resolvedBy": "550e8400-e29b-41d4-a716-446655440003",
  "timestamp": "2025-07-02T12:00:00Z",
  "preventiveActions": "Added HS code validation to intake process"
}

Response:
{
  "exceptionId": "550e8400-e29b-41d4-a716-446655440002", 
  "status": "RESOLVED",
  "resolutionTime": "2 hours 15 minutes",
  "updatedAt": "2025-07-02T12:00:00Z",
  "packageStatus": "PROCESSING_RESUMED",
  "clientNotified": true
}
```

### International Package Management
```
GET  /api/warehouse/packages                   # Get all international packages with filters
GET  /api/warehouse/packages/{id}              # Get specific international package details
PUT  /api/warehouse/packages/{id}/status       # Update international package status
POST /api/warehouse/packages/{id}/receive      # Mark international package as physically received
PUT  /api/warehouse/packages/{id}/process      # Update international processing information
PUT  /api/warehouse/packages/{id}/export-prep  # Prepare package for international export
POST /api/warehouse/packages/{id}/images       # Upload international package images
GET  /api/warehouse/packages/export-ready      # Get packages ready for international shipment
```

### Cross-Border Coordination
```
POST /api/warehouse/international/handoff      # Send package data to destination country
GET  /api/warehouse/international/arrivals     # Get international packages arriving from other countries
PUT  /api/warehouse/international/{id}/customs # Update customs clearance status
POST /api/warehouse/international/{id}/ready-for-pickup # Mark international package ready for customer pickup
POST /api/warehouse/customs/generate-documents # Generate customs forms and documentation
PUT  /api/warehouse/customs/update-status      # Update customs processing status
GET  /api/warehouse/customs/{id}/documents     # Retrieve customs documentation
```

**Customs Documentation API Examples:**

**Generate Customs Documents:**
```json
POST /api/warehouse/customs/generate-documents

Request:
{
  "packageId": "550e8400-e29b-41d4-a716-446655440000",
  "hsCode": "8517.12.00",
  "commodityDescription": "Mobile phones and smartphones",
  "declaredValue": 500.00,
  "currency": "USD",
  "exportPermitRequired": true,
  "destinationCountry": "GH",
  "generatedBy": "550e8400-e29b-41d4-a716-446655440001"
}

Response:
{
  "documentationId": "550e8400-e29b-41d4-a716-446655440002",
  "generatedDocuments": [
    {
      "type": "EXPORT_DECLARATION",
      "reference": "EXP-2025-001234",
      "downloadUrl": "https://api.Vanguard.com/docs/export-declarations/EXP-2025-001234.pdf"
    },
    {
      "type": "COMMERCIAL_INVOICE", 
      "reference": "INV-2025-001234",
      "downloadUrl": "https://api.Vanguard.com/docs/invoices/INV-2025-001234.pdf"
    }
  ],
  "submissionDeadline": "2025-07-05T15:00:00Z",
  "estimatedClearanceTime": "24-48 hours"
}
```

**Update Customs Status:**
```json
PUT /api/warehouse/customs/update-status

Request:
{
  "packageId": "550e8400-e29b-41d4-a716-446655440000",
  "customsStatus": "APPROVED",
  "clearanceReference": "GH-CUSTOM-2025-5678",
  "rejectionReason": null,
  "additionalFees": {
    "dutyAmount": 75.50,
    "currency": "GHC",
    "paidBy": "CONSIGNEE"
  },
  "updatedBy": "550e8400-e29b-41d4-a716-446655440003",
  "timestamp": "2025-07-02T14:30:00Z"
}

Response:
{
  "packageId": "550e8400-e29b-41d4-a716-446655440000",
  "customsStatus": "APPROVED", 
  "clearanceDate": "2025-07-02T14:30:00Z",
  "totalProcessingTime": "18 hours 30 minutes",
  "nextStep": "WAREHOUSE_DELIVERY",
  "updatedAt": "2025-07-02T14:30:00Z"
}
```

### Origin Country Validation Endpoints
```
GET  /api/client/countries/available/{clientCountry}  # Get available origin countries for client
POST /api/client/requests/validate                   # Validate international request before submission
GET  /api/client/routes/supported                     # Get supported international shipping routes
```

### Shipment Operations
```
GET  /api/warehouse/packages/ready-for-shipment # Get processed packages ready for grouping
POST /api/warehouse/shipments                   # Create new shipment from packages
GET  /api/warehouse/shipments                   # Get all shipments with filters
GET  /api/warehouse/shipments/{id}              # Get specific shipment details
PUT  /api/warehouse/shipments/{id}/status       # Update shipment status
POST /api/warehouse/shipments/{id}/dispatch     # Mark shipment as dispatched
PUT  /api/warehouse/shipments/{id}/cargo    # Update vehicle/driver assignment
```

### Tracking & Status
```
GET  /api/warehouse/tracking/{trackingNumber}   # Get tracking information
POST /api/warehouse/tracking/update             # Create new tracking point
GET  /api/warehouse/packages/{id}/timeline      # Get complete package timeline
GET  /api/warehouse/shipments/{id}/timeline     # Get shipment timeline
PUT  /api/warehouse/status/sync                 # Sync status updates to client app
```

### Staff Operations
```
GET  /api/warehouse/staff/tasks                 # Get assigned tasks for current user
PUT  /api/warehouse/staff/tasks/{id}/complete   # Mark task as completed
GET  /api/warehouse/dashboard                   # Get warehouse dashboard data
POST /api/warehouse/exceptions                  # Report exception requiring attention
GET  /api/warehouse/workload                    # Get current workload statistics
```

### Client Communication
```
POST /api/warehouse/notifications/send          # Send notification to client
GET  /api/warehouse/notifications/templates     # Get notification templates
POST /api/warehouse/whatsapp/send              # Send WhatsApp message
GET  /api/warehouse/clients/{id}/packages       # Get all packages for specific client
POST /api/warehouse/clients/{id}/notify         # Send custom notification to client
```

### Reporting & Analytics
```
GET  /api/warehouse/reports/daily               # Daily operations report
GET  /api/warehouse/reports/packages            # Package statistics
GET  /api/warehouse/reports/shipments           # Shipment performance
GET  /api/warehouse/analytics/efficiency        # Warehouse efficiency metrics
GET  /api/warehouse/analytics/trends            # Operational trends
```

### Development Guidelines

**API Development Standards:**

**OpenAPI/Swagger Documentation:**
```yaml
# Example OpenAPI specification
openapi: 3.0.0
info:
  title: Vanguard Cargo Warehouse API
  version: 1.0.0
  description: International cargo warehouse management system
paths:
  /api/warehouse/packages/{id}/status:
    put:
      summary: Update package status
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/StatusUpdate'
      responses:
        '200':
          description: Status updated successfully
        '400':
          description: Invalid status transition
        '404':
          description: Package not found
```

**Input Validation Requirements:**
```typescript
// Strict validation for international requests
const validateInternationalRequest = (req: Request): ValidationResult => {
  const errors: string[] = [];
  
  // Origin country cannot equal client country
  if (req.body.originCountry === req.user.country) {
    errors.push("Origin country must be different from client country");
  }
  
  // Supported countries validation
  const supportedCountries = ['GH', 'US']; // Future: load from database
  if (!supportedCountries.includes(req.body.originCountry)) {
    errors.push("Origin country not supported");
  }
  
  // Package type validation
  const validPackageTypes = ['DOCUMENT', 'NON_DOCUMENT'];
  if (!validPackageTypes.includes(req.body.packageType)) {
    errors.push("Invalid package type");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

**Rate Limiting Implementation:**
```typescript
// Rate limiting for tracking endpoints
const trackingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many tracking requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to tracking routes
app.use('/api/warehouse/tracking', trackingRateLimit);
```

### Future Production

### Transportation Managers Application

**Real-Time Trip Monitoring and Communication System**

The Transportation Managers Application provides field personnel with comprehensive tools to monitor shipments during transit and maintain real-time communication with warehouse operations.

#### Core Features

**Trip Management Dashboard:**
- Active shipment tracking with GPS integration
- Real-time status updates during transit
- Route optimization and traffic monitoring
- Delivery schedule management
- Exception reporting and resolution

**Mobile Application Requirements:**
```typescript
// Transportation Manager Mobile App Core Features
interface TransportationManagerApp {
  tripManagement: {
    activeShipments: Shipment[];
    currentLocation: GPSCoordinates;
    nextDelivery: DeliveryStop;
    routeOptimization: RouteData;
  };
  
  statusUpdates: {
    departureConfirmation: boolean;
    transitUpdates: StatusUpdate[];
    arrivalConfirmation: boolean;
    exceptionReporting: ExceptionReport[];
  };
  
  communication: {
    warehouseChat: ChatInterface;
    customerNotifications: NotificationSystem;
    emergencyContacts: ContactList;
    photoDocumentation: ImageCapture;
  };
  
  documentation: {
    manifests: ShipmentManifest[];
    customsForms: CustomsDocumentation[];
    deliveryReceipts: DigitalSignature[];
    damageReports: IncidentReport[];
  };
}
```

#### Real-Time Status Updates

**Trip Progress Tracking:**
```typescript
// API for Transportation Manager Updates
POST /api/transportation/trip/{tripId}/status-update
{
  tripId: UUID;
  managerId: UUID;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: ISO_DATE;
  };
  status: "DEPARTED" | "IN_TRANSIT" | "DELAYED" | "ARRIVED" | "DELIVERED" | "EXCEPTION";
  estimatedArrival?: ISO_DATE;
  notes?: string;
  photos?: string[]; // Base64 encoded images
  weatherConditions?: string;
  trafficConditions?: string;
}

Response:
{
  updateId: UUID;
  acknowledged: boolean;
  nextCheckIn: ISO_DATE;
  warehouseInstructions?: string;
  emergencyContacts?: Contact[];
}
```

**Exception Reporting During Transit:**
```typescript
// Field Exception Reporting
POST /api/transportation/exceptions/field-report
{
  tripId: UUID;
  managerId: UUID;
  exceptionType: "VEHICLE_BREAKDOWN" | "CUSTOMS_DELAY" | "WEATHER_DELAY" | "SECURITY_INCIDENT" | "DAMAGE_DISCOVERED" | "ROUTE_BLOCKED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  location: GPSCoordinates;
  photosEvidence: string[];
  estimatedDelay?: number; // minutes
  assistanceRequired: boolean;
  timestamp: ISO_DATE;
}

Response:
{
  reportId: UUID;
  escalated: boolean;
  supportDispatch: {
    contactNumber: string;
    eta: ISO_DATE;
    instructions: string[];
  };
  alternativeRoutes?: Route[];
  customerNotificationSent: boolean;
}
```

#### Package Condition Monitoring

**In-Transit Package Verification:**
```typescript
// Package condition checks during loading/unloading
POST /api/transportation/packages/{packageId}/condition-check
{
  packageId: UUID;
  tripId: UUID;
  managerId: UUID;
  checkType: "PRE_DEPARTURE" | "DURING_TRANSIT" | "PRE_DELIVERY";
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "DAMAGED" | "MISSING";
  photos: string[];
  notes: string;
  damageSeverity?: "MINOR" | "MODERATE" | "SEVERE";
  actionTaken?: string;
  timestamp: ISO_DATE;
}

Response:
{
  checkId: UUID;
  warehouseNotified: boolean;
  customerAlerted: boolean;
  insuranceClaim?: {
    claimId: UUID;
    estimatedValue: number;
    nextSteps: string[];
  };
  continueDelivery: boolean;
}
```

#### GPS and Route Tracking

**Real-Time Location Monitoring:**
```sql
-- Transportation tracking table
CREATE TABLE transportation_tracking (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES shipment_trips(id),
  manager_id UUID REFERENCES users(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5,2), -- km/h
  heading INTEGER, -- degrees 0-360
  address TEXT,
  recorded_at TIMESTAMP DEFAULT NOW(),
  battery_level INTEGER, -- device battery %
  signal_strength INTEGER, -- network signal strength
  
  -- Indexes for performance
  INDEX idx_trip_tracking (trip_id, recorded_at),
  INDEX idx_manager_tracking (manager_id, recorded_at)
);
```

**Geofencing and Automated Alerts:**
```typescript
// Geofencing system for automated notifications
interface GeofenceRule {
  id: UUID;
  name: string;
  coordinates: GPSCoordinates[];
  type: "WAREHOUSE" | "CUSTOMS" | "DELIVERY_ZONE" | "RESTRICTED_AREA";
  actions: {
    onEntry: NotificationAction[];
    onExit: NotificationAction[];
    alertThreshold: number; // minutes
  };
}

// Automated geofence monitoring
POST /api/transportation/geofence/event
{
  tripId: UUID;
  managerId: UUID;
  geofenceId: UUID;
  eventType: "ENTERED" | "EXITED" | "DELAYED_ENTRY" | "UNAUTHORIZED_EXIT";
  location: GPSCoordinates;
  timestamp: ISO_DATE;
}
```

### Customer Service Application

**Comprehensive Warehouse Customer Support System**

The Customer Service Application provides warehouse staff with powerful tools to assist customers, resolve issues, and maintain high service quality.

#### Customer Service Dashboard

**Unified Customer Information Hub:**
```typescript
// Customer Service Interface
interface CustomerServiceDashboard {
  customerLookup: {
    searchBy: "PHONE" | "EMAIL" | "TRACKING_NUMBER" | "NAME" | "ID";
    customerProfile: CustomerProfile;
    activePackages: Package[];
    shipmentHistory: ShipmentHistory[];
    interactionHistory: ServiceInteraction[];
  };
  
  caseManagement: {
    activeCases: SupportCase[];
    priorityQueue: UrgentCase[];
    escalationRules: EscalationRule[];
    resolutionTemplates: ResponseTemplate[];
  };
  
  communicationTools: {
    multiChannelMessaging: MessageInterface;
    callIntegration: PhoneSystem;
    emailTemplates: EmailTemplate[];
    translationService: LanguageSupport;
  };
  
  knowledgeBase: {
    faqDatabase: FAQ[];
    procedureGuides: Procedure[];
    escalationPaths: EscalationPath[];
    documentLibrary: Document[];
  };
}
```

#### Multi-Channel Customer Support

**Integrated Communication System:**
```typescript
// Omnichannel customer communication
POST /api/customer-service/communication/send
{
  customerId: UUID;
  agentId: UUID;
  channel: "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "CHAT";
  messageType: "INQUIRY_RESPONSE" | "STATUS_UPDATE" | "ISSUE_RESOLUTION" | "PROACTIVE_ALERT";
  content: {
    subject?: string;
    message: string;
    attachments?: string[];
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  };
  trackingNumbers?: string[];
  followUpRequired: boolean;
  escalationTriggered?: boolean;
}

Response:
{
  messageId: UUID;
  deliveryStatus: "SENT" | "DELIVERED" | "READ" | "FAILED";
  estimatedResponse: ISO_DATE;
  caseCreated?: UUID;
  nextActions: string[];
}
```

#### Case Management System

**Support Ticket and Issue Tracking:**
```sql
-- Customer service cases table
CREATE TABLE customer_service_cases (
  id UUID PRIMARY KEY,
  case_number VARCHAR(20) UNIQUE NOT NULL, -- CS-2025-001234
  customer_id UUID REFERENCES users(id),
  package_ids UUID[], -- Array of related package IDs
  
  -- Case Details
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'TRACKING_INQUIRY', 'DELIVERY_DELAY', 'PACKAGE_DAMAGE', 
    'BILLING_QUESTION', 'CUSTOMS_ISSUE', 'GENERAL_INQUIRY',
    'COMPLAINT', 'REFUND_REQUEST', 'PICKUP_SCHEDULING'
  )),
  priority VARCHAR(10) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN (
    'OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'ESCALATED', 
    'RESOLVED', 'CLOSED', 'REOPENED'
  )),
  
  -- Content
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  customer_contact_preference VARCHAR(20),
  language_preference VARCHAR(10) DEFAULT 'en',
  
  -- Assignment and Tracking
  assigned_agent_id UUID REFERENCES users(id),
  assigned_team VARCHAR(50),
  created_by UUID REFERENCES users(id),
  
  -- SLA Tracking
  response_due TIMESTAMP,
  resolution_due TIMESTAMP,
  first_response_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- Metrics
  customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating BETWEEN 1 AND 5),
  resolution_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_cs_cases_customer ON customer_service_cases(customer_id);
CREATE INDEX idx_cs_cases_agent ON customer_service_cases(assigned_agent_id);
CREATE INDEX idx_cs_cases_status_priority ON customer_service_cases(status, priority);
CREATE INDEX idx_cs_cases_category ON customer_service_cases(category);
```

**Automated Case Routing:**
```typescript
// Intelligent case assignment system
class CaseRoutingSystem {
  static async assignCase(caseDetails: NewSupportCase): Promise<CaseAssignment> {
    const routingRules = await this.getRoutingRules();
    
    // Determine assignment based on case category and complexity
    const assignment = this.calculateBestAgent({
      category: caseDetails.category,
      priority: caseDetails.priority,
      language: caseDetails.language,
      customerTier: caseDetails.customerProfile.tier,
      agentWorkload: await this.getAgentWorkloads(),
      agentSkills: await this.getAgentSkills()
    });
    
    return {
      assignedAgent: assignment.agentId,
      estimatedResolutionTime: assignment.slaTarget,
      escalationPath: assignment.escalationRules,
      responseTemplate: assignment.suggestedTemplate
    };
  }
  
  private static calculateBestAgent(criteria: AssignmentCriteria): AgentAssignment {
    // Algorithm to match cases with best available agent
    // Considers: workload, expertise, language skills, customer history
    return {
      agentId: "best-match-agent-id",
      slaTarget: this.calculateSLA(criteria),
      escalationRules: this.getEscalationPath(criteria),
      suggestedTemplate: this.getResponseTemplate(criteria)
    };
  }
}
```

#### Knowledge Base and FAQ System

**Self-Service and Agent Support:**
```typescript
// Knowledge base management
interface KnowledgeBase {
  articles: {
    id: UUID;
    title: string;
    content: string;
    category: string;
    tags: string[];
    language: string;
    lastUpdated: ISO_DATE;
    views: number;
    helpfulness: number;
  }[];
  
  procedures: {
    id: UUID;
    name: string;
    steps: ProcedureStep[];
    category: string;
    requiredRole: string[];
    estimatedTime: number;
  }[];
  
  escalationPaths: {
    trigger: string;
    condition: string;
    nextLevel: string;
    timeframe: number;
    requiredApproval: boolean;
  }[];
}

// Smart search and suggestion system
GET /api/customer-service/knowledge-base/search
Query Parameters:
- query: string (customer question or keywords)
- category?: string
- language?: string
- customerTier?: string

Response:
{
  suggestions: [
    {
      articleId: UUID;
      title: string;
      relevanceScore: number;
      quickAnswer: string;
      fullContent?: string;
    }
  ];
  automatedResponses: [
    {
      templateId: UUID;
      suggestedResponse: string;
      confidence: number;
    }
  ];
  escalationRecommended: boolean;
}
```

#### Customer Satisfaction and Quality Assurance

**Service Quality Monitoring:**
```sql
-- Customer satisfaction tracking
CREATE TABLE customer_satisfaction (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES customer_service_cases(id),
  customer_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES users(id),
  
  -- Ratings (1-5 scale)
  overall_satisfaction INTEGER CHECK (overall_satisfaction BETWEEN 1 AND 5),
  response_speed INTEGER CHECK (response_speed BETWEEN 1 AND 5),
  problem_resolution INTEGER CHECK (problem_resolution BETWEEN 1 AND 5),
  agent_helpfulness INTEGER CHECK (agent_helpfulness BETWEEN 1 AND 5),
  
  -- Feedback
  positive_feedback TEXT,
  improvement_suggestions TEXT,
  would_recommend BOOLEAN,
  
  -- Survey metadata
  survey_method VARCHAR(20), -- EMAIL, SMS, PHONE, IN_APP
  survey_completed_at TIMESTAMP DEFAULT NOW(),
  follow_up_permission BOOLEAN DEFAULT false
);

-- Quality assurance monitoring
CREATE TABLE quality_assurance_reviews (
  id UUID PRIMARY KEY,
  case_id UUID REFERENCES customer_service_cases(id),
  agent_id UUID REFERENCES users(id),
  reviewer_id UUID REFERENCES users(id),
  
  -- QA Scores (1-10 scale)
  communication_quality INTEGER CHECK (communication_quality BETWEEN 1 AND 10),
  problem_solving INTEGER CHECK (problem_solving BETWEEN 1 AND 10),
  policy_adherence INTEGER CHECK (policy_adherence BETWEEN 1 AND 10),
  customer_empathy INTEGER CHECK (customer_empathy BETWEEN 1 AND 10),
  
  overall_score INTEGER CHECK (overall_score BETWEEN  1 AND 10),
  feedback TEXT,
  training_recommended BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP DEFAULT NOW()
);
```

#### Performance Analytics and Reporting

**Customer Service Metrics Dashboard:**
```typescript
// Customer service analytics API
GET /api/customer-service/analytics/dashboard
Query Parameters:
- dateRange: string (7d, 30d, 90d, custom)
- agentId?: UUID
- team?: string
- category?: string

Response:
{
  caseMetrics: {
    totalCases: number;
    openCases: number;
    resolvedCases: number;
    averageResolutionTime: number; // hours
    firstResponseTime: number; // minutes
    escalationRate: number; // percentage
  };
  
  customerSatisfaction: {
    averageRating: number;
    responseRate: number; // percentage who completed survey
    npsScore: number; // Net Promoter Score
    topCompliments: string[];
    commonComplaints: string[];
  };
  
  agentPerformance: {
    caseLoad: number;
    resolutionRate: number;
    averageRating: number;
    productivityScore: number;
  };
  
  trendAnalysis: {
    caseVolumeByDay: TimeSeriesData[];
    categoriesBreakdown: CategoryData[];
    peakHours: HourlyData[];
  };
}
```

#### Integration with Warehouse Operations

**Seamless Operational Integration:**
```typescript
// Integration with warehouse systems
interface WarehouseIntegration {
  packageTracking: {
    realTimeStatus: (trackingNumber: string) => PackageStatus;
    locationHistory: (packageId: UUID) => LocationHistory[];
    estimatedDelivery: (packageId: UUID) => EstimatedDelivery;
  };
  
  inventoryAccess: {
    warehouseCapacity: () => CapacityInfo;
    packageLocation: (packageId: UUID) => WarehouseLocation;
    staffAvailability: () => StaffStatus[];
  };
  
  actionRequests: {
    expeditePackage: (packageId: UUID, reason: string) => ActionResult;
    schedulePickup: (customerId: UUID, preferences: PickupPreferences) => ScheduleResult;
    initiateInvestigation: (packageId: UUID, issue: string) => InvestigationCase;
  };
}

// Customer service actions
POST /api/customer-service/actions/expedite-package
{
  packageId: UUID;
  customerId: UUID;
  agentId: UUID;
  reason: string;
  priority: "STANDARD" | "URGENT" | "EMERGENCY";
  approvalRequired: boolean;
  customerNotification: boolean;
}

Response:
{
  actionId: UUID;
  approved: boolean;
  newEstimatedDelivery?: ISO_DATE;
  additionalCost?: number;
  managerApprovalNeeded: boolean;
  customerNotified: boolean;
}
```

### Future Development Roadmap

**Phase 1: Transportation Management (Q3 2025)**
- Mobile app development for transportation managers
- GPS tracking integration
- Real-time status update system
- Exception reporting workflow

**Phase 2: Customer Service Platform (Q4 2025)**
- Omnichannel communication system
- Case management implementation
- Knowledge base development
- Quality assurance framework

**Phase 3: Advanced Analytics (Q1 2026)**
- Predictive analytics for delivery delays
- Customer behavior analysis
- Automated issue resolution
- Performance optimization algorithms

**Phase 4: AI Integration (Q2 2026)**
- Chatbot for common inquiries
- Intelligent case routing
- Predictive customer service
- Automated response generation

---

**This Future Production section establishes the framework for enhanced operational visibility and customer service capabilities, supporting the continued growth and excellence of the Vanguard Cargo international warehouse system.**