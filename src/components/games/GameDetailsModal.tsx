'use client';

import React, { useState, useEffect } from 'react';
import { getGameState } from '@/lib/game-status';

interface GameDetailsModalProps {
  game: any;
  onClose: () => void;
  onPayShare: (amount: number, gameId: string) => void;
  onJoinGame: (gameId: string) => void;
  onLeaveGame: (gameId: string) => void;
  onRescheduleGame?: (gameId: string) => void;
  onCancelGame?: (gameId: string) => void;
  onCompleteGame?: (gameId: string) => void;
  currentUserId?: string;
  isOrganizerView?: boolean;
  onAddPlayer?: (gameId: string, userId: string) => void;
  onRemovePlayer?: (gameId: string, userId: string) => void;
}

interface RosterUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
}

export default function GameDetailsModal({
  game,
  onClose,
  onPayShare,
  onJoinGame,
  onLeaveGame,
  onRescheduleGame,
  onCancelGame,
  onCompleteGame,
  currentUserId = 'usr-rahul',
  isOrganizerView = false,
  onAddPlayer,
  onRemovePlayer,
}: GameDetailsModalProps) {
  const [roster, setRoster] = useState<RosterUser[]>([]);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Load the registered-user roster so the organizer can add players
  useEffect(() => {
    if (!isOrganizerView) return;
    let active = true;
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => {
        if (active && d.success) setRoster(d.users || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOrganizerView]);

  if (!game) return null;

  const players = game.players || [];
  const joinedCount = players.length;
  const maxPlayers = game.maxPlayers || 10;
  const totalCost = game.totalCost || 2000;
  const perShare = Math.round(totalCost / Math.max(1, joinedCount));
  const spotsLeft = Math.max(0, maxPlayers - joinedCount);
  const progressPct = Math.min(100, Math.round((joinedCount / maxPlayers) * 100));

  const isJoined = players.some((p: any) => p.userId === currentUserId);
  const userPlayerRecord = players.find((p: any) => p.userId === currentUserId);
  const isPaid = userPlayerRecord?.paymentStatus === 'PAID';

  const sportIcon =
    game.sport === 'Tennis'
      ? 'sports_tennis'
      : game.sport === 'Basketball'
      ? 'sports_basketball'
      : game.sport === 'Cricket'
      ? 'sports_cricket'
      : 'sports_soccer';

  const collectedFromPlayers = players.filter((p: any) => p.paymentStatus === 'PAID').length;
  const collectionPct = Math.min(100, Math.round((collectedFromPlayers / Math.max(1, joinedCount)) * 100));
  const gameState = getGameState(game);
  const isCancelled = gameState === 'CANCELLED';
  const isCompleted = gameState === 'COMPLETED';
  const isOver = isCancelled || isCompleted; // no join/leave/roster changes once over

  // Hero gradient reflects state: green→teal upcoming, grey completed, muted cancelled
  const heroGradient = isCancelled
    ? 'from-surface-variant to-surface-container-high text-on-surface'
    : isCompleted
    ? 'from-tertiary to-secondary-container text-on-primary'
    : 'from-primary to-tertiary text-on-primary';

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col">
      {/* Top App Bar */}
      <header className="shrink-0 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 z-40">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Back"
              className="text-on-surface hover:bg-surface-variant/50 active:scale-95 transition-transform duration-150 w-10 h-10 rounded-full flex items-center justify-center"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-background font-bold tracking-tight">
              Game Details
            </h1>
          </div>
          {isCancelled && (
            <span className="bg-error-container text-on-error-container font-label-bold text-label-sm px-3 py-1 rounded-full">
              Cancelled
            </span>
          )}
          {isCompleted && (
            <span className="bg-tertiary-container text-on-tertiary-container font-label-bold text-label-sm px-3 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              Completed
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-md">
        {/* Hero */}
        <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${heroGradient} p-lg shadow-lg`}>
          <span className="pointer-events-none absolute -right-8 -top-10 material-symbols-outlined text-[160px] leading-none text-white/10 select-none">
            {sportIcon}
          </span>
          <div className="relative z-10 flex flex-col gap-sm">
            <span className="inline-flex w-fit items-center gap-1 bg-white/20 backdrop-blur-sm font-label-bold text-label-sm px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px]">{sportIcon}</span>
              {game.sport || 'Football'}
            </span>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-extrabold leading-tight">
              {game.title || game.turf?.name || 'Evening Match'}
            </h2>
            <div className="flex flex-col gap-1 opacity-95">
              <p className="font-body-md text-body-md flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                {game.turf?.name ? `${game.turf.name} · ` : ''}
                {game.turf?.location || '123 Sports Ave, Downtown'}
              </p>
              <p className="font-body-md text-body-md flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                {game.date} • {game.startTime} - {game.endTime}
              </p>
            </div>
          </div>
        </section>

        {/* Stat chips */}
        <section className="grid grid-cols-3 gap-sm">
          <div className="bg-surface rounded-xl p-md ambient-shadow flex flex-col items-center text-center gap-1">
            <span className="material-symbols-outlined text-primary">groups</span>
            <span className="font-headline-md text-headline-md font-bold text-on-background">
              {joinedCount}/{maxPlayers}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Players</span>
          </div>
          <div className="bg-surface rounded-xl p-md ambient-shadow flex flex-col items-center text-center gap-1">
            <span className="material-symbols-outlined text-tertiary">payments</span>
            <span className="font-headline-md text-headline-md font-bold text-on-background">₹{perShare}</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Per Share</span>
          </div>
          <div className="bg-surface rounded-xl p-md ambient-shadow flex flex-col items-center text-center gap-1">
            <span className="material-symbols-outlined text-secondary-container">account_balance_wallet</span>
            <span className="font-headline-md text-headline-md font-bold text-on-background">
              ₹{totalCost.toLocaleString()}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Total</span>
          </div>
        </section>

        {/* Collection progress */}
        <section className="bg-surface rounded-xl p-md ambient-shadow flex flex-col gap-sm">
          <div className="flex justify-between items-center">
            <span className="font-label-bold text-label-bold text-on-surface-variant">Collection</span>
            <span className="font-label-bold text-label-bold text-on-background">
              {collectedFromPlayers}/{joinedCount} paid
            </span>
          </div>
          <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all"
              style={{ width: `${collectionPct}%` }}
            ></div>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant text-right">
            {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Game Full'}
          </p>
        </section>

        {/* Action Controls for Organizer/Player */}
        {isCompleted ? (
          <section className="bg-tertiary-container/50 text-on-tertiary-container rounded-xl p-md flex items-center gap-2 font-label-bold text-label-bold">
            <span className="material-symbols-outlined">event_available</span>
            This game is over. Settle any pending dues below.
          </section>
        ) : (
          !isCancelled && (
            <section className="flex flex-wrap gap-sm">
              {!isJoined && spotsLeft > 0 && (
                <button
                  onClick={() => onJoinGame(game.id)}
                  className="flex-1 bg-primary text-on-primary font-label-bold py-2.5 rounded-xl shadow-sm hover:bg-primary-fixed-dim transition-all active:scale-95"
                >
                  Join Game
                </button>
              )}

              {isJoined && !isOrganizerView && (
                <button
                  onClick={() => onLeaveGame(game.id)}
                  className="px-4 py-2.5 bg-surface-variant text-on-surface-variant font-label-bold rounded-xl hover:bg-error-container hover:text-error transition-all"
                >
                  Leave Game
                </button>
              )}

              {onCompleteGame && (
                <button
                  onClick={() => onCompleteGame(game.id)}
                  className="flex-1 min-w-[120px] px-4 py-2.5 bg-tertiary text-on-primary font-label-bold rounded-xl hover:brightness-95 transition-all flex items-center justify-center gap-1 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Complete
                </button>
              )}

              {onRescheduleGame && (
                <button
                  onClick={() => onRescheduleGame(game.id)}
                  className="flex-1 min-w-[120px] px-4 py-2.5 border border-outline font-label-bold rounded-xl text-on-surface hover:bg-surface-variant transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                  Reschedule
                </button>
              )}

              {onCancelGame && (
                <button
                  onClick={() => onCancelGame(game.id)}
                  className="px-4 py-2.5 bg-error-container text-on-error-container font-label-bold rounded-xl hover:brightness-95 transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  Cancel
                </button>
              )}
            </section>
          )
        )}

        {/* Players List */}
        <section className="flex flex-col gap-md">
          <div className="flex justify-between items-center px-xs">
            <h3 className="font-headline-md text-headline-md text-on-background font-bold">
              Players ({joinedCount})
            </h3>
            {isOrganizerView && !isOver && (
              <button
                onClick={() => setShowAddPanel((v) => !v)}
                className="flex items-center gap-1 bg-primary-container text-on-primary-container font-label-bold text-label-bold px-3 py-1.5 rounded-full hover:brightness-95 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showAddPanel ? 'close' : 'person_add'}
                </span>
                {showAddPanel ? 'Done' : 'Add Player'}
              </button>
            )}
          </div>

          {/* Organizer: add registered players not yet in this game */}
          {isOrganizerView && !isOver && showAddPanel && (
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-md flex flex-col gap-xs">
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Registered players
              </p>
              {roster.filter((u) => !players.some((p: any) => p.userId === u.id)).length === 0 ? (
                <p className="text-label-sm text-on-surface-variant text-center py-2">
                  Everyone registered is already in this game 🎉
                </p>
              ) : (
                roster
                  .filter((u) => !players.some((p: any) => p.userId === u.id))
                  .map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between bg-surface rounded-lg px-3 py-2 border border-outline-variant/30"
                    >
                      <div className="flex items-center gap-sm min-w-0">
                        {u.avatarUrl ? (
                          <img className="w-9 h-9 rounded-full object-cover" alt={u.name} src={u.avatarUrl} />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-label-bold text-xs">
                            {u.name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-bold text-label-bold text-on-background truncate">
                            {u.name}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                            {u.email || u.role || 'Player'}
                          </span>
                        </div>
                      </div>
                      <button
                        disabled={spotsLeft <= 0}
                        onClick={() => onAddPlayer?.(game.id, u.id)}
                        className="flex items-center gap-1 bg-primary text-on-primary font-label-bold text-label-bold px-3 py-1.5 rounded-full hover:bg-primary-fixed-dim transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}

          <div className="bg-surface rounded-xl ambient-shadow divide-y divide-outline-variant/30 overflow-hidden">
            {players.map((p: any) => {
              const isPlayerPaid = p.paymentStatus === 'PAID';
              const userObj = p.user || {};

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-md hover:bg-surface-variant/20 transition-colors"
                >
                  <div className="flex items-center gap-sm">
                    {userObj.avatarUrl ? (
                      <img
                        className="w-11 h-11 rounded-full object-cover border-2 border-surface"
                        alt={userObj.name}
                        src={userObj.avatarUrl}
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-label-bold border-2 border-surface">
                        {userObj.name ? userObj.name.substring(0, 2).toUpperCase() : 'PL'}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-label-bold text-label-bold text-on-background font-semibold">
                        {userObj.name || 'Player'}
                      </span>
                      <span
                        className={`font-label-sm text-label-sm ${
                          isPlayerPaid ? 'text-on-surface-variant' : 'text-secondary-container font-semibold'
                        }`}
                      >
                        {p.roleInGame === 'ORGANIZER'
                          ? 'Organizer'
                          : isPlayerPaid
                          ? 'Player'
                          : `Owed: ₹${p.shareAmount || perShare}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isPlayerPaid ? 'bg-primary-container' : 'bg-secondary-container'
                        }`}
                      ></div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">
                        {isPlayerPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>

                    {/* Organizer can remove players (not the organizer themselves) */}
                    {isOrganizerView && !isOver && p.roleInGame !== 'ORGANIZER' && (
                      <button
                        onClick={() => onRemovePlayer?.(game.id, p.userId)}
                        aria-label={`Remove ${userObj.name || 'player'}`}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-error-container hover:text-error transition-colors active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[20px]">person_remove</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Bottom Action Area (extra bottom padding on mobile clears the floating nav) */}
      <div className="shrink-0 w-full bg-surface border-t border-outline-variant/30 p-md pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-center z-50 ambient-shadow-lg">
        {isCancelled ? (
          <div className="w-full max-w-sm bg-surface-variant text-on-surface-variant font-label-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 font-bold">
            <span className="material-symbols-outlined text-[20px]">event_busy</span>
            Game Cancelled
          </div>
        ) : isPaid ? (
          <div className="w-full max-w-sm bg-primary-container text-on-primary-container font-label-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm font-bold">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            Paid ₹{userPlayerRecord?.shareAmount || perShare}
          </div>
        ) : (
          <button
            onClick={() => onPayShare(perShare, game.id)}
            className="w-full max-w-sm bg-secondary-container hover:bg-secondary text-on-secondary font-label-bold text-label-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-sm font-bold"
          >
            <span className="material-symbols-outlined text-[20px]">payments</span>
            Pay ₹{perShare}
          </button>
        )}
      </div>
    </div>
  );
}
