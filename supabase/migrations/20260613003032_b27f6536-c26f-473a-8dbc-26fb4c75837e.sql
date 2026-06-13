
-- =========================================================
-- FASE 1: Fundação do painel administrativo Scenzzy
-- =========================================================

-- ---------- 1. Estender scz_categories (subcategorias) ----------
ALTER TABLE public.scz_categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.scz_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS scz_categories_parent_idx ON public.scz_categories(parent_id);

-- ---------- 2. Estender scz_products ----------
ALTER TABLE public.scz_products
  ADD COLUMN IF NOT EXISTS sku text,
  ADD COLUMN IF NOT EXISTS internal_code text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.scz_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS cost_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS promo_price numeric(12,2),
  ADD COLUMN IF NOT EXISTS weight_g integer,
  ADD COLUMN IF NOT EXISTS width_cm numeric(8,2),
  ADD COLUMN IF NOT EXISTS height_cm numeric(8,2),
  ADD COLUMN IF NOT EXISTS depth_cm numeric(8,2),
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS og_image text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_launch boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_on_sale boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stock_qty integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_min integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_reserved integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_sold integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags text[];

CREATE UNIQUE INDEX IF NOT EXISTS scz_products_sku_uidx ON public.scz_products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS scz_products_active_idx ON public.scz_products(is_active);
CREATE INDEX IF NOT EXISTS scz_products_featured_idx ON public.scz_products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS scz_products_sale_idx ON public.scz_products(is_on_sale) WHERE is_on_sale = true;

-- ---------- 3. scz_stock_movements ----------
CREATE TABLE IF NOT EXISTS public.scz_stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.scz_products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('entrada','saida','ajuste','venda','devolucao')),
  quantity integer NOT NULL,
  reason text,
  reference text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scz_stock_movements_product_idx ON public.scz_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS scz_stock_movements_created_idx ON public.scz_stock_movements(created_at DESC);

GRANT SELECT, INSERT ON public.scz_stock_movements TO authenticated;
GRANT ALL ON public.scz_stock_movements TO service_role;
ALTER TABLE public.scz_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read stock movements" ON public.scz_stock_movements
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert stock movements" ON public.scz_stock_movements
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Trigger: aplicar movimentação ao estoque do produto
CREATE OR REPLACE FUNCTION public.scz_apply_stock_movement()
RETURNS TRIGGER
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

  UPDATE public.scz_products
     SET stock_qty = GREATEST(0, stock_qty + delta),
         stock_sold = stock_sold + CASE WHEN NEW.movement_type = 'venda' THEN NEW.quantity ELSE 0 END,
         updated_at = now()
   WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scz_apply_stock_movement ON public.scz_stock_movements;
CREATE TRIGGER trg_scz_apply_stock_movement
AFTER INSERT ON public.scz_stock_movements
FOR EACH ROW EXECUTE FUNCTION public.scz_apply_stock_movement();

-- ---------- 4. scz_pages ----------
CREATE TABLE IF NOT EXISTS public.scz_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_title text,
  seo_description text,
  seo_keywords text,
  og_image text,
  is_system boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scz_pages_status_idx ON public.scz_pages(status);

GRANT SELECT ON public.scz_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.scz_pages TO authenticated;
GRANT ALL ON public.scz_pages TO service_role;
ALTER TABLE public.scz_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published pages" ON public.scz_pages
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "admins read all pages" ON public.scz_pages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert pages" ON public.scz_pages
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins update pages" ON public.scz_pages
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete pages" ON public.scz_pages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_scz_pages_updated ON public.scz_pages;
CREATE TRIGGER trg_scz_pages_updated BEFORE UPDATE ON public.scz_pages
FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- ---------- 5. scz_banners ----------
CREATE TABLE IF NOT EXISTS public.scz_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location text NOT NULL,
  title text,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  cta_label text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scz_banners_location_idx ON public.scz_banners(location);

GRANT SELECT ON public.scz_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.scz_banners TO authenticated;
GRANT ALL ON public.scz_banners TO service_role;
ALTER TABLE public.scz_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active banners" ON public.scz_banners
  FOR SELECT TO anon, authenticated USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );
CREATE POLICY "admins read all banners" ON public.scz_banners
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write banners" ON public.scz_banners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_scz_banners_updated ON public.scz_banners;
CREATE TRIGGER trg_scz_banners_updated BEFORE UPDATE ON public.scz_banners
FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- ---------- 6. scz_settings ----------
CREATE TABLE IF NOT EXISTS public.scz_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.scz_settings TO authenticated;
GRANT ALL ON public.scz_settings TO service_role;
ALTER TABLE public.scz_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read settings" ON public.scz_settings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write settings" ON public.scz_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP TRIGGER IF EXISTS trg_scz_settings_updated ON public.scz_settings;
CREATE TRIGGER trg_scz_settings_updated BEFORE UPDATE ON public.scz_settings
FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- ---------- 7. Seed básico de páginas-sistema ----------
INSERT INTO public.scz_pages (slug, title, status, is_system, blocks)
VALUES
  ('home', 'Home', 'published', true, '[]'::jsonb),
  ('sobre', 'Sobre Nós', 'draft', true, '[]'::jsonb),
  ('contato', 'Contato', 'draft', true, '[]'::jsonb),
  ('politica-de-troca', 'Política de Troca', 'draft', true, '[]'::jsonb),
  ('politica-de-privacidade', 'Política de Privacidade', 'draft', true, '[]'::jsonb),
  ('termos-de-uso', 'Termos de Uso', 'draft', true, '[]'::jsonb)
ON CONFLICT (slug) DO NOTHING;
