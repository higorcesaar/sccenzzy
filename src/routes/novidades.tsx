import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/components/Storefront";

export const Route = createFileRoute("/novidades")({
  head: () => ({
    meta: [
      { title: "Novidades | Scenzzy" },
      { name: "description", content: "Confira as novidades, campanhas e lançamentos exclusivos da Scenzzy." },
    ],
  }),
  component: () => <Storefront view="novidades" />,
});
