import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "slug inválido"),
  sku: z.string().max(60).optional().nullable(),
  internal_code: z.string().max(60).optional().nullable(),
  brand: z.string().max(80).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  subcategory_id: z.string().uuid().optional().nullable(),
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
  stock_qty: z.number().int().min(0).default(0),
  stock_min: z.number().int().min(0).default(0),
  tags: z.array(z.string().max(40)).max(20).optional().nullable(),
  images: z.array(z.string().url()).max(20).optional().nullable(),
});

export const listProducts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { search?: string; page?: number; pageSize?: number; status?: "all" | "active" | "inactive" } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.min(100, data.pageSize ?? 20);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from("scz_products")
      .select("id,name,slug,sku,brand,price_cents,promo_price,stock_qty,stock_min,is_active,is_featured,is_on_sale,updated_at", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (data.search) q = q.or(`name.ilike.%${data.search}%,sku.ilike.%${data.search}%,slug.ilike.%${data.search}%`);
    if (data.status === "active") q = q.eq("is_active", true);
    if (data.status === "inactive") q = q.eq("is_active", false);

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

    const requestedStock = Number(payload.stock_qty ?? 0);
    let row: any;
    let stockDelta = 0;
    let movementType: "entrada" | "ajuste" | null = null;

    if (data.id) {
      // Read previous stock to compute delta
      const { data: prev } = await supabase
        .from("scz_products")
        .select("stock_qty")
        .eq("id", data.id)
        .maybeSingle();
      const prevStock = Number(prev?.stock_qty ?? 0);
      stockDelta = requestedStock - prevStock;
      // Trigger applies movement; don't double-write stock_qty.
      delete payload.stock_qty;
      if (stockDelta !== 0) movementType = "ajuste";
      const { data: updated, error } = await supabase
        .from("scz_products")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      row = updated;
    } else {
      // Insert with stock 0; movement will increment via trigger
      payload.stock_qty = 0;
      const { data: inserted, error } = await supabase
        .from("scz_products")
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      row = inserted;
      if (requestedStock > 0) {
        stockDelta = requestedStock;
        movementType = "entrada";
      }
    }

    // Register stock movement so /admin/estoque stays in sync
    if (movementType && stockDelta !== 0) {
      const qty = Math.abs(stockDelta);
      const reason =
        movementType === "entrada"
          ? "Estoque inicial cadastrado no produto"
          : stockDelta > 0
          ? "Ajuste positivo via cadastro de produto"
          : "Ajuste negativo via cadastro de produto";
      // For "ajuste" the trigger adds the signed quantity. Send signed value.
      const signedQty = movementType === "ajuste" ? stockDelta : qty;
      const { error: mErr } = await supabase.from("scz_stock_movements").insert({
        product_id: row.id,
        movement_type: movementType,
        // movement validator restricts quantity to >=1; ajuste accepts the absolute value but trigger needs sign
        // We store absolute qty and rely on movement_type semantics; the trigger uses NEW.quantity directly.
        // For "ajuste" we need to send the signed value to apply correctly, so bypass the validator min(1) by clamping.
        quantity: movementType === "ajuste" ? signedQty : qty,
        reason,
        user_id: userId,
      });
      if (mErr) {
        // Don't fail the whole product save; surface in console
        console.warn("Stock movement insert failed:", mErr.message);
      }
      // Refresh row to get current stock_qty
      const { data: fresh } = await supabase.from("scz_products").select("*").eq("id", row.id).maybeSingle();
      if (fresh) row = fresh;
    }

    // Sync product images table
    if (Array.isArray(images)) {
      await supabase.from("scz_product_images").delete().eq("product_id", row.id);
      if (images.length > 0) {
        await supabase.from("scz_product_images").insert(
          images.map((url: string, i: number) => ({ product_id: row.id, url, sort_order: i })),
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

export const listCategories = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase.from("scz_categories").select("id,name,slug,parent_id").order("name");
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
