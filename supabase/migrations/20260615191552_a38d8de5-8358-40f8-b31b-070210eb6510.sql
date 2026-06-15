-- Permitir que usuários autenticados executem a função has_role (necessária para requireAdmin)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;