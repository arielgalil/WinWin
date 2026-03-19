-- Add active_spin column to app_settings for late-joiner recovery
-- When a spin is in progress, this persists the spin payload so users who
-- join mid-spin can reconstruct the animation using wall-clock start_at_ms.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'app_settings' AND column_name = 'active_spin'
    ) THEN
        ALTER TABLE app_settings ADD COLUMN active_spin JSONB;
    END IF;
END $$;
