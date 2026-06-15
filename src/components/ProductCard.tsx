import React, { useState } from 'react';
import { Eye, ShoppingBag, Heart, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onAddToCart: (product: Product, size: string) => void;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onSelect }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const calculateDiscount = () => {
    if (!product.originalPrice) return null;
    const diff = product.originalPrice - product.price;
    const pct = Math.round((diff / product.originalPrice) * 100);
    return pct;
  };

  const discountPct = calculateDiscount();

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-3xl overflow-hidden border border-stone-100 hover:border-gold-200/50 hover:shadow-2xl transition-all duration-300 flex flex-col h-full cursor-pointer relative"
    >
      {/* Visual Badge for Discount */}
      {discountPct && (
        <span className="absolute top-4 left-4 z-10 bg-red-600 text-stone-100 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full">
          {discountPct}% OFF
        </span>
      )}

      {/* Like Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsLiked(!isLiked);
        }}
        className="absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full text-neutral-800 hover:text-red-500 hover:scale-110 active:scale-95 transition-all shadow-md focus:outline-none"
        aria-label="Curtir"
      >
        <Heart className={`h-4.5 w-4.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
      </button>

      {/* Elegant Product Frame */}
      <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden group/slider">
        <div 
          className="w-full h-full flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
          {product.images.map((img, idx) => (
            <div key={idx} className="w-full h-full flex-shrink-0 relative">
              <img
                src={img}
                alt={`${product.name} - imagem ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>

        {/* Dots Indicator */}
        {product.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 z-20" onClick={(e) => e.stopPropagation()}>
            {product.images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                  currentImageIndex === idx 
                    ? 'bg-neutral-900 w-3 shadow-md' 
                    : 'bg-stone-300 hover:bg-stone-400 opacity-80'
                }`}
                aria-label={`Ver imagem ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Next/Prev buttons on hover */}
        {product.images.length > 1 && (
          <>
            <button 
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-stone-600 rounded-full w-6 h-6 flex items-center justify-center shadow-sm opacity-0 group-hover/slider:opacity-100 transition-opacity focus:outline-none z-20"
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : product.images.length - 1)); }}
            >
              <span className="sr-only">Anterior</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-stone-600 rounded-full w-6 h-6 flex items-center justify-center shadow-sm opacity-0 group-hover/slider:opacity-100 transition-opacity focus:outline-none z-20"
              onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev < product.images.length - 1 ? prev + 1 : 0)); }}
            >
              <span className="sr-only">Próxima</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        {/* Hover Action Layer */}
        <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
          <span className="bg-white/95 backdrop-blur-md text-[11px] uppercase tracking-widest font-semibold px-5 py-2.5 rounded-full text-neutral-900 shadow-md group-hover:translate-y-0 translate-y-3 transition-transform duration-300 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Detalhes
          </span>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-1">
                {(product.category === 'tenis' || product.category === 'salto') ? 'Calçado Premium' : (product.category === 'cinto' ? 'Acessórios' : 'Bolsa de Luxo')}
              </p>
              <h3 className="font-serif text-lg font-bold text-neutral-900 group-hover:text-gold-500 transition-colors leading-tight">
                {product.name}
              </h3>
            </div>
          </div>

          {/* Product Features Indicator */}
          {product.features && (
            <div className="mt-3 bg-stone-50 rounded-xl p-2.5 border border-stone-100 space-y-1">
              <span className="text-[9px] uppercase tracking-widest text-gold-500 font-bold block mb-1">Detalhes do Produto:</span>
              <p className="text-[10px] text-stone-600 line-clamp-2 leading-relaxed">
                {product.features.join(' • ')}
              </p>
            </div>
          )}

          {/* Dimensions for bags */}
          {product.category === 'bolsa' && product.dimensions && (
            <p className="text-[10px] text-stone-500 font-mono mt-2">
              Dimensões: {product.dimensions}
            </p>
          )}

          {/* Luxury size options selection dots */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mr-1">Tamanho:</span>
            {product.sizes.map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                className={`text-[9px] uppercase tracking-widest font-bold border rounded-lg px-2.5 py-1 transition-all ${
                  selectedSize === sz
                    ? 'bg-neutral-900 text-stone-50 border-neutral-900 shadow-sm'
                    : 'bg-stone-50 text-neutral-800 border-stone-200 hover:border-neutral-400'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing tag & Actions bar */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold block">Valor</span>
            <div className="text-right">
              {product.originalPrice && (
                <span className="text-xs text-stone-400 line-through mr-2 font-mono">
                  {product.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              )}
              <span className="font-mono text-base font-bold text-neutral-900">
                {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {/* AI Advisor Assistant helper button */}
            {(product.category === 'tenis' || product.category === 'salto') && (
              <button
                onClick={() => onOpenAIHelper(product)}
                className="bg-stone-100 hover:bg-gold-50 hover:text-gold-500 text-neutral-800 p-2.5 rounded-xl border border-stone-200 hover:border-gold-200 transition-all focus:outline-none flex items-center justify-center relative group/btn"
                title="Conselheiro de Estilo Inteligente"
                aria-label="Sugestão I.A. de Estilo"
              >
                <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-stone-900 text-stone-100 text-[9px] py-1 px-2 rounded-md tracking-wider opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none select-none uppercase font-display">
                  Guia de Estilo I.A.
                </span>
              </button>
            )}

            {/* Main Add Button */}
            <button
              onClick={handleAddClick}
              disabled={justAdded}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all focus:outline-none ${
                justAdded
                  ? 'bg-emerald-600 text-stone-100 border border-emerald-600'
                  : 'bg-neutral-900 active:scale-98 text-stone-50 hover:bg-gold-500 border border-neutral-900 hover:border-gold-500 shadow-md hover:shadow-lg'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4" /> Adicionado
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" /> Comprar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
