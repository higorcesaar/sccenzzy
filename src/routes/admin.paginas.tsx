import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/admin/ComingSoon";

export const Route = createFileRoute("/admin/paginas")({
  component: () => (
    <ComingSoon
      title="Páginas"
      description="CMS para Home, Sobre, Contato, Políticas, Termos e páginas personalizadas (Franquias, Blog, Revendedores, Trabalhe Conosco)."
      phase="Fase 3"
    />
  ),
});
