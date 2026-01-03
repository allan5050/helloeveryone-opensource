-- Create handle_rsvp function for atomic RSVP operations
CREATE OR REPLACE FUNCTION handle_rsvp(
  p_event_id UUID,
  p_user_id UUID,
  p_action TEXT -- 'create' or 'cancel'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_capacity INT;
  v_current_attendees INT;
  v_existing_rsvp UUID;
  v_result JSON;
BEGIN
  -- Lock the event row for update to prevent concurrent modifications
  SELECT capacity INTO v_event_capacity
  FROM events
  WHERE id = p_event_id
  FOR UPDATE;
  
  -- Check if event exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Event not found'
    );
  END IF;
  
  -- Check for existing RSVP
  SELECT id INTO v_existing_rsvp
  FROM rsvps
  WHERE event_id = p_event_id AND user_id = p_user_id;
  
  IF p_action = 'create' THEN
    -- Check if already RSVPd
    IF v_existing_rsvp IS NOT NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Already RSVPd to this event'
      );
    END IF;
    
    -- Count current attendees
    SELECT COUNT(*) INTO v_current_attendees
    FROM rsvps
    WHERE event_id = p_event_id AND status = 'confirmed';
    
    -- Check capacity
    IF v_event_capacity IS NOT NULL AND v_current_attendees >= v_event_capacity THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Event is at full capacity'
      );
    END IF;
    
    -- Create RSVP
    INSERT INTO rsvps (event_id, user_id, status, created_at)
    VALUES (p_event_id, p_user_id, 'confirmed', NOW());
    
    -- Update attendee count
    UPDATE events
    SET attendee_count = v_current_attendees + 1
    WHERE id = p_event_id;
    
    v_result := json_build_object(
      'success', true,
      'message', 'RSVP created successfully',
      'attendee_count', v_current_attendees + 1
    );
    
  ELSIF p_action = 'cancel' THEN
    -- Check if RSVP exists
    IF v_existing_rsvp IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'No RSVP found to cancel'
      );
    END IF;
    
    -- Delete RSVP
    DELETE FROM rsvps
    WHERE event_id = p_event_id AND user_id = p_user_id;
    
    -- Update attendee count
    SELECT COUNT(*) INTO v_current_attendees
    FROM rsvps
    WHERE event_id = p_event_id AND status = 'confirmed';
    
    UPDATE events
    SET attendee_count = v_current_attendees
    WHERE id = p_event_id;
    
    v_result := json_build_object(
      'success', true,
      'message', 'RSVP cancelled successfully',
      'attendee_count', v_current_attendees
    );
    
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid action. Use "create" or "cancel"'
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Add attendee_count column to events table if it doesn't exist
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendee_count INT DEFAULT 0;

-- Create index for faster RSVP lookups
CREATE INDEX IF NOT EXISTS idx_rsvps_event_user ON rsvps(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_status ON rsvps(event_id, status);

-- Create trigger to automatically update attendee count
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events
    SET attendee_count = (
      SELECT COUNT(*)
      FROM rsvps
      WHERE event_id = NEW.event_id AND status = 'confirmed'
    )
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events
    SET attendee_count = (
      SELECT COUNT(*)
      FROM rsvps
      WHERE event_id = OLD.event_id AND status = 'confirmed'
    )
    WHERE id = OLD.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      UPDATE events
      SET attendee_count = (
        SELECT COUNT(*)
        FROM rsvps
        WHERE event_id = NEW.event_id AND status = 'confirmed'
      )
      WHERE id = NEW.event_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attendee_count ON rsvps;
CREATE TRIGGER trigger_update_attendee_count
AFTER INSERT OR DELETE OR UPDATE OF status ON rsvps
FOR EACH ROW
EXECUTE FUNCTION update_event_attendee_count();

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION handle_rsvp TO authenticated;