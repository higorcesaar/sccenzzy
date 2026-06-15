import { createFileRoute } from "@tanstack/react-router";
import CategoryView from "@/components/CategoryView";

export const Route = createFileRoute("/novidades")({
  head: () => ({
    meta: [
      { title: "Novidades | Scenzzy" },
      { name: "description", content: "Lançamentos e novidades exclusivas da Scenzzy." },
    ],
  }),
  component: () => <CategoryView title="Novidades" subtitle="Recém-Chegados" onlyLaunch />,
});
