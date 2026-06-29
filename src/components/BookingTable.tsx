"use client";

import { useMemo, useState } from "react";
import {
  Search, Plus, ArrowUp, ArrowDown, ChevronsUpDown, SlidersHorizontal,
  Pencil, Trash2, X, Inbox, Filter as FilterIcon, PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { COLUMNS, type ColumnKey } from "@/lib/constants";
import { cn, formatDate, formatNumber, formatTimestamp, avatarColor, initials } from "@/lib/utils";
import type { Booking } from "@/lib/types";

type SortDir = "asc" | "desc";
interface SortState {
  key: ColumnKey;
  dir: SortDir;
}

interface BookingTableProps {
  bookings: Booking[];
  loading: boolean;
  currentUserId: string;
  isAdmin: boolean;
  flashId: string | null;
  receivedByBooking: Map<string, number>;
  onNew: () => void;
  onEdit: (b: Booking) => void;
  onDelete: (b: Booking) => void;
  onReceive: (b: Booking) => void;
}

const FILTER_COLS = COLUMNS.filter((c) => c.filterable);
// columns rendered = data columns + Received status + Actions
const EXTRA_COLS = 2;

interface Recv {
  received: number;
  pending: number;
  pct: number;
  label: "Received" | "Partial" | "Pending";
}

function recvInfo(b: Booking, receivedByBooking: Map<string, number>): Recv {
  const ordered = Number(b.quantity);
  const received = receivedByBooking.get(b.id) ?? 0;
  const pending = Math.max(0, ordered - received);
  const pct = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
  const label = received <= 0 ? "Pending" : pending <= 0 ? "Received" : "Partial";
  return { received, pending, pct, label };
}

export function BookingTable({
  bookings,
  loading,
  currentUserId,
  isAdmin,
  flashId,
  receivedByBooking,
  onNew,
  onEdit,
  onDelete,
  onReceive,
}: BookingTableProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "booking_date", dir: "desc" });
  const [filters, setFilters] = useState<Partial<Record<ColumnKey, string>>>({});
  const [showFilters, setShowFilters] = useState(false);

  const distinct = useMemo(() => {
    const map: Partial<Record<ColumnKey, string[]>> = {};
    for (const col of FILTER_COLS) {
      const set = new Set<string>();
      for (const b of bookings) {
        const v = String(b[col.key] ?? "").trim();
        if (v) set.add(v);
      }
      map[col.key] = Array.from(set).sort((a, z) => a.localeCompare(z));
    }
    return map;
  }, [bookings]);

  const activeFilters = Object.entries(filters).filter(([, v]) => v);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = bookings.filter((b) => {
      for (const [key, val] of activeFilters) {
        if (String(b[key as ColumnKey] ?? "") !== val) return false;
      }
      if (!q) return true;
      const haystack = [
        b.party_name, b.item_name, b.broker, b.booked_by_name,
        b.remarks ?? "", formatDate(b.booking_date), String(b.booking_rate),
        String(b.quantity), b.quantity_unit,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const { key, dir } = sort;
    const mult = dir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      let av: string | number = a[key] as never;
      let bv: string | number = b[key] as never;
      if (key === "booking_rate" || key === "quantity") {
        av = Number(av); bv = Number(bv);
        return (av - bv) * mult;
      }
      av = String(av ?? "").toLowerCase();
      bv = String(bv ?? "").toLowerCase();
      if (av < bv) return -1 * mult;
      if (av > bv) return 1 * mult;
      return (a.created_at < b.created_at ? 1 : -1);
    });
    return list;
  }, [bookings, search, sort, activeFilters]);

  function toggleSort(key: ColumnKey) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function clearAll() {
    setFilters({});
    setSearch("");
  }

  const canModify = (b: Booking) => isAdmin || b.created_by === currentUserId;
  const hasAnyFilter = activeFilters.length > 0 || search.trim().length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:min-w-[260px] sm:flex-initial">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            type="search"
            placeholder="Search bookings…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search bookings"
          />
        </div>

        <Button
          variant={showFilters || activeFilters.length ? "primary" : "secondary"}
          onClick={() => setShowFilters((s) => !s)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters.length > 0 && (
            <span className="ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-white/25 px-1 text-[11px] font-semibold">
              {activeFilters.length}
            </span>
          )}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[13px] text-muted sm:inline">
            {rows.length} {rows.length === 1 ? "booking" : "bookings"}
          </span>
          <Button onClick={onNew} className="shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New booking</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="animate-fade-in rounded-xl border border-border bg-surface p-3 shadow-card">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FILTER_COLS.map((col) => (
              <label key={col.key} className="space-y-1">
                <span className="flex items-center gap-1 text-[12px] font-medium text-muted">
                  <FilterIcon className="h-3 w-3" /> {col.label}
                </span>
                <Select
                  value={filters[col.key] ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, [col.key]: e.target.value || undefined }))
                  }
                >
                  <option value="">All</option>
                  {(distinct[col.key] ?? []).map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-1.5">
          {search.trim() && (
            <Chip label={`Search: "${search.trim()}"`} onClear={() => setSearch("")} />
          )}
          {activeFilters.map(([key, val]) => (
            <Chip
              key={key}
              label={`${COLUMNS.find((c) => c.key === key)?.label}: ${val}`}
              onClear={() => setFilters((f) => ({ ...f, [key as ColumnKey]: undefined }))}
            />
          ))}
          <button
            onClick={clearAll}
            className="text-[12px] font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ---------- Desktop table ---------- */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface shadow-card sm:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/60">
                {COLUMNS.map((col) => {
                  const active = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      className={cn(
                        "whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-muted",
                        col.numeric && "text-right",
                        col.hideOnMobile && "hidden lg:table-cell"
                      )}
                    >
                      {col.sortable ? (
                        <button
                          onClick={() => toggleSort(col.key)}
                          className={cn(
                            "inline-flex items-center gap-1 transition-colors hover:text-ink",
                            col.numeric && "flex-row-reverse",
                            active && "text-primary"
                          )}
                        >
                          {col.label}
                          {active ? (
                            sort.dir === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.label
                      )}
                    </th>
                  );
                })}
                <th className="whitespace-nowrap px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-muted">
                  Received
                </th>
                <th className="w-24 px-3 py-2.5 text-right text-[12px] font-semibold uppercase tracking-wide text-muted">
                  {/* actions */}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + EXTRA_COLS}>
                    <EmptyState hasFilter={hasAnyFilter} onNew={onNew} onClear={clearAll} />
                  </td>
                </tr>
              ) : (
                rows.map((b) => {
                  const own = b.created_by === currentUserId;
                  const r = recvInfo(b, receivedByBooking);
                  return (
                    <tr
                      key={b.id}
                      className={cn(
                        "group border-b border-border/70 transition-colors last:border-0 hover:bg-bg/50",
                        flashId === b.id && "animate-row-flash"
                      )}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[13px] tabular-nums text-ink">
                        {formatDate(b.booking_date)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                            style={{ backgroundColor: avatarColor(b.booked_by_name) }}
                          >
                            {initials(b.booked_by_name)}
                          </span>
                          <span className="text-ink">
                            {b.booked_by_name}
                            {own && (
                              <span className="ml-1.5 rounded bg-primary-soft px-1 py-px text-[10px] font-medium text-primary">
                                you
                              </span>
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-ink">{b.party_name}</td>
                      <td className="px-3 py-2.5 text-ink">{b.item_name}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-ink">
                        {formatNumber(b.booking_rate)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-ink">
                        {formatNumber(b.quantity)}
                        <span className="ml-1 text-[11px] font-sans text-faint">{b.quantity_unit}</span>
                      </td>
                      <td className="hidden px-3 py-2.5 text-muted lg:table-cell">
                        {b.broker || <span className="text-faint">—</span>}
                      </td>
                      <td className="hidden max-w-[220px] truncate px-3 py-2.5 text-muted lg:table-cell" title={b.remarks ?? ""}>
                        {b.remarks || <span className="text-faint">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <ReceiveStatus r={r} unit={b.quantity_unit} />
                      </td>
                      <td className="px-3 py-2.5">
                        <RowActions
                          canModify={canModify(b)}
                          onReceive={() => onReceive(b)}
                          onEdit={() => onEdit(b)}
                          onDelete={() => onDelete(b)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Mobile cards ---------- */}
      <div className="space-y-2.5 sm:hidden">
        {loading ? (
          <CardSkeleton />
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface shadow-card">
            <EmptyState hasFilter={hasAnyFilter} onNew={onNew} onClear={clearAll} />
          </div>
        ) : (
          rows.map((b) => {
            const own = b.created_by === currentUserId;
            const r = recvInfo(b, receivedByBooking);
            return (
              <div
                key={b.id}
                className={cn(
                  "rounded-xl border border-border bg-surface p-3.5 shadow-card",
                  flashId === b.id && "animate-row-flash"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{b.party_name}</p>
                    <p className="truncate text-[13px] text-muted">{b.item_name}</p>
                  </div>
                  <RowActions
                    canModify={canModify(b)}
                    onReceive={() => onReceive(b)}
                    onEdit={() => onEdit(b)}
                    onDelete={() => onDelete(b)}
                    alwaysVisible
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
                  <Cell label="Rate" value={formatNumber(b.booking_rate)} mono />
                  <Cell
                    label="Quantity"
                    value={`${formatNumber(b.quantity)} ${b.quantity_unit}`}
                    mono
                  />
                  <Cell label="Date" value={formatDate(b.booking_date)} mono />
                  <Cell label="Broker" value={b.broker || "—"} />
                </div>

                {/* Received / pending */}
                <div className="mt-3 rounded-lg bg-bg px-3 py-2.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium text-ink">
                      <span className="font-mono tabular-nums">{formatNumber(r.received)}</span>
                      <span className="text-faint"> / {formatNumber(b.quantity)} {b.quantity_unit}</span>
                    </span>
                    <StatusPill label={r.label} />
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${r.pct}%` }} />
                  </div>
                  {r.pending > 0 && (
                    <p className="mt-1 text-[11px] text-muted">
                      {formatNumber(r.pending)} {b.quantity_unit} pending
                    </p>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2.5 w-full"
                  onClick={() => onReceive(b)}
                >
                  <PackageCheck className="h-4 w-4" /> Record delivery
                </Button>

                {b.remarks && (
                  <p className="mt-2 rounded-lg bg-bg px-2.5 py-1.5 text-[12px] text-muted">
                    {b.remarks}
                  </p>
                )}

                <div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5 text-[11px] text-faint">
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-semibold text-white"
                    style={{ backgroundColor: avatarColor(b.booked_by_name) }}
                  >
                    {initials(b.booked_by_name)}
                  </span>
                  <span>
                    {b.booked_by_name}
                    {own && <span className="ml-1 font-medium text-primary">(you)</span>}
                  </span>
                  <span className="ml-auto">{formatTimestamp(b.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------- small pieces ---------- */

function ReceiveStatus({ r, unit }: { r: Recv; unit: string }) {
  return (
    <div className="min-w-[120px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] tabular-nums text-ink">
          {formatNumber(r.received)}
          <span className="text-faint">/{formatNumber(r.received + r.pending)}</span>
        </span>
        <StatusPill label={r.label} />
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary" style={{ width: `${r.pct}%` }} />
      </div>
      {r.pending > 0 ? (
        <p className="mt-0.5 text-[10px] text-muted">{formatNumber(r.pending)} {unit} pending</p>
      ) : (
        <p className="mt-0.5 text-[10px] text-faint">complete</p>
      )}
    </div>
  );
}

function StatusPill({ label }: { label: "Received" | "Partial" | "Pending" }) {
  const styles =
    label === "Received"
      ? "bg-primary-soft text-primary"
      : label === "Partial"
      ? "bg-primary-soft text-primary"
      : "bg-bg text-muted";
  return (
    <span className={cn("rounded px-1.5 py-px text-[10px] font-semibold", styles)}>
      {label}
    </span>
  );
}

function RowActions({
  canModify,
  onReceive,
  onEdit,
  onDelete,
  alwaysVisible,
}: {
  canModify: boolean;
  onReceive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  alwaysVisible?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-1",
        !alwaysVisible && "sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100"
      )}
    >
      <button
        onClick={onReceive}
        className="rounded-md p-1.5 text-muted transition-colors hover:bg-primary-soft hover:text-primary"
        aria-label="Record delivery"
        title="Record delivery"
      >
        <PackageCheck className="h-4 w-4" />
      </button>
      {canModify && (
        <>
          <button
            onClick={onEdit}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-primary-soft hover:text-primary"
            aria-label="Edit booking"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
            aria-label="Delete booking"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

function Cell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-faint">{label}</p>
      <p className={cn("text-ink", mono && "font-mono tabular-nums")}>{value}</p>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface py-1 pl-2.5 pr-1 text-[12px] font-medium text-ink">
      {label}
      <button
        onClick={onClear}
        className="rounded-full p-0.5 text-faint hover:bg-bg hover:text-ink"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({
  hasFilter,
  onNew,
  onClear,
}: {
  hasFilter: boolean;
  onNew: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-bg text-muted">
        <Inbox className="h-6 w-6" />
      </span>
      {hasFilter ? (
        <>
          <p className="font-semibold text-ink">No bookings match your filters</p>
          <p className="mt-1 text-[13px] text-muted">Try a different search or clear the filters.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={onClear}>
            Clear filters
          </Button>
        </>
      ) : (
        <>
          <p className="font-semibold text-ink">No bookings yet</p>
          <p className="mt-1 text-[13px] text-muted">Add your first booking to get started.</p>
          <Button size="sm" className="mt-4" onClick={onNew}>
            <Plus className="h-4 w-4" /> New booking
          </Button>
        </>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-border/70">
          {Array.from({ length: COLUMNS.length + EXTRA_COLS }).map((__, j) => (
            <td key={j} className="px-3 py-3">
              <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-bg" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function CardSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-3.5 shadow-card">
          <div className="h-4 w-1/2 animate-pulse rounded bg-bg" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-bg" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((__, j) => (
              <div key={j} className="h-8 animate-pulse rounded bg-bg" />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
