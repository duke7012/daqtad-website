import { Form } from "react-router";
import { Field } from "~/admin/fields";
import type { AdminSettings } from "~/types";

export function SettingsTab({ settings }: { settings: AdminSettings }) {
  return (
    <Form method="post" className="admin-card">
      <div className="admin-head">
        <h2>Settings</h2>
      </div>
      <p className="admin-hint">These links appear in the footer and on the About page. Google Drive albums are set on each event.</p>
      <div className="admin-grid">
        <Field label="Instagram" name="instagram" defaultValue={settings.instagram || ""} type="url" />
        <Field label="Facebook" name="facebook" defaultValue={settings.facebook || ""} type="url" />
      </div>
      <div className="admin-actions">
        <button className="btn btn--primary" type="submit" name="intent" value="settings-save">
          Save
        </button>
      </div>
    </Form>
  );
}
