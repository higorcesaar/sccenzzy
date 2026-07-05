import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

// ============================================================
// CONFIG DE ATRIBUTOS POR CATEGORIA
// ============================================================
const attrSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid(),
  uses_numeration: z.boolean().default(false),
  uses_color: z.boolean().default(true),
  uses_size: z.boolean().default(false),
  uses_material: z.boolean().default(false),
  uses_model: z.boolean().default(false),
  uses_collection: z.boolean().default(false),
  numeration_options: z.array(z.string().max(20)).default([]),
  size_options: z.array(z.string().max(20)).default(["Único"]),
  color_options: z.array(z.string().max(60)).default([]),
  material_options: z.array(z.string().max(80)).default([]),
});

export const listCategoryAttributes = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase.from("scz_category_attributes").select("*");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCategoryAttributes = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { category_id: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: row, error } = await supabase
      .from("scz_category_attributes")
      .select("*")
      .eq("category_id", data.category_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (
      row ?? {
        category_id: data.category_id,
        uses_numeration: false,
        uses_color: true,
        uses_size: false,
        uses_material: false,
        uses_model: false,
        uses_collection: false,
        numeration_options: [],
        size_options: ["Único"],
        color_options: [],
        material_options: [],
      }
    );
  });

export const upsertCategoryAttributes = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => attrSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const payload: any = { ...data };
    delete payload.id;
    const { error } = await supabase
      .from("scz_category_attributes")
      .upsert(payload, { onConflict: "category_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// GERADOR AUTOMÁTICO DE VARIAÇÕES (produto cartesiano)
// ============================================================
const genSchema = z.object({
  product_id: z.string().uuid(),
  sku_prefix: z.string().max(20).optional().nullable(),
  colors: z.array(z.string().max(60)).default([]),
  color_hexes: z.record(z.string(), z.string()).optional().default({}),
  numerations: z.array(z.string().max(20)).default([]),
  sizes: z.array(z.string().max(20)).default([]),
  materials: z.array(z.string().max(80)).default([]),
  price_cents: z.number().int().min(0).optional().nullable(),
  cost_cents: z.number().int().min(0).optional().nullable(),
  stock_min: z.number().int().min(0).default(0),
  auto_barcode: z.boolean().default(false),
  replace_existing: z.boolean().default(false),
});

function slugPart(s: string) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8);
}

function ean13(digits12: string) {
  const n = digits12.padStart(12, "0").slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(n[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return n + String(check);
}

export const generateVariantsAuto = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => genSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;

    const { data: product, error: pErr } = await supabase
      .from("scz_products")
      .select("id, name, sku, internal_code, price_cents")
      .eq("id", data.product_id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product) throw new Error("Produto não encontrado");

    // Substitui variações existentes se solicitado
    if (data.replace_existing) {
      await supabase.from("scz_product_variants").delete().eq("product_id", data.product_id);
    }

    // Constrói axes (numeração e tamanho são mutuamente exclusivos — se ambos, prioriza numeração)
    const colors = data.colors.length ? data.colors : [null];
    const dims = data.numerations.length ? data.numerations : data.sizes.length ? data.sizes : [null];
    const materials = data.materials.length ? data.materials : [null];
    const useNumeration = data.numerations.length > 0;

    const prefix = (data.sku_prefix || product.internal_code || product.sku || slugPart(product.name || "SKU")).toString().toUpperCase();

    const rows: any[] = [];
    let seq = Date.now() % 1000000;
    for (const color of colors) {
      for (const dim of dims) {
        for (const mat of materials) {
          const parts = [prefix, color ? slugPart(color) : "", dim ? slugPart(dim) : "", mat ? slugPart(mat) : ""].filter(Boolean);
          const sku = parts.join("-");
          const barcode = data.auto_barcode ? ean13(String(seq++).padStart(12, "0")) : null;
          rows.push({
            product_id: data.product_id,
            sku,
            barcode,
            color: color || null,
            color_hex: color && data.color_hexes?.[color] ? data.color_hexes[color] : null,
            size: useNumeration ? null : dim || null,
            numeration: useNumeration ? dim || null : null,
            material: mat || null,
            price_cents: data.price_cents ?? product.price_cents ?? null,
            cost_cents: data.cost_cents ?? null,
            stock_qty: 0,
            stock_min: data.stock_min,
            reserved_qty: 0,
            is_active: true,
            sort_order: rows.length,
          });
        }
      }
    }

    if (rows.length === 0) throw new Error("Nenhuma combinação gerada — informe ao menos um atributo.");

    // Insere ignorando duplicatas de SKU
    const { error: insErr } = await supabase
      .from("scz_product_variants")
      .upsert(rows, { onConflict: "product_id,sku", ignoreDuplicates: true });
    if (insErr && !/duplicate|conflict|no unique/i.test(insErr.message)) {
      // fallback: insere um a um ignorando conflitos
      for (const r of rows) {
        await supabase.from("scz_product_variants").insert(r).select().maybeSingle();
      }
    }

    await supabase.from("scz_products").update({ has_variants: true }).eq("id", data.product_id);

    return { ok: true, generated: rows.length };
  });
