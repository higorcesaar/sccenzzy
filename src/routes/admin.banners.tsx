import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const Route = createFileRoute("/admin/banners")({
  component: () => (
    <ComingSoon
      title="Banners e Campanhas"
      description="Gerenciamento de banners por localização (home-hero, home-mid, categorias), com período de exibição e ordenação."
      phase="Fase 5"
    />
  ),
});
