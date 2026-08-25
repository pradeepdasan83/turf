'use client';

import React, { useMemo, useState } from 'react';
import { getGameState, orderGames } from '@/lib/game-status';

interface PlayerDashboardProps {
  onSelectGame: (gameId: string) => void;
  onNavigatePayments: () => void;
  onSendReminders: () => void;
  games: any[];
  balanceData?: {
    totalOwedToUser: number;
    totalUserOwes: number;
    netBalance: number;
  };
  transactions?: any[];
  currentUserId?: string;
  onOpenCreateGame?: () => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function sportIconFor(sport?: string) {
  return sport === 'Tennis'
    ? 'sports_tennis'
    : sport === 'Basketball'
    ? 'sports_basketball'
    : sport === 'Cricket'
    ? 'sports_cricket'
    : 'sports_soccer';
}

export default function PlayerDashboard({
  onSelectGame,
  onNavigatePayments,
  onSendReminders,
  games = [],
  balanceData = { totalOwedToUser: 0, totalUserOwes: 0, netBalance: 0 },
  transactions = [],
  currentUserId = '',
  onOpenCreateGame,
}: PlayerDashboardProps) {
  // Which balance cards to show (hide empty / negative ones per request)
  const showNet = balanceData.netBalance > 0;
  const showOwe = balanceData.totalUserOwes > 0;
  const showOwed = balanceData.totalOwedToUser > 0;
  const anyBalance = showNet || showOwe || showOwed;

  // Month filter for upcoming games (scales to a full month of events)
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
  const shownUpcoming = showAll ? upcoming : upcoming.slice(0, 6);
  const shownCompleted = showAll ? completed : completed.slice(0, 4);
  const orderedGames = [...shownUpcoming, ...shownCompleted, ...(showAll ? cancelled : [])];
  const hiddenCount =
    upcoming.length + completed.length + cancelled.length - shownUpcoming.length - shownCompleted.length;

  return (
    <div className="space-y-xl max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg">
      {/* Balance Summary Grid — only cards with a meaningful value are shown */}
      {anyBalance ? (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* Net Balance Card (only when positive) */}
          {showNet && (
            <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_12px_rgba(9,29,46,0.08)] flex flex-col justify-center relative overflow-hidden border border-outline-variant/20">
              <div className="absolute -right-4 -top-4 text-surface-container/50 transform rotate-12 pointer-events-none">
                <span className="material-symbols-outlined text-[100px]">account_balance_wallet</span>
              </div>
              <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Net Balance
              </h2>
              <div className="font-headline-lg-mobile text-headline-lg-mobile md:font-display-lg md:text-display-lg text-primary font-bold mt-xs">
                +₹{balanceData.netBalance.toLocaleString()}
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-primary-container inline-block"></span>
                You are in the green!
              </p>
            </div>
          )}

          {/* You Owe Card (only when > 0) */}
          {showOwe && (
            <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_12px_rgba(9,29,46,0.08)] border-l-4 border-error border border-t border-r border-b border-outline-variant/20">
              <div className="flex justify-between items-center mb-xs">
                <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  You Owe
                </h2>
                <span className="material-symbols-outlined text-error">arrow_upward</span>
              </div>
              <div className="font-headline-md text-headline-md text-error font-bold">
                ₹{balanceData.totalUserOwes.toLocaleString()}
              </div>
              <button
                onClick={onNavigatePayments}
                className="mt-sm w-full bg-error text-on-error font-label-bold text-label-bold py-sm rounded-full active:scale-95 transition-transform duration-150 shadow-sm hover:opacity-90"
              >
                Settle Up
              </button>
            </div>
          )}

          {/* Others Owe You Card (only when > 0) */}
          {showOwed && (
            <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_12px_rgba(9,29,46,0.08)] border-l-4 border-primary border border-t border-r border-b border-outline-variant/20">
              <div className="flex justify-between items-center mb-xs">
                <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Others Owe You
                </h2>
                <span className="material-symbols-outlined text-primary">arrow_downward</span>
              </div>
              <div className="font-headline-md text-headline-md text-primary font-bold">
                ₹{balanceData.totalOwedToUser.toLocaleString()}
              </div>
              <button
                onClick={onSendReminders}
                className="mt-sm w-full bg-surface-variant text-on-surface font-label-bold text-label-bold py-sm rounded-full hover:bg-tertiary-fixed active:scale-95 transition-transform duration-150 shadow-sm"
              >
                Send Reminders
              </button>
            </div>
          )}
        </section>
      ) : (
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-md flex items-center gap-sm shadow-[0px_4px_12px_rgba(9,29,46,0.08)]">
          <span className="material-symbols-outlined text-primary">check_circle</span>
          <div>
            <p className="font-label-bold text-label-bold text-on-background font-bold">All settled up</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">No pending balances right now.</p>
          </div>
        </section>
      )}

      {/* Upcoming Games — concise vertical list that scales to a month of events */}
      <section>
        <div className="flex justify-between items-center mb-md">
          <h2 className="font-headline-md text-headline-md font-bold text-on-background">
            Upcoming Games
          </h2>
          {onOpenCreateGame ? (
            <button
              onClick={onOpenCreateGame}
              className="flex items-center gap-1 bg-primary text-on-primary font-label-bold text-label-bold px-4 py-2 rounded-full shadow-sm hover:bg-primary-fixed-dim active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Book Turf
            </button>
          ) : (
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              {visibleGames.length} game{visibleGames.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {/* Month tabs (horizontal scroll so many months never overflow) */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-margin-mobile px-margin-mobile pb-1 mb-md">
          {monthTabs.map((m) => {
            const active = m === activeMonth;
            return (
              <button
                key={m}
                onClick={() => {
                  setActiveMonth(m);
                  setShowAll(false);
                }}
                className={`shrink-0 px-4 py-1.5 rounded-full font-label-bold text-label-bold transition-all active:scale-95 ${
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {orderedGames.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-xl text-center text-on-surface-variant font-label-bold text-label-bold">
            No games in {activeMonth}.
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_12px_rgba(9,29,46,0.08)] border border-outline-variant/20 divide-y divide-outline-variant/20 overflow-hidden">
            {orderedGames.map((g) => {
              const joinedCount = g.players?.length || 1;
              const maxPlayers = g.maxPlayers || 10;
              const perShare = Math.round((g.totalCost || 0) / joinedCount);
              const myRecord = (g.players || []).find((p: any) => p.userId === currentUserId);
              const joined = !!myRecord;
              const myPaid = myRecord?.paymentStatus === 'PAID';
              const spotsLeft = Math.max(0, maxPlayers - joinedCount);
              const state = getGameState(g);
              const completed = state === 'COMPLETED';
              const cancelled = state === 'CANCELLED';

              return (
                <button
                  key={g.id}
                  onClick={() => onSelectGame(g.id)}
                  className={`w-full text-left flex items-center gap-sm p-md transition-colors active:scale-[0.99] ${
                    completed ? 'bg-tertiary-container/25 hover:bg-tertiary-container/40' : 'hover:bg-surface-bright'
                  } ${cancelled ? 'opacity-70' : ''}`}
                >
                  {/* Date block */}
                  <div
                    className={`shrink-0 w-14 flex flex-col items-center justify-center rounded-xl py-2 ${
                      completed ? 'bg-tertiary/25' : 'bg-primary-container/40'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] icon-fill ${
                        completed ? 'text-tertiary' : 'text-primary'
                      }`}
                    >
                      {sportIconFor(g.sport)}
                    </span>
                    <span className="font-label-sm text-[10px] text-on-surface-variant font-bold mt-0.5 truncate max-w-full px-1">
                      {g.startTime}
                    </span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-label-bold text-label-bold text-on-background font-bold truncate">
                        {g.title || g.turf?.name}
                      </h3>
                      {cancelled ? (
                        <span className="shrink-0 font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full bg-surface-variant text-on-surface-variant">
                          Cancelled
                        </span>
                      ) : completed ? (
                        <span className="shrink-0 font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full bg-tertiary text-on-primary flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Completed
                        </span>
                      ) : joined ? (
                        <span
                          className={`shrink-0 font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full ${
                            myPaid
                              ? 'bg-primary-container text-on-primary-container'
                              : 'bg-error-container text-on-error-container'
                          }`}
                        >
                          {myPaid ? 'Paid' : `Owe ₹${perShare}`}
                        </span>
                      ) : (
                        <span className="shrink-0 font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container">
                          {spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
                        </span>
                      )}
                    </div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">
                      {g.date} · {g.turf?.name || 'Green Arena'} · {joinedCount}/{maxPlayers} players
                    </p>
                  </div>

                  <span className="material-symbols-outlined text-on-surface-variant shrink-0">
                    chevron_right
                  </span>
                </button>
              );
            })}
          </div>
        )}

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

      {/* Recent Transactions Section */}
      <section>
        <div className="flex justify-between items-end mb-md">
          <h2 className="font-headline-md text-headline-md font-bold text-on-background">
            Recent Transactions
          </h2>
        </div>

        {transactions.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-xl flex flex-col items-center text-center gap-2 shadow-[0px_4px_12px_rgba(9,29,46,0.08)]">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/60">receipt_long</span>
            <p className="font-label-bold text-label-bold text-on-surface-variant">No transactions yet</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant/80">
              Your payments and settlements will show up here.
            </p>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_12px_rgba(9,29,46,0.08)] divide-y divide-surface-variant overflow-hidden border border-outline-variant/20">
            {transactions.map((tx: any, i: number) => (
              <div
                key={tx.id || i}
                onClick={onNavigatePayments}
                className="p-md flex items-center justify-between hover:bg-surface-bright transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined">
                      {tx.isCredit ? 'call_received' : 'call_made'}
                    </span>
                  </div>
                  <div>
                    <p className="font-label-bold text-label-bold text-on-background">{tx.title}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{tx.subtitle}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-label-bold text-label-bold ${
                      tx.isCredit ? 'text-primary' : 'text-on-background'
                    }`}
                  >
                    {tx.amount}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
