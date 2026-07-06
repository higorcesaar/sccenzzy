-- Migration: Keep only 'Depósito' stock location, merge any existing stock from other locations into Depósito
DO $$
DECLARE
  v_deposito_id uuid;
  v_loc_record RECORD;
  v_stock_record RECORD;
BEGIN
  -- 1. Find the Depósito location id
  SELECT id INTO v_deposito_id FROM public.scz_stock_locations WHERE slug = 'deposito' LIMIT 1;
  
  -- If Depósito doesn't exist, create it
  IF v_deposito_id IS NULL THEN
    INSERT INTO public.scz_stock_locations (name, slug, type, is_default, sort_order)
    VALUES ('Depósito', 'deposito', 'deposito', true, 1)
    RETURNING id INTO v_deposito_id;
  END IF;

  -- Ensure is_default is true for Depósito
  UPDATE public.scz_stock_locations SET is_default = true WHERE id = v_deposito_id;

  -- 2. Migrate stock from other locations to Depósito
  -- For each stock record from other locations
  FOR v_stock_record IN 
    SELECT s.id, s.product_id, s.variant_id, s.qty, s.min_qty, s.location_label, s.last_movement_at 
    FROM public.scz_stock s 
    WHERE s.location_id <> v_deposito_id
  LOOP
    -- Check if there is already a stock record for this product/variant at Depósito
    IF EXISTS (
      SELECT 1 FROM public.scz_stock 
      WHERE product_id = v_stock_record.product_id 
        AND (variant_id = v_stock_record.variant_id OR (variant_id IS NULL AND v_stock_record.variant_id IS NULL))
        AND location_id = v_deposito_id
    ) THEN
      -- If it exists, sum the quantities and update the existing one
      UPDATE public.scz_stock 
      SET qty = qty + v_stock_record.qty,
          min_qty = GREATEST(min_qty, v_stock_record.min_qty),
          location_label = COALESCE(location_label, v_stock_record.location_label),
          last_movement_at = COALESCE(last_movement_at, v_stock_record.last_movement_at)
      WHERE product_id = v_stock_record.product_id 
        AND (variant_id = v_stock_record.variant_id OR (variant_id IS NULL AND v_stock_record.variant_id IS NULL))
        AND location_id = v_deposito_id;
        
      -- Delete the migrated stock record
      DELETE FROM public.scz_stock WHERE id = v_stock_record.id;
    ELSE
      -- If it does not exist, update the location_id to Depósito
      UPDATE public.scz_stock 
      SET location_id = v_deposito_id 
      WHERE id = v_stock_record.id;
    END IF;
  END LOOP;

  -- 3. Update entries to point to Depósito
  UPDATE public.scz_stock_entries 
  SET location_id = v_deposito_id 
  WHERE location_id <> v_deposito_id;

  -- 4. Update movements to point to Depósito
  UPDATE public.scz_stock_movements 
  SET location_id = v_deposito_id 
  WHERE location_id IS NOT NULL AND location_id <> v_deposito_id;

  UPDATE public.scz_stock_movements 
  SET location_to_id = v_deposito_id 
  WHERE location_to_id IS NOT NULL AND location_to_id <> v_deposito_id;

  -- 5. Delete all other stock locations
  DELETE FROM public.scz_stock_locations WHERE id <> v_deposito_id;

END $$;
