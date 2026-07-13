import React from 'react';
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCampaignVideo } from "../lib/campaign.functions";
import { resolveVideoEmbed } from "../lib/video-embed";

export default function CampaignBanner() {
  const fetchCampaignVideo = useServerFn(getCampaignVideo);
  const { data: campaignData } = useQuery({
    queryKey: ["campaign-video"],
    queryFn: () => fetchCampaignVideo(),
    staleTime: 60_000,
  });

  const videoUrl = campaignData?.url || "";
  const title = campaignData?.title || "Nova Coleção";

  if (!videoUrl) return null;

  const resolved = resolveVideoEmbed(videoUrl);
  if (!resolved) return null;

  return (
    <section
      id="campaign-section"
      className="relative w-full overflow-hidden bg-[#FAFAF8] flex items-center justify-center py-16 px-4 sm:px-8 border-b border-stone-200"
    >
      <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-black">
        {resolved.kind === "image" && (
          <img src={resolved.src} alt={title} className="w-full h-full object-cover" />
        )}

        {resolved.kind === "video" && (
          <video
            src={resolved.src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          />
        )}

        {resolved.kind === "iframe" && (() => {
          let src = resolved.src;
          const ytMatch = src.match(/youtube\.com\/embed\/([\w-]+)/);
          if (ytMatch) {
            src = `${src}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&modestbranding=1&rel=0&playsinline=1`;
          } else if (/player\.vimeo\.com/.test(src)) {
            src = `${src}${src.includes("?") ? "&" : "?"}autoplay=1&muted=1&loop=1&background=1`;
          }
          return (
            <iframe
              key={src}
              src={src}
              className="w-full h-full"
              frameBorder={0}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          );
        })()}
      </div>
    </section>
  );
}
