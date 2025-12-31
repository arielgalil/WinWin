-- Migration to support individual kiosk rotation timing
-- This replaces the old rotation_urls TEXT[] with rotation_config JSONB
ALTER TABLE app_settings DROP COLUMN IF EXISTS rotation_urls;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS rotation_config JSONB DEFAULT '[]'::jsonb;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS rotation_enabled BOOLEAN DEFAULT false;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS rotation_interval INTEGER DEFAULT 30;