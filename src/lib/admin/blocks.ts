import { z } from "zod";

export const BLOCK_TYPES = [
  "hero",
  "banner",
  "rich_text",
  "product_grid",
  "gallery",
  "newsletter",
  "faq",
  "cta",
  "spacer",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_LABEL: Record<BlockType, string> = {
  hero: "Hero",
  banner: "Banner",
  rich_text: "Texto",
  product_grid: "Vitrine de produtos",
  gallery: "Galeria",
  newsletter: "Newsletter",
  faq: "FAQ",
  cta: "Chamada (CTA)",
  spacer: "Espaçamento",
};

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, any>;
}

export const blockSchema = z.object({
  id: z.string(),
  type: z.enum(BLOCK_TYPES),
  props: z.record(z.string(), z.any()),
});

export function defaultProps(type: BlockType): Record<string, any> {
  switch (type) {
    case "hero":
      return {
        title: "Nova coleção",
        subtitle: "Edição limitada",
        image: "",
        cta_label: "Ver agora",
        cta_link: "/novidades",
      };
    case "banner":
      return { image: "", link: "", alt: "" };
    case "rich_text":
      return { html: "<p>Escreva aqui…</p>" };
    case "product_grid":
      return { title: "Mais vendidos", columns: 4, slugs: [] };
    case "gallery":
      return { images: [] as string[] };
    case "newsletter":
      return { title: "Receba novidades", subtitle: "Cadastre seu e-mail e ganhe 10% off" };
    case "faq":
      return { items: [{ q: "Como funciona a troca?", a: "Você tem 30 dias para trocar." }] };
    case "cta":
      return {
        title: "Visite uma loja",
        subtitle: "Encontre a Scenzzy mais próxima",
        button_label: "Ver lojas",
        button_link: "/#near-you",
        bg: "#1c1917",
      };
    case "spacer":
      return { height: 64 };
  }
}

export function newBlock(type: BlockType): Block {
  return {
    id: (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) as string,
    type,
    props: defaultProps(type),
  };
}
