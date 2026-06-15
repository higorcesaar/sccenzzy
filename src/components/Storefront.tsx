import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import Header from './Header';
import ProductCard from './ProductCard';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import CampaignBanner from './CampaignBanner';
import BentoCampanha from './BentoCampanha';
import StoreFinder from './StoreFinder';
import ProductDetailModal from './ProductDetailModal';
import { Product, CartItem } from '../types';
import { listPublicProducts } from '../lib/storefront.functions';
import { Sparkles, ArrowRight, Instagram, Mail, ShieldCheck, Heart, Star, Award, AwardIcon, Compass, Anchor, Check } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { AnimatePresence } from 'motion/react';

export default function Storefront({ view = 'home' }: { view?: 'home' | 'novidades' | 'sapatos' | 'bolsas' | 'cintos' | 'promocao' }) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const homeSections = [
    'hero',
    'offers',
    'tenis',
    'saltos',
    'campaign_banner',
    'bolsas',
    'acessorios',
    'cintos',
    'bento',
    'store_finder'
  ];

  // Cart Management
  const handleAddToCart = (product: Product, size: string) => {
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedSize === size);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, selectedSize: size, quantity: 1 }];
    });
    addToast(`${product.name} (Tamanho ${size}) foi adicionado à sacola de compras!`, 'cart', 'Sacola Atualizada');
  };

  const handleUpdateQuantity = (id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id, size);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === id && item.selectedSize === size
        ? { ...item, quantity }
        : item
    ));
  };

  const handleRemoveItem = (id: string, size: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === id && item.selectedSize === size)));
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleOpenAIHelper = (product: Product) => {
    setSurveyProduct(product);
    setIsAIHelperOpen(true);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.includes('@')) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  // Compute Prices
  const getSubtotal = () => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  };

  const subtotal = getSubtotal();
  const [activeCoupon, setActiveCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  const handleTriggerCheckout = (coupon: string, discountAmount: number) => {
    if (!user) {
      addToast('Por favor, faça login em sua conta para prosseguir com a finalização de compra.', 'info', 'Autenticação Necessária');
      setIsCartOpen(false);
      navigate({ to: '/login' });
      return;
    }
    setActiveCoupon(coupon);
    setCouponDiscount(discountAmount);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Live catalog from Supabase — 100% dinâmico.
  const fetchPublic = useServerFn(listPublicProducts);
  const { data: dbProducts = [] } = useQuery({
    queryKey: ['public-products', 'home'],
    queryFn: () => fetchPublic(),
    staleTime: 30_000,
  });
  const mergedCatalog: Product[] = (dbProducts as Product[]) ?? [];

  const filteredProducts = mergedCatalog.filter(p => {
    if (!searchTerm) return true;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const tenisList = filteredProducts.filter(p => p.category === 'tenis');
  const saltosList = filteredProducts.filter(p => p.category === 'salto');
  const bolsasList = filteredProducts.filter(p => p.category === 'bolsa');
  const acessoriosList = filteredProducts.filter(p => p.category === 'acessorio');
  const cintosList = filteredProducts.filter(p => p.category === 'cinto');

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return (
          <section key="hero" className="relative overflow-hidden bg-[#F7F5F0] text-neutral-900 min-h-[85vh] flex items-center justify-center py-16 px-4" id="boutique-hero">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-gold-200/30 filter blur-[140px] pointer-events-none select-none" />
            <div className="absolute bottom-10 right-10 h-[300px] w-[300px] rounded-full bg-white/50 filter blur-[100px] pointer-events-none select-none animate-pulse" />

            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white border border-stone-200 backdrop-blur-md px-3.5 py-1.5 rounded-full text-gold-500 text-[10px] uppercase font-bold tracking-widest leading-none shadow-sm">
                  <Sparkles className="h-3 w-3 animate-spin text-gold-500" /> Essências de alta elegância & estilo
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-extrabold text-neutral-900 leading-tight uppercase tracking-tight">
                  SCENZZY <b className="text-gold-500">SHOES</b>
                </h1>

                <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-xl mx-auto lg:mx-0 font-sans font-light">
                  Explore nossa boutique exclusiva de sapatos selecionados e bolsas sofisticadas. Projetados meticulosamente para realçar o conforto, sofisticação e estilo minimalista moderno.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link to="/sapatos" className="w-full sm:w-auto bg-neutral-900 text-white border border-neutral-900 hover:bg-gold-500 hover:border-gold-500 px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none flex items-center justify-center gap-2">
                    Comprar Tênis <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/bolsas" className="w-full sm:w-auto bg-white text-neutral-900 border border-stone-300 hover:border-neutral-900 px-8 py-4 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all duration-300 focus:outline-none flex items-center justify-center">
                    Ver Bolsas
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-10 border-t border-stone-200 max-w-sm mx-auto lg:mx-0">
                  <div>
                    <span className="font-serif font-black text-2xl text-gold-500 block">Alta</span>
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Qualidade</span>
                  </div>
                  <div className="border-l border-stone-200 pl-6">
                    <span className="font-serif font-black text-2xl text-gold-500 block">100%</span>
                    <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Couro Legítimo</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 flex justify-center items-center w-full py-8 lg:py-0">
                <div className="grid grid-cols-2 gap-4 sm:gap-5 w-full max-w-lg">
                  {/* Tênis */}
                  <div onClick={() => tenisList[0] && handleProductSelect(tenisList[0])} className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl bg-white group transform hover:-translate-y-1 transition-all duration-500 cursor-pointer text-left">
                    <img src={tenisList[0]?.images[0] || "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=500"} alt="Tênis" className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
                    <div className="absolute bottom-5 left-4 right-4 text-white">
                      <span className="text-[9px] uppercase tracking-widest text-gold-400 font-bold block mb-1">Coleção</span>
                      <h3 className="font-serif text-base sm:text-lg font-bold uppercase tracking-wide">Tênis</h3>
                    </div>
                  </div>

                  {/* Bolsas */}
                  <div onClick={() => bolsasList[0] && handleProductSelect(bolsasList[0])} className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl bg-white group transform translate-y-8 hover:translate-y-7 transition-all duration-500 cursor-pointer text-left">
                    <img src={bolsasList[0]?.images[0] || "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=500"} alt="Bolsas" className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
                    <div className="absolute bottom-5 left-4 right-4 text-white">
                      <span className="text-[9px] uppercase tracking-widest text-gold-400 font-bold block mb-1">Elegância</span>
                      <h3 className="font-serif text-base sm:text-lg font-bold uppercase tracking-wide">Bolsas</h3>
                    </div>
                  </div>

                  {/* Saltos */}
                  <div onClick={() => saltosList[0] && handleProductSelect(saltosList[0])} className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl bg-white group transform hover:-translate-y-1 transition-all duration-500 cursor-pointer text-left">
                    <img src={saltosList[0]?.images[0] || "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=500"} alt="Saltos" className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
                    <div className="absolute bottom-5 left-4 right-4 text-white">
                      <span className="text-[9px] uppercase tracking-widest text-gold-400 font-bold block mb-1">Sofisticação</span>
                      <h3 className="font-serif text-base sm:text-lg font-bold uppercase tracking-wide">Saltos</h3>
                    </div>
                  </div>

                  {/* Cintos */}
                  <div onClick={() => cintosList[0] && handleProductSelect(cintosList[0])} className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl bg-white group transform translate-y-8 hover:translate-y-7 transition-all duration-500 cursor-pointer text-left">
                    <img src={cintosList[0]?.images[0] || "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=500"} alt="Cintos" className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />
                    <div className="absolute bottom-5 left-4 right-4 text-white">
                      <span className="text-[9px] uppercase tracking-widest text-gold-400 font-bold block mb-1">Acessórios</span>
                      <h3 className="font-serif text-base sm:text-lg font-bold uppercase tracking-wide">Cintos</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      case 'offers':
        return (
          <section key="offers" className="bg-white py-6 border-b border-stone-200">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-stone-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-emerald-600 rounded-full animate-ping" />
                <span>● 10% OFF VOUCHER ATIVO: <strong className="text-neutral-900 font-bold font-display">SCENZZY10</strong></span>
              </div>
              <div className="h-px w-8 bg-stone-300 hidden md:block" />
              <span>🎁 Brinde exclusivo na compra de qualquer calçado em couro legítimo</span>
              <div className="h-px w-8 bg-stone-300 hidden md:block" />
              <a href="https://www.instagram.com/scenzzy/" target="_blank" rel="noreferrer" className="hover:text-gold-500 flex items-center gap-1">
                <Instagram className="h-4 w-4" /> INSTAGRAM @SCENZZY
              </a>
            </div>
          </section>
        );
      case 'tenis':
        return (
          <section key="tenis" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="tenis">
            <div className="text-center space-y-3 mb-16">
              <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold font-display">TÊNIS & SNEAKERS</p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-none">COLEÇÃO DE TÊNIS</h2>
              <div className="h-0.5 w-16 bg-gold-400 mt-2 mx-auto" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {tenisList.map((item, index) => (
                <ProductCard key={`${item.id}-${index}`} product={item} onAddToCart={handleAddToCart} onSelect={handleProductSelect} />
              ))}
            </div>
          </section>
        );
      case 'saltos':
        return (
          <section key="saltos" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="saltos">
            <div className="text-center space-y-3 mb-16">
              <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold font-display">ELEGÂNCIA & SOFISTICAÇÃO</p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-none">COLEÇÃO DE SALTOS</h2>
              <div className="h-0.5 w-16 bg-gold-400 mt-2 mx-auto" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {saltosList.map((item, index) => (
                <ProductCard key={`${item.id}-${index}`} product={item} onAddToCart={handleAddToCart} onSelect={handleProductSelect} />
              ))}
            </div>
          </section>
        );
      case 'campaign_banner':
        return <CampaignBanner key="campaign_banner" />;
      case 'bolsas':
        return (
          <section key="bolsas" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="bolsas">
            <div className="text-center space-y-3 mb-16">
              <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold font-display">ESTILO DE ALTO PADRÃO</p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-none">BOLSAS</h2>
              <div className="h-0.5 w-16 bg-gold-400 mt-2 mx-auto" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {bolsasList.map((item, index) => (
                <ProductCard key={`${item.id}-${index}`} product={item} onAddToCart={handleAddToCart} onSelect={handleProductSelect} />
              ))}
            </div>
          </section>
        );
      case 'cintos':
        return (
          <section key="cintos" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="cintos">
            <div className="text-center space-y-3 mb-16">
              <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold font-display">MARCANTE E ESSENCIAL</p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-none">CINTOS FEMININOS</h2>
              <div className="h-0.5 w-16 bg-gold-400 mt-2 mx-auto" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {cintosList.map((item, index) => (
                <ProductCard key={`${item.id}-${index}`} product={item} onAddToCart={handleAddToCart} onSelect={handleProductSelect} />
              ))}
            </div>
          </section>
        );
      case 'acessorios':
        return (
          <section key="acessorios" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="acessorios">
            <div className="text-center space-y-3 mb-16">
              <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold font-display">DETALHES QUE IMPORTAM</p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-none">ACESSÓRIOS</h2>
              <div className="h-0.5 w-16 bg-gold-400 mt-2 mx-auto" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {acessoriosList.map((item, index) => (
                <ProductCard key={`${item.id}-${index}`} product={item} onAddToCart={handleAddToCart} onSelect={handleProductSelect} />
              ))}
            </div>
          </section>
        );
      case 'bento':
        return <BentoCampanha key="bento" products={mergedCatalog} onSelect={handleProductSelect} />;
      case 'store_finder':
        return <StoreFinder key="store_finder" />;
      case 'newsletter':
        return (
          <section key="newsletter" className="bg-[#EBE7E0] text-neutral-900 py-20 px-6 sm:px-10 overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-gold-200/40 filter blur-[120px] pointer-events-none select-none" />
            <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
              <div className="space-y-3">
                <Mail className="h-10 w-10 text-gold-500 mx-auto animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold block font-display">Comunidade VIP Scenzzy</span>
                <h2 className="font-serif text-3xl sm:text-4xl font-black text-neutral-900 uppercase leading-none">RECEBA NOSSAS TENDÊNCIAS</h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans font-light">
                  Assine nossa newsletter prioritária para obter convites de lançamentos privados, insights de moda do nosso estúdio de design e 10% de cashback adicional no seu e-mail!
                </p>
              </div>
              {subscribed ? (
                <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-2xl p-4 text-xs font-semibold tracking-wide flex justify-center items-center gap-2 animate-bounce">
                  <Check className="h-4 w-4" /> Bem-vindo! Verifique sua caixa de entrada para resgatar o voucher de boas-vindas.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input type="email" required placeholder="Informe seu e-mail preferido" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="flex-1 bg-white border border-stone-300 rounded-xl px-5 py-4 text-neutral-900 text-xs focus:ring-1 focus:ring-gold-500 focus:border-gold-500 focus:outline-none" />
                  <button type="submit" className="bg-neutral-900 hover:bg-gold-500 text-stone-50 hover:text-stone-50 rounded-xl px-8 py-4 text-xs font-bold uppercase tracking-widest transition-colors duration-300">Cadastrar</button>
                </form>
              )}
              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-500 uppercase tracking-widest font-semibold pt-2">
                <ShieldCheck className="h-4.5 w-4.5 text-gold-500" />
                <span>Nós respeitamos sua caixa de entrada. Desative quando desejar.</span>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#FAF9F6] font-sans min-h-screen text-neutral-900 selection:bg-gold-200">
      
      {/* Premium Glassmorphism Header */}
      <Header
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onSearch={handleSearch}
        products={mergedCatalog}
        onProductSelect={handleProductSelect}
      />

      {view === 'home' && (
        <main>{homeSections.map(renderSection)}</main>
      )}
      {view === 'novidades' && (
        <main className="min-h-screen animate-fade-in">
          {renderSection('campaign_banner')}
          {renderSection('bento')}
        </main>
      )}
      {view === 'sapatos' && (
        <main className="min-h-screen pt-10 animate-fade-in">
          {renderSection('tenis')}
        </main>
      )}
      {view === 'bolsas' && (
        <main className="min-h-screen pt-10 animate-fade-in">
          {renderSection('bolsas')}
          {renderSection('acessorios')}
        </main>
      )}
      {view === 'cintos' && (
        <main className="min-h-screen pt-10 animate-fade-in">
          {renderSection('cintos')}
        </main>
      )}
      {view === 'promocao' && (
        <main className="min-h-screen py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
          <div className="text-center space-y-3 mb-16">
            <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold font-display">OFERTAS ESPECIAIS</p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight leading-none">PROMOÇÕES SCENZZY</h2>
            <div className="h-0.5 w-16 bg-gold-400 mt-2 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.filter(p => p.originalPrice).length > 0 ? (
              filteredProducts.filter(p => p.originalPrice).map((item, index) => (
                <ProductCard key={`${item.id}-${index}-promo`} product={item} onAddToCart={handleAddToCart} onSelect={handleProductSelect} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-stone-500 font-sans">
                Nenhuma promoção disponível no momento.
              </div>
            )}
          </div>
          <div className="mt-20">{renderSection('offers')}</div>
        </main>
      )}

      {/* Footer Navigation section */}
      <footer className="bg-white text-stone-600 border-t border-stone-200 py-16 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-xs text-stone-500 pt-4">
          
          <div className="space-y-4">
            <h3 className="font-serif tracking-[0.25em] text-2xl text-neutral-900 font-bold uppercase">SCENZZY</h3>
            <p className="text-[11px] leading-relaxed font-sans font-light">
              Mergulhe no universo luxuoso de calçados exclusivos e bolsas de edição limitada. Moda e elegância em cada detalhe.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/scenzzy/"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-stone-100 border border-stone-200 hover:border-gold-300 text-stone-600 hover:text-neutral-900 rounded-full transition-all"
                title="Instagram oficial"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-display uppercase tracking-widest text-[11px] font-bold text-neutral-900">Coleções</h4>
            <ul className="space-y-2.5 font-light">
              <li><Link to="/sapatos" className="hover:text-gold-500 transition-colors">Coleção Tênis</Link></li>
              <li><Link to="/sapatos" className="hover:text-gold-500 transition-colors">Coleção Saltos</Link></li>
              <li><Link to="/bolsas" className="hover:text-gold-500 transition-colors">Coleção Bolsas</Link></li>
              <li><Link to="/promocao" className="hover:text-gold-500 transition-colors">Acessórios Exclusivos</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display uppercase tracking-widest text-[11px] font-bold text-neutral-900">Institucional</h4>
            <ul className="space-y-2.5 font-light">
              <li><Link to="/" className="hover:text-gold-500 transition-colors">Nossos Lounges de Coleta</Link></li>
              <li><Link to="/novidades" className="hover:text-gold-500 transition-colors">Guia de Presentes</Link></li>
              <li><a href="https://www.instagram.com/scenzzy/" target="_blank" rel="noreferrer" className="hover:text-gold-500 transition-colors">Comunidade Instagram</a></li>
              <li><Link to="/" className="hover:text-gold-500 transition-colors">Política de Privacidade</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-display uppercase tracking-widest text-[11px] font-bold text-neutral-900">Suporte Scenzzy</h4>
            <ul className="space-y-2.5 font-light">
              <li><a href="https://atendimento.arezzo.com.br/hc/pt-br" target="_blank" rel="noreferrer" className="hover:text-gold-500 transition-colors">Central de Atendimento</a></li>
              <li><a href="#near-you" className="hover:text-gold-500 transition-colors">Dúvidas sobre Envio / CEP</a></li>
              <li><a href="#boutique-hero" className="hover:text-gold-500 transition-colors">Acompanhar meu Pedido</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-10 mt-10 border-t border-stone-200 text-center text-[10px] text-stone-500 space-y-2 font-display uppercase tracking-wider font-semibold">
          <p>© 2026 Scenzzy Essential Lifestyle. Todos os direitos reservados. CNPJ: 07.900.208/0077-04 | Cariacica/ES.</p>
          <p className="text-[9px] text-stone-600">Inspirado nos layouts e mecânicas de alta fidelidade visual de Arezzo&amp;Co.</p>
        </div>
      </footer>

      {/* Slide Cart Slider Panel Wrapper */}
      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleTriggerCheckout}
          />
        )}
      </AnimatePresence>

      {/* Integrated Payments Gateway Modal Panel */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        subtotal={subtotal}
        discount={couponDiscount}
        couponCode={activeCoupon}
      />

      {/* AI advisor recommendation assistant panel */}
      <AIHelperModal
        isOpen={isAIHelperOpen}
        onClose={() => setIsAIHelperOpen(false)}
        product={surveyProduct}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
       
      />

    </div>
  );
}
