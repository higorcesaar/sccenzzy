import { createServerFn } from "@tanstack/react-start";

/**
 * Public catalog listing — no auth. Returns active products mapped
 * to the storefront `Product` shape used by Storefront.tsx.
 */
export const listPublicProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: rows, error } = await supabaseAdmin
    .from("scz_products")
    .select(
      "id,slug,name,description,short_description,price_cents,promo_price,stock_qty,is_on_sale,is_featured,is_launch,is_bestseller,tags,category_id,scz_categories(slug)",
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const ids = (rows ?? []).map((r: any) => r.id);
  let imagesByProduct: Record<string, string[]> = {};
  if (ids.length > 0) {
    const { data: imgs } = await supabaseAdmin
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
    // Map our DB categories onto the legacy storefront enum
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
      id: r.slug, // storefront uses string IDs; slug is stable
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
