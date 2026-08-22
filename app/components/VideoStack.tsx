import { youtubeIds } from "~/lib/urls";
import type { EventItem } from "~/types";

export function VideoStack({ event }: { event: EventItem }) {
  const ids = youtubeIds(event.video);
  if (!ids.length) {
    return (
      <div className="video-frame">
        <div className="video-frame__empty">
          ▶️
          <span>Videos coming soon</span>
          <small>add YouTube links on the admin page</small>
        </div>
      </div>
    );
  }

  return (
    <div className="video-stack">
      {ids.map((id, i) => {
        const label = ids.length === 1 ? `${event.title} video` : `${event.title} video ${i + 1}`;
        return (
          <div className="video-frame" key={id}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title={label}
              allowFullScreen
              allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            />
          </div>
        );
      })}
    </div>
  );
}
