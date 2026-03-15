-- Add ticket_weights column to lucky_wheel_templates
-- This stores an array of per-participant ticket counts for weighted lottery selection.
-- A weight of N means the student has N tickets (proportional to their score / points_per_ticket).
-- NULL or empty array = equal probability for all participants.

ALTER TABLE lucky_wheel_templates
  ADD COLUMN IF NOT EXISTS ticket_weights JSONB DEFAULT NULL;

COMMENT ON COLUMN lucky_wheel_templates.ticket_weights IS
  'Parallel array to participant_names. Each value is the number of lottery tickets for that participant (based on points_per_ticket in filter_criteria). NULL means equal weighting.';
