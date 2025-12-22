-- Add timestamp columns for different tabs to track last saved time
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS settings_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS users_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS goals_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS classes_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS logs_updated_at TIMESTAMPTZ;

-- Enable realtime for app_settings if not already enabled
-- This ensures all admins see the updates immediately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'app_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
  END IF;
END $$;
