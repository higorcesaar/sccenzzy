import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const Route = createFileRoute("/admin/pedidos")({
  component: () => (
    <ComingSoon
      title="Pedidos"
      description="Pipeline completo de pedidos (aguardando pagamento → pago → separação → faturado → enviado → entregue), com detalhe do cliente, produtos, frete e histórico."
      phase="Fase 2"
    />
  ),
});
