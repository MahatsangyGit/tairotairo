"use client";

import { cdnPath, shouldUseLocalImages } from "@/lib/cdn";
import { cn } from "@/lib/utils";

function resolveDisplaySrc(rawSrc: string): string {
  if (rawSrc.startsWith("blob:") || rawSrc.startsWith("data:")) {
    return rawSrc;
  }

  if (rawSrc.startsWith("http")) {
    if (shouldUseLocalImages()) {
      try {
        const url = new URL(rawSrc);
        return `${url.pathname}${url.search}`;
      } catch {
        return rawSrc;
      }
    }
    return rawSrc;
  }

  return cdnPath(rawSrc);
}

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  onError?: () => void;
};

/**
 * Images dynamiques (API, avatars, portfolio).
 * Utilise <img> natif — compatible Next.js 16 et cache-bust ?v=.
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  fill,
  priority,
  onError,
}: OptimizedImageProps) {
  const displaySrc = resolveDisplaySrc(src);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      onError={onError}
      className={cn(
        fill && "absolute inset-0 h-full w-full object-cover",
        className
      )}
    />
  );
}
