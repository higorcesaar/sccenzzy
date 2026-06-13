import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getAllSettings, updateSetting } from "@/lib/admin/settings.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes/")({
  component: SettingsPage,
});

function SettingsPage() {
  const fetch = useServerFn(getAllSettings);
  const save = useServerFn(updateSetting);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fetch(),
  });

  const [store, setStore] = useState<any>({});
  const [social, setSocial] = useState<any>({});
  const [shipping, setShipping] = useState<any>({});
  const [payment, setPayment] = useState<any>({});

  useEffect(() => {
    if (!data) return;
    setStore(data.store || {});
    setSocial(data.social || {});
    setShipping(data.shipping || {});
    setPayment(data.payment || {});
  }, [data]);

  const mut = useMutation({
    mutationFn: ({ key, value }: { key: any; value: any }) => save({ data: { key, value } }),
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">Sistema</p>
        <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Configurações da loja</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da loja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Nome" v={store.name} onChange={(v) => setStore({ ...store, name: v })} />
          <Row label="E-mail de contato" v={store.email} onChange={(v) => setStore({ ...store, email: v })} />
          <Row label="WhatsApp" v={store.whatsapp} onChange={(v) => setStore({ ...store, whatsapp: v })} />
          <Row label="CNPJ" v={store.cnpj} onChange={(v) => setStore({ ...store, cnpj: v })} />
          <div>
            <Label>Endereço</Label>
            <Textarea rows={2} value={store.address || ""} onChange={(e) => setStore({ ...store, address: e.target.value })} />
          </div>
          <Button onClick={() => mut.mutate({ key: "store", value: store })} disabled={mut.isPending} className="bg-amber-600 hover:bg-amber-700">
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Redes sociais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Row label="Instagram (URL)" v={social.instagram} onChange={(v) => setSocial({ ...social, instagram: v })} />
          <Row label="Facebook (URL)" v={social.facebook} onChange={(v) => setSocial({ ...social, facebook: v })} />
          <Row label="TikTok (URL)" v={social.tiktok} onChange={(v) => setSocial({ ...social, tiktok: v })} />
          <Row label="YouTube (URL)" v={social.youtube} onChange={(v) => setSocial({ ...social, youtube: v })} />
          <Button onClick={() => mut.mutate({ key: "social", value: social })} disabled={mut.isPending} className="bg-amber-600 hover:bg-amber-700">
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumRow
              label="Frete grátis acima de (R$)"
              v={shipping.free_above}
              onChange={(v) => setShipping({ ...shipping, free_above: v })}
            />
            <NumRow
              label="Frete padrão (R$)"
              v={shipping.standard_price}
              onChange={(v) => setShipping({ ...shipping, standard_price: v })}
            />
            <NumRow
              label="Frete expresso (R$)"
              v={shipping.express_price}
              onChange={(v) => setShipping({ ...shipping, express_price: v })}
            />
            <NumRow
              label="Prazo médio (dias)"
              v={shipping.avg_days}
              onChange={(v) => setShipping({ ...shipping, avg_days: v })}
            />
          </div>
          <Button onClick={() => mut.mutate({ key: "shipping", value: shipping })} disabled={mut.isPending} className="bg-amber-600 hover:bg-amber-700">
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Toggle label="Aceitar PIX" v={payment.pix} onChange={(v) => setPayment({ ...payment, pix: v })} />
          <Toggle label="Aceitar cartão de crédito" v={payment.credit_card} onChange={(v) => setPayment({ ...payment, credit_card: v })} />
          <Toggle label="Aceitar boleto" v={payment.boleto} onChange={(v) => setPayment({ ...payment, boleto: v })} />
          <NumRow
            label="Máximo de parcelas (cartão)"
            v={payment.max_installments}
            onChange={(v) => setPayment({ ...payment, max_installments: v })}
          />
          <Button onClick={() => mut.mutate({ key: "payment", value: payment })} disabled={mut.isPending} className="bg-amber-600 hover:bg-amber-700">
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, v, onChange }: { label: string; v?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={v || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NumRow({ label, v, onChange }: { label: string; v?: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type="number" value={v ?? ""} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function Toggle({ label, v, onChange }: { label: string; v?: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 py-2">
      <Label>{label}</Label>
      <Switch checked={!!v} onCheckedChange={onChange} />
    </div>
  );
}
