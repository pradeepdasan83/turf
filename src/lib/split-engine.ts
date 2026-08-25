/**
 * TurfSplit Expense Engine
 * Handles exact cost division and rounding remainder distribution.
 */

export interface SplitResult {
  baseShare: number;
  shares: number[]; // Array of length playerCount summing exactly to totalCost
}

export function calculateCostSplit(totalCost: number, playerCount: number): SplitResult {
  if (playerCount <= 0) return { baseShare: 0, shares: [] };

  // Calculate base share rounded to 2 decimal places or nearest integer for INR
  const rawShare = totalCost / playerCount;
  const baseShare = Math.floor(rawShare * 100) / 100;
  
  const shares: number[] = new Array(playerCount).fill(baseShare);
  
  // Calculate total allocated so far
  let allocatedTotal = baseShare * playerCount;
  let remainder = Math.round((totalCost - allocatedTotal) * 100) / 100;

  // Distribute remaining cents / paisa among the first N players
  let idx = 0;
  while (remainder > 0.001) {
    shares[idx] = Math.round((shares[idx] + 0.01) * 100) / 100;
    remainder = Math.round((remainder - 0.01) * 100) / 100;
    idx = (idx + 1) % playerCount;
  }

  return {
    baseShare,
    shares,
  };
}

export function formatCurrency(amount: number, currency: string = '₹'): string {
  const rounded = Math.round(amount * 100) / 100;
  const isWhole = Number.isInteger(rounded);
  const formatted = isWhole ? rounded.toLocaleString() : rounded.toFixed(2);
  return `${currency}${formatted}`;
}
