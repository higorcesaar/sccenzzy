import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { uploadProductMedia } from "@/lib/r2.functions";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Upload, ShieldCheck, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/admin/editor")({
  head: () => ({ meta: [{ title: "Admin · Editor de mídia | Scenzzy" }] }),
  component: AdminEditorPage,
});

function AdminEditorPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const uploadMedia = useServerFn(uploadProductMedia);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ url: string; key: string }[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

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
                <a
                  key={it.key}
                  href={it.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-gold-300 transition group"
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
