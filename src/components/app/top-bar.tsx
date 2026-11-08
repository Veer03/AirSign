"use client";

import Link from "next/link";
import { Hand, House, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTEXTS } from "@/lib/contexts";
import type { ContextId } from "@/lib/contracts";
import { StatusIsland, type WorkspaceStatus } from "./status-island";

type TopBarProps = {
  context: ContextId;
  onContextChange: (context: ContextId) => void;
  onOpenSettings: () => void;
  status: WorkspaceStatus;
};

export function TopBar({
  context,
  onContextChange,
  onOpenSettings,
  status,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 glass-strong">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] text-[var(--accent-contrast)]">
            <Hand className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">AirSign</span>
          <span className="hidden rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:inline">
            Demo workspace
          </span>
        </Link>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="text-xs text-muted-foreground">Context</span>
            <Select
              value={context}
              onValueChange={(value) => onContextChange(value as ContextId)}
            >
              <SelectTrigger size="sm" className="w-[8.5rem]" aria-label="Context">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTEXTS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" variant="outline" onClick={onOpenSettings}>
            <Settings2 aria-hidden="true" />
            <span className="hidden sm:inline">Settings</span>
          </Button>

          <Link
            href="/"
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-[var(--border)] px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <House className="size-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Landing</span>
          </Link>

          <StatusIsland status={status} />
        </div>
      </div>
    </header>
  );
}
