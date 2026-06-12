import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Sparkles, HelpCircle } from 'lucide-react';

export default function CampaignBanner() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  return (
    <section id="campaign-section" className="relative w-full overflow-hidden bg-[#FAFAF8] flex flex-col items-center justify-center py-20 px-6 sm:px-10 border-b border-stone-200">
      
      {/* Absolute Decorative Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-gold-400/10 filter blur-[150px] pointer-events-none select-none" />
      <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-stone-300/20 filter blur-[120px] pointer-events-none select-none" />

      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
        
        {/* Banner Copy Area */}
        <div className="max-w-xl text-center lg:text-left space-y-6">
          <span className="text-stone-500 font-display tracking-[0.35em] text-xs font-semibold uppercase block hover:text-gold-500 transition-colors">
            COLEÇÃO EXCLUSIVA • SCENZZY ICONS
          </span>
          
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-900 leading-tight">
            Nova Coleção <br />
            <span className="text-gold-500">Alto Verão</span>
          </h2>
          
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-sans font-light">
            Sapatos elegantes e bolsas estruturadas com acabamento primoroso. Descubra lançamentos que combinam as principais tendências de moda com conforto absoluto para o seu dia a dia.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <a
              href="#shoes"
              className="bg-neutral-900 text-white hover:bg-gold-500 px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none"
            >
              Ver Coleção
            </a>
            <a
              href="#near-you"
              className="bg-white text-neutral-900 border border-stone-300 hover:border-neutral-900 px-8 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all duration-300 focus:outline-none"
            >
              Encontrar Loja
            </a>
          </div>
        </div>

        {/* Video Frame Mockup - Vimeo section replacement */}
        <div className="relative w-full max-w-md aspect-[3/4.5] rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-white group">
          
          {/* Autoplay Video Loop */}
          <video
            ref={videoRef}
            src="https://assets.mixkit.co/videos/preview/mixkit-fashion-model-dancing-at-outdoor-fashion-shoot-40348-large.mp4"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            referrerPolicy="no-referrer"
          />

          {/* Interactive Player Controls */}
          <div className="absolute bottom-5 right-5 flex gap-2">
            <button
              onClick={togglePlay}
              className="bg-white/80 hover:bg-white hover:scale-105 active:scale-95 text-neutral-900 p-3 rounded-full border border-stone-200 transition-all focus:outline-none shadow-md"
              aria-label={isPlaying ? 'Pausar' : 'Play'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleMute}
              className="bg-white/80 hover:bg-white hover:scale-105 active:scale-95 text-neutral-900 p-3 rounded-full border border-stone-200 transition-all focus:outline-none shadow-md"
              aria-label={isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="absolute top-5 left-5 bg-white/80 border border-stone-200 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-neutral-900 text-[10px] uppercase font-bold tracking-widest shadow-sm">
            <Sparkles className="h-3 w-3 text-gold-500 animate-spin" /> Campanha Editorial
          </div>
        </div>

      </div>
    </section>
  );
}
