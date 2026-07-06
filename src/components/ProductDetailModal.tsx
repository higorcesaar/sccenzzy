import React, { useState } from 'react';
import { X, ShoppingBag, Check, Heart, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { ProductMedia } from './ProductMedia';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product, size: string) => void;
}

export default function ProductDetailModal({ isOpen, onClose, product, onAddToCart }: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when product changes
  React.useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Initialize selected size state if not set
  if (!selectedSize) {
    setSelectedSize(product.sizes[0]);
  }

  const handleAddClick = () => {
    onAddToCart(product, selectedSize);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 2000);
  };

  const mediaCount = product.images.length + (product.videoUrl ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="product-detail-modal">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-neutral-900 shadow-md focus:outline-none"
          aria-label="Fechar Detalhes"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Dynamic Image Slider */}
        <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-stone-50 overflow-hidden relative group">
          <div 
            className="w-full h-full flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {product.images.map((image, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0 relative">
                <ProductMedia
                  src={image}
                  alt={`${product.name} - mídia ${idx + 1}`}
                  className="w-full h-full object-cover"
                  autoPlay={idx === currentImageIndex}
                />
              </div>
            ))}
            {product.videoUrl && (
              <div key="video" className="w-full h-full flex-shrink-0 relative">
                <video 
                  src={product.videoUrl} 
                  className="w-full h-full object-cover"
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                />
              </div>
            )}
          </div>

          {/* Dots Indicator */}
          {mediaCount > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-20">
              {Array.from({ length: mediaCount }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none ${
                    currentImageIndex === idx 
                      ? 'bg-neutral-900 w-4 scale-110 shadow-md' 
                      : 'bg-stone-300 hover:bg-stone-400 opacity-60'
                  }`}
                  aria-label={`Ver imagem ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Previous/Next buttons for convenience on hover (desktop mainly) */}
          {mediaCount > 1 && (
            <>
              <button 
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-stone-600 rounded-full w-8 h-8 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none z-20"
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : mediaCount - 1)); }}
              >
                <span className="sr-only">Anterior</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-stone-600 rounded-full w-8 h-8 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none z-20"
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev < mediaCount - 1 ? prev + 1 : 0)); }}
              >
                <span className="sr-only">Próxima</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {product.originalPrice && (
            <span className="absolute top-4 left-4 bg-red-600 text-stone-100 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full shadow-md z-20">
              Oferta Especial
            </span>
          )}
        </div>

        {/* Right Side: Detailed parameters */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-1">
                {(product.category === 'tenis' || product.category === 'salto') ? 'Calçado Premium' : (product.category === 'cinto' ? 'Acessórios' : 'Bolsa Exclusiva')}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-neutral-950 leading-tight">
                {product.name}
              </h2>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                {product.originalPrice && (
                  <span className="text-sm text-stone-400 line-through font-mono">
                    {product.originalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                )}
                <span className="text-2xl font-mono font-bold text-neutral-900">
                  {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-semibold tracking-wider uppercase">
                Ou em até 10x sem juros no cartão de crédito
              </p>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-sans font-light">
              {product.description}
            </p>

            {/* Features specs */}
            {product.features && (
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/50 space-y-3">
                <span className="text-xs uppercase tracking-widest text-gold-500 font-bold block">Ficha Técnica Scenzzy:</span>
                <ul className="text-xs text-stone-600 space-y-1 font-sans">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-gold-500">✦</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sizes list selector */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">Escolha o Tamanho:</span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((sz) => {
                  const szStock = product.sizeStockMap ? (product.sizeStockMap[sz] ?? 0) : (product.stockQty ?? 1);
                  const isSzOut = szStock <= 0;
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`text-xs uppercase tracking-wider font-semibold border rounded-xl px-4 py-2.5 transition-all relative ${
                        selectedSize === sz
                          ? isSzOut
                            ? 'bg-stone-100 text-stone-400 border-stone-300'
                            : 'bg-neutral-900 text-stone-50 border-neutral-900 shadow-md scale-[1.02]'
                          : isSzOut
                          ? 'bg-stone-50 text-stone-400 border-stone-200 line-through opacity-60 hover:border-stone-300'
                          : 'bg-stone-50 text-neutral-800 border-stone-200 hover:border-neutral-400'
                      }`}
                    >
                      {sz}
                      {isSzOut && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Selected size out of stock alert */}
              {product.sizeStockMap && (product.sizeStockMap[selectedSize] ?? 0) <= 0 && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span>Este tamanho ({selectedSize}) encontra-se <strong>em falta</strong> no estoque.</span>
                </div>
              )}
            </div>

            {/* Shipping benefits list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-100">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                <Truck className="h-4.5 w-4.5 text-gold-500" />
                <span>Frete Grátis acima de R$300</span>
              </div>
              <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                <RefreshCw className="h-4.5 w-4.5 text-gold-500" />
                <span>Troca Fácil Garantida</span>
              </div>
              <div className="flex items-center gap-2 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                <span>Boutique de Alta Categoria</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-stone-100">
            {product.sizeStockMap && (product.sizeStockMap[selectedSize] ?? 0) <= 0 ? (
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-semibold uppercase tracking-widest bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none"
              >
                Produto em Falta
              </button>
            ) : (
              <button
                onClick={handleAddClick}
                disabled={justAdded}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-semibold uppercase tracking-widest transition-all focus:outline-none shadow-md hover:shadow-xl ${
                  justAdded
                    ? 'bg-emerald-650 text-stone-100 border border-emerald-650'
                    : 'bg-neutral-900 text-stone-50 hover:bg-gold-500 border border-neutral-900 hover:border-gold-500'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="h-4.5 w-4.5" /> Adicionado à Sacola
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4.5 w-4.5" /> Adicionar à Sacola
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
