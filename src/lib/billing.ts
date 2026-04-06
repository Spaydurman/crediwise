export interface BillingPeriod {
  statementDate: Date;
  billingDate: Date;
  /** Unique key for grouping (YYYY-MM-DD of statement close date) */
  periodKey: string;
}

/**
 * Given a transaction date, compute which billing period it belongs to.
 *
 * Rules:
 * - If txDay <= statementDay → closes this month on statementDay
 * - If txDay > statementDay  → closes next month on statementDay
 * - billingDate = billingDay of the month AFTER the statement closes
 *
 * Days are clamped to the last valid day of the target month (handles Feb, etc.).
 */
export function getBillingPeriod(
  txDate: Date,
  statementDay: number,
  billingDay: number
): BillingPeriod {
  const txDay = txDate.getDate();
  const txMonth = txDate.getMonth(); // 0-indexed
  const txYear = txDate.getFullYear();

  let stMonth = txMonth;
  let stYear = txYear;
  if (txDay > statementDay) {
    stMonth += 1;
    if (stMonth > 11) {
      stMonth = 0;
      stYear += 1;
    }
  }

  // Clamp statement day to last valid day of the statement month
  const lastSt = new Date(stYear, stMonth + 1, 0).getDate();
  const clampedSt = Math.min(statementDay, lastSt);
  const statementDate = new Date(stYear, stMonth, clampedSt);

  // Billing date: billingDay of the month after statement closes
  let biMonth = stMonth + 1;
  let biYear = stYear;
  if (biMonth > 11) {
    biMonth = 0;
    biYear += 1;
  }
  const lastBi = new Date(biYear, biMonth + 1, 0).getDate();
  const clampedBi = Math.min(billingDay, lastBi);
  const billingDate = new Date(biYear, biMonth, clampedBi);

  const periodKey = `${stYear}-${String(stMonth + 1).padStart(2, "0")}-${String(clampedSt).padStart(2, "0")}`;

  return { statementDate, billingDate, periodKey };
}
