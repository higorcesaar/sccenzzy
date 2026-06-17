import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listPublicHeroSlides } from "@/lib/hero-carousel.functions";

type Slide = {
  id: string;
  title: string;
  subtitle?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  button_text?: string | null;
  button_link?: string | null;
};

const FALLBACK: Slide[] = [
  {
    id: "default",
    title: "Nova Coleção",
    subtitle: "Curadoria premium de calçados e bolsas",
    video_url: null,
    image_url:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=1920",
    button_text: "Comprar agora",
    button_link: "/sapatos",
  },
];

// Slow auto-advance interval (ms) — gentle pacing like premium brand sites
const AUTOPLAY_MS = 8000;

export default function HeroCarousel() {
  const fetchSlides = useServerFn(listPublicHeroSlides);
  const { data } = useQuery({
    queryKey: ["public-hero-carousel"],
    queryFn: () => fetchSlides(),
    staleTime: 60_000,
  });

  const slides: Slide[] =
    ((data as Slide[] | undefined)?.length ?? 0) > 0 ? (data as Slide[]) : FALLBACK;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (paused) return;
    const current = slides[index];
    if (current?.video_url) return; // video drives transition via onEnded
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, paused, slides]);

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    touchStartX.current = null;
  };

  const current = slides[index] ?? slides[0];

  return (
    <div
      className="relative w-full overflow-hidden bg-black group"
      style={{ aspectRatio: "21 / 9" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
            i === index ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={i !== index}
        >
          {s.video_url ? (
            <video
              src={i === index ? s.video_url : undefined}
              poster={s.image_url || undefined}
              className={`w-full h-full object-cover transition-transform ease-linear ${
                i === index && !paused ? "scale-105" : "scale-100"
              }`}
              style={{ transitionDuration: "10000ms" }}
              autoPlay={i === index}
              muted
              loop={slides.length === 1}
              playsInline
              preload={i === index ? "auto" : "none"}
              onEnded={() => slides.length > 1 && next()}
              onError={(e) => {
                (e.currentTarget as HTMLVideoElement).style.display = "none";
              }}
            />
          ) : null}
          {s.image_url ? (
            <img
              src={s.image_url}
              alt={s.title}
              className={`absolute inset-0 w-full h-full object-cover transition-transform ease-linear ${
                i === index && !paused ? "scale-105" : "scale-100"
              } ${s.video_url ? "-z-10" : ""}`}
              style={{ transitionDuration: "10000ms" }}
              loading={i === index ? "eager" : "lazy"}
              referrerPolicy="no-referrer"
            />
          ) : null}
        </div>
      ))}

      {/* Soft gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Copy + CTA */}
      {(current.title || current.subtitle || current.button_text) && (
        <div className="absolute inset-x-0 bottom-0 px-4 sm:px-10 lg:px-20 pb-8 sm:pb-12 lg:pb-16 text-white z-10 max-w-4xl">
          {current.title && (
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-tight uppercase tracking-tight drop-shadow-lg">
              {current.title}
            </h2>
          )}
          {current.subtitle && (
            <p className="mt-2 text-sm sm:text-base lg:text-lg text-white/90 max-w-xl font-light drop-shadow">
              {current.subtitle}
            </p>
          )}
          {current.button_text && current.button_link && (
            <a
              href={current.button_link}
              className="inline-flex items-center gap-2 mt-5 bg-white text-neutral-900 hover:bg-gold-500 hover:text-white px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg"
            >
              {current.button_text}
            </a>
          )}
        </div>
      )}

      {/* Side arrows — always visible (like Arezzo) */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/70 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md backdrop-blur-sm transition-all"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            aria-label="Próximo slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-white/70 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md backdrop-blur-sm transition-all"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
