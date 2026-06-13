import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

export const listCustomers = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { search?: string; page?: number; pageSize?: number } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const page = Math.max(1, data.page ?? 1);
    const pageSize = Math.min(100, data.pageSize ?? 20);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from("profiles")
      .select("id,email,display_name,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.search) {
      q = q.or(`email.ilike.%${data.search}%,display_name.ilike.%${data.search}%`);
    }

    const { data: profiles, count, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p: any) => p.id);
    let aggregates = new Map<string, { orders: number; ltv: number; last: string | null }>();
    if (ids.length > 0) {
      const { data: orders } = await supabase
        .from("scz_orders")
        .select("user_id,total_cents,created_at,status")
        .in("user_id", ids);
      for (const o of orders ?? []) {
        const cur = aggregates.get(o.user_id) ?? { orders: 0, ltv: 0, last: null };
        cur.orders += 1;
        if (o.status !== "cancelled" && o.status !== "refunded") {
          cur.ltv += Number(o.total_cents) || 0;
        }
        if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
        aggregates.set(o.user_id, cur);
      }
    }

    const rows = (profiles ?? []).map((p: any) => {
      const a = aggregates.get(p.id) ?? { orders: 0, ltv: 0, last: null };
      return { ...p, orders_count: a.orders, ltv_cents: a.ltv, last_order_at: a.last };
    });

    return { rows, total: count ?? 0, page, pageSize };
  });

export const getCustomer = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id,email,display_name,created_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) throw new Error("Cliente não encontrado");

    const [{ data: orders }, { data: addresses }] = await Promise.all([
      supabase
        .from("scz_orders")
        .select("id,status,payment_status,total_cents,created_at")
        .eq("user_id", data.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("scz_addresses")
        .select("*")
        .eq("user_id", data.id)
        .order("is_default", { ascending: false }),
    ]);

    const ltv = (orders ?? [])
      .filter((o: any) => o.status !== "cancelled" && o.status !== "refunded")
      .reduce((s: number, o: any) => s + (Number(o.total_cents) || 0), 0);

    return {
      profile,
      orders: orders ?? [],
      addresses: addresses ?? [],
      stats: { orders: orders?.length ?? 0, ltv_cents: ltv },
    };
  });
