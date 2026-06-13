import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listBanners, upsertBanner, deleteBanner } from "@/lib/admin/banners.functions";
import { getR2UploadUrl } from "@/lib/r2.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/banners/")({
  component: BannersPage,
});

const LOCATIONS = ["home-hero", "home-mid", "categoria-bolsas", "categoria-sapatos", "categoria-cintos"];

const empty = {
  id: undefined as string | undefined,
  location: "home-hero",
  title: "",
  subtitle: "",
  image_url: "",
  link_url: "",
  cta_label: "",
  position: 0,
  is_active: true,
  starts_at: null as string | null,
  ends_at: null as string | null,
};

function BannersPage() {
  const fetch = useServerFn(listBanners);
  const save = useServerFn(upsertBanner);
  const del = useServerFn(deleteBanner);
  const getUploadUrl = useServerFn(getR2UploadUrl);
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: () => fetch(),
  });

  const saveMut = useMutation({
    mutationFn: () => save({ data: form as any }),
    onSuccess: () => {
      toast.success("Banner salvo");
      setOpen(false);
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Banner excluído");
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
  });

  async function onFile(file: File) {
    setUploading(true);
    try {
      const presigned = await getUploadUrl({
        data: { filename: file.name, contentType: file.type || "application/octet-stream" },
      });
      const put = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error("Falha no upload");
      setForm({ ...form, image_url: presigned.publicUrl });
    } catch (e: any) {
      toast.error(e?.message || "Erro");
    } finally {
      setUploading(false);
    }
  }

  function openEdit(b?: any) {
    setForm(b ? { ...empty, ...b } : empty);
    setOpen(true);
  }

  const grouped = (data ?? []).reduce<Record<string, any[]>>((acc, b: any) => {
    (acc[b.location] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Conteúdo</p>
          <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Banners</h1>
          <p className="text-sm text-stone-500 mt-1">Gerencie banners por localização e período.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => openEdit()}>
              <Plus className="h-4 w-4 mr-1" /> Novo banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar banner" : "Novo banner"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Localização</Label>
                  <select
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="h-10 w-full rounded-md border border-stone-200 px-3 text-sm"
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Posição</Label>
                  <Input
                    type="number"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div>
                <Label>Imagem</Label>
                {form.image_url && (
                  <img src={form.image_url} alt="" className="w-full max-h-48 object-cover rounded-lg my-2" />
                )}
                <div className="flex gap-2">
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://…"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onFile(f);
                        e.target.value = "";
                      }}
                    />
                    <span className="inline-flex items-center gap-1 h-10 px-3 rounded-md border bg-white text-xs hover:border-stone-400">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Upload
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <Label>Link de destino</Label>
                <Input value={form.link_url || ""} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
              </div>
              <div>
                <Label>Texto do botão</Label>
                <Input value={form.cta_label || ""} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Início</Label>
                  <Input
                    type="datetime-local"
                    value={form.starts_at ? form.starts_at.slice(0, 16) : ""}
                    onChange={(e) =>
                      setForm({ ...form, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                  />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input
                    type="datetime-local"
                    value={form.ends_at ? form.ends_at.slice(0, 16) : ""}
                    onChange={(e) =>
                      setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!form.image_url || saveMut.isPending}
                onClick={() => saveMut.mutate()}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {saveMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {LOCATIONS.map((loc) => (
            <div key={loc}>
              <h3 className="font-serif text-lg font-bold text-neutral-900 mb-2">{loc}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(grouped[loc] || []).map((b: any) => (
                  <Card key={b.id} className="overflow-hidden">
                    <img src={b.image_url} alt="" className="w-full aspect-video object-cover" />
                    <CardContent className="pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm truncate">{b.title || "(sem título)"}</div>
                        {b.is_active ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">ON</Badge>
                        ) : (
                          <Badge variant="secondary">OFF</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate">{b.link_url}</div>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Excluir banner?")) delMut.mutate(b.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!grouped[loc] || grouped[loc].length === 0) && (
                  <div className="col-span-full text-xs text-stone-400 italic py-4">Sem banners nesta localização.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
