import { Loader2 } from "lucide-react";

/**
 * Loading placeholder for a content section: an indeterminate progress bar
 * plus a small labelled spinner. Used while a tab's data is being fetched.
 */
export function SectionLoader({
  label = "Loading…",
  className = "py-16",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-[220px]">
        <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full w-1/3 rounded-full bg-neutral-900 animate-progress" />
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {label}
        </p>
      </div>
    </div>
  );
}
