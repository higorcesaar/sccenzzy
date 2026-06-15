import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().max(60).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  color_hex: z.string().max(20).optional().nullable(),
  model: z.string().max(40).optional().nullable(),
  barcode: z.string().max(60).optional().nullable(),
  price_cents: z.number().int().min(0).optional().nullable(),
  promo_price: z.number().min(0).optional().nullable(),
  stock_qty: z.number().int().min(0).default(0),
  stock_min: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

const syncSchema = z.object({
  product_id: z.string().uuid(),
  variants: z.array(variantSchema).max(200),
});

export const listVariants = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { product_id: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: rows, error } = await supabase
      .from("scz_product_variants")
      .select("*")
      .eq("product_id", data.product_id)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const syncProductVariants = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => syncSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;

    const { data: existing } = await supabase
      .from("scz_product_variants")
      .select("id,stock_qty")
      .eq("product_id", data.product_id);

    const existingIds = new Set((existing ?? []).map((v: any) => v.id));
    const sentIds = new Set(data.variants.filter((v) => v.id).map((v) => v.id as string));

    // Delete removed variants
    const toDelete = [...existingIds].filter((id) => !sentIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("scz_product_variants").delete().in("id", toDelete);
    }

    const stockByExisting = Object.fromEntries((existing ?? []).map((v: any) => [v.id, v.stock_qty]));

    // Upsert each
    for (const v of data.variants) {
      const payload: any = { ...v, product_id: data.product_id };
      // strip stock_qty from update — trigger applies movements
      if (v.id) {
        const requested = Number(v.stock_qty ?? 0);
        const prev = Number(stockByExisting[v.id] ?? 0);
        const delta = requested - prev;
        const { stock_qty, ...rest } = payload;
        await supabase.from("scz_product_variants").update(rest).eq("id", v.id);
        if (delta !== 0) {
          await supabase.from("scz_stock_movements").insert({
            product_id: data.product_id,
            variant_id: v.id,
            movement_type: "ajuste",
            quantity: delta,
            reason: "Ajuste via cadastro de variação",
            user_id: userId,
          });
        }
      } else {
        const requested = Number(v.stock_qty ?? 0);
        payload.stock_qty = 0;
        const { data: created, error } = await supabase
          .from("scz_product_variants")
          .insert(payload)
          .select()
          .single();
        if (error) throw new Error(error.message);
        if (requested > 0) {
          await supabase.from("scz_stock_movements").insert({
            product_id: data.product_id,
            variant_id: created.id,
            movement_type: "entrada",
            quantity: requested,
            reason: "Estoque inicial da variação",
            user_id: userId,
          });
        }
      }
    }

    // Mark product as having variants
    await supabase
      .from("scz_products")
      .update({ has_variants: data.variants.length > 0 })
      .eq("id", data.product_id);

    return { ok: true, count: data.variants.length };
  });
