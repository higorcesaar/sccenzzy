import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Sparkles } from 'lucide-react';
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getCampaignVideo } from "../lib/campaign.functions";
import { resolveVideoEmbed } from "../lib/video-embed";

export default function CampaignBanner() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchCampaignVideo = useServerFn(getCampaignVideo);
  const { data: campaignData } = useQuery({
    queryKey: ["campaign-video"],
    queryFn: () => fetchCampaignVideo(),
    staleTime: 60_000,
  });

  const videoUrl = campaignData?.url || "";

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play().catch(err => console.log("Video autoplay prevented:", err));
      }
    }
  }, [videoUrl]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!videoUrl) return null;

  const resolved = resolveVideoEmbed(videoUrl);

  return (
    <section id="campaign-section" className="relative w-full overflow-hidden bg-[#FAFAF8] flex justify-center py-16 px-4 sm:px-8 border-b border-stone-200">
      <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-black group">
        {resolved?.kind === "iframe" ? (() => {
          let src = resolved.src;
          const ytMatch = src.match(/youtube\.com\/embed\/([\w-]+)/);
          if (ytMatch) {
            src = `${src}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&modestbranding=1&rel=0`;
          } else if (/player\.vimeo\.com/.test(src)) {
            src = `${src}${src.includes("?") ? "&" : "?"}autoplay=1&muted=1&loop=1&background=0`;
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
        })() : (
          <>
            <video
              ref={videoRef}
              src={resolved?.src || videoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              controls
              className="w-full h-full object-contain bg-black"
            />
            <div className="absolute bottom-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={togglePlay}
                className="bg-white/80 hover:bg-white text-neutral-900 p-3 rounded-full border border-stone-200 shadow-md"
                aria-label={isPlaying ? 'Pausar' : 'Play'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={toggleMute}
                className="bg-white/80 hover:bg-white text-neutral-900 p-3 rounded-full border border-stone-200 shadow-md"
                aria-label={isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </>
        )}

        <div className="absolute top-5 left-5 bg-white/80 border border-stone-200 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-neutral-900 text-[10px] uppercase font-bold tracking-widest shadow-sm z-10">
          <Sparkles className="h-3 w-3 text-gold-500" /> Campanha Editorial
        </div>
      </div>
    </section>
  );
}
