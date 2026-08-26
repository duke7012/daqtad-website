import { useEffect } from "react";
import { rooted } from "~/lib/urls";
import type { Photo } from "~/types";

export function Lightbox({
  items,
  index,
  onClose,
  onStep,
}: {
  items: Photo[];
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  const item = items[index];

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onStep(-1);
      if (event.key === "ArrowRight") onStep(1);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, onStep]);

  if (!item) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      data-open=""
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button className="lightbox__btn lightbox__btn--close" aria-label="Close" onClick={onClose}>
        ✕
      </button>
      <button className="lightbox__btn lightbox__btn--prev" aria-label="Previous photo" onClick={() => onStep(-1)}>
        ‹
      </button>
      <img src={rooted(item.src)} alt={item.alt || ""} />
      <button className="lightbox__btn lightbox__btn--next" aria-label="Next photo" onClick={() => onStep(1)}>
        ›
      </button>
      <p className="lightbox__caption">
        {index + 1} / {items.length}
        {item.alt ? ` · ${item.alt}` : ""}
      </p>
    </div>
  );
}
