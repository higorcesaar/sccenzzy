import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const Route = createFileRoute("/admin/clientes")({
  component: () => (
    <ComingSoon
      title="Clientes"
      description="Base de clientes com LTV, último pedido, endereços e histórico de compras."
      phase="Fase 2"
    />
  ),
});
