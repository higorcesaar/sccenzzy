import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

const movementSchema = z.object({
  product_id: z.string().uuid(),
  movement_type: z.enum(["entrada", "saida", "ajuste", "devolucao"]),
  quantity: z.number().int().min(1).max(100000),
  reason: z.string().max(300).optional().nullable(),
  reference: z.string().max(120).optional().nullable(),
});

export const createStockMovement = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => movementSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: row, error } = await supabase
      .from("scz_stock_movements")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listStockMovements = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { page?: number; pageSize?: number; productId?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.min(100, data.pageSize ?? 30);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let q = supabase
      .from("scz_stock_movements")
      .select("id,product_id,movement_type,quantity,reason,reference,created_at,scz_products(name,sku)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.productId) q = q.eq("product_id", data.productId);
    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const listStockAlerts = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data: rows, error } = await supabase
      .from("scz_products")
      .select("id,name,sku,stock_qty,stock_min")
      .or("stock_qty.eq.0,and(stock_min.gt.0,stock_qty.lte.stock_min)")
      .order("stock_qty");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
