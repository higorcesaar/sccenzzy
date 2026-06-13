import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Middleware: garante que o chamador esteja autenticado E tenha papel 'admin'.
 * Use em todas as server functions do painel administrativo.
 */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabase, userId } = context as any;
    const { data: isAdmin, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (error) throw new Error("Falha ao validar permissão");
    if (!isAdmin) throw new Error("Forbidden: apenas administradores");
    return next({ context: { supabase, userId } });
  });
