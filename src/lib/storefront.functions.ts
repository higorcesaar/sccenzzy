import { createServerFn } from "@tanstack/react-start";

function getClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
  if (!url || !key) throw new Error("Supabase não configurado");
  // dynamic import keeps bundle slim
  return import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, key, { auth: { persistSession: false } }),
  );
}

export const listPublicCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("scz_categories")
    .select("id,slug,name,parent_id,sort_order,is_in_menu,image_url,description")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listPublicCollections = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("scz_collections")
    .select("id,slug,name,description,image_url,sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

type Filter = {
  categorySlug?: string;
  collectionSlug?: string;
  onlyOnSale?: boolean;
  onlyLaunch?: boolean;
  onlyFeatured?: boolean;
  search?: string;
};

export const listPublicProducts = createServerFn({ method: "POST" })
  .inputValidator((input: Filter | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const supabase = await getClient();
    // Resolve category (include children when parent slug informed)
    let categoryIds: string[] | null = null;
    if (data.categorySlug) {
      const { data: cat } = await supabase
        .from("scz_categories")
        .select("id")
        .eq("slug", data.categorySlug)
        .maybeSingle();
      if (cat?.id) {
        const { data: kids } = await supabase
          .from("scz_categories")
          .select("id")
          .eq("parent_id", cat.id);
        categoryIds = [cat.id, ...(kids ?? []).map((k: any) => k.id)];
      } else {
        return [];
      }
    }

    let collectionId: string | null = null;
    if (data.collectionSlug) {
      const { data: col } = await supabase
        .from("scz_collections")
        .select("id")
        .eq("slug", data.collectionSlug)
        .maybeSingle();
      if (!col?.id) return [];
      collectionId = col.id;
    }

    let q = supabase
      .from("scz_products")
      .select(
        // disambiguate the FK to avoid PostgREST embed error
        "id,slug,name,description,short_description,price_cents,promo_price,stock_qty,is_on_sale,is_featured,is_launch,is_bestseller,has_variants,tags,sort_order,category_id,collection_id,category:scz_categories!scz_products_category_id_fkey(slug,name)",
      )
      .eq("is_active", true)
      .order("sort_order")
      .order("updated_at", { ascending: false });

    if (categoryIds) q = q.in("category_id", categoryIds);
    if (collectionId) q = q.eq("collection_id", collectionId);
    if (data.onlyOnSale) q = q.eq("is_on_sale", true);
    if (data.onlyLaunch) q = q.eq("is_launch", true);
    if (data.onlyFeatured) q = q.eq("is_featured", true);
    if (data.search) q = q.ilike("name", `%${data.search}%`);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r: any) => r.id);
    const imagesByProduct: Record<string, string[]> = {};
    const variantsByProduct: Record<string, any[]> = {};
    if (ids.length > 0) {
      const [{ data: imgs }, { data: vars }] = await Promise.all([
        supabase
          .from("scz_product_images")
          .select("product_id,url,sort_order")
          .in("product_id", ids)
          .order("sort_order"),
        supabase
          .from("scz_product_variants")
          .select("id,product_id,size,color,color_hex,model,stock_qty,price_cents,promo_price,is_active,sort_order")
          .in("product_id", ids)
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      for (const img of imgs ?? []) (imagesByProduct[img.product_id] ||= []).push(img.url);
      for (const v of vars ?? []) (variantsByProduct[v.product_id] ||= []).push(v);
    }

    return (rows ?? []).map((r: any) => {
      const catSlug: string = r.category?.slug ?? "";
      const category =
        catSlug === "tenis" ? "tenis"
        : catSlug === "salto" || catSlug === "sapatos" || catSlug === "sandalias" ? "salto"
        : catSlug === "bolsa" || catSlug === "bolsas" ? "bolsa"
        : catSlug === "cinto" || catSlug === "cintos" ? "cinto"
        : "acessorio";

      const price = r.price_cents / 100;
      const promo = r.promo_price ? Number(r.promo_price) : null;
      const hasPromo = !!(promo && promo > 0 && promo < price);
      const vars = variantsByProduct[r.id] ?? [];
      const sizes = vars.length > 0
        ? Array.from(new Set(vars.map((v: any) => v.size).filter(Boolean)))
        : (category === "bolsa" || category === "acessorio" ? ["Único"] : ["35","36","37","38","39"]);

      return {
        id: r.slug,
        dbId: r.id,
        name: r.name,
        category,
        categorySlug: catSlug,
        categoryName: r.category?.name ?? "",
        description: r.description || r.short_description || "",
        price: hasPromo ? (promo as number) : price,
        originalPrice: hasPromo ? price : undefined,
        images: imagesByProduct[r.id] ?? [],
        features: [],
        sizes,
        trialAvailable: category === "tenis" || category === "salto",
        stockQty: r.stock_qty ?? 0,
        isLaunch: !!r.is_launch,
        isOnSale: !!r.is_on_sale || hasPromo,
        hasVariants: !!r.has_variants,
        variants: vars,
      };
    });
  });
