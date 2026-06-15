# Reestruturação Completa do Painel Admin

Este é um trabalho grande (banco + backend + frontend). Vou dividir em **5 fases** sequenciais, cada uma entregue de forma testável.

## Diagnóstico atual

Problemas identificados no painel:
- **Categorias engessadas**: hard-coded em 5 "Seções" (tenis/salto/bolsa/cinto/acessorio). Sem cadastro/edição/exclusão.
- **Sem subcategorias** funcionais, sem ordenação, sem controle de menu.
- **Variações ausentes**: estoque é um único número, sem grade por tamanho/cor/modelo.
- **Storefront desconectado**: páginas `/sapatos`, `/bolsas`, `/cintos`, `/novidades`, `/promocao` usam dados estáticos ou filtros frágeis baseados em slug de categoria fixo.
- **Sem duplicar produto**, sem ordenação, sem coleção.
- **Sem coleção/roupas** — banco só suporta as 5 seções hardcoded.
- **`promo_price` vs `price_cents`**: tipos inconsistentes (numeric vs cents).
- **Estoque**: módulo existe mas sem variações; baixa por venda existe via trigger mas não há fluxo de pedido testado.
- Permissões OK (RLS + `has_role`), mas várias páginas admin são "ComingSoon".

## Fase 1 — Banco de dados (migration)

Reformular schema para suportar variações, categorias dinâmicas e coleções:

```text
scz_categories
  + sort_order, is_in_menu, image_url, description
  + parent_id já existe → ativa subcategorias

scz_collections (NOVO)
  id, name, slug, description, image_url, is_active, sort_order

scz_product_variants (NOVO)
  id, product_id, sku, size, color, color_hex, model,
  price_cents (override opcional), promo_price (override),
  stock_qty, stock_min, barcode, sort_order

scz_products
  + collection_id (FK opcional)
  + has_variants boolean
  + remover obrigatoriedade de category_id (já é nullable)

scz_stock_movements
  + variant_id (nullable) → movimenta por variação quando aplicável
```

Triggers atualizados:
- `scz_apply_stock_movement` passa a aplicar em `scz_product_variants` quando `variant_id` informado, senão em `scz_products`.
- Garantir GRANTs (authenticated + service_role) em todas as novas tabelas; SELECT anônimo apenas em `scz_collections` e `scz_product_variants` (catálogo público).

## Fase 2 — Server functions (admin)

Novos módulos em `src/lib/admin/`:
- `categories.functions.ts`: list/create/update/delete/reorder, suporte a subcategoria, toggle de menu.
- `collections.functions.ts`: CRUD de coleções.
- `variants.functions.ts`: CRUD de variações por produto, ajuste de estoque por variação.
- Reformar `products.functions.ts`:
  - Remover enum hardcoded de SECTION_SLUGS — aceitar `category_id` livre.
  - Aceitar `collection_id`, `sort_order`, `has_variants`, lista de variantes.
  - `duplicateProduct(id)` (clona produto + imagens + variantes, novo slug).
- Reformar `stock.functions.ts`:
  - Aceitar `variant_id` opcional.
  - Listar alertas por produto **e** por variação.
- Atualizar `storefront.functions.ts` (público):
  - `listPublicProducts({ categorySlug?, collectionSlug?, onlyOnSale?, onlyLaunch? })`
  - Retornar variantes (tamanhos/cores disponíveis).
  - `listPublicCategories()` para o menu.

## Fase 3 — UI Admin

Novas páginas:
- `/admin/categorias` — árvore (categoria + subcategorias), drag-handle de ordenação, toggle "exibir no menu", upload de imagem.
- `/admin/colecoes` — CRUD simples (lista + form).
- `ProductForm` reescrito:
  - Selector de categoria/subcategoria livre (combobox com search), **não** mais 5 abas fixas.
  - Selector de coleção (opcional).
  - Aba **Variações**: tabela editável (Tamanho × Cor × SKU × Estoque × Preço override). Botão "Gerar grade" a partir de listas de tamanhos e cores.
  - Botão **Duplicar produto**.
  - Campo `sort_order`.
- `/admin/produtos` lista:
  - Ações: ativar/desativar (inline), duplicar, excluir (já existe), reordenar.
- `/admin/estoque` ampliado:
  - Mostrar variações, filtro por produto/variação, motivo, exportar CSV.
  - Alertas incluem variações abaixo do mínimo.

## Fase 4 — Storefront (sincronização)

- Substituir `src/data/catalog.ts` como fonte → `listPublicProducts` é único source-of-truth.
- Cada rota (`/sapatos`, `/bolsas`, `/cintos`, `/novidades`, `/promocao`) consulta por `categorySlug` ou flags vindas do banco.
- Header/menu usa `listPublicCategories({ inMenu: true, ordered: true })` em vez de links hardcoded.
- `ProductDetailModal`: exibe seletor de tamanho/cor a partir de `scz_product_variants` quando `has_variants = true`; estoque mostrado por variação.
- Invalidação automática: toda mutation admin invalida `["public-products"]` e `["public-categories"]`.

## Fase 5 — Validação

- Testes manuais via Playwright em modo headless:
  1. Criar categoria + subcategoria → aparece no menu.
  2. Criar coleção "Verão 2026".
  3. Criar produto com 2 tamanhos × 2 cores → grade de 4 variantes salva.
  4. Editar preço promocional → reflete na vitrine.
  5. Reduzir estoque de uma variação → alerta aparece.
  6. Duplicar produto → novo slug, mesma estrutura.
  7. Desativar produto → some da vitrine.
  8. Excluir categoria com produtos → bloqueia ou recategoriza.
- Conferir `useServerFn` em todos os botões; toasts de sucesso/erro com mensagem clara.

## Detalhes técnicos

- **Compatibilidade retroativa**: produtos existentes ganham `has_variants = false` e continuam funcionando com `stock_qty` no produto.
- **Slugs únicos** validados no servidor (categorias, coleções, produtos).
- **Cascade**: deletar produto → deleta variants + images + movements (CASCADE no FK).
- **Performance**: índices em `scz_product_variants(product_id)`, `scz_categories(parent_id, sort_order, is_in_menu)`.
- **Segurança**: todas as server fns admin via `requireAdmin`; storefront via anon key com RLS `is_active = true`.

## O que NÃO está no escopo

- Cupons, frete, gateway de pagamento, multi-loja, multi-idioma, app mobile.
- Migração de tema visual / redesign (mantém o look-and-feel atual).

---

Posso começar pela **Fase 1 (migration do banco)** assim que você aprovar. As fases seguintes saem em sequência, cada uma testável antes de avançar.
