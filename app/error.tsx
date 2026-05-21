"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-2xl font-semibold tracking-tight text-neutral-900">
        Something went wrong
      </p>
      <p className="max-w-md text-sm text-neutral-500">
        An unexpected error occurred. You can try again, or head back to your requisitions.
      </p>
      <div className="mt-2 flex gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back to Requisitions
        </Link>
      </div>
    </div>
  );
}
