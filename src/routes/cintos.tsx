import { createFileRoute } from "@tanstack/react-router";
import CategoryView from "@/components/CategoryView";

export const Route = createFileRoute("/cintos")({
  head: () => ({
    meta: [
      { title: "Cintos | Scenzzy" },
      { name: "description", content: "Cintos femininos em couro com fivelas exclusivas." },
    ],
  }),
  component: () => <CategoryView title="Cintos" subtitle="Marcante e Essencial" categorySlug="cintos" />,
});
