# Auditoria do Painel Admin × Vitrine

## Status atual (já implementado nas iterações anteriores)

- Supabase como banco principal — OK (`scz_products`, `scz_categories`, `scz_collections`, `scz_product_variants`, `scz_stock_movements`).
- Trigger `scz_apply_stock_movement` faz baixa automática (venda/saida/ajuste/entrada) por produto **e** por variação.
- Admin tem CRUD completo de produtos, categorias (com subcategorias e `is_in_menu`), coleções, variações e estoque.
- Upload de imagens via R2 (`getR2UploadUrl` + `scz_product_images`).
- RLS: produtos/categorias/coleções/variações ativas legíveis pelo público; mutações exigem `requireAdmin`.
- `storefront.functions.ts` lê tudo do Supabase com filtros por categoria, coleção, promo, lançamento.

## Lacunas reais encontradas

1. **`src/components/Storefront.tsx`** ainda importa `PRODUCTS` de `src/data/catalog.ts` (hardcoded) e mistura com dados do banco. CartDrawer/CheckoutModal/StoreFinder também importam dali.
2. **`src/components/Header.tsx`** tem menu hardcoded (`/sapatos`, `/bolsas`, `/cintos`, `/novidades`, `/promocao`). Categorias novas criadas no admin **não aparecem no menu**.
3. **Rotas estáticas** `sapatos.tsx`, `bolsas.tsx`, `cintos.tsx` existem como arquivos fixos. Categorias novas no admin não geram página automática.
4. **`ProductDetailModal`** e **CartDrawer** ainda usam o shape antigo do `catalog.ts` (não respeitam variações reais nem estoque por SKU).

## O que será feito nesta execução

### A. Vitrine 100% dinâmica
- Remover `PRODUCTS` de `Storefront.tsx`; render baseado **somente** em `listPublicProducts` (já existe).
- Substituir uso de `PRODUCTS` em `CartDrawer`, `CheckoutModal`, `StoreFinder` por dados vindos do produto adicionado ao carrinho (que já carrega tudo).
- Manter `src/data/catalog.ts` apenas com tipos auxiliares (ou removê-lo se não houver mais imports).

### B. Menu dinâmico no Header
- Header consome `listPublicCategories()` (já existe) e renderiza apenas categorias com `is_in_menu = true`, ordenadas por `sort_order`.
- Links apontam para `/c/{slug}` (rota dinâmica nova).
- Mantém atalhos fixos: Novidades (`is_launch`) e Promoção (`is_on_sale`).

### C. Rota dinâmica de categoria
- Criar `src/routes/c.$slug.tsx` que chama `listPublicProducts({ categorySlug })`.
- Criar `src/routes/colecao.$slug.tsx` para coleções.
- Manter as rotas antigas (`sapatos`, `bolsas`, `cintos`) como redirects para `/c/<slug>` para não quebrar links existentes.

### D. Modal de detalhes com variações reais
- `ProductDetailModal` lê `product.variants` (já vem de `listPublicProducts`). Mostra seletor de tamanho/cor real; bloqueia "adicionar" se variação sem estoque.
- `CartDrawer` exibe variação selecionada (size/color) e usa `stockQty` para limitar quantidade.

### E. Validação final
- Smoke test via Playwright: criar categoria "Teste" com `is_in_menu`, criar produto nela, abrir home → categoria aparece no menu → `/c/teste` lista o produto → adicionar ao carrinho → variação aplicada.

## Fora de escopo (já funciona ou nunca foi pedido)
- Migração R2 (já está em uso para uploads).
- Cloudflare DNS/SSL/cache (gerenciado pela Lovable na publicação).
- Refatoração visual / redesign.
- Checkout/pagamento real.

Posso seguir com A→E?