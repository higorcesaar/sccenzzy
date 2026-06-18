import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, CreditCard, QrCode, ClipboardList, CheckCircle2, Loader2, Sparkles, Send, MapPin, Receipt, Check, Copy, ArrowRight, Truck } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { CartItem, ShippingAddress, PaymentMethod, CheckoutState } from '../types';
import { STORES_PICKUP } from '../data/catalog';
import { cotarFrete } from '../lib/correios.functions';

type FreteQuote = { codigo: string; nome: string; descricao: string; preco: number; prazoDias: number; erro?: string };

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  couponCode: string;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, subtotal, discount, couponCode }: CheckoutModalProps) {
  const [step, setStep] = useState<'info' | 'payment' | 'processing' | 'done'>('info');
  const [copiedText, setCopiedText] = useState(false);
  const [paymentOption, setPaymentOption] = useState<PaymentMethod>('pix');
  const [deliveryOption, setDeliveryOption] = useState<'correios' | 'store_pickup'>('correios');
  const [selectedStoreId, setSelectedStoreId] = useState(STORES_PICKUP[0].id);
  const [freteQuotes, setFreteQuotes] = useState<FreteQuote[]>([]);
  const [freteLoading, setFreteLoading] = useState(false);
  const [freteErro, setFreteErro] = useState<string | null>(null);
  const [selectedFreteCodigo, setSelectedFreteCodigo] = useState<string | null>(null);
  const cotar = useServerFn(cotarFrete);

  // Card Flip Focus Simulator
  const [cardFlip, setCardFlip] = useState(false);

  // Pix timer state
  const [pixTime, setPixTime] = useState(300); // 5 minutes

  // Form Fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardInstallments, setCardInstallments] = useState(1);

  // Errors panel
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const generatedOrderId = useRef(`SZ-${Math.floor(100000 + Math.random() * 900000)}`);

  useEffect(() => {
    if (step === 'payment' && paymentOption === 'pix') {
      const timer = setInterval(() => {
        setPixTime((prev) => (prev > 0 ? prev - 1 : 300));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, paymentOption]);

  // Cotar frete sempre que CEP estiver completo e modo Correios estiver ativo
  const totalQty = cartItems.reduce((acc, it) => acc + it.quantity, 0) || 1;
  useEffect(() => {
    const cepDigits = cep.replace(/\D/g, '');
    if (deliveryOption !== 'correios' || cepDigits.length !== 8) {
      return;
    }
    let cancelled = false;
    setFreteLoading(true);
    setFreteErro(null);
    cotar({ data: { cepDestino: cepDigits, quantidade: totalQty } })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setFreteQuotes(res.quotes);
          const firstValid = res.quotes.find((q) => !q.erro && q.preco > 0);
          if (firstValid) setSelectedFreteCodigo(firstValid.codigo);
        } else {
          setFreteErro(res.error || 'Não foi possível calcular o frete.');
          setFreteQuotes([]);
        }
      })
      .catch((e) => !cancelled && setFreteErro(e?.message || 'Erro ao calcular frete'))
      .finally(() => !cancelled && setFreteLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cep, deliveryOption, totalQty, cotar]);

  if (!isOpen) return null;

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formatted = value;
    if (value.length > 5) {
      formatted = `${value.slice(0, 5)}-${value.slice(5, 8)}`;
    }
    setCep(formatted);

    // Auto-fill mockup address if CEP is length 8
    if (value.length === 8) {
      setStreet('Avenida Paulista');
      setNeighborhood('Bela Vista');
      setCity('São Paulo');
      setState('SP');
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += value[i];
    }
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    let formatted = value;
    if (value.length > 2) {
      formatted = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    setCardExpiry(formatted);
  };

  const validateInfo = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email.includes('@')) newErrors.email = 'E-mail inválido';
    if (name.trim().length < 5) newErrors.name = 'Nome de faturamento completo obrigatório';
    if (cpf.replace(/\D/g, '').length !== 11) newErrors.cpf = 'CPF deve conter 11 dígitos';
    if (phone.trim().length < 8) newErrors.phone = 'Telefone obrigatório';

    if (deliveryOption !== 'store_pickup') {
      if (cep.replace(/\D/g, '').length !== 8) newErrors.cep = 'CEP inválido';
      if (street.trim() === '') newErrors.street = 'Endereço obrigatório';
      if (number.trim() === '') newErrors.number = 'Número obrigatório';
      if (neighborhood.trim() === '') newErrors.neighborhood = 'Bairro obrigatório';
      if (city.trim() === '') newErrors.city = 'Cidade obrigatória';
      if (state.trim() === '') newErrors.state = 'Estado obrigatório';
      if (!selectedFreteCodigo || !selectedQuote || selectedQuote.preco <= 0) {
        newErrors.frete = 'Selecione uma opção de frete';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGoToPayment = () => {
    if (validateInfo()) {
      setStep('payment');
    }
  };

  const handleConfirmCheckout = () => {
    if (paymentOption === 'credit_card') {
      const cardErrors: { [key: string]: string } = {};
      if (cardNumber.replace(/\s/g, '').length !== 16) cardErrors.cardNumber = 'Cartão deve conter 16 dígitos';
      if (cardName.trim() === '') cardErrors.cardName = 'Nome conforme impresso obrigatório';
      if (cardExpiry.length !== 5) cardErrors.cardExpiry = 'Data de expiração incorreta';
      if (cardCvv.length < 3) cardErrors.cardCvv = 'CVV inválido';

      if (Object.keys(cardErrors).length > 0) {
        setErrors(cardErrors);
        return;
      }
    }

    setStep('processing');
    setTimeout(() => {
      setStep('done');
    }, 3000);
  };

  const selectedQuote = freteQuotes.find((q) => q.codigo === selectedFreteCodigo) ?? null;
  const totalShipping =
    deliveryOption === 'store_pickup' ? 0 : selectedQuote?.preco ?? 0;

  const handlePixCopy = () => {
    const pixCode = `00020101021226870014br.gov.bcb.pix2565pix.scenzzychao.com.br/qr/v2/${generatedOrderId.current}5204000053039865405${Math.round(subtotal - discount + totalShipping)}.005802BR5908SCENZZY6009SAOPAULO62290525SZORDER${generatedOrderId.current}`;
    navigator.clipboard.writeText(pixCode);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedDeliveryDate = () => {
    const date = new Date();
    const daysToAdd = deliveryOption === 'store_pickup' ? 0 : selectedQuote?.prazoDias ?? 6;
    date.setDate(date.getDate() + daysToAdd);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  };

  const finalTotalAmount = subtotal - discount + totalShipping;

  // Credit Card Brand Predictor
  const getCardTypeLogo = () => {
    const num = cardNumber.replace(/\s/g, '');
    if (num.startsWith('4')) {
      return { name: 'Visa', logo: '💳', color: 'text-blue-600' };
    } else if (num.startsWith('5')) {
      return { name: 'Mastercard', logo: '🔴🟡', color: '' };
    } else if (num.startsWith('37') || num.startsWith('34')) {
      return { name: 'American Express', logo: '🦅', color: 'text-cyan-700' };
    }
    return { name: 'Card', logo: '⚙️', color: 'text-stone-400' };
  };

  const cardBrand = getCardTypeLogo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="checkout-gateway-modal">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-stone-50 w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh] z-10">
        
        {/* Left Interactive Form Side */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[50vh] lg:max-h-[90vh]">
          
          {/* Header step controls */}
          <div className="flex items-center justify-between mb-6">
            {step !== 'info' && step !== 'done' && step !== 'processing' ? (
              <button
                onClick={() => setStep('info')}
                className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-stone-500 hover:text-neutral-900 focus:outline-none"
              >
                <ArrowLeft className="h-4 w-4" /> Dados de Contato
              </button>
            ) : (
              <h2 className="text-sm uppercase tracking-widest font-bold text-neutral-800 font-display flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-gold-500 animate-spin" /> Scenzzy Pay Secure Gateway
              </h2>
            )}

            {step !== 'done' && step !== 'processing' && (
              <button onClick={onClose} className="p-1 hover:text-gold-500 text-stone-400">
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Form Step: 1 - Contact and Address */}
          {step === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-neutral-950 mb-1">Identificação & Entrega</h3>
                <p className="text-xs text-stone-400">Preencha seus dados para envio prioritário e geração da fatura.</p>
              </div>

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-gold-500 rounded-xl px-4 py-3 text-xs w-full focus:outline-none"
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-medium">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome Impresso ou Completo"
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-gold-500 rounded-xl px-4 py-3 text-xs w-full focus:outline-none"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-medium">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">CPF para Nota Fiscal</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="999.999.999-99"
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-gold-500 rounded-xl px-4 py-3 text-xs w-full focus:outline-none font-mono"
                  />
                  {errors.cpf && <p className="text-[10px] text-red-500 font-medium">{errors.cpf}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">Telefone/Whatsapp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-white border border-stone-200 focus:ring-1 focus:ring-gold-500 rounded-xl px-4 py-3 text-xs w-full focus:outline-none"
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-medium">{errors.phone}</p>}
                </div>
              </div>

              {/* Delivery method selection */}
              <div>
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-3">Método de Envio</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() => setDeliveryOption('correios')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      deliveryOption === 'correios' ? 'bg-gold-50/50 border-gold-300 ring-1 ring-gold-300' : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-stone-700" />
                      <p className="text-xs font-bold text-neutral-900">Envio pelos Correios</p>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">Calcule digitando o CEP abaixo</p>
                  </div>

                  <div
                    onClick={() => setDeliveryOption('store_pickup')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      deliveryOption === 'store_pickup' ? 'bg-gold-50/50 border-gold-300 ring-1 ring-gold-300' : 'bg-white border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-neutral-900">Retirada na Loja</p>
                    <p className="text-[10px] text-stone-400 mt-1">Av. Almirante Barroso, 1980 - Loja 08</p>
                    <p className="text-[11px] text-emerald-600 font-bold tracking-widest uppercase mt-2">Grátis</p>
                  </div>
                </div>

                {/* Cotações dos Correios */}
                {deliveryOption === 'correios' && (
                  <div className="mt-3 space-y-2">
                    {freteLoading && (
                      <div className="flex items-center gap-2 text-[11px] text-stone-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Calculando frete...
                      </div>
                    )}
                    {freteErro && !freteLoading && (
                      <p className="text-[11px] text-red-600">{freteErro}</p>
                    )}
                    {!freteLoading && freteQuotes.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {freteQuotes.map((q) => {
                          const disabled = !!q.erro || q.preco === 0;
                          const isSel = selectedFreteCodigo === q.codigo;
                          return (
                            <button
                              key={q.codigo}
                              type="button"
                              disabled={disabled}
                              onClick={() => setSelectedFreteCodigo(q.codigo)}
                              className={`text-left p-3 rounded-xl border transition-all ${
                                disabled
                                  ? 'opacity-40 cursor-not-allowed border-stone-200 bg-stone-50'
                                  : isSel
                                  ? 'bg-gold-50/50 border-gold-300 ring-1 ring-gold-300'
                                  : 'bg-white border-stone-200 hover:bg-stone-50'
                              }`}
                            >
                              <p className="text-xs font-bold text-neutral-900">{q.nome}</p>
                              <p className="text-[10px] text-stone-400 mt-1">
                                {q.erro ? q.erro : `${q.prazoDias} dia(s) úteis`}
                              </p>
                              {!q.erro && (
                                <p className="text-[11px] font-bold mt-2">
                                  R$ {q.preco.toFixed(2).replace('.', ',')}
                                </p>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>


              {/* Address inputs for Deliveries */}
              {deliveryOption !== 'store_pickup' ? (
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-1">Endereço de Entrega</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-semibold block">CEP</label>
                      <input
                        type="text"
                        value={cep}
                        onChange={handleCEPChange}
                        placeholder="01424-001"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none"
                      />
                      {errors.cep && <p className="text-[10px] text-red-500 font-medium">{errors.cep}</p>}
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] text-stone-500 font-semibold block">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Av. Almirante Barroso"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none"
                      />
                      {errors.street && <p className="text-[10px] text-red-500 font-medium">{errors.street}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-semibold block">Número</label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="1420"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none"
                      />
                      {errors.number && <p className="text-[10px] text-red-500 font-medium">{errors.number}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-semibold block">Complemento</label>
                      <input
                        type="text"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Ex: Apto 42"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-semibold block">Bairro</label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Jardins"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none"
                      />
                      {errors.neighborhood && <p className="text-[10px] text-red-500 font-medium">{errors.neighborhood}</p>}
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] text-stone-500 font-semibold block">Cidade</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="São Paulo"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none"
                      />
                      {errors.city && <p className="text-[10px] text-red-500 font-medium">{errors.city}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-stone-500 font-semibold block">Estado (UF)</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="SP"
                        maxLength={2}
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none uppercase"
                      />
                      {errors.state && <p className="text-[10px] text-red-500 font-medium">{errors.state}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                /* Pickup store options selection list */
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-1">Selecione o Lounge para Retirada</span>
                  <div className="space-y-3">
                    {STORES_PICKUP.map((st: any) => (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStoreId(st.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                          selectedStoreId === st.id
                            ? 'bg-gold-50/50 border-gold-300 ring-1 ring-gold-300'
                            : 'bg-white hover:bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="mt-1 flex items-center justify-center h-4 w-4 border border-stone-300 rounded-full">
                          {selectedStoreId === st.id && <div className="h-2.5 w-2.5 bg-gold-500 rounded-full" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <h4 className="text-xs font-bold text-neutral-900">{st.name}</h4>
                            <span className="text-[10px] font-mono text-gold-500 font-bold uppercase">{st.distance}</span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-1">{st.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action row to continue to gateway step */}
              <button
                onClick={handleGoToPayment}
                className="w-full mt-6 bg-neutral-900 hover:bg-gold-500 text-stone-100 py-4 rounded-xl text-xs font-semibold uppercase tracking-widest shadow-md hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center justify-center gap-1.5 focus:outline-none"
              >
                Prosseguir para o Pagamento <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Form Step: 2 - Payment Gateway options */}
          {step === 'payment' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-neutral-950 mb-1">Gateway de Pagamento Integrado</h3>
                <p className="text-xs text-stone-400">Selecione o método de pagamento seguro para faturar seu pedido.</p>
              </div>

              {/* Options selection toggles card */}
              <div className="flex bg-stone-200/50 rounded-2xl p-1 gap-1">
                <button
                  onClick={() => setPaymentOption('pix')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none transition-all ${
                    paymentOption === 'pix' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <QrCode className="h-4 w-4" /> Pix Instantâneo
                </button>
                <button
                  onClick={() => setPaymentOption('credit_card')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none transition-all ${
                    paymentOption === 'credit_card' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Cartão de Crédito
                </button>
                <button
                  onClick={() => setPaymentOption('boleto')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none transition-all ${
                    paymentOption === 'boleto' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <Receipt className="h-4 w-4" /> Boleto Bancário
                </button>
              </div>

              {/* Dynamic payments panels display */}
              {paymentOption === 'pix' && (
                <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm space-y-6 text-center">
                  <div className="max-w-xs mx-auto space-y-4">
                    <p className="text-xs uppercase tracking-wider text-stone-400 font-bold">Chave de liberação instantânea</p>
                    
                    {/* Simulated High fidelity QR Code */}
                    <div className="bg-stone-50 border border-stone-100 p-6 rounded-3xl flex flex-col items-center justify-center relative group shadow-inner">
                      <div className="h-40 w-44 flex items-center justify-center bg-stone-950 p-2.5 rounded-2xl relative shadow-md">
                        {/* Custom QR Code Simulated Matrix Vector */}
                        <div className="grid grid-cols-4 gap-2 w-full h-full relative">
                          <div className="border-[6px] border-white h-10 w-10" />
                          <div className="flex flex-col gap-2">
                            <div className="h-2 w-10 bg-white" />
                            <div className="h-4 w-4 bg-white self-end" />
                          </div>
                          <div className="flex justify-end gap-1"><div className="h-10 w-2 bg-white" /></div>
                          <div className="border-[6px] border-white h-10 w-10" />
                          <div className="row-span-2 col-span-2 flex flex-col gap-1.5 items-center justify-center">
                            <div className="h-5 w-5 bg-gold-400 rounded-full animate-pulse" />
                            <p className="text-[10px] text-stone-100 font-serif leading-none tracking-widest">SCENZZY</p>
                          </div>
                          <div className="h-10 w-2 bg-white" />
                          <div className="h-10 w-4 bg-white" />
                          <div className="border-[6px] border-white h-10 w-10" />
                          <div className="h-2 w-10 bg-white" />
                          <div className="h-4 w-4 bg-white" />
                          <div className="h-10 w-3 bg-white" />
                        </div>
                      </div>
                      
                      <div className="absolute inset-0 bg-stone-950/80 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                        <QrCode className="h-10 w-10 text-gold-300 mb-2 animate-bounce" />
                        <p className="text-stone-50 text-[11px] font-sans">Escaneie pelo aplicativo de qualquer banco</p>
                      </div>
                    </div>

                    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-2">
                      <div className="flex justify-between items-center text-xs text-stone-500">
                        <span>Fatura expira em:</span>
                        <span className="font-mono text-neutral-900 font-bold text-stone-700 animate-pulse bg-gold-100 px-2 py-0.5 rounded-lg border border-gold-300/40">
                          {formatTime(pixTime)}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 leading-relaxed text-left">
                        O envio do seu estojo Scenzzy é computado na fila de prioridades no mesmo minuto em que a chave for paga.
                      </p>
                    </div>

                    {/* Copy paste button */}
                    <button
                      onClick={handlePixCopy}
                      className="w-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-neutral-800 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all focus:outline-none"
                    >
                      {copiedText ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" /> Código Pix Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-stone-500" /> Copiar Código Pix Copia e Cola
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {paymentOption === 'credit_card' && (
                <div className="space-y-6">
                  {/* Visual Flipping Credit Card Frame */}
                  <div className="perspective-[1000px] w-full max-w-sm mx-auto aspect-[1.58/1]">
                    <div
                      className={`relative w-full h-full rounded-2xl shadow-xl transition-transform duration-500 transform-style-3d ${
                        cardFlip ? 'rotate-y-180' : ''
                      }`}
                    >
                      {/* Card Front */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-neutral-950 via-neutral-900 to-stone-800 text-stone-100 p-6 rounded-2xl flex flex-col justify-between backface-hidden">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] tracking-widest text-gold-300 font-bold uppercase">Scenzzy Privilege Club</p>
                            <span className="text-xl font-serif font-black tracking-widest block mt-1 hover:text-gold-500 transition-colors select-none">SCENZZY</span>
                          </div>
                          <span className="text-2xl">{cardBrand.logo}</span>
                        </div>

                        {/* Card Number */}
                        <div className="font-mono text-lg tracking-[0.15em] py-2 text-stone-300">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>

                        {/* Card footer details */}
                        <div className="flex justify-between text-xs font-sans uppercase">
                          <div>
                            <span className="text-[8px] text-stone-500 block mb-0.5">Portador</span>
                            <span className="font-semibold tracking-wider text-stone-200 block text-ellipsis overflow-hidden uppercase max-w-[170px] whitespace-nowrap">
                              {cardName || 'NOME NO CARTÃO'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-stone-500 block mb-0.5">Validade</span>
                            <span className="font-semibold font-mono tracking-wider text-stone-250 block">
                              {cardExpiry || 'MM/AA'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Back */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-stone-900 to-neutral-950 p-6 rounded-2xl flex flex-col justify-between rotate-y-180 backface-hidden shadow-2xl">
                        <div className="h-10 bg-black/60 -mx-6 mt-2" />
                        <div className="flex justify-end pr-4">
                          <div className="bg-stone-500/10 border border-stone-700 h-9 w-20 flex items-center justify-end px-3 font-mono font-bold tracking-widest text-sm text-stone-200 rounded-lg">
                            {cardCvv || '•••'}
                          </div>
                        </div>
                        <p className="text-[8px] text-stone-500 font-sans tracking-tight">
                          Este cartão com chip de segurança criptografado é exclusivo da rede de boutiques Scenzzy. Assinatura obrigatória.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card input forms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">Número do Cartão</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        onFocus={() => setCardFlip(false)}
                        placeholder="4000 1234 5678 9010"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none font-mono"
                      />
                      {errors.cardNumber && <p className="text-[10px] text-red-500 font-medium">{errors.cardNumber}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">Nome do Titular</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        onFocus={() => setCardFlip(false)}
                        placeholder="NOME IGUAL NO CARTÃO"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none uppercase"
                      />
                      {errors.cardName && <p className="text-[10px] text-red-500 font-medium">{errors.cardName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">Expiração</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        onFocus={() => setCardFlip(false)}
                        placeholder="MM/AA"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none font-mono"
                      />
                      {errors.cardExpiry && <p className="text-[10px] text-red-500 font-medium">{errors.cardExpiry}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        onFocus={() => setCardFlip(true)}
                        onBlur={() => setCardFlip(false)}
                        placeholder="123"
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none font-mono"
                      />
                      {errors.cardCvv && <p className="text-[10px] text-red-500 font-medium">{errors.cardCvv}</p>}
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">Parcelamento</label>
                      <select
                        value={cardInstallments}
                        onChange={(e) => setCardInstallments(Number(e.target.value))}
                        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((inst) => {
                          const installPrice = finalTotalAmount / inst;
                          return (
                            <option key={inst} value={inst}>
                              {inst}x de {installPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} {inst <= 10 ? 'sem juros' : 'com juros'}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {paymentOption === 'boleto' && (
                <div className="bg-white rounded-3xl p-6 border border-stone-200/60 shadow-sm space-y-4 text-center">
                  <div className="max-w-xs mx-auto space-y-4">
                    <p className="text-xs uppercase tracking-wider text-stone-400 font-bold mb-2">Boleto Prático e Seguro</p>
                    <div className="flex flex-col gap-1 items-center justify-center py-6 border border-dashed border-stone-200 bg-stone-50 rounded-2xl px-4">
                      {/* Barcode Mock Up Vector line */}
                      <div className="flex gap-0.5 justify-center py-2 h-14 w-full">
                        {[1,4,2,3,1,1,4,2,1,3,1,4,2,1,1,2,3,4,1,2,1,4,1,3,2,1].map((bar, i) => (
                          <div key={i} className={`bg-stone-850 h-full`} style={{ width: `${bar * 1}.5px` }} />
                        ))}
                      </div>
                      <p className="text-[11px] font-mono tracking-widest mt-3 text-neutral-800 overflow-hidden text-ellipsis w-full text-center">
                        34191.79001 01043.513184 91020.150008 7 934500000{Math.round(finalTotalAmount).toString()}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`34191.79001 01043.513184 91020.150008 7 934500000${Math.round(finalTotalAmount).toString()}`);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }}
                      className="w-full bg-stone-100 hover:bg-stone-200 border border-stone-200 text-neutral-800 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all focus:outline-none"
                    >
                      {copiedText ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-600" /> Linha Digitável Copiada!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 text-stone-500" /> Copiar Código de Barras
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Secure Checkout trigger */}
              <button
                onClick={handleConfirmCheckout}
                className="w-full bg-neutral-900 hover:bg-gold-500 text-stone-100 py-4 rounded-xl text-xs font-semibold uppercase tracking-widest shadow-md hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center justify-center gap-1.5 focus:outline-none"
              >
                Confirmar e Finalizar Compra <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Form Step: 3 - Processing Payments Gateway animations */}
          {step === 'processing' && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
              <Loader2 className="h-14 w-14 text-gold-500 animate-spin" />
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold">Processando Transação</h3>
                <p className="text-xs text-stone-400">Verificando limite e comunicando com o gateway integrado...</p>
              </div>
            </div>
          )}

          {/* Form Step: 4 - DONE, Conversion screen */}
          {step === 'done' && (
            <div className="py-10 animate-fade-in text-center space-y-6">
              <div className="inline-flex items-center justify-center h-20 w-20 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-bold text-neutral-950">Pedido Confirmado!</h3>
                <p className="text-sm text-stone-500">
                  Obrigado, <strong className="text-neutral-900">{name || 'Comprador Scenzzy'}</strong>. Sua transação foi aprovada e integrada com sucesso!
                </p>
                <div className="inline-block bg-stone-100 border border-stone-200 font-mono text-xs font-semibold px-4 py-2 rounded-xl text-neutral-800">
                  Código do Pedido: <strong className="text-neutral-950 font-bold">{generatedOrderId.current}</strong>
                </div>
              </div>

              {/* Order summary table */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 text-left max-w-md mx-auto space-y-4">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-stone-400 border-b border-stone-100 pb-2">Destinatário & Rastreio</h4>
                <div className="text-xs space-y-2 text-stone-600">
                  <div className="flex justify-between">
                    <span>E-mail do cliente:</span>
                    <span className="font-semibold text-neutral-900">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Método de Entrega:</span>
                    <span className="font-semibold text-neutral-900">
                      {deliveryOption === 'store_pickup' ? 'Retirada em Loja' : selectedQuote ? `Correios - ${selectedQuote.nome}` : 'Correios'}
                    </span>
                  </div>
                  {deliveryOption === 'store_pickup' ? (
                    <div className="bg-stone-50 pt-3 border-t mt-3 border-stone-105 space-y-1">
                      <p className="font-bold text-[10px] uppercase tracking-wider text-gold-500">Endereço para Coleta:</p>
                      <p className="text-neutral-900 leading-tight">
                        {STORES_PICKUP.find((st: any) => st.id === selectedStoreId)?.name}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        {STORES_PICKUP.find((st: any) => st.id === selectedStoreId)?.address}
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span>Previsão de Entrega:</span>
                      <span className="font-semibold text-neutral-900">{estimatedDeliveryDate()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-w-sm mx-auto pt-6">
                <p className="text-xs text-stone-400">
                  Enviamos os detalhes do faturamento e o link do rastreador para <strong className="text-stone-500">{email}</strong>.
                </p>
                <div className="pt-4 flex gap-3">
                  <a
                    href="https://www.instagram.com/scenzzy/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex-1 bg-stone-100 border border-stone-200 hover:bg-stone-200 text-neutral-800 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    Seguir Instagram
                  </a>
                  <button
                    onClick={() => {
                      onClose();
                      window.location.reload();
                    }}
                    className="flex-1 bg-neutral-900 hover:bg-gold-500 text-stone-100 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all text-center focus:outline-none shadow-md hover:shadow-lg"
                  >
                    Voltar ao início
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Product Summary Sidebar */}
        <div className="w-full lg:w-96 bg-white border-l border-stone-200 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[40vh] lg:max-h-full">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-900 mb-4 border-b border-stone-100 pb-2">Resumo da Compra</h3>
            <div className="space-y-4 divide-y divide-stone-100 max-h-56 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-3 pt-3 first:pt-0">
                  <img src={item.product.images[0]} alt={item.product.name} className="h-12 w-12 object-cover rounded-lg bg-stone-50 border border-stone-100" />
                  <div className="flex-1 text-xs">
                    <h5 className="font-serif font-bold text-neutral-805 leading-tight">{item.product.name}</h5>
                    <p className="text-[11px] text-stone-500 mt-1">Qtde: {item.quantity} • {item.selectedSize}</p>
                    <span className="font-mono font-semibold text-neutral-900 mt-1 block">
                      {(item.product.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-stone-200 mt-4">
            <div className="flex justify-between text-xs text-stone-500">
              <span>Subtotal</span>
              <span className="font-mono">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                <span>Desconto de Cupom</span>
                <span className="font-mono">-{discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-stone-500">
              <span>Frete</span>
              <span className="font-mono">{totalShipping > 0 ? totalShipping.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Grátis'}</span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-stone-150">
              <span className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Total Faturado</span>
              <span className="text-lg font-mono font-bold text-neutral-900">
                {finalTotalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
