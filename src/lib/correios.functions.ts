import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const QuoteInput = z.object({
  cepDestino: z.string().min(8).max(9),
  pesoGramas: z.number().int().min(100).max(30000).optional(),
  comprimento: z.number().min(1).max(105).optional(),
  largura: z.number().min(1).max(105).optional(),
  altura: z.number().min(1).max(105).optional(),
  // quantidade de itens — multiplica peso padrão
  quantidade: z.number().int().min(1).max(50).optional(),
});

export const cotarFrete = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => QuoteInput.parse(d))
  .handler(async ({ data }) => {
    const { calcularFreteCorreios } = await import("./correios.server");
    const qty = data.quantidade ?? 1;
    try {
      const quotes = await calcularFreteCorreios(data.cepDestino, {
        pesoGramas: data.pesoGramas ?? 800 * qty, // ~800g por item (caixa de calçado)
        comprimento: data.comprimento ?? 30,
        largura: data.largura ?? 22,
        altura: data.altura ?? Math.min(60, 12 * qty),
      });
      return { ok: true as const, quotes };
    } catch (e: any) {
      return { ok: false as const, error: e?.message ?? "Erro ao cotar frete", quotes: [] };
    }
  });
