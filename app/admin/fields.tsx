import type { ReactNode } from "react";

export function Field({
  label,
  name,
  defaultValue = "",
  type = "text",
  hint,
  placeholder,
  choices,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  hint?: string;
  placeholder?: string;
  choices?: Array<string | { value: string; label: string }>;
}) {
  return (
    <label className="admin-field">
      <span>
        {label}
        {hint ? <small>{hint}</small> : null}
      </span>
      {type === "textarea" ? (
        <textarea name={name} defaultValue={String(defaultValue ?? "")} />
      ) : type === "select" ? (
        <select name={name} defaultValue={String(defaultValue ?? "")}>
          {(choices || []).map((choice) => {
            const value = typeof choice === "string" ? choice : choice.value;
            const text = typeof choice === "string" ? choice : choice.label;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={String(defaultValue ?? "")}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

export function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="admin-check">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      <span>{label}</span>
    </label>
  );
}

export function Status({ message, failed }: { message?: string; failed?: boolean }) {
  if (!message) return null;
  return (
    <p className="admin-status" role="status" aria-live="polite" {...(failed ? { "data-error": "" } : {})}>
      {message}
    </p>
  );
}

export function AdminTabs({ tab }: { tab: string }) {
  const tabs = [
    ["events", "Events"],
    ["songs", "Song library"],
    ["faqs", "FAQ"],
    ["requests", "Requests"],
    ["settings", "Settings"],
  ] as const;

  return (
    <div className="admin-tabs">
      {tabs.map(([id, label]) => (
        <a
          key={id}
          className="admin-tab"
          href={`/admin?tab=${id}`}
          aria-selected={tab === id}
        >
          {label}
        </a>
      ))}
    </div>
  );
}

export function ConfirmButton({
  children,
  message,
  className,
  name,
  value,
  intent,
}: {
  children: ReactNode;
  message: string;
  className: string;
  name?: string;
  value?: string;
  intent: string;
}) {
  return (
    <button
      className={className}
      type="submit"
      name="intent"
      value={intent}
      {...(name ? { form: undefined } : {})}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {children}
    </button>
  );
}
