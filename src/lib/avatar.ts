// Initial-letter avatar helpers: a colored circle with the user's first letter.

const COLORS = [
  '#2e7d32', // green
  '#00695c', // teal
  '#1565c0', // blue
  '#6a1b9a', // purple
  '#ad1457', // pink
  '#e65100', // orange
  '#4527a0', // indigo
  '#00838f', // cyan
  '#c62828', // red
  '#558b2f', // lime
];

export function firstLetter(name?: string): string {
  const c = (name || '').trim()[0];
  return c ? c.toUpperCase() : 'U';
}

// Deterministic background color from a seed (name/id) so it stays stable per user.
export function avatarColor(seed?: string): string {
  const s = seed || '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}
