import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

const slideInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().nullable(),
  video_url: z.string().max(500).optional().nullable(),
  image_url: z.string().max(500).optional().nullable(),
  button_text: z.string().max(60).optional().nullable(),
  button_link: z.string().max(500).optional().nullable(),
  position: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const listHeroSlidesAdmin = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase
      .from("scz_hero_carousel")
      .select("*")
      .order("position");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) => slideInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { data: row, error } = data.id
      ? await supabase.from("scz_hero_carousel").update(data).eq("id", data.id).select().single()
      : await supabase.from("scz_hero_carousel").insert(data).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteHeroSlide = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    const { error } = await supabase.from("scz_hero_carousel").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderHeroSlides = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).max(50) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context as any;
    await Promise.all(
      data.ids.map((id, i) =>
        supabase.from("scz_hero_carousel").update({ position: i }).eq("id", id),
      ),
    );
    return { ok: true };
  });
