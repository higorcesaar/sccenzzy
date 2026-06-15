import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Returns a presigned PUT URL for uploading directly to Cloudflare R2.
 * Caller must be authenticated; admin-only enforcement happens via role check.
 */
export const getR2UploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { filename: string; contentType: string }) => {
    if (!input?.filename || typeof input.filename !== "string" || input.filename.length > 200) {
      throw new Error("filename inválido");
    }
    if (!input?.contentType || !/^[\w.+-]+\/[\w.+-]+$/.test(input.contentType)) {
      throw new Error("contentType inválido");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const accountId = process.env.R2_ACCOUNT_ID!;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
    const bucket = process.env.R2_BUCKET_NAME!;
    const publicBase = process.env.R2_PUBLIC_BASE_URL || "";

    const safeName = data.filename.replace(/[^\w.-]/g, "_");
    const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

    const { AwsClient } = await import("aws4fetch");
    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    });

    // Presign a PUT (1h)
    const signedReq = await aws.sign(
      new Request(`${endpoint}?X-Amz-Expires=3600`, {
        method: "PUT",
        headers: { "Content-Type": data.contentType },
      }),
      { aws: { signQuery: true } },
    );

    const publicUrl = publicBase
      ? `${publicBase.replace(/\/$/, "")}/${key}`
      : endpoint;

    return {
      uploadUrl: signedReq.url,
      publicUrl,
      key,
    };
  });

/**
 * Upload direto via server (sem CORS). O cliente envia o arquivo em base64
 * e o servidor faz PUT autenticado no R2. Mais simples e à prova de CORS
 * que o presigned URL — preferido para o painel admin.
 *
 * Limite prático: ~25MB por arquivo (limite de payload da edge).
 */
export const uploadProductMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { filename: string; contentType: string; dataBase64: string }) => {
    if (!input?.filename || typeof input.filename !== "string" || input.filename.length > 200) {
      throw new Error("filename inválido");
    }
    if (!input?.contentType || !/^[\w.+-]+\/[\w.+-]+$/.test(input.contentType)) {
      throw new Error("contentType inválido");
    }
    if (!input?.dataBase64 || typeof input.dataBase64 !== "string") {
      throw new Error("conteúdo inválido");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const accountId = process.env.R2_ACCOUNT_ID!;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
    const bucket = process.env.R2_BUCKET_NAME!;
    const publicBase = process.env.R2_PUBLIC_BASE_URL || "";

    const safeName = data.filename.replace(/[^\w.-]/g, "_");
    const key = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeName}`;
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;

    // Decode base64 to bytes
    const bin = atob(data.dataBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const { AwsClient } = await import("aws4fetch");
    const aws = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });

    const res = await aws.fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": data.contentType },
      body: bytes,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Falha no upload R2 (${res.status}): ${txt.slice(0, 200)}`);
    }

    // Sempre usa o proxy /api/public/r2/<key> — funciona mesmo se o bucket
    // R2 não estiver com domínio público configurado.
    const publicUrl = `/api/public/r2/${key}`;
    return { publicUrl, key };

