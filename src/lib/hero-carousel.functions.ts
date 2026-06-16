import { createServerFn } from "@tanstack/react-start";

export const listPublicHeroSlides = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
  if (!url || !key) return [];
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("scz_hero_carousel")
    .select("id,title,subtitle,video_url,image_url,button_text,button_link,position")
    .eq("active", true)
    .order("position");
  if (error) return [];
  return data ?? [];
});
