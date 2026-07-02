import React, { useState } from 'react';
import { MapPin, Search, Navigation, Info, ShoppingBag, Instagram, Heart, MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import { STORES_PICKUP } from '../data/catalog';
import { toast } from 'sonner';
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getInstagramFeed } from '../lib/storefront.functions';

// Coordenadas aproximadas das capitais brasileiras para fallback rápido e confiável
const STATE_COORDS: Record<string, { lat: number; lng: number }> = {
  AC: { lat: -9.9754, lng: -67.8081 },
  AL: { lat: -9.6658, lng: -35.7350 },
  AP: { lat: 0.0355, lng: -51.0705 },
  AM: { lat: -3.1190, lng: -60.0217 },
  BA: { lat: -12.9714, lng: -38.5014 },
  CE: { lat: -3.7319, lng: -38.5267 },
  DF: { lat: -15.7801, lng: -47.9292 },
  ES: { lat: -20.3155, lng: -40.3128 },
  GO: { lat: -16.6869, lng: -49.2648 },
  MA: { lat: -2.5307, lng: -44.3068 },
  MT: { lat: -15.6010, lng: -56.0974 },
  MS: { lat: -20.4697, lng: -54.6201 },
  MG: { lat: -19.9173, lng: -43.9345 },
  PA: { lat: -1.4558, lng: -48.4902 },
  PB: { lat: -7.1195, lng: -34.8450 },
  PR: { lat: -25.4290, lng: -49.2671 },
  PE: { lat: -8.0539, lng: -34.8813 },
  PI: { lat: -5.0920, lng: -42.8034 },
  RJ: { lat: -22.9068, lng: -43.1729 },
  RN: { lat: -5.7945, lng: -35.2110 },
  RS: { lat: -30.0346, lng: -51.2177 },
  RO: { lat: -8.7612, lng: -63.9039 },
  RR: { lat: 2.8235, lng: -60.6758 },
  SC: { lat: -27.5954, lng: -48.5480 },
  SP: { lat: -23.5505, lng: -46.6333 },
  SE: { lat: -10.9472, lng: -37.0731 },
  TO: { lat: -10.1844, lng: -48.3336 }
};

// Coordenadas exatas das lojas
const STORES_WITH_COORDS = [
  {
    id: 'st-01',
    name: 'Scenzzy Boutique Campina Grande',
    address: 'Av. Almirante Barroso, 1980 Loja 08 Cruzeiro, Campina Grande - PB',
    cep: '58415-670',
    coords: { lat: -7.2223, lng: -35.9080 }
  }
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distância em km
  return d;
}

export default function StoreFinder() {
  const [userCep, setUserCep] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchedStore, setMatchedStore] = useState<any | null>(null);
  const [otherStores, setOtherStores] = useState<any[]>([]);

  const fetchInsta = useServerFn(getInstagramFeed);
  const { data: instaFeed } = useQuery({
    queryKey: ["instagram-feed"],
    queryFn: () => fetchInsta("scenzzy"),
    staleTime: 60_000,
  });

  const handleSearchCEP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = userCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error("Por favor, digite um CEP válido com 8 dígitos.");
      return;
    }

    setLoading(true);
    try {
      // 1. Buscar dados de endereço do ViaCEP
      const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!viaCepRes.ok) {
        throw new Error("Não foi possível consultar o CEP no momento.");
      }
      const viaCepData = await viaCepRes.json();
      if (viaCepData.erro) {
        throw new Error("CEP não encontrado. Por favor, verifique os dígitos.");
      }

      const { uf, localidade, bairro, logradouro } = viaCepData;

      // 2. Geocodificar via OpenStreetMap Nominatim
      let lat = 0;
      let lng = 0;
      let geocoded = false;

      try {
        const addressQuery = `${logradouro || ''}, ${bairro || ''}, ${localidade}, ${uf}, Brasil`;
        const nominatimRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`,
          { headers: { 'User-Agent': 'ScenzzyApp/1.0' } }
        );
        if (nominatimRes.ok) {
          const nominatimData = await nominatimRes.json();
          if (nominatimData && nominatimData.length > 0) {
            lat = parseFloat(nominatimData[0].lat);
            lng = parseFloat(nominatimData[0].lon);
            geocoded = true;
          }
        }
      } catch (geoErr) {
        console.error("Nominatim geocoding failed, falling back to state coords:", geoErr);
      }

      // Se falhar a geolocalização exata, usamos o fallback da capital do estado para garantir funcionamento
      if (!geocoded) {
        const state = uf?.toUpperCase();
        if (STATE_COORDS[state]) {
          lat = STATE_COORDS[state].lat;
          lng = STATE_COORDS[state].lng;
          geocoded = true;
        } else {
          // Fallback global de São Paulo
          lat = -23.5505;
          lng = -46.6333;
        }
      }

      // 3. Calcular distâncias e ordenar
      const sortedStores = STORES_WITH_COORDS.map(store => {
        const dist = calculateDistance(lat, lng, store.coords.lat, store.coords.lng);
        return {
          ...store,
          distanceValue: dist,
          distance: dist < 1 ? `${(dist * 1000).toFixed(0)}m de você` : `${dist.toFixed(1)} km de você`
        };
      }).sort((a, b) => a.distanceValue - b.distanceValue);

      setMatchedStore(sortedStores[0]);
      setOtherStores(sortedStores.slice(1));
      setSearched(true);
      toast.success(`CEP localizado! O lounge mais próximo fica a ${sortedStores[0].distance}.`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao buscar informações do CEP.");
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não é suportada por este navegador.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const sortedStores = STORES_WITH_COORDS.map(store => {
          const dist = calculateDistance(lat, lng, store.coords.lat, store.coords.lng);
          return {
            ...store,
            distanceValue: dist,
            distance: dist < 1 ? `${(dist * 1000).toFixed(0)}m de você` : `${dist.toFixed(1)} km de você`
          };
        }).sort((a, b) => a.distanceValue - b.distanceValue);

        setMatchedStore(sortedStores[0]);
        setOtherStores(sortedStores.slice(1));
        setSearched(true);
        setLoading(false);
        toast.success("Sua localização atual foi obtida com sucesso!");
      },
      (error) => {
        console.error(error);
        setLoading(false);
        toast.error("Não foi possível obter sua localização. Por favor, digite seu CEP.");
        // Fallback para o primeiro lounge se der erro na permissão
        const defaultStores = STORES_PICKUP.map(s => ({
          ...s,
          distance: s.distance // manter distância estática padrão
        }));
        setMatchedStore(defaultStores[0]);
        setOtherStores(defaultStores.slice(1));
        setSearched(true);
      }
    );
  };

  return (
    <section className="py-16 bg-stone-100 border-y border-stone-200" id="near-you">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Descriptive text block */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-gold-500 font-bold text-xs uppercase tracking-widest">
              <MapPin className="h-4.5 w-4.5" /> Scenzzy Lounge Locator
            </div>
            <h2 className="font-serif text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight uppercase">
              SCENZZY PERTO DE VOCÊ
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed font-sans font-light">
              Prefere sentir o aroma pessoalmente ou retirar imediatamente sem frete? Busque os Lounges Scenzzy mais próximos. Oferecemos estojos de experimentação grátis no local e consultoria sensorial exclusiva.
            </p>

            <div className="pt-2">
              <button
                onClick={handleUseLocation}
                disabled={loading}
                className="w-full sm:max-w-md bg-neutral-900 text-white rounded-xl py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:bg-gold-500 focus:outline-none disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 animate-pulse" />} Utilizar localização atual
              </button>

              <div className="flex items-center gap-2 my-4 sm:max-w-md">
                <div className="h-px bg-stone-300 flex-1"></div>
                <span className="text-[10px] uppercase text-stone-400 font-bold tracking-widest">ou busque</span>
                <div className="h-px bg-stone-300 flex-1"></div>
              </div>

              <form onSubmit={handleSearchCEP} className="flex gap-2 sm:max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Seu CEP (ex: 01424-001)"
                    value={userCep}
                    disabled={loading}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      let res = val;
                      if (val.length > 5) {
                        res = `${val.slice(0, 5)}-${val.slice(5, 8)}`;
                      }
                      setUserCep(res);
                    }}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-gold-500 rounded-lg py-2.5 pl-9 pr-3 text-xs focus:outline-none placeholder-stone-400 font-mono shadow-sm disabled:opacity-75"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white hover:bg-stone-50 border border-stone-200 text-neutral-900 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1 min-w-[80px]"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buscar"}
                </button>
              </form>
            </div>

            {/* Results box show */}
            {searched && matchedStore && (
              <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm space-y-4 animate-fade-in sm:max-w-md">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/35">Lounge Mais Próximo</span>
                    <h4 className="font-serif text-base font-bold text-neutral-950 mt-2">{matchedStore.name}</h4>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">{matchedStore.address}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gold-500 bg-gold-50 border border-gold-200/35 px-2.5 py-1 rounded-lg tracking-wider whitespace-nowrap font-mono">{matchedStore.distance}</span>
                </div>

                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/50 flex items-start gap-2.5 text-[11px] text-stone-500 leading-relaxed font-sans">
                  <Info className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                  <span>Você pode selecionar esta loja durante a etapa de entrega do checkout para coletar seu produto sem custos adicionais!</span>
                </div>

                {otherStores.length > 0 && (
                  <div className="border-t border-stone-150 pt-4 mt-2">
                    <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-2.5">Outros Lounges Scenzzy</span>
                    <div className="space-y-3">
                      {otherStores.map((store) => (
                        <div key={store.id} className="flex justify-between items-start text-xs border-b border-stone-50 pb-2 last:border-b-0 last:pb-0">
                          <div className="pr-4">
                            <h5 className="font-medium text-stone-800">{store.name}</h5>
                            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">{store.address}</p>
                          </div>
                          <span className="text-[10px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded tracking-tight shrink-0">{store.distance}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Instagram Community Callout */}
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-lg flex flex-col justify-between relative group/insta overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-pink-200/40 filter blur-[80px] pointer-events-none select-none" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 rounded-full flex items-center justify-center p-[2px] shadow-sm">
                    <div className="bg-white w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                      {instaFeed?.profilePic ? (
                        <img src={instaFeed.profilePic} alt={instaFeed.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="font-serif text-xs font-bold text-neutral-900">
                          {instaFeed?.username ? instaFeed.username.slice(0, 2).toUpperCase() : "Sc"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-sans text-neutral-900">@{instaFeed?.username || "scenzzy"}</h4>
                    <p className="text-[9px] text-stone-500 font-sans">
                      {instaFeed?.followersCount 
                        ? `${(instaFeed.followersCount / 1000).toFixed(1)}k seguidores` 
                        : "Instagram Oficial"
                      }
                    </p>
                  </div>
                </div>
                <Instagram className="h-5 w-5 text-stone-400 group-hover/insta:text-pink-500 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(instaFeed?.posts || [
                  { id: 0, imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300", likes: 180, comments: 12 },
                  { id: 1, imageUrl: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=300", likes: 227, comments: 19 },
                  { id: 2, imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300", likes: 274, comments: 26 },
                  { id: 3, imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=300", likes: 321, comments: 33 }
                ]).map((post: any, i: number) => (
                  <div key={post.id || i} className="aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200 relative group cursor-pointer">
                    <img
                      src={post.imageUrl}
                      alt={`Insta feed ${i}`}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-stone-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in">
                      <div className="flex gap-3 text-[10px] font-semibold text-white">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3 fill-white" /> {post.likes}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3 fill-white" /> {post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <blockquote className="text-xs text-stone-600 italic leading-relaxed text-center font-serif">
                "{instaFeed?.bio || "Sapatos elegantes e bolsas estruturadas com acabamento primoroso. Curadoria Scenzzy."}"
              </blockquote>
            </div>

            <div className="pt-6 relative z-10">
              <a
                href={`https://www.instagram.com/${instaFeed?.username || "scenzzy"}/`}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full bg-white hover:bg-neutral-900 text-neutral-900 hover:text-white py-3.5 rounded-xl text-xs font-semibold uppercase tracking-widest text-center flex items-center justify-center gap-2 border border-stone-300 transition-all focus:outline-none shadow-sm hover:shadow-md"
              >
                Seguir no Instagram <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
