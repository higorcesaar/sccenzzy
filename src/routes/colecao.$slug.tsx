import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import CategoryView from "@/components/CategoryView";
import { listPublicCollections } from "@/lib/storefront.functions";

export const Route = createFileRoute("/colecao/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} | Scenzzy` },
      { name: "description", content: `Coleção ${params.slug} da Scenzzy.` },
    ],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const fetchCols = useServerFn(listPublicCollections);
  const { data: cols = [] } = useQuery({
    queryKey: ["public-collections"],
    queryFn: () => fetchCols(),
    staleTime: 60_000,
  });
  const col = (cols as any[]).find((c) => c.slug === slug);
  return <CategoryView title={col?.name ?? slug} subtitle="Coleção" collectionSlug={slug} />;
}
