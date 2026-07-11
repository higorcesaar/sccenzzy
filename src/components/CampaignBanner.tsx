import React from 'react';
import { Sparkles } from 'lucide-react';
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
  const subtitle = campaignData?.subtitle || "COLEÇÃO EXCLUSIVA • SCENZZY ICONS";
  const title = campaignData?.title || "Nova Coleção";
  const description = campaignData?.description || "Sapatos elegantes e bolsas estruturadas com acabamento primoroso. Descubra lançamentos que combinam as principais tendências de moda com conforto absoluto para o seu dia a dia.";

  const resolved = videoUrl ? resolveVideoEmbed(videoUrl) : null;
  // Campanha Editorial aceita apenas vídeos (arquivos diretos do R2).
  const videoSrc = resolved && resolved.kind === "video" ? resolved.src : null;

  return (
    <section id="campaign-section" className="relative w-full overflow-hidden bg-[#FAFAF8] flex flex-col items-center justify-center py-20 px-6 sm:px-10 border-b border-stone-200">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-gold-400/10 filter blur-[150px] pointer-events-none select-none" />
      <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-stone-300/20 filter blur-[120px] pointer-events-none select-none" />

      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        <div className="max-w-xl text-center lg:text-left space-y-6">
          <span className="text-stone-500 font-display tracking-[0.35em] text-xs font-semibold uppercase block hover:text-gold-500 transition-colors">
            {subtitle}
          </span>

          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black leading-tight bg-gradient-to-r from-neutral-950 via-gold-500 to-gold-600 bg-clip-text text-transparent pb-2">
            {title}
          </h2>

          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-sans font-light">
            {description}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <a href="#shoes" className="bg-neutral-900 text-white hover:bg-gold-500 px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none">
              Ver Coleção
            </a>
            <a href="#near-you" className="bg-white text-neutral-900 border border-stone-300 hover:border-neutral-900 px-8 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all duration-300 focus:outline-none">
              Encontrar Loja
            </a>
          </div>
        </div>

        {videoSrc && (
          <div className="relative w-full max-w-md aspect-[3/4.5] rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-black group">
            <video
              key={videoSrc}
              src={videoSrc}
              autoPlay
              loop
              muted
              
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              preload="auto"
              controls={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              onError={(e) => console.error("[CampaignBanner] video failed to load", videoSrc, e)}
            />
            <div className="absolute top-5 left-5 bg-white/80 border border-stone-200 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-neutral-900 text-[10px] uppercase font-bold tracking-widest shadow-sm z-10">
              <Sparkles className="h-3 w-3 text-gold-500 animate-spin" /> Campanha Editorial
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
