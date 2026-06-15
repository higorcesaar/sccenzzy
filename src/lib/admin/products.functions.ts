import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Nome é obrigatório").max(200),
  slug: z.string().max(200).regex(/^[a-z0-9-]*$/, "slug inválido").optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  subcategory_id: z.string().uuid().optional().nullable(),
  collection_id: z.string().uuid().optional().nullable(),
  sku: z.string().max(60).optional().nullable(),
  internal_code: z.string().max(60).optional().nullable(),
  brand: z.string().max(80).optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  price_cents: z.number().int().min(0),
  cost_price: z.number().min(0).optional().nullable(),
  promo_price: z.number().min(0).optional().nullable(),
  weight_g: z.number().int().min(0).optional().nullable(),
  width_cm: z.number().min(0).optional().nullable(),
  height_cm: z.number().min(0).optional().nullable(),
  depth_cm: z.number().min(0).optional().nullable(),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
  seo_keywords: z.string().max(500).optional().nullable(),
  og_image: z.string().url().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_launch: z.boolean().default(false),
  is_on_sale: z.boolean().default(false),
  is_bestseller: z.boolean().default(false),
  has_variants: z.boolean().default(false),
  stock_qty: z.number().int().min(0).default(0),
  stock_min: z.number().int().min(0).default(0),
  sort_order: z.number().int().min(0).default(0),
  tags: z.array(z.string().max(40)).max(20).optional().nullable(),
  images: z.array(z.string().url()).max(20).optional().nullable(),
});

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export const listProducts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { search?: string; page?: number; pageSize?: number; status?: "all" | "active" | "inactive"; categoryId?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.min(100, data.pageSize ?? 20);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from("scz_products")
      .select(
        "id,name,slug,sku,brand,price_cents,promo_price,stock_qty,stock_min,is_active,is_featured,is_on_sale,has_variants,sort_order,updated_at,category_id,collection_id",
        { count: "exact" },
      )
      .order("sort_order")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (data.search) q = q.or(`name.ilike.%${data.search}%,sku.ilike.%${data.search}%,slug.ilike.%${data.search}%`);
    if (data.status === "active") q = q.eq("is_active", true);
    if (data.status === "inactive") q = q.eq("is_active", false);
    if (data.categoryId) q = q.eq("category_id", data.categoryId);

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const getProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: row, error } = await supabase.from("scz_products").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Produto não encontrado");
    return row;
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const payload: any = { ...data };
    const images = payload.images;
    delete payload.images;

    if (!payload.slug || payload.slug.trim() === "") {
      const base = slugify(payload.name) || `produto-${Date.now()}`;
      let candidate = base;
      let n = 1;
      while (true) {
        const { data: clash } = await supabase
          .from("scz_products")
          .select("id")
          .eq("slug", candidate)
          .maybeSingle();
        if (!clash || (data.id && clash.id === data.id)) break;
        n += 1;
        candidate = `${base}-${n}`;
        if (n > 50) break;
      }
      payload.slug = candidate;
    }

    const requestedStock = Number(payload.stock_qty ?? 0);
    let row: any;
    let stockDelta = 0;
    let movementType: "entrada" | "ajuste" | null = null;

    if (data.id) {
      const { data: prev } = await supabase
        .from("scz_products")
        .select("stock_qty,has_variants")
        .eq("id", data.id)
        .maybeSingle();
      const prevStock = Number(prev?.stock_qty ?? 0);
      // If product has variants, stock_qty is derived — don't touch via product form
      if (prev?.has_variants) {
        delete payload.stock_qty;
      } else {
        stockDelta = requestedStock - prevStock;
        delete payload.stock_qty;
        if (stockDelta !== 0) movementType = "ajuste";
      }
      const { data: updated, error } = await supabase
        .from("scz_products")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      row = updated;
    } else {
      payload.stock_qty = 0;
      const { data: inserted, error } = await supabase.from("scz_products").insert(payload).select().single();
      if (error) throw new Error(error.message);
      row = inserted;
      if (requestedStock > 0 && !payload.has_variants) {
        stockDelta = requestedStock;
        movementType = "entrada";
      }
    }

    if (movementType && stockDelta !== 0) {
      const signedQty = movementType === "ajuste" ? stockDelta : Math.abs(stockDelta);
      const reason =
        movementType === "entrada"
          ? "Estoque inicial cadastrado no produto"
          : stockDelta > 0
          ? "Ajuste positivo via cadastro de produto"
          : "Ajuste negativo via cadastro de produto";
      const { error: mErr } = await supabase.from("scz_stock_movements").insert({
        product_id: row.id,
        movement_type: movementType,
        quantity: signedQty,
        reason,
        user_id: userId,
      });
      if (mErr) console.warn("Stock movement insert failed:", mErr.message);
      const { data: fresh } = await supabase.from("scz_products").select("*").eq("id", row.id).maybeSingle();
      if (fresh) row = fresh;
    }

    if (Array.isArray(images)) {
      await supabase.from("scz_product_images").delete().eq("product_id", row.id);
      if (images.length > 0) {
        await supabase.from("scz_product_images").insert(
          images.map((url: string, i: number) => ({ product_id: row.id, url, sort_order: i, r2_key: url })),
        );
      }
    }
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("scz_products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleProductActive = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string; is_active: boolean }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("scz_products").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: src, error: e1 } = await supabase.from("scz_products").select("*").eq("id", data.id).maybeSingle();
    if (e1 || !src) throw new Error("Produto fonte não encontrado");

    const { id, created_at, updated_at, slug, name, ...rest } = src;
    const newName = `${name} (cópia)`;
    let candidate = `${slugify(newName)}-${Date.now().toString(36)}`;
    const payload: any = { ...rest, name: newName, slug: candidate, is_active: false, stock_qty: 0, stock_sold: 0, stock_reserved: 0 };

    const { data: created, error: e2 } = await supabase.from("scz_products").insert(payload).select().single();
    if (e2) throw new Error(e2.message);

    // Duplicate images
    const { data: imgs } = await supabase.from("scz_product_images").select("url,sort_order,alt").eq("product_id", id);
    if (imgs && imgs.length > 0) {
      await supabase.from("scz_product_images").insert(
        imgs.map((i: any) => ({ product_id: created.id, url: i.url, r2_key: i.url, sort_order: i.sort_order, alt: i.alt })),
      );
    }
    // Duplicate variants
    const { data: vars } = await supabase.from("scz_product_variants").select("sku,size,color,color_hex,model,barcode,price_cents,promo_price,stock_min,is_active,sort_order").eq("product_id", id);
    if (vars && vars.length > 0) {
      await supabase.from("scz_product_variants").insert(vars.map((v: any) => ({ ...v, product_id: created.id, stock_qty: 0 })));
    }
    return created;
  });

export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase
      .from("scz_categories")
      .select("id,name,slug,parent_id,sort_order")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listCollectionsForSelect = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase.from("scz_collections").select("id,name,slug").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProductImages = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { productId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: rows, error } = await supabase
      .from("scz_product_images")
      .select("id,url,sort_order")
      .eq("product_id", data.productId)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
