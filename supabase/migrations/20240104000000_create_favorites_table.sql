-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorited_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, favorited_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_favorited_user_id ON favorites(favorited_user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);

-- Enable Row Level Security
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON favorites TO authenticated;
GRANT ALL ON favorites TO service_role;

-- Create function for favorite RSVP notifications
CREATE OR REPLACE FUNCTION notify_favorite_rsvp()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any users have favorited the new RSVP user
  INSERT INTO notifications (user_id, type, title, message, metadata, created_at)
  SELECT 
    f.user_id,
    'favorite_rsvp',
    'Your favorite is attending!',
    (SELECT name FROM profiles WHERE id = NEW.user_id) || ' is attending ' || 
    (SELECT title FROM events WHERE id = NEW.event_id),
    jsonb_build_object(
      'event_id', NEW.event_id,
      'favorited_user_id', NEW.user_id,
      'rsvp_id', NEW.id
    ),
    NOW()
  FROM favorites f
  WHERE f.favorited_user_id = NEW.user_id
    AND f.user_id != NEW.user_id  -- Don't notify the user about their own RSVP
    AND NEW.status = 'going'
    AND EXISTS (
      -- Check if the notified user is also attending this event
      SELECT 1 FROM rsvps r2 
      WHERE r2.user_id = f.user_id 
      AND r2.event_id = NEW.event_id 
      AND r2.status = 'going'
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for favorite RSVP notifications
CREATE TRIGGER on_favorite_rsvp
  AFTER INSERT OR UPDATE ON rsvps
  FOR EACH ROW
  EXECUTE FUNCTION notify_favorite_rsvp();

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions for notifications
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;