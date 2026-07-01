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
import { listBrands, listLocations, getProductStock, syncProductStock } from "@/lib/admin/stock-erp.functions";
import { uploadProductMedia } from "@/lib/r2.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, X, Save, Copy, Plus, Trash2, ArrowUp, ArrowDown, Star, Info, Warehouse } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const schema = z.object({
  name: z.string().min(1, "Informe o nome do produto"),
  slug: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  subcategory_id: z.string().uuid().optional().nullable(),
  collection_id: z.string().uuid().optional().nullable(),
  brand_id: z.string().uuid().optional().nullable(),
  sku: z.string().optional(),
  internal_code: z.string().optional(),
  brand: z.string().optional(),
  gender: z.string().optional(),
  material: z.string().optional(),
  specifications: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  price_brl: z.number({ message: "Informe o preço" }).min(0),
  cost_price: z.number().min(0).optional(),
  promo_price: z.number().min(0).optional(),
  weight_g: z.number().int().min(0).optional(),
  width_cm: z.number().min(0).optional(),
  height_cm: z.number().min(0).optional(),
  depth_cm: z.number().min(0).optional(),
  length_cm: z.number().min(0).optional(),
  sort_order: z.number().int().min(0).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  is_launch: z.boolean(),
  is_on_sale: z.boolean(),
  is_bestseller: z.boolean(),
  is_exclusive: z.boolean(),
  has_variants: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type Variant = {
  id?: string;
  sku?: string | null;
  internal_code?: string | null;
  size?: string | null;
  color?: string | null;
  color_hex?: string | null;
  model?: string | null;
  material?: string | null;
  finish?: string | null;
  barcode?: string | null;
  price_cents?: number | null;
  promo_price?: number | null;
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
  const fetchBrands = useServerFn(listBrands);
  const fetchVariants = useServerFn(listVariants);
  const saveVariants = useServerFn(syncProductVariants);
  const dup = useServerFn(duplicateProduct);
  const fetchLocations = useServerFn(listLocations);
  const fetchStock = useServerFn(getProductStock);
  const saveStock = useServerFn(syncProductStock);

  const { data: categories } = useQuery({ queryKey: ["admin", "categories-select"], queryFn: () => fetchCategories() });
  const { data: collections } = useQuery({ queryKey: ["admin", "collections-select"], queryFn: () => fetchCollections() });
  const { data: brands } = useQuery({ queryKey: ["admin", "brands-select"], queryFn: () => fetchBrands() });
  const { data: locations } = useQuery({ queryKey: ["admin", "locations-select"], queryFn: () => fetchLocations() });

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

  const { data: existingStock } = useQuery({
    queryKey: ["admin", "product-stock", initial?.id],
    queryFn: () => fetchStock({ data: { product_id: initial.id } }),
    enabled: !!initial?.id,
  });

  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [uploading, setUploading] = useState(false);
  const imagesHydrated = useRef(false);
  const variantsHydrated = useRef(false);

  const [stockItems, setStockItems] = useState<Array<{
    variant_id?: string | null;
    size?: string | null;
    color?: string | null;
    location_id: string;
    qty: number;
    min_qty: number;
    location_label: string | null;
  }>>([]);
  const stockHydrated = useRef(false);
  const [activeStockVariant, setActiveStockVariant] = useState<Variant | null>(null);

  // Hidratação do estoque
  useEffect(() => {
    if (!stockHydrated.current && existingStock && locations && (!initial?.has_variants || existingVariants)) {
      const items: any[] = [];
      if (initial?.has_variants && existingVariants) {
        for (const loc of locations) {
          for (const variant of existingVariants as any[]) {
            const current = existingStock.find(
              (s: any) => s.location_id === loc.id && s.variant_id === variant.id
            );
            items.push({
              variant_id: variant.id,
              size: variant.size,
              color: variant.color,
              location_id: loc.id,
              qty: current?.qty ?? 0,
              min_qty: current?.min_qty ?? 0,
              location_label: current?.location_label ?? "",
            });
          }
        }
      } else if (!initial?.has_variants) {
        for (const loc of locations) {
          const current = existingStock.find(
            (s: any) => s.location_id === loc.id && !s.variant_id
          );
          items.push({
            variant_id: null,
            location_id: loc.id,
            qty: current?.qty ?? 0,
            min_qty: current?.min_qty ?? 0,
            location_label: current?.location_label ?? "",
          });
        }
      }
      setStockItems(items);
      stockHydrated.current = true;
    }
  }, [existingStock, locations, existingVariants, initial]);

  const getStockItem = (locationId: string, variant?: Variant | null) => {
    if (!variant) {
      return stockItems.find(item => item.location_id === locationId && !item.variant_id && !item.size && !item.color) || {
        qty: 0,
        min_qty: 0,
        location_label: "",
      };
    }
    return stockItems.find(item => 
      item.location_id === locationId && 
      ((variant.id && item.variant_id === variant.id) || 
       (!variant.id && item.size === variant.size && item.color === variant.color))
    ) || {
      qty: 0,
      min_qty: 0,
      location_label: "",
    };
  };

  const updateStockItem = (locationId: string, qty: number, minQty: number, label: string, variant?: Variant | null) => {
    setStockItems(prev => {
      const next = [...prev];
      let idx = -1;
      if (!variant) {
        idx = next.findIndex(item => item.location_id === locationId && !item.variant_id && !item.size && !item.color);
      } else {
        idx = next.findIndex(item => 
          item.location_id === locationId && 
          ((variant.id && item.variant_id === variant.id) || 
           (!variant.id && item.size === variant.size && item.color === variant.color))
        );
      }

      const newItem = {
        location_id: locationId,
        variant_id: variant?.id || null,
        size: variant?.size || null,
        color: variant?.color || null,
        qty,
        min_qty: minQty,
        location_label: label || null,
      };

      if (idx > -1) {
        next[idx] = newItem;
      } else {
        next.push(newItem);
      }
      return next;
    });
  };

  const getVariantTotalStock = (variant: Variant) => {
    return stockItems
      .filter(item => 
        ((variant.id && item.variant_id === variant.id) || 
         (!variant.id && item.size === variant.size && item.color === variant.color))
      )
      .reduce((sum, item) => sum + item.qty, 0);
  };

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
    const MAX = 25 * 1024 * 1024;
    setUploading(true);
    try {
      const next = [...imgs];
      for (const file of files) {
        if (file.size > MAX) {
          toast.error(`"${file.name}" excede 25MB e foi ignorado.`);
          continue;
        }
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
        }
        const dataBase64 = btoa(binary);
        const res = await uploadMedia({
          data: { filename: file.name, contentType: file.type || "application/octet-stream", dataBase64 },
        });
        next.push(res.publicUrl);
      }
      imagesHydrated.current = true;
      setImages(next);
      toast.success(`Mídia enviada. Clique em "Salvar e publicar" para gravar.`);
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
      subcategory_id: initial?.subcategory_id ?? undefined,
      collection_id: initial?.collection_id ?? undefined,
      brand_id: initial?.brand_id ?? undefined,
      sku: initial?.sku ?? "",
      internal_code: initial?.internal_code ?? "",
      brand: initial?.brand ?? "",
      gender: initial?.gender ?? "",
      material: initial?.material ?? "",
      specifications: initial?.specifications ?? "",
      short_description: initial?.short_description ?? "",
      description: initial?.description ?? "",
      price_brl: initial ? Number(initial.price_cents) / 100 : 0,
      cost_price: initial?.cost_price ? Number(initial.cost_price) : undefined,
      promo_price: initial?.promo_price ? Number(initial.promo_price) : undefined,
      weight_g: initial?.weight_g ?? undefined,
      width_cm: initial?.width_cm ?? undefined,
      height_cm: initial?.height_cm ?? undefined,
      depth_cm: initial?.depth_cm ?? undefined,
      length_cm: initial?.length_cm ?? undefined,
      sort_order: initial?.sort_order ?? 0,
      seo_title: initial?.seo_title ?? "",
      seo_description: initial?.seo_description ?? "",
      seo_keywords: initial?.seo_keywords ?? "",
      is_active: initial?.is_active ?? true,
      is_featured: initial?.is_featured ?? false,
      is_launch: initial?.is_launch ?? false,
      is_on_sale: initial?.is_on_sale ?? false,
      is_bestseller: initial?.is_bestseller ?? false,
      is_exclusive: initial?.is_exclusive ?? false,
      has_variants: initial?.has_variants ?? false,
    },
  });

  const [savedOpen, setSavedOpen] = useState(false);
  const mut = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload: any = {
        ...(initial?.id ? { id: initial.id } : {}),
        name: v.name,
        slug: v.slug?.trim() || undefined,
        category_id: v.category_id || null,
        subcategory_id: v.subcategory_id || null,
        collection_id: v.collection_id || null,
        brand_id: v.brand_id || null,
        sku: v.sku || null,
        internal_code: v.internal_code || null,
        brand: v.brand || null,
        gender: v.gender || null,
        material: v.material || null,
        specifications: v.specifications || null,
        short_description: v.short_description || null,
        description: v.description || null,
        price_cents: Math.round(v.price_brl * 100),
        cost_price: v.cost_price ?? null,
        promo_price: v.promo_price ? Math.round(v.promo_price * 100) : null,
        weight_g: v.weight_g ?? null,
        width_cm: v.width_cm ?? null,
        height_cm: v.height_cm ?? null,
        depth_cm: v.depth_cm ?? null,
        length_cm: v.length_cm ?? null,
        sort_order: v.sort_order ?? 0,
        seo_title: v.seo_title || null,
        seo_description: v.seo_description || null,
        seo_keywords: v.seo_keywords || null,
        is_active: v.is_active,
        is_featured: v.is_featured,
        is_launch: v.is_launch,
        is_on_sale: v.is_on_sale,
        is_bestseller: v.is_bestseller,
        is_exclusive: v.is_exclusive,
        has_variants: v.has_variants,
        images: imgs,
      };
      const product = await save({ data: payload });
      if (v.has_variants) {
        await saveVariants({ data: { product_id: product.id, variants } });
      }

      // Prepara itens de estoque para salvar
      const payloadStock: any[] = [];
      const activeLocs = locations ?? [];
      
      if (!v.has_variants) {
        for (const loc of activeLocs) {
          const item = getStockItem(loc.id);
          payloadStock.push({
            location_id: loc.id,
            variant_id: null,
            qty: item.qty ?? 0,
            min_qty: item.min_qty ?? 0,
            location_label: item.location_label || null,
          });
        }
      } else {
        for (const variant of variants) {
          for (const loc of activeLocs) {
            const item = getStockItem(loc.id, variant);
            payloadStock.push({
              location_id: loc.id,
              variant_id: variant.id || null,
              size: variant.size || null,
              color: variant.color || null,
              qty: item.qty ?? 0,
              min_qty: item.min_qty ?? 0,
              location_label: item.location_label || null,
            });
          }
        }
      }

      await saveStock({ data: { product_id: product.id, stockItems: payloadStock } });
      return product;
    },
    onSuccess: (row: any) => {
      toast.success("Produto salvo e publicado na loja");
      setSavedOpen(true);
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["admin", "product-stock", row.id] });
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

  const FIELD_LABELS: Record<string, string> = { name: "Nome do produto", price_brl: "Preço de venda" };
  function onInvalid(errors: any) {
    const missing = Object.keys(errors).map((k) => FIELD_LABELS[k] || k).join(", ");
    toast.error(`Não foi possível publicar. Verifique: ${missing}`, { duration: 6000 });
  }

  const hasVariants = form.watch("has_variants");
  const parentCats = (categories ?? []).filter((c: any) => !c.parent_id);
  const childCats = (categories ?? []).filter((c: any) => c.parent_id);
  const selectedCat = form.watch("category_id");
  const subOptions = childCats.filter((c: any) => c.parent_id === selectedCat);

  function generateGrid() {
    const sizesStr = prompt("Tamanhos (separados por vírgula). Ex: 35,36,37,38 ou PP,P,M,G,GG");
    if (!sizesStr) return;
    const colorsStr = prompt("Cores (separadas por vírgula). Deixe vazio para apenas tamanhos.");
    const sizes = sizesStr.split(",").map((s) => s.trim()).filter(Boolean);
    const colors = (colorsStr || "").split(",").map((s) => s.trim()).filter(Boolean);
    const newVars: Variant[] = [];
    let i = 0;
    if (colors.length === 0) {
      for (const s of sizes) newVars.push({ size: s, color: null, is_active: true, sort_order: i++ });
    } else {
      for (const s of sizes) for (const c of colors) newVars.push({ size: s, color: c, is_active: true, sort_order: i++ });
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

      <div className="rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 p-3 flex gap-2">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Novo fluxo:</strong> este formulário cadastra as informações comerciais do produto e permite configurar diretamente o estoque de cada local e variação. Histórico detalhado de movimentações pode ser consultado no módulo <strong>Estoque</strong> no menu lateral.
        </p>
      </div>

      <Tabs defaultValue="basico" className="w-full">
        <TabsList className="bg-white border border-stone-200 flex-wrap h-auto">
          <TabsTrigger value="basico">Básico</TabsTrigger>
          <TabsTrigger value="midia">Mídias</TabsTrigger>
          <TabsTrigger value="venda">Venda</TabsTrigger>
          <TabsTrigger value="variacoes">Variações</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* BÁSICO */}
        <TabsContent value="basico">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nome do produto *" error={form.formState.errors.name?.message}>
                  <Input {...form.register("name")} placeholder="Ex: Scarpin Couro Premium" autoFocus />
                </Field>
                <Field label="Marca">
                  <Select value={form.watch("brand_id") ?? ""} onValueChange={(v) => form.setValue("brand_id", v || null)}>
                    <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                    <SelectContent>
                      {(brands ?? []).map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Field label="Subcategoria">
                    <Select value={form.watch("subcategory_id") ?? ""} onValueChange={(v) => form.setValue("subcategory_id", v || null)}>
                      <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
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
                <Field label="Gênero">
                  <Select value={form.watch("gender") ?? ""} onValueChange={(v) => form.setValue("gender", v)}>
                    <SelectTrigger><SelectValue placeholder="(opcional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="unissex">Unissex</SelectItem>
                      <SelectItem value="infantil">Infantil</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="SKU (produto)"><Input {...form.register("sku")} /></Field>
                <Field label="Código interno"><Input {...form.register("internal_code")} /></Field>
                <Field label="Material"><Input {...form.register("material")} placeholder="Ex: Couro legítimo" /></Field>
                <Field label="Peso (g)"><Input type="number" {...form.register("weight_g", { valueAsNumber: true })} /></Field>
                <Field label="Largura (cm)"><Input type="number" step="0.1" {...form.register("width_cm", { valueAsNumber: true })} /></Field>
                <Field label="Altura (cm)"><Input type="number" step="0.1" {...form.register("height_cm", { valueAsNumber: true })} /></Field>
                <Field label="Profundidade (cm)"><Input type="number" step="0.1" {...form.register("depth_cm", { valueAsNumber: true })} /></Field>
                <Field label="Comprimento (cm)"><Input type="number" step="0.1" {...form.register("length_cm", { valueAsNumber: true })} /></Field>
                <Field label="Slug (auto)"><Input {...form.register("slug")} placeholder="deixe vazio" /></Field>
                <Field label="Ordem exibição">
                  <Input type="number" {...form.register("sort_order", { valueAsNumber: true })} />
                </Field>
              </div>
              <Field label="Descrição curta">
                <Textarea rows={2} {...form.register("short_description")} maxLength={500} />
              </Field>
              <Field label="Descrição completa">
                <Textarea rows={6} {...form.register("description")} />
              </Field>
              <Field label="Especificações técnicas">
                <Textarea rows={4} {...form.register("specifications")} placeholder="Uma por linha" />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MÍDIA */}
        <TabsContent value="midia">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <label className={`block rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${uploading ? "border-amber-300 bg-amber-50" : "border-stone-300 hover:border-amber-400"}`}>
                <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={handleUpload} disabled={uploading} />
                {uploading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-600" /> : <Upload className="h-6 w-6 mx-auto text-amber-600" />}
                <p className="mt-2 text-sm font-medium">{uploading ? "Enviando…" : "Clique para enviar fotos/vídeos"}</p>
                <p className="text-[11px] text-stone-500">JPG, PNG, WebP, MP4 — múltiplos arquivos, até 25MB cada</p>
              </label>
              {imgs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                      Mídias do produto ({imgs.length})
                    </p>
                    <p className="text-[11px] text-stone-500">A primeira é a capa.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {imgs.map((url: string, i: number) => (
                      <div key={url + i} className="relative group rounded-lg overflow-hidden border border-stone-200 bg-stone-50 aspect-square">
                        {/\.(mp4|mov|webm)$/i.test(url) ? (
                          <video src={url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={url} className="w-full h-full object-cover" alt={`mídia ${i + 1}`} />
                        )}
                        <span className="absolute top-1 left-1 text-[10px] font-mono font-bold bg-neutral-900/80 text-white px-1.5 py-0.5 rounded">{i + 1}</span>
                        {i === 0 && (
                          <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[9px] uppercase tracking-wider bg-amber-600 text-white px-1.5 py-0.5 rounded">
                            <Star className="h-2.5 w-2.5" /> Capa
                          </div>
                        )}
                        <div className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition">
                          <div className="flex gap-1">
                            <button type="button" title="Anterior" onClick={() => moveImage(i, i - 1)} disabled={i === 0} className="h-6 w-6 rounded bg-white/90 flex items-center justify-center disabled:opacity-30 hover:bg-white">
                              <ArrowUp className="h-3 w-3 -rotate-90" />
                            </button>
                            <button type="button" title="Próximo" onClick={() => moveImage(i, i + 1)} disabled={i === imgs.length - 1} className="h-6 w-6 rounded bg-white/90 flex items-center justify-center disabled:opacity-30 hover:bg-white">
                              <ArrowDown className="h-3 w-3 -rotate-90" />
                            </button>
                            {i !== 0 && (
                              <button type="button" title="Tornar capa" onClick={() => moveImage(i, 0)} className="h-6 w-6 rounded bg-white/90 flex items-center justify-center hover:bg-amber-100">
                                <Star className="h-3 w-3 text-amber-600" />
                              </button>
                            )}
                          </div>
                          <button type="button" title="Remover" onClick={() => removeImage(i)} className="h-6 w-6 rounded bg-white/90 flex items-center justify-center hover:bg-rose-100">
                            <X className="h-3 w-3 text-rose-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* VENDA */}
        <TabsContent value="venda">
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <Field label="Preço de venda (R$) *" error={form.formState.errors.price_brl?.message as string}>
                <Input type="number" step="0.01" {...form.register("price_brl", { valueAsNumber: true })} />
              </Field>
              <Field label="Preço promocional (R$)">
                <Input type="number" step="0.01" {...form.register("promo_price", { valueAsNumber: true })} />
              </Field>
              <Field label="Custo (R$)">
                <Input type="number" step="0.01" {...form.register("cost_price", { valueAsNumber: true })} />
              </Field>
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Flag label="Produto ativo (visível na loja)" name="is_active" form={form} />
                <Flag label="Produto em destaque" name="is_featured" form={form} />
                <Flag label="Lançamento (aparece em Novidades)" name="is_launch" form={form} />
                <Flag label="Em promoção (aparece em Promoção)" name="is_on_sale" form={form} />
                <Flag label="Mais vendido" name="is_bestseller" form={form} />
                <Flag label="Produto exclusivo" name="is_exclusive" form={form} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VARIAÇÕES */}
        <TabsContent value="variacoes">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <Switch checked={hasVariants} onCheckedChange={(v) => form.setValue("has_variants", v)} />
                  <span className="text-sm">Este produto tem variações (tamanho / cor / modelo)</span>
                </div>
                {hasVariants && (
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={generateGrid}>Gerar grade</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setVariants((vs) => [...vs, { is_active: true, sort_order: vs.length }])}>
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 p-3">
                <strong>Variações são apenas identificação</strong> (SKU, tamanho, cor, código de barras).
                Os saldos por variação são gerenciados no módulo <strong>Estoque</strong>.
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
                        <th className="p-2">Material</th>
                        <th className="p-2">Acabamento</th>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Cód. interno</th>
                        <th className="p-2">Cód. barras</th>
                        <th className="p-2">Preço (R$)</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, i) => (
                        <tr key={i} className="border-t border-stone-100">
                          <td className="p-1"><Input value={v.size ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, size: e.target.value } : x))} className="h-8 w-16" /></td>
                          <td className="p-1"><Input value={v.color ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} className="h-8 w-20" /></td>
                          <td className="p-1"><Input value={v.model ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, model: e.target.value } : x))} className="h-8 w-20" /></td>
                          <td className="p-1"><Input value={v.material ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, material: e.target.value } : x))} className="h-8 w-20" /></td>
                          <td className="p-1"><Input value={v.finish ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, finish: e.target.value } : x))} className="h-8 w-20" /></td>
                          <td className="p-1"><Input value={v.sku ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))} className="h-8 w-24" /></td>
                          <td className="p-1"><Input value={v.internal_code ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, internal_code: e.target.value } : x))} className="h-8 w-24" /></td>
                          <td className="p-1"><Input value={v.barcode ?? ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, barcode: e.target.value } : x))} className="h-8 w-28" /></td>
                          <td className="p-1"><Input type="number" step="0.01" value={v.price_cents ? v.price_cents / 100 : ""} onChange={(e) => setVariants(vs => vs.map((x, j) => j === i ? { ...x, price_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null } : x))} className="h-8 w-20" placeholder="—" /></td>
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

        {/* ESTOQUE */}
        <TabsContent value="estoque">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 p-3 flex gap-2">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Configuração Direta de Estoque:</strong> defina os saldos iniciais ou de ajuste,
                  estoque mínimo e localização física para este produto e suas variações em cada local. Os
                  ajustes de quantidade serão gravados automaticamente no histórico de movimentações.
                </p>
              </div>

              {!hasVariants ? (
                // Produto Simples
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Local de Estoque</th>
                        <th className="p-3">Quantidade</th>
                        <th className="p-3">Estoque Mínimo</th>
                        <th className="p-3">Localização Física (Gôndola / Corredor)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(locations ?? []).map((loc: any) => {
                        const item = getStockItem(loc.id);
                        return (
                          <tr key={loc.id} className="border-t border-stone-100">
                            <td className="p-3 font-medium text-stone-700">{loc.name}</td>
                            <td className="p-3">
                              <Input 
                                type="number" 
                                value={item.qty} 
                                onChange={(e) => updateStockItem(loc.id, Number(e.target.value), item.min_qty, item.location_label || "")} 
                                className="h-9 w-28" 
                                min={0}
                              />
                            </td>
                            <td className="p-3">
                              <Input 
                                type="number" 
                                value={item.min_qty} 
                                onChange={(e) => updateStockItem(loc.id, item.qty, Number(e.target.value), item.location_label || "")} 
                                className="h-9 w-28" 
                                min={0}
                              />
                            </td>
                            <td className="p-3">
                              <Input 
                                value={item.location_label || ""} 
                                onChange={(e) => updateStockItem(loc.id, item.qty, item.min_qty, e.target.value)} 
                                placeholder="Ex: Corredor A / Prateleira 3" 
                                className="h-9 w-full"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Produto com Variações
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider">
                        <tr>
                          <th className="p-3">Variação</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Estoque Total (Físico)</th>
                          <th className="p-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, i) => {
                          const totalStock = getVariantTotalStock(v);
                          return (
                            <tr key={i} className="border-t border-stone-100">
                              <td className="p-3">
                                <span className="font-semibold text-stone-900">
                                  {v.size ? `Tamanho: ${v.size}` : "Único"}
                                </span>
                                {v.color && (
                                  <span className="text-stone-500 text-xs ml-2">
                                    ({v.color})
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-xs text-stone-600 font-mono">{v.sku || "—"}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${totalStock === 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                                  {totalStock} un
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setActiveStockVariant(v)}
                                  className="flex items-center gap-1.5 ml-auto"
                                >
                                  <Warehouse className="h-3.5 w-3.5" />
                                  Gerenciar Estoque
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Modal de Gerenciamento de Estoque por Variação */}
                  <Dialog open={!!activeStockVariant} onOpenChange={(open) => !open && setActiveStockVariant(null)}>
                    <DialogContent className="max-w-2xl bg-white">
                      <DialogHeader>
                        <DialogTitle className="font-serif text-lg">
                          Gerenciar Estoque da Variação: {activeStockVariant ? `${activeStockVariant.size ?? 'Único'} ${activeStockVariant.color ? `· ${activeStockVariant.color}` : ''}` : ''}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <table className="w-full text-sm">
                          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider">
                            <tr>
                              <th className="p-2">Local</th>
                              <th className="p-2">Quantidade</th>
                              <th className="p-2">Mínimo</th>
                              <th className="p-2">Localização Física</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(locations ?? []).map((loc: any) => {
                              if (!activeStockVariant) return null;
                              const item = getStockItem(loc.id, activeStockVariant);
                              return (
                                <tr key={loc.id} className="border-t border-stone-100">
                                  <td className="p-2 font-medium text-stone-700 text-xs">{loc.name}</td>
                                  <td className="p-2">
                                    <Input 
                                      type="number" 
                                      value={item.qty} 
                                      onChange={(e) => updateStockItem(loc.id, Number(e.target.value), item.min_qty, item.location_label || "", activeStockVariant)} 
                                      className="h-8 w-20" 
                                      min={0}
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input 
                                      type="number" 
                                      value={item.min_qty} 
                                      onChange={(e) => updateStockItem(loc.id, item.qty, Number(e.target.value), item.location_label || "", activeStockVariant)} 
                                      className="h-8 w-20" 
                                      min={0}
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input 
                                      value={item.location_label || ""} 
                                      onChange={(e) => updateStockItem(loc.id, item.qty, item.min_qty, e.target.value, activeStockVariant)} 
                                      placeholder="Ex: Prateleira 4" 
                                      className="h-8 w-full"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <div className="flex justify-end pt-2">
                          <Button type="button" onClick={() => setActiveStockVariant(null)} className="bg-amber-600 hover:bg-amber-700">
                            Confirmar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Field label="Meta title"><Input {...form.register("seo_title")} maxLength={200} /></Field>
              <Field label="Meta description"><Textarea rows={3} {...form.register("seo_description")} maxLength={500} /></Field>
              <Field label="Keywords"><Input {...form.register("seo_keywords")} /></Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
    {/* Save confirmation dialog */}
    <Dialog open={savedOpen} onOpenChange={setSavedOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvo</DialogTitle>
        </DialogHeader>
        <p>Produto salvo com sucesso.</p>
        <Button onClick={() => setSavedOpen(false)}>Fechar</Button>
      </DialogContent>
    </Dialog>
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
