import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, X } from "lucide-react";
import {
  generateVariantsAuto,
  getCategoryAttributes,
} from "@/lib/admin/category-attributes.functions";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string | null;
  productName?: string;
  categoryId?: string | null;
};

function TagsInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions = [],
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const [text, setText] = useState("");
  const add = (v: string) => {
    const t = v.trim();
    if (!t) return;
    if (values.includes(t)) return;
    onChange([...values, t]);
    setText("");
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-stone-700">{label}</Label>
      <div className="flex flex-wrap gap-1 border border-stone-200 rounded-md bg-white p-1.5 min-h-[38px]">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          className="flex-1 min-w-[100px] outline-none text-xs bg-transparent"
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            }
            if (e.key === "Backspace" && !text && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => text && add(text)}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions
            .filter((s) => !values.includes(s))
            .slice(0, 20)
            .map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-stone-300 text-stone-500 hover:bg-stone-50"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export function GenerateVariantsModal({ open, onOpenChange, productId, productName, categoryId }: Props) {
  const qc = useQueryClient();
  const genFn = useServerFn(generateVariantsAuto);
  const getAttrsFn = useServerFn(getCategoryAttributes);

  const { data: attrs } = useQuery({
    queryKey: ["admin", "category-attrs", categoryId],
    queryFn: () => getAttrsFn({ data: { category_id: categoryId! } }),
    enabled: !!categoryId && open,
  });

  const [colors, setColors] = useState<string[]>([]);
  const [numerations, setNumerations] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [skuPrefix, setSkuPrefix] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [costStr, setCostStr] = useState("");
  const [stockMin, setStockMin] = useState(0);
  const [autoBarcode, setAutoBarcode] = useState(true);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const usesNumeration = attrs?.uses_numeration ?? false;
  const usesSize = attrs?.uses_size ?? false;
  const usesMaterial = attrs?.uses_material ?? false;

  const combinationCount = Math.max(1, colors.length || 1) * Math.max(1, (usesNumeration ? numerations.length : sizes.length) || 1) * Math.max(1, materials.length || 1);

  const mut = useMutation({
    mutationFn: () =>
      genFn({
        data: {
          product_id: productId!,
          sku_prefix: skuPrefix || null,
          colors,
          color_hexes: {},
          numerations: usesNumeration ? numerations : [],
          sizes: usesSize && !usesNumeration ? sizes : [],
          materials: usesMaterial ? materials : [],
          price_cents: priceStr ? Math.round(Number(priceStr.replace(",", ".")) * 100) : null,
          cost_cents: costStr ? Math.round(Number(costStr.replace(",", ".")) * 100) : null,
          stock_min: stockMin,
          auto_barcode: autoBarcode,
          replace_existing: replaceExisting,
        },
      }),
    onSuccess: (res: any) => {
      toast.success(`${res.generated} variações geradas`);
      qc.invalidateQueries();
      onOpenChange(false);
      setColors([]);
      setNumerations([]);
      setSizes([]);
      setMaterials([]);
      setPriceStr("");
      setCostStr("");
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao gerar variações"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" /> Gerar Variações Automaticamente
          </DialogTitle>
          <DialogDescription>
            {productName ? `Produto: ${productName}. ` : ""}Todas as combinações possíveis dos atributos serão criadas como SKUs
            independentes. Ajustes finos de estoque e localização física ficam no módulo Estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(attrs?.uses_color ?? true) && (
            <TagsInput
              label="Cores"
              values={colors}
              onChange={setColors}
              placeholder="Digite e Enter (ex: Preto)"
              suggestions={attrs?.color_options ?? ["Preto", "Nude", "Marrom", "Off White", "Vermelho"]}
            />
          )}
          {usesNumeration && (
            <TagsInput
              label="Numeração"
              values={numerations}
              onChange={setNumerations}
              placeholder="Ex: 35, 36, 37"
              suggestions={attrs?.numeration_options ?? ["33","34","35","36","37","38","39","40"]}
            />
          )}
          {usesSize && !usesNumeration && (
            <TagsInput
              label="Tamanhos"
              values={sizes}
              onChange={setSizes}
              placeholder="Ex: P, M, G"
              suggestions={attrs?.size_options ?? ["P", "M", "G", "Único"]}
            />
          )}
          {usesMaterial && (
            <TagsInput
              label="Materiais"
              values={materials}
              onChange={setMaterials}
              placeholder="Ex: Couro, Camurça"
              suggestions={attrs?.material_options ?? ["Couro", "Camurça", "Sintético", "Verniz"]}
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div>
            <Label className="text-xs font-semibold">Prefixo do SKU</Label>
            <Input value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} placeholder="Auto" className="h-9" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Preço (R$)</Label>
            <Input value={priceStr} onChange={(e) => setPriceStr(e.target.value)} placeholder="299,90" className="h-9" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Custo (R$)</Label>
            <Input value={costStr} onChange={(e) => setCostStr(e.target.value)} placeholder="120,00" className="h-9" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Estoque mínimo</Label>
            <Input
              type="number"
              min={0}
              value={stockMin}
              onChange={(e) => setStockMin(Math.max(0, Number(e.target.value) || 0))}
              className="h-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 border-t border-stone-100 pt-3">
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={autoBarcode} onCheckedChange={setAutoBarcode} /> Gerar código de barras (EAN-13)
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Switch checked={replaceExisting} onCheckedChange={setReplaceExisting} /> Substituir variações existentes
          </label>
          <div className="ml-auto text-xs text-stone-500">
            Combinações a gerar: <strong className="text-amber-700 font-mono">{combinationCount}</strong>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!productId || mut.isPending}
            onClick={() => mut.mutate()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Gerar {combinationCount} variações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
