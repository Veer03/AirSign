export function Marquee({ items }: { items: string[] }) {
  const doubled = [...items, ...items];

  return (
    <div className="marquee border-y border-white/15 bg-black/50">
      <div className="marquee-track">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="label flex items-center gap-3 px-6 py-3"
            aria-hidden={index >= items.length}
          >
            <span className="h-1 w-1 shrink-0 bg-accent" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
