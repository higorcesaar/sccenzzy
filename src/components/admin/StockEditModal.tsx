import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listStock, updateSingleStockRecord, listMovements } from "@/lib/admin/stock-erp.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Minus, Plus, MapPin, Package, History, Save } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string | null;
  productName?: string;
};

export function StockEditModal({ open, onOpenChange, productId, productName }: Props) {
  const qc = useQueryClient();
  const fetchStock = useServerFn(listStock);
  const fetchHistory = useServerFn(listMovements);
  const updateFn = useServerFn(updateSingleStockRecord);

  const { data: stockData, isLoading } = useQuery({
    queryKey: ["admin", "stock-edit-modal", productId],
    queryFn: () => fetchStock({ data: { search: undefined, pageSize: 200 } as any }),
    enabled: !!productId && open,
  });

  const { data: history } = useQuery({
    queryKey: ["admin", "stock-edit-history", productId],
    queryFn: () => fetchHistory({ data: { productId: productId!, pageSize: 30 } as any }),
    enabled: !!productId && open,
  });

  const rows = useMemo(
    () => (stockData?.rows ?? []).filter((r: any) => r.product?.id === productId),
    [stockData, productId],
  );

  const updateMut = useMutation({
    mutationFn: (args: { id: string; qty: number; min_qty: number; location_label: string }) =>
      updateFn({ data: args }),
    onSuccess: () => {
      toast.success("Estoque atualizado");
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao atualizar"),
  });

  // Local drafts per row for min/label; qty is instant via +/-
  const [drafts, setDrafts] = useState<Record<string, { min_qty: number; location_label: string }>>({});
  const getDraft = (r: any) =>
    drafts[r.id] ?? { min_qty: r.min_qty ?? 0, location_label: r.location_label ?? "" };

  const setDraft = (id: string, patch: Partial<{ min_qty: number; location_label: string }>) =>
    setDrafts((d) => ({ ...d, [id]: { ...getDraft({ id, min_qty: 0, location_label: "" }), ...patch } }));

  const statusBadge = (qty: number, min: number) => {
    if (qty <= 0) return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Sem estoque</Badge>;
    if (min > 0 && qty <= min)
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Baixo</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Em estoque</Badge>;
  };

  const totalQty = rows.reduce((s: number, r: any) => s + (r.qty ?? 0), 0);
  const belowMin = rows.filter((r: any) => r.min_qty > 0 && r.qty <= r.min_qty).length;
  const outOf = rows.filter((r: any) => r.qty <= 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            {productName || rows[0]?.product?.name || "Editar estoque"}
          </DialogTitle>
          <DialogDescription>
            Gestão de inventário por variação e local — alterações são registradas no histórico.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        ) : (
          <Tabs defaultValue="variacoes" className="w-full">
            <TabsList className="bg-stone-100">
              <TabsTrigger value="variacoes">Variações & Estoque</TabsTrigger>
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center gap-1">
                <History className="h-3.5 w-3.5" /> Histórico
              </TabsTrigger>
            </TabsList>

            {/* GERAL — resumo do produto */}
            <TabsContent value="geral" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Total em estoque</p>
                    <p className="text-2xl font-extrabold text-emerald-700 font-mono">{totalQty} un</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Variações/locais</p>
                    <p className="text-2xl font-extrabold text-neutral-900 font-mono">{rows.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">Abaixo do mínimo</p>
                    <p className="text-2xl font-extrabold text-amber-700 font-mono">{belowMin}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-[10px] uppercase tracking-widest text-rose-700 font-bold">Sem estoque</p>
                    <p className="text-2xl font-extrabold text-rose-700 font-mono">{outOf}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
                <p className="font-semibold text-stone-800 mb-1">{rows[0]?.product?.name}</p>
                <p>
                  Categoria:{" "}
                  <span className="font-medium">{rows[0]?.product?.category?.name || "—"}</span>
                </p>
                <p className="mt-2 text-stone-500">
                  Para editar nome, imagens, descrição, preço e SEO, abra o cadastro do produto em{" "}
                  <span className="font-mono">Produtos → Editar</span>.
                </p>
              </div>
            </TabsContent>

            {/* VARIAÇÕES E ESTOQUE */}
            <TabsContent value="variacoes" className="pt-4">
              {rows.length === 0 ? (
                <div className="py-16 text-center text-sm text-stone-500">
                  Nenhum registro de estoque para este produto.
                </div>
              ) : (
                <div className="overflow-x-auto border border-stone-200 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>Variação</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>SKU / Barras</TableHead>
                        <TableHead>Localização física</TableHead>
                        <TableHead className="w-40 text-center">Quantidade</TableHead>
                        <TableHead className="w-24">Mínimo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Salvar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row: any) => {
                        const d = getDraft(row);
                        const pending = updateMut.isPending;
                        return (
                          <TableRow key={row.id}>
                            <TableCell>
                              {row.variant ? (
                                <div className="text-xs">
                                  {row.variant.size && (
                                    <Badge variant="outline" className="mr-1">
                                      {row.variant.size}
                                    </Badge>
                                  )}
                                  {row.variant.color && (
                                    <span className="text-stone-600">{row.variant.color}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-stone-400">Único</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-xs font-medium text-stone-700">
                                <MapPin className="h-3 w-3 text-stone-400" />
                                {row.location?.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-mono">
                                {row.variant?.sku || row.product?.sku || "—"}
                              </div>
                              <div className="text-[10px] text-stone-400">
                                {row.variant?.barcode || "—"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={d.location_label}
                                onChange={(e) => setDraft(row.id, { location_label: e.target.value })}
                                className="h-8 text-xs bg-white"
                                placeholder="Ex: Corredor A"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 rounded-full"
                                  disabled={pending || row.qty <= 0}
                                  onClick={() =>
                                    updateMut.mutate({
                                      id: row.id,
                                      qty: Math.max(0, row.qty - 1),
                                      min_qty: d.min_qty,
                                      location_label: d.location_label,
                                    })
                                  }
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <span className="w-12 text-center font-bold font-mono text-sm">
                                  {row.qty}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 rounded-full"
                                  disabled={pending}
                                  onClick={() =>
                                    updateMut.mutate({
                                      id: row.id,
                                      qty: row.qty + 1,
                                      min_qty: d.min_qty,
                                      location_label: d.location_label,
                                    })
                                  }
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                value={d.min_qty}
                                onChange={(e) =>
                                  setDraft(row.id, { min_qty: Math.max(0, Number(e.target.value) || 0) })
                                }
                                className="h-8 w-20 text-xs text-center font-mono bg-white"
                              />
                            </TableCell>
                            <TableCell>{statusBadge(row.qty, d.min_qty)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                className="h-8 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                                disabled={pending}
                                onClick={() =>
                                  updateMut.mutate({
                                    id: row.id,
                                    qty: row.qty,
                                    min_qty: d.min_qty,
                                    location_label: d.location_label,
                                  })
                                }
                              >
                                <Save className="h-3.5 w-3.5 mr-1" /> Salvar
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="mt-3 text-[11px] text-stone-500">
                Cada clique em <strong>+</strong> ou <strong>−</strong> altera exatamente 1 unidade e cria uma movimentação
                de ajuste. O sistema nunca permite estoque negativo.
              </p>
            </TabsContent>

            {/* HISTÓRICO */}
            <TabsContent value="historico" className="pt-4">
              {!history || (history as any).rows?.length === 0 ? (
                <p className="py-16 text-center text-sm text-stone-500">Sem movimentações registradas.</p>
              ) : (
                <div className="overflow-x-auto border border-stone-200 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-stone-50">
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Variação</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Ant. → Novo</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(history as any).rows.map((row: any) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-xs text-stone-500">
                            {new Date(row.created_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                row.movement_type === "entrada" || row.movement_type === "devolucao"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : "bg-rose-100 text-rose-800 hover:bg-rose-100"
                              }
                            >
                              {row.movement_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.variant
                              ? `${row.variant.size ?? ""} ${row.variant.color ? `(${row.variant.color})` : ""}`
                              : "Único"}
                          </TableCell>
                          <TableCell className="text-xs">{row.location?.name}</TableCell>
                          <TableCell className="font-mono text-xs text-stone-600">
                            {row.qty_before ?? "—"} → {row.qty_after ?? "—"}
                          </TableCell>
                          <TableCell className="font-bold font-mono text-xs">{row.quantity}</TableCell>
                          <TableCell className="text-xs text-stone-600 max-w-[220px] truncate" title={row.reason}>
                            {row.reason || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
