import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "@/lib/admin/customers.functions";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/admin/orders.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, ShoppingBag, Wallet } from "lucide-react";

export const Route = createFileRoute("/admin/clientes/$id")({
  component: CustomerDetailPage,
});

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const fetchCustomer = useServerFn(getCustomer);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: () => fetchCustomer({ data: { id } }),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  const { profile, orders, addresses, stats } = data;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/clientes">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </Button>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Cliente</p>
        <h1 className="font-serif text-3xl font-extrabold text-neutral-900">
          {profile.display_name || profile.email}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {profile.email} · cadastrado em {new Date(profile.created_at).toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-widest">
              <ShoppingBag className="h-4 w-4" /> Pedidos
            </div>
            <div className="mt-2 font-serif text-2xl font-bold">{stats.orders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-widest">
              <Wallet className="h-4 w-4" /> LTV
            </div>
            <div className="mt-2 font-serif text-2xl font-bold">{brl(stats.ltv_cents)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-stone-500 uppercase tracking-widest">Ticket médio</div>
            <div className="mt-2 font-serif text-2xl font-bold">
              {stats.orders > 0 ? brl(stats.ltv_cents / stats.orders) : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-stone-500 uppercase tracking-widest">Endereços</div>
            <div className="mt-2 font-serif text-2xl font-bold">{addresses.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de pedidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="py-10 text-center text-sm text-stone-500">Nenhum pedido ainda.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">#{o.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ORDER_STATUS_LABEL[o.status as OrderStatus] || o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{brl(o.total_cents)}</TableCell>
                    <TableCell className="text-xs text-stone-500">
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="link" className="text-amber-700">
                        <Link to="/admin/pedidos/$id" params={{ id: o.id }}>
                          Abrir →
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereços</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.length === 0 && (
            <div className="text-sm text-stone-500">Nenhum endereço salvo.</div>
          )}
          {addresses.map((a: any) => (
            <div key={a.id} className="border border-stone-200 rounded-xl p-4 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.label || a.recipient}</span>
                {a.is_default && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Padrão</Badge>
                )}
              </div>
              <div className="text-stone-600">
                {a.street}, {a.number} {a.complement && `· ${a.complement}`}
              </div>
              <div className="text-stone-600">
                {a.district} — {a.city}/{a.state}
              </div>
              <div className="text-stone-500 text-xs">CEP {a.postal_code}</div>
              {a.phone && <div className="text-stone-500 text-xs">Tel: {a.phone}</div>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
