CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

DO $$
DECLARE
  v_deposito_id uuid;
  v_stock_record RECORD;
BEGIN
  SELECT id INTO v_deposito_id FROM public.scz_stock_locations WHERE slug = 'deposito' LIMIT 1;

  IF v_deposito_id IS NULL THEN
    INSERT INTO public.scz_stock_locations (name, slug, type, is_default, sort_order)
    VALUES ('Depósito', 'deposito', 'deposito', true, 1)
    RETURNING id INTO v_deposito_id;
  END IF;

  UPDATE public.scz_stock_locations SET is_default = true WHERE id = v_deposito_id;

  FOR v_stock_record IN
    SELECT s.id, s.product_id, s.variant_id, s.qty, s.min_qty, s.location_label, s.last_movement_at
    FROM public.scz_stock s
    WHERE s.location_id <> v_deposito_id
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.scz_stock
      WHERE product_id = v_stock_record.product_id
        AND (variant_id = v_stock_record.variant_id OR (variant_id IS NULL AND v_stock_record.variant_id IS NULL))
        AND location_id = v_deposito_id
    ) THEN
      UPDATE public.scz_stock
      SET qty = qty + v_stock_record.qty,
          min_qty = GREATEST(min_qty, v_stock_record.min_qty),
          location_label = COALESCE(location_label, v_stock_record.location_label),
          last_movement_at = COALESCE(last_movement_at, v_stock_record.last_movement_at)
      WHERE product_id = v_stock_record.product_id
        AND (variant_id = v_stock_record.variant_id OR (variant_id IS NULL AND v_stock_record.variant_id IS NULL))
        AND location_id = v_deposito_id;

      DELETE FROM public.scz_stock WHERE id = v_stock_record.id;
    ELSE
      UPDATE public.scz_stock
      SET location_id = v_deposito_id
      WHERE id = v_stock_record.id;
    END IF;
  END LOOP;

  UPDATE public.scz_stock_entries
  SET location_id = v_deposito_id
  WHERE location_id <> v_deposito_id;

  UPDATE public.scz_stock_movements
  SET location_id = v_deposito_id
  WHERE location_id IS NOT NULL AND location_id <> v_deposito_id;

  UPDATE public.scz_stock_movements
  SET location_to_id = v_deposito_id
  WHERE location_to_id IS NOT NULL AND location_to_id <> v_deposito_id;

  DELETE FROM public.scz_stock_locations WHERE id <> v_deposito_id;
END $$;