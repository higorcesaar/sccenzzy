import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'sc-01',
    name: 'Scarpin Couro Salto Fino',
    category: 'salto',
    description: 'Elegância atemporal para qualquer ocasião. Feito em couro legítimo com bico fino e acabamento impecável. O clássico indispensável no closet feminino.',
    price: 359.90,
    originalPrice: 459.90,
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1550005973-740d12530936?auto=format&fit=crop&q=80&w=600'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-shoes-of-a-woman-walking-on-the-street-42617-large.mp4',
    features: ['Material: Couro Legítimo', 'Salto: 9cm', 'Bico: Fino', 'Cor: Preto'],
    sizes: ['34', '35', '36', '37', '38', '39'],
    trialAvailable: true,
    stockQty: 12,
    sizeStockMap: {
      '34': 3,
      '35': 0, // Out of stock size for testing
      '36': 4,
      '37': 2,
      '38': 3,
      '39': 0  // Out of stock size for testing
    }
  },
  {
    id: 'sc-02',
    name: 'Bolsa Tiracolo Saffiano',
    category: 'bolsa',
    description: 'Bolsa tiracolo estruturada em couro Saffiano. Compacta, versátil e ideal para te acompanhar do dia à noite com muito estilo e praticidade.',
    price: 699.90,
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1588600109968-3b3dfa4be3cb?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Couro Saffiano', 'Fecho: Metálico Frontal', 'Alça: Ajustável'],
    dimensions: '20cm x 15cm x 6cm',
    sizes: ['Único'],
    trialAvailable: false,
    stockQty: 5,
    sizeStockMap: { 'Único': 5 }
  },
  {
    id: 'sc-03',
    name: 'Sandália Salto Bloco',
    category: 'salto',
    description: 'Conforto e estilo em um só modelo. A sandália de salto bloco é perfeita para a rotina agitada, garantindo estabilidade e um visual chic.',
    price: 289.90,
    originalPrice: 329.90,
    images: [
      'https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Nobuck', 'Salto: 6cm', 'Fechamento: Fivela'],
    sizes: ['35', '36', '37', '38'],
    trialAvailable: true,
    stockQty: 0, // Fully out of stock product
    sizeStockMap: {
      '35': 0,
      '36': 0,
      '37': 0,
      '38': 0
    }
  },
  {
    id: 'sc-04',
    name: 'Bolsa Shopping Tote',
    category: 'bolsa',
    description: 'Espaçosa e elegante, a bolsa shopping é perfeita para carregar tudo o que você precisa. Um item prático e essencial para mulheres dinâmicas.',
    price: 890.00,
    images: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Couro Texturizado', 'Compartimentos Internos', 'Fecho: Zíper'],
    dimensions: '35cm x 28cm x 12cm',
    sizes: ['Único'],
    trialAvailable: false,
    stockQty: 8,
    sizeStockMap: { 'Único': 8 }
  },
  {
    id: 'sc-05',
    name: 'Tênis Casual Slip On',
    category: 'tenis',
    description: 'O tênis ideal para os dias de casualidade. Prático de calçar, moderno e extremamente confortável, é o favorito para o look despojado.',
    price: 299.90,
    originalPrice: 350.00,
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Lona Premium', 'Sola: Borracha Antiderrapante', 'Palmilha: Anatômica'],
    sizes: ['34', '35', '36', '37', '38'],
    trialAvailable: true,
    stockQty: 15,
    sizeStockMap: {
      '34': 2,
      '35': 3,
      '36': 5,
      '37': 4,
      '38': 1
    }
  },
  {
    id: 'sc-06',
    name: 'Tênis Chunky Couro',
    category: 'tenis',
    description: 'Tênis estilo chunky feminino, marcante e cheio de atitude. Detalhes em costura e couro legítimo.',
    price: 499.50,
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Couro', 'Sola: Tratorada 4cm', 'Cano: Curto'],
    sizes: ['35', '36', '37', '38', '39'],
    trialAvailable: true,
    stockQty: 10,
    sizeStockMap: {
      '35': 2,
      '36': 2,
      '37': 2,
      '38': 2,
      '39': 2
    }
  },
  {
    id: 'sc-07',
    name: 'Clutch Festa Brilho',
    category: 'acessorio',
    description: 'Para noites inesquecíveis, esta clutch com aplicação de pedrarias é a aposta certa. Tamanho ideal para celular, cartões e batom.',
    price: 420.00,
    images: [
      'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Tecido com Pedrarias', 'Fecho: Magnético', 'Alça: Corrente Opcional'],
    dimensions: '18cm x 11cm x 4cm',
    sizes: ['Único'],
    trialAvailable: false,
    stockQty: 3,
    sizeStockMap: { 'Único': 3 }
  },
  {
    id: 'sc-08',
    name: 'Óculos de Sol Oversized',
    category: 'acessorio',
    description: 'Óculos de sol em acetato premium com lentes degradê. Proteção UV total e design oversized elegante.',
    price: 259.90,
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Acetato', 'Lentes: Degradê UV400', 'Formato: Oversized'],
    sizes: ['Único'],
    trialAvailable: true,
    stockQty: 6,
    sizeStockMap: { 'Único': 6 }
  },
  {
    id: 'sc-09',
    name: 'Tênis Esportivo Casual',
    category: 'tenis',
    description: 'Design super leve, perfeito para corridas leves ou dia a dia dinâmico. Estilo running com conforto excepcional.',
    price: 349.90,
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Mesh Respirável', 'Sola: EVA Leve', 'Palmilha: Memory Foam'],
    sizes: ['35', '36', '37', '38', '39'],
    trialAvailable: true,
    stockQty: 8,
    sizeStockMap: {
      '35': 1,
      '36': 2,
      '37': 2,
      '38': 2,
      '39': 1
    }
  },
  {
    id: 'sc-10',
    name: 'Cinto Couro Fivela Dourada',
    category: 'cinto',
    description: 'Cinto feminino de couro legítimo com fivela de metal minimalista. Essencial para marcar a cintura e elevar o visual.',
    price: 159.90,
    images: [
      'https://images.unsplash.com/photo-1628148866782-748db85d77bd?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Couro Legítimo', 'Largura: 3cm', 'Fivela: Metal Dourado'],
    sizes: ['P', 'M', 'G'],
    trialAvailable: true,
    stockQty: 9,
    sizeStockMap: {
      'P': 3,
      'M': 3,
      'G': 3
    }
  },
  {
    id: 'sc-11',
    name: 'Cinto Textura Croco',
    category: 'cinto',
    description: 'Cinto elegante com textura croco, ideal para trazer sofisticação e informação de moda às composições.',
    price: 189.90,
    images: [
      'https://images.unsplash.com/photo-1596706911677-7ac36466c1b3?auto=format&fit=crop&q=80&w=600'
    ],
    features: ['Material: Couro Texturizado', 'Fivela: Quadrada Prateada', 'Largura: 4cm'],
    sizes: ['Único'],
    trialAvailable: false,
    stockQty: 10,
    sizeStockMap: { 'Único': 10 }
  }
];

export const COUPONS: { [key: string]: number } = {
  'PRIMEIROSCENZZY': 0.10, // Scenzzy voucher translated to 10%
  'SCENZZY10': 0.10,      // Custom brand voucher
  'VIPGOLD': 0.20,        // Premium 20%
};

export const STORES_PICKUP = [
  {
    id: 'st-01',
    name: 'Scenzzy Boutique Campina Grande',
    address: 'Av. Almirante Barroso, 1980 Loja 08 CCruzeiro, Campina Grande - PB',
    cep: '58415-670',
    distance: '1.2 km de você'
  }
];
