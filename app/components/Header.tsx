import { NavLink } from "react-router";
import { useState } from "react";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/setlists", label: "Setlists" },
  { to: "/about", label: "About" },
];

export function Header({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <a className="brand" href="/">
        DA'QTAD<span>.</span>
      </a>
      {!compact && (
        <button
          className="nav-toggle"
          type="button"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label="Menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      )}
      <nav className="nav" id="site-nav" aria-label="Main" {...(open ? { "data-open": "" } : {})}>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)}>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
