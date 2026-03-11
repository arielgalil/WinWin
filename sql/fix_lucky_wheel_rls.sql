-- FIX: Lucky Wheel RLS and Public Access
-- This script ensures that unauthenticated users (kiosks) can see the lucky wheel.

BEGIN;

-- 1. lucky_wheel_templates
DROP POLICY IF EXISTS "Public read wheel templates" ON lucky_wheel_templates;
CREATE POLICY "Public read wheel templates" ON lucky_wheel_templates 
FOR SELECT USING (true);

-- Ensure admins can still manage them (this should already exist but we reinforce it)
DROP POLICY IF EXISTS "Admins can manage wheel templates" ON lucky_wheel_templates;
CREATE POLICY "Admins can manage wheel templates" ON lucky_wheel_templates 
FOR ALL USING (
  is_super_admin() OR 
  EXISTS (SELECT 1 FROM campaign_users WHERE user_id = auth.uid() AND campaign_id = lucky_wheel_templates.campaign_id)
);

-- 2. lucky_wheel_winners
DROP POLICY IF EXISTS "Public read wheel winners" ON lucky_wheel_winners;
CREATE POLICY "Public read wheel winners" ON lucky_wheel_winners 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage wheel winners" ON lucky_wheel_winners;
CREATE POLICY "Admins can manage wheel winners" ON lucky_wheel_winners 
FOR ALL USING (
  is_super_admin() OR 
  EXISTS (SELECT 1 FROM campaign_users WHERE user_id = auth.uid() AND campaign_id = lucky_wheel_winners.campaign_id)
);

COMMIT;
