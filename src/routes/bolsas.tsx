import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/components/Storefront";

export const Route = createFileRoute("/bolsas")({
  head: () => ({
    meta: [
      { title: "Bolsas e Acessórios | Scenzzy" },
      { name: "description", content: "Bolsas tiracolo, tote, clutches e acessórios exclusivos em couro premium." },
      { property: "og:title", content: "Bolsas e Acessórios | Scenzzy" },
      { property: "og:description", content: "Coleção de bolsas estruturadas e acessórios sofisticados." },
    ],
  }),
  component: () => <Storefront view="bolsas" />,
});
