import { createServerFn } from "@tanstack/react-start";
import { PRODUCTS } from "../data/catalog";

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
  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("scz_categories")
      .select("id,slug,name,parent_id,sort_order,is_in_menu,image_url,description")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  } catch (err) {
    console.warn("Supabase não configurado, retornando categorias mockadas:", err);
    return [
      { id: "cat-1", slug: "tenis", name: "Tênis", is_in_menu: true, sort_order: 1 },
      { id: "cat-2", slug: "salto", name: "Saltos", is_in_menu: true, sort_order: 2 },
      { id: "cat-3", slug: "bolsa", name: "Bolsas", is_in_menu: true, sort_order: 3 },
      { id: "cat-4", slug: "cinto", name: "Cintos", is_in_menu: true, sort_order: 4 },
      { id: "cat-5", slug: "acessorio", name: "Acessórios", is_in_menu: true, sort_order: 5 },
    ];
  }
});

export const listPublicCollections = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("scz_collections")
      .select("id,slug,name,description,image_url,sort_order")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  } catch (err) {
    console.warn("Supabase não configurado, retornando coleções mockadas:", err);
    return [
      { id: "col-1", slug: "novidades", name: "Novidades", sort_order: 1 },
      { id: "col-2", slug: "promocao", name: "Promoção", sort_order: 2 },
    ];
  }
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
    try {
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
      const stockMap: Record<string, number> = {}; // product_id or product_id:variant_id -> sum of qty across locations

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

        try {
          let client;
          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            client = supabaseAdmin;
          } else if (process.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
            const { supabase } = await import("@/integrations/supabase/client");
            client = supabase;
          }

          if (client) {
            const { data: stockEntries, error: stockErr } = await client
              .from("scz_stock")
              .select("product_id, variant_id, qty")
              .in("product_id", ids);

            if (!stockErr && stockEntries) {
              for (const entry of stockEntries) {
                const pId = entry.product_id;
                const vId = entry.variant_id;

                // Sum total product stock
                stockMap[pId] = (stockMap[pId] || 0) + (entry.qty || 0);

                // Sum variant-specific stock
                if (vId) {
                  const key = `${pId}:${vId}`;
                  stockMap[key] = (stockMap[key] || 0) + (entry.qty || 0);
                }
              }
            }
          } else {
            console.warn("Supabase keys missing, skipping loading stock from scz_stock.");
          }
        } catch (err) {
          console.warn("Failed to load stock from scz_stock gracefully:", err);
        }
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

        const pId = r.id;
        const totalStock = stockMap[pId] !== undefined ? stockMap[pId] : (r.stock_qty ?? 0);

        const mappedVariants = vars.map((v: any) => {
          const vKey = `${pId}:${v.id}`;
          const vStock = stockMap[vKey] !== undefined ? stockMap[vKey] : (v.stock_qty ?? 0);
          return {
            ...v,
            stockQty: vStock
          };
        });

        const sizes = mappedVariants.length > 0
          ? Array.from(new Set(mappedVariants.map((v: any) => v.size).filter(Boolean)))
          : (category === "bolsa" || category === "acessorio" ? ["Único"] : ["35","36","37","38","39"]);

        // Create a map from size to stock quantity
        const sizeStockMap: Record<string, number> = {};
        if (mappedVariants.length > 0) {
          for (const mv of mappedVariants) {
            if (mv.size) {
              sizeStockMap[mv.size] = (sizeStockMap[mv.size] || 0) + (mv.stockQty ?? 0);
            }
          }
        } else {
          sizes.forEach((sz: string) => {
            sizeStockMap[sz] = totalStock;
          });
        }

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
          stockQty: totalStock,
          isLaunch: !!r.is_launch,
          isOnSale: !!r.is_on_sale || hasPromo,
          hasVariants: !!r.has_variants,
          variants: mappedVariants,
          sizeStockMap,
        };
      });
    } catch (err) {
      console.warn("Supabase não configurado ou falhou, retornando produtos do catálogo local:", err);
      let filtered: any[] = [...PRODUCTS];
      if (data.onlyOnSale) {
        filtered = filtered.filter((p: any) => p.isOnSale || p.originalPrice);
      }
      if (data.onlyLaunch) {
        filtered = filtered.filter((p: any) => p.isLaunch);
      }
      if (data.categorySlug) {
        filtered = filtered.filter((p: any) => p.category === data.categorySlug || p.categorySlug === data.categorySlug);
      }
      if (data.search) {
        const s = data.search.toLowerCase();
        filtered = filtered.filter((p: any) => p.name.toLowerCase().includes(s) || (p.description ?? "").toLowerCase().includes(s));
      }
      return filtered;
    }
  });

export const getInstagramFeed = createServerFn({ method: "GET" })
  .inputValidator((input: string | undefined) => input ?? "scenzzy")
  .handler(async ({ data: defaultUsername }) => {
    let username = defaultUsername || "scenzzy";
    try {
      if (process.env.SUPABASE_URL) {
        const supabase = await getClient();
        const { data: settingsRow } = await supabase
          .from("scz_settings")
          .select("value")
          .eq("key", "social")
          .maybeSingle();
        if (settingsRow?.value?.instagram) {
          const instaUrl = settingsRow.value.instagram;
          const match = instaUrl.match(/instagram\.com\/([a-zA-Z0-9_\.]+)/);
          if (match && match[1]) {
            username = match[1];
          } else if (!instaUrl.includes("/")) {
            username = instaUrl.replace("@", "");
          }
        }
      }
    } catch (e) {
      console.warn("Failed to retrieve configured instagram handle, using default", e);
    }

    const fallbackImages = [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=300"
    ];

    try {
      const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      const embedUrl = `https://www.instagram.com/${username}/embed/`;
      const response = await fetch(embedUrl, {
        headers: { "User-Agent": userAgent }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch instagram embed for ${username}`);
      }
      const html = await response.text();

      // Extract avatar
      const avatarRegex = /"profile_pic_url":"([^"]+)"/;
      const avatarMatch = html.match(avatarRegex);
      let profilePic = avatarMatch ? avatarMatch[1].replace(/\\u0026/g, "&") : null;

      if (!profilePic) {
        const altAvatarRegex = /class="Avatar"[^>]*src="([^"]+)"/;
        const altAvatarMatch = html.match(altAvatarRegex);
        profilePic = altAvatarMatch ? altAvatarMatch[1] : null;
      }

      // Extract posts
      const mediaUrls: string[] = [];
      const displayUrlRegex = /"display_url":"([^"]+)"/g;
      let match;
      while ((match = displayUrlRegex.exec(html)) !== null && mediaUrls.length < 4) {
        const cleanUrl = match[1].replace(/\\u0026/g, "&");
        if (!mediaUrls.includes(cleanUrl)) {
          mediaUrls.push(cleanUrl);
        }
      }

      if (mediaUrls.length === 0) {
        const thumbnailRegex = /"thumbnail_src":"([^"]+)"/g;
        while ((match = thumbnailRegex.exec(html)) !== null && mediaUrls.length < 4) {
          const cleanUrl = match[1].replace(/\\u0026/g, "&");
          if (!mediaUrls.includes(cleanUrl)) {
            mediaUrls.push(cleanUrl);
          }
        }
      }

      const followersRegex = /"edge_followed_by":{"count":(\d+)}/;
      const followersMatch = html.match(followersRegex);
      const followersCount = followersMatch ? parseInt(followersMatch[1]) : 0;

      const bioRegex = /"biography":"([^"]+)"/;
      const bioMatch = html.match(bioRegex);
      const bio = bioMatch ? bioMatch[1].replace(/\\u003C/g, "<").replace(/\\u003E/g, ">") : null;

      if (mediaUrls.length > 0) {
        return {
          username,
          profilePic: profilePic || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
          followersCount: followersCount || 12400,
          bio: bio || "Estilo premium e elegância em couro legítimo.",
          posts: mediaUrls.map((url, index) => ({
            id: index,
            imageUrl: url,
            likes: 120 + index * 43,
            comments: 8 + index * 5,
          })),
        };
      }
    } catch (err) {
      console.warn("Instagram scraper failed or was blocked, falling back to database products:", err);
    }

    let fallbackPosts = fallbackImages.map((img, index) => ({
      id: index,
      imageUrl: img,
      likes: 180 + index * 47,
      comments: 12 + index * 7,
    }));

    try {
      if (process.env.SUPABASE_URL) {
        const supabase = await getClient();
        const { data: products } = await supabase
          .from("scz_products")
          .select("id, slug, name")
          .eq("is_active", true)
          .limit(4);

        if (products && products.length > 0) {
          const pIds = products.map((p: any) => p.id);
          const { data: images } = await supabase
            .from("scz_product_images")
            .select("product_id, url")
            .in("product_id", pIds)
            .order("sort_order");

          if (images && images.length > 0) {
            const productImgs = images.map((img: any) => img.url).slice(0, 4);
            if (productImgs.length > 0) {
              fallbackPosts = productImgs.map((img, index) => ({
                id: index,
                imageUrl: img,
                likes: 210 + index * 34,
                comments: 15 + index * 4,
              }));
            }
          }
        }
      }
    } catch (fallbackErr) {
      console.warn("Instagram fallback product fetch failed, using default Unsplash:", fallbackErr);
    }

    return {
      username,
      profilePic: null,
      followersCount: 15800,
      bio: "Sapatos elegantes e bolsas estruturadas com acabamento primoroso. Curadoria Scenzzy.",
      posts: fallbackPosts,
    };
  });
