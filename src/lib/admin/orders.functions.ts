import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  processing: "Em separação",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (input: { search?: string; status?: OrderStatus | "all"; page?: number; pageSize?: number } | undefined) =>
      input ?? {},
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.min(100, data.pageSize ?? 20);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from("scz_orders")
      .select("id,user_id,status,payment_status,payment_method,total_cents,shipping_address,created_at,updated_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.search) {
      // Match on short id prefix (uuid starts with) — simple search
      q = q.ilike("id", `${data.search}%`);
    }

    const { data: rows, count, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0, page, pageSize };
  });

export const getOrder = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: order, error } = await supabase
      .from("scz_orders")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Pedido não encontrado");

    const { data: items } = await supabase
      .from("scz_order_items")
      .select("*")
      .eq("order_id", data.id);

    let customer: any = null;
    if (order.user_id) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id,email,display_name,created_at")
        .eq("id", order.user_id)
        .maybeSingle();
      customer = prof;
    }

    return { order, items: items ?? [], customer };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(ORDER_STATUSES),
        notes: z.string().max(2000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const patch: any = { status: data.status };
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.status === "paid") patch.payment_status = "paid";
    if (data.status === "refunded") patch.payment_status = "refunded";
    if (data.status === "cancelled") patch.payment_status = "cancelled";

    const { data: row, error } = await supabase
      .from("scz_orders")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getOrderStatusCounts = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const out: Record<string, number> = { all: 0 };
    const results = await Promise.all(
      ORDER_STATUSES.map((s) =>
        supabase.from("scz_orders").select("*", { count: "exact", head: true }).eq("status", s),
      ),
    );
    ORDER_STATUSES.forEach((s, i) => {
      out[s] = results[i].count ?? 0;
      out.all += results[i].count ?? 0;
    });
    return out;
  });
