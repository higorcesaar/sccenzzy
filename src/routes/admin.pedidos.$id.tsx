import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  getOrder,
  updateOrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "@/lib/admin/orders.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pedidos/$id")({
  component: OrderDetailPage,
});

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function OrderDetailPage() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrder);
  const updateStatus = useServerFn(updateOrderStatus);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => fetchOrder({ data: { id } }),
  });

  const [status, setStatus] = useState<OrderStatus>("pending");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (data?.order) {
      setStatus(data.order.status as OrderStatus);
      setNotes(data.order.notes || "");
    }
  }, [data?.order]);

  const mut = useMutation({
    mutationFn: () => updateStatus({ data: { id, status, notes } }),
    onSuccess: () => {
      toast.success("Pedido atualizado");
      qc.invalidateQueries({ queryKey: ["admin", "order", id] });
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao atualizar"),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  const { order, items, customer } = data;
  const addr = order.shipping_address || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/pedidos">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Pedido</p>
          <h1 className="font-serif text-3xl font-extrabold text-neutral-900 font-mono">
            #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Criado em {new Date(order.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <Badge className="bg-neutral-900 text-white">{ORDER_STATUS_LABEL[order.status as OrderStatus]}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Itens ({items.length})</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-stone-100">
              {items.map((it: any) => (
                <div key={it.id} className="py-3 flex items-center gap-3">
                  {it.image_url && (
                    <img src={it.image_url} alt="" className="h-12 w-12 rounded object-cover bg-stone-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-neutral-900 truncate">{it.product_name}</div>
                    <div className="text-[11px] text-stone-500">
                      {it.quantity} × {brl(it.unit_price_cents)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{brl(it.unit_price_cents * it.quantity)}</div>
                </div>
              ))}
              <div className="pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal</span>
                  <span>{brl(order.subtotal_cents)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Frete</span>
                  <span>{brl(order.shipping_cents)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-1 border-t border-stone-100">
                  <span>Total</span>
                  <span>{brl(order.total_cents)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Endereço de entrega</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-stone-700 space-y-1">
              <div className="font-medium">{addr.name || addr.recipient}</div>
              <div>{addr.email}</div>
              <div>{addr.phone}</div>
              <div>
                {addr.street}, {addr.number} {addr.complement && `· ${addr.complement}`}
              </div>
              <div>
                {addr.neighborhood || addr.district} — {addr.city}/{addr.state}
              </div>
              <div>CEP {addr.cep || addr.postal_code}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status do pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ORDER_STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Notas internas (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <Button
                onClick={() => mut.mutate()}
                disabled={mut.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {mut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar alterações
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {customer ? (
                <>
                  <div className="font-medium">{customer.display_name || "—"}</div>
                  <div className="text-stone-600">{customer.email}</div>
                  <Button asChild variant="link" size="sm" className="px-0 h-auto text-amber-700">
                    <Link to="/admin/clientes/$id" params={{ id: customer.id }}>
                      Ver perfil →
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="text-stone-500">Compra como convidado</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="capitalize">Método: {order.payment_method || "—"}</div>
              <div className="capitalize">Status: {order.payment_status}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
