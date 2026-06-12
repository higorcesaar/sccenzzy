import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/components/Storefront";

export const Route = createFileRoute("/promocao")({
  head: () => ({
    meta: [
      { title: "Promoções | Scenzzy" },
      { name: "description", content: "Promoções e ofertas especiais Scenzzy com descontos imperdíveis." },
    ],
  }),
  component: () => <Storefront view="promocao" />,
});
