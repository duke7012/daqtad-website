import { Form } from "react-router";
import { AdminPhotoGallery, AdminPhotoUpload } from "~/admin/AdminPhotoGallery";
import { Field } from "~/admin/fields";
import type { AdminAboutPhoto, AdminAboutSection, AdminSettings } from "~/types";

export function AboutTab({
  settings,
  sections,
  aboutPhotos,
}: {
  settings: AdminSettings;
  sections: AdminAboutSection[];
  aboutPhotos: AdminAboutPhoto[];
}) {
  return (
    <>
      <Form method="post" className="admin-card">
        <div className="admin-head">
          <h2>About page</h2>
        </div>
        <p className="admin-hint">
          Intro copy for the public About page. Use blank lines between paragraphs. Wrap emphasis in **double
          asterisks**. Add intro photos in the next card, and more media on each story section.
        </p>
        <div className="admin-grid">
          <Field label="Title" name="about_title" defaultValue={settings.about_title || "About DA'QTAD"} />
          <Field
            label="Pronunciation"
            name="about_pronunciation"
            defaultValue={settings.about_pronunciation || "/duh-kah-taht/"}
            hint="Shown under the title"
          />
        </div>
        <label className="admin-field" style={{ marginTop: 12 }}>
          <span>Intro</span>
          <textarea name="about_intro" defaultValue={settings.about_intro || ""} />
        </label>
        <div className="admin-actions">
          <button className="btn btn--primary" type="submit" name="intent" value="about-intro-save">
            Save intro
          </button>
        </div>
      </Form>

      <div className="admin-card">
        <div className="admin-head">
          <h2>Intro photos</h2>
        </div>
        <p className="admin-hint">Shown under the intro on the About page. Hidden if empty.</p>
        <AdminPhotoGallery
          photos={aboutPhotos.filter((photo) => !photo.section_id)}
          emptyLabel="No intro photos yet."
          altIntent="about-photo-alt"
          moveIntent="about-photo-move"
          deleteIntent="about-photo-delete"
          fields={{ scope: "intro" }}
        />
        <AdminPhotoUpload intent="about-photo-upload" fields={{ scope: "intro" }} />
      </div>

      <div className="admin-card">
        <div className="admin-head">
          <h2>Story sections</h2>
          <Form method="post">
            <button className="btn btn--xs btn--primary" type="submit" name="intent" value="about-section-add">
              + Add section
            </button>
          </Form>
        </div>
        <p className="admin-hint">
          Each section can have its own photos and YouTube videos. Empty media stays hidden on the site. FAQ stays on
          the FAQ tab.
        </p>
      </div>

      {!sections.length ? (
        <div className="admin-empty">No story sections yet.</div>
      ) : (
        sections.map((section) => {
          const photos = aboutPhotos.filter((photo) => photo.section_id === section.id);
          return (
            <div className="admin-card admin-card--tight" key={section.id}>
              {(
                [
                  ["heading", "Heading", "text"],
                  ["body", "Body", "textarea"],
                  ["mission", "Mission quote", "textarea"],
                  ["closing", "Closing line", "textarea"],
                  ["link_label", "Link label", "text"],
                  ["link_href", "Link URL", "text"],
                  ["videos", "YouTube videos", "textarea"],
                ] as const
              ).map(([part, label, type]) => (
                <Form method="post" key={part}>
                  <input type="hidden" name="intent" value="about-section-edit" />
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="part" value={part} />
                  <label className="admin-field" style={{ marginTop: part === "heading" ? 0 : 12 }}>
                    <span>
                      {label}
                      {part === "videos" ? <small>One URL or ID per line</small> : null}
                    </span>
                    {type === "textarea" ? (
                      <textarea
                        name="value"
                        defaultValue={section[part] || ""}
                        onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      />
                    ) : (
                      <input
                        type="text"
                        name="value"
                        defaultValue={section[part] || ""}
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
                  altIntent="about-photo-alt"
                  moveIntent="about-photo-move"
                  deleteIntent="about-photo-delete"
                  fields={{ section_id: section.id }}
                />
                <AdminPhotoUpload intent="about-photo-upload" fields={{ section_id: section.id }} />
              </div>

              <div className="admin-actions">
                <Form method="post">
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="dir" value="-1" />
                  <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="about-section-move">
                    ↑
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="dir" value="1" />
                  <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="about-section-move">
                    ↓
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="id" value={section.id} />
                  <button
                    className="btn btn--xs btn--danger"
                    type="submit"
                    name="intent"
                    value="about-section-delete"
                    onClick={(e) => {
                      if (!window.confirm("Delete this section?")) e.preventDefault();
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
