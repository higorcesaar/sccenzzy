import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/components/Storefront";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Scenzzy — Boutique de Calçados e Bolsas Premium" },
      { name: "description", content: "Boutique exclusiva de tênis, saltos, bolsas e acessórios femininos em couro premium. Curadoria Scenzzy." },
      { property: "og:title", content: "Scenzzy — Boutique de Calçados e Bolsas Premium" },
      { property: "og:description", content: "Curadoria de calçados e bolsas femininas de alta elegância." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => <Storefront view="home" />,
});
