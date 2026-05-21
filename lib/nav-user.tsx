"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { LogOut, ChevronDown } from "lucide-react";

export function NavUser() {
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading || !user) return null;

  const name =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-medium">
          {initials}
        </div>
        <span className="text-sm font-medium text-neutral-700 hidden sm:block max-w-[120px] truncate">
          {name}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
      </button>

      {open && (
        <div className="absolute right-4 top-14 w-56 bg-white rounded-2xl shadow-lg border border-neutral-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-2 border-b border-neutral-100">
            <p className="text-sm font-medium text-neutral-900 truncate">{name}</p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
