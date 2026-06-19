// Servidor-only: integração com APIs dos Correios.
// Cache do token em memória (curto-vivo, ~24h) para evitar reautenticação a cada request.

const TOKEN_URL = "https://api.correios.com.br/token/v1/autentica/cartaopostagem";
const PRECO_URL = "https://api.correios.com.br/preco/v1/nacional";
const PRAZO_URL = "https://api.correios.com.br/prazo/v1/nacional";

// Configuração da loja
export const CORREIOS_CONFIG = {
  cepOrigem: "58415670",
  nuContrato: "9912666359",
  nuCartaoPostagem: "0078693870",
  // Códigos de serviços do contrato
  servicos: [
    { codigo: "03298", nome: "PAC", descricao: "Entrega econômica" },
    { codigo: "03220", nome: "SEDEX", descricao: "Entrega expressa" },
    { codigo: "04227", nome: "Mini Envios", descricao: "Pacotes pequenos" },
  ],
} as const;

type TokenCache = { token: string; expiraEm: number };
let tokenCache: TokenCache | null = null;

export async function getCorreiosToken(): Promise<string> {
  const now = Date.now();
  // Renova se faltar menos de 30 min
  if (tokenCache && tokenCache.expiraEm - now > 30 * 60 * 1000) {
    return tokenCache.token;
  }

  const usuario = process.env.CORREIOS_USUARIO;
  const codigo = process.env.CORREIOS_CODIGO_ACESSO;
  if (!usuario || !codigo) {
    throw new Error("Credenciais dos Correios não configuradas");
  }

  const basic = Buffer.from(`${usuario}:${codigo}`).toString("base64");
  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify({
      numero: CORREIOS_CONFIG.nuCartaoPostagem,
      contrato: CORREIOS_CONFIG.nuContrato,
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Falha ao autenticar nos Correios (${resp.status}): ${txt.slice(0, 200)}`);
  }

  const data = (await resp.json()) as { token: string; expiraEm: string };
  tokenCache = {
    token: data.token,
    expiraEm: new Date(data.expiraEm).getTime(),
  };
  return data.token;
}

export interface ShippingQuote {
  codigo: string;
  nome: string;
  descricao: string;
  preco: number; // em reais
  prazoDias: number;
  erro?: string;
}

interface PackageDims {
  pesoGramas: number;
  comprimento: number; // cm
  largura: number;
  altura: number;
}

export async function calcularFreteCorreios(
  cepDestino: string,
  pkg: PackageDims,
): Promise<ShippingQuote[]> {
  const cepLimpo = cepDestino.replace(/\D/g, "");
  if (cepLimpo.length !== 8) throw new Error("CEP de destino inválido");

  const token = await getCorreiosToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Limites mínimos exigidos pelos Correios
  const comprimento = Math.max(16, Math.min(105, pkg.comprimento));
  const largura = Math.max(11, Math.min(105, pkg.largura));
  const altura = Math.max(2, Math.min(105, pkg.altura));
  const peso = Math.max(100, pkg.pesoGramas); // mínimo 100g

  const parametros = CORREIOS_CONFIG.servicos.map((s, i) => ({
    coProduto: s.codigo,
    nuRequisicao: String(i + 1),
    cepOrigem: CORREIOS_CONFIG.cepOrigem,
    cepDestino: cepLimpo,
    psObjeto: String(peso),
    tpObjeto: "2", // pacote
    comprimento: String(comprimento),
    largura: String(largura),
    altura: String(altura),
    nuContrato: CORREIOS_CONFIG.nuContrato,
    nuDR: 30,
    servicosAdicionais: [],
  }));

  const body = JSON.stringify({
    idLote: String(Date.now()),
    parametrosProduto: parametros,
  });

  const [precoResp, prazoResp] = await Promise.all([
    fetch(PRECO_URL, { method: "POST", headers, body }),
    fetch(PRAZO_URL, { method: "POST", headers, body }),
  ]);

  const precoJson = (await precoResp.json().catch(() => [])) as any[];
  const prazoJson = (await prazoResp.json().catch(() => [])) as any[];

  return CORREIOS_CONFIG.servicos.map((s) => {
    const p = Array.isArray(precoJson)
      ? precoJson.find((x) => x.coProduto === s.codigo)
      : undefined;
    const z = Array.isArray(prazoJson)
      ? prazoJson.find((x) => x.coProduto === s.codigo)
      : undefined;

    const precoStr = p?.pcFinal ?? p?.pcBase ?? "0";
    const preco = Number(String(precoStr).replace(",", ".")) || 0;
    const prazoDias = Number(z?.prazoEntrega ?? 0) || 0;
    const erro = p?.txErro || z?.txErro;

    return {
      codigo: s.codigo,
      nome: s.nome,
      descricao: s.descricao,
      preco,
      prazoDias,
      erro: erro || (preco === 0 ? "Serviço indisponível" : undefined),
    };
  });
}
