-- ============================================================================
-- Add Final Missing Foreign Key Indexes
-- ============================================================================
-- Description: Adds remaining foreign key indexes that were accidentally removed
-- These are REQUIRED for good performance - don't remove them!
-- ============================================================================

-- ============================================================================
-- Add indexes for foreign keys that need them
-- ============================================================================

-- email_notification_log.user_id (FK)
CREATE INDEX IF NOT EXISTS idx_email_notification_log_user_id 
ON public.email_notification_log(user_id);

-- email_notification_queue.notification_id (FK)
CREATE INDEX IF NOT EXISTS idx_email_notification_queue_notification_id 
ON public.email_notification_queue(notification_id);

-- email_notifications_log.package_id (FK)
CREATE INDEX IF NOT EXISTS idx_email_notifications_log_package_id 
ON public.email_notifications_log(package_id);

-- email_notifications_log.user_id (FK)
CREATE INDEX IF NOT EXISTS idx_email_notifications_log_user_id 
ON public.email_notifications_log(user_id);

-- package_documents.package_id (FK)
CREATE INDEX IF NOT EXISTS idx_package_documents_package_id 
ON public.package_documents(package_id);

-- package_verification_log.package_id (FK)
CREATE INDEX IF NOT EXISTS idx_package_verification_log_package_id 
ON public.package_verification_log(package_id);

-- package_verification_log.verified_by (FK)
CREATE INDEX IF NOT EXISTS idx_package_verification_log_verified_by 
ON public.package_verification_log(verified_by);

-- pickup_code_verification_logs.package_id (FK)
CREATE INDEX IF NOT EXISTS idx_pickup_code_verification_logs_package_id 
ON public.pickup_code_verification_logs(package_id);

-- pickup_code_verification_logs.shipment_id (FK)
CREATE INDEX IF NOT EXISTS idx_pickup_code_verification_logs_shipment_id 
ON public.pickup_code_verification_logs(shipment_id);

-- receipts.shipment_id (FK)
CREATE INDEX IF NOT EXISTS idx_receipts_shipment_id 
ON public.receipts(shipment_id);

-- receipts.user_id (FK)
CREATE INDEX IF NOT EXISTS idx_receipts_user_id 
ON public.receipts(user_id);

-- shipments.user_id (FK)
CREATE INDEX IF NOT EXISTS idx_shipments_user_id 
ON public.shipments(user_id);

-- support_messages.user_id (FK)
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id 
ON public.support_messages(user_id);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Added 13 missing foreign key indexes';
    RAISE NOTICE '';
    RAISE NOTICE '📊 These indexes are CRITICAL for performance:';
    RAISE NOTICE '  • Speed up JOIN operations';
    RAISE NOTICE '  • Speed up foreign key constraint checks';
    RAISE NOTICE '  • Prevent slow DELETE/UPDATE cascades';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: DO NOT remove foreign key indexes!';
    RAISE NOTICE '   They may show as "unused" initially but are essential';
    RAISE NOTICE '   for query performance as your database grows.';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 All unindexed_foreign_keys warnings should now be resolved!';
END;
$$;
