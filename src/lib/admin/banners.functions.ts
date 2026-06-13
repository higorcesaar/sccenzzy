import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

const bannerInput = z.object({
  id: z.string().uuid().optional(),
  location: z.string().min(1).max(60),
  title: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(300).optional().nullable(),
  image_url: z.string().url().max(500),
  link_url: z.string().max(500).optional().nullable(),
  cta_label: z.string().max(60).optional().nullable(),
  position: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
});

export const listBanners = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase
      .from("scz_banners")
      .select("*")
      .order("location")
      .order("position");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertBanner = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => bannerInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: row, error } = data.id
      ? await supabase.from("scz_banners").update(data).eq("id", data.id).select().single()
      : await supabase.from("scz_banners").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("scz_banners").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
