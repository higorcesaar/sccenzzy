import React, { useState } from 'react';
import { X, Sparkles, Send, BrainCircuit, Check, Flame, MessageSquare, Compass, Sun, Sliders, Heart, ArrowRight, Loader2 } from 'lucide-react';
import { Product } from '../types';

interface AIHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function AIHelperModal({ isOpen, onClose, product }: AIHelperModalProps) {
  const [selectedAtmosphere, setSelectedAtmosphere] = useState('Executive');
  const [analyzing, setAnalyzing] = useState(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);

  if (!isOpen) return null;

  const atmospheres = [
    { name: 'Office', icon: <Compass className="h-4 w-4" />, label: 'Elegância, Profissionalismo', desc: 'Sapatilhas, Scarpins, Bolsas Estruturadas.' },
    { name: 'Night Out', icon: <Flame className="h-4 w-4" />, label: 'Glamour, Ousadia, Festa', desc: 'Saltos altos, Clutches, Brilho.' },
    { name: 'Casual Chic', icon: <Sun className="h-4 w-4" />, label: 'Conforto, Dia a dia', desc: 'Tênis, Mules, Bolsas Tiracolo.' },
    { name: 'Romântico', icon: <Heart className="h-4 w-4" />, label: 'Delicadeza, Encontros', desc: 'Cores suaves, Sandálias bloco.' }
  ];

  const handleRunAnalysis = () => {
    setAnalyzing(true);
    setResponseOutput(null);

    // Simulated Olfactive recommendation derived deterministically
    setTimeout(() => {
      setAnalyzing(false);
      let text = '';
      if (product) {
        text = `**Análise de Estilo Scenzzy AI** para **${product.name}**:\n\n* **Sintonia de Ocasião:** A escolha por *"${selectedAtmosphere}"* possui excelente harmonia com o design de ${product.name}.\n\n* **Como Usar:** Recomendamos combinar com peças versáteis de alfaiataria ou tecidos leves para um look impecável e confortável o dia todo.\n\n*Aproveite o voucher **SCENZZY10** para faturar com 10% OFF prioritário!*`;
      } else {
        text = `**Recomendação Scenzzy AI** baseada no seu perfil *"${selectedAtmosphere}"*:\n\nNós recomendamos experimentar os clássicos **Scarpins e Bolsas Saffiano** para um toque de sofisticação adicional no seu guarda-roupa.`;
      }
      setResponseOutput(text);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="ai-olfactory-advisor-modal">
      <div className="fixed inset-0 bg-stone-900/65 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 z-10 transition-all border border-stone-200">
        
        {/* Header Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-radial from-amber-50 to-gold-100 text-gold-500 rounded-xl border border-gold-200/50">
              <BrainCircuit className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-neutral-900 leading-none">Stylist I.A. Scenzzy</h3>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-1 font-semibold">Gemini Style Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:text-gold-500 text-stone-400 focus:outline-none">
            <X className="h-6 w-6" />
          </button>
        </div>

        {product && (
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/50 flex gap-3 items-center">
            <img src={product.images[0]} alt={product.name} className="h-12 w-12 object-cover rounded-lg bg-white" />
            <div>
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">{product.name}</h4>
              <p className="text-[10px] text-stone-500 line-clamp-1">{product.description}</p>
            </div>
          </div>
        )}

        {/* Action controls */}
        {!responseOutput && !analyzing && (
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block mb-1">Qual a ocasião do seu look hoje?</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {atmospheres.map((atm) => (
                <div
                  key={atm.name}
                  onClick={() => setSelectedAtmosphere(atm.name)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedAtmosphere === atm.name
                      ? 'bg-gold-50/50 border-gold-300 ring-1 ring-gold-300'
                      : 'bg-white hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  <span className={`p-2 rounded-xl mt-0.5 ${selectedAtmosphere === atm.name ? 'bg-gold-500 text-stone-50' : 'bg-stone-50 text-stone-500'}`}>
                    {atm.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">{atm.name}</h4>
                    <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">{atm.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRunAnalysis}
              className="w-full bg-neutral-900 hover:bg-gold-500 text-stone-50 py-3.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all focus:outline-none flex items-center justify-center gap-1.5 shadow-md"
            >
              Iniciar Análise de Estilo <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Loading analyzer animation */}
        {analyzing && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="h-10 w-10 text-gold-500 animate-spin" />
            <p className="text-xs text-stone-500">
              Analisando composições e tendências de moda...
            </p>
          </div>
        )}

        {/* Results Panel */}
        {responseOutput && (
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/50 space-y-4 max-h-[300px] overflow-y-auto font-sans leading-relaxed text-xs text-stone-700">
            {responseOutput.split('\n\n').map((para, i) => (
              <p key={i}>
                {para.replace(/\*\*(.*?)\*\*/g, (_, p) => `<strong>${p}</strong>`).replace(/\*(.*?)\*/g, (_, p) => `<em>${p}</em>`)}
              </p>
            ))}
            <button
              onClick={() => setResponseOutput(null)}
              className="mt-4 text-[10px] uppercase font-bold text-gold-500 underline flex items-center gap-1 focus:outline-none"
            >
              <Sliders className="h-3.5 w-3.5" /> Refazer teste de ocasião
            </button>
          </div>
        )}

        <div className="text-[10px] text-stone-400 text-center flex items-center justify-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-gold-500" />
          <span>A Inteligência Artificial Scenzzy sugere as melhores combinações</span>
        </div>

      </div>
    </div>
  );
}
