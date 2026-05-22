"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

/** Error thrown by the fetcher, carrying the HTTP status for callers that care. */
export class FetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FetchError";
    this.status = status;
  }
}

/** Shared SWR fetcher — throws on non-2xx so `error` is populated. */
async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new FetchError(`Request to ${url} failed`, res.status);
  }
  return res.json();
}

/**
 * App-wide SWR config. Caches responses in memory so navigating away and back
 * shows data instantly (no empty flash) and re-fetches are deduped.
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 5000,
        keepPreviousData: true,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
