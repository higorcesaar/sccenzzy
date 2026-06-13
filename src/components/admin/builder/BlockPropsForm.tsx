import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { Block } from "@/lib/admin/blocks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getR2UploadUrl } from "@/lib/r2.functions";
import { Upload, Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

function useImageUpload() {
  const getUrl = useServerFn(getR2UploadUrl);
  const [uploading, setUploading] = useState(false);
  async function upload(file: File): Promise<string> {
    setUploading(true);
    try {
      const presigned = await getUrl({
        data: { filename: file.name, contentType: file.type || "application/octet-stream" },
      });
      const put = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) throw new Error(`R2 PUT falhou: ${put.status}`);
      return presigned.publicUrl;
    } finally {
      setUploading(false);
    }
  }
  return { upload, uploading };
}

function ImageField({ value, onChange, label = "Imagem" }: { value?: string; onChange: (v: string) => void; label?: string }) {
  const { upload, uploading } = useImageUpload();
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      {value && <img src={value} alt="" className="w-full max-h-40 object-cover rounded-lg border border-stone-200" />}
      <div className="flex gap-2">
        <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="https://…" className="flex-1 text-xs" />
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const url = await upload(f);
                onChange(url);
              } catch (err: any) {
                toast.error(err?.message || "Falha no upload");
              }
              e.target.value = "";
            }}
          />
          <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-stone-200 text-xs bg-white hover:border-stone-400">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload
          </span>
        </label>
      </div>
    </div>
  );
}

export function BlockPropsForm({
  block,
  onChange,
}: {
  block: Block;
  onChange: (props: Record<string, any>) => void;
}) {
  const p = block.props || {};
  const set = (patch: Record<string, any>) => onChange({ ...p, ...patch });

  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <Field label="Título" value={p.title} onChange={(v) => set({ title: v })} />
          <Field label="Subtítulo" value={p.subtitle} onChange={(v) => set({ subtitle: v })} />
          <ImageField value={p.image} onChange={(v) => set({ image: v })} label="Imagem de fundo" />
          <Field label="Texto do botão" value={p.cta_label} onChange={(v) => set({ cta_label: v })} />
          <Field label="Link do botão" value={p.cta_link} onChange={(v) => set({ cta_link: v })} />
        </div>
      );
    case "banner":
      return (
        <div className="space-y-3">
          <ImageField value={p.image} onChange={(v) => set({ image: v })} />
          <Field label="Link" value={p.link} onChange={(v) => set({ link: v })} />
          <Field label="Texto alternativo" value={p.alt} onChange={(v) => set({ alt: v })} />
        </div>
      );
    case "rich_text":
      return (
        <div className="space-y-2">
          <Label className="text-xs">Conteúdo (HTML)</Label>
          <Textarea
            rows={10}
            value={p.html || ""}
            onChange={(e) => set({ html: e.target.value })}
            className="font-mono text-xs"
          />
        </div>
      );
    case "product_grid":
      return (
        <div className="space-y-3">
          <Field label="Título da seção" value={p.title} onChange={(v) => set({ title: v })} />
          <div>
            <Label className="text-xs">Colunas</Label>
            <Input
              type="number"
              min={2}
              max={4}
              value={p.columns || 4}
              onChange={(e) => set({ columns: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label className="text-xs">Slugs dos produtos (um por linha)</Label>
            <Textarea
              rows={6}
              value={(p.slugs || []).join("\n")}
              onChange={(e) => set({ slugs: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
              className="font-mono text-xs"
            />
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            {(p.images || []).map((src: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <img src={src} alt="" className="h-12 w-12 object-cover rounded" />
                <Input
                  value={src}
                  onChange={(e) => {
                    const arr = [...(p.images || [])];
                    arr[i] = e.target.value;
                    set({ images: arr });
                  }}
                  className="flex-1 text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => set({ images: (p.images || []).filter((_: any, j: number) => j !== i) })}
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </Button>
              </div>
            ))}
          </div>
          <ImageField
            value=""
            onChange={(v) => set({ images: [...(p.images || []), v] })}
            label="Adicionar imagem"
          />
        </div>
      );
    case "newsletter":
      return (
        <div className="space-y-3">
          <Field label="Título" value={p.title} onChange={(v) => set({ title: v })} />
          <Field label="Subtítulo" value={p.subtitle} onChange={(v) => set({ subtitle: v })} />
        </div>
      );
    case "faq":
      return (
        <div className="space-y-3">
          {(p.items || []).map((it: any, i: number) => (
            <div key={i} className="border border-stone-200 rounded-lg p-3 space-y-2">
              <Input
                placeholder="Pergunta"
                value={it.q}
                onChange={(e) => {
                  const arr = [...p.items];
                  arr[i] = { ...it, q: e.target.value };
                  set({ items: arr });
                }}
              />
              <Textarea
                placeholder="Resposta"
                rows={3}
                value={it.a}
                onChange={(e) => {
                  const arr = [...p.items];
                  arr[i] = { ...it, a: e.target.value };
                  set({ items: arr });
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => set({ items: p.items.filter((_: any, j: number) => j !== i) })}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" /> Remover
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => set({ items: [...(p.items || []), { q: "", a: "" }] })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar pergunta
          </Button>
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <Field label="Título" value={p.title} onChange={(v) => set({ title: v })} />
          <Field label="Subtítulo" value={p.subtitle} onChange={(v) => set({ subtitle: v })} />
          <Field label="Texto do botão" value={p.button_label} onChange={(v) => set({ button_label: v })} />
          <Field label="Link do botão" value={p.button_link} onChange={(v) => set({ button_link: v })} />
          <div>
            <Label className="text-xs">Cor de fundo</Label>
            <Input type="color" value={p.bg || "#1c1917"} onChange={(e) => set({ bg: e.target.value })} className="h-10" />
          </div>
        </div>
      );
    case "spacer":
      return (
        <div>
          <Label className="text-xs">Altura (px)</Label>
          <Input
            type="number"
            min={8}
            max={400}
            value={p.height || 64}
            onChange={(e) => set({ height: Number(e.target.value) })}
          />
        </div>
      );
    default:
      return null;
  }
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
