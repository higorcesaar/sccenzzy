## Scenzzy Admin — Plano de evolução para CMS completo

Vamos transformar o `/admin/editor` num **painel administrativo full-stack** inspirado em Hostinger Builder + Shopify + Loja Integrada, mantendo a estética premium Arezzo do storefront atual.

A execução será **faseada** (cada fase entrega valor sozinha e é aprovada antes da próxima), porque entregar tudo em uma única migração+PR seria arriscado e impossível de revisar.

---

### Arquitetura geral

- **Banco**: Supabase (Postgres + RLS). Hoje já existem `scz_products`, `scz_categories`, `scz_product_images`, `scz_orders`, `scz_order_items`, `scz_addresses`, `user_roles`, `profiles`. Vamos **estender** essas tabelas em vez de recriar.
- **Mídia**: Cloudflare R2 (bucket `scenzzy`) via server function presignada já existente (`getR2UploadUrl`). Toda imagem/vídeo novo passa por ali.
- **Server logic**: `createServerFn` do TanStack Start (sem Edge Functions). RLS por `has_role(auth.uid(),'admin')`.
- **Layout admin**: novo grupo de rotas `/_authenticated/admin/*` com `SidebarProvider` shadcn, header sticky, breadcrumbs, dark/light. Storefront público **não muda visualmente** nesta entrega.
- **Estado/Data**: TanStack Query (loaders + `useSuspenseQuery`), forms com `react-hook-form` + `zod`, tabelas com `@tanstack/react-table`, drag-and-drop com `@dnd-kit`, gráficos com `recharts`.

---

### Fases (cada uma é um PR/aprovação separado)

**Fase 1 — Fundação do painel (esta entrega)**
1. Migração SQL única que:
   - Estende `scz_products` com: `sku`, `internal_code`, `brand`, `subcategory_id`, `short_description`, `cost_price`, `promo_price`, `weight_g`, `width_cm`, `height_cm`, `depth_cm`, `seo_title`, `seo_description`, `seo_keywords`, `og_image`, `is_active`, `is_featured`, `is_launch`, `is_on_sale`, `is_bestseller`, `stock_qty`, `stock_min`, `stock_reserved`, `stock_sold`.
   - Cria `scz_stock_movements` (entrada/saída/ajuste, com motivo e user_id).
   - Cria `scz_pages` (slug, title, seo_*, status draft/published, blocks jsonb).
   - Cria `scz_page_builder_blocks` (page_id, type, position, props jsonb) — opcional; pode viver dentro de `scz_pages.blocks` jsonb pra simplificar v1.
   - Cria `scz_banners` (location, image_url, link, title, subtitle, position, active, starts_at, ends_at).
   - Cria `scz_settings` (key/value jsonb) — config global da loja.
   - Cria `scz_customers` view sobre `auth.users` + `profiles` + agregados de pedidos.
   - GRANTs corretos + RLS: leitura pública só do que é público (produtos ativos, páginas publicadas, banners ativos); escrita só `admin`.
   - Trigger `scz_stock_apply_movement` que ajusta `stock_qty` automaticamente.
2. Layout `/admin` com sidebar (Dashboard, Produtos, Estoque, Pedidos, Páginas, Banners, Construtor, Clientes, Configurações, SEO).
3. **Dashboard** funcional (vendas dia/mês, ticket médio, pedidos abertos, estoque baixo, novos clientes, gráfico de vendas 30d).
4. **CRUD Produtos** completo (lista com filtros/busca/paginação server-side, formulário com todas as abas: Geral, Mídia, Preço, Estoque, SEO, Flags). Upload de imagens/vídeos pro R2.
5. **Estoque**: tela de movimentações + alertas + ajuste manual.

**Fase 2 — Pedidos & Clientes**
- Painel de pedidos com pipeline de status (Kanban opcional), detalhe do pedido, histórico, atualização de status, geração de etiqueta placeholder.
- Lista de clientes com LTV, último pedido, endereços.

**Fase 3 — CMS de Páginas + SEO global**
- CRUD de páginas (Home, Sobre, Contato, Políticas, + custom).
- Editor de SEO por página/produto/categoria.
- Renderização pública das páginas em `/p/$slug`.

**Fase 4 — Construtor visual drag-and-drop**
- `@dnd-kit` com paleta de blocos (Hero, Banner, Carrossel, Produtos, Coleções, Vídeo, Galeria, FAQ, Depoimentos, Newsletter, Rodapé).
- Cada bloco = componente React + schema zod de props + painel lateral de edição (texto inline, color picker, spacing, font).
- Preview ao vivo (iframe) com viewport desktop/tablet/mobile.
- Persistência em `scz_pages.blocks` (jsonb versionado: draft vs published).
- Home passa a ser renderizada a partir desse jsonb (com fallback pro layout atual se vazio).

**Fase 5 — Banners, Campanhas, Configurações da loja**
- Gerenciamento de banners por localização (home-hero, home-mid, categoria-x).
- Configurações: dados da loja, redes sociais, frete, métodos de pagamento toggles.

---

### Detalhes técnicos relevantes

```text
src/routes/_authenticated/admin/
  route.tsx            ← layout com Sidebar (gate de role=admin no beforeLoad client-side)
  index.tsx            ← Dashboard
  produtos/
    index.tsx          ← lista
    novo.tsx
    $id.tsx            ← editor (tabs)
  estoque/index.tsx
  pedidos/
    index.tsx
    $id.tsx
  paginas/
    index.tsx
    $id.tsx            ← construtor visual (fase 4)
  banners/index.tsx
  clientes/index.tsx
  seo/index.tsx
  configuracoes/index.tsx

src/lib/admin/
  products.functions.ts
  stock.functions.ts
  orders.functions.ts
  pages.functions.ts
  banners.functions.ts
  dashboard.functions.ts
  customers.functions.ts
  settings.functions.ts
```

- Todas as server fns usam `requireSupabaseAuth` + checagem `has_role(userId,'admin')`.
- Lista de produtos: paginação server-side + busca full-text (`ilike` em nome/sku) — escalável pra milhares.
- `react-hook-form` + `zodResolver` em todos os forms.
- `sonner` (já presente) para toasts.
- Storefront público segue lendo de `src/data/catalog.ts` por enquanto; em paralelo adicionamos um server fn `listPublicProducts()` que lê do Supabase, e na Fase 3/4 trocamos o storefront pra consumir do banco (mantendo fallback).

### Pacotes a adicionar
`@dnd-kit/core @dnd-kit/sortable @tanstack/react-table react-hook-form @hookform/resolvers zod recharts` (zod e react-hook-form podem já estar).

### Segurança
- Todas as tabelas novas: RLS ON, policies `admin` para escrita; leitura pública apenas onde faz sentido (banners ativos, páginas publicadas, produtos ativos).
- Service role nunca no client. Uploads R2 já são presignados via server fn protegida.

### O que **não** muda nesta Fase 1
- Visual do storefront público (`/`, `/sapatos`, etc.) permanece igual.
- Checkout atual permanece.
- Login/registro atual permanece.

---

### Confirmações antes de eu começar

1. **Posso começar pela Fase 1** (migração + sidebar admin + dashboard + CRUD produtos + estoque) e seguir nas próximas conforme você aprovar? Ou prefere outra ordem (ex.: começar pelo construtor visual)?
2. **Catálogo público**: na Fase 1 eu mantenho o storefront lendo do `catalog.ts` estático e o admin grava no Supabase em paralelo. A troca total (storefront ler do banco) fica pra Fase 3. Tudo certo?
3. **Idioma do painel**: 100% pt-BR, certo?
