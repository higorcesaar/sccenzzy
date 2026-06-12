import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar | Scenzzy" },
      { name: "description", content: "Acesse sua conta Scenzzy para acompanhar pedidos e finalizar suas compras." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      addToast("Bem-vinda de volta!", "info", "Login realizado");
      navigate({ to: "/" });
    } catch (err: any) {
      addToast(err?.message || "Não foi possível entrar.", "info", "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-gold-500 text-[10px] uppercase font-bold tracking-widest">
            <Sparkles className="h-3 w-3" /> Scenzzy Boutique
          </div>
          <h1 className="font-serif text-3xl font-extrabold tracking-tight text-neutral-900">Bem-vinda de volta</h1>
          <p className="text-xs text-stone-500">Entre para acompanhar pedidos e desbloquear vouchers exclusivos.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:outline-none focus:border-gold-400 focus:bg-white transition"
              placeholder="voce@email.com"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:outline-none focus:border-gold-400 focus:bg-white transition"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-gold-500 text-white rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
          </button>
        </form>
        <div className="text-center text-xs text-stone-500">
          Ainda não tem conta?{" "}
          <Link to="/register" className="text-gold-500 font-semibold hover:underline">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
