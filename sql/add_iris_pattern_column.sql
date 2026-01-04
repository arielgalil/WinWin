-- Add iris_pattern column to app_settings table
-- This stores the iris reveal pattern configuration so it persists across devices

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS iris_pattern JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN app_settings.iris_pattern IS 'Stores the iris reveal pattern [{cx, cy, weight, delay}] for consistent display across all devices';
