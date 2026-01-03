-- Create table for storing AI-generated match insights
CREATE TABLE ai_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id),
  target_user_id UUID NOT NULL REFERENCES profiles(user_id),
  compatibility_reason TEXT NOT NULL,
  conversation_starters JSONB NOT NULL DEFAULT '[]'::jsonb,
  meeting_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  shared_interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one insight per user pair (latest overwrites previous)
  UNIQUE(user_id, target_user_id)
);

-- Add RLS policies
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own AI insights
CREATE POLICY "Users can view their own AI insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own AI insights
CREATE POLICY "Users can insert their own AI insights" ON ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own AI insights
CREATE POLICY "Users can update their own AI insights" ON ai_insights
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own AI insights
CREATE POLICY "Users can delete their own AI insights" ON ai_insights
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_target_user_id ON ai_insights(target_user_id);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at DESC);