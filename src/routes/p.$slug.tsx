import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicPageBySlug } from "@/lib/admin/pages.functions";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/p/$slug")({
  component: PublicPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold">Página não encontrada</h1>
        <p className="text-stone-500 mt-2">A página que você procura não está publicada.</p>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-3xl font-bold">Ops…</h1>
        <p className="text-stone-500 mt-2 text-sm">{error.message}</p>
      </div>
    </div>
  ),
});

function PublicPage() {
  const { slug } = Route.useParams();
  const fetchPage = useServerFn(getPublicPageBySlug);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public", "page", slug],
    queryFn: () => fetchPage({ data: { slug } }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  if (isError || !data) {
    throw notFound();
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-serif text-2xl font-extrabold tracking-tight">
            Scenzzy
          </Link>
          <nav className="flex items-center gap-6 text-xs uppercase tracking-widest">
            <Link to="/sapatos">Sapatos</Link>
            <Link to="/bolsas">Bolsas</Link>
            <Link to="/cintos">Cintos</Link>
          </nav>
        </div>
      </header>
      <BlockRenderer blocks={(data.blocks as any) || []} />
    </div>
  );
}
