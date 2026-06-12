import { createFileRoute } from "@tanstack/react-router";
import Storefront from "@/components/Storefront";

export const Route = createFileRoute("/cintos")({
  head: () => ({
    meta: [
      { title: "Cintos | Scenzzy" },
      { name: "description", content: "Cintos femininos de couro com fivelas exclusivas para marcar o look." },
    ],
  }),
  component: () => <Storefront view="cintos" />,
});
