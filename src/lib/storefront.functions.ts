import { createServerFn } from "@tanstack/react-start";

/**
 * Public catalog listing — no auth required. Uses the publishable (anon)
 * key so it works without SUPABASE_SERVICE_ROLE_KEY. RLS on scz_products
 * already allows anon to read rows where is_active = true.
 */
export const listPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
  if (!url || !key) {
    throw new Error("Supabase não configurado (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY).");
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error } = await supabase
    .from("scz_products")
    .select(
      "id,slug,name,description,short_description,price_cents,promo_price,stock_qty,is_on_sale,is_featured,is_launch,is_bestseller,tags,category_id,scz_categories(slug)",
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const ids = (rows ?? []).map((r: any) => r.id);
  const imagesByProduct: Record<string, string[]> = {};
  if (ids.length > 0) {
    const { data: imgs } = await supabase
      .from("scz_product_images")
      .select("product_id,url,sort_order")
      .in("product_id", ids)
      .order("sort_order");
    for (const img of imgs ?? []) {
      (imagesByProduct[img.product_id] ||= []).push(img.url);
    }
  }

  return (rows ?? []).map((r: any) => {
    const catSlug: string = r.scz_categories?.slug ?? "";
    const category =
      catSlug === "tenis" || catSlug === "sapatos"
        ? "tenis"
        : catSlug === "salto"
        ? "salto"
        : catSlug === "bolsa" || catSlug === "bolsas"
        ? "bolsa"
        : catSlug === "cinto" || catSlug === "cintos"
        ? "cinto"
        : "acessorio";

    const price = r.price_cents / 100;
    const promo = r.promo_price ? Number(r.promo_price) : null;
    const hasPromo = !!(promo && promo > 0 && promo < price);

    return {
      id: r.slug,
      dbId: r.id,
      name: r.name,
      category,
      description: r.description || r.short_description || "",
      price: hasPromo ? (promo as number) : price,
      originalPrice: hasPromo ? price : undefined,
      images: imagesByProduct[r.id] ?? [],
      features: [],
      sizes: category === "bolsa" || category === "acessorio" ? ["Único"] : ["35", "36", "37", "38", "39"],
      trialAvailable: category === "tenis" || category === "salto",
      stockQty: r.stock_qty ?? 0,
      isLaunch: !!r.is_launch,
      isOnSale: !!r.is_on_sale || hasPromo,
    };
  });
});
