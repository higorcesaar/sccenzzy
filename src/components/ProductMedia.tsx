/**
 * Renderiza uma URL de mídia (imagem ou vídeo) detectando pela extensão.
 * Necessário porque o cadastro de produto guarda fotos E vídeos no mesmo
 * array `images`, e a vitrine precisa exibir cada item no elemento correto.
 */
const VIDEO_RE = /\.(mp4|mov|webm|m4v|ogv)(\?|$)/i;

export function isVideoUrl(url: string | undefined | null) {
  return !!url && VIDEO_RE.test(url);
}

export function ProductMedia({
  src,
  alt,
  className,
  autoPlay = true,
}: {
  src: string;
  alt: string;
  className?: string;
  autoPlay?: boolean;
}) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        muted
        loop
        playsInline
        autoPlay={autoPlay}
        preload="metadata"
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}
