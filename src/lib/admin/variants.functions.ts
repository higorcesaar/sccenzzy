import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

// Variações: apenas identificação. Estoque é gerenciado no módulo Estoque.
const variantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().max(60).optional().nullable(),
  internal_code: z.string().max(60).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
  color: z.string().max(40).optional().nullable(),
  color_hex: z.string().max(20).optional().nullable(),
  model: z.string().max(40).optional().nullable(),
  material: z.string().max(80).optional().nullable(),
  finish: z.string().max(80).optional().nullable(),
  barcode: z.string().max(60).optional().nullable(),
  price_cents: z.number().int().min(0).optional().nullable(),
  promo_price: z.number().min(0).optional().nullable(),
  weight_g: z.number().int().min(0).optional().nullable(),
  image_url: z.string().max(500).optional().nullable(),
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
    const { supabase } = context as any;

    const { data: existing } = await supabase
      .from("scz_product_variants")
      .select("id")
      .eq("product_id", data.product_id);

    const existingIds = new Set<string>((existing ?? []).map((v: any) => v.id as string));
    const sentIds = new Set<string>(data.variants.filter((v) => v.id).map((v) => v.id as string));

    const toDelete = [...existingIds].filter((id) => !sentIds.has(id));
    if (toDelete.length > 0) {
      await supabase.from("scz_product_variants").delete().in("id", toDelete);
    }

    for (const v of data.variants) {
      const payload: any = { ...v, product_id: data.product_id };
      if (v.id) {
        await supabase.from("scz_product_variants").update(payload).eq("id", v.id);
      } else {
        const { error } = await supabase.from("scz_product_variants").insert(payload);
        if (error) throw new Error(error.message);
      }
    }

    await supabase
      .from("scz_products")
      .update({ has_variants: data.variants.length > 0 })
      .eq("id", data.product_id);

    return { ok: true, count: data.variants.length };
  });
