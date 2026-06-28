import type { QuantityUnit } from "@/lib/types";

export const APP_NAME = "Booking Ledger";

export const QUANTITY_UNITS: QuantityUnit[] = ["Bags", "KG"];

/** Sortable / displayable columns for the dashboard table. */
export type ColumnKey =
  | "booking_date"
  | "booked_by_name"
  | "party_name"
  | "item_name"
  | "booking_rate"
  | "quantity"
  | "broker"
  | "remarks";

export interface ColumnDef {
  key: ColumnKey;
  label: string;
  sortable: boolean;
  /** numeric columns get tabular/mono formatting + right alignment */
  numeric?: boolean;
  /** is this column eligible for the per-column filter dropdown? */
  filterable?: boolean;
  /** hide on very small screens to keep the table readable */
  hideOnMobile?: boolean;
}

export const COLUMNS: ColumnDef[] = [
  { key: "booking_date", label: "Date", sortable: true },
  { key: "booked_by_name", label: "Booked By", sortable: true, filterable: true },
  { key: "party_name", label: "Party Name", sortable: true, filterable: true },
  { key: "item_name", label: "Item Name", sortable: true, filterable: true },
  { key: "booking_rate", label: "Rate", sortable: true, numeric: true },
  { key: "quantity", label: "Quantity", sortable: true, numeric: true },
  { key: "broker", label: "Broker", sortable: true, filterable: true, hideOnMobile: true },
  { key: "remarks", label: "Remarks", sortable: false, hideOnMobile: true },
];
