import { useState } from "react";
import {
  EVENT_SECTION_LABELS,
  movePageSection,
  parsePageSections,
  serializePageSections,
  togglePageSection,
  type EventPageSection,
  type EventSectionId,
} from "~/lib/event-sections";

export function PageSectionsEditor({
  name,
  defaultValue,
  status,
}: {
  name: string;
  defaultValue: unknown;
  status: string;
}) {
  const [sections, setSections] = useState<EventPageSection[]>(() => parsePageSections(defaultValue, status));

  function move(id: EventSectionId, dir: -1 | 1) {
    setSections((current) => movePageSection(current, id, dir));
  }

  function toggle(id: EventSectionId) {
    setSections((current) => togglePageSection(current, id));
  }

  return (
    <div className="admin-sections">
      <input type="hidden" name={name} value={serializePageSections(sections)} readOnly />
      {sections.map((section, index) => (
        <div className="admin-row" key={section.id}>
          <div className="admin-row__main">
            <div className="admin-row__title">{EVENT_SECTION_LABELS[section.id]}</div>
            <div className="admin-row__meta">{section.visible ? "Shown on page" : "Hidden"}</div>
          </div>
          <div className="admin-row__actions">
            <label className="admin-check admin-check--inline">
              <input
                type="checkbox"
                checked={section.visible}
                onChange={() => toggle(section.id)}
              />
              <span>Show</span>
            </label>
            <button
              className="btn btn--xs btn--ghost"
              type="button"
              disabled={index === 0}
              onClick={() => move(section.id, -1)}
              aria-label={`Move ${EVENT_SECTION_LABELS[section.id]} up`}
            >
              ↑
            </button>
            <button
              className="btn btn--xs btn--ghost"
              type="button"
              disabled={index === sections.length - 1}
              onClick={() => move(section.id, 1)}
              aria-label={`Move ${EVENT_SECTION_LABELS[section.id]} down`}
            >
              ↓
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
