import type { CardColor } from "../types";

export const CARD_COLORS: { label: string; value: CardColor; className: string }[] = [
  { label: "Indigo", value: "indigo", className: "bg-indigo-600" },
  { label: "Violet", value: "violet", className: "bg-violet-600" },
  { label: "Sky", value: "sky", className: "bg-sky-600" },
  { label: "Emerald", value: "emerald", className: "bg-emerald-600" },
  { label: "Rose", value: "rose", className: "bg-rose-600" },
  { label: "Amber", value: "amber", className: "bg-amber-600" },
  { label: "Slate", value: "slate", className: "bg-slate-600" },
  { label: "Fuchsia", value: "fuchsia", className: "bg-fuchsia-600" },
];

export const CARD_COLOR_BORDER_MAP: Record<CardColor, string> = {
  indigo: "border-indigo-600",
  violet: "border-violet-600",
  sky: "border-sky-600",
  emerald: "border-emerald-600",
  rose: "border-rose-600",
  amber: "border-amber-600",
  slate: "border-slate-600",
  fuchsia: "border-fuchsia-600",
};

export const CARD_COLOR_BG_MAP: Record<CardColor, string> = {
  indigo: "bg-indigo-600",
  violet: "bg-violet-600",
  sky: "bg-sky-600",
  emerald: "bg-emerald-600",
  rose: "bg-rose-600",
  amber: "bg-amber-600",
  slate: "bg-slate-600",
  fuchsia: "bg-fuchsia-600",
};

export const TRANSACTION_CATEGORIES = [
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Health & Medical",
  "Travel",
  "Bills & Utilities",
  "Education",
  "Online Services",
  "Others",
] as const;

export const CURRENCY = "₱";

export const DATE_FORMAT = "MMM dd, yyyy";
