"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/invoices", label: "Collections", icon: "cash" },
  { href: "/settings", label: "Agent settings", icon: "sliders" },
];

function Icon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case "cash":
      return (
        <svg {...common}>
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...common}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="hcp-shell">
      <aside className="hcp-sidebar">
        <Link href="/" className="hcp-sidebar__brand">
          <span style={{ color: "var(--hcp-blue)" }}>◈</span> Housecall Pro
        </Link>
        <div className="hcp-sidebar__create">
          <button className="hcp-btn hcp-btn--primary">+ create</button>
        </div>
        <ul className="hcp-nav">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  "hcp-nav__item" +
                  (isActive(item.href) ? " hcp-nav__item--active" : "")
                }
              >
                <span className="hcp-nav__icon">
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <div>
        <header className="hcp-topbar">
          <div className="hcp-search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input placeholder="Search customers, invoices…" aria-label="Search" />
          </div>
          <span className="hcp-badge hcp-badge--sent">AI Team</span>
          <div className="hcp-avatar" title="Dana — Pro">
            DR
          </div>
        </header>
        <main className="hcp-content">{children}</main>
      </div>
    </div>
  );
}
