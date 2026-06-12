import React, { useState } from 'react';
import { MapPin, Search, Navigation, Info, ShoppingBag, Instagram, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { STORES_PICKUP } from '../data';

export default function StoreFinder() {
  const [userCep, setUserCep] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedStore, setMatchedStore] = useState<typeof STORES_PICKUP[0] | null>(null);

  const handleSearchCEP = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = userCep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setSearched(true);
      // Deterministically match store based on CEP parity
      const index = parseInt(cleanCep[0]) % STORES_PICKUP.length;
      setMatchedStore(STORES_PICKUP[index]);
    }
  };

  const handleUseLocation = () => {
    setSearched(true);
    setMatchedStore(STORES_PICKUP[0]); // Default to first store
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
                className="w-full sm:max-w-md bg-neutral-900 text-white rounded-xl py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:bg-gold-500 focus:outline-none"
              >
                <Navigation className="h-4 w-4 animate-pulse" /> Utilizar localização atual
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
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      let res = val;
                      if (val.length > 5) {
                        res = `${val.slice(0, 5)}-${val.slice(5, 8)}`;
                      }
                      setUserCep(res);
                    }}
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-gold-500 rounded-lg py-2.5 pl-9 pr-3 text-xs focus:outline-none placeholder-stone-400 font-mono shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-white hover:bg-stone-50 border border-stone-200 text-neutral-900 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Buscar
                </button>
              </form>
            </div>

            {/* Results box show */}
            {searched && matchedStore && (
              <div className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm space-y-4 animate-fade-in sm:max-w-md">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/35">Lounge Encontrado</span>
                    <h4 className="font-serif text-base font-bold text-neutral-950 mt-2">{matchedStore.name}</h4>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">{matchedStore.address}</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-gold-500 bg-gold-50 border border-gold-200/35 px-2.5 py-1 rounded-lg tracking-wider whitespace-nowrap font-mono">{matchedStore.distance}</span>
                </div>

                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/50 flex items-start gap-2.5 text-[11px] text-stone-500 leading-relaxed font-sans">
                  <Info className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                  <span>Você pode selecionar esta loja durante a etapa de entrega do checkout para coletar seu produto sem custos adicionais!</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Instagram Community Callout */}
          <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-lg flex flex-col justify-between relative group/insta overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-pink-200/40 filter blur-[80px] pointer-events-none select-none" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 bg-radial from-pink-500 via-red-500 to-yellow-500 rounded-full flex items-center justify-center p-[2px] shadow-sm">
                    <div className="bg-white w-full h-full rounded-full flex items-center justify-center">
                      <span className="font-serif text-xs font-bold text-neutral-900">Sc</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-sans text-neutral-900">@scenzzy</h4>
                    <p className="text-[9px] text-stone-500">Instagram Oficial</p>
                  </div>
                </div>
                <Instagram className="h-5 w-5 text-stone-400 group-hover/insta:text-pink-500 transition-colors" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=300",
                  "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=300",
                  "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=300",
                  "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=300"
                ].map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200 relative group cursor-pointer">
                    <img
                      src={img}
                      alt={`Insta feed ${i}`}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-stone-900/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-3 text-[10px] font-semibold text-white">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3 fill-white" /> {Math.floor(Math.random() * 500) + 100}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3 fill-white" /> {Math.floor(Math.random() * 50) + 5}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <blockquote className="text-xs text-stone-600 italic leading-relaxed text-center font-serif">
                "Uma experiência inexplicável de elegância. Os detalhes em couro são incrivelmente sofisticados. Absolutamente apaixonada!"
              </blockquote>
            </div>

            <div className="pt-6 relative z-10">
              <a
                href="https://www.instagram.com/scenzzy/"
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
