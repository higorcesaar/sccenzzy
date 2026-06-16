import React, { useState } from 'react';
import { X, Trash2, Tag, Gift, ShoppingBag, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import { CartItem } from '../types';
import { COUPONS } from '../data/catalog';
import { motion } from 'motion/react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, size: string, q: number) => void;
  onRemoveItem: (id: string, size: string) => void;
  onCheckout: (coupon: string, discount: number) => void;
}

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }: CartDrawerProps) {
  const [couponInput, setCouponInput] = useState('');
  const [activeCoupon, setActiveCoupon] = useState('');
  const [couponError, setCouponInputError] = useState('');
  const [couponDiscountPct, setCouponDiscountPct] = useState(0);

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const discount = subtotal * couponDiscountPct;
  const total = subtotal - discount;

  // Arezzo style cashback: 10% back for future buy!
  const cashbackEstimation = Math.round(total * 0.10);

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (COUPONS[code] !== undefined) {
      setActiveCoupon(code);
      setCouponDiscountPct(COUPONS[code]);
      setCouponInputError('');
    } else {
      setCouponInputError('Voucher inválido ou expirado.');
    }
  };

  const handleRemoveCoupon = () => {
    setActiveCoupon('');
    setCouponDiscountPct(0);
    setCouponInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-container">
      {/* Backdrop with fade transition */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-stone-900/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Slide-out Panel with custom spring physics */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 210 }}
          className="w-screen max-w-md bg-stone-50 h-full shadow-2xl flex flex-col justify-between"
        >
          
          {/* Header Panel */}
          <div className="px-6 py-5 bg-white border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-neutral-800" />
              <h2 className="text-base uppercase tracking-widest font-bold font-display text-neutral-900">
                Minha Sacola ({cartItems.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-stone-400 hover:text-neutral-900 transition-colors focus:outline-none"
              aria-label="Fechar Sacola"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Content / Scroll Lists */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            
            {/* Arezzo cashback callout */}
            <div className="bg-stone-900 text-stone-100 rounded-2xl p-4 flex items-center gap-3 shadow-inner">
              <div className="bg-gold-500/20 text-gold-300 p-2 rounded-xl">
                <Gift className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider font-bold text-gold-300">CUPOM ATIVO: GANHE CASHBACK</p>
                <p className="text-[11px] text-stone-300">Compre agora e acumule 10% de cashback para sua próxima compra!</p>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-12 w-12 text-stone-300 mx-auto mb-4 stroke-1" />
                <p className="text-stone-500 text-sm">Sua sacola de luxo está vazia.</p>
                <button
                  onClick={onClose}
                  className="mt-6 bg-neutral-900 text-stone-50 px-6 py-3 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-gold-500 transition-colors"
                >
                  Continuar Navegando
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex gap-4 transition-all hover:shadow-md"
                  >
                    {/* Item Image */}
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="h-20 w-20 object-cover rounded-xl bg-stone-50"
                      referrerPolicy="no-referrer"
                    />

                    {/* Details section */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-semibold text-neutral-950 font-serif leading-tight">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                            className="text-stone-400 hover:text-red-500 p-0.5 transition-colors focus:outline-none"
                            title="Remover item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-[11.5px] text-gold-500 font-medium tracking-wide mt-1">
                          Tamanho: {item.selectedSize}
                        </p>
                      </div>

                      {/* Quantity & Pricing update bar */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                            className="px-2 py-1 text-xs hover:bg-stone-200 transition-colors font-bold focus:outline-none"
                          >
                            -
                          </button>
                          <span className="px-3 text-xs font-mono font-semibold text-neutral-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                            className="px-2 py-1 text-xs hover:bg-stone-200 transition-colors font-bold focus:outline-none"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-mono font-bold text-neutral-900">
                          {(item.product.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Summary & Voucher Adjustment */}
          {cartItems.length > 0 && (
            <div className="bg-white border-t border-stone-250 p-6 space-y-4">
              
              {/* Promo code line */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-1">Cupom de Desconto</span>
                {activeCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 rounded-xl px-4 py-2 text-xs border border-emerald-200/50">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Ticket className="h-4 w-4" /> {activeCoupon} ({(couponDiscountPct * 100)}% OFF)
                    </span>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-emerald-800 hover:text-red-500 font-bold underline text-[10px]"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: PRIMEIROAREZZO"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-gold-500 uppercase tracking-widest"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="bg-neutral-900 hover:bg-gold-500 text-stone-100 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
                {couponError && <p className="text-[10px] text-red-500 font-medium">{couponError}</p>}
              </div>

              {/* pricing table */}
              <div className="space-y-2 border-t border-stone-100 pt-4">
                <div className="flex justify-between text-xs text-stone-500">
                  <span>Subtotal</span>
                  <span className="font-mono">
                    {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Desconto ({activeCoupon})</span>
                    <span className="font-mono">
                      -{discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                )}
                {/* Cashback alert */}
                <div className="flex justify-between text-xs text-gold-500 font-medium">
                  <span>Cashback a receber após envio</span>
                  <span className="font-mono">
                    {cashbackEstimation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-stone-500">
                  <span>Frete</span>
                  <span className="font-mono text-emerald-600 font-semibold uppercase tracking-widest text-[10px]">
                    {subtotal >= 300 ? 'Grátis' : 'Calcular no checkout'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-stone-100">
                  <span className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Total</span>
                  <span className="text-xl font-mono font-bold text-neutral-900">
                    {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Secure Checkout button */}
              <button
                onClick={() => onCheckout(activeCoupon, discount)}
                className="w-full bg-neutral-900 hover:bg-gold-500 text-stone-50 py-4.5 rounded-2xl text-xs font-semibold uppercase tracking-widest shadow-md hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center justify-center gap-1.5 focus:outline-none"
              >
                Ir para o Pagamento <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 font-medium pt-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Pagamento processado de forma 100% segura</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
