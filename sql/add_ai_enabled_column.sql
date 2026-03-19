-- Add ai_enabled column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;

-- Update existing campaigns to have AI enabled by default
UPDATE campaigns SET ai_enabled = true WHERE ai_enabled IS NULL;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
