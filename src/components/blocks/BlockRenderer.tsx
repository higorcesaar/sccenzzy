import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { Block } from "@/lib/admin/blocks";
import { listPublicProducts } from "../../lib/storefront.functions";
import ProductCard from "../ProductCard";
import ProductDetailModal from "../ProductDetailModal";
import { useToast } from "../../hooks/useToast";
import type { Product } from "../../types";

/**
 * Renderiza um array de blocos (público e preview).
 * Mantém HTML simples e estiloso, consistente com o resto do storefront.
 */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks?.length) {
    return (
      <div className="py-20 text-center text-sm text-stone-500">
        Esta página ainda não tem blocos.
      </div>
    );
  }
  return (
    <div className="space-y-0">
      {blocks.map((b) => (
        <BlockView key={b.id} block={b} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  const p = block.props || {};
  switch (block.type) {
    case "hero":
      return (
        <section
          className="relative min-h-[60vh] flex items-center justify-center text-white"
          style={
            p.image
              ? { backgroundImage: `linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.5)), url(${p.image})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: "#1c1917" }
          }
        >
          <div className="text-center px-6 max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.4em] text-amber-300">{p.subtitle}</p>
            <h2 className="mt-3 font-serif text-4xl md:text-6xl font-extrabold">{p.title}</h2>
            {p.cta_label && (
              <a
                href={p.cta_link || "#"}
                className="inline-block mt-8 px-8 py-3 bg-amber-500 text-neutral-900 font-bold uppercase tracking-widest text-xs hover:bg-amber-400 transition"
              >
                {p.cta_label}
              </a>
            )}
          </div>
        </section>
      );
    case "banner":
      return (
        <section className="py-6">
          <div className="max-w-7xl mx-auto px-4">
            {p.link ? (
              <a href={p.link}>
                <img src={p.image} alt={p.alt || ""} className="w-full rounded-2xl" />
              </a>
            ) : (
              <img src={p.image} alt={p.alt || ""} className="w-full rounded-2xl" />
            )}
          </div>
        </section>
      );
    case "rich_text":
      return (
        <section className="py-12">
          <div
            className="max-w-3xl mx-auto px-4 prose prose-stone prose-headings:font-serif"
            dangerouslySetInnerHTML={{ __html: p.html || "" }}
          />
        </section>
      );
    case "product_grid":
      return <ProductGridBlock p={p} />;
    case "gallery":
      return (
        <section className="py-12 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(p.images || []).map((src: string, i: number) => (
              <img key={i} src={src} alt="" className="w-full aspect-square object-cover rounded-xl" />
            ))}
          </div>
        </section>
      );
    case "newsletter":
      return (
        <section className="py-16 bg-amber-50">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h3 className="font-serif text-3xl font-bold text-neutral-900">{p.title}</h3>
            <p className="mt-2 text-sm text-stone-600">{p.subtitle}</p>
            <form className="mt-6 flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="seu@email.com"
                className="flex-1 px-4 py-3 rounded-full bg-white border border-stone-200 text-sm"
              />
              <button className="px-6 py-3 bg-neutral-900 text-white rounded-full text-xs font-bold uppercase tracking-widest">
                Assinar
              </button>
            </form>
          </div>
        </section>
      );
    case "faq":
      return (
        <section className="py-12 max-w-3xl mx-auto px-4 space-y-3">
          {(p.items || []).map((it: any, i: number) => (
            <details key={i} className="border border-stone-200 rounded-xl p-4 group">
              <summary className="font-semibold cursor-pointer">{it.q}</summary>
              <p className="mt-2 text-sm text-stone-600">{it.a}</p>
            </details>
          ))}
        </section>
      );
    case "cta":
      return (
        <section className="py-20 text-white text-center" style={{ background: p.bg || "#1c1917" }}>
          <div className="max-w-2xl mx-auto px-4">
            <h3 className="font-serif text-3xl md:text-4xl font-extrabold">{p.title}</h3>
            <p className="mt-3 text-stone-300">{p.subtitle}</p>
            {p.button_label && (
              <a
                href={p.button_link || "#"}
                className="inline-block mt-6 px-8 py-3 bg-amber-500 text-neutral-900 font-bold uppercase tracking-widest text-xs hover:bg-amber-400 transition"
              >
                {p.button_label}
              </a>
            )}
          </div>
        </section>
      );
    case "spacer":
      return <div style={{ height: `${p.height || 64}px` }} />;
    default:
      return null;
  }
}

function ProductGridBlock({ p }: { p: any }) {
  const { addToast } = useToast();
  const fetchProducts = useServerFn(listPublicProducts);
  const { data: dbProducts = [] } = useQuery({
    queryKey: ["public-products", "renderer"],
    queryFn: () => fetchProducts(),
    staleTime: 30_000,
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleAddToCart = (product: Product, size: string) => {
    addToast(`${product.name} (Tamanho ${size}) foi adicionado à sacola de compras!`, 'cart', 'Sacola Atualizada');
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const slugs = (p.slugs || []).map((s: string) => s.trim().toLowerCase()).filter(Boolean);

  // Match dbProducts to slugs
  const matchedProducts = slugs
    .map((slug: string) => {
      return dbProducts.find(
        (prod: any) =>
          prod.id.toLowerCase() === slug || prod.dbId?.toLowerCase() === slug
      );
    })
    .filter(Boolean) as Product[];

  return (
    <section className="py-12 max-w-7xl mx-auto px-4">
      {p.title && <h3 className="font-serif text-2xl font-bold mb-6 text-center text-neutral-900">{p.title}</h3>}
      {matchedProducts.length > 0 ? (
        <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-${Math.min(p.columns || 4, 4)}`}>
          {matchedProducts.map((prod, idx) => (
            <ProductCard
              key={`${prod.id}-${idx}`}
              product={prod}
              onAddToCart={handleAddToCart}
              onSelect={handleProductSelect}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {(p.slugs || []).filter(Boolean).map((s: string) => (
            <div key={s} className="aspect-[3/4] rounded-2xl bg-stone-150 border border-stone-250 flex flex-col items-center justify-center text-xs text-stone-500 p-4 text-center">
              <span className="font-semibold block mb-1">Produto não encontrado</span>
              <span className="font-mono text-[10px] opacity-70">{s}</span>
            </div>
          ))}
          {(!p.slugs || p.slugs.filter(Boolean).length === 0) && (
            <div className="col-span-full text-center text-sm text-stone-500 py-8">
              Sem produtos selecionados
            </div>
          )}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          product={selectedProduct}
          onAddToCart={handleAddToCart}
        />
      )}
    </section>
  );
}
