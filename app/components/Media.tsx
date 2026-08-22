import { useState } from "react";
import { rooted } from "~/lib/urls";

export function Media({
  src,
  alt,
  placeholder = "Photo coming soon",
  modifier = "",
}: {
  src?: string;
  alt?: string;
  placeholder?: string;
  modifier?: string;
}) {
  const url = rooted(src);
  const [empty, setEmpty] = useState(!url);

  return (
    <div
      className={`media${modifier ? ` ${modifier}` : ""}`}
      data-placeholder={placeholder}
      {...(empty ? { "data-empty": "" } : {})}
    >
      {url ? (
        <img
          src={url}
          alt={alt || ""}
          loading="lazy"
          decoding="async"
          onError={() => setEmpty(true)}
          onLoad={() => setEmpty(false)}
        />
      ) : null}
    </div>
  );
}
