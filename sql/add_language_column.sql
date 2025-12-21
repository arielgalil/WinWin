
-- Migration to add language column to app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'he' CHECK (language IN ('he', 'en'));

-- Update existing records to 'he'
UPDATE app_settings SET language = 'he' WHERE language IS NULL;
