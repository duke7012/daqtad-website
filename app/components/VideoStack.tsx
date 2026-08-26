import { youtubeIds } from "~/lib/urls";

export function VideoStack({
  video,
  title,
  showEmpty = true,
}: {
  video: string;
  title: string;
  showEmpty?: boolean;
}) {
  const ids = youtubeIds(video);
  if (!ids.length) {
    if (!showEmpty) return null;
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
        const label = ids.length === 1 ? `${title} video` : `${title} video ${i + 1}`;
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
