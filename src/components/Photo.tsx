import type { Photo as PhotoT } from "@/lib/types";
import { photoPage, photoSrcSet, photoUrl } from "@/lib/photos";

type Props = {
  photo: PhotoT;
  /** CSS sizes attribute */
  sizes: string;
  /** width / height; crops on the CDN so the file matches the box */
  ratio?: number;
  priority?: boolean;
  credit?: boolean;
  className?: string;
  alt?: string;
};

const WIDTHS = [480, 720, 960, 1280, 1680, 2200];

/**
 * A plain <img> with a responsive srcset from Unsplash's CDN. No
 * next/image: Unsplash already resizes and serves modern formats, so
 * routing through Vercel's optimizer would only add cost.
 */
export default function Photo({ photo, sizes, ratio, priority, credit = true, className, alt }: Props) {
  return (
    <div className={`photo ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoUrl(photo, 1280, ratio ? { h: Math.round(1280 / ratio) } : {})}
        srcSet={photoSrcSet(photo, WIDTHS, ratio)}
        sizes={sizes}
        alt={alt ?? photo.alt}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
      />
      {credit ? (
        <a className="credit" href={photoPage(photo)} target="_blank" rel="noopener noreferrer">
          Photo: {photo.by} / Unsplash
        </a>
      ) : null}
    </div>
  );
}
