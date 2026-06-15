import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  upsertProduct,
  getProductImages,
  listCategories,
  listCollectionsForSelect,
  duplicateProduct,
} from "@/lib/admin/products.functions";
import { listVariants, syncProductVariants } from "@/lib/admin/variants.functions";
import { uploadProductMedia } from "@/lib/r2.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, X, Save, Copy, Plus, Trash2, ArrowUp, ArrowDown, Star } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Informe o nome do produto"),
  slug: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  collection_id: z.string().uuid().optional().nullable(),
  sku: z.string().optional(),
  brand: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price_brl: z.number({ message: "Informe o preço" }).min(0),
  cost_price: z.number().min(0).optional(),
  promo_price: z.number().min(0).optional(),
  weight_g: z.number().int().min(0).optional(),
  width_cm: z.number().min(0).optional(),
  height_cm: z.number().min(0).optional(),
  depth_cm: z.number().min(0).optional(),
  stock_qty: z.number().int().min(0).optional(),
  stock_min: z.number().int().min(0).optional(),
  sort_order: z.number().int().min(0).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  is_launch: z.boolean(),
  is_on_sale: z.boolean(),
  is_bestseller: z.boolean(),
  has_variants: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Variant = {
  id?: string;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  color_hex?: string | null;
  model?: string | null;
  barcode?: string | null;
  price_cents?: number | null;
  promo_price?: number | null;
  stock_qty: number;
  stock_min: number;
  is_active: boolean;
  sort_order: number;
};

export function ProductForm({ initial }: { initial?: any }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const save = useServerFn(upsertProduct);
  const uploadMedia = useServerFn(uploadProductMedia);
  const fetchImages = useServerFn(getProductImages);
  const fetchCategories = useServerFn(listCategories);
  const fetchCollections = useServerFn(listCollectionsForSelect);
  const fetchVariants = useServerFn(listVariants);
  const saveVariants = useServerFn(syncProductVariants);
  const dup = useServerFn(duplicateProduct);

  const { data: categories } = useQuery({ queryKey: ["admin", "categories-select"], queryFn: () => fetchCategories() });
  const { data: collections } = useQuery({ queryKey: ["admin", "collections-select"], queryFn: () => fetchCollections() });

  const { data: existingImages } = useQuery({
    queryKey: ["admin", "product-images", initial?.id],
    queryFn: () => fetchImages({ data: { productId: initial.id } }),
    enabled: !!initial?.id,
  });

  const { data: existingVariants } = useQuery({
    queryKey: ["admin", "product-variants", initial?.id],
    queryFn: () => fetchVariants({ data: { product_id: initial.id } }),
    enabled: !!initial?.id,
  });

  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [uploading, setUploading] = useState(false);
  const imagesHydrated = useRef(false);
  const variantsHydrated = useRef(false);

  // Hidrata as imagens existentes uma única vez quando chegam do servidor.
  // Antes, se o usuário fizesse upload antes da carga terminar, as imagens
  // existentes eram perdidas porque o useEffect só sincronizava enquanto o
  // state estivesse vazio.
  useEffect(() => {
    if (!imagesHydrated.current && existingImages) {
      setImages(existingImages.map((i: any) => i.url));
      imagesHydrated.current = true;
    }
  }, [existingImages]);

  useEffect(() => {
    if (!variantsHydrated.current && existingVariants) {
      setVariants(existingVariants as any);
      variantsHydrated.current = true;
    }
  }, [existingVariants]);

  // Fonte única de verdade: o array `images`. Antes de hidratar mostramos o
  // que já veio do servidor para o usuário não ver tela vazia.
  const imgs = imagesHydrated.current ? images : (existingImages?.map((i: any) => i.url) ?? images);

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= imgs.length) return;
    const next = [...imgs];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    imagesHydrated.current = true;
    setImages(next);
  }

  function removeImage(i: number) {
    imagesHydrated.current = true;
    setImages(imgs.filter((_: string, j: number) => j !== i));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const next = [...imgs];
      for (const file of files) {
        const p = await getUploadUrl({ data: { filename: file.name, contentType: file.type || "application/octet-stream" } });
        const put = await fetch(p.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
        if (!put.ok) throw new Error(`Falha no upload (${put.status})`);
        next.push(p.publicUrl);
      }
      imagesHydrated.current = true;
      setImages(next);
      toast.success(`${files.length} arquivo(s) enviado(s). Lembre de salvar.`);
    } catch (err: any) {
      toast.error(err?.message || "Erro no upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      category_id: initial?.category_id ?? undefined,
      collection_id: initial?.collection_id ?? undefined,
      sku: initial?.sku ?? "",
      brand: initial?.brand ?? "",
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
      sort_order: initial?.sort_order ?? 0,
      seo_title: initial?.seo_title ?? "",
      seo_description: initial?.seo_description ?? "",
      seo_keywords: initial?.seo_keywords ?? "",
      is_active: initial?.is_active ?? true,
      is_featured: initial?.is_featured ?? false,
      is_launch: initial?.is_launch ?? false,
      is_on_sale: initial?.is_on_sale ?? false,
      is_bestseller: initial?.is_bestseller ?? false,
      has_variants: initial?.has_variants ?? false,
    },
  });

  const mut = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload: any = {
        ...(initial?.id ? { id: initial.id } : {}),
        name: v.name,
        slug: v.slug?.trim() || undefined,
        category_id: v.category_id || null,
        collection_id: v.collection_id || null,
        sku: v.sku || null,
        brand: v.brand || null,
        short_description: v.short_description || null,
        description: v.description || null,
        price_cents: Math.round(v.price_brl * 100),
        cost_price: v.cost_price ?? null,
        promo_price: v.promo_price ?? null,
        weight_g: v.weight_g ?? null,
        width_cm: v.width_cm ?? null,
        height_cm: v.height_cm ?? null,
        depth_cm: v.depth_cm ?? null,
        stock_qty: v.stock_qty ?? 0,
        stock_min: v.stock_min ?? 0,
        sort_order: v.sort_order ?? 0,
        seo_title: v.seo_title || null,
        seo_description: v.seo_description || null,
        seo_keywords: v.seo_keywords || null,
        is_active: v.is_active,
        is_featured: v.is_featured,
        is_launch: v.is_launch,
        is_on_sale: v.is_on_sale,
        is_bestseller: v.is_bestseller,
        has_variants: v.has_variants,
        images: imgs,
      };
      const product = await save({ data: payload });
      if (v.has_variants) {
        await saveVariants({ data: { product_id: product.id, variants } });
      }
      return product;
    },
    onSuccess: (row: any) => {
      toast.success("Produto salvo e publicado na loja");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["public-products"] });
      qc.invalidateQueries({ queryKey: ["public-categories"] });
      if (!initial?.id) navigate({ to: "/admin/produtos/$id", params: { id: row.id } });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao salvar"),
  });

  const duplicateMut = useMutation({
    mutationFn: () => dup({ data: { id: initial.id } }),
    onSuccess: (row: any) => {
      toast.success("Produto duplicado");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      navigate({ to: "/admin/produtos/$id", params: { id: row.id } });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao duplicar"),
  });

  const FIELD_LABELS: Record<string, string> = {
    name: "Nome do produto",
    price_brl: "Preço de venda",
  };
  function onInvalid(errors: any) {
    const missing = Object.keys(errors).map((k) => FIELD_LABELS[k] || k).join(", ");
    toast.error(`Não foi possível publicar. Verifique: ${missing}`, { duration: 6000 });
  }

  const hasVariants = form.watch("has_variants");

  // Parent vs child category list
  const parentCats = (categories ?? []).filter((c: any) => !c.parent_id);
  const childCats = (categories ?? []).filter((c: any) => c.parent_id);
  const selectedCat = form.watch("category_id");
  const subOptions = childCats.filter((c: any) => c.parent_id === selectedCat);

  function generateGrid() {
    const sizesStr = prompt("Tamanhos (separados por vírgula). Ex: 35,36,37,38");
    if (!sizesStr) return;
    const colorsStr = prompt("Cores (separadas por vírgula). Deixe vazio para apenas tamanhos.");
    const sizes = sizesStr.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = (colorsStr || "").split(",").map((s) => s.trim()).filter(Boolean);
    const newVars: Variant[] = [];
    let i = 0;
    if (colors.length === 0) {
      for (const s of sizes) newVars.push({ size: s, color: null, stock_qty: 0, stock_min: 0, is_active: true, sort_order: i++ });
    } else {
      for (const s of sizes) for (const c of colors) newVars.push({ size: s, color: c, stock_qty: 0, stock_min: 0, is_active: true, sort_order: i++ });
    }
    setVariants(newVars);
    form.setValue("has_variants", true);
    toast.success(`${newVars.length} variações geradas`);
  }

  return (
    <form onSubmit={form.handleSubmit((v) => mut.mutate(v), onInvalid)} className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="font-serif text-2xl font-bold text-neutral-900">{initial?.id ? "Editar produto" : "Novo produto"}</h1>
        <div className="flex items-center gap-2">
          {initial?.id && (
            <Button type="button" variant="outline" onClick={() => duplicateMut.mutate()} disabled={duplicateMut.isPending}>
              <Copy className="h-4 w-4 mr-1" /> Duplicar
            </Button>
          )}
          <Button type="submit" disabled={mut.isPending} className="bg-amber-600 hover:bg-amber-700">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar e publicar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="bg-white border border-stone-200 flex-wrap h-auto">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="preco">Preço</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="variacoes">Variações</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="flags">Destaques</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome do produto *" error={form.formState.errors.name?.message}>
                  <Input {...form.register("name")} placeholder="Ex: Scarpin Couro Premium" autoFocus />
                </Field>
                <Field label="Categoria">
                  <Select value={selectedCat ?? ""} onValueChange={(v) => form.setValue("category_id", v || null)}>
                    <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {parentCats.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {selectedCat && subOptions.length > 0 && (
                  <Field label="Subcategoria (escolha a categoria filha como principal se desejar)">
                    <Select value={selectedCat ?? ""} onValueChange={(v) => form.setValue("category_id", v || null)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {subOptions.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <Field label="Coleção">
                  <Select value={form.watch("collection_id") ?? ""} onValueChange={(v) => form.setValue("collection_id", v || null)}>
                    <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                    <SelectContent>
                      {(collections ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="SKU (opcional)"><Input {...form.register("sku")} /></Field>
                <Field label="Marca (opcional)"><Input {...form.register("brand")} /></Field>
                <Field label="Slug / URL (gerado automático)"><Input {...form.register("slug")} placeholder="deixe vazio" /></Field>
                <Field label="Ordem (menor aparece primeiro)">
                  <Input type="number" {...form.register("sort_order", { valueAsNumber: true })} />
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
                <p className="mt-2 text-sm font-medium">{uploading ? "Enviando…" : "Clique para enviar fotos/vídeos"}</p>
                <p className="text-[11px] text-stone-500">JPG, PNG, WebP, MP4 — múltiplos arquivos</p>
              </label>
              {imgs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                      Mídias do produto ({imgs.length})
                    </p>
                    <p className="text-[11px] text-stone-500">
                      A primeira é a capa. Use as setas para reordenar — essa é a sequência exibida na página do produto.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imgs.map((url: string, i: number) => (
                      <div key={url + i} className="relative group rounded-lg overflow-hidden border border-stone-200 bg-stone-50 aspect-square">
                        {/\.(mp4|mov|webm)$/i.test(url) ? (
                          <video src={url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={url} className="w-full h-full object-cover" alt={`mídia ${i + 1}`} />
                        )}
                        <span className="absolute top-1 left-1 text-[10px] font-mono font-bold bg-neutral-900/80 text-white px-1.5 py-0.5 rounded">
                          {i + 1}
                        </span>
                        {i === 0 && (
                          <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[9px] uppercase tracking-wider bg-amber-600 text-white px-1.5 py-0.5 rounded">
                            <Star className="h-2.5 w-2.5" /> Capa
                          </div>
                        )}
                        <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              title="Mover para a esquerda"
                              onClick={() => moveImage(i, i - 1)}
                              disabled={i === 0}
                              className="h-6 w-6 rounded bg-white/90 flex items-center justify-center disabled:opacity-30 hover:bg-white"
                            >
                              <ArrowUp className="h-3 w-3 -rotate-90" />
                            </button>
                            <button
                              type="button"
                              title="Mover para a direita"
                              onClick={() => moveImage(i, i + 1)}
                              disabled={i === imgs.length - 1}
                              className="h-6 w-6 rounded bg-white/90 flex items-center justify-center disabled:opacity-30 hover:bg-white"
                            >
                              <ArrowDown className="h-3 w-3 -rotate-90" />
                            </button>
                            {i !== 0 && (
                              <button
                                type="button"
                                title="Tornar capa"
                                onClick={() => moveImage(i, 0)}
                                className="h-6 w-6 rounded bg-white/90 flex items-center justify-center hover:bg-amber-100"
                              >
                                <Star className="h-3 w-3 text-amber-600" />
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            title="Remover"
                            onClick={() => removeImage(i)}
                            className="h-6 w-6 rounded bg-white/90 flex items-center justify-center hover:bg-rose-100"
                          >
                            <X className="h-3 w-3 text-rose-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    ⚠️ Lembre de clicar em <strong>Salvar e publicar</strong> para que as alterações de mídia sejam gravadas no banco.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preco">
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <Field label="Preço de venda (R$) *" error={form.formState.errors.price_brl?.message as string}>
                <Input type="number" step="0.01" {...form.register("price_brl", { valueAsNumber: true })} />
              </Field>
              <Field label="Preço promocional (R$)"><Input type="number" step="0.01" {...form.register("promo_price", { valueAsNumber: true })} /></Field>
              <Field label="Custo (R$)"><Input type="number" step="0.01" {...form.register("cost_price", { valueAsNumber: true })} /></Field>
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
              {!hasVariants && (
                <>
                  <Field label="Quantidade atual"><Input type="number" {...form.register("stock_qty", { valueAsNumber: true })} /></Field>
                  <Field label="Quantidade mínima (alerta)"><Input type="number" {...form.register("stock_min", { valueAsNumber: true })} /></Field>
                </>
              )}
              <div className="md:col-span-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 p-3 leading-relaxed">
                {hasVariants ? (
                  <>O estoque está sendo controlado pelas <strong>variações</strong>. Edite quantidade por tamanho/cor na aba "Variações".</>
                ) : initial?.id ? (
                  <>Alterações em "Quantidade atual" geram automaticamente um <strong>Ajuste</strong> em Estoque.</>
                ) : (
                  <>A quantidade informada será lançada como <strong>Entrada</strong> em Estoque.</>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variacoes">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <Switch checked={hasVariants} onCheckedChange={(v) => form.setValue("has_variants", v)} />
                  <span className="text-sm">Este produto tem variações (tamanho/cor/modelo)</span>
                </div>
                {hasVariants && (
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={generateGrid}>Gerar grade</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setVariants((vs) => [...vs, { stock_qty: 0, stock_min: 0, is_active: true, sort_order: vs.length }])}>
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                )}
              </div>

              {hasVariants && variants.length === 0 && (
                <p className="text-sm text-stone-500 py-6 text-center">Nenhuma variação. Clique em "Gerar grade" ou "Adicionar".</p>
              )}

              {hasVariants && variants.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-2">Tamanho</th>
                        <th className="p-2">Cor</th>
                        <th className="p-2">Modelo</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Preço (R$)</th>
                        <th className="p-2">Estoque</th>
                        <th className="p-2">Mín.</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, i) => (
                        <tr key={i} className="border-t border-stone-100">
                          <td className="p-1"><Input value={v.size ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, size: e.target.value } : x))} className="h-8" /></td>
                          <td className="p-1"><Input value={v.color ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} className="h-8" /></td>
                          <td className="p-1"><Input value={v.model ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, model: e.target.value } : x))} className="h-8" /></td>
                          <td className="p-1"><Input value={v.sku ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))} className="h-8" /></td>
                          <td className="p-1"><Input type="number" step="0.01" value={v.price_cents ? v.price_cents / 100 : ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, price_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null } : x))} className="h-8 w-24" placeholder="usa do produto" /></td>
                          <td className="p-1"><Input type="number" value={v.stock_qty} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, stock_qty: parseInt(e.target.value || "0", 10) } : x))} className="h-8 w-20" /></td>
                          <td className="p-1"><Input type="number" value={v.stock_min} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, stock_min: parseInt(e.target.value || "0", 10) } : x))} className="h-8 w-20" /></td>
                          <td className="p-1">
                            <Button type="button" size="sm" variant="ghost" onClick={() => setVariants(vs => vs.filter((_, j) => j !== i))}>
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Field label="Meta title"><Input {...form.register("seo_title")} maxLength={200} /></Field>
              <Field label="Meta description"><Textarea rows={3} {...form.register("seo_description")} maxLength={500} /></Field>
              <Field label="Keywords"><Input {...form.register("seo_keywords")} /></Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flags">
          <Card>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">
              <Flag label="Produto ativo (visível no site)" name="is_active" form={form} />
              <Flag label="Em destaque" name="is_featured" form={form} />
              <Flag label="Lançamento (aparece em Novidades)" name="is_launch" form={form} />
              <Flag label="Em promoção (aparece em Promoção)" name="is_on_sale" form={form} />
              <Flag label="Mais vendido" name="is_bestseller" form={form} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}

function Flag({ label, name, form }: { label: string; name: keyof FormValues; form: any }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 py-2.5 cursor-pointer hover:bg-stone-50">
      <span className="text-sm">{label}</span>
      <Switch checked={!!form.watch(name)} onCheckedChange={(v) => form.setValue(name, v)} />
    </label>
  );
}
