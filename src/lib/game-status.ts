// Shared helpers for deriving a game's lifecycle state across the UI.

export type GameState = 'CANCELLED' | 'COMPLETED' | 'UPCOMING';

// Parse a freeform game date string into a Date (only when it carries a year,
// so relative labels like "Today"/"Tomorrow" are intentionally not "past").
export function parseGameDate(s?: string): Date | null {
  if (!s) return null;
  if (!/\d{4}/.test(s)) return null; // needs an explicit year (e.g. "23 Aug 2026", "2026-08-20")
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// A game counts as "over" if the organizer completed it, or its date is before today.
export function isGameOver(game: any): boolean {
  if (!game) return false;
  if (game.status === 'CANCELLED') return false;
  if (game.status === 'COMPLETED') return true;
  const d = parseGameDate(game.date);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export function getGameState(game: any): GameState {
  if (game?.status === 'CANCELLED') return 'CANCELLED';
  if (isGameOver(game)) return 'COMPLETED';
  return 'UPCOMING';
}

// Numeric sort key from a game's date (relative labels like "Today" → now).
export function gameSortValue(game: any): number {
  const d = parseGameDate(game?.date);
  return d ? d.getTime() : Date.now();
}

// Order games so upcoming (soonest first) sit on top, then completed
// (most recent first), then cancelled at the very bottom.
export function orderGames<T = any>(games: T[]): { upcoming: T[]; completed: T[]; cancelled: T[] } {
  const upcoming = games
    .filter((g) => getGameState(g) === 'UPCOMING')
    .sort((a, b) => gameSortValue(a) - gameSortValue(b));
  const completed = games
    .filter((g) => getGameState(g) === 'COMPLETED')
    .sort((a, b) => gameSortValue(b) - gameSortValue(a));
  const cancelled = games.filter((g) => getGameState(g) === 'CANCELLED');
  return { upcoming, completed, cancelled };
}
