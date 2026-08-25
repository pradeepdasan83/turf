'use client';

import React, { useMemo, useState } from 'react';
import { getGameState, orderGames } from '@/lib/game-status';

interface OrganizerDashboardProps {
  onOpenCreateGame: () => void;
  onSelectGame: (gameId: string) => void;
  games: any[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Best-effort month bucket from a freeform date string ("Aug 28", "2026-08-20", "Today").
function monthOf(dateStr: string): string {
  if (!dateStr) return 'Other';
  const s = String(dateStr);
  const named = MONTHS.find((m) => s.toLowerCase().includes(m.toLowerCase()));
  if (named) return named;
  const iso = s.match(/\d{4}-(\d{2})-\d{2}/);
  if (iso) return MONTHS[parseInt(iso[1], 10) - 1] || 'Other';
  if (/today|tomorrow|yesterday/i.test(s)) return MONTHS[new Date().getMonth()];
  return 'Other';
}

export default function OrganizerDashboard({
  onOpenCreateGame,
  onSelectGame,
  games = [],
}: OrganizerDashboardProps) {
  const totalGames = games.length;
  const totalPlayers = games.reduce((acc, g) => acc + (g.players?.length || 0), 0);
  // Sum of every unpaid player share across all games
  const pendingCollection = games.reduce((acc, g) => {
    const players = g.players || [];
    const perShare = Math.round((g.totalCost || 0) / Math.max(1, players.length));
    const unpaid = players.filter((p: any) => p.paymentStatus !== 'PAID');
    return acc + unpaid.reduce((s: number, p: any) => s + (p.shareAmount || perShare), 0);
  }, 0);

  // Month tabs derived from the games we actually have (ordered by calendar month)
  const monthTabs = useMemo(() => {
    const present = new Set(games.map((g) => monthOf(g.date)));
    const ordered = MONTHS.filter((m) => present.has(m));
    if (present.has('Other')) ordered.push('Other');
    return ['All', ...ordered];
  }, [games]);

  const [activeMonth, setActiveMonth] = useState('All');
  const [showAll, setShowAll] = useState(false);

  const visibleGames =
    activeMonth === 'All' ? games : games.filter((g) => monthOf(g.date) === activeMonth);

  // Upcoming (soonest first) on top, completed below, cancelled last
  const { upcoming, completed, cancelled } = useMemo(() => orderGames(visibleGames), [visibleGames]);

  // Collapsed view: up to 6 upcoming + 4 completed (cancelled hidden until "View All")
  const shownUpcoming = showAll ? upcoming : upcoming.slice(0, 6);
  const shownCompleted = showAll ? completed : completed.slice(0, 4);
  const orderedGames = [...shownUpcoming, ...shownCompleted, ...(showAll ? cancelled : [])];
  const hiddenCount =
    upcoming.length + completed.length + cancelled.length - shownUpcoming.length - shownCompleted.length;

  return (
    <div className="space-y-xl max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
      {/* Today's Management Summary (Bento Grid Style) */}
      <section aria-labelledby="today-summary">
        <h2
          className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-background mb-lg"
          id="today-summary"
        >
          Today's Management
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
          <div className="bg-surface-container-high rounded-xl p-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center gap-xs text-on-surface-variant mb-sm">
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              <span className="font-label-bold text-label-bold">Total Games</span>
            </div>
            <span className="font-display-lg text-display-lg text-primary">{totalGames}</span>
          </div>

          <div className="bg-surface-container-high rounded-xl p-md shadow-sm border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-center gap-xs text-on-surface-variant mb-sm">
              <span className="material-symbols-outlined text-sm">groups</span>
              <span className="font-label-bold text-label-bold">Total Players</span>
            </div>
            <span className="font-display-lg text-display-lg text-tertiary">{totalPlayers}</span>
          </div>

          <div className="bg-error-container rounded-xl p-md shadow-sm border border-outline-variant/30 flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex items-center gap-xs text-on-error-container mb-sm">
              <span className="material-symbols-outlined text-sm">pending_actions</span>
              <span className="font-label-bold text-label-bold">Pending Collection</span>
            </div>
            <span className="font-display-lg text-display-lg text-error">
              ₹{pendingCollection.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* Quick Action — single primary CTA */}
      <section aria-label="Quick Actions">
        <button
          onClick={onOpenCreateGame}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-tertiary text-on-primary py-lg px-md shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-between"
        >
          {/* Decorative glow */}
          <span className="pointer-events-none absolute -right-6 -top-8 w-32 h-32 rounded-full bg-white/15 blur-2xl"></span>
          <span className="pointer-events-none absolute right-8 bottom-0 material-symbols-outlined text-[96px] leading-none text-white/10 select-none">
            sports_soccer
          </span>

          <span className="flex items-center gap-md relative z-10">
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
              <span className="material-symbols-outlined text-2xl">add_circle</span>
            </span>
            <span className="flex flex-col items-start text-left">
              <span className="font-headline-md text-headline-md font-bold leading-tight">
                Book New Turf
              </span>
              <span className="font-label-sm text-label-sm opacity-90">
                Reserve a slot &amp; create your game
              </span>
            </span>
          </span>

          <span className="material-symbols-outlined relative z-10 opacity-90 group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </section>

      {/* Active Bookings */}
      <section aria-labelledby="active-bookings">
        <div className="flex items-center justify-between mb-md">
          <h2
            className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-background"
            id="active-bookings"
          >
            Active Bookings
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
            {visibleGames.length} game{visibleGames.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Month tabs — horizontal scroll so many months never overflow the page */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-margin-mobile px-margin-mobile pb-1 mb-md">
          {monthTabs.map((m) => {
            const isActive = m === activeMonth;
            return (
              <button
                key={m}
                onClick={() => {
                  setActiveMonth(m);
                  setShowAll(false);
                }}
                className={`shrink-0 px-4 py-1.5 rounded-full font-label-bold text-label-bold transition-all active:scale-95 ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Concise booking rows */}
        <div className="bg-surface rounded-2xl ambient-shadow border border-outline-variant/30 divide-y divide-outline-variant/30 overflow-hidden">
          {orderedGames.length === 0 ? (
            <div className="p-lg text-center text-on-surface-variant font-label-bold text-label-bold">
              No bookings in {activeMonth}.
            </div>
          ) : (
            orderedGames.map((g) => {
              const joinedCount = g.players?.length || 1;
              const paidCount = g.players?.filter((p: any) => p.paymentStatus === 'PAID').length || 0;
              const collectedAmount = paidCount * Math.round((g.totalCost || 0) / joinedCount);
              const progressPct = Math.min(100, Math.round((collectedAmount / (g.totalCost || 1)) * 100));
              const fullyPaid = progressPct >= 100;
              const state = getGameState(g);
              const completed = state === 'COMPLETED';
              const cancelled = state === 'CANCELLED';
              const sportIcon =
                g.sport === 'Tennis'
                  ? 'sports_tennis'
                  : g.sport === 'Basketball'
                  ? 'sports_basketball'
                  : g.sport === 'Cricket'
                  ? 'sports_cricket'
                  : 'sports_soccer';

              return (
                <button
                  key={g.id}
                  onClick={() => onSelectGame(g.id)}
                  className={`w-full text-left flex items-center gap-sm p-md transition-colors active:scale-[0.99] ${
                    completed ? 'bg-tertiary-container/25 hover:bg-tertiary-container/40' : 'hover:bg-surface-variant/20'
                  } ${cancelled ? 'opacity-70' : ''}`}
                >
                  {/* Sport icon */}
                  <div
                    className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                      completed ? 'bg-tertiary text-on-primary' : 'bg-primary-container text-on-primary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined icon-fill text-[22px]">{sportIcon}</span>
                  </div>

                  {/* Title + meta + slim progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-label-bold text-label-bold text-on-background font-bold truncate">
                        {g.title}
                      </h3>
                      {cancelled ? (
                        <span className="shrink-0 bg-surface-variant text-on-surface-variant font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full">
                          Cancelled
                        </span>
                      ) : completed ? (
                        <span className="shrink-0 bg-tertiary text-on-primary font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Completed
                        </span>
                      ) : (
                        <span
                          className={`shrink-0 font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full ${
                            fullyPaid
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          {fullyPaid ? 'Collected' : `₹${((g.totalCost || 0) - collectedAmount).toLocaleString()} due`}
                        </span>
                      )}
                    </div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">
                      {g.date} · {g.startTime} · {g.turf?.name || 'Green Arena'} · {joinedCount} players
                    </p>
                    <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${completed ? 'bg-tertiary' : 'bg-primary'}`}
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-on-surface-variant shrink-0">
                    chevron_right
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* View all / show less */}
        {(hiddenCount > 0 || showAll) && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="mt-md w-full flex items-center justify-center gap-1 bg-surface-container-high text-primary font-label-bold text-label-bold py-2.5 rounded-xl hover:bg-surface-variant transition-colors active:scale-[0.99]"
          >
            {showAll ? 'Show less' : `View all ${activeMonth === 'All' ? '' : activeMonth + ' '}events (${hiddenCount} more)`}
            <span className="material-symbols-outlined text-[18px]">
              {showAll ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        )}
      </section>
    </div>
  );
}
