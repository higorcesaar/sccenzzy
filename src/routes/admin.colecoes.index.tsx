import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listAdminCollections, upsertCollection, deleteCollection } from "@/lib/admin/collections.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/admin/colecoes/")({ component: CollectionsPage });

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function CollectionsPage() {
  const list = useServerFn(listAdminCollections);
  const save = useServerFn(upsertCollection);
  const del = useServerFn(deleteCollection);
  const qc = useQueryClient();
  const { data: cols, isLoading } = useQuery({ queryKey: ["admin", "collections"], queryFn: () => list() });
  const [editing, setEditing] = useState<any | null>(null);

  const mut = useMutation({
    mutationFn: (v: any) => save({ data: v }),
    onSuccess: () => {
      toast.success("Coleção salva");
      qc.invalidateQueries({ queryKey: ["admin", "collections"] });
      qc.invalidateQueries({ queryKey: ["admin", "collections-select"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message || "Erro"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Excluída"); qc.invalidateQueries({ queryKey: ["admin", "collections"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Catálogo</p>
          <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Coleções</h1>
        </div>
        <Button onClick={() => setEditing({ name: "", slug: "", sort_order: 0, is_active: true })} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-1" /> Nova coleção
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className={editing ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader><CardTitle className="font-serif text-lg">Todas as coleções</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-amber-600" /></div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Slug</TableHead><TableHead>Ordem</TableHead><TableHead>Ativa</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {(cols ?? []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-xs">{c.slug}</TableCell>
                      <TableCell>{c.sort_order}</TableCell>
                      <TableCell>{c.is_active ? "Sim" : "Não"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => confirm(`Excluir "${c.name}"?`) && delMut.mutate(c.id)}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {editing && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif text-lg">{editing.id ? "Editar" : "Nova"}</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="text-xs">Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} /></div>
              <div><Label className="text-xs">Slug</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} /></div>
              <div><Label className="text-xs">Descrição</Label><Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><Label className="text-xs">URL da imagem</Label><Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
              <div><Label className="text-xs">Ordem</Label><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value || "0", 10) })} /></div>
              <label className="flex items-center justify-between text-sm">Ativa<Switch checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /></label>
              <Button className="w-full bg-amber-600 hover:bg-amber-700" disabled={mut.isPending || !editing.name} onClick={() => mut.mutate({
                id: editing.id, name: editing.name, slug: editing.slug || slugify(editing.name),
                description: editing.description || null, image_url: editing.image_url || null,
                sort_order: editing.sort_order ?? 0, is_active: editing.is_active ?? true,
              })}>
                {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
