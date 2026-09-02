'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import PlayerDashboard from '@/components/dashboard/PlayerDashboard';
import OrganizerDashboard from '@/components/dashboard/OrganizerDashboard';
import GameDetailsModal from '@/components/games/GameDetailsModal';
import CreateGameModal from '@/components/games/CreateGameModal';
import PaymentsView from '@/components/payments/PaymentsView';
import SettleModal from '@/components/payments/SettleModal';
import NotificationsModal from '@/components/notifications/NotificationsModal';
import LoginPage from '@/components/auth/LoginPage';
import ProfileView from '@/components/profile/ProfileView';
import GamesView from '@/components/games/GamesView';

function TurfSplitApp() {
  const { user, loading } = useAuth();

  const [currentRole, setCurrentRole] = useState<'PLAYER' | 'ORGANIZER'>('PLAYER');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'games' | 'payments' | 'profile'>('dashboard');

  const [games, setGames] = useState<any[]>([]);
  const [balanceData, setBalanceData] = useState<{
    totalOwedToUser: number;
    totalUserOwes: number;
    netBalance: number;
  }>({ totalOwedToUser: 0, totalUserOwes: 0, netBalance: 0 });

  const [toReceiveList, setToReceiveList] = useState<any[]>([]);
  const [toPayList, setToPayList] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [payingState, setPayingState] = useState<{
    amount: number;
    payeeName: string;
    payeeUpi?: string;
    ledgerId?: string;
    gameId?: string;
    fromUserId?: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync role when user changes
  useEffect(() => {
    if (user) {
      if (user.role === 'ORGANIZER') {
        setCurrentRole('ORGANIZER');
      } else {
        setCurrentRole('PLAYER');
      }
    }
  }, [user]);

  // Load data for current user
  const loadData = async () => {
    if (!user) return;
    try {
      const gRes = await fetch('/api/games');
      const gData = await gRes.json();
      if (gData.success) {
        setGames(gData.games || []);
      }

      const pRes = await fetch(`/api/payments?userId=${user.id}`);
      const pData = await pRes.json();
      if (pData.success) {
        setBalanceData(pData.balance);
        setToReceiveList(pData.toReceive || []);
        setToPayList(pData.toPay || []);
        setPaymentHistory(pData.history || []);
      }
    } catch (err) {
      console.error('Error loading TurfSplit data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Live updates: poll in the background so changes made by anyone (a new game,
  // someone joining, a settlement) appear on every device without a manual refresh.
  // Polling pauses when the tab is hidden and refetches instantly on focus.
  useEffect(() => {
    if (!user) return;
    const POLL_MS = 10000;
    const refresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadData();
      }
    };
    const timer = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // If loading session, show clean loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-primary font-headline-md font-bold">
          <span className="material-symbols-outlined animate-spin text-3xl">sync</span>
          Starting TurfSplit...
        </div>
      </div>
    );
  }

  // If not logged in, render LoginPage right here without redirecting!
  if (!user) {
    return <LoginPage onLoginSuccess={() => loadData()} />;
  }

  const selectedGame = games.find((g) => g.id === selectedGameId);
  const isOrganizerUser = user.role === 'ORGANIZER' || user.role === 'BOTH';

  // Game actions
  const handleJoinGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Joined game! Expense share updated.');
        loadData();
      } else {
        showToast(data.error || 'Failed to join game');
      }
    } catch (err) {
      console.error('Join error:', err);
    }
  };

  const handleLeaveGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Left game. Share recalculated.');
        loadData();
      }
    } catch (err) {
      console.error('Leave error:', err);
    }
  };

  // Organizer: add a registered player to a game
  const handleAddPlayer = async (gameId: string, targetUserId: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', userId: targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Player added to game.');
        loadData();
      } else {
        showToast(data.error || 'Could not add player');
      }
    } catch (err) {
      console.error('Add player error:', err);
    }
  };

  // Organizer: remove a player from a game
  const handleRemovePlayer = async (gameId: string, targetUserId: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', userId: targetUserId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Player removed from game.');
        loadData();
      } else {
        showToast(data.error || 'Could not remove player');
      }
    } catch (err) {
      console.error('Remove player error:', err);
    }
  };

  const handleRescheduleGame = async (gameId: string) => {
    if (!isOrganizerUser) {
      alert('Access Restricted: Only Admin / Organizer can reschedule games.');
      return;
    }

    const newDate = prompt('Enter new date (e.g. Aug 28):', 'Aug 28');
    if (!newDate) return;

    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reschedule', newDate }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Game rescheduled to ${newDate}`);
        loadData();
      }
    } catch (err) {
      console.error('Reschedule error:', err);
    }
  };

  const handleCompleteGame = async (gameId: string) => {
    if (!isOrganizerUser) {
      alert('Access Restricted: Only Admin / Organizer can complete games.');
      return;
    }

    if (!confirm('Mark this game as completed?')) return;

    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Game marked as completed.');
        loadData();
      }
    } catch (err) {
      console.error('Complete error:', err);
    }
  };

  const handleCancelGame = async (gameId: string) => {
    if (!isOrganizerUser) {
      alert('Access Restricted: Only Admin / Organizer can cancel games.');
      return;
    }

    if (!confirm('Are you sure you want to cancel this game?')) return;

    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Game cancelled successfully.');
        loadData();
      }
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  const handleSendReminder = async (targetUserId: string, amount: number, name: string) => {
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-reminder',
          targetUserId,
          amount,
        }),
      });
      showToast(`Reminder sent to ${name} for ₹${amount}!`);
    } catch (err) {
      console.error('Reminder error:', err);
    }
  };

  const handleStartSettle = (
    ledgerId: string,
    amount: number,
    payeeName: string,
    payeeUpi?: string,
  ) => {
    setPayingState({ ledgerId, amount, payeeName, payeeUpi });
  };

  const handlePaymentSuccess = () => {
    showToast(`Payment of ₹${payingState?.amount} settled!`);
    loadData();
  };

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 md:pb-8 pt-[calc(4rem+env(safe-area-inset-top))] relative">
      {/* Toast Notification Overlay */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl font-label-bold text-sm flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-primary-fixed">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <Header
        currentRole={currentRole}
        onToggleRole={(role) => {
          if (role === 'ORGANIZER' && !isOrganizerUser) {
            alert('Access Restricted: Only Admin / Organizer accounts can switch to Organizer View.');
            return;
          }
          setCurrentRole(role);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main Content Area based on Tab & Role */}
      <main>
        {activeTab === 'payments' ? (
          <PaymentsView
            balance={balanceData}
            toReceive={toReceiveList}
            toPay={toPayList}
            history={paymentHistory}
            onSettlePayment={handleStartSettle}
            onSendReminder={handleSendReminder}
          />
        ) : activeTab === 'profile' ? (
          <ProfileView onToast={showToast} />
        ) : activeTab === 'games' ? (
          <GamesView
            games={games}
            currentUserId={user.id}
            isOrganizerView={currentRole === 'ORGANIZER' && isOrganizerUser}
            onSelectGame={(id) => setSelectedGameId(id)}
            onJoinGame={handleJoinGame}
            onOpenCreateGame={() => setIsCreateGameOpen(true)}
          />
        ) : currentRole === 'ORGANIZER' && isOrganizerUser ? (
          <OrganizerDashboard
            onOpenCreateGame={() => setIsCreateGameOpen(true)}
            onSelectGame={(id) => setSelectedGameId(id)}
            games={games}
          />
        ) : (
          <PlayerDashboard
            onSelectGame={(id) => setSelectedGameId(id)}
            onNavigatePayments={() => setActiveTab('payments')}
            onSendReminders={() => handleSendReminder('usr-vijay', 200, 'Pending Players')}
            games={games}
            balanceData={balanceData}
            transactions={paymentHistory}
            currentUserId={user.id}
            onOpenCreateGame={() => setIsCreateGameOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          onClose={() => setSelectedGameId(null)}
          onPayShare={(amount, gameId) =>
            setPayingState({
              amount,
              payeeName: selectedGame.organizer?.name || 'Organizer',
              payeeUpi: selectedGame.organizer?.upiId,
              gameId,
              fromUserId: user.id,
            })
          }
          onJoinGame={handleJoinGame}
          onLeaveGame={handleLeaveGame}
          onRescheduleGame={isOrganizerUser ? handleRescheduleGame : undefined}
          onCancelGame={isOrganizerUser ? handleCancelGame : undefined}
          onCompleteGame={isOrganizerUser ? handleCompleteGame : undefined}
          currentUserId={user.id}
          isOrganizerView={currentRole === 'ORGANIZER' && isOrganizerUser}
          onAddPlayer={handleAddPlayer}
          onRemovePlayer={handleRemovePlayer}
        />
      )}

      {isCreateGameOpen && (
        <CreateGameModal
          organizerId={user.id}
          onClose={() => setIsCreateGameOpen(false)}
          onGameCreated={() => {
            showToast('Turf booked and game created!');
            loadData();
          }}
        />
      )}

      {payingState && (
        <SettleModal
          amount={payingState.amount}
          payeeName={payingState.payeeName}
          payeeUpi={payingState.payeeUpi}
          ledgerId={payingState.ledgerId}
          gameId={payingState.gameId}
          fromUserId={payingState.fromUserId}
          onClose={() => setPayingState(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {isNotificationsOpen && (
        <NotificationsModal onClose={() => setIsNotificationsOpen(false)} />
      )}

      {/* Bottom Nav for Mobile */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          // Selecting a nav destination always returns to the main view:
          // dismiss any open overlays so the chosen tab is what shows.
          setSelectedGameId(null);
          setIsCreateGameOpen(false);
          setIsNotificationsOpen(false);
          setPayingState(null);
          setActiveTab(tab);
        }}
      />
    </div>
  );
}

export default function Home() {
  return <TurfSplitApp />;
}
