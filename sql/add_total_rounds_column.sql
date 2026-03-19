-- Add total_rounds to lucky_wheel_templates
ALTER TABLE lucky_wheel_templates
  ADD COLUMN IF NOT EXISTS total_rounds INTEGER NOT NULL DEFAULT 1;

-- Add place_number to lucky_wheel_winners (null = bonus round)
ALTER TABLE lucky_wheel_winners
  ADD COLUMN IF NOT EXISTS place_number INTEGER;
