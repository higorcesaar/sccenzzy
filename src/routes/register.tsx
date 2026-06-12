import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Criar conta | Scenzzy" },
      { name: "description", content: "Crie sua conta Scenzzy e ganhe vouchers exclusivos na sua primeira compra." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { signUp } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      addToast("A senha precisa ter ao menos 6 caracteres.", "info", "Senha curta");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, name);
      addToast("Conta criada! Verifique seu e-mail para confirmar.", "info", "Cadastro realizado");
      navigate({ to: "/" });
    } catch (err: any) {
      addToast(err?.message || "Não foi possível cadastrar.", "info", "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-gold-500 text-[10px] uppercase font-bold tracking-widest">
            <Sparkles className="h-3 w-3" /> Junte-se ao Clube Scenzzy
          </div>
          <h1 className="font-serif text-3xl font-extrabold tracking-tight text-neutral-900">Criar conta</h1>
          <p className="text-xs text-stone-500">Cadastre-se em 30 segundos e ganhe 10% OFF na primeira compra.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Nome completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:outline-none focus:border-gold-400 focus:bg-white transition"
              placeholder="Como devemos te chamar"
            />
          </div>
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:outline-none focus:border-gold-400 focus:bg-white transition"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 hover:bg-gold-500 text-white rounded-xl py-3.5 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Criar minha conta
          </button>
        </form>
        <div className="text-center text-xs text-stone-500">
          Já tem conta?{" "}
          <Link to="/login" className="text-gold-500 font-semibold hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
