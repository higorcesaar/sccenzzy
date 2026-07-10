export type ResolvedMedia =
  | { kind: "video"; src: string }
  | { kind: "image"; src: string }
  | { kind: "iframe"; src: string };

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i;
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|svg)(\?|#|$)/i;

/**
 * Resolves a media URL into a renderable shape:
 * - Direct video files (including R2-proxied paths) → <video>
 * - Direct image files → <img>
 * - YouTube / Vimeo / Instagram / TikTok / arbitrary URL → <iframe>
 * Accepts absolute and root-relative URLs (e.g. /api/public/r2/...).
 */
export function resolveVideoEmbed(raw: string): ResolvedMedia | null {
  const url = (raw || "").trim();
  if (!url) return null;

  // Root-relative URL (e.g. /api/public/r2/uploads/....mp4) — no URL() parse.
  if (url.startsWith("/")) {
    if (VIDEO_EXT.test(url)) return { kind: "video", src: url };
    if (IMAGE_EXT.test(url)) return { kind: "image", src: url };
    // Default to video for the R2 proxy path — uploads are treated as media files.
    if (url.startsWith("/api/public/r2/")) return { kind: "video", src: url };
    return { kind: "iframe", src: url };
  }

  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname;

    if (VIDEO_EXT.test(path)) return { kind: "video", src: url };
    if (IMAGE_EXT.test(path)) return { kind: "image", src: url };

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return { kind: "iframe", src: `https://www.youtube.com/embed/${v}` };
      const shorts = path.match(/^\/shorts\/([\w-]+)/);
      if (shorts) return { kind: "iframe", src: `https://www.youtube.com/embed/${shorts[1]}` };
      const embed = path.match(/^\/embed\/([\w-]+)/);
      if (embed) return { kind: "iframe", src: `https://www.youtube.com/embed/${embed[1]}` };
    }
    if (host === "youtu.be") {
      const id = path.slice(1);
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "vimeo.com") {
      const id = path.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
    if (host === "player.vimeo.com") return { kind: "iframe", src: url };

    if (host === "instagram.com") {
      const m = path.match(/^\/(?:p|reel|reels|tv)\/([\w-]+)/);
      // Instagram uses /p/{shortcode}/embed for reels and posts alike.
      if (m) return { kind: "iframe", src: `https://www.instagram.com/p/${m[1]}/embed` };
    }

    if (host === "tiktok.com") {
      const m = path.match(/\/video\/(\d+)/);
      if (m) return { kind: "iframe", src: `https://www.tiktok.com/embed/v2/${m[1]}` };
    }

    return { kind: "iframe", src: url };
  } catch {
    return null;
  }
}
