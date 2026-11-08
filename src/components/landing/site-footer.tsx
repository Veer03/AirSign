import Link from "next/link";
import { Hand } from "lucide-react";

const DOC_LINKS = [
  { href: "https://github.com/Veer03/AirSign/blob/Dev/docs/SPEC.md", label: "Spec" },
  {
    href: "https://github.com/Veer03/AirSign/blob/Dev/docs/RESOURCES.md",
    label: "Resources",
  },
  {
    href: "https://github.com/Veer03/AirSign/blob/Dev/docs/ARCHITECTURE.md",
    label: "Architecture",
  },
  {
    href: "https://github.com/Veer03/AirSign/blob/Dev/docs/DESIGN.md",
    label: "Design",
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[var(--accent-contrast)]">
              <Hand className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight">AirSign</span>
          </Link>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-muted-foreground">
            A conversation window for people communicating across speech
            barriers: a short sign capture, an AI gist the signer confirms,
            spoken output, and live reply captions. Not a substitute for a human
            interpreter.
          </p>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Gist, not translation. Video stays in the browser. Built at HackCamp.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Product
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/app"
                  className="text-muted-foreground transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Workspace
                </Link>
              </li>
              <li>
                <a
                  href="#loop"
                  className="text-muted-foreground transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  The loop
                </a>
              </li>
              <li>
                <a
                  href="#limits"
                  className="text-muted-foreground transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Limits
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Docs
            </h2>
            <ul className="mt-3 space-y-2">
              {DOC_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Repo
            </h2>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://github.com/Veer03/AirSign"
                  className="text-muted-foreground transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Veer03/AirSign/blob/Dev/README.md"
                  className="text-muted-foreground transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  README
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Veer03/AirSign/blob/Dev/docs/CONTRIBUTING.md"
                  className="text-muted-foreground transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  Contributing
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
