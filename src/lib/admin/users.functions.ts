import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "./admin-guard";

const ROLES = ["admin", "user"] as const;
type Role = (typeof ROLES)[number];

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { search?: string; page?: number; perPage?: number } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const page = Math.max(1, data.page ?? 1);
    const perPage = Math.min(200, data.perPage ?? 50);

    const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    let users = usersData?.users ?? [];
    if (data.search) {
      const s = data.search.toLowerCase();
      users = users.filter(
        (u: any) =>
          u.email?.toLowerCase().includes(s) ||
          u.user_metadata?.display_name?.toLowerCase?.().includes(s),
      );
    }

    const ids = users.map((u: any) => u.id);
    let roleMap = new Map<string, Role[]>();
    if (ids.length > 0) {
      const { data: rr } = await supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids);
      for (const r of rr ?? []) {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role as Role);
        roleMap.set(r.user_id, arr);
      }
    }

    const rows = users.map((u: any) => ({
      id: u.id,
      email: u.email ?? "",
      display_name: u.user_metadata?.display_name ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      banned_until: u.banned_until ?? null,
      roles: roleMap.get(u.id) ?? [],
    }));

    return { rows, page, perPage, total: rows.length };
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { email: string; password: string; display_name?: string; role: Role }) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        display_name: z.string().optional(),
        role: z.enum(ROLES),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.display_name ? { display_name: data.display_name } : {},
    });
    if (error) throw new Error(error.message);
    const userId = created.user!.id;

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, email: data.email, display_name: data.display_name ?? data.email }, { onConflict: "id" });

    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (rErr && !rErr.message.includes("duplicate")) throw new Error(rErr.message);

    return { id: userId };
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { user_id: string; role: Role }) =>
    z.object({ user_id: z.string().uuid(), role: z.enum(ROLES) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.user_id, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { user_id: string; password: string }) =>
    z.object({ user_id: z.string().uuid(), password: z.string().min(6) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserBan = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { user_id: string; banned: boolean }) =>
    z.object({ user_id: z.string().uuid(), banned: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    if (data.user_id === userId) throw new Error("Você não pode banir a si mesmo");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      ban_duration: data.banned ? "876000h" : "none",
    } as any);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as any;
    if (data.user_id === userId) throw new Error("Você não pode excluir a si mesmo");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
