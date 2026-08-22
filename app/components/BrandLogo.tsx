export function BrandLogo({ className = "brand-logo" }: { className?: string }) {
  return (
    <img
      className={className}
      src="/assets/images/logo.png"
      alt="DA'QTAD"
      width={295}
      height={103}
      decoding="async"
    />
  );
}
