"use client";

import { useCallback, useState, type ImgHTMLAttributes } from "react";

/**
 * <img> that hides itself if the file fails, so a missing photo shows the
 * frame's gradient instead of a broken-image icon and alt text. The ref
 * check catches images that failed before React hydrated.
 */
export default function PhotoImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0 && img.currentSrc) setFailed(true);
  }, []);
  return (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} ref={ref} data-failed={failed || undefined} onError={() => setFailed(true)} />
  );
}
