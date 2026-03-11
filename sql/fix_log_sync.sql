-- SQL Migration: Robust Score Sync between action_logs and entities
-- This script fixes the issue where score cancellations/deletions were not reflected on the dashboard.
-- It also centralizes score logic in a trigger to prevent discrepancies.

BEGIN;

-- 1. Create or Replace the Trigger Function
CREATE OR REPLACE FUNCTION handle_action_log_score_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (New log added)
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.is_cancelled = false) THEN
            -- Update class score
            UPDATE public.classes 
            SET score = score + NEW.points 
            WHERE id = NEW.class_id;
            
            -- Update student score (if provided)
            IF (NEW.student_id IS NOT NULL) THEN
                UPDATE public.students 
                SET prev_score = score, -- Store old score for momentum/trend
                    score = score + NEW.points,
                    trend = CASE 
                        WHEN NEW.points > 0 THEN 'up' 
                        WHEN NEW.points < 0 THEN 'down' 
                        ELSE trend 
                    END
                WHERE id = NEW.student_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle UPDATE (Cancellation, Restoration, or Points editing)
    IF (TG_OP = 'UPDATE') THEN
        -- Case A: is_cancelled toggled
        IF (OLD.is_cancelled IS DISTINCT FROM NEW.is_cancelled) THEN
            IF (NEW.is_cancelled = true) THEN
                -- Subtract points when cancelled
                UPDATE public.classes SET score = score - NEW.points WHERE id = NEW.class_id;
                IF (NEW.student_id IS NOT NULL) THEN
                    UPDATE public.students SET score = score - NEW.points WHERE id = NEW.student_id;
                END IF;
            ELSE
                -- Add points back when restored
                UPDATE public.classes SET score = score + NEW.points WHERE id = NEW.class_id;
                IF (NEW.student_id IS NOT NULL) THEN
                    UPDATE public.students SET score = score + NEW.points WHERE id = NEW.student_id;
                END IF;
            END IF;
        
        -- Case B: Points changed on an active log (and is_cancelled stayed false)
        ELSIF (OLD.points IS DISTINCT FROM NEW.points AND NEW.is_cancelled = false) THEN
            UPDATE public.classes SET score = score - OLD.points + NEW.points WHERE id = NEW.class_id;
            IF (NEW.student_id IS NOT NULL) THEN
                UPDATE public.students SET score = score - OLD.points + NEW.points WHERE id = NEW.student_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle DELETE (Physical deletion)
    IF (TG_OP = 'DELETE') THEN
        IF (OLD.is_cancelled = false) THEN
            -- Only subtract if it was an active contribution
            UPDATE public.classes SET score = score - OLD.points WHERE id = OLD.class_id;
            IF (OLD.student_id IS NOT NULL) THEN
                UPDATE public.students SET score = score - OLD.points WHERE id = OLD.student_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply Trigger to action_logs
DROP TRIGGER IF EXISTS trg_action_log_score_sync ON public.action_logs;
CREATE TRIGGER trg_action_log_score_sync
AFTER INSERT OR UPDATE OR DELETE ON public.action_logs
FOR EACH ROW
EXECUTE FUNCTION handle_action_log_score_sync();

-- 3. Refactor add_score_transaction to rely on the trigger
-- This prevents double-counting and ensures data integrity
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
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Just insert the log. The trigger will handle score updates on classes/students.
    INSERT INTO public.action_logs (
        campaign_id,
        class_id,
        student_id,
        points,
        description,
        teacher_name,
        user_id,
        note,
        created_at,
        is_cancelled
    ) VALUES (
        p_campaign_id,
        p_class_id,
        p_student_id,
        p_points,
        CASE 
            WHEN p_student_id IS NULL THEN 'עדכון קבוצתי'
            ELSE 'עדכון אישי'
        END,
        p_teacher_name,
        v_user_id,
        p_note,
        NOW(),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Realign all scores to fix existing discrepancies
-- This ensures the board is perfectly in sync with the activity log history.
UPDATE public.classes c
SET score = COALESCE((
    SELECT SUM(points)
    FROM public.action_logs
    WHERE class_id = c.id AND is_cancelled = false
), 0);

UPDATE public.students s
SET score = COALESCE((
    SELECT SUM(points)
    FROM public.action_logs
    WHERE student_id = s.id AND is_cancelled = false
), 0);

-- 5. Refresh schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;
