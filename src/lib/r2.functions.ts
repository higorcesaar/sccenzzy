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
