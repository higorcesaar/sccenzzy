import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
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
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=1200",
    button_text: "Comprar agora",
    button_link: "/sapatos",
  },
];

export default function HeroCarousel() {
  const fetchSlides = useServerFn(listPublicHeroSlides);
  const { data } = useQuery({
    queryKey: ["public-hero-carousel"],
    queryFn: () => fetchSlides(),
    staleTime: 60_000,
  });

  const slides: Slide[] = ((data as Slide[] | undefined)?.length ?? 0) > 0 ? (data as Slide[]) : FALLBACK;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clamp index when slides change
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  // Autoplay (advance every 6s when video missing, otherwise on video end)
  useEffect(() => {
    if (paused) return;
    const current = slides[index];
    if (current?.video_url) return; // video drives transition via onEnded
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 6000);
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
      className="relative w-full aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] rounded-[24px] overflow-hidden shadow-2xl bg-stone-900 group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Media */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={i !== index}
        >
          {s.video_url ? (
            <video
              src={i === index ? s.video_url : undefined}
              poster={s.image_url || undefined}
              className={`w-full h-full object-cover transition-transform duration-[8000ms] ease-linear ${
                i === index && !paused ? "scale-110" : "scale-100"
              }`}
              autoPlay={i === index}
              muted
              loop={slides.length === 1}
              playsInline
              preload={i === index ? "auto" : "none"}
              onEnded={() => slides.length > 1 && next()}
              onError={(e) => {
                // hide broken video; image fallback below shows through
                (e.currentTarget as HTMLVideoElement).style.display = "none";
              }}
            />
          ) : null}
          {(!s.video_url || true) && s.image_url ? (
            <img
              src={s.image_url}
              alt={s.title}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] ease-linear ${
                i === index && !paused ? "scale-110" : "scale-100"
              } ${s.video_url ? "-z-10" : ""}`}
              loading={i === index ? "eager" : "lazy"}
              referrerPolicy="no-referrer"
            />
          ) : null}
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 pointer-events-none" />

      {/* Copy */}
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10 text-white z-10">
        <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-gold-400 font-bold mb-3">
          Scenzzy Collection
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight uppercase tracking-tight">
          {current.title}
        </h3>
        {current.subtitle && (
          <p className="mt-2 text-sm sm:text-base text-white/80 max-w-md font-light">
            {current.subtitle}
          </p>
        )}
        {current.button_text && current.button_link && (
          <a
            href={current.button_link}
            className="inline-flex items-center gap-2 mt-5 bg-white text-neutral-900 hover:bg-gold-500 hover:text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md"
          >
            <Play className="h-3.5 w-3.5" /> {current.button_text}
          </a>
        )}
      </div>

      {/* Nav arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Slide anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Próximo slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-white/80 hover:bg-white text-neutral-900 flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir para slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
