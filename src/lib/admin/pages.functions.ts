import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";
import { blockSchema } from "./blocks";

const PAGE_STATUSES = ["draft", "published", "archived"] as const;

const pageInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug inválido"),
  title: z.string().min(1).max(200),
  status: z.enum(PAGE_STATUSES).default("draft"),
  blocks: z.array(blockSchema).default([]),
  seo_title: z.string().max(200).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
  seo_keywords: z.string().max(500).optional().nullable(),
  og_image: z.string().url().max(500).optional().nullable(),
});

export const listPages = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { search?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    let q = supabase
      .from("scz_pages")
      .select("id,slug,title,status,is_system,published_at,updated_at")
      .order("updated_at", { ascending: false });
    if (data.search) q = q.or(`title.ilike.%${data.search}%,slug.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: row, error } = await supabase
      .from("scz_pages")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Página não encontrada");
    return row;
  });

export const upsertPage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => pageInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const payload: any = { ...data };
    if (payload.status === "published") payload.published_at = new Date().toISOString();
    if (!payload.id) payload.created_by = userId;
    const { data: row, error } = data.id
      ? await supabase.from("scz_pages").update(payload).eq("id", data.id).select().single()
      : await supabase.from("scz_pages").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("scz_pages").delete().eq("id", data.id).eq("is_system", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Public — no auth. Reads only published pages. */
export const getPublicPageBySlug = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) =>
    z.object({ slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    let client;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      client = supabaseAdmin;
    } else {
      const { supabase } = await import("@/integrations/supabase/client");
      client = supabase;
    }
    const { data: row, error } = await client
      .from("scz_pages")
      .select("id,slug,title,blocks,seo_title,seo_description,seo_keywords,og_image,published_at")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
