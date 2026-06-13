import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

export const SETTINGS_KEYS = ["store", "social", "shipping", "payment"] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];

export const getAllSettings = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { supabase } = context as any;
    const { data, error } = await supabase.from("scz_settings").select("key,value");
    if (error) throw new Error(error.message);
    const out: Record<string, any> = {};
    for (const row of data ?? []) out[row.key] = row.value;
    return out;
  });

export const updateSetting = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: unknown) =>
    z
      .object({
        key: z.enum(SETTINGS_KEYS),
        value: z.record(z.string(), z.any()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: row, error } = await supabase
      .from("scz_settings")
      .upsert({ key: data.key, value: data.value, updated_by: userId }, { onConflict: "key" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
