import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./admin-guard";

export const getDashboardMetrics = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);

    const [
      { data: ordersToday },
      { data: ordersMonth },
      { count: openOrdersCount },
      { count: lowStockCount },
      { count: outOfStockCount },
      { count: newCustomersCount },
      { data: salesSeries },
    ] = await Promise.all([
      supabase.from("scz_orders").select("total_cents").gte("created_at", today.toISOString()),
      supabase.from("scz_orders").select("total_cents").gte("created_at", monthStart.toISOString()),
      supabase.from("scz_orders").select("*", { count: "exact", head: true }).in("status", ["pending", "paid", "processing"]),
      supabase.from("scz_products").select("*", { count: "exact", head: true }).gt("stock_min", 0).lte("stock_qty", 5),
      supabase.from("scz_products").select("*", { count: "exact", head: true }).eq("stock_qty", 0),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", last30.toISOString()),
      supabase.from("scz_orders").select("created_at,total_cents").gte("created_at", last30.toISOString()).order("created_at"),
    ]);

    const sumCents = (rows: any[] | null) =>
      (rows ?? []).reduce((s, r) => s + (Number(r.total_cents) || 0), 0);

    const todayTotal = sumCents(ordersToday) / 100;
    const monthTotal = sumCents(ordersMonth) / 100;
    const monthCount = ordersMonth?.length ?? 0;
    const avgTicket = monthCount > 0 ? monthTotal / monthCount : 0;

    // Aggregate per day for chart
    const byDay = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      byDay.set(k, 0);
    }
    (salesSeries ?? []).forEach((r: any) => {
      const k = String(r.created_at).slice(0, 10);
      byDay.set(k, (byDay.get(k) ?? 0) + Number(r.total_cents) / 100);
    });
    const chart = Array.from(byDay.entries()).map(([date, total]) => ({ date, total }));

    return {
      todayTotal,
      monthTotal,
      monthOrders: monthCount,
      avgTicket,
      openOrders: openOrdersCount ?? 0,
      lowStock: lowStockCount ?? 0,
      outOfStock: outOfStockCount ?? 0,
      newCustomers: newCustomersCount ?? 0,
      chart,
    };
  });
