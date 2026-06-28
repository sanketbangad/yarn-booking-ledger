"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { avatarColor, initials } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function Header({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const name = profile.full_name || "User";
  const isAdmin = profile.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white shadow-sm">
            <GridGlyph />
          </span>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-ink">{APP_NAME}</p>
          </div>
        </div>

        <div className="ml-auto" ref={ref}>
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2.5 transition-colors hover:bg-bg"
          >
            <span
              className="grid h-7 w-7 place-items-center rounded-full text-[12px] font-semibold text-white"
              style={{ backgroundColor: avatarColor(name) }}
            >
              {initials(name)}
            </span>
            <span className="hidden max-w-[140px] truncate text-[13px] font-medium text-ink sm:block">
              {name}
            </span>
            <ChevronDown className="h-4 w-4 text-faint" />
          </button>

          {open && (
            <div className="absolute right-4 mt-2 w-60 animate-scale-in overflow-hidden rounded-xl border border-border bg-surface shadow-pop sm:right-6">
              <div className="flex items-center gap-3 border-b border-border px-3.5 py-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white"
                  style={{ backgroundColor: avatarColor(name) }}
                >
                  {initials(name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{name}</p>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                    {isAdmin && <ShieldCheck className="h-3 w-3 text-primary" />}
                    {isAdmin ? "Admin" : "Member"}
                  </span>
                </div>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-ink transition-colors hover:bg-bg"
                >
                  <LogOut className="h-4 w-4 text-muted" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function GridGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18M9 9v12" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="3" width="18" height="6" rx="0" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
