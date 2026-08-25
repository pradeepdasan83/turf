'use client';

import React, { useMemo, useState } from 'react';
import { getGameState } from '@/lib/game-status';

interface GamesViewProps {
  games: any[];
  currentUserId: string;
  isOrganizerView?: boolean;
  onSelectGame: (gameId: string) => void;
  onJoinGame: (gameId: string) => void;
  onOpenCreateGame?: () => void;
}

type Filter = 'ALL' | 'JOINED' | 'AVAILABLE' | 'COMPLETED' | 'CANCELLED';

function sportIconFor(sport?: string) {
  return sport === 'Tennis'
    ? 'sports_tennis'
    : sport === 'Basketball'
    ? 'sports_basketball'
    : sport === 'Cricket'
    ? 'sports_cricket'
    : 'sports_soccer';
}

export default function GamesView({
  games = [],
  currentUserId,
  isOrganizerView = false,
  onSelectGame,
  onJoinGame,
  onOpenCreateGame,
}: GamesViewProps) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  const isJoined = (g: any) => (g.players || []).some((p: any) => p.userId === currentUserId);
  const isCancelled = (g: any) => getGameState(g) === 'CANCELLED';
  const isCompleted = (g: any) => getGameState(g) === 'COMPLETED';
  const isUpcoming = (g: any) => getGameState(g) === 'UPCOMING';
  const spotsLeft = (g: any) => Math.max(0, (g.maxPlayers || 10) - (g.players?.length || 0));

  const counts = useMemo(
    () => ({
      ALL: games.length,
      JOINED: games.filter(isJoined).length,
      AVAILABLE: games.filter((g) => !isJoined(g) && isUpcoming(g) && spotsLeft(g) > 0).length,
      COMPLETED: games.filter(isCompleted).length,
      CANCELLED: games.filter(isCancelled).length,
    }),
    [games, currentUserId]
  );

  const filtered = useMemo(() => {
    let list = games;
    if (filter === 'JOINED') list = list.filter(isJoined);
    else if (filter === 'AVAILABLE')
      list = list.filter((g) => !isJoined(g) && isUpcoming(g) && spotsLeft(g) > 0);
    else if (filter === 'COMPLETED') list = list.filter(isCompleted);
    else if (filter === 'CANCELLED') list = list.filter(isCancelled);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((g) =>
        `${g.title || ''} ${g.turf?.name || ''} ${g.sport || ''} ${g.date || ''}`
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [games, filter, query, currentUserId]);

  const tabs: { id: Filter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'JOINED', label: 'Joined' },
    { id: 'AVAILABLE', label: 'Available' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-md max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-background font-bold">
          {isOrganizerView ? 'All Games' : 'My Games'}
        </h1>
        {onOpenCreateGame && (
          <button
            onClick={onOpenCreateGame}
            className="flex items-center gap-1 bg-primary text-on-primary font-label-bold text-label-bold px-4 py-2 rounded-full shadow-sm hover:bg-primary-fixed-dim active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Book Turf
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
          search
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search games, turf, sport…"
          className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-10 pr-3 py-3 text-sm text-on-surface focus:outline-primary"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-margin-mobile px-margin-mobile pb-1">
        {tabs.map((t) => {
          const active = filter === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full font-label-bold text-label-bold transition-all active:scale-95 ${
                active
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
              }`}
            >
              {t.label}
              <span
                className={`text-[11px] px-1.5 rounded-full ${
                  active ? 'bg-white/25' : 'bg-surface-variant text-on-surface-variant'
                }`}
              >
                {counts[t.id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Game cards */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-outline-variant/30 ambient-shadow p-xl flex flex-col items-center text-center gap-2">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/60">sports_soccer</span>
          <p className="font-label-bold text-label-bold text-on-surface-variant">
            {query ? 'No games match your search.' : 'No games here yet.'}
          </p>
          {onOpenCreateGame && !query && (
            <button
              onClick={onOpenCreateGame}
              className="mt-2 bg-primary text-on-primary font-label-bold text-label-bold px-5 py-2 rounded-full shadow-sm"
            >
              Book a Turf
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          {filtered.map((g) => {
            const joined = isJoined(g);
            const cancelled = isCancelled(g);
            const completed = isCompleted(g);
            const joinedCount = g.players?.length || 0;
            const maxPlayers = g.maxPlayers || 10;
            const perShare = Math.round((g.totalCost || 0) / Math.max(1, joinedCount || 1));
            const progressPct = Math.min(100, Math.round((joinedCount / maxPlayers) * 100));
            const left = spotsLeft(g);
            const myRecord = (g.players || []).find((p: any) => p.userId === currentUserId);
            const myPaid = myRecord?.paymentStatus === 'PAID';

            return (
              <div
                key={g.id}
                className={`rounded-2xl border ambient-shadow overflow-hidden flex flex-col transition-all ${
                  cancelled
                    ? 'bg-surface border-outline-variant/30 opacity-70'
                    : completed
                    ? 'bg-tertiary-container/25 border-tertiary/40'
                    : 'bg-surface border-outline-variant/30 hover:border-primary/50'
                }`}
              >
                <button
                  onClick={() => onSelectGame(g.id)}
                  className="text-left p-md flex flex-col gap-sm active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-sm min-w-0">
                      <div
                        className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                          completed
                            ? 'bg-tertiary text-on-primary'
                            : 'bg-primary-container text-on-primary-container'
                        }`}
                      >
                        <span className="material-symbols-outlined icon-fill text-[22px]">
                          {sportIconFor(g.sport)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-label-bold text-label-bold text-on-background font-bold truncate">
                          {g.title}
                        </h3>
                        <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                          {g.turf?.name || 'Green Arena'}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    {cancelled ? (
                      <span className="shrink-0 bg-surface-variant text-on-surface-variant font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                        Cancelled
                      </span>
                    ) : completed ? (
                      <span className="shrink-0 bg-tertiary text-on-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Completed
                      </span>
                    ) : joined ? (
                      <span
                        className={`shrink-0 font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${
                          myPaid
                            ? 'bg-primary-container text-on-primary-container'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        {myPaid ? 'Paid' : `Owe ₹${perShare}`}
                      </span>
                    ) : (
                      <span className="shrink-0 bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">
                        {left > 0 ? `${left} left` : 'Full'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-label-sm text-label-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                      {g.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      {g.startTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">group</span>
                      {joinedCount}/{maxPlayers}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${completed ? 'bg-tertiary' : 'bg-primary'}`}
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </button>

                {/* Footer action */}
                {!cancelled && (
                  <div className="px-md pb-md">
                    {joined || completed ? (
                      <button
                        onClick={() => onSelectGame(g.id)}
                        className="w-full bg-surface-container-high text-on-surface font-label-bold text-label-bold py-2 rounded-lg hover:bg-surface-variant transition-colors"
                      >
                        View Details
                      </button>
                    ) : left > 0 ? (
                      <button
                        onClick={() => onJoinGame(g.id)}
                        className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-2 rounded-lg hover:bg-primary-fixed-dim active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        Join Game
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-surface-variant text-on-surface-variant font-label-bold text-label-bold py-2 rounded-lg opacity-70 cursor-not-allowed"
                      >
                        Game Full
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
