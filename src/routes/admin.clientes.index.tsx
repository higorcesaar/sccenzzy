import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listCustomers } from "@/lib/admin/customers.functions";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/admin/clientes/")({
  component: CustomersListPage,
});

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CustomersListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const fetchList = useServerFn(listCustomers);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers", { search, page }],
    queryFn: () => fetchList({ data: { search, page, pageSize: 20 } }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Vendas</p>
        <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Clientes</h1>
        <p className="text-sm text-stone-500 mt-1">
          {data ? `${data.total} cliente(s) cadastrado(s)` : "Carregando…"}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          placeholder="Buscar por email ou nome…"
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
          <div className="py-20 text-center text-sm text-stone-500">Nenhum cliente encontrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>LTV</TableHead>
                <TableHead>Último pedido</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.display_name || "—"}</TableCell>
                  <TableCell className="text-sm text-stone-600">{c.email}</TableCell>
                  <TableCell className="text-sm">{c.orders_count}</TableCell>
                  <TableCell className="text-sm font-semibold">{brl(c.ltv_cents)}</TableCell>
                  <TableCell className="text-xs text-stone-500">
                    {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-stone-500">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/admin/clientes/$id" params={{ id: c.id }}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
