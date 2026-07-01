import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

// ============================================================
// LOCAIS
// ============================================================
const locationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  type: z.enum(["deposito", "loja", "showroom", "cd", "outros"]).default("deposito"),
  address: z.string().max(300).optional().nullable(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

export const listLocations = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase.from("scz_stock_locations").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertLocation = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => locationSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const payload: any = { ...data, slug: data.slug || slugify(data.name) };
    if (data.id) {
      const { error } = await supabase.from("scz_stock_locations").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("scz_stock_locations").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteLocation = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("scz_stock_locations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// FORNECEDORES
// ============================================================
const supplierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  document: z.string().max(30).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal("")),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(400).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  is_active: z.boolean().default(true),
});

export const listSuppliers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase.from("scz_suppliers").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertSupplier = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => supplierSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const payload: any = { ...data };
    if (payload.email === "") payload.email = null;
    if (data.id) {
      const { error } = await supabase.from("scz_suppliers").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("scz_suppliers").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteSupplier = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("scz_suppliers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// LISTAGEM DE ESTOQUE (tabela profissional)
// ============================================================
export const listStock = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (i: {
      search?: string;
      categoryId?: string;
      brandId?: string;
      locationId?: string;
      status?: "all" | "in" | "low" | "out";
      page?: number;
      pageSize?: number;
    } | undefined) => i ?? {},
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.min(200, data.pageSize ?? 50);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from("scz_stock")
      .select(
        `id, qty, min_qty, location_label, last_movement_at,
         product:scz_products!inner(id,name,sku,brand,brand_id,is_active,category_id,category:scz_categories(name)),
         variant:scz_product_variants(id,size,color,sku,barcode),
         location:scz_stock_locations!inner(id,name,slug)`,
        { count: "exact" },
      )
      .order("last_movement_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (data.locationId) q = q.eq("location_id", data.locationId);

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);

    // Filtros pós-query (busca, categoria, marca, status)
    let filtered = (rows ?? []) as any[];
    if (data.search) {
      const s = data.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.product?.name?.toLowerCase().includes(s) ||
          r.product?.sku?.toLowerCase().includes(s) ||
          r.variant?.sku?.toLowerCase().includes(s) ||
          r.variant?.barcode?.toLowerCase().includes(s),
      );
    }
    if (data.categoryId) filtered = filtered.filter((r) => r.product?.category_id === data.categoryId);
    if (data.brandId) filtered = filtered.filter((r) => r.product?.brand_id === data.brandId);
    if (data.status && data.status !== "all") {
      filtered = filtered.filter((r) => {
        if (data.status === "out") return r.qty === 0;
        if (data.status === "low") return r.min_qty > 0 && r.qty > 0 && r.qty <= r.min_qty;
        if (data.status === "in") return r.qty > (r.min_qty ?? 0);
        return true;
      });
    }

    return { rows: filtered, total: count ?? 0, page, pageSize };
  });

// ============================================================
// DASHBOARD
// ============================================================
export const getStockDashboard = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const [productsAll, stockAll, movRecent, topSold] = await Promise.all([
      supabase.from("scz_products").select("id,price_cents,cost_price,is_active", { count: "exact" }),
      supabase.from("scz_stock").select("qty,min_qty,product_id"),
      supabase
        .from("scz_stock_movements")
        .select("id,product_id,movement_type,quantity,created_at,scz_products(name)")
        .order("created_at", { ascending: false })
        .limit(15),
      supabase
        .from("scz_stock_movements")
        .select("product_id,quantity,scz_products(name)")
        .eq("movement_type", "venda")
        .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString())
        .limit(500),
    ]);

    const stock = (stockAll.data ?? []) as any[];
    const totalQty = stock.reduce((s, r) => s + (r.qty ?? 0), 0);
    const outCount = new Set(stock.filter((r) => r.qty === 0).map((r) => r.product_id)).size;
    const lowCount = new Set(stock.filter((r) => r.min_qty > 0 && r.qty > 0 && r.qty <= r.min_qty).map((r) => r.product_id)).size;

    // Valor total (custo médio × qty; se sem custo, usa preço)
    const productsById = new Map((productsAll.data ?? []).map((p: any) => [p.id, p]));
    const totalValueCents = stock.reduce((s, r) => {
      const p: any = productsById.get(r.product_id);
      const unit = p?.cost_price ? Number(p.cost_price) * 100 : p?.price_cents ?? 0;
      return s + unit * (r.qty ?? 0);
    }, 0);

    // Top vendidos últimos 30 dias
    const soldMap = new Map<string, { name: string; qty: number }>();
    for (const m of (topSold.data ?? []) as any[]) {
      const cur = soldMap.get(m.product_id) ?? { name: m.scz_products?.name ?? "—", qty: 0 };
      cur.qty += m.quantity;
      soldMap.set(m.product_id, cur);
    }
    const topProducts = [...soldMap.entries()]
      .map(([id, v]) => ({ id, name: v.name, qty: v.qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Série 30d entradas × saídas
    const inOut: Record<string, { entrada: number; saida: number }> = {};
    for (let d = 29; d >= 0; d--) {
      const key = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
      inOut[key] = { entrada: 0, saida: 0 };
    }
    const { data: allMov } = await supabase
      .from("scz_stock_movements")
      .select("movement_type,quantity,created_at")
      .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
    for (const m of (allMov ?? []) as any[]) {
      const k = m.created_at.slice(0, 10);
      if (!inOut[k]) continue;
      if (["entrada", "devolucao"].includes(m.movement_type)) inOut[k].entrada += m.quantity;
      if (["saida", "venda"].includes(m.movement_type)) inOut[k].saida += m.quantity;
    }
    const chart = Object.entries(inOut).map(([date, v]) => ({ date: date.slice(5), ...v }));

    return {
      totalProducts: productsAll.count ?? 0,
      totalQty,
      totalValueCents,
      outCount,
      lowCount,
      topProducts,
      recentMovements: movRecent.data ?? [],
      chart,
    };
  });

// ============================================================
// MOVIMENTAÇÕES: ENTRADA / SAÍDA / AJUSTE / TRANSFERÊNCIA
// ============================================================
const entryItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().min(1),
  unit_cost_cents: z.number().int().min(0).optional().nullable(),
});

const createEntrySchema = z.object({
  supplier_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid(),
  invoice_number: z.string().max(60).optional().nullable(),
  invoice_date: z.string().optional().nullable(), // ISO date
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(entryItemSchema).min(1).max(200),
});

export const createStockEntry = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => createEntrySchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const total = data.items.reduce((s, it) => s + (it.unit_cost_cents ?? 0) * it.quantity, 0);
    const { data: entry, error } = await supabase
      .from("scz_stock_entries")
      .insert({
        supplier_id: data.supplier_id ?? null,
        location_id: data.location_id,
        invoice_number: data.invoice_number ?? null,
        invoice_date: data.invoice_date ?? null,
        notes: data.notes ?? null,
        total_cost_cents: total,
        user_id: userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    for (const it of data.items) {
      const { error: mErr } = await supabase.from("scz_stock_movements").insert({
        product_id: it.product_id,
        variant_id: it.variant_id ?? null,
        movement_type: "entrada",
        quantity: it.quantity,
        unit_cost_cents: it.unit_cost_cents ?? null,
        location_id: data.location_id,
        entry_id: entry.id,
        user_id: userId,
        reason: `Entrada — NF ${data.invoice_number ?? "-"}`,
      });
      if (mErr) throw new Error(mErr.message);
    }
    return entry;
  });

const exitSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  reason: z.enum(["venda", "troca", "perda", "danificado", "brinde", "uso_interno", "garantia", "outros"]),
  notes: z.string().max(1000).optional().nullable(),
});

export const createStockExit = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => exitSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { error } = await supabase.from("scz_stock_movements").insert({
      product_id: data.product_id,
      variant_id: data.variant_id ?? null,
      location_id: data.location_id,
      movement_type: data.reason === "venda" ? "venda" : "saida",
      quantity: data.quantity,
      reason: `${data.reason}${data.notes ? " — " + data.notes : ""}`,
      user_id: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const adjustSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid(),
  system_qty: z.number().int().min(0),
  counted_qty: z.number().int().min(0),
  notes: z.string().max(1000).optional().nullable(),
});

export const createStockAdjustment = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => adjustSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const delta = data.counted_qty - data.system_qty;
    if (delta === 0) return { ok: true, skipped: true };
    const { error } = await supabase.from("scz_stock_movements").insert({
      product_id: data.product_id,
      variant_id: data.variant_id ?? null,
      location_id: data.location_id,
      movement_type: "ajuste",
      quantity: delta, // pode ser negativo (trigger aceita)
      reason: `Ajuste de inventário: sistema ${data.system_qty} → contado ${data.counted_qty}${data.notes ? " — " + data.notes : ""}`,
      user_id: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true, delta };
  });

const transferSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().optional().nullable(),
  location_id: z.string().uuid(), // origem
  location_to_id: z.string().uuid(), // destino
  quantity: z.number().int().min(1),
  notes: z.string().max(1000).optional().nullable(),
});

export const createStockTransfer = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => transferSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    if (data.location_id === data.location_to_id) throw new Error("Origem e destino devem ser diferentes");
    const { error } = await supabase.from("scz_stock_movements").insert({
      product_id: data.product_id,
      variant_id: data.variant_id ?? null,
      location_id: data.location_id,
      location_to_id: data.location_to_id,
      movement_type: "transferencia",
      quantity: data.quantity,
      reason: `Transferência entre locais${data.notes ? " — " + data.notes : ""}`,
      user_id: userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// HISTÓRICO
// ============================================================
export const listMovements = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (i: { productId?: string; type?: string; page?: number; pageSize?: number } | undefined) => i ?? {},
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.min(200, data.pageSize ?? 50);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from("scz_stock_movements")
      .select(
        `id, movement_type, quantity, reason, qty_before, qty_after, created_at,
         product:scz_products(name,sku),
         variant:scz_product_variants(size,color,sku),
         location:scz_stock_locations!scz_stock_movements_location_id_fkey(name),
         location_to:scz_stock_locations!scz_stock_movements_location_to_id_fkey(name)`,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.productId) q = q.eq("product_id", data.productId);
    if (data.type && data.type !== "all") q = q.eq("movement_type", data.type);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

// ============================================================
// UTIL: seletores
// ============================================================
export const listProductsForSelect = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase
      .from("scz_products")
      .select("id,name,sku,has_variants,stock_qty,scz_product_variants(id,size,color,sku,stock_qty)")
      .eq("is_active", true)
      .order("name")
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ============================================================
// MARCAS
// ============================================================
const brandSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  logo_url: z.string().max(500).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const listBrands = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase.from("scz_brands").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertBrand = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => brandSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const payload: any = { ...data, slug: data.slug || slugify(data.name) };
    if (data.id) {
      const { error } = await supabase.from("scz_brands").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("scz_brands").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteBrand = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("scz_brands").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
