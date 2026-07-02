
DROP POLICY IF EXISTS "rifas leitura publica" ON public.rifas;
DROP POLICY IF EXISTS "rifas update publica" ON public.rifas;

CREATE POLICY "rifas select admin" ON public.rifas
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "rifas update admin" ON public.rifas
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "config leitura publica" ON public.rifa_config;

CREATE POLICY "config select admin" ON public.rifa_config
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "comprovantes leitura publica" ON storage.objects;
DROP POLICY IF EXISTS "comprovantes upload publico" ON storage.objects;

CREATE POLICY "comprovantes select admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'comprovantes' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "comprovantes insert authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'comprovantes' AND auth.uid() = owner);

CREATE OR REPLACE FUNCTION public.scz_block_movement_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  RAISE EXCEPTION 'Histórico de movimentações é imutável';
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rifas_validate_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.scz_apply_stock_movement() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
