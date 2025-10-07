-- ============================================================================
-- MASTER DEPLOYMENT SCRIPT: PICKUP CODE SYSTEM
-- ============================================================================
--
-- Auto-generates 6-digit pickup codes when shipments arrive
-- Provides secure verification with rate limiting and audit logging
--
-- @author Senior Software Engineer
-- @version 1.0.0
-- @date 2025-10-07
--
-- DEPLOYMENT ORDER:
--   1. 60_shipment_arrival_code_generation.sql - Tables, triggers, code generation
--   2. 61_pickup_code_verification.sql - Verification endpoint with security
--
-- ============================================================================

\echo '============================================================================'
\echo 'DEPLOYING: Pickup Code System for Shipment Arrival'
\echo '============================================================================'
\echo ''

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\echo 'Step 1/2: Deploying auto-generation system...'
\echo ''
\i 60_shipment_arrival_code_generation.sql
\echo ''

\echo 'Step 2/2: Deploying verification endpoint...'
\echo ''
\i 61_pickup_code_verification.sql
\echo ''

\echo '============================================================================'
\echo 'DEPLOYMENT COMPLETE: Pickup Code System'
\echo '============================================================================'
\echo ''
\echo 'SYSTEM CAPABILITIES:'
\echo '  ✅ Auto-generate codes when shipment status → arrived'
\echo '  ✅ Secure bcrypt hashing for code storage'
\echo '  ✅ Rate limiting (5 attempts, 30 min lockout)'
\echo '  ✅ Code expiry (default 30 days)'
\echo '  ✅ Complete audit logging'
\echo '  ✅ Admin regeneration capability'
\echo ''
\echo 'DATABASE OBJECTS CREATED:'
\echo '  - Tables: pickup_code_verification_logs'
\echo '  - Triggers: shipment_arrival_code_generation_trigger'
\echo '  - Functions:'
\echo '      * generate_pickup_codes_for_shipment()'
\echo '      * verify_pickup_code()'
\echo '      * regenerate_pickup_code()'
\echo '      * get_package_verification_logs()'
\echo '      * generate_secure_6digit_code()'
\echo '      * hash_pickup_code()'
\echo '      * verify_pickup_code_hash()'
\echo ''
\echo 'NEXT STEPS:'
\echo '  1. Test by updating a shipment status to "arrived"'
\echo '  2. Check pickup_code_verification_logs for generation events'
\echo '  3. Use verify_pickup_code() function in Delivery page'
\echo '  4. Monitor verification logs for security'
\echo ''
\echo '============================================================================'
