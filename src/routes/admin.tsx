import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel Scenzzy" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md text-center bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <ShieldAlert className="h-10 w-10 text-amber-600 mx-auto" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-neutral-900">Acesso restrito</h1>
          <p className="mt-2 text-sm text-stone-600">
            Sua conta não tem permissão de administrador.
          </p>
          <pre className="mt-4 text-[10px] text-left bg-stone-50 border border-stone-200 rounded p-3 overflow-x-auto">
{`insert into public.user_roles (user_id, role)
values ('${user.id}', 'admin');`}
          </pre>
          <p className="mt-3 text-[11px] text-stone-500">
            Execute o SQL acima no editor do Supabase e recarregue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-stone-50">
        <AdminSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 h-14 flex items-center gap-3 border-b border-stone-200 bg-white/80 backdrop-blur px-4">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="text-[10px] uppercase tracking-widest text-stone-500">
              Painel administrativo
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
