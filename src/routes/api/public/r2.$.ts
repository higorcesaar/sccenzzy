import { createFileRoute } from "@tanstack/react-router";

/**
 * Proxy público para arquivos do bucket R2.
 * Permite servir mídias mesmo quando o bucket não está exposto publicamente.
 * URL: /api/public/r2/<key...>
 */
export const Route = createFileRoute("/api/public/r2/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const key = (params as any)._splat as string;
        if (!key || key.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        const accountId = process.env.R2_ACCOUNT_ID!;
        const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
        const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
        const bucket = process.env.R2_BUCKET_NAME!;

        const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
        const { AwsClient } = await import("aws4fetch");
        const aws = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });

        const range = request.headers.get("range");
        const init: RequestInit = { method: "GET" };
        if (range) (init as any).headers = { range };

        const res = await aws.fetch(endpoint, init);
        if (!res.ok && res.status !== 206) {
          return new Response("Not found", { status: 404 });
        }

        const headers = new Headers();
        const passthrough = [
          "content-type",
          "content-length",
          "content-range",
          "accept-ranges",
          "etag",
          "last-modified",
        ];
        for (const h of passthrough) {
          const v = res.headers.get(h);
          if (v) headers.set(h, v);
        }
        headers.set("cache-control", "public, max-age=31536000, immutable");
        headers.set("access-control-allow-origin", "*");

        return new Response(res.body, { status: res.status, headers });
      },
    },
  },
});
