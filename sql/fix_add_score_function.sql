-- Fix add_score_transaction function for proper parameter handling
-- This file should be run in Supabase SQL Editor

-- Drop existing function
DROP FUNCTION IF EXISTS public.add_score_transaction(uuid, uuid, integer, text, uuid);
DROP FUNCTION IF EXISTS public.add_score_transaction(uuid, uuid, integer, text, text, uuid);

-- Create the function with proper parameter handling
CREATE OR REPLACE FUNCTION public.add_score_transaction(
  p_class_id UUID,
  p_student_id UUID,
  p_points INTEGER,
  p_teacher_name TEXT,
  p_note TEXT,
  p_campaign_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_old_score INTEGER;
    v_user_id UUID;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();

    -- Update class score
    UPDATE public.classes 
    SET score = score + p_points
    WHERE id = p_class_id;

    -- Update student score (if provided)
    IF p_student_id IS NOT NULL THEN
        -- Save old score for momentum calculation
        SELECT score INTO v_old_score FROM public.students WHERE id = p_student_id;
        
        UPDATE public.students 
        SET score = score + p_points,
            prev_score = COALESCE(v_old_score, score)
        WHERE id = p_student_id;
    END IF;

    -- Create action log entry
    INSERT INTO public.action_logs (
        campaign_id,
        class_id,
        student_id,
        teacher_name,
        points,
        note,
        created_at,
        user_id
    ) VALUES (
        p_campaign_id,
        p_class_id,
        p_student_id,
        p_teacher_name,
        p_points,
        p_note,
        NOW(),
        v_user_id
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.add_score_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_score_transaction TO service_role;