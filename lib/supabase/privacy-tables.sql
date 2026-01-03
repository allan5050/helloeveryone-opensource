-- Privacy-related tables for comprehensive GDPR compliance

-- Account deletions audit table
CREATE TABLE IF NOT EXISTS account_deletions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Privacy audit log table
CREATE TABLE IF NOT EXISTS privacy_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data export requests table (for tracking GDPR export requests)
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  download_link TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Consent tracking table for GDPR compliance
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL, -- 'privacy_policy', 'terms_of_service', 'marketing', etc.
  consent_given BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_account_deletions_user_id ON account_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletions_deleted_at ON account_deletions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_user_id ON privacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_action ON privacy_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_created_at ON privacy_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_expires_at ON data_export_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_created_at ON user_consents(created_at);

-- RLS policies for privacy tables
ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Admin-only access to audit tables (service role only)
CREATE POLICY "Admin access to account deletions" ON account_deletions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin access to privacy audit log" ON privacy_audit_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own export requests
CREATE POLICY "Users can view their own export requests" ON data_export_requests
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own export requests" ON data_export_requests
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can view their own consent records
CREATE POLICY "Users can view their own consents" ON user_consents
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own consents" ON user_consents
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own consents" ON user_consents
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Function to cleanup expired export requests
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
  DELETE FROM data_export_requests 
  WHERE expires_at < NOW() 
  AND status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's data portability summary
CREATE OR REPLACE FUNCTION get_user_data_summary(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'profile_data', (SELECT COUNT(*) FROM profiles WHERE id = user_uuid),
    'messages_sent', (SELECT COUNT(*) FROM messages WHERE sender_id = user_uuid AND is_deleted = false),
    'messages_received', (SELECT COUNT(*) FROM messages WHERE recipient_id = user_uuid AND is_deleted = false),
    'events_organized', (SELECT COUNT(*) FROM events WHERE organizer_id = user_uuid),
    'event_rsvps', (SELECT COUNT(*) FROM rsvps WHERE user_id = user_uuid),
    'matches', (SELECT COUNT(*) FROM match_scores WHERE user1_id = user_uuid OR user2_id = user_uuid),
    'favorites_given', (SELECT COUNT(*) FROM favorites WHERE user_id = user_uuid),
    'favorites_received', (SELECT COUNT(*) FROM favorites WHERE target_user_id = user_uuid),
    'blocked_users', (SELECT COUNT(*) FROM blocks WHERE blocker_id = user_uuid),
    'last_activity', (SELECT updated_at FROM profiles WHERE id = user_uuid)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup job (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-exports', '0 2 * * *', 'SELECT cleanup_expired_exports();');