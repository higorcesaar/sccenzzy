import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getPage, upsertPage } from "@/lib/admin/pages.functions";
import { PageBuilder } from "@/components/admin/builder/PageBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Block } from "@/lib/admin/blocks";
import { Loader2, ArrowLeft, Save, Globe } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/paginas/$id")({
  component: PageEditorPage,
});

function PageEditorPage() {
  const { id } = Route.useParams();
  const fetchPage = useServerFn(getPage);
  const save = useServerFn(upsertPage);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "page", id],
    queryFn: () => fetchPage({ data: { id } }),
  });

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [seoKw, setSeoKw] = useState("");
  const [ogImage, setOgImage] = useState("");

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setSlug(data.slug);
    setStatus(data.status);
    setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
    setSeoTitle(data.seo_title || "");
    setSeoDesc(data.seo_description || "");
    setSeoKw(data.seo_keywords || "");
    setOgImage(data.og_image || "");
  }, [data]);

  const mut = useMutation({
    mutationFn: (nextStatus?: "draft" | "published") =>
      save({
        data: {
          id,
          title,
          slug,
          status: nextStatus ?? status,
          blocks,
          seo_title: seoTitle || null,
          seo_description: seoDesc || null,
          seo_keywords: seoKw || null,
          og_image: ogImage || null,
        },
      }),
    onSuccess: (row) => {
      setStatus(row.status);
      toast.success(row.status === "published" ? "Página publicada" : "Página salva");
      qc.invalidateQueries({ queryKey: ["admin", "page", id] });
      qc.invalidateQueries({ queryKey: ["admin", "pages"] });
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao salvar"),
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/admin/paginas">
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Link>
          </Button>
          <h1 className="font-serif text-3xl font-extrabold text-neutral-900 mt-2">{title || "Nova página"}</h1>
          <p className="text-xs text-stone-500 font-mono">/p/{slug}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => mut.mutate(undefined)} disabled={mut.isPending}>
            {mut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
          <Button onClick={() => mut.mutate("published")} disabled={mut.isPending} className="bg-amber-600 hover:bg-amber-700">
            <Globe className="h-4 w-4 mr-1" />
            {status === "published" ? "Re-publicar" : "Publicar"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">Construtor</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-4">
          <PageBuilder value={blocks} onChange={setBlocks} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-w-xl">
              <div>
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={data.is_system}
                />
                {data.is_system && (
                  <p className="text-[11px] text-stone-500 mt-1">Slug de página do sistema não pode ser alterado.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO & Compartilhamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-w-2xl">
              <div>
                <Label>Title (60 chars)</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} />
              </div>
              <div>
                <Label>Meta description (160 chars)</Label>
                <Textarea
                  rows={3}
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value)}
                  maxLength={160}
                />
              </div>
              <div>
                <Label>Keywords (separadas por vírgula)</Label>
                <Input value={seoKw} onChange={(e) => setSeoKw(e.target.value)} />
              </div>
              <div>
                <Label>Imagem para compartilhamento (og:image — URL)</Label>
                <Input value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="https://…" />
                {ogImage && <img src={ogImage} alt="" className="mt-2 max-h-40 rounded-lg border border-stone-200" />}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
