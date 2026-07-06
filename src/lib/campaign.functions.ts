import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireAdmin } from "@/lib/admin/admin-guard";

export const getCampaignVideo = createServerFn({ method: "GET" })
  .handler(async () => {
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
    if (error) throw new Error(error.message);
    return { success: true };
  });
