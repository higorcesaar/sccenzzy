import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  listOrders,
  getOrderStatusCounts,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "@/lib/admin/orders.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, Eye } from "lucide-react";

export const Route = createFileRoute("/admin/pedidos/")({
  component: OrdersListPage,
});

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const statusColor: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-sky-100 text-sky-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-stone-200 text-stone-700",
  refunded: "bg-rose-100 text-rose-700",
};

function OrdersListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);

  const fetchList = useServerFn(listOrders);
  const fetchCounts = useServerFn(getOrderStatusCounts);

  const { data: counts } = useQuery({
    queryKey: ["admin", "orders", "counts"],
    queryFn: () => fetchCounts(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", { search, status, page }],
    queryFn: () => fetchList({ data: { search, status, page, pageSize: 20 } }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Vendas</p>
        <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Pedidos</h1>
        <p className="text-sm text-stone-500 mt-1">
          {data ? `${data.total} pedido(s) no filtro atual` : "Carregando…"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", ...ORDER_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              status === s
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
            }`}
          >
            {s === "all" ? "Todos" : ORDER_STATUS_LABEL[s]}
            {counts && (
              <span className="ml-1.5 opacity-70">({counts[s] ?? 0})</span>
            )}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          placeholder="Buscar por ID do pedido…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-500">Nenhum pedido encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((o: any) => {
                const addr = o.shipping_address || {};
                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-mono text-xs text-neutral-900">{o.id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{addr.name || addr.recipient || "—"}</div>
                      <div className="text-[11px] text-stone-500">{addr.email || ""}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColor[o.status as OrderStatus] || "bg-stone-100"} hover:opacity-90`}>
                        {ORDER_STATUS_LABEL[o.status as OrderStatus] || o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-stone-600 capitalize">
                      {o.payment_method || "—"} · {o.payment_status}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">{brl(o.total_cents)}</TableCell>
                    <TableCell className="text-xs text-stone-500">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/admin/pedidos/$id" params={{ id: o.id }}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-stone-500">Página {page} de {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
