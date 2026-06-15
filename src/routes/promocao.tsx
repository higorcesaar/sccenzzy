import { createFileRoute } from "@tanstack/react-router";
import CategoryView from "@/components/CategoryView";

export const Route = createFileRoute("/promocao")({
  head: () => ({
    meta: [
      { title: "Promoções | Scenzzy" },
      { name: "description", content: "Promoções e ofertas especiais Scenzzy." },
    ],
  }),
  component: () => <CategoryView title="Promoções" subtitle="Ofertas Especiais" onlyOnSale />,
});
