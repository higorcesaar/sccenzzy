import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/lib/admin/products.functions";
import { ProductForm } from "@/components/admin/ProductForm";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/produtos/$id")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const fetchOne = useServerFn(getProduct);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => fetchOne({ data: { id } }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }
  if (error || !data) return <div className="text-sm text-rose-600">Produto não encontrado.</div>;
  return <ProductForm initial={data} />;
}
