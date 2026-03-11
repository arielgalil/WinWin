-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.system_config (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- 2. Set replica identity (Required for Realtime to send "old" and "new" data)
ALTER TABLE public.system_config REPLICA IDENTITY FULL;

-- 3. Only try to add to publication if it's not already "FOR ALL TABLES"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime' AND puballtables = true
    ) THEN
        -- Check if table is already in publication to avoid "already exists" error
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'system_config'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.system_config;
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add to publication manually, skipping...';
END $$;

-- 4. Initial app version row (Casting text concatenation to jsonb)
INSERT INTO public.system_config (key, value)
VALUES (
    'app_version', 
    ('{"version": "3.6.2", "force_reload": false, "timestamp": "' || now() || '"}')::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 5. Allow public read access
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to system_config" ON public.system_config;
CREATE POLICY "Allow public read access to system_config" ON public.system_config FOR SELECT USING (true);
