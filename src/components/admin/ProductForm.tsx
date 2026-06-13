import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { upsertProduct, listCategories, getProductImages } from "@/lib/admin/products.functions";
import { getR2UploadUrl } from "@/lib/r2.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, X, Save } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "use apenas a-z 0-9 -"),
  sku: z.string().optional(),
  internal_code: z.string().optional(),
  brand: z.string().optional(),
  category_id: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price_brl: z.number().min(0),
  cost_price: z.number().min(0).optional(),
  promo_price: z.number().min(0).optional(),
  weight_g: z.number().int().min(0).optional(),
  width_cm: z.number().min(0).optional(),
  height_cm: z.number().min(0).optional(),
  depth_cm: z.number().min(0).optional(),
  stock_qty: z.number().int().min(0),
  stock_min: z.number().int().min(0),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  is_launch: z.boolean(),
  is_on_sale: z.boolean(),
  is_bestseller: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function ProductForm({ initial }: { initial?: any }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const save = useServerFn(upsertProduct);
  const getUploadUrl = useServerFn(getR2UploadUrl);
  const fetchCats = useServerFn(listCategories);
  const fetchImages = useServerFn(getProductImages);

  const { data: cats } = useQuery({ queryKey: ["admin", "categories"], queryFn: () => fetchCats() });
  const { data: existingImages } = useQuery({
    queryKey: ["admin", "product-images", initial?.id],
    queryFn: () => fetchImages({ data: { productId: initial.id } }),
    enabled: !!initial?.id,
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // hydrate images on first load
  useState(() => {
    if (existingImages && images.length === 0) setImages(existingImages.map((i: any) => i.url));
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      sku: initial?.sku ?? "",
      internal_code: initial?.internal_code ?? "",
      brand: initial?.brand ?? "",
      category_id: initial?.category_id ?? undefined,
      short_description: initial?.short_description ?? "",
      description: initial?.description ?? "",
      price_brl: initial ? Number(initial.price_cents) / 100 : 0,
      cost_price: initial?.cost_price ? Number(initial.cost_price) : undefined,
      promo_price: initial?.promo_price ? Number(initial.promo_price) : undefined,
      weight_g: initial?.weight_g ?? undefined,
      width_cm: initial?.width_cm ?? undefined,
      height_cm: initial?.height_cm ?? undefined,
      depth_cm: initial?.depth_cm ?? undefined,
      stock_qty: initial?.stock_qty ?? 0,
      stock_min: initial?.stock_min ?? 0,
      seo_title: initial?.seo_title ?? "",
      seo_description: initial?.seo_description ?? "",
      seo_keywords: initial?.seo_keywords ?? "",
      is_active: initial?.is_active ?? true,
      is_featured: initial?.is_featured ?? false,
      is_launch: initial?.is_launch ?? false,
      is_on_sale: initial?.is_on_sale ?? false,
      is_bestseller: initial?.is_bestseller ?? false,
    },
  });

  const imgs = images.length > 0 ? images : existingImages?.map((i: any) => i.url) ?? [];

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const next = [...imgs];
      for (const file of files) {
        const p = await getUploadUrl({
          data: { filename: file.name, contentType: file.type || "application/octet-stream" },
        });
        const put = await fetch(p.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!put.ok) throw new Error(`Falha no upload (${put.status})`);
        next.push(p.publicUrl);
      }
      setImages(next);
      toast.success(`${files.length} arquivo(s) enviado(s)`);
    } catch (err: any) {
      toast.error(err?.message || "Erro no upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const mut = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload: any = {
        ...(initial?.id ? { id: initial.id } : {}),
        name: v.name,
        slug: v.slug,
        sku: v.sku || null,
        internal_code: v.internal_code || null,
        brand: v.brand || null,
        category_id: v.category_id || null,
        short_description: v.short_description || null,
        description: v.description || null,
        price_cents: Math.round(v.price_brl * 100),
        cost_price: v.cost_price ?? null,
        promo_price: v.promo_price ?? null,
        weight_g: v.weight_g ?? null,
        width_cm: v.width_cm ?? null,
        height_cm: v.height_cm ?? null,
        depth_cm: v.depth_cm ?? null,
        stock_qty: v.stock_qty,
        stock_min: v.stock_min,
        seo_title: v.seo_title || null,
        seo_description: v.seo_description || null,
        seo_keywords: v.seo_keywords || null,
        is_active: v.is_active,
        is_featured: v.is_featured,
        is_launch: v.is_launch,
        is_on_sale: v.is_on_sale,
        is_bestseller: v.is_bestseller,
        images: imgs,
      };
      return save({ data: payload });
    },
    onSuccess: (row: any) => {
      toast.success("Produto salvo");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      if (!initial?.id) navigate({ to: "/admin/produtos/$id", params: { id: row.id } });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao salvar"),
  });

  return (
    <form
      onSubmit={form.handleSubmit((v) => mut.mutate(v))}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">
          {initial?.id ? "Editar produto" : "Novo produto"}
        </h1>
        <Button type="submit" disabled={mut.isPending} className="bg-amber-600 hover:bg-amber-700">
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Salvar
        </Button>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="bg-white border border-stone-200">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="preco">Preço</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="flags">Destaques</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome *" error={form.formState.errors.name?.message}>
                  <Input {...form.register("name")} />
                </Field>
                <Field label="Slug (URL) *" error={form.formState.errors.slug?.message}>
                  <Input {...form.register("slug")} placeholder="ex: tenis-couro-classic" />
                </Field>
                <Field label="SKU"><Input {...form.register("sku")} /></Field>
                <Field label="Código interno"><Input {...form.register("internal_code")} /></Field>
                <Field label="Marca"><Input {...form.register("brand")} /></Field>
                <Field label="Categoria">
                  <Select value={form.watch("category_id") ?? ""} onValueChange={(v) => form.setValue("category_id", v || undefined)}>
                    <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                    <SelectContent>
                      {(cats ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Descrição curta">
                <Textarea rows={2} {...form.register("short_description")} maxLength={500} />
              </Field>
              <Field label="Descrição completa">
                <Textarea rows={6} {...form.register("description")} />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="midia">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <label className={`block rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${uploading ? "border-amber-300 bg-amber-50" : "border-stone-300 hover:border-amber-400"}`}>
                <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={handleUpload} disabled={uploading} />
                {uploading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-600" /> : <Upload className="h-6 w-6 mx-auto text-amber-600" />}
                <p className="mt-2 text-sm text-neutral-900 font-medium">
                  {uploading ? "Enviando para o Cloudflare R2…" : "Clique para enviar fotos/vídeos"}
                </p>
                <p className="text-[11px] text-stone-500">JPG, PNG, WebP, MP4 — múltiplos arquivos</p>
              </label>

              {imgs.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {imgs.map((url: string, i: number) => (
                    <div key={url} className="relative group rounded-lg overflow-hidden border border-stone-200 bg-stone-50 aspect-square">
                      {/\.(mp4|mov|webm)$/i.test(url) ? (
                        <video src={url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={url} className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setImages(imgs.filter((_: string, j: number) => j !== i))}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {i === 0 && (
                        <div className="absolute bottom-1 left-1 text-[9px] uppercase tracking-wider bg-amber-600 text-white px-1.5 py-0.5 rounded">
                          Capa
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preco">
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <Field label="Preço de venda (R$) *">
                <Input type="number" step="0.01" {...form.register("price_brl", { valueAsNumber: true })} />
              </Field>
              <Field label="Preço promocional (R$)">
                <Input type="number" step="0.01" {...form.register("promo_price", { valueAsNumber: true })} />
              </Field>
              <Field label="Custo (R$)">
                <Input type="number" step="0.01" {...form.register("cost_price", { valueAsNumber: true })} />
              </Field>
              <Field label="Peso (g)"><Input type="number" {...form.register("weight_g", { valueAsNumber: true })} /></Field>
              <Field label="Largura (cm)"><Input type="number" step="0.1" {...form.register("width_cm", { valueAsNumber: true })} /></Field>
              <Field label="Altura (cm)"><Input type="number" step="0.1" {...form.register("height_cm", { valueAsNumber: true })} /></Field>
              <Field label="Profundidade (cm)"><Input type="number" step="0.1" {...form.register("depth_cm", { valueAsNumber: true })} /></Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque">
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <Field label="Quantidade atual">
                <Input type="number" {...form.register("stock_qty", { valueAsNumber: true })} />
              </Field>
              <Field label="Quantidade mínima (alerta)">
                <Input type="number" {...form.register("stock_min", { valueAsNumber: true })} />
              </Field>
              <div className="md:col-span-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 p-3 leading-relaxed">
                {initial?.id ? (
                  <>
                    Ao salvar, qualquer alteração na <strong>Quantidade atual</strong> gera automaticamente uma
                    movimentação do tipo <strong>Ajuste</strong> no módulo <strong>Estoque</strong>, mantendo o
                    histórico completo.
                  </>
                ) : (
                  <>
                    A quantidade informada aqui será lançada como movimentação <strong>Entrada</strong> no módulo{" "}
                    <strong>Estoque</strong> assim que o produto for criado.
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Field label="Meta title"><Input {...form.register("seo_title")} maxLength={200} /></Field>
              <Field label="Meta description"><Textarea rows={3} {...form.register("seo_description")} maxLength={500} /></Field>
              <Field label="Keywords (separadas por vírgula)"><Input {...form.register("seo_keywords")} /></Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags">
          <Card>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">
              <Flag label="Produto ativo" name="is_active" form={form} />
              <Flag label="Em destaque" name="is_featured" form={form} />
              <Flag label="Lançamento" name="is_launch" form={form} />
              <Flag label="Em promoção" name="is_on_sale" form={form} />
              <Flag label="Mais vendido" name="is_bestseller" form={form} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-stone-700">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}

function Flag({ label, name, form }: { label: string; name: keyof FormValues; form: any }) {
  return (
    <label className="flex items-center justify-between gap-3 p-3 rounded-lg border border-stone-200 bg-stone-50 cursor-pointer">
      <span className="text-sm text-neutral-900">{label}</span>
      <Switch checked={!!form.watch(name)} onCheckedChange={(c) => form.setValue(name, c)} />
    </label>
  );
}
