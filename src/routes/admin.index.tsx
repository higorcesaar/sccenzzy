import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "@/lib/admin/dashboard.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  AlertTriangle,
  PackageX,
  Calendar,
  Loader2,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: any;
  hint?: string;
  tone?: "default" | "warn" | "danger" | "good";
}) {
  const tones: Record<string, string> = {
    default: "from-amber-50 to-white border-stone-200 text-amber-700",
    warn: "from-amber-50 to-white border-amber-200 text-amber-700",
    danger: "from-rose-50 to-white border-rose-200 text-rose-700",
    good: "from-emerald-50 to-white border-emerald-200 text-emerald-700",
  };
  return (
    <Card className={`bg-gradient-to-br ${tones[tone]} shadow-sm`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-serif font-bold text-neutral-900">{value}</div>
        {hint && <p className="text-xs text-stone-500 mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const fetchMetrics = useServerFn(getDashboardMetrics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fetchMetrics(),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }
  if (error || !data) {
    return <div className="text-sm text-rose-600">Falha ao carregar métricas.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Visão Geral</p>
        <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-1">
          Indicadores em tempo real da operação Scenzzy.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Vendas hoje" value={brl(data.todayTotal)} icon={DollarSign} />
        <StatCard
          label="Vendas no mês"
          value={brl(data.monthTotal)}
          icon={TrendingUp}
          hint={`${data.monthOrders} pedidos`}
          tone="good"
        />
        <StatCard label="Ticket médio" value={brl(data.avgTicket)} icon={Calendar} />
        <StatCard
          label="Pedidos abertos"
          value={String(data.openOrders)}
          icon={ShoppingCart}
          tone={data.openOrders > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Estoque baixo"
          value={String(data.lowStock)}
          icon={AlertTriangle}
          tone={data.lowStock > 0 ? "warn" : "default"}
        />
        <StatCard
          label="Sem estoque"
          value={String(data.outOfStock)}
          icon={PackageX}
          tone={data.outOfStock > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Novos clientes (30d)"
          value={String(data.newCustomers)}
          icon={Users}
          tone="good"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Vendas — últimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chart}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(v: any) => brl(Number(v))}
                  labelFormatter={(l: any) => `Dia ${l}`}
                />
                <Area type="monotone" dataKey="total" stroke="#d97706" fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
