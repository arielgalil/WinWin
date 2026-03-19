-- Enable RLS on system_config (was missing despite policies existing)
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Recreate policies cleanly
DROP POLICY IF EXISTS "Allow public read access to system_config" ON public.system_config;
DROP POLICY IF EXISTS "Allow service role full access to system_config" ON public.system_config;

CREATE POLICY "Allow public read access to system_config"
    ON public.system_config FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to system_config"
    ON public.system_config
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
