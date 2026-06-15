import React from 'react';
import { Instagram, ArrowRight, Sparkles, MessageCircle, Heart, Star } from 'lucide-react';
import { Product } from '../types';

interface BentoCampanhaProps {
  key?: string | number;
  products: Product[];
  onSelect: (product: Product) => void;
}

export default function BentoCampanha({ products, onSelect }: BentoCampanhaProps) {
  const featured = products.filter(p => p.images && p.images.length > 0);
  const primary = featured[0];
  const secondary = featured[1] || featured[0];
  if (!primary) return null;
  const fallback = "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=500";

  return (
    <section className="py-20 bg-stone-100 text-stone-900 px-4 sm:px-6 lg:px-8 relative border-t border-stone-200" id="campaign-bento">
      <div className="absolute top-1/3 right-1/4 h-96 w-96 rounded-full bg-gold-200/20 filter blur-[100px] pointer-events-none select-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        <div className="text-center lg:text-left space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold font-display">STYLE EDITORIAL</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight leading-none uppercase">
            CONHEÇA NOSSAS PROMOÇÕES
          </h2>
          <div className="h-0.5 w-16 bg-gold-400 mt-2 mx-auto lg:mx-0" />
        </div>

        {/* Bento Grid Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Card 1: Highlight Shoe */}
          <div
            onClick={() => onSelect(primary)}
            className="group cursor-pointer bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-lg transition-all duration-300 hover:border-gold-300 hover:shadow-xl flex flex-col justify-between"
          >
            <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
              <img
                src={primary.images[0] || fallback}
                alt={primary.name}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-[9px] uppercase tracking-widest text-gold-400 font-bold block mb-1">Peça Chave</span>
                <h3 className="font-serif text-xl font-bold leading-tight mb-2 uppercase">{primary.name}</h3>
                <p className="text-xs text-stone-200 leading-normal line-clamp-2">
                  Elegância atemporal. O clássico indispensável para montar looks incrivéis tanto no dia quanto à noite.
                </p>
              </div>
            </div>
            <div className="p-6 bg-white flex items-center justify-between border-t border-stone-100">
              <span className="text-xs uppercase tracking-widest font-semibold font-display text-neutral-900 group-hover:translate-x-1.5 group-hover:text-gold-500 transition-all duration-300 inline-flex items-center gap-1.5">
                Ver detalhes <ArrowRight className="h-4 w-4" />
              </span>
              <span className="font-mono text-sm font-bold text-neutral-900">
                {primary.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          {/* Card 3: Highlight Bag */}
          <div
            onClick={() => onSelect(products[1] || products[4])}
            className="group cursor-pointer bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-lg transition-all duration-300 hover:border-gold-300 hover:shadow-xl flex flex-col justify-between"
          >
            <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
              <img
                src={(products[1] || products[4]).images[0]}
                alt="Saffiano Gold Bag"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <span className="text-[9px] uppercase tracking-widest text-gold-400 font-bold block mb-1">Acessório da Estação</span>
                <h3 className="font-serif text-xl font-bold leading-tight mb-2 uppercase">{(products[1] || products[4]).name}</h3>
                <p className="text-xs text-stone-200 leading-normal line-clamp-2">
                  Acabamento premium estruturado combinado com detalhes metálicos sofisticados.
                </p>
              </div>
            </div>
            <div className="p-6 bg-white flex items-center justify-between border-t border-stone-100">
              <span className="text-xs uppercase tracking-widest font-semibold font-display text-neutral-900 group-hover:translate-x-1.5 group-hover:text-gold-500 transition-all duration-300 inline-flex items-center gap-1.5">
                Ver detalhes <ArrowRight className="h-4 w-4" />
              </span>
              <span className="font-mono text-sm font-bold text-neutral-900">
                {(products[1] || products[4]).price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
