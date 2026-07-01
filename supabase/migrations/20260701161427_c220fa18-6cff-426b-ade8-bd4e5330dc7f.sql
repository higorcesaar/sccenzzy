
-- =========================================================================
-- ETAPA 1: FUNDAÇÃO DO MÓDULO DE ESTOQUE (ERP)
-- =========================================================================

-- 1. MARCAS ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scz_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scz_brands TO anon, authenticated;
GRANT ALL ON public.scz_brands TO service_role;
ALTER TABLE public.scz_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brands_public_read" ON public.scz_brands FOR SELECT USING (is_active = true);
CREATE POLICY "brands_admin_all" ON public.scz_brands FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER scz_brands_updated BEFORE UPDATE ON public.scz_brands
  FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- 2. LOCAIS DE ESTOQUE ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scz_stock_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'deposito', -- deposito|loja|showroom|cd|outros
  address text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scz_stock_locations TO authenticated;
GRANT ALL ON public.scz_stock_locations TO service_role;
ALTER TABLE public.scz_stock_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_locations_admin" ON public.scz_stock_locations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER scz_stock_locations_updated BEFORE UPDATE ON public.scz_stock_locations
  FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- Somente 1 local default
CREATE UNIQUE INDEX scz_stock_locations_only_one_default ON public.scz_stock_locations (is_default) WHERE is_default = true;

-- 3. FORNECEDORES --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scz_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document text,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scz_suppliers TO authenticated;
GRANT ALL ON public.scz_suppliers TO service_role;
ALTER TABLE public.scz_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_admin" ON public.scz_suppliers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER scz_suppliers_updated BEFORE UPDATE ON public.scz_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- 4. ESTOQUE POR (PRODUTO, VARIAÇÃO, LOCAL) ------------------------------
CREATE TABLE IF NOT EXISTS public.scz_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.scz_products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.scz_product_variants(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.scz_stock_locations(id) ON DELETE RESTRICT,
  qty integer NOT NULL DEFAULT 0 CHECK (qty >= 0),
  min_qty integer NOT NULL DEFAULT 0 CHECK (min_qty >= 0),
  location_label text, -- ex: "Corredor A / Prateleira 3 / Nível 2"
  last_movement_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX scz_stock_unique_pvl
  ON public.scz_stock (product_id, COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'::uuid), location_id);
CREATE INDEX scz_stock_product_idx ON public.scz_stock (product_id);
CREATE INDEX scz_stock_variant_idx ON public.scz_stock (variant_id);
CREATE INDEX scz_stock_low_idx ON public.scz_stock (product_id) WHERE min_qty > 0 AND qty <= min_qty;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scz_stock TO authenticated;
GRANT ALL ON public.scz_stock TO service_role;
ALTER TABLE public.scz_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_admin" ON public.scz_stock FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER scz_stock_updated BEFORE UPDATE ON public.scz_stock
  FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- 5. ENTRADAS (cabeçalho) ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scz_stock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.scz_suppliers(id) ON DELETE SET NULL,
  location_id uuid NOT NULL REFERENCES public.scz_stock_locations(id),
  invoice_number text,
  invoice_date date,
  total_cost_cents bigint NOT NULL DEFAULT 0,
  notes text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scz_stock_entries TO authenticated;
GRANT ALL ON public.scz_stock_entries TO service_role;
ALTER TABLE public.scz_stock_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock_entries_admin" ON public.scz_stock_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER scz_stock_entries_updated BEFORE UPDATE ON public.scz_stock_entries
  FOR EACH ROW EXECUTE FUNCTION public.scz_set_updated_at();

-- 6. ALTER produtos ------------------------------------------------------
ALTER TABLE public.scz_products
  ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.scz_brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gender text, -- feminino|masculino|unissex|infantil
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS length_cm numeric,
  ADD COLUMN IF NOT EXISTS is_exclusive boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS specifications text;

-- 7. ALTER variantes -----------------------------------------------------
ALTER TABLE public.scz_product_variants
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS finish text,
  ADD COLUMN IF NOT EXISTS weight_g integer,
  ADD COLUMN IF NOT EXISTS image_url text;

-- 8. ALTER movimentações -------------------------------------------------
ALTER TABLE public.scz_stock_movements
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.scz_stock_locations(id),
  ADD COLUMN IF NOT EXISTS location_to_id uuid REFERENCES public.scz_stock_locations(id),
  ADD COLUMN IF NOT EXISTS unit_cost_cents bigint,
  ADD COLUMN IF NOT EXISTS entry_id uuid REFERENCES public.scz_stock_entries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS qty_before integer,
  ADD COLUMN IF NOT EXISTS qty_after integer,
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.scz_orders(id) ON DELETE SET NULL;

-- Amplia enum de movement_type: ajusta constraint (se existir) removendo, e adiciona nova
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='scz_stock_movements_movement_type_check') THEN
    ALTER TABLE public.scz_stock_movements DROP CONSTRAINT scz_stock_movements_movement_type_check;
  END IF;
END $$;
ALTER TABLE public.scz_stock_movements
  ADD CONSTRAINT scz_stock_movements_movement_type_check
  CHECK (movement_type IN ('entrada','saida','venda','devolucao','ajuste','transferencia','inventario'));

-- 9. TRIGGER: bloquear DELETE em histórico ------------------------------
CREATE OR REPLACE FUNCTION public.scz_block_movement_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Histórico de movimentações é imutável';
END; $$;
DROP TRIGGER IF EXISTS scz_stock_movements_no_delete ON public.scz_stock_movements;
CREATE TRIGGER scz_stock_movements_no_delete BEFORE DELETE ON public.scz_stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.scz_block_movement_delete();

-- 10. TRIGGER: aplica movimentação em scz_stock e sincroniza agregados -
CREATE OR REPLACE FUNCTION public.scz_apply_stock_movement() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_delta integer;
  v_loc_from uuid;
  v_loc_to uuid;
  v_before integer;
  v_after integer;
  v_default_loc uuid;
BEGIN
  -- Local padrão se nada informado
  IF NEW.location_id IS NULL THEN
    SELECT id INTO v_default_loc FROM public.scz_stock_locations WHERE is_default = true LIMIT 1;
    NEW.location_id := v_default_loc;
  END IF;

  v_delta := CASE NEW.movement_type
    WHEN 'entrada' THEN NEW.quantity
    WHEN 'devolucao' THEN NEW.quantity
    WHEN 'saida' THEN -NEW.quantity
    WHEN 'venda' THEN -NEW.quantity
    WHEN 'ajuste' THEN NEW.quantity  -- pode ser negativo
    WHEN 'inventario' THEN NEW.quantity
    ELSE 0
  END;

  -- Transferência: baixa origem + entrada destino
  IF NEW.movement_type = 'transferencia' THEN
    v_loc_from := NEW.location_id;
    v_loc_to := NEW.location_to_id;
    IF v_loc_to IS NULL THEN
      RAISE EXCEPTION 'Transferência requer location_to_id';
    END IF;

    -- baixa
    INSERT INTO public.scz_stock (product_id, variant_id, location_id, qty, last_movement_at)
      VALUES (NEW.product_id, NEW.variant_id, v_loc_from, 0, now())
      ON CONFLICT (product_id, COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'::uuid), location_id) DO NOTHING;
    SELECT qty INTO v_before FROM public.scz_stock
      WHERE product_id = NEW.product_id
        AND COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(NEW.variant_id,'00000000-0000-0000-0000-000000000000'::uuid)
        AND location_id = v_loc_from;
    UPDATE public.scz_stock
      SET qty = GREATEST(0, v_before - NEW.quantity), last_movement_at = now(), updated_at = now()
      WHERE product_id = NEW.product_id
        AND COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(NEW.variant_id,'00000000-0000-0000-0000-000000000000'::uuid)
        AND location_id = v_loc_from;

    -- entrada
    INSERT INTO public.scz_stock (product_id, variant_id, location_id, qty, last_movement_at)
      VALUES (NEW.product_id, NEW.variant_id, v_loc_to, NEW.quantity, now())
      ON CONFLICT (product_id, COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'::uuid), location_id)
      DO UPDATE SET qty = public.scz_stock.qty + NEW.quantity, last_movement_at = now(), updated_at = now();

    NEW.qty_before := v_before;
    NEW.qty_after := GREATEST(0, v_before - NEW.quantity);
  ELSE
    -- upsert do estoque
    INSERT INTO public.scz_stock (product_id, variant_id, location_id, qty, last_movement_at)
      VALUES (NEW.product_id, NEW.variant_id, NEW.location_id, 0, now())
      ON CONFLICT (product_id, COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'::uuid), location_id) DO NOTHING;

    SELECT qty INTO v_before FROM public.scz_stock
      WHERE product_id = NEW.product_id
        AND COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(NEW.variant_id,'00000000-0000-0000-0000-000000000000'::uuid)
        AND location_id = NEW.location_id;

    v_after := GREATEST(0, v_before + v_delta);

    UPDATE public.scz_stock
      SET qty = v_after, last_movement_at = now(), updated_at = now()
      WHERE product_id = NEW.product_id
        AND COALESCE(variant_id,'00000000-0000-0000-0000-000000000000'::uuid) = COALESCE(NEW.variant_id,'00000000-0000-0000-0000-000000000000'::uuid)
        AND location_id = NEW.location_id;

    NEW.qty_before := v_before;
    NEW.qty_after := v_after;
  END IF;

  -- Sincroniza agregado no produto (soma todos os locais)
  UPDATE public.scz_products p
    SET stock_qty = COALESCE((SELECT SUM(qty)::int FROM public.scz_stock WHERE product_id = NEW.product_id), 0),
        stock_sold = stock_sold + CASE WHEN NEW.movement_type = 'venda' THEN NEW.quantity ELSE 0 END,
        updated_at = now()
    WHERE p.id = NEW.product_id;

  -- Sincroniza agregado na variante (se houver)
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.scz_product_variants v
      SET stock_qty = COALESCE((SELECT SUM(qty)::int FROM public.scz_stock WHERE variant_id = NEW.variant_id), 0),
          updated_at = now()
      WHERE v.id = NEW.variant_id;
  END IF;

  RETURN NEW;
END; $$;

-- 11. SEED locais físicos padrão ----------------------------------------
INSERT INTO public.scz_stock_locations (name, slug, type, is_default, sort_order) VALUES
  ('Depósito', 'deposito', 'deposito', true, 1),
  ('Loja Física', 'loja-fisica', 'loja', false, 2),
  ('Showroom', 'showroom', 'showroom', false, 3),
  ('Centro de Distribuição', 'centro-distribuicao', 'cd', false, 4)
ON CONFLICT (slug) DO NOTHING;

-- 12. MIGRAÇÃO: mover estoque atual para o Depósito ---------------------
DO $$
DECLARE
  v_deposito uuid;
BEGIN
  SELECT id INTO v_deposito FROM public.scz_stock_locations WHERE slug='deposito' LIMIT 1;
  IF v_deposito IS NULL THEN RETURN; END IF;

  -- produtos sem variantes
  INSERT INTO public.scz_stock (product_id, variant_id, location_id, qty, min_qty)
  SELECT p.id, NULL, v_deposito, GREATEST(0, p.stock_qty), GREATEST(0, p.stock_min)
    FROM public.scz_products p
   WHERE NOT p.has_variants
     AND NOT EXISTS (
       SELECT 1 FROM public.scz_stock s
        WHERE s.product_id = p.id AND s.variant_id IS NULL AND s.location_id = v_deposito
     );

  -- produtos com variantes: uma linha por variante
  INSERT INTO public.scz_stock (product_id, variant_id, location_id, qty, min_qty)
  SELECT v.product_id, v.id, v_deposito, GREATEST(0, v.stock_qty), 0
    FROM public.scz_product_variants v
   WHERE NOT EXISTS (
       SELECT 1 FROM public.scz_stock s
        WHERE s.product_id = v.product_id AND s.variant_id = v.id AND s.location_id = v_deposito
     );
END $$;
