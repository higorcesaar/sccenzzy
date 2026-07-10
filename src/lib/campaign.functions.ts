import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/admin-guard";

export const getCampaignVideo = createServerFn({ method: "GET" })
  .handler(async () => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY!;
    if (!url || !key) return null;
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("scz_settings")
      .select("value")
      .eq("key", "campaign_video")
      .maybeSingle();
    if (error) {
      console.error("Error fetching campaign video:", error);
      return null;
    }
    return data?.value as { url: string; title?: string; subtitle?: string; description?: string } | null;
  });

export const updateCampaignVideo = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    z.object({
      url: z.string().url(),
      title: z.string().optional().nullable(),
      subtitle: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
    }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase: ctxSupabase, userId } = context as any;
    console.info("[campaign] updateCampaignVideo", { userId, url: data.url });
    const { error } = await ctxSupabase
      .from("scz_settings")
      .upsert(
        {
          key: "campaign_video",
          value: {
            url: data.url,
            title: data.title || "",
            subtitle: data.subtitle || "",
            description: data.description || "",
          },
          updated_by: userId,
        },
        { onConflict: "key" }
      );
    if (error) {
      console.error("[campaign] updateCampaignVideo failed", error);
      throw new Error(error.message);
    }
    console.info("[campaign] updateCampaignVideo saved");
    return { success: true };
  });
