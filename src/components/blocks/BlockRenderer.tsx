import type { Block } from "@/lib/admin/blocks";

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
      return (
        <section className="py-12 max-w-7xl mx-auto px-4">
          {p.title && <h3 className="font-serif text-2xl font-bold mb-6">{p.title}</h3>}
          <div className={`grid gap-4 grid-cols-2 md:grid-cols-${Math.min(p.columns || 4, 4)}`}>
            {(p.slugs || []).map((s: string) => (
              <div key={s} className="aspect-[3/4] rounded-xl bg-stone-100 flex items-center justify-center text-xs text-stone-500">
                {s}
              </div>
            ))}
            {(!p.slugs || p.slugs.length === 0) && (
              <div className="col-span-full text-center text-sm text-stone-500 py-8">
                Sem produtos selecionados
              </div>
            )}
          </div>
        </section>
      );
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
