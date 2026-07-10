import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { uploadProductMedia, listUploadedMedia } from "@/lib/r2.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCampaignVideo, updateCampaignVideo } from "@/lib/campaign.functions";
import { Loader2, Upload, ShieldCheck, ImageIcon, Film, Save } from "lucide-react";
import { resolveVideoEmbed } from "@/lib/video-embed";

export const Route = createFileRoute("/admin/editor")({
  head: () => ({ meta: [{ title: "Admin · Editor de mídia | Scenzzy" }] }),
  component: AdminEditorPage,
});


function CampaignVideoPreview({ url }: { url: string }) {
  const resolved = resolveVideoEmbed(url);
  if (!resolved) {
    return (
      <div className="text-stone-400 text-[10px] uppercase tracking-widest font-bold p-4 text-center">
        URL inválida
      </div>
    );
  }
  if (resolved.kind === "image") {
    return <img src={resolved.src} alt="Prévia" className="w-full h-full object-cover" />;
  }
  if (resolved.kind === "video") {
    return (
      <video
        key={resolved.src}
        src={resolved.src}
        muted
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <iframe
      key={resolved.src}
      src={resolved.src}
      className="w-full h-full"
      frameBorder={0}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
    />
  );
}

function AdminEditorPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const uploadMedia = useServerFn(uploadProductMedia);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ url: string; key: string }[]>([]);

  const fetchMedia = useServerFn(listUploadedMedia);
  const { data: mediaLibrary, refetch: refetchMedia } = useQuery({
    queryKey: ["r2-media-library"],
    queryFn: () => fetchMedia(),
    enabled: role === "admin",
  });

  const fetchCampaignVideo = useServerFn(getCampaignVideo);
  const { data: campaignVideo, refetch: refetchCampaign } = useQuery({
    queryKey: ["campaign-video-admin"],
    queryFn: () => fetchCampaignVideo(),
  });

  const saveCampaignVideo = useServerFn(updateCampaignVideo);
  const campaignMutation = useMutation({
    mutationFn: (input: { url: string; title: string; subtitle: string; description: string }) =>
      saveCampaignVideo({ data: input }),
    onSuccess: () => {
      addToast("Campanha Editorial atualizada com sucesso!", "info", "Sucesso");
      refetchCampaign();
    },
    onError: (err: any) => {
      addToast(err?.message || "Erro ao atualizar campanha.", "info", "Erro");
    },
  });

  const [campaignForm, setCampaignForm] = useState({
    url: "",
    title: "",
    subtitle: "",
    description: "",
  });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (campaignVideo) {
      setCampaignForm({
        url: campaignVideo.url || "",
        title: campaignVideo.title || "",
        subtitle: campaignVideo.subtitle || "",
        description: campaignVideo.description || "",
      });
    }
  }, [campaignVideo]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (role !== "admin") {
      addToast("Apenas administradores podem fazer upload.", "info", "Acesso negado");
      return;
    }
    const MAX = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX) {
      addToast(`"${file.name}" excede o limite de 25MB.`, "info", "Erro");
      return;
    }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
      }
      const dataBase64 = btoa(binary);
      const res = await uploadMedia({
        data: { filename: file.name, contentType: file.type || "application/octet-stream", dataBase64 },
      });
      setUploaded((prev) => [{ url: res.publicUrl, key: res.key }, ...prev]);
      refetchMedia();
      addToast("Upload concluído para o R2.", "info", "Mídia enviada");
    } catch (err: any) {
      addToast(err?.message || "Falha no upload.", "info", "Erro");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] px-4 sm:px-8 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">Painel Scenzzy</p>
            <h1 className="font-serif text-3xl font-extrabold text-neutral-900">Editor de mídia</h1>
            <p className="text-xs text-stone-500 mt-1">
              Envie fotos e vídeos para o bucket Cloudflare R2 <code className="bg-stone-100 px-1.5 py-0.5 rounded">scenzzy</code>.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-stone-500">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-500" />
            {role === "admin" ? "Admin" : "Cliente"}
          </div>
        </div>

        {role !== "admin" && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
            Sua conta não tem papel <strong>admin</strong>. Para liberar uploads, adicione o papel admin via SQL:
            <pre className="mt-2 text-[10px] bg-white border border-amber-200 rounded p-2 overflow-x-auto">
              {`insert into public.user_roles (user_id, role) values ('${user.id}', 'admin');`}
            </pre>
          </div>
        )}

        <label className={`block rounded-3xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
          uploading ? "border-gold-300 bg-gold-50/50" : "border-stone-300 bg-white hover:border-gold-300"
        }`}>
          <input type="file" accept="image/*,video/*" className="sr-only" onChange={onFile} disabled={uploading || role !== "admin"} />
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
            ) : (
              <Upload className="h-8 w-8 text-gold-500" />
            )}
            <div className="space-y-1">
              <p className="font-semibold text-neutral-900">
                {uploading ? "Enviando para o R2…" : "Clique para escolher um arquivo"}
              </p>
              <p className="text-[11px] text-stone-500">Fotos JPG/PNG/WebP ou vídeos MP4 até ~100MB</p>
            </div>
          </div>
        </label>

        {uploaded.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-display uppercase tracking-widest text-xs font-bold text-neutral-900">
              Enviados nesta sessão
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploaded.map((it) => (
                <div
                  key={it.key}
                  className="relative group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-gold-300 transition"
                >
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    <div className="aspect-square bg-stone-50 flex items-center justify-center">
                      {/\.(mp4|mov|webm)$/i.test(it.key) ? (
                        <video src={it.url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={it.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <div className="p-2 text-[10px] text-stone-500 truncate flex items-center gap-1">
                      <ImageIcon className="h-3 w-3 flex-shrink-0" /> {it.key.split("/").pop()}
                    </div>
                  </a>

                  {/\.(mp4|mov|webm)$/i.test(it.key) && (
                    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/90 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform flex justify-center">
                      <button
                        onClick={() => {
                          setCampaignForm((prev) => ({ ...prev, url: it.url }));
                          addToast("Vídeo selecionado para a Campanha Editorial!", "info", "Vídeo Selecionado");
                        }}
                        className="w-full text-white bg-gold-600 hover:bg-gold-500 text-[9px] uppercase tracking-widest font-bold py-1 px-2 rounded-lg flex items-center justify-center gap-1"
                      >
                        <Film className="h-2.5 w-2.5" /> Usar na Campanha
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {mediaLibrary && mediaLibrary.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display uppercase tracking-widest text-xs font-bold text-neutral-900">
                Biblioteca de mídias ({mediaLibrary.length})
              </h2>
              <button
                type="button"
                onClick={() => refetchMedia()}
                className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-gold-500 font-bold"
              >
                Atualizar
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaLibrary.map((it: any) => {
                const isVideo = /\.(mp4|mov|webm)$/i.test(it.key);
                return (
                  <div
                    key={it.key}
                    className="relative group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-gold-300 transition"
                  >
                    <a href={it.url} target="_blank" rel="noreferrer" className="block">
                      <div className="aspect-square bg-stone-50 flex items-center justify-center">
                        {isVideo ? (
                          <video src={it.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={it.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="p-2 text-[10px] text-stone-500 truncate flex items-center gap-1">
                        <ImageIcon className="h-3 w-3 flex-shrink-0" /> {it.key.split("/").pop()}
                      </div>
                    </a>
                    {isVideo && (
                      <div className="absolute inset-x-0 bottom-0 bg-neutral-900/90 p-2 transform translate-y-full group-hover:translate-y-0 transition-transform flex justify-center">
                        <button
                          onClick={() => {
                            setCampaignForm((prev) => ({ ...prev, url: it.url }));
                            addToast("Vídeo selecionado para a Campanha Editorial!", "info", "Vídeo Selecionado");
                          }}
                          className="w-full text-white bg-gold-600 hover:bg-gold-500 text-[9px] uppercase tracking-widest font-bold py-1 px-2 rounded-lg flex items-center justify-center gap-1"
                        >
                          <Film className="h-2.5 w-2.5" /> Usar na Campanha
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {/* Campanha Editorial Card */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-gold-500 font-bold flex items-center gap-1">
              <Film className="h-3.5 w-3.5 animate-pulse" /> CONFIGURAÇÃO
            </span>
            <h2 className="font-serif text-2xl font-bold text-neutral-900 mt-1">Campanha Editorial</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Defina o vídeo e os textos principais exibidos na seção de Campanha Editorial do site.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!campaignForm.url) {
                addToast("Por favor, selecione ou insira a URL de um vídeo.", "info", "Aviso");
                return;
              }
              campaignMutation.mutate(campaignForm);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Input fields */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-600 block">
                    URL do Vídeo da Campanha
                  </label>
                  <input
                    type="url"
                    required
                    value={campaignForm.url}
                    onChange={(e) => setCampaignForm({ ...campaignForm, url: e.target.value })}
                    placeholder="https://exemplo.com/video.mp4"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 bg-stone-50/50"
                  />
                  <p className="text-[9px] text-stone-400">
                    Você pode colar uma URL de vídeo ou fazer upload acima e clicar em "Usar na Campanha".
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-600 block">
                    Subtítulo / Tag
                  </label>
                  <input
                    type="text"
                    value={campaignForm.subtitle}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subtitle: e.target.value })}
                    placeholder="COLEÇÃO EXCLUSIVA • SCENZZY ICONS"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 bg-stone-50/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-600 block">
                    Título da Campanha
                  </label>
                  <input
                    type="text"
                    value={campaignForm.title}
                    onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    placeholder="Nova Coleção"
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 bg-stone-50/50"
                  />
                </div>
              </div>

              {/* Right Column: Textarea & video preview */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-stone-600 block">
                    Descrição da Campanha
                  </label>
                  <textarea
                    rows={4}
                    value={campaignForm.description}
                    onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                    placeholder="Sapatos elegantes e bolsas estruturadas com acabamento primoroso..."
                    className="w-full px-4 py-2.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 bg-stone-50/50 resize-none"
                  />
                </div>

                {campaignForm.url ? (
                  <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 aspect-video relative flex items-center justify-center">
                    <CampaignVideoPreview url={campaignForm.url} />
                    <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider text-white z-10">
                      Pré-visualização do Vídeo
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-stone-200 p-6 flex flex-col items-center justify-center text-center text-stone-400 min-h-[140px]">
                    <Film className="h-6 w-6 mb-2 text-stone-300" />
                    <p className="text-[10px] uppercase tracking-widest font-bold">Sem vídeo selecionado</p>
                    <p className="text-[9px] mt-1">Coloque a URL de um vídeo para carregar a pré-visualização</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button
                type="submit"
                disabled={campaignMutation.isPending}
                className="bg-neutral-900 hover:bg-gold-500 text-white disabled:bg-stone-300 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
              >
                {campaignMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> Salvar Campanha Editorial
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
