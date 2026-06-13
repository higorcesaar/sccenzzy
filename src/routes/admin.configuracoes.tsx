import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const Route = createFileRoute("/admin/configuracoes")({
  component: () => (
    <ComingSoon
      title="Configurações da loja"
      description="Dados da empresa, redes sociais, opções de frete, métodos de pagamento e personalização global."
      phase="Fase 5"
    />
  ),
});
