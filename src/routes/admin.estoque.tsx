import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  listStock,
  listLocations,
  listSuppliers,
  getStockDashboard,
  createStockEntry,
  createStockExit,
  createStockAdjustment,
  listMovements,
  listProductsForSelect,
  listBrands,
  updateSingleStockRecord,
} from "@/lib/admin/stock-erp.functions";
import { listCategories } from "@/lib/admin/products.functions";
import { listVariants, syncProductVariants } from "@/lib/admin/variants.functions";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Package,
  PackageCheck,
  PackageX,
  History,
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Search,
  Plus,
  Loader2,
  Trash2,
  Warehouse,
} from "lucide-react";
import { StockEditModal } from "@/components/admin/StockEditModal";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/admin/estoque")({
  component: StockPage,
});

function SearchableProductSelect({
  products,
  value,
  onChange,
  placeholder = "Selecione um produto...",
}: {
  products: any[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return products;
    const s = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)));
  }, [products, search]);

  const selected = products.find((p) => p.id === value);

  return (
    <div className="relative">
      <div
        className="w-full border border-stone-200 rounded-lg p-2.5 bg-white text-sm cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{selected ? `${selected.name} ${selected.sku ? `(${selected.sku})` : ""}` : placeholder}</span>
        <Search className="h-4 w-4 text-stone-400 flex-shrink-0 ml-2" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-60 overflow-y-auto p-2 space-y-2">
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
            autoFocus
          />
          <div className="space-y-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-stone-500 p-2">Nenhum produto encontrado</p>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.id}
                  className={`p-2 rounded text-xs cursor-pointer hover:bg-stone-50 transition ${p.id === value ? "bg-amber-50 text-amber-900 font-semibold" : "text-stone-700"}`}
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {p.name} {p.sku && <span className="text-stone-400">· {p.sku}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StockPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Chamadas de servidor
  const fetchDashboard = useServerFn(getStockDashboard);
  const fetchStockList = useServerFn(listStock);
  const fetchLocations = useServerFn(listLocations);
  const fetchSuppliers = useServerFn(listSuppliers);
  const fetchCategories = useServerFn(listCategories);
  const fetchBrands = useServerFn(listBrands);
  const fetchProductsSelect = useServerFn(listProductsForSelect);
  const fetchMovements = useServerFn(listMovements);

  // Mutations de operações
  const entryMut = useMutation({
    mutationFn: useServerFn(createStockEntry),
    onSuccess: () => {
      toast.success("Entrada de estoque registrada com sucesso");
      qc.invalidateQueries();
      setOpenEntry(false);
      resetEntryForm();
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao registrar entrada"),
  });

  const exitMut = useMutation({
    mutationFn: useServerFn(createStockExit),
    onSuccess: () => {
      toast.success("Saída de estoque registrada");
      qc.invalidateQueries();
      setOpenExit(false);
      resetExitForm();
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao registrar saída"),
  });

  const adjustMut = useMutation({
    mutationFn: useServerFn(createStockAdjustment),
    onSuccess: () => {
      toast.success("Ajuste de estoque registrado");
      qc.invalidateQueries();
      setOpenAdjust(false);
      resetAdjustForm();
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao registrar ajuste"),
  });

  // Transferência de estoque removida a pedido — usar Entrada/Saída para movimentos entre locais.

  const updateStockRecordFn = useServerFn(updateSingleStockRecord);
  const updateStockRecordMut = useMutation({
    mutationFn: (args: { id: string; qty: number; min_qty: number; location_label: string }) =>
      updateStockRecordFn({ data: args }),
    onSuccess: () => {
      toast.success("Saldo de estoque atualizado");
      qc.invalidateQueries();
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao atualizar estoque"),
  });

  // Queries globais
  const { data: dashboard, isLoading: loadingDash } = useQuery({
    queryKey: ["admin", "stock-dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const { data: locations } = useQuery({
    queryKey: ["admin", "stock-locations"],
    queryFn: () => fetchLocations(),
  });

  const { data: suppliers } = useQuery({
    queryKey: ["admin", "stock-suppliers"],
    queryFn: () => fetchSuppliers(),
  });

  const { data: categories } = useQuery({
    queryKey: ["admin", "stock-categories"],
    queryFn: () => fetchCategories(),
  });

  const { data: brands } = useQuery({
    queryKey: ["admin", "stock-brands"],
    queryFn: () => fetchBrands(),
  });

  const { data: productsSelect } = useQuery({
    queryKey: ["admin", "stock-products-select"],
    queryFn: () => fetchProductsSelect(),
  });

  // Filtros da tabela de saldos
  const [stockSearch, setStockSearch] = useState("");
  const [stockLocation, setStockLocation] = useState("all");
  const [stockCategory, setStockCategory] = useState("all");
  const [stockBrand, setStockBrand] = useState("all");
  const [stockStatus, setStockStatus] = useState<"all" | "in" | "low" | "out">("all");
  const [stockPage, setStockPage] = useState(1);

  const { data: stockData, isLoading: loadingStock } = useQuery({
    queryKey: ["admin", "stock-list", { stockSearch, stockLocation, stockCategory, stockBrand, stockStatus, stockPage }],
    queryFn: () =>
      fetchStockList({
        data: {
          search: stockSearch || undefined,
          locationId: stockLocation === "all" ? undefined : stockLocation,
          categoryId: stockCategory === "all" ? undefined : stockCategory,
          brandId: stockBrand === "all" ? undefined : stockBrand,
          status: stockStatus,
          page: stockPage,
          pageSize: 20,
        },
      }),
  });

  // Filtros de histórico
  const [historyType, setHistoryType] = useState("all");
  const [historyPage, setHistoryPage] = useState(1);

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["admin", "stock-history", { historyType, historyPage }],
    queryFn: () =>
      fetchMovements({
        data: {
          type: historyType === "all" ? undefined : historyType,
          page: historyPage,
          pageSize: 20,
        },
      }),
  });

  // Estados dos Modais
  const [openEntry, setOpenEntry] = useState(false);
  const [openExit, setOpenExit] = useState(false);
  const [openAdjust, setOpenAdjust] = useState(false);
  // Modal de edição profissional de estoque (substitui edição inline + transferência)
  const [editModalProductId, setEditModalProductId] = useState<string | null>(null);
  const [editModalProductName, setEditModalProductName] = useState<string>("");

  // Estados do Formulário de Entrada
  const [entrySupplier, setEntrySupplier] = useState("");
  const [entryLocation, setEntryLocation] = useState("");
  const [entryInvoice, setEntryInvoice] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [entryItems, setEntryItems] = useState<Array<{ product_id: string; variant_id: string; quantity: number; cost: string }>>([]);

  const entryProducts: any[] = (productsSelect as any[]) ?? [];
  const entrySelectedProductObj = (productId: string) => entryProducts.find((p: any) => p.id === productId);

  const resetEntryForm = () => {
    setEntrySupplier("");
    setEntryLocation("");
    setEntryInvoice("");
    setEntryDate("");
    setEntryNotes("");
    setEntryItems([]);
  };

  // Estados do Formulário de Saída
  const [exitProductId, setExitProductId] = useState("");
  const [exitVariantId, setExitVariantId] = useState("");
  const [exitLocationId, setExitLocationId] = useState("");
  const [exitQty, setExitQty] = useState(1);
  const [exitReason, setExitReason] = useState<any>("venda");
  const [exitNotes, setExitNotes] = useState("");

  const resetExitForm = () => {
    setExitProductId("");
    setExitVariantId("");
    setExitLocationId("");
    setExitQty(1);
    setExitReason("venda");
    setExitNotes("");
  };

  // (Edição inline removida — agora tudo pelo StockEditModal)

  // Estados para Gerenciamento de Variações
  const [selectedVarProductId, setSelectedVarProductId] = useState<string>("");
  const [hasVariantsState, setHasVariantsState] = useState<boolean>(false);
  const [localVariants, setLocalVariants] = useState<any[]>([]);

  const fetchVariants = useServerFn(listVariants);
  const { data: dbVariants, isLoading: loadingDbVariants } = useQuery({
    queryKey: ["admin", "product-variants-edit", selectedVarProductId],
    queryFn: () => fetchVariants({ data: { product_id: selectedVarProductId } }),
    enabled: !!selectedVarProductId,
  });

  const syncVariantsFn = useServerFn(syncProductVariants);
  const saveVariantsMut = useMutation({
    mutationFn: (args: { product_id: string; variants: any[] }) => syncVariantsFn({ data: args }),
    onSuccess: () => {
      toast.success("Variações sincronizadas com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin", "stock-products-select"] });
      qc.invalidateQueries({ queryKey: ["admin", "product-variants-edit", selectedVarProductId] });
      qc.invalidateQueries({ queryKey: ["admin", "stock-list"] });
    },
    onError: (e: any) => {
      toast.error(e?.message || "Erro ao salvar variações");
    },
  });

  const [lastSelectedVarProductId, setLastSelectedVarProductId] = useState<string>("");
  if (selectedVarProductId !== lastSelectedVarProductId) {
    setLastSelectedVarProductId(selectedVarProductId);
    if (productsSelect && selectedVarProductId) {
      const p = productsSelect.find((x: any) => x.id === selectedVarProductId);
      setHasVariantsState(p?.has_variants ?? false);
    }
  }

  const [lastDbVariantsId, setLastDbVariantsId] = useState<string | null>(null);
  const dbVariantsKey = dbVariants ? JSON.stringify(dbVariants) : "";
  if (dbVariantsKey !== lastDbVariantsId) {
    setLastDbVariantsId(dbVariantsKey);
    if (dbVariants) {
      setLocalVariants(dbVariants);
    } else {
      setLocalVariants([]);
    }
  }

  // Estados do Formulário de Ajuste
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustVariantId, setAdjustVariantId] = useState("");
  const [adjustLocationId, setAdjustLocationId] = useState("");
  const [adjustCountedQty, setAdjustCountedQty] = useState(0);
  const [adjustNotes, setAdjustNotes] = useState("");

  const { data: adjustProductStock } = useQuery({
    queryKey: ["admin", "adjust-stock", adjustProductId],
    queryFn: () => fetchStockList({ data: { search: undefined } }), // Simple lookup or we can query directly
    enabled: !!adjustProductId,
  });

  // Encontra a quantidade atual no sistema
  const systemQty = useMemo(() => {
    if (!adjustProductId || !adjustLocationId) return 0;
    // Se o produto selecionado tiver variantes e uma variante for selecionada
    const hasVars = entrySelectedProductObj(adjustProductId)?.has_variants;
    if (hasVars && !adjustVariantId) return 0;

    // Busca nas linhas carregadas do dashboard ou estoque
    const found = (stockData?.rows ?? []).find(
      (s: any) =>
        s.product.id === adjustProductId &&
        s.location.id === adjustLocationId &&
        (!hasVars || s.variant?.id === adjustVariantId)
    );
    return found ? found.qty : 0;
  }, [adjustProductId, adjustVariantId, adjustLocationId, stockData]);

  const resetAdjustForm = () => {
    setAdjustProductId("");
    setAdjustVariantId("");
    setAdjustLocationId("");
    setAdjustCountedQty(0);
    setAdjustNotes("");
  };

  // Estados do Formulário de Transferência
  const [transProductId, setTransProductId] = useState("");
  const [transVariantId, setTransVariantId] = useState("");
  const [transLocationFrom, setTransLocationFrom] = useState("");
  const [transLocationTo, setTransLocationTo] = useState("");
  const [transQty, setTransQty] = useState(1);
  const [transNotes, setTransNotes] = useState("");

  const resetTransferForm = () => {
    setTransProductId("");
    setTransVariantId("");
    setTransLocationFrom("");
    setTransLocationTo("");
    setTransQty(1);
    setTransNotes("");
  };

  // Auxiliares de Formatação
  const formatBRL = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getStatusBadge = (qty: number, min: number) => {
    if (qty === 0) return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Sem estoque</Badge>;
    if (min > 0 && qty <= min) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Baixo estoque</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Em estoque</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Módulo ERP</p>
          <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Gestão de Estoque</h1>
          <p className="text-sm text-stone-500 mt-1">
            Controle integrado de saldos, movimentações e transferências.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-stone-200 flex-wrap h-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-1.5">
            <Package className="h-4 w-4" /> Produtos em Estoque
          </TabsTrigger>
          <TabsTrigger value="operacoes" className="flex items-center gap-1.5">
            <Warehouse className="h-4 w-4" /> Operações
          </TabsTrigger>
          <TabsTrigger value="variacoes" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-emerald-600" /> Cadastro de Variações
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-1.5">
            <History className="h-4 w-4" /> Histórico de Movimentações
          </TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          {loadingDash ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : (
            <>
              {/* Indicadores */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs uppercase font-bold tracking-wider">Total Produtos</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <p className="text-2xl font-extrabold text-neutral-900">{dashboard?.totalProducts ?? 0}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-semibold tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Catálogo Verificado
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs uppercase font-bold tracking-wider">Total em Estoque</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <p className="text-2xl font-extrabold text-emerald-700">{dashboard?.totalQty ?? 0} un</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 font-semibold tracking-wide">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Estoque Verificado
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs uppercase font-bold tracking-wider">Valor do Estoque</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <p className="text-2xl font-extrabold text-stone-700">{formatBRL(dashboard?.totalValueCents ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs uppercase font-bold tracking-wider text-rose-600">Sem Estoque</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <p className="text-2xl font-extrabold text-rose-600">{dashboard?.outCount ?? 0}</p>
                  </CardContent>
                </Card>
                <Card className="col-span-2 md:col-span-1">
                  <CardHeader className="p-4 pb-1">
                    <CardDescription className="text-xs uppercase font-bold tracking-wider text-amber-600">Estoque Crítico</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1">
                    <p className="text-2xl font-extrabold text-amber-600">{dashboard?.lowCount ?? 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos e Tabelas */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-amber-600" /> Fluxo de Estoque (Entradas vs Saídas)
                    </CardTitle>
                    <CardDescription>Movimentações diárias consolidadas dos últimos 30 dias</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    {dashboard?.chart && (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboard.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="date" tickLine={false} style={{ fontSize: 10, fill: "#78716c" }} />
                          <YAxis tickLine={false} style={{ fontSize: 10, fill: "#78716c" }} />
                          <ChartTooltip />
                          <Area type="monotone" dataKey="entrada" name="Entrada" stroke="#10b981" fillOpacity={1} fill="url(#colorEntrada)" />
                          <Area type="monotone" dataKey="saida" name="Saída" stroke="#ef4444" fillOpacity={1} fill="url(#colorSaida)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Top Vendidos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">Top 5 Mais Vendidos (30d)</CardTitle>
                    <CardDescription>Produtos com maior volume de vendas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!dashboard?.topProducts || dashboard.topProducts.length === 0 ? (
                      <p className="text-xs text-stone-500 text-center py-10">Nenhuma venda registrada.</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboard.topProducts.map((p: any, i: number) => (
                          <div key={p.id} className="flex items-center justify-between border-b border-stone-100 pb-2 last:border-0 last:pb-0">
                            <div>
                              <p className="text-xs font-semibold text-stone-800">{p.name}</p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-800 font-mono hover:bg-amber-100">{p.qty} un</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Últimas Movimentações */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Últimas Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  {!dashboard?.recentMovements || dashboard.recentMovements.length === 0 ? (
                    <p className="text-xs text-stone-500 text-center py-10">Sem movimentações recentes.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Detalhes/Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard.recentMovements.map((m: any) => (
                          <TableRow key={m.id}>
                            <TableCell className="text-xs text-stone-500">{new Date(m.created_at).toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="font-medium">{m.scz_products?.name || "—"}</TableCell>
                            <TableCell>
                              <Badge className={
                                m.movement_type === "entrada" || m.movement_type === "devolucao"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : "bg-rose-100 text-rose-800 hover:bg-rose-100"
                              }>
                                {m.movement_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">{m.quantity} un</TableCell>
                            <TableCell className="text-xs text-stone-600">{m.reason || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* PRODUTOS EM ESTOQUE */}
        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Resumo verificado do Estoque */}
              <div className="flex flex-wrap items-center gap-4 bg-stone-50 border border-stone-100 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-xs font-semibold">Total de Produtos no Catálogo:</span>
                  <span className="text-sm font-extrabold text-stone-950 font-mono bg-white px-2 py-0.5 rounded border border-stone-200">
                    {dashboard?.totalProducts ?? 0}
                  </span>
                </div>
                <div className="h-4 w-px bg-stone-200 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-xs font-semibold">Total em Estoque (Unidades):</span>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono bg-white px-2 py-0.5 rounded border border-stone-200">
                    {dashboard?.totalQty ?? 0} un
                  </span>
                </div>
                {stockData && (
                  <>
                    <div className="h-4 w-px bg-stone-200 hidden sm:block" />
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500 text-xs font-semibold">Saldos Filtrados:</span>
                      <span className="text-sm font-extrabold text-amber-800 font-mono bg-white px-2 py-0.5 rounded border border-stone-200">
                        {stockData.total} registros
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    placeholder="Buscar por nome, SKU..."
                    value={stockSearch}
                    onChange={(e) => { setStockSearch(e.target.value); setStockPage(1); }}
                    className="pl-9"
                  />
                </div>
                <Select value={stockLocation} onValueChange={(v) => { setStockLocation(v); setStockPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Local de Estoque" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os locais</SelectItem>
                    {(locations ?? []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockCategory} onValueChange={(v) => { setStockCategory(v); setStockPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {(categories ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockBrand} onValueChange={(v) => { setStockBrand(v); setStockPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Marca" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as marcas</SelectItem>
                    {(brands ?? []).map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockStatus} onValueChange={(v: any) => { setStockStatus(v); setStockPage(1); }}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="in">Em estoque</SelectItem>
                    <SelectItem value="low">Estoque crítico</SelectItem>
                    <SelectItem value="out">Esgotado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela de saldos */}
              {loadingStock ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                </div>
              ) : !stockData || stockData.rows.length === 0 ? (
                <p className="text-center py-20 text-sm text-stone-500">Nenhum saldo de estoque encontrado.</p>
              ) : (
                <>
                  <div className="overflow-x-auto border border-stone-100 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Variação</TableHead>
                          <TableHead>Local de Estoque</TableHead>
                          <TableHead>SKU / Cód. Barras</TableHead>
                          <TableHead>Localização Física</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Mínimo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockData.rows.map((row: any) => {
                          return (
                            <TableRow key={row.id}>
                              <TableCell>
                                <div className="font-semibold text-neutral-900">{row.product?.name}</div>
                                <div className="text-[10px] text-stone-500">{row.product?.category?.name || "—"}</div>
                              </TableCell>
                              <TableCell>
                                {row.variant ? (
                                  <div className="text-xs">
                                    {row.variant.size && <Badge variant="outline" className="mr-1">{row.variant.size}</Badge>}
                                    {row.variant.color && <span className="text-stone-600 text-xs">{row.variant.color}</span>}
                                  </div>
                                ) : (
                                  <span className="text-xs text-stone-400">Único</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-xs font-medium text-stone-700">
                                  <MapPin className="h-3 w-3 text-stone-400" />
                                  {row.location?.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs font-mono">{row.variant?.sku || row.product?.sku || "—"}</div>
                                <div className="text-[10px] text-stone-400">{row.variant?.barcode || "—"}</div>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-stone-600">{row.location_label || "—"}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6 rounded-full border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-30"
                                    onClick={() => {
                                      if (row.qty <= 0) return;
                                      updateStockRecordMut.mutate({
                                        id: row.id,
                                        qty: Math.max(0, row.qty - 1),
                                        min_qty: row.min_qty,
                                        location_label: row.location_label,
                                      });
                                    }}
                                    disabled={updateStockRecordMut.isPending || row.qty <= 0}
                                    title="Diminuir 1 unidade"
                                  >
                                    -
                                  </Button>
                                  <span className="font-bold text-neutral-900 w-10 text-center font-mono text-sm">{row.qty}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6 rounded-full border-stone-200 text-stone-600 hover:bg-stone-100"
                                    onClick={() => {
                                      updateStockRecordMut.mutate({
                                        id: row.id,
                                        qty: row.qty + 1,
                                        min_qty: row.min_qty,
                                        location_label: row.location_label,
                                      });
                                    }}
                                    disabled={updateStockRecordMut.isPending}
                                    title="Aumentar 1 unidade"
                                  >
                                    +
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-stone-500 text-xs font-mono">{row.min_qty} un</span>
                              </TableCell>
                              <TableCell>{getStatusBadge(row.qty, row.min_qty)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditModalProductId(row.product.id);
                                      setEditModalProductName(row.product.name);
                                    }}
                                    className="h-8 text-xs text-stone-700 border-stone-200 hover:bg-stone-50 px-2 flex items-center gap-1"
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setAdjustProductId(row.product.id);
                                      setAdjustVariantId(row.variant?.id ?? "");
                                      setAdjustLocationId(row.location.id);
                                      setAdjustCountedQty(row.qty);
                                      setAdjustNotes("Ajuste rápido via listagem de estoque");
                                      setOpenAdjust(true);
                                    }}
                                    className="h-8 text-xs text-amber-700 hover:text-amber-800 border-amber-200 hover:bg-amber-50 px-2 flex items-center gap-1"
                                  >
                                    Ajustar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginador */}
                  {stockData && Math.ceil(stockData.total / stockData.pageSize) > 1 && (
                    <div className="flex items-center justify-between text-sm pt-2">
                      <div className="text-stone-500">
                        Mostrando {stockData.rows.length} de {stockData.total} registros
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={stockPage <= 1} onClick={() => setStockPage(stockPage - 1)}>
                          Anterior
                        </Button>
                        <Button variant="outline" size="sm" disabled={stockPage >= Math.ceil(stockData.total / stockData.pageSize)} onClick={() => setStockPage(stockPage + 1)}>
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPERAÇÕES */}
        <TabsContent value="operacoes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="hover:border-amber-500 transition cursor-pointer" onClick={() => setOpenEntry(true)}>
              <CardHeader className="pb-2">
                <ArrowDownLeft className="h-8 w-8 text-emerald-600 mb-2" />
                <CardTitle className="font-serif text-lg">Entrada de Mercadoria</CardTitle>
                <CardDescription>Registrar a entrada de produtos via Nota Fiscal ou Compra</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0 text-amber-600 hover:text-amber-700 font-semibold text-xs uppercase tracking-wider">
                  Registrar Entrada &rarr;
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-amber-500 transition cursor-pointer" onClick={() => setOpenExit(true)}>
              <CardHeader className="pb-2">
                <ArrowUpRight className="h-8 w-8 text-rose-600 mb-2" />
                <CardTitle className="font-serif text-lg">Saída de Mercadoria</CardTitle>
                <CardDescription>Registrar saída de produtos por venda, avaria, brinde, perda, etc.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0 text-amber-600 hover:text-amber-700 font-semibold text-xs uppercase tracking-wider">
                  Registrar Saída &rarr;
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-amber-500 transition cursor-pointer" onClick={() => setOpenAdjust(true)}>
              <CardHeader className="pb-2">
                <RefreshCw className="h-8 w-8 text-amber-600 mb-2" />
                <CardTitle className="font-serif text-lg">Ajuste de Inventário</CardTitle>
                <CardDescription>Corrigir quantidade em estoque comparando a contagem física</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0 text-amber-600 hover:text-amber-700 font-semibold text-xs uppercase tracking-wider">
                  Registrar Ajuste &rarr;
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-amber-500 transition cursor-pointer" onClick={() => setOpenTransfer(true)}>
              <CardHeader className="pb-2">
                <Warehouse className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="font-serif text-lg">Transferência de Local</CardTitle>
                <CardDescription>Movimentar produtos entre o depósito, showroom ou loja física</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="p-0 text-amber-600 hover:text-amber-700 font-semibold text-xs uppercase tracking-wider">
                  Realizar Transferência &rarr;
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ======================================================== */}
          {/* DIALOG DE ENTRADA */}
          {/* ======================================================== */}
          <Dialog open={openEntry} onOpenChange={(open) => !open && setOpenEntry(false)}>
            <DialogContent className="max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl font-bold">Registrar Entrada de Mercadoria</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                <div>
                  <Label className="text-xs">Fornecedor</Label>
                  <Select value={entrySupplier} onValueChange={setEntrySupplier}>
                    <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                    <SelectContent>
                      {(suppliers ?? []).map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Local de Destino</Label>
                  <Select value={entryLocation} onValueChange={setEntryLocation}>
                    <SelectTrigger><SelectValue placeholder="Selecione o local de estoque" /></SelectTrigger>
                    <SelectContent>
                      {(locations ?? []).map((l: any) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Nota Fiscal (Número)</Label>
                  <Input value={entryInvoice} onChange={(e) => setEntryInvoice(e.target.value)} placeholder="Ex: NF-e 001254" />
                </div>
                <div>
                  <Label className="text-xs">Data de Emissão</Label>
                  <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Observações</Label>
                  <Textarea value={entryNotes} onChange={(e) => setEntryNotes(e.target.value)} placeholder="Detalhes sobre a entrada..." rows={2} />
                </div>
              </div>

              {/* Tabela de Itens da Entrada */}
              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stone-700">Produtos da Entrada ({entryItems.length})</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEntryItems([...entryItems, { product_id: "", variant_id: "", quantity: 1, cost: "" }])}
                    className="h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Produto
                  </Button>
                </div>

                <div className="border border-stone-100 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-2 w-1/2">Produto</th>
                        <th className="p-2">Variação</th>
                        <th className="p-2">Quantidade</th>
                        <th className="p-2">Custo Unitário (R$)</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {entryItems.map((item, idx) => {
                        const selectedProduct = entrySelectedProductObj(item.product_id);
                        const hasVariants = selectedProduct?.has_variants ?? false;
                        const productVariants = selectedProduct?.scz_product_variants ?? [];

                        return (
                          <tr key={idx} className="border-t border-stone-100">
                            <td className="p-2">
                              <SearchableProductSelect
                                products={entryProducts}
                                value={item.product_id}
                                onChange={(id) => {
                                  setEntryItems((prev) =>
                                    prev.map((it, j) => (j === idx ? { ...it, product_id: id, variant_id: "" } : it))
                                  );
                                }}
                              />
                            </td>
                            <td className="p-2">
                              {hasVariants ? (
                                <Select
                                  value={item.variant_id}
                                  onValueChange={(v) => {
                                    setEntryItems((prev) =>
                                      prev.map((it, j) => (j === idx ? { ...it, variant_id: v } : it))
                                    );
                                  }}
                                >
                                  <SelectTrigger><SelectValue placeholder="Variante" /></SelectTrigger>
                                  <SelectContent>
                                    {productVariants.map((v: any) => (
                                      <SelectItem key={v.id} value={v.id}>
                                        {v.size ? `T: ${v.size}` : ""} {v.color ? `(${v.color})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-xs text-stone-400">Sem variações</span>
                              )}
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value));
                                  setEntryItems((prev) => prev.map((it, j) => (j === idx ? { ...it, quantity: val } : it)));
                                }}
                                className="h-9 w-20"
                                min={1}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={item.cost}
                                onChange={(e) => {
                                  setEntryItems((prev) => prev.map((it, j) => (j === idx ? { ...it, cost: e.target.value } : it)));
                                }}
                                className="h-9 w-28"
                                placeholder="0,00"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setEntryItems((prev) => prev.filter((_, j) => j !== idx))}
                              >
                                <Trash2 className="h-4 w-4 text-rose-600" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-stone-100">
                <Button variant="outline" onClick={() => setOpenEntry(false)} disabled={entryMut.isPending}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!entryLocation) {
                      toast.error("Selecione o local de destino");
                      return;
                    }
                    if (entryItems.length === 0) {
                      toast.error("Adicione pelo menos um produto");
                      return;
                    }
                    // Validate items
                    for (const item of entryItems) {
                      if (!item.product_id) {
                        toast.error("Todos os itens devem ter um produto selecionado");
                        return;
                      }
                      const p = entrySelectedProductObj(item.product_id);
                      if (p?.has_variants && !item.variant_id) {
                        toast.error(`Selecione a variação para o produto: ${p.name}`);
                        return;
                      }
                    }

                    entryMut.mutate({
                      data: {
                        supplier_id: entrySupplier || null,
                        location_id: entryLocation,
                        invoice_number: entryInvoice || null,
                        invoice_date: entryDate || null,
                        notes: entryNotes || null,
                        items: entryItems.map((it) => ({
                          product_id: it.product_id,
                          variant_id: it.variant_id || null,
                          quantity: it.quantity,
                          unit_cost_cents: it.cost ? Math.round(parseFloat(it.cost) * 100) : null,
                        })),
                      },
                    });
                  }}
                  disabled={entryMut.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {entryMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gravar Entrada"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ======================================================== */}
          {/* DIALOG DE SAÍDA */}
          {/* ======================================================== */}
          <Dialog open={openExit} onOpenChange={(open) => !open && setOpenExit(false)}>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl font-bold">Registrar Saída de Mercadoria</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs">Produto</Label>
                  <SearchableProductSelect
                    products={entryProducts}
                    value={exitProductId}
                    onChange={(id) => {
                      setExitProductId(id);
                      setExitVariantId("");
                    }}
                  />
                </div>

                {exitProductId && entrySelectedProductObj(exitProductId)?.has_variants && (
                  <div>
                    <Label className="text-xs">Variação</Label>
                    <Select value={exitVariantId} onValueChange={setExitVariantId}>
                      <SelectTrigger><SelectValue placeholder="Selecione a variação" /></SelectTrigger>
                      <SelectContent>
                        {(entrySelectedProductObj(exitProductId)?.scz_product_variants ?? []).map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.size ? `Tamanho: ${v.size}` : ""} {v.color ? `(${v.color})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Local de Origem</Label>
                  <Select value={exitLocationId} onValueChange={setExitLocationId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o local de estoque" /></SelectTrigger>
                    <SelectContent>
                      {(locations ?? []).map((l: any) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Quantidade</Label>
                    <Input type="number" value={exitQty} onChange={(e) => setExitQty(Math.max(1, Number(e.target.value)))} min={1} />
                  </div>
                  <div>
                    <Label className="text-xs">Motivo da Saída</Label>
                    <Select value={exitReason} onValueChange={setExitReason}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venda">Venda</SelectItem>
                        <SelectItem value="troca">Troca</SelectItem>
                        <SelectItem value="perda">Perda</SelectItem>
                        <SelectItem value="danificado">Produto Danificado</SelectItem>
                        <SelectItem value="brinde">Brinde</SelectItem>
                        <SelectItem value="uso_interno">Uso Interno</SelectItem>
                        <SelectItem value="garantia">Acionamento de Garantia</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Detalhes / Observações</Label>
                  <Textarea value={exitNotes} onChange={(e) => setExitNotes(e.target.value)} placeholder="Mais detalhes sobre a saída..." rows={2} />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-stone-100">
                <Button variant="outline" onClick={() => setOpenExit(false)} disabled={exitMut.isPending}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!exitProductId) return toast.error("Selecione o produto");
                    if (entrySelectedProductObj(exitProductId)?.has_variants && !exitVariantId) {
                      return toast.error("Selecione a variação");
                    }
                    if (!exitLocationId) return toast.error("Selecione o local de origem");

                    exitMut.mutate({
                      data: {
                        product_id: exitProductId,
                        variant_id: exitVariantId || null,
                        location_id: exitLocationId,
                        quantity: exitQty,
                        reason: exitReason,
                        notes: exitNotes || null,
                      },
                    });
                  }}
                  disabled={exitMut.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {exitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gravar Saída"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* ======================================================== */}
          {/* DIALOG DE AJUSTE */}
          {/* ======================================================== */}
          <Dialog open={openAdjust} onOpenChange={(open) => !open && setOpenAdjust(false)}>
            <DialogContent className="max-w-md bg-white">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl font-bold">Ajustar Saldo de Estoque</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <Label className="text-xs">Produto</Label>
                  <SearchableProductSelect
                    products={entryProducts}
                    value={adjustProductId}
                    onChange={(id) => {
                      setAdjustProductId(id);
                      setAdjustVariantId("");
                    }}
                  />
                </div>

                {adjustProductId && entrySelectedProductObj(adjustProductId)?.has_variants && (
                  <div>
                    <Label className="text-xs">Variação</Label>
                    <Select value={adjustVariantId} onValueChange={setAdjustVariantId}>
                      <SelectTrigger><SelectValue placeholder="Selecione a variação" /></SelectTrigger>
                      <SelectContent>
                        {(entrySelectedProductObj(adjustProductId)?.scz_product_variants ?? []).map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.size ? `Tamanho: ${v.size}` : ""} {v.color ? `(${v.color})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="text-xs">Local de Estoque</Label>
                  <Select value={adjustLocationId} onValueChange={setAdjustLocationId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o local de estoque" /></SelectTrigger>
                    <SelectContent>
                      {(locations ?? []).map((l: any) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Saldo Atual no Sistema</Label>
                    <Input value={`${systemQty} un`} disabled className="bg-stone-50" />
                  </div>
                  <div>
                    <Label className="text-xs">Quantidade Física Contada</Label>
                    <Input
                      type="number"
                      value={adjustCountedQty}
                      onChange={(e) => setAdjustCountedQty(Math.max(0, Number(e.target.value)))}
                      min={0}
                    />
                  </div>
                </div>

                {adjustLocationId && adjustProductId && (
                  <div className={`rounded p-2 text-xs font-semibold ${adjustCountedQty - systemQty > 0 ? "bg-emerald-50 text-emerald-800" : adjustCountedQty - systemQty < 0 ? "bg-rose-50 text-rose-800" : "bg-stone-50 text-stone-700"}`}>
                    Resultado do ajuste: {adjustCountedQty - systemQty > 0 ? `+${adjustCountedQty - systemQty}` : adjustCountedQty - systemQty} unidades no sistema.
                  </div>
                )}

                <div>
                  <Label className="text-xs">Motivo da Correção</Label>
                  <Textarea value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} placeholder="Ex: Correção de erro de digitação na entrada..." rows={2} />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-stone-100">
                <Button variant="outline" onClick={() => setOpenAdjust(false)} disabled={adjustMut.isPending}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (!adjustProductId) return toast.error("Selecione o produto");
                    if (entrySelectedProductObj(adjustProductId)?.has_variants && !adjustVariantId) {
                      return toast.error("Selecione a variação");
                    }
                    if (!adjustLocationId) return toast.error("Selecione o local");

                    adjustMut.mutate({
                      data: {
                        product_id: adjustProductId,
                        variant_id: adjustVariantId || null,
                        location_id: adjustLocationId,
                        system_qty: systemQty,
                        counted_qty: adjustCountedQty,
                        notes: adjustNotes || null,
                      },
                    });
                  }}
                  disabled={adjustMut.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {adjustMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gravar Ajuste"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Transferência removida */}
        </TabsContent>

        {/* CADASTRO DE VARIAÇÕES */}
        <TabsContent value="variacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl font-bold text-stone-900">Gerenciamento e Cadastro de Variações</CardTitle>
              <CardDescription>
                Selecione um produto para criar, editar ou gerar grades de tamanhos, cores e SKUs. 
                Os saldos de cada local serão atualizados dinamicamente a partir das variações cadastradas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-xs font-semibold mb-1 block">Selecione o Produto</Label>
                <SearchableProductSelect
                  products={entryProducts}
                  value={selectedVarProductId}
                  onChange={(id) => {
                    setSelectedVarProductId(id);
                  }}
                  placeholder="Selecione um produto para gerenciar variações..."
                />
              </div>

              {selectedVarProductId && (
                <div className="space-y-6 border-t border-stone-100 pt-4">
                  <div className="flex items-center justify-between bg-stone-50 border border-stone-200 p-4 rounded-lg">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={hasVariantsState}
                          onCheckedChange={(checked) => {
                            setHasVariantsState(checked);
                            if (!checked) {
                              setLocalVariants([]);
                            }
                          }}
                          id="has-variants-switch"
                        />
                        <Label htmlFor="has-variants-switch" className="text-sm font-bold text-stone-850 cursor-pointer">
                          Este produto possui variações (tamanho / cor / modelo)
                        </Label>
                      </div>
                      <p className="text-xs text-stone-500 pl-11">
                        Ative se o produto tiver variações físicas. Caso contrário, será considerado de tamanho/cor Único.
                      </p>
                    </div>

                    {hasVariantsState && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const sizesStr = prompt("Tamanhos (separados por vírgula). Ex: PP,P,M,G,GG ou 36,38,40,42");
                            if (!sizesStr) return;
                            const colorsStr = prompt("Cores (separadas por vírgula). Deixe em branco se não houver variação de cor.");
                            
                            const sizes = sizesStr.split(",").map((s) => s.trim()).filter(Boolean);
                            const colors = (colorsStr || "").split(",").map((s) => s.trim()).filter(Boolean);
                            const newVars: any[] = [];
                            let idx = 0;
                            
                            if (colors.length === 0) {
                              for (const s of sizes) {
                                newVars.push({
                                  size: s,
                                  color: null,
                                  is_active: true,
                                  sort_order: idx++,
                                  sku: `${entrySelectedProductObj(selectedVarProductId)?.sku || 'SKU'}-${s}`,
                                  price_cents: entrySelectedProductObj(selectedVarProductId)?.price_cents ?? 0,
                                });
                              }
                            } else {
                              for (const s of sizes) {
                                for (const c of colors) {
                                  newVars.push({
                                    size: s,
                                    color: c,
                                    is_active: true,
                                    sort_order: idx++,
                                    sku: `${entrySelectedProductObj(selectedVarProductId)?.sku || 'SKU'}-${s}-${c.toUpperCase().substring(0, 3)}`,
                                    price_cents: entrySelectedProductObj(selectedVarProductId)?.price_cents ?? 0,
                                  });
                                }
                              }
                            }
                            setLocalVariants(newVars);
                            toast.success(`${newVars.length} variações geradas na tela.`);
                          }}
                          className="text-xs font-semibold"
                        >
                          Gerar Grade de Variações
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setLocalVariants((vs) => [
                              ...vs,
                              {
                                is_active: true,
                                sort_order: vs.length,
                                size: "",
                                color: "",
                                sku: "",
                                barcode: "",
                                price_cents: entrySelectedProductObj(selectedVarProductId)?.price_cents ?? 0,
                              },
                            ]);
                          }}
                          className="text-xs font-semibold"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add Manual
                        </Button>
                      </div>
                    )}
                  </div>

                  {hasVariantsState ? (
                    <div className="space-y-4">
                      {loadingDbVariants ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                        </div>
                      ) : localVariants.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-stone-200 rounded-lg text-stone-500">
                          Nenhuma variação definida ainda. Clique em "Gerar Grade de Variações" ou "Add Manual" acima para iniciar.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-stone-100 rounded-lg bg-white">
                          <table className="w-full text-sm">
                            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wider text-stone-500">
                              <tr>
                                <th className="p-3">Tamanho</th>
                                <th className="p-3">Cor</th>
                                <th className="p-3">Modelo</th>
                                <th className="p-3">SKU</th>
                                <th className="p-3">Código de Barras</th>
                                <th className="p-3">Preço (R$)</th>
                                <th className="p-3 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {localVariants.map((v, i) => (
                                <tr key={i} className="border-t border-stone-100 hover:bg-stone-50">
                                  <td className="p-2">
                                    <Input
                                      value={v.size ?? ""}
                                      onChange={(e) =>
                                        setLocalVariants((vs) =>
                                          vs.map((x, j) => (j === i ? { ...x, size: e.target.value } : x))
                                        )
                                      }
                                      className="h-9 w-20 text-xs"
                                      placeholder="Ex: M"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      value={v.color ?? ""}
                                      onChange={(e) =>
                                        setLocalVariants((vs) =>
                                          vs.map((x, j) => (j === i ? { ...x, color: e.target.value } : x))
                                        )
                                      }
                                      className="h-9 w-24 text-xs"
                                      placeholder="Ex: Preto"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      value={v.model ?? ""}
                                      onChange={(e) =>
                                        setLocalVariants((vs) =>
                                          vs.map((x, j) => (j === i ? { ...x, model: e.target.value } : x))
                                        )
                                      }
                                      className="h-9 w-24 text-xs"
                                      placeholder="Ex: Slim"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      value={v.sku ?? ""}
                                      onChange={(e) =>
                                        setLocalVariants((vs) =>
                                          vs.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x))
                                        )
                                      }
                                      className="h-9 w-32 font-mono text-xs"
                                      placeholder="SKU-VAR"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      value={v.barcode ?? ""}
                                      onChange={(e) =>
                                        setLocalVariants((vs) =>
                                          vs.map((x, j) => (j === i ? { ...x, barcode: e.target.value } : x))
                                        )
                                      }
                                      className="h-9 w-32 font-mono text-xs"
                                      placeholder="EAN-13"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={v.price_cents ? v.price_cents / 100 : ""}
                                      onChange={(e) =>
                                        setLocalVariants((vs) =>
                                          vs.map((x, j) => (
                                            j === i
                                              ? {
                                                  ...x,
                                                  price_cents: e.target.value
                                                    ? Math.round(parseFloat(e.target.value) * 100)
                                                    : null,
                                                }
                                              : x
                                          ))
                                        )
                                      }
                                      className="h-9 w-24 text-xs"
                                      placeholder="Preço R$"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setLocalVariants((vs) => vs.filter((_, j) => j !== i))
                                      }
                                      className="hover:bg-rose-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4 text-rose-600" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-6 text-center text-stone-600">
                      <p className="text-sm">
                        Este produto está marcado como <strong>Variação Única</strong>.
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Se deseja cadastrar grade de tamanhos, cores e modelos para ele, ative o switch de variações acima.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-stone-100">
                    <Button
                      onClick={() => {
                        if (hasVariantsState && localVariants.length === 0) {
                          return toast.error("Adicione pelo menos uma variação antes de salvar.");
                        }
                        // Validação simples de SKUs duplicados
                        if (hasVariantsState) {
                          const skus = localVariants.map((v) => v.sku?.trim()).filter(Boolean);
                          const uniqueSkus = new Set(skus);
                          if (skus.length !== uniqueSkus.size) {
                            return toast.error("Aviso: Existem SKUs duplicados nas variações.");
                          }
                        }

                        saveVariantsMut.mutate({
                          product_id: selectedVarProductId,
                          variants: hasVariantsState ? localVariants : [],
                        });
                      }}
                      disabled={saveVariantsMut.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                    >
                      {saveVariantsMut.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                          Sincronizando...
                        </>
                      ) : (
                        "Salvar e Sincronizar Variações"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Filtro do Histórico */}
              <div className="flex items-center gap-3">
                <Select value={historyType} onValueChange={(v) => { setHistoryType(v); setHistoryPage(1); }}>
                  <SelectTrigger className="w-56"><SelectValue placeholder="Tipo de Movimentação" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as movimentações</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="devolucao">Devolução</SelectItem>
                    <SelectItem value="ajuste">Ajuste de estoque</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabela de histórico */}
              {loadingHistory ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                </div>
              ) : !historyData || historyData.rows.length === 0 ? (
                <p className="text-center py-20 text-sm text-stone-500">Nenhuma movimentação no histórico.</p>
              ) : (
                <>
                  <div className="overflow-x-auto border border-stone-100 rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Variação</TableHead>
                          <TableHead>Local</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Anterior &rarr; Novo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Motivo / Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyData.rows.map((row: any) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-xs text-stone-500">
                              {new Date(row.created_at).toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell className="font-semibold">{row.product?.name}</TableCell>
                            <TableCell>
                              {row.variant ? (
                                <span className="text-xs">
                                  {row.variant.size ? `T: ${row.variant.size}` : ""} {row.variant.color ? `(${row.variant.color})` : ""}
                                </span>
                              ) : (
                                <span className="text-xs text-stone-400">Único</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-stone-700">
                              {row.location?.name}
                              {row.location_to?.name && (
                                <span className="text-stone-400 block text-[10px]">
                                  &rarr; {row.location_to.name}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                row.movement_type === "entrada" || row.movement_type === "devolucao"
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : row.movement_type === "transferencia"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : "bg-rose-100 text-rose-800 hover:bg-rose-100"
                              }>
                                {row.movement_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-stone-600">
                              {row.qty_before !== null ? `${row.qty_before} un` : "—"} &rarr; {row.qty_after !== null ? `${row.qty_after} un` : "—"}
                            </TableCell>
                            <TableCell className="font-bold">
                              {row.quantity > 0 && row.movement_type !== "entrada" && row.movement_type !== "devolucao" ? `+${row.quantity}` : row.quantity} un
                            </TableCell>
                            <TableCell className="text-xs text-stone-600 max-w-[200px] truncate" title={row.reason}>
                              {row.reason || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Paginador Histórico */}
                  {historyData && Math.ceil(historyData.total / historyData.pageSize) > 1 && (
                    <div className="flex items-center justify-between text-sm pt-2">
                      <div className="text-stone-500">
                        Mostrando {historyData.rows.length} de {historyData.total} movimentações
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={historyPage <= 1} onClick={() => setHistoryPage(historyPage - 1)}>
                          Anterior
                        </Button>
                        <Button variant="outline" size="sm" disabled={historyPage >= Math.ceil(historyData.total / historyData.pageSize)} onClick={() => setHistoryPage(historyPage + 1)}>
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
