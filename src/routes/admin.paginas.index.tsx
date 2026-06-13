import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listPages, upsertPage, deletePage } from "@/lib/admin/pages.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/paginas/")({
  component: PagesListPage,
});

function PagesListPage() {
  const [search, setSearch] = useState("");
  const fetchList = useServerFn(listPages);
  const create = useServerFn(upsertPage);
  const del = useServerFn(deletePage);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pages", search],
    queryFn: () => fetchList({ data: { search } }),
  });

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          title: form.title,
          slug: form.slug,
          status: "draft",
          blocks: [],
        },
      }),
    onSuccess: (row) => {
      toast.success("Página criada");
      setOpen(false);
      setForm({ title: "", slug: "" });
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      navigate({ to: "/admin/paginas/$id", params: { id: row.id } });
    },
    onError: (e: any) => toast.error(e?.message || "Erro"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Página excluída");
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Conteúdo</p>
          <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Páginas</h1>
          <p className="text-sm text-stone-500 mt-1">
            Crie e edite páginas do site com o construtor visual.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4 mr-1" /> Nova página
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova página</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs">Título</label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      title: e.target.value,
                      slug: form.slug || e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs">Slug (URL)</label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="ex: sobre-nos"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => createMut.mutate()}
                disabled={!form.title || !form.slug || createMut.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {createMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        placeholder="Buscar por título ou slug…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-500">Nenhuma página criada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.title}</div>
                    {p.is_system && <span className="text-[10px] text-stone-500">página do sistema</span>}
                  </TableCell>
                  <TableCell className="text-xs text-stone-600 font-mono">/p/{p.slug}</TableCell>
                  <TableCell>
                    {p.status === "published" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Publicada</Badge>
                    ) : p.status === "archived" ? (
                      <Badge variant="secondary">Arquivada</Badge>
                    ) : (
                      <Badge className="bg-stone-200 text-stone-700 hover:bg-stone-200">Rascunho</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-stone-500">
                    {new Date(p.updated_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {p.status === "published" && (
                        <Button asChild size="sm" variant="ghost">
                          <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/admin/paginas/$id" params={{ id: p.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {!p.is_system && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Excluir "${p.title}"?`)) delMut.mutate(p.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
