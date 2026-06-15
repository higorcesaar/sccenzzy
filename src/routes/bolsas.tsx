import { createFileRoute } from "@tanstack/react-router";
import CategoryView from "@/components/CategoryView";

export const Route = createFileRoute("/bolsas")({
  head: () => ({
    meta: [
      { title: "Bolsas | Scenzzy" },
      { name: "description", content: "Bolsas estruturadas em couro premium." },
      { property: "og:title", content: "Bolsas | Scenzzy" },
      { property: "og:description", content: "Coleção de bolsas exclusivas." },
    ],
  }),
  component: () => <CategoryView title="Bolsas" subtitle="Estilo de Alto Padrão" categorySlug="bolsas" />,
});
