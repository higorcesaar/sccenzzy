import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listStockAlerts, listStockMovements, createStockMovement } from "@/lib/admin/stock.functions";
import { listProducts } from "@/lib/admin/products.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PackageX, Loader2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/estoque")({
  component: StockPage,
});

function StockPage() {
  const fetchAlerts = useServerFn(listStockAlerts);
  const fetchMoves = useServerFn(listStockMovements);
  const fetchProducts = useServerFn(listProducts);
  const create = useServerFn(createStockMovement);
  const qc = useQueryClient();

  const { data: alerts } = useQuery({ queryKey: ["admin", "alerts"], queryFn: () => fetchAlerts() });
  const { data: moves } = useQuery({ queryKey: ["admin", "movements"], queryFn: () => fetchMoves({ data: { pageSize: 30 } }) });
  const { data: products } = useQuery({ queryKey: ["admin", "products", "all"], queryFn: () => fetchProducts({ data: { pageSize: 100 } }) });

  const [productId, setProductId] = useState("");
  const [type, setType] = useState<"entrada" | "saida" | "ajuste" | "devolucao">("entrada");
  const [qty, setQty] = useState<number>(1);
  const [reason, setReason] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      create({
        data: { product_id: productId, movement_type: type, quantity: qty, reason: reason || null },
      }),
    onSuccess: () => {
      toast.success("Movimentação registrada");
      qc.invalidateQueries({ queryKey: ["admin", "movements"] });
      qc.invalidateQueries({ queryKey: ["admin", "alerts"] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      setQty(1);
      setReason("");
    },
    onError: (e: any) => toast.error(e?.message || "Erro"),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Operação</p>
        <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Estoque</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-600" /> Nova movimentação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Produto</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                <SelectContent>
                  {(products?.rows ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} {p.sku && `· ${p.sku}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste (+/-)</SelectItem>
                  <SelectItem value="devolucao">Devolução</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Quantidade</Label>
              <Input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={1} />
            </div>
            <div>
              <Label className="text-xs">Motivo (opcional)</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
            </div>
            <Button
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={!productId || qty < 1 || mut.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Alertas de estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!alerts || alerts.length === 0 ? (
              <p className="text-sm text-stone-500 py-6 text-center">Nenhum alerta no momento.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Mínimo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs text-stone-600">{p.sku || "—"}</TableCell>
                      <TableCell>{p.stock_qty}</TableCell>
                      <TableCell>{p.stock_min}</TableCell>
                      <TableCell>
                        {p.stock_qty === 0 ? (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                            <PackageX className="h-3 w-3 mr-1" /> Sem estoque
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Baixo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg">Histórico de movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          {!moves || moves.rows.length === 0 ? (
            <p className="text-sm text-stone-500 py-6 text-center">Sem movimentações ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moves.rows.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{new Date(m.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{m.scz_products?.name ?? "—"}</div>
                      <div className="text-[11px] text-stone-500">{m.scz_products?.sku}</div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={m.movement_type} />
                    </TableCell>
                    <TableCell>{m.quantity}</TableCell>
                    <TableCell className="text-xs text-stone-600">{m.reason || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    entrada: "bg-emerald-100 text-emerald-700",
    saida: "bg-rose-100 text-rose-700",
    ajuste: "bg-amber-100 text-amber-700",
    venda: "bg-blue-100 text-blue-700",
    devolucao: "bg-violet-100 text-violet-700",
  };
  return <Badge className={`${map[type] ?? ""} hover:${map[type] ?? ""}`}>{type}</Badge>;
}
