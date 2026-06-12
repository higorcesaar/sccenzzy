import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Instagram, Heart, Menu, X, ArrowRight, Sparkles, User as UserIcon, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onSearch: (term: string) => void;
  products: Product[];
  onProductSelect: (product: Product) => void;
}

export default function Header({ cartCount, onCartClick, onSearch, products, onProductSelect }: HeaderProps) {
  const { user, role, signOut } = useAuth();
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const announcements = [
    "🎁 Presente especial Scenzzy: Ganhe 10% OFF na primeira compra com cupom: SCENZZY10",
    "💫 Siga nosso Instagram oficial e conheça as novidades da coleção @scenzzy"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
    } else {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(filtered);
    }
  }, [searchTerm, products]);

  return (
    <header className="sticky top-0 z-40 w-full" id="scenzzy-header">
      {/* Black Top Rotating Banner (RotatingHTMLComponent mockup) */}
      <div className="bg-stone-100 text-neutral-800 border-b border-stone-200 text-xs py-2 px-4 flex items-center justify-between overflow-hidden transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full text-center flex justify-center items-center gap-2">
          <Sparkles className="h-3 w-3 text-gold-500 animate-pulse" />
          <span className="font-display tracking-widest text-[11px] font-semibold transition-opacity duration-500 ease-in-out">
            {announcements[tickerIndex]}
          </span>
        </div>
      </div>

      {/* Main Luxury Navigation Header */}
      <div className="bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            {/* Menu Button Side for Mobile */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-neutral-800 hover:text-gold-500 focus:outline-none"
                aria-label="Abrir Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Left Logo Panel */}
            <div className="text-left">
              <Link to="/" className="inline-block">
                <h1 className="font-serif tracking-[0.25em] text-2xl sm:text-3xl font-bold text-neutral-900 select-none pb-1 hover:text-gold-500 transition-colors">
                  SCENZZY
                </h1>
              </Link>
            </div>

            {/* Luxury Categories - Desktop View */}
            <nav className="hidden lg:flex items-center space-x-8 ml-8">
              <Link to="/novidades" className="text-xs uppercase tracking-widest font-semibold text-neutral-800 hover:text-gold-500 transition-colors">
                Novidades
              </Link>
              <Link to="/sapatos" className="text-xs uppercase tracking-widest font-semibold text-neutral-800 hover:text-gold-500 transition-colors">
                Sapatos
              </Link>
              <Link to="/bolsas" className="text-xs uppercase tracking-widest font-semibold text-neutral-800 hover:text-gold-500 transition-colors">
                Bolsas
              </Link>
              <Link to="/cintos" className="text-xs uppercase tracking-widest font-semibold text-neutral-800 hover:text-gold-500 transition-colors">
                Cinto feminino
              </Link>
              <Link to="/promocao" className="text-xs uppercase tracking-widest font-semibold text-neutral-800 hover:text-gold-500 transition-colors">
                Promoção
              </Link>
            </nav>
          </div>

          {/* Action Row: Icons, Search, Instagram Link */}
          <div className="flex items-center space-x-5">
            {role === 'admin' && (
              <Link to="/admin/editor" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded hover:bg-gold-500 transition-colors text-[10px] font-bold uppercase tracking-widest">
                Editar Loja
              </Link>
            )}

            {/* Search Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-1 px-2 flex items-center gap-1.5 text-neutral-800 hover:text-gold-500 transition-colors focus:outline-none"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
                <span className="hidden md:inline text-xs uppercase tracking-widest font-medium">Buscar</span>
              </button>
            </div>

            {/* Instagram official link */}
            <a
              href="https://www.instagram.com/scenzzy/"
              target="_blank"
              rel="noreferrer noopener"
              className="p-1.5 text-neutral-800 hover:text-gold-500 transition-colors hidden sm:inline-block"
              title="Siga no Instagram"
              aria-label="Instagram de Scenzzy"
            >
              <Instagram className="h-5 w-5" />
            </a>

            {/* Simulated Wishlist Icon */}
            <button className="p-1 text-neutral-800 hover:text-red-500 transition-colors hidden sm:block relative">
              <Heart className="h-4.5 w-4.5" />
            </button>

            {/* User Auth Info */}
            <div className="flex items-center gap-2">
              {user ? (
                <button
                  onClick={signOut}
                  title="Sair"
                  className="p-1.5 text-neutral-800 hover:text-gold-500 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              ) : (
                <Link
                  to="/login"
                  title="Entrar"
                  className="p-1.5 text-neutral-800 hover:text-gold-500 transition-colors"
                >
                  <UserIcon className="h-5 w-5" />
                </Link>
              )}
            </div>

            {/* Shopping Bag Icon with Cart Count */}
            <button
              onClick={onCartClick}
              className="p-2 relative flex items-center justify-center text-neutral-900 hover:text-gold-500 transition-all focus:outline-none"
              aria-label="Sacola de Compras"
            >
              <ShoppingBag className="h-6 w-6 stroke-[1.5]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-stone-900 border border-stone-200 text-stone-100 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-mono font-bold animate-bounce shadow-md">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Interactive Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 w-full bg-stone-50 border-b border-stone-200 shadow-xl transition-all duration-300">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="relative flex items-center">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
              <input
                type="text"
                placeholder="O que você procura hoje? (ex: Scarpin, Tiracolo, Couro...)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onSearch(e.target.value);
                }}
                className="w-full bg-white border border-stone-200 rounded-full py-4 pl-12 pr-16 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-inner"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    onSearch('');
                  }}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400 hover:text-neutral-900 font-display"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchTerm('');
                  onSearch('');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-neutral-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Live Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 bg-white border border-stone-100 rounded-2xl p-4 shadow-lg max-h-80 overflow-y-auto">
                <p className="text-xs uppercase tracking-widest text-stone-400 font-semibold mb-3">Produtos Encontrados ({searchResults.length})</p>
                <div className="divide-y divide-stone-100">
                  {searchResults.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onProductSelect(p);
                        setIsSearchOpen(false);
                        setSearchTerm('');
                        onSearch('');
                      }}
                      className="py-3 flex items-center justify-between cursor-pointer hover:bg-stone-50/80 px-2 transition-colors rounded-lg group"
                    >
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt={p.name} className="h-10 w-10 object-cover rounded-lg" />
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-gold-500 transition-colors">{p.name}</h4>
                          <p className="text-xs text-stone-500 overflow-hidden text-ellipsis max-w-[250px] inline-block h-4 whitespace-nowrap">{p.description}</p>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-bold text-neutral-800">
                        {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {searchTerm && searchResults.length === 0 && (
              <div className="mt-4 text-center py-6">
                <p className="text-sm text-stone-500">Nenhum produto correspondente encontrado para "{searchTerm}".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Slide Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex transition-opacity duration-300">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-full max-w-xs bg-white h-full px-6 py-6 shadow-2xl transition-transform duration-300">
            <div className="flex items-center justify-between pb-6 border-b border-stone-100">
              <h2 className="font-serif tracking-widest text-2xl font-bold">SCENZZY</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 hover:text-gold-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 py-8 space-y-6">
              {role === 'admin' && (
                <Link
                  to="/admin/editor"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between text-sm uppercase tracking-widest font-bold text-gold-600 pb-2 border-b border-stone-50 hover:text-gold-500"
                >
                  <span>Editar Loja</span>
                  <ArrowRight className="h-4 w-4 text-gold-400" />
                </Link>
              )}

              <Link
                to="/novidades"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm uppercase tracking-widest font-semibold text-neutral-950 pb-2 border-b border-stone-50 hover:text-gold-500"
              >
                <span>Novidades</span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </Link>
              <Link
                to="/sapatos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm uppercase tracking-widest font-semibold text-neutral-950 pb-2 border-b border-stone-50 hover:text-gold-500"
              >
                <span>Sapatos</span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </Link>
              <Link
                to="/bolsas"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm uppercase tracking-widest font-semibold text-neutral-950 pb-2 border-b border-stone-50 hover:text-gold-500"
              >
                <span>Bolsas</span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </Link>
              <Link
                to="/cintos"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm uppercase tracking-widest font-semibold text-neutral-950 pb-2 border-b border-stone-50 hover:text-gold-500"
              >
                <span>Cinto feminino</span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </Link>
              <Link
                to="/promocao"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between text-sm uppercase tracking-widest font-semibold text-neutral-950 pb-2 border-b border-stone-50 hover:text-gold-500"
              >
                <span>PROMOÇÃO</span>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </Link>
              <a
                href="https://www.instagram.com/scenzzy/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center justify-between text-sm uppercase tracking-widest font-semibold text-gold-500 pt-4"
              >
                <span className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" /> Instagram @scenzzy
                </span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </nav>

            <div className="pt-6 border-t border-stone-100 flex flex-col items-center gap-4">
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm uppercase tracking-widest font-semibold text-neutral-800 hover:text-gold-500 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm uppercase tracking-widest font-semibold text-neutral-800 hover:text-gold-500 transition-colors"
                >
                  <UserIcon className="h-4 w-4" /> Entrar
                </Link>
              )}
            </div>

            <div className="pt-6 border-t border-stone-100 mt-6 text-center text-xs text-stone-400">
              <p>© 2026 Scenzzy, Inc. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
