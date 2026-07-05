# Módulo Estoque → ERP Profissional

Transformar o módulo atual num ERP de moda com controle por SKU/variação, atributos configuráveis por categoria, geração automática de combinações, localização física detalhada, dashboard e histórico completo. A tela **Produtos** vira apenas catálogo (marketing); todo o inventário passa a viver em **Estoque**.

## Escopo funcional

### 1. Atributos configuráveis por categoria
- Nova tela "Atributos por Categoria" (Sapatos, Bolsas, Cintos, Carteiras, Óculos, Bijuterias, Chaveiros, Bonés, Meias, Lenços, Acessórios genéricos).
- Checkboxes definem quais atributos a categoria usa: `numeração`, `cor`, `tamanho` (P/M/G/Único), `material`, `modelo`, `coleção`.
- Default por categoria (ex.: Sapato → numeração+cor; Bolsa → cor+tamanho+material; Cinto → cor+tamanho).
- Categorias sem `tamanho` recebem automaticamente "Único".

### 2. Geração automática de variações
- Botão **"Gerar Variações Automaticamente"** dentro do produto (aba Variações).
- Usuário informa valores por atributo (ex.: cores [Preto, Nude], numerações [35–40]).
- Sistema cria o produto cartesiano — cada combinação = 1 SKU independente com:
  SKU, código de barras, quantidade, estoque mínimo, estoque reservado, localização física, depósito, peso, dimensões, custo, preço, status.
- SKU auto-gerado (`<prefixo>-<cor>-<tam>`), editável. Código de barras EAN-13 auto opcional.

### 3. Localização física estruturada
- Cada linha de estoque ganha: `depósito` (já existe), `corredor`, `prateleira`, `nível`, `caixa` (todos texto livre curto).
- Exibido como badge "Dep. Principal · B / 05 / 02 / C08".

### 4. Nova tela de gestão de estoque
Tabela principal (uma linha por variação) com:
Foto · Produto · Categoria · Cor · Numeração/Tamanho · Material · SKU · Cód. Barras · Qtd · Mín · Reservado · Localização · Depósito · Status · Ações (Histórico, Editar, Salvar rápido).

Filtros: categoria, depósito, status (em estoque / baixo / zerado), busca por SKU/barras/nome.
Ações em massa: alterar depósito, exportar CSV, imprimir etiquetas (fase 2 — placeholder).

### 5. Movimentações
Tipos: Entrada, Venda, Saída, Troca, Devolução, Ajuste Manual, Inventário, Transferência entre depósitos.
Cada movimento registra: usuário, data/hora, quantidade, motivo, saldo antes/depois (já existe no trigger `scz_apply_stock_movement`). Adicionar Transferência de volta (foi removida antes; agora é requisito).

### 6. Dashboard do Estoque
Cards: nº produtos cadastrados, nº SKUs, pares de sapato, bolsas, acessórios, sem estoque, estoque baixo, valor total (Σ qty × custo), últimas 10 movimentações.

### 7. Simplificar tela Produtos
Manter apenas: Nome, Categoria, Marca, Descrição curta/longa, Fotos, Vídeos, SEO/marketing, coleção, status.
Remover dali: preço por variação, estoque, SKU, cor, tamanho, código de barras, dimensões físicas de variação, depósito. Tudo migra para o card "Variações & Estoque" que abre o módulo Estoque focado nesse produto.

## Mudanças de banco

Migration única:

1. `scz_category_attributes` — configuração por categoria:
   `id, category_id (fk), uses_size bool, uses_numeration bool, uses_color bool, uses_material bool, uses_model bool, size_options text[], numeration_options text[]`.
2. `scz_product_variants`: adicionar `cost_cents int`, `reserved_qty int default 0`, `width_cm/height_cm/depth_cm numeric`.
3. `scz_stock`: adicionar `aisle text`, `shelf text`, `level text`, `bin text` (localização física detalhada; `location_label` já existe).
4. Ajustar enum `movement_type` para garantir `transferencia`, `inventario`, `troca`, `devolucao`, `ajuste`, `entrada`, `saida`, `venda` (a maioria já existe).
5. Seed dos atributos default por categoria existente.
6. GRANTs + policies (padrão admin via `has_role`).

## Mudanças de código

**Server functions** (`src/lib/admin/`):
- `category-attributes.functions.ts` (novo) — get/set config por categoria.
- `variants.functions.ts` — nova `generateVariants({ productId, attributes })` fazendo produto cartesiano + upsert.
- `stock-erp.functions.ts` — adicionar `transferStock`, incluir campos de localização física em list/update; expandir dashboard.
- `products.functions.ts` — remover campos de inventário do payload editável.

**UI** (`src/routes/` + `src/components/admin/`):
- `admin.estoque.tsx` — reescrever tabela com colunas do requisito; filtros e busca; botão "Gerar variações" abre modal.
- `admin/StockEditModal.tsx` — adicionar campos localização física (corredor/prateleira/nível/caixa), custo, reservado, dimensões; aba Histórico já existe; aba Transferência.
- `admin/GenerateVariantsModal.tsx` (novo) — seletor de atributos com base em `scz_category_attributes` + preview das combinações.
- `admin/ProductForm.tsx` — remover seções de estoque/SKU/variações inline; deixar link "Gerenciar variações no Estoque →".
- `admin.categorias.index.tsx` — nova aba/modal "Atributos" por categoria.
- Dashboard: expandir aba "Dashboard" já existente em `admin.estoque.tsx`.

## Fora de escopo desta entrega
- Impressão de etiquetas de código de barras (placeholder).
- Leitor de código de barras USB/câmera.
- Exportação CSV avançada (fica um export simples).
- App mobile de inventário.

Confirma que posso avançar com essa proposta? Ao aprovar, executo a migration primeiro e depois todas as mudanças de código.