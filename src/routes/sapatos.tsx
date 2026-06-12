import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/components/Storefront";

export const Route = createFileRoute("/sapatos")({
  head: () => ({
    meta: [
      { title: "Tênis Femininos | Scenzzy" },
      { name: "description", content: "Coleção exclusiva de tênis femininos: chunky, slip on, esportivos e casuais de couro premium." },
      { property: "og:title", content: "Tênis Femininos | Scenzzy" },
      { property: "og:description", content: "Tênis premium femininos selecionados pela curadoria Scenzzy." },
    ],
  }),
  component: () => <Storefront view="sapatos" />,
});
