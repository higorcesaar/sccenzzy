import { createFileRoute } from "@tanstack/react-router";
import CategoryView from "@/components/CategoryView";

export const Route = createFileRoute("/sapatos")({
  head: () => ({
    meta: [
      { title: "Sapatos | Scenzzy" },
      { name: "description", content: "Coleção exclusiva de sapatos femininos premium." },
      { property: "og:title", content: "Sapatos | Scenzzy" },
      { property: "og:description", content: "Sapatos premium femininos selecionados pela curadoria Scenzzy." },
    ],
  }),
  component: () => <CategoryView title="Sapatos" subtitle="Calçados Premium" categorySlug="sapatos" />,
});
