
-- === scz_categories: add menu/image/sort ===
ALTER TABLE public.scz_categories
  ADD COLUMN IF NOT EXISTS is_in_menu boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE INDEX IF NOT EXISTS idx_scz_categories_menu ON public.scz_categories(is_in_menu, sort_order);
CREATE INDEX IF NOT EXISTS idx_scz_categories_parent ON public.scz_categories(parent_id, sort_order);

-- === scz_collections ===
CREATE TABLE IF NOT EXISTS public.scz_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.scz_collections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scz_collections TO authenticated;
GRANT ALL ON public.scz_collections TO service_role;

ALTER TABLE public.scz_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active collections" ON public.scz_collections
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage collections" ON public.scz_collections
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_scz_collections_updated BEFORE UPDATE ON public.scz_collections
  FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- === scz_products: collection_id, has_variants ===
ALTER TABLE public.scz_products
  ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES public.scz_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS has_variants boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_scz_products_category ON public.scz_products(category_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_scz_products_collection ON public.scz_products(collection_id, is_active);
CREATE INDEX IF NOT EXISTS idx_scz_products_flags ON public.scz_products(is_active, is_launch, is_on_sale, is_featured);

-- === scz_product_variants ===
CREATE TABLE IF NOT EXISTS public.scz_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.scz_products(id) ON DELETE CASCADE,
  sku text,
  size text,
  color text,
  color_hex text,
  model text,
  barcode text,
  price_cents integer,
  promo_price numeric,
  stock_qty integer NOT NULL DEFAULT 0,
  stock_min integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scz_variants_product ON public.scz_product_variants(product_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_scz_variants_unique
  ON public.scz_product_variants(product_id, COALESCE(size,''), COALESCE(color,''), COALESCE(model,''));

GRANT SELECT ON public.scz_product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scz_product_variants TO authenticated;
GRANT ALL ON public.scz_product_variants TO service_role;

ALTER TABLE public.scz_product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active variants" ON public.scz_product_variants
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.scz_products p WHERE p.id = product_id AND p.is_active = true
    )
  );
CREATE POLICY "Admins manage variants" ON public.scz_product_variants
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_scz_variants_updated BEFORE UPDATE ON public.scz_product_variants
  FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- === scz_stock_movements: variant_id ===
ALTER TABLE public.scz_stock_movements
  ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES public.scz_product_variants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_scz_movements_variant ON public.scz_stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_scz_movements_product_created ON public.scz_stock_movements(product_id, created_at DESC);

-- Update trigger to apply movement to variant when provided
CREATE OR REPLACE FUNCTION public.scz_apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delta integer;
BEGIN
  delta := CASE NEW.movement_type
    WHEN 'entrada' THEN NEW.quantity
    WHEN 'devolucao' THEN NEW.quantity
    WHEN 'saida' THEN -NEW.quantity
    WHEN 'venda' THEN -NEW.quantity
    WHEN 'ajuste' THEN NEW.quantity
    ELSE 0
  END;

  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.scz_product_variants
       SET stock_qty = GREATEST(0, stock_qty + delta),
           updated_at = now()
     WHERE id = NEW.variant_id;
    -- also bump product aggregate stock for backwards compat
    UPDATE public.scz_products
       SET stock_qty = GREATEST(0, stock_qty + delta),
           stock_sold = stock_sold + CASE WHEN NEW.movement_type = 'venda' THEN NEW.quantity ELSE 0 END,
           updated_at = now()
     WHERE id = NEW.product_id;
  ELSE
    UPDATE public.scz_products
       SET stock_qty = GREATEST(0, stock_qty + delta),
           stock_sold = stock_sold + CASE WHEN NEW.movement_type = 'venda' THEN NEW.quantity ELSE 0 END,
           updated_at = now()
     WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger is wired
DROP TRIGGER IF EXISTS trg_scz_apply_stock ON public.scz_stock_movements;
CREATE TRIGGER trg_scz_apply_stock AFTER INSERT ON public.scz_stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.scz_apply_stock_movement();

-- === Seed base categories (idempotent) ===
INSERT INTO public.scz_categories(slug, name, sort_order, is_active, is_in_menu)
VALUES
  ('sapatos','Sapatos',10,true,true),
  ('sandalias','Sandálias',20,true,true),
  ('tenis','Tênis',30,true,true),
  ('bolsas','Bolsas',40,true,true),
  ('acessorios','Acessórios',50,true,true),
  ('cintos','Cintos',55,true,true),
  ('roupas','Roupas',60,true,true)
ON CONFLICT (slug) DO NOTHING;
