-- Lucky Wheel Feature: Templates & Winner History
-- Run this migration in your Supabase SQL Editor

-- 1. Template: a saved wheel configuration
CREATE TABLE IF NOT EXISTS lucky_wheel_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filter_criteria JSONB NOT NULL DEFAULT '{}',
  participant_ids UUID[] NOT NULL DEFAULT '{}',
  participant_names TEXT[] NOT NULL DEFAULT '{}',
  last_activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Winner history
CREATE TABLE IF NOT EXISTS lucky_wheel_winners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES lucky_wheel_templates(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  class_name TEXT,
  won_at TIMESTAMPTZ DEFAULT now(),
  round_number INTEGER DEFAULT 1,
  wheel_name TEXT
);

-- 3. RLS policies
ALTER TABLE lucky_wheel_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_wheel_winners ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Templates
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read wheel templates' AND tablename = 'lucky_wheel_templates') THEN
        CREATE POLICY "Authenticated users can read wheel templates" ON lucky_wheel_templates 
        FOR SELECT USING (is_super_admin() OR is_campaign_member(campaign_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage wheel templates' AND tablename = 'lucky_wheel_templates') THEN
        CREATE POLICY "Admins can manage wheel templates" ON lucky_wheel_templates 
        FOR ALL USING (is_super_admin() OR is_campaign_admin(campaign_id));
    END IF;

    -- Winners
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can read wheel winners' AND tablename = 'lucky_wheel_winners') THEN
        CREATE POLICY "Authenticated users can read wheel winners" ON lucky_wheel_winners 
        FOR SELECT USING (is_super_admin() OR is_campaign_member(campaign_id));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage wheel winners' AND tablename = 'lucky_wheel_winners') THEN
        CREATE POLICY "Admins can manage wheel winners" ON lucky_wheel_winners 
        FOR ALL USING (is_super_admin() OR is_campaign_admin(campaign_id));
    END IF;
END $$;

-- 4. Enable realtime (Optional: Only if NOT using 'FOR ALL TABLES')
-- If you get an error here saying "FOR ALL TABLES", you can safely ignore these lines.
-- ALTER PUBLICATION supabase_realtime ADD TABLE lucky_wheel_templates;
-- ALTER PUBLICATION supabase_realtime ADD TABLE lucky_wheel_winners;

-- 5. MIGRATIONS (Run these if columns are missing)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lucky_wheel_templates' AND column_name='last_activated_at') THEN
        ALTER TABLE lucky_wheel_templates ADD COLUMN last_activated_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_settings' AND column_name='active_lucky_wheel_id') THEN
        ALTER TABLE app_settings ADD COLUMN active_lucky_wheel_id UUID REFERENCES lucky_wheel_templates(id) ON DELETE SET NULL;
    END IF;
END $$;
