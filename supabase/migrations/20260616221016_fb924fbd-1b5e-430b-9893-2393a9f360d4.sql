CREATE TABLE public.scz_hero_carousel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  video_url text,
  image_url text,
  button_text text,
  button_link text,
  position integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scz_hero_carousel TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scz_hero_carousel TO authenticated;
GRANT ALL ON public.scz_hero_carousel TO service_role;

ALTER TABLE public.scz_hero_carousel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active hero slides"
  ON public.scz_hero_carousel FOR SELECT
  TO anon, authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage hero slides"
  ON public.scz_hero_carousel FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER scz_hero_carousel_updated_at
  BEFORE UPDATE ON public.scz_hero_carousel
  FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

CREATE INDEX scz_hero_carousel_position_idx ON public.scz_hero_carousel(position);