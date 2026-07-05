
-- 1) scz_category_attributes
CREATE TABLE IF NOT EXISTS public.scz_category_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.scz_categories(id) ON DELETE CASCADE,
  uses_numeration boolean NOT NULL DEFAULT false,
  uses_color boolean NOT NULL DEFAULT true,
  uses_size boolean NOT NULL DEFAULT false,
  uses_material boolean NOT NULL DEFAULT false,
  uses_model boolean NOT NULL DEFAULT false,
  uses_collection boolean NOT NULL DEFAULT false,
  numeration_options text[] NOT NULL DEFAULT '{}',
  size_options text[] NOT NULL DEFAULT ARRAY['Único'],
  color_options text[] NOT NULL DEFAULT '{}',
  material_options text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scz_category_attributes TO authenticated;
GRANT SELECT ON public.scz_category_attributes TO anon;
GRANT ALL ON public.scz_category_attributes TO service_role;

ALTER TABLE public.scz_category_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scz_category_attributes public read"
  ON public.scz_category_attributes FOR SELECT
  USING (true);

CREATE POLICY "scz_category_attributes admin write"
  ON public.scz_category_attributes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER scz_category_attributes_updated
  BEFORE UPDATE ON public.scz_category_attributes
  FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- 2) scz_product_variants extras
ALTER TABLE public.scz_product_variants
  ADD COLUMN IF NOT EXISTS cost_cents integer,
  ADD COLUMN IF NOT EXISTS reserved_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS width_cm numeric,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS depth_cm numeric,
  ADD COLUMN IF NOT EXISTS collection text,
  ADD COLUMN IF NOT EXISTS numeration text;

-- 3) scz_stock extras (localização física)
ALTER TABLE public.scz_stock
  ADD COLUMN IF NOT EXISTS aisle text,
  ADD COLUMN IF NOT EXISTS shelf text,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS bin text;

-- 4) Seed default atributos para categorias existentes
INSERT INTO public.scz_category_attributes (category_id, uses_numeration, uses_color, uses_size, uses_material, uses_model, uses_collection, numeration_options, size_options)
SELECT
  c.id,
  CASE WHEN lower(c.name) ~ 'sapat|tênis|tenis|scarpin|salto|sandália|sandalia|bota|rasteir|mocass' THEN true ELSE false END AS uses_numeration,
  true AS uses_color,
  CASE
    WHEN lower(c.name) ~ 'sapat|tênis|tenis|scarpin|salto|sandália|sandalia|bota|rasteir|mocass' THEN false
    WHEN lower(c.name) ~ 'bolsa|cinto|roup|blus|vest|camis|calc|short|saia' THEN true
    ELSE false
  END AS uses_size,
  CASE WHEN lower(c.name) ~ 'bolsa|cinto|carteir|sapat|tênis|tenis' THEN true ELSE false END AS uses_material,
  false AS uses_model,
  false AS uses_collection,
  CASE WHEN lower(c.name) ~ 'sapat|tênis|tenis|scarpin|salto|sandália|sandalia|bota|rasteir|mocass'
       THEN ARRAY['33','34','35','36','37','38','39','40','41','42','43','44']
       ELSE '{}'::text[] END AS numeration_options,
  CASE
    WHEN lower(c.name) ~ 'bolsa' THEN ARRAY['P','M','G']
    WHEN lower(c.name) ~ 'roup|blus|vest|camis' THEN ARRAY['PP','P','M','G','GG']
    ELSE ARRAY['Único']
  END AS size_options
FROM public.scz_categories c
ON CONFLICT (category_id) DO NOTHING;
