export function RichText({
  text,
  as: Tag = "p",
  className,
}: {
  text: string;
  as?: "p" | "span";
  className?: string;
}) {
  const parts = String(text || "").split(/(\*\*[^*]+\*\*)/g);
  return (
    <Tag className={className}>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </Tag>
  );
}
