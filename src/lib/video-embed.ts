export function resolveVideoEmbed(raw: string): { kind: "video" | "iframe"; src: string } | null {
  const url = (raw || "").trim();
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return { kind: "iframe", src: `https://www.youtube.com/embed/${v}` };
      const shorts = u.pathname.match(/^\/shorts\/([\w-]+)/);
      if (shorts) return { kind: "iframe", src: `https://www.youtube.com/embed/${shorts[1]}` };
      const embed = u.pathname.match(/^\/embed\/([\w-]+)/);
      if (embed) return { kind: "iframe", src: `https://www.youtube.com/embed/${embed[1]}` };
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
    }

    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
    }
    if (host === "player.vimeo.com") return { kind: "iframe", src: url };

    if (host === "instagram.com") {
      const m = u.pathname.match(/^\/(?:p|reel|reels|tv)\/([\w-]+)/);
      if (m) return { kind: "iframe", src: `https://www.instagram.com/p/${m[1]}/embed` };
    }

    if (host === "tiktok.com") {
      const m = u.pathname.match(/\/video\/(\d+)/);
      if (m) return { kind: "iframe", src: `https://www.tiktok.com/embed/v2/${m[1]}` };
    }

    if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(u.pathname)) {
      return { kind: "video", src: url };
    }

    return { kind: "iframe", src: url };
  } catch {
    return null;
  }
}
