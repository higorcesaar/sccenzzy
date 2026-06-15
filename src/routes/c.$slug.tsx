import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import CategoryView from "@/components/CategoryView";
import { listPublicCategories } from "@/lib/storefront.functions";

export const Route = createFileRoute("/c/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} | Scenzzy` },
      { name: "description", content: `Produtos da categoria ${params.slug} na Scenzzy.` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const fetchCats = useServerFn(listPublicCategories);
  const { data: cats = [] } = useQuery({
    queryKey: ["public-categories"],
    queryFn: () => fetchCats(),
    staleTime: 60_000,
  });
  const cat = (cats as any[]).find((c) => c.slug === slug);
  return <CategoryView title={cat?.name ?? slug} subtitle="Coleção" categorySlug={slug} />;
}
