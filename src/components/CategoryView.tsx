import React, { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import Header from "./Header";
import ProductCard from "./ProductCard";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";
import ProductDetailModal from "./ProductDetailModal";
import AIHelperModal from "./AIHelperModal";
import { listPublicProducts } from "../lib/storefront.functions";
import { Product, CartItem } from "../types";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  categorySlug?: string;
  collectionSlug?: string;
  onlyOnSale?: boolean;
  onlyLaunch?: boolean;
};

export default function CategoryView({
  title,
  subtitle,
  categorySlug,
  collectionSlug,
  onlyOnSale,
  onlyLaunch,
}: Props) {
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [surveyProduct, setSurveyProduct] = useState<Product | null>(null);
  const [isAIHelperOpen, setIsAIHelperOpen] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPublic = useServerFn(listPublicProducts);
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products", { categorySlug, collectionSlug, onlyOnSale, onlyLaunch }],
    queryFn: () => fetchPublic({ data: { categorySlug, collectionSlug, onlyOnSale, onlyLaunch } }),
    staleTime: 30_000,
  });

  const list = (products as Product[]).filter((p) =>
    !searchTerm ? true : p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddToCart = (product: Product, size: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.selectedSize === size);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.selectedSize === size ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, selectedSize: size, quantity: 1 }];
    });
    addToast(`${product.name} (Tamanho ${size}) foi adicionado à sacola.`, "cart", "Sacola Atualizada");
  };

  const handleUpdateQuantity = (id: string, size: string, q: number) => {
    if (q <= 0) return setCart((prev) => prev.filter((i) => !(i.product.id === id && i.selectedSize === size)));
    setCart((prev) =>
      prev.map((i) => (i.product.id === id && i.selectedSize === size ? { ...i, quantity: q } : i)),
    );
  };

  const handleRemoveItem = (id: string, size: string) =>
    setCart((prev) => prev.filter((i) => !(i.product.id === id && i.selectedSize === size)));

  const subtotal = cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0);

  const handleTriggerCheckout = (coupon: string, discount: number) => {
    if (!user) {
      addToast("Faça login para finalizar a compra.", "info", "Autenticação");
      setIsCartOpen(false);
      navigate({ to: "/login" });
      return;
    }
    setActiveCoupon(coupon);
    setCouponDiscount(discount);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-neutral-900">
      <Header
        cartCount={cart.reduce((a, i) => a + i.quantity, 0)}
        onCartClick={() => setIsCartOpen(true)}
        onSearch={setSearchTerm}
        products={products as Product[]}
        onProductSelect={(p) => {
          setSelectedProduct(p);
          setIsDetailOpen(true);
        }}
      />

      <main className="min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-12">
          {subtitle && (
            <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">{subtitle}</p>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight uppercase">
            {title}
          </h1>
          <div className="h-0.5 w-16 bg-gold-400 mx-auto" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
          </div>
        ) : list.length === 0 ? (
          <p className="text-center text-stone-500 py-20">
            Nenhum produto disponível nesta categoria ainda.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {list.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={handleAddToCart}
                onSelect={(prod) => {
                  setSelectedProduct(prod);
                  setIsDetailOpen(true);
                }}
                onOpenAIHelper={(prod) => {
                  setSurveyProduct(prod);
                  setIsAIHelperOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

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

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        subtotal={subtotal}
        discount={couponDiscount}
        couponCode={activeCoupon}
      />

      <AIHelperModal isOpen={isAIHelperOpen} onClose={() => setIsAIHelperOpen(false)} product={surveyProduct} />

      <ProductDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
        onOpenAIHelper={(p) => {
          setSurveyProduct(p);
          setIsAIHelperOpen(true);
        }}
      />
    </div>
  );
}
