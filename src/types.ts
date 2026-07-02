export interface Product {
  id: string;
  name: string;
  category: 'tenis' | 'salto' | 'bolsa' | 'acessorio' | 'cinto';
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  videoUrl?: string;
  features?: string[]; // e.g., "Material: Couro, Salto: 9cm"
  dimensions?: string; // e.g., "30cm x 20cm x 10cm"
  sizes: string[]; // Shoe: "35", "36", "37". Bag: "Único"
  trialAvailable: boolean;
  stockQty?: number;
  sizeStockMap?: Record<string, number>;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}

export interface ShippingAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

export type PaymentMethod = 'pix' | 'credit_card' | 'boleto';

export interface CheckoutState {
  step: 'cart' | 'shipping' | 'payment' | 'completed';
  address: ShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode: string;
  discountAmount: number;
  deliveryOption: 'standard' | 'express' | 'store_pickup';
  deliveryStoreId?: string;
  creditCard?: {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
    installments: number;
  };
}
