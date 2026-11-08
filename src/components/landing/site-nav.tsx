"use client";

import Link from "next/link";
import { Hand } from "lucide-react";

const LINKS = [
  { href: "#loop", label: "The loop" },
  { href: "#how", label: "How it works" },
  { href: "#privacy", label: "Privacy" },
  { href: "#limits", label: "Limits" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 glass-strong">
      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[var(--accent-contrast)]">
            <Hand className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">AirSign</span>
        </Link>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <Link
          href="/app"
          className="ml-auto inline-flex h-9 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-contrast)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] md:ml-2"
        >
          Open AirSign
        </Link>
      </nav>
    </header>
  );
}
