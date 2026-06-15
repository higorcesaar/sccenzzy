import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const listAdminCollections = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase.from("scz_collections").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertCollection = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => schema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    if (data.id) {
      const { id, ...patch } = data;
      const { data: row, error } = await supabase.from("scz_collections").update(patch).eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabase.from("scz_collections").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCollection = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("scz_collections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
