import Link from "next/link";
import { ICONS } from "./icons";
import { cn } from "@/lib/utils";

interface CardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  available?: boolean;
  className?: string;
}

export function Card({
  title,
  description,
  icon,
  href,
  available = true,
  className,
}: CardProps) {
  const content = (
    <>
      <div
        className={cn(
          "mb-4 flex h-10 w-10 items-center justify-center rounded-lg",
          available
            ? "bg-accent-primary/10 text-accent-primary"
            : "bg-bg-card-hover text-text-muted"
        )}
      >
        {ICONS[icon] ?? ICONS.hash}
      </div>
      <h3
        className={cn(
          "mb-2 font-display text-base font-semibold",
          available ? "text-text-primary" : "text-text-muted"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm leading-relaxed",
          available ? "text-text-secondary" : "text-text-muted/60"
        )}
      >
        {description}
      </p>
      {available ? (
        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent-primary opacity-0 transition-opacity group-hover:opacity-100">
          Erkunden
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      ) : (
        <div className="mt-4 inline-flex items-center rounded-full border border-border-subtle px-2.5 py-0.5 text-xs font-medium text-text-muted">
          Bald verfügbar
        </div>
      )}
    </>
  );

  if (!available) {
    return (
      <div
        className={cn(
          "block cursor-default rounded-xl border border-border-subtle bg-bg-card/40 p-6 opacity-50",
          className
        )}
        data-animate
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group block rounded-xl border border-border-subtle bg-bg-card p-6",
        "transition-colors duration-200",
        "hover:border-accent-primary/30 hover:bg-accent-primary/[0.03]",
        className
      )}
      data-animate
    >
      {content}
    </Link>
  );
}
