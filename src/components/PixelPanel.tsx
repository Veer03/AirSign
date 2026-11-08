import { cn } from "@/lib/utils";

const CORNERS = [
  "left-0 top-0",
  "right-0 top-0",
  "bottom-0 left-0",
  "bottom-0 right-0",
] as const;

export function PixelPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pixel-panel", className)}>
      {CORNERS.map((corner) => (
        <span key={corner} aria-hidden className={cn("pixel-corner", corner)} />
      ))}
      {children}
    </div>
  );
}
