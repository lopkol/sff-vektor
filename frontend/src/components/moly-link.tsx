import { cn } from "@/lib/utils";

interface MolyLinkProps {
  url: string;
  className?: string;
}

/**
 * A small "m" mark linking to a moly.hu page, opened in a new tab.
 * Colored in moly's brand blue. Stops click propagation so it can live
 * inside clickable table rows without triggering the row's handler.
 */
export function MolyLink({ url, className }: MolyLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="moly.hu"
      aria-label="moly.hu"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded bg-[#cfdfef] text-sm font-bold leading-none tracking-tight text-[#2f5f8f] transition-colors hover:bg-[#bcd3e9]",
        className,
      )}
    >
      m
    </a>
  );
}
