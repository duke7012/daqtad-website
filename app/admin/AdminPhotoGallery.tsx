import { useEffect, useRef, useState } from "react";
import { Form, useFetcher, useRevalidator } from "react-router";
import { compressImageIfNeeded } from "~/lib/compress-image";
import { rooted } from "~/lib/urls";

type GalleryPhoto = {
  id: string;
  url: string;
  alt: string | null;
};

export function AdminPhotoUpload({
  intent,
  fields,
}: {
  intent: string;
  fields: Record<string, string>;
}) {
  const fetcher = useFetcher<{ message?: string; failed?: boolean }>();
  const revalidator = useRevalidator();
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<File[]>([]);
  const indexRef = useRef(0);
  const waitingRef = useRef(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [status, setStatus] = useState("");
  const [phase, setPhase] = useState<"idle" | "compressing" | "uploading">("idle");

  async function submitCurrent() {
    const original = filesRef.current[indexRef.current];
    if (!original) return;
    setProgress({ current: indexRef.current + 1, total: filesRef.current.length });
    try {
      setPhase("compressing");
      const file = await compressImageIfNeeded(original);
      setPhase("uploading");
      waitingRef.current = true;
      const formData = new FormData();
      formData.set("intent", intent);
      for (const [key, value] of Object.entries(fields)) formData.set(key, value);
      formData.set("file", file);
      fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
    } catch (error) {
      waitingRef.current = false;
      setPhase("idle");
      setStatus(error instanceof Error ? error.message : "Compression failed.");
      setProgress(null);
      filesRef.current = [];
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!waitingRef.current || fetcher.state !== "idle" || !fetcher.data) return;
    waitingRef.current = false;

    if (fetcher.data.failed) {
      setStatus(fetcher.data.message || "Upload failed.");
      setPhase("idle");
      setProgress(null);
      filesRef.current = [];
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    indexRef.current += 1;
    if (indexRef.current < filesRef.current.length) {
      void submitCurrent();
      return;
    }

    const count = filesRef.current.length;
    setStatus(`Uploaded ${count} photo${count === 1 ? "" : "s"} ✓`);
    setPhase("idle");
    setProgress(null);
    filesRef.current = [];
    if (inputRef.current) inputRef.current.value = "";
    revalidator.revalidate();
  }, [fetcher.state, fetcher.data, intent, revalidator]);

  const busy = phase !== "idle" || fetcher.state !== "idle";

  return (
    <div className="admin-actions">
      <label className="admin-field">
        <span>
          Upload photos
          <small> - large files are compressed automatically</small>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(event) => {
            const list = Array.from(event.currentTarget.files || []);
            if (!list.length || busy) return;
            filesRef.current = list;
            indexRef.current = 0;
            setStatus("");
            void submitCurrent();
          }}
        />
      </label>
      {progress ? (
        <p className="admin-hint">
          {phase === "compressing" ? "Compressing" : "Uploading"} {progress.current} of {progress.total}…
        </p>
      ) : null}
      {!progress && status ? <p className="admin-hint">{status}</p> : null}
    </div>
  );
}

export function AdminPhotoGallery({
  photos,
  emptyLabel,
  altIntent,
  moveIntent,
  deleteIntent,
  fields = {},
}: {
  photos: GalleryPhoto[];
  emptyLabel: string;
  altIntent: string;
  moveIntent: string;
  deleteIntent: string;
  fields?: Record<string, string>;
}) {
  return (
    <>
      {!photos.length ? (
        <div className="admin-empty">{emptyLabel}</div>
      ) : (
        <div className="admin-thumbs">
          {photos.map((photo) => (
            <div className="admin-thumb" key={photo.id}>
              <img src={rooted(photo.url)} alt="" />
              <div className="admin-thumb__body">
                <Form method="post">
                  <input type="hidden" name="intent" value={altIntent} />
                  <input type="hidden" name="id" value={photo.id} />
                  {Object.entries(fields).map(([key, value]) => (
                    <input key={key} type="hidden" name={key} value={value} />
                  ))}
                  <input
                    type="text"
                    name="alt"
                    defaultValue={photo.alt || ""}
                    placeholder="Describe the photo"
                    onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                  />
                </Form>
                <div className="admin-thumb__row">
                  <Form method="post">
                    {Object.entries(fields).map(([key, value]) => (
                      <input key={key} type="hidden" name={key} value={value} />
                    ))}
                    <input type="hidden" name="id" value={photo.id} />
                    <input type="hidden" name="dir" value="-1" />
                    <button className="btn btn--xs btn--ghost" type="submit" name="intent" value={moveIntent}>
                      ↑
                    </button>
                  </Form>
                  <Form method="post">
                    {Object.entries(fields).map(([key, value]) => (
                      <input key={key} type="hidden" name={key} value={value} />
                    ))}
                    <input type="hidden" name="id" value={photo.id} />
                    <input type="hidden" name="dir" value="1" />
                    <button className="btn btn--xs btn--ghost" type="submit" name="intent" value={moveIntent}>
                      ↓
                    </button>
                  </Form>
                  <Form method="post">
                    {Object.entries(fields).map(([key, value]) => (
                      <input key={key} type="hidden" name={key} value={value} />
                    ))}
                    <input type="hidden" name="id" value={photo.id} />
                    <button
                      className="btn btn--xs btn--danger"
                      type="submit"
                      name="intent"
                      value={deleteIntent}
                      onClick={(e) => {
                        if (!window.confirm("Remove this photo?")) e.preventDefault();
                      }}
                    >
                      Delete
                    </button>
                  </Form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
