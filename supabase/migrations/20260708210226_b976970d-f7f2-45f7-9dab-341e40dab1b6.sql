
GRANT SELECT ON public.scz_settings TO anon;

DROP POLICY IF EXISTS "public read campaign_video" ON public.scz_settings;
CREATE POLICY "public read campaign_video"
  ON public.scz_settings
  FOR SELECT
  TO anon, authenticated
  USING (key = 'campaign_video');
