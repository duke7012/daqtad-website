import { Form } from "react-router";
import { AdminPhotoGallery, AdminPhotoUpload } from "~/admin/AdminPhotoGallery";
import { Field } from "~/admin/fields";
import type { AdminExtraPhoto, AdminExtraProject, AdminSettings } from "~/types";

export function ExtrasTab({
  settings,
  projects,
  extraPhotos,
}: {
  settings: AdminSettings;
  projects: AdminExtraProject[];
  extraPhotos: AdminExtraPhoto[];
}) {
  return (
    <>
      <Form method="post" className="admin-card">
        <div className="admin-head">
          <h2>Extras page</h2>
        </div>
        <p className="admin-hint">Intro for the Extras page. Upload photos on each project below.</p>
        <div className="admin-grid">
          <Field label="Title" name="extras_title" defaultValue={settings.extras_title || "Extras"} />
        </div>
        <label className="admin-field" style={{ marginTop: 12 }}>
          <span>Intro</span>
          <textarea name="extras_intro" defaultValue={settings.extras_intro || ""} />
        </label>
        <div className="admin-actions">
          <button className="btn btn--primary" type="submit" name="intent" value="extras-intro-save">
            Save intro
          </button>
        </div>
      </Form>

      <div className="admin-card">
        <div className="admin-head">
          <h2>Projects</h2>
          <Form method="post">
            <button className="btn btn--xs btn--primary" type="submit" name="intent" value="extras-project-add">
              + Add project
            </button>
          </Form>
        </div>
        <p className="admin-hint">
          Each project is one article. Paste YouTube URLs one per line. Photos upload to that project&apos;s gallery.
        </p>
      </div>

      {!projects.length ? (
        <div className="admin-empty">No projects yet.</div>
      ) : (
        projects.map((project) => {
          const photos = extraPhotos.filter((photo) => photo.project_id === project.id);
          return (
            <div className="admin-card admin-card--tight" key={project.id}>
              {(
                [
                  ["title", "Title", "text"],
                  ["slug", "Slug", "text"],
                  ["eyebrow", "Eyebrow", "text"],
                  ["body", "Body", "textarea"],
                  ["videos", "YouTube videos", "textarea"],
                ] as const
              ).map(([part, label, type]) => (
                <Form method="post" key={part}>
                  <input type="hidden" name="intent" value="extras-project-edit" />
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="part" value={part} />
                  <label className="admin-field" style={{ marginTop: part === "title" ? 0 : 12 }}>
                    <span>
                      {label}
                      {part === "slug" ? <small>Used in the page anchor link</small> : null}
                      {part === "videos" ? <small>One URL or ID per line</small> : null}
                    </span>
                    {type === "textarea" ? (
                      <textarea
                        name="value"
                        defaultValue={project[part] || ""}
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                    ) : (
                      <input
                        type="text"
                        name="value"
                        defaultValue={project[part] || ""}
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                    )}
                  </label>
                </Form>
              ))}

              <div style={{ marginTop: 16 }}>
                <h3 className="h3" style={{ marginBottom: 10 }}>
                  Photos
                </h3>
                <AdminPhotoGallery
                  photos={photos}
                  emptyLabel="No photos yet."
                  altIntent="extras-photo-alt"
                  moveIntent="extras-photo-move"
                  deleteIntent="extras-photo-delete"
                  fields={{ project_id: project.id }}
                />
                <AdminPhotoUpload intent="extras-photo-upload" fields={{ project_id: project.id }} />
              </div>

              <div className="admin-actions">
                <Form method="post">
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="dir" value="-1" />
                  <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="extras-project-move">
                    ↑
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="dir" value="1" />
                  <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="extras-project-move">
                    ↓
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="id" value={project.id} />
                  <button
                    className="btn btn--xs btn--danger"
                    type="submit"
                    name="intent"
                    value="extras-project-delete"
                    onClick={(e) => {
                      if (!window.confirm("Delete this project?")) e.preventDefault();
                    }}
                  >
                    Delete
                  </button>
                </Form>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
