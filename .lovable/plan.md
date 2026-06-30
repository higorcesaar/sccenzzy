# Plano: Scenzzy → Plataforma E-commerce Profissional

Escopo gigantesco. Vou entregar em **fases incrementais**, cada uma utilizável em produção antes da próxima. Mantemos React + TanStack Start + Supabase, reaproveitando o que já existe (`scz_products`, `scz_categories`, `scz_collections`, `scz_orders`, `scz_product_variants`, `scz_stock_movements`, `AdminSidebar`, `ProductForm`, `PageBuilder`, etc.).

## Princípios

- **Zero dados mockados na vitrine.** Remover `src/data/catalog.ts` da Storefront/Home/Categoria. Toda leitura via `listPublic*` server fns.
- **Reaproveitar antes de criar.** Estender tabelas/forms existentes em vez de duplicar.
- **RLS sempre.** Leitura pública só em colunas seguras; escrita admin via `requireAdmin`.
- **Cada fase = migração + server fns + UI admin + UI loja**, entregue e testável.

---

## Fase 1 — Fundação de dados (migrações)

Estender schema sem quebrar o que existe.

- `scz_brands` (nova): name, slug, logo, description, is_active.
- `scz_products` (alter): adicionar `sku`, `internal_code`, `barcode`, `brand_id`, `subcategory_id`, `installments_max`, `weight_g`, `height_cm`, `width_cm`, `length_cm`, `meta_title`, `meta_description`. (Já tem promo, featured, launch, on_sale, tags, slug.)
- `scz_product_variants` (alter): adicionar `sku`, `barcode`, `weight_g`, `image_url`. (Já tem size/color/price/stock.)
- `scz_coupons` (nova): code, type (percent/fixed), value, min_order, max_uses, used_count, valid_from, valid_until, is_active.
- `scz_customers_addresses` — já existe (`scz_addresses`). Adicionar `scz_customer_favorites`, `scz_customer_cards` (tokenizados, sem PAN cru).
- `scz_banners` (alter): adicionar `image_desktop`, `image_tablet`, `image_mobile`, `video_url`, `scheduled_from`, `scheduled_until`, `button_text`, `button_link`, `position`.
- `scz_home_blocks` (nova): home page builder — type, props (jsonb), sort_order, is_visible, device_visibility.
- `scz_orders` (alter): adicionar `tracking_code`, `nfe_url`, `notes`, `timeline` (jsonb append-only).
- `scz_stock_movements` — já existe com tipos entrada/saida/venda/devolucao/ajuste. Adicionar `transferencia` + `reference_order_id`.
- Todas com `GRANT`s + RLS (`has_role('admin')` para escrita; SELECT público só onde `is_active`).

## Fase 2 — Vitrine 100% Supabase

- Apagar imports de `PRODUCTS`/`COUPONS`/`STORES_PICKUP` da Storefront, Home, CategoryView, ProductDetailModal.
- `Storefront` consome `listPublicProducts`, `listPublicCategories`, `listPublicCollections`, `listPublicBrands`, `listPublicHomeBlocks`.
- Skeleton loading + paginação + busca em tempo real (debounced) + filtros (marca, categoria, preço, tags, promoção).
- Manter `src/data/catalog.ts` apenas como seed opcional (migração de dados), depois deletar.

## Fase 3 — Admin: Produtos + Variações + Estoque

- Expandir `ProductForm`: todas as abas (Geral, SEO, Dimensões, Marca/Categoria, Variações, Imagens, Status).
- Editor rico: `@tiptap/react` para descrição completa.
- Grid de variações com SKU/preço/estoque/imagem por linha; geração automática a partir de matriz (cor × tamanho).
- Tela **Estoque** com filtros + modal de movimentação (entrada/saída/ajuste/transferência) + timeline por produto/variação.
- Reaproveita `scz_apply_stock_movement` trigger já existente.

## Fase 4 — Admin: Marcas, Coleções, Categorias, Cupons, Banners

- CRUDs padronizados com tabela + drawer de edição (reusar shadcn `Sheet`).
- Banners: upload R2 (já temos `r2.functions.ts`) com 3 variantes (desktop/tablet/mobile), preview por device, agendamento.
- Cupons: validação no checkout (substitui `COUPONS` mockado).

## Fase 5 — Home Builder (Drag & Drop)

- Estender `PageBuilder` existente para a Home (tabela `scz_home_blocks`).
- `@dnd-kit/sortable` para reorder, duplicar, ocultar, remover.
- Blocos: Banner, Carrossel, Vídeo, Produtos (curados/auto), Categorias, Coleções, Texto, Imagem, Instagram, Avaliações, FAQ, Newsletter, Rodapé.
- `BlockRenderer` já existe — adicionar novos tipos.
- Preview live + publicação versionada.

## Fase 6 — Pedidos + Checkout integrado

- Tela admin de pedido com **timeline** (criado → pago → separado → enviado → entregue), edição de tracking, NFe, observações.
- Webhook de pagamento (route `/api/public/webhooks/payment`) atualiza status + grava movimento de venda (estoque).
- Cupom aplicado no checkout grava `discount_amount` + `coupon_id`.

## Fase 7 — Área do Cliente

- Rotas `_authenticated/conta/{pedidos,enderecos,favoritos,cartoes,cupons}`.
- Componentes reaproveitam `CheckoutModal` (endereços) e tabela `scz_addresses`.
- Favoritos: botão coração em `ProductCard` → `scz_customer_favorites`.

## Fase 8 — Dashboard + Financeiro + SEO + Config + Usuários

- Dashboard: faturamento (dia/semana/mês), ticket médio, top produtos, sem estoque, parados (>60d sem venda), lucro estimado (preço − custo).
- Adicionar `cost_price` em `scz_products` para cálculo de margem.
- SEO: editor global (title/description default), sitemap dinâmico, robots, OG por rota.
- Config: dados da loja, frete (já temos Correios), métodos de pagamento, e-mails.
- Usuários: tabela admin de `user_roles` (promover/remover admin), lista de clientes em `scz_customers`.

## Fase 9 — Polimento

- Skeletons em todas as listas, animações com Framer Motion (já instalado?), toasts consistentes, paginação server-side em todas as tabelas admin, busca global (cmdk).
- Auditoria de acessibilidade + responsividade mobile do admin.

---

## Detalhes técnicos

- **Tipagem**: gerar types após cada migração (`src/integrations/supabase/types.ts` regenera).
- **Server fns**: padronizar `src/lib/admin/<modulo>.functions.ts` com `requireAdmin` e `src/lib/<modulo>.functions.ts` público.
- **Editor rico**: `bun add @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image`.
- **DnD**: `@dnd-kit/core @dnd-kit/sortable` (verificar se já está).
- **Uploads**: `r2.functions.ts` existente; adicionar helper de variantes de imagem.
- **Compatibilidade**: manter rotas e nomes de componentes atuais; novas telas adicionadas sem quebrar `/admin/*` existente.

---

## Entrega sugerida (próxima ação)

Cada fase é grande. Sugiro começar por:

**Fase 1 (migrações) + Fase 2 (vitrine 100% Supabase)** — base obrigatória para tudo o mais.

Se aprovar, eu executo Fase 1+2 já neste ciclo: migração SQL única + remoção de mocks + ajustes em Storefront/Home/Category. As fases seguintes vêm em mensagens subsequentes (uma por vez para revisar).

**Confirme:**
1. Posso começar por Fase 1 + 2?
2. Algum módulo das fases 3-9 que você quer **priorizar** ou **adiar**?
3. Editor rico Tiptap está OK (alternativa: textarea Markdown)?
