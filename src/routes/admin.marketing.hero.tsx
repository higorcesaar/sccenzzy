import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  listHeroSlidesAdmin,
  upsertHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
} from "@/lib/admin/hero-carousel.functions";
import { uploadProductMedia } from "@/lib/r2.functions";
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
import { Loader2, Plus, Pencil, Trash2, Upload, ArrowUp, ArrowDown, Film, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/marketing/hero")({
  component: HeroCarouselPage,
});

const empty = {
  id: undefined as string | undefined,
  title: "",
  subtitle: "",
  video_url: "",
  image_url: "",
  button_text: "",
  button_link: "",
  position: 0,
  active: true,
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function HeroCarouselPage() {
  const fetchSlides = useServerFn(listHeroSlidesAdmin);
  const save = useServerFn(upsertHeroSlide);
  const del = useServerFn(deleteHeroSlide);
  const reorder = useServerFn(reorderHeroSlides);
  const uploadFn = useServerFn(uploadProductMedia);
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "hero-carousel"],
    queryFn: () => fetchSlides(),
  });

  const slides = (data ?? []) as any[];

  const saveMut = useMutation({
    mutationFn: () => save({ data: form as any }),
    onSuccess: () => {
      toast.success("Slide salvo");
      setOpen(false);
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["admin", "hero-carousel"] });
      qc.invalidateQueries({ queryKey: ["public-hero-carousel"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao salvar"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Slide excluído");
      qc.invalidateQueries({ queryKey: ["admin", "hero-carousel"] });
      qc.invalidateQueries({ queryKey: ["public-hero-carousel"] });
    },
  });

  const reorderMut = useMutation({
    mutationFn: (ids: string[]) => reorder({ data: { ids } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "hero-carousel"] });
      qc.invalidateQueries({ queryKey: ["public-hero-carousel"] });
    },
  });

  async function uploadFile(file: File, kind: "video" | "image") {
    const setter = kind === "video" ? setUploadingVideo : setUploadingImage;
    setter(true);
    try {
      const dataBase64 = await fileToBase64(file);
      const res = await uploadFn({
        data: {
          filename: file.name,
          contentType: file.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
          dataBase64,
        },
      });
      setForm((f) => ({ ...f, [kind === "video" ? "video_url" : "image_url"]: res.publicUrl }));
    } catch (e: any) {
      toast.error(e?.message || "Falha no upload");
    } finally {
      setter(false);
    }
  }

  function openEdit(s?: any) {
    setForm(s ? { ...empty, ...s } : { ...empty, position: slides.length });
    setOpen(true);
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...slides];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    reorderMut.mutate(next.map((s) => s.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Marketing</p>
          <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Hero Carousel</h1>
          <p className="text-sm text-stone-500 mt-1">
            Carrossel de vídeo/imagem exibido na hero section da loja.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => openEdit()}>
              <Plus className="h-4 w-4 mr-1" /> Novo slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar slide" : "Novo slide"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Título *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Coleção Alto Verão"
                />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input
                  value={form.subtitle || ""}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="Couro premium e acabamento artesanal"
                />
              </div>

              <div>
                <Label>Vídeo (MP4)</Label>
                {form.video_url && (
                  <video
                    src={form.video_url}
                    className="w-full max-h-48 rounded-lg my-2 bg-black"
                    controls
                    muted
                  />
                )}
                <div className="flex gap-2">
                  <Input
                    value={form.video_url || ""}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://… ou /api/public/r2/…"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadFile(f, "video");
                        e.target.value = "";
                      }}
                    />
                    <span className="inline-flex items-center gap-1 h-10 px-3 rounded-md border bg-white text-xs hover:border-stone-400">
                      {uploadingVideo ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Upload
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <Label>Imagem de capa (fallback)</Label>
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt=""
                    className="w-full max-h-48 object-cover rounded-lg my-2"
                  />
                )}
                <div className="flex gap-2">
                  <Input
                    value={form.image_url || ""}
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
                        if (f) uploadFile(f, "image");
                        e.target.value = "";
                      }}
                    />
                    <span className="inline-flex items-center gap-1 h-10 px-3 rounded-md border bg-white text-xs hover:border-stone-400">
                      {uploadingImage ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      Upload
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Texto do botão</Label>
                  <Input
                    value={form.button_text || ""}
                    onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                    placeholder="Comprar agora"
                  />
                </div>
                <div>
                  <Label>Link do botão</Label>
                  <Input
                    value={form.button_link || ""}
                    onChange={(e) => setForm({ ...form, button_link: e.target.value })}
                    placeholder="/sapatos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <Label>Posição</Label>
                  <Input
                    type="number"
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(v) => setForm({ ...form, active: v })}
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={!form.title || (!form.video_url && !form.image_url) || saveMut.isPending}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((s, idx) => (
            <Card key={s.id} className="overflow-hidden">
              <div className="relative aspect-video bg-stone-100">
                {s.video_url ? (
                  <video src={s.video_url} className="w-full h-full object-cover" muted />
                ) : s.image_url ? (
                  <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-stone-400">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  {s.video_url && <Badge className="bg-black/70 text-white"><Film className="h-3 w-3 mr-1" />Vídeo</Badge>}
                  {s.active ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">ON</Badge>
                  ) : (
                    <Badge variant="secondary">OFF</Badge>
                  )}
                </div>
              </div>
              <CardContent className="pt-3 space-y-2">
                <div className="font-medium text-sm truncate">{s.title}</div>
                <div className="text-[11px] text-stone-500 truncate">{s.subtitle || "—"}</div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === slides.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Excluir slide?")) delMut.mutate(s.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {slides.length === 0 && (
            <div className="col-span-full text-center text-sm text-stone-500 py-16 border-2 border-dashed border-stone-200 rounded-2xl">
              Nenhum slide cadastrado. Clique em "Novo slide" para começar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
