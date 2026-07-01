import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listProducts, deleteProduct, toggleProductActive, duplicateProduct } from "@/lib/admin/products.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Search, Trash2, Pencil, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/produtos/")({
  component: ProductsListPage,
});

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ProductsListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const fetchList = useServerFn(listProducts);
  const del = useServerFn(deleteProduct);
  const toggle = useServerFn(toggleProductActive);
  const dup = useServerFn(duplicateProduct);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", { search, page }],
    queryFn: () => fetchList({ data: { search, page, pageSize: 20 } }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Produto excluído");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao excluir"),
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => toggle({ data: { id, is_active } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro"),
  });
  const dupMut = useMutation({
    mutationFn: (id: string) => dup({ data: { id } }),
    onSuccess: () => {
      toast.success("Produto duplicado");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro"),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Catálogo</p>
          <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Produtos</h1>
          <p className="text-sm text-stone-500 mt-1">
            {data ? `${data.total} produto(s) cadastrado(s)` : "Carregando…"}
          </p>
        </div>
        <Button asChild className="bg-amber-600 hover:bg-amber-700">
          <Link to="/admin/produtos/novo">
            <Plus className="h-4 w-4 mr-1" /> Novo produto
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Buscar por nome, SKU ou slug…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-500">
            Nenhum produto encontrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium text-neutral-900">{p.name}</div>
                    <div className="text-[11px] text-stone-500">{p.slug}</div>
                  </TableCell>
                  <TableCell className="text-xs text-stone-600">{p.sku || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {brl(p.price_cents)}
                    {p.promo_price && (
                      <div className="text-[11px] text-amber-700">
                        Promo: {Number(p.promo_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <Switch
                        checked={!!p.is_active}
                        onCheckedChange={(v) => toggleMut.mutate({ id: p.id, is_active: v })}
                      />
                      {p.is_featured && <Badge variant="outline">Destaque</Badge>}
                      {p.is_on_sale && <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Promo</Badge>}
                      {p.has_variants && <Badge variant="outline">Variações</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/admin/produtos/$id" params={{ id: p.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => dupMut.mutate(p.id)} title="Duplicar">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { if (confirm(`Excluir "${p.name}"?`)) delMut.mutate(p.id); }}
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-stone-500">
            Página {page} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
