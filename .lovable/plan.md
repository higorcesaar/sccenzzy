# Refatoração do Painel Administrativo — Produtos × Estoque

**Regra de ouro:** o frontend da loja não muda. Toda alteração ocorre em `/admin/*` e nas server functions administrativas. A vitrine continua lendo `stock_qty` (agregado) via views/campos calculados, sem quebra.

---

## 1. Banco de dados (migração única)

### Novas tabelas
- `scz_stock_locations` — depósito, loja física, showroom, CD. Campos: `name`, `slug`, `type`, `is_active`.
- `scz_stock` — estoque por (produto, variação, local). Campos: `product_id`, `variant_id` (nullable), `location_id`, `qty`, `min_qty`, `location_label` (corredor/prateleira), `last_movement_at`. Único por (product_id, variant_id, location_id).
- `scz_suppliers` — fornecedores: `name`, `document`, `email`, `phone`.
- `scz_stock_entries` — cabeçalho de entrada: fornecedor, NF, data, usuário, observação.
- `scz_brands` — marcas (se ainda não existir): `name`, `slug`, `logo_url`.

### Alterações
- `scz_products`: adicionar `brand_id`, `subcategory_id`, `gender`, `material`, `weight_g`, `height_cm`, `width_cm`, `length_cm`, `is_exclusive`, `meta_title`, `meta_description`. **Manter** `stock_qty` e `stock_min` como colunas espelhadas (calculadas por trigger a partir de `scz_stock`) para não quebrar a vitrine.
- `scz_product_variants`: adicionar `internal_code`, `material`, `finish`. **Remover** `stock_qty` da UI de cadastro (coluna continua no BD como espelho, populada pelo trigger).
- `scz_stock_movements`: adicionar `location_id`, `location_to_id` (para transferências), `variant_id` (já existe?), `unit_cost_cents`, `entry_id` (FK opcional), `qty_before`, `qty_after`, `reason` (enum ampliado: venda, troca, perda, danificado, brinde, uso_interno, garantia, devolucao, entrada, ajuste, transferencia, inventario, outros).

### Trigger
Reescrever `scz_apply_stock_movement` para:
1. Atualizar `scz_stock.qty` no `location_id` (e no `location_to_id` para transferência).
2. Recalcular `scz_products.stock_qty` como SUM sobre `scz_stock` (mantém vitrine consistente).
3. Gravar `qty_before`/`qty_after` no próprio movimento.
4. Bloquear DELETE em `scz_stock_movements` (histórico imutável).

### GRANTs + RLS
Padrão do projeto: `authenticated`/`service_role`, políticas `has_role('admin')` para escrita, leitura pública nula (estoque é dado interno).

---

## 2. Server functions (novas + refatoradas)

Todas em `src/lib/admin/*.functions.ts` com `requireAdmin`:

- `stock/locations.functions.ts` — CRUD locais.
- `stock/suppliers.functions.ts` — CRUD fornecedores.
- `stock/stock.functions.ts` — `listStock` (com filtros: categoria, marca, cor, tamanho, status, busca por nome/SKU/barras), `getStockByProduct`, `getDashboard` (indicadores + gráficos).
- `stock/entries.functions.ts` — `createEntry` (cabeçalho + itens, cria movimentações `entrada`).
- `stock/exits.functions.ts` — `createExit` (motivos enumerados).
- `stock/adjustments.functions.ts` — `createAdjustment` (calcula delta a partir de contagem).
- `stock/transfers.functions.ts` — `createTransfer` (gera 2 movimentações: saída origem + entrada destino).
- `stock/inventory.functions.ts` — `startInventory`, `submitCount`, `applyInventory` (gera ajustes por divergência).
- `stock/reports.functions.ts` — mais vendidos, parados, curva ABC, valor de estoque, exportações (retorna JSON; export PDF/Excel/CSV feito no cliente com jsPDF/xlsx).
- `products.functions.ts` (refatorar): remover `stock_qty`/`stock_min` do schema de input; adicionar novos campos comerciais.

### Automatizações
- Ao aprovar pedido (server fn `updateOrderStatus` para `paid`/`shipped`): gera movimentação `venda` por item, respeitando variação.
- Ao cancelar: gera `devolucao`.
- Já existe hook parcial em `orders.functions.ts` — expandir.

---

## 3. UI administrativa

### Sidebar
Substituir item único "Estoque" por grupo **Estoque** com submenu:
```
Estoque
├── Dashboard
├── Produtos em Estoque
├── Entrada
├── Saída
├── Ajustes
├── Transferências
├── Inventário
├── Sem Estoque
├── Crítico
├── Histórico
└── Relatórios
```

### Rotas novas (`src/routes/admin.estoque.*.tsx`)
- `admin.estoque.index.tsx` — Dashboard com cards + gráficos (recharts já usado).
- `admin.estoque.produtos.tsx` — tabela profissional (imagem, produto, categoria, marca, cor, tamanho, SKU, barras, qty, mínimo, localização, status badge).
- `admin.estoque.entrada.tsx` — form multi-item.
- `admin.estoque.saida.tsx` — form com select de motivo.
- `admin.estoque.ajustes.tsx` — form contagem vs sistema.
- `admin.estoque.transferencias.tsx` — origem → destino.
- `admin.estoque.inventario.tsx` — sessão de contagem por categoria/leitor.
- `admin.estoque.historico.tsx` — timeline completa, filtros, sem delete.
- `admin.estoque.relatorios.tsx` — cards de relatórios + export.
- `admin.estoque.locais.tsx` — CRUD locais físicos.
- `admin.estoque.fornecedores.tsx` — CRUD fornecedores.

### `ProductForm.tsx` (refatoração)
Reorganizar em abas:
1. **Básico** — nome, categoria, subcategoria, marca, coleção, gênero, descrições, especs, material, peso, dimensões.
2. **Mídias** — dnd-kit reorder (já existe), capa, principal, vídeo.
3. **Venda** — preço, promo, destaque, lançamento, exclusivo, ativo.
4. **SEO** — meta title, description, slug, tags.
5. **Variações** — matriz (cor × tamanho × modelo/material/acabamento) → gera SKUs. **Sem** campo de quantidade.

Remover completamente da UI: `stock_qty`, `stock_min`, ajuste manual.

### Padrão visual
- shadcn `Card`, `Table`, `Badge`, `Sheet`/`Dialog` para modais, `Tabs`, filtros com `Select`+`Input`, paginação server-side, busca com debounce.
- Gráficos com `recharts`.
- Badges de status: verde (em estoque), amarelo (baixo), vermelho (sem), cinza (inativo).

---

## 4. Frontend da loja — zero mudança

A vitrine consulta `stock_qty` em `scz_products` e `scz_product_variants`. O trigger mantém esses campos sincronizados via SUM de `scz_stock`. Nenhuma server fn pública é alterada.

---

## 5. Ordem de entrega (4 etapas atômicas)

**Etapa 1 — Fundação (migração + server fns core):**
migração + trigger reescrito + server fns de locations, stock, entries, exits, adjustments, transfers, história.

**Etapa 2 — UI Estoque (módulo novo completo):**
sidebar + todas as rotas `admin.estoque.*`, dashboard com gráficos, tabela profissional, forms de movimentação.

**Etapa 3 — Refatoração de Produtos:**
`ProductForm` reorganizado em 5 abas, novos campos comerciais, remoção da UI de estoque, migração de dados existentes para `scz_stock` (local "Depósito" default).

**Etapa 4 — Automações + Relatórios:**
hooks de pedido (aprovado/cancelado/devolvido), inventário, transferências, relatórios com export PDF/Excel/CSV.

---

## Perguntas antes de começar

1. **Locais físicos iniciais:** posso criar `Depósito` (default), `Loja Física`, `Showroom`, `Centro de Distribuição` como seed? Ou você quer cadastrar manualmente depois?
2. **Migração de dados:** o estoque atual (`scz_products.stock_qty`) deve ser migrado inteiramente para o local "Depósito"? (Recomendo sim.)
3. **Marcas (`scz_brands`):** confirmar criação — hoje `brand` é texto livre em `scz_products`. Vou converter para FK opcional (mantendo o texto legado).
4. **Export PDF/Excel:** posso adicionar `jspdf` + `xlsx` como deps para os relatórios?

Confirme (ou responda as 4 perguntas) e eu começo pela **Etapa 1** já no próximo turno.
