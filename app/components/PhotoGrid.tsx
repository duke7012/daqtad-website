import { useState } from "react";
import { Lightbox } from "~/components/Lightbox";
import { Media } from "~/components/Media";
import type { Photo } from "~/types";

export function PhotoGrid({
  photos,
  placeholder,
  large = false,
}: {
  photos: Photo[];
  placeholder?: string;
  large?: boolean;
}) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className={`photo-grid${large ? " photo-grid--lg" : ""}`}>
        {photos.map((photo, i) => (
          <button
            key={`${photo.src}-${i}`}
            className="tile"
            type="button"
            data-index={i}
            aria-label={`Open ${photo.alt}`}
            onClick={() => setIndex(i)}
          >
            <Media src={photo.src} alt={photo.alt} placeholder={placeholder || `photo ${i + 1}`} />
          </button>
        ))}
      </div>
      {index !== null && (
        <Lightbox
          items={photos}
          index={index}
          onClose={() => setIndex(null)}
          onStep={(delta) => setIndex((current) => {
            const from = current ?? 0;
            return (from + delta + photos.length) % photos.length;
          })}
        />
      )}
    </>
  );
}
