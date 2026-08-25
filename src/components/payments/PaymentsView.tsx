'use client';

import React from 'react';

interface PaymentsViewProps {
  balance?: {
    totalOwedToUser: number;
    totalUserOwes: number;
    netBalance: number;
  };
  toReceive?: any[];
  toPay?: any[];
  history?: any[];
  onSettlePayment: (ledgerId: string, amount: number, payeeName: string) => void;
  onSendReminder: (targetUserId: string, amount: number, payeeName: string) => void;
}

export default function PaymentsView({
  balance = { totalOwedToUser: 1250, totalUserOwes: 450, netBalance: 800 },
  toReceive = [],
  toPay = [],
  history = [],
  onSettlePayment,
  onSendReminder,
}: PaymentsViewProps) {
  const defaultToReceive = toReceive.length > 0 ? toReceive : [
    {
      id: 'led-1',
      fromUser: { id: 'usr-vijay', name: 'Vijay', avatarUrl: null },
      amount: 200,
      description: 'Saturday Football',
    },
    {
      id: 'led-2',
      fromUser: {
        id: 'usr-amit',
        name: 'Amit',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDQKQ_am1UKWKgh-65jdDkzAYDttb3BCdMafEQsDbwVmdOCjlgCU3jzvAkd3KEf8dBYHKBd74IEXo8X1juVHJyaFJN8w22yDOR-lmTH4zJkkvEVDQOy9KL6v96Cyh9nrMyH67-xOTkAF387mf2OlUzf5y_wnVoIDV6nPxaWfufRefTysYqwSWJhZmN8AdMVcm6vCfSFYf43acJsymC-nEGp4m3qCiGekXDo17hG--udKn_Z_hOl-VU',
      },
      amount: 1050,
      description: 'Tournament Fee',
    },
  ];

  const defaultToPay = toPay.length > 0 ? toPay : [
    {
      id: 'led-3',
      toUser: { id: 'usr-rahul', name: 'Rahul', avatarUrl: null },
      amount: 100,
      description: 'Water Bottles',
    },
    {
      id: 'led-4',
      toUser: {
        id: 'usr-neha',
        name: 'Neha',
        avatarUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDV_mEN7ZKjSlYSR6-827vgIAD8aIm7iQMcGdr7oSSS5Yc4cZVZYqTsxin0Pnyzt3rv2M8jLhtT1iFi-Dpu5fKQatstXUwfDLeKpWocYr5Jlx1Di0muJ-ND_gLwxDmbLn_bTEMKs4vh8cc195tKmqTrQTCQ3uETmYkhG_7sNGPaV7xn0bunJDHIy1pYzlED3C-cPJc5h3mPkQNqOVIRqgxlzvG2kqz6D0Db9C82fJ3WhdILrHQbMEA',
      },
      amount: 350,
      description: 'Pitch Booking',
    },
  ];

  const defaultHistory = history.length > 0 ? history : [
    {
      id: 'h-1',
      title: 'Paid to Sarah',
      time: 'Today, 10:30 AM',
      amount: '-₹250',
      isCredit: false,
    },
    {
      id: 'h-2',
      title: 'Received from Mike',
      time: 'Yesterday',
      amount: '+₹400',
      isCredit: true,
    },
    {
      id: 'h-3',
      title: 'Paid to Turf Arena',
      time: 'Oct 12, 2023',
      amount: '-₹1,500',
      isCredit: false,
    },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-margin-mobile pt-lg md:pt-xl space-y-xl pb-24">
      {/* Balance Overview */}
      <section className="bg-surface-container-low rounded-xl p-md card-shadow border border-outline-variant/30 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-fixed/20 rounded-full blur-2xl pointer-events-none"></div>
        <h2 className="font-headline-md text-headline-md text-on-background mb-1 font-bold">
          My Balance
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
          Your net standing across all games.
        </p>
        <div className="flex flex-col sm:flex-row gap-gutter">
          <div className="flex-1 bg-surface rounded-lg p-md border-l-4 border-primary shadow-sm">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
              You are owed
            </p>
            <p className="font-headline-lg text-headline-lg text-primary font-bold">
              ₹{balance.totalOwedToUser.toLocaleString()}
            </p>
          </div>
          <div className="flex-1 bg-surface rounded-lg p-md border-l-4 border-secondary shadow-sm">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
              You owe
            </p>
            <p className="font-headline-lg text-headline-lg text-secondary font-bold">
              ₹{balance.totalUserOwes.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Ledger Split View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {/* Who Owes You */}
        <section className="flex flex-col gap-sm">
          <h3 className="font-label-bold text-label-bold text-on-background px-xs flex items-center gap-xs font-bold">
            <span className="material-symbols-outlined text-primary text-sm">arrow_downward</span>
            To Receive
          </h3>
          <div className="space-y-sm">
            {defaultToReceive.map((item: any) => {
              const u = item.fromUser || {};
              return (
                <div
                  key={item.id}
                  className="bg-surface rounded-lg p-md card-shadow flex items-center justify-between border border-outline-variant/20"
                >
                  <div className="flex items-center gap-md">
                    {u.avatarUrl ? (
                      <img
                        alt={u.name}
                        className="w-12 h-12 rounded-full object-cover"
                        src={u.avatarUrl}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-bold text-lg">
                        {u.name ? u.name.substring(0, 1) : 'V'}
                      </div>
                    )}
                    <div>
                      <p className="font-label-bold text-label-bold text-on-surface font-semibold">
                        {u.name || 'Player'}
                      </p>
                      <p className="font-body-md text-body-md text-primary font-bold">
                        ₹{item.amount}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSendReminder(u.id, item.amount, u.name)}
                    className="px-4 py-2 rounded-full border border-primary text-primary font-label-bold text-label-bold hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-95 shadow-sm"
                  >
                    Remind
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Who You Owe */}
        <section className="flex flex-col gap-sm">
          <h3 className="font-label-bold text-label-bold text-on-background px-xs flex items-center gap-xs font-bold">
            <span className="material-symbols-outlined text-secondary text-sm">arrow_upward</span>
            To Pay
          </h3>
          <div className="space-y-sm">
            {defaultToPay.map((item: any) => {
              const u = item.toUser || {};
              return (
                <div
                  key={item.id}
                  className="bg-surface rounded-lg p-md card-shadow flex items-center justify-between border-l-2 border-secondary/50 border border-outline-variant/20"
                >
                  <div className="flex items-center gap-md">
                    {u.avatarUrl ? (
                      <img
                        alt={u.name}
                        className="w-12 h-12 rounded-full object-cover"
                        src={u.avatarUrl}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold text-lg">
                        {u.name ? u.name.substring(0, 1) : 'R'}
                      </div>
                    )}
                    <div>
                      <p className="font-label-bold text-label-bold text-on-surface font-semibold">
                        {u.name || 'Organizer'}
                      </p>
                      <p className="font-body-md text-body-md text-secondary font-bold">
                        ₹{item.amount}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSettlePayment(item.id, item.amount, u.name)}
                    className="px-4 py-2 rounded-full bg-secondary text-on-secondary font-label-bold text-label-bold hover:bg-secondary/90 transition-colors active:scale-95 shadow-sm font-bold"
                  >
                    Settle
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Payment History */}
      <section className="pt-lg">
        <h2 className="font-headline-md text-headline-md text-on-background mb-md font-bold">
          Payment History
        </h2>
        <div className="bg-surface rounded-xl card-shadow overflow-hidden border border-outline-variant/30">
          {defaultHistory.map((item: any, idx: number) => (
            <div
              key={item.id || idx}
              className="p-md flex items-center justify-between border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-primary-container/30 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">
                    {item.isCredit ? 'account_balance_wallet' : 'payments'}
                  </span>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface font-semibold">
                    {item.title}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">{item.time}</p>
                </div>
              </div>
              <p
                className={`font-body-md text-body-md font-bold ${
                  item.isCredit ? 'text-primary' : 'text-on-surface'
                }`}
              >
                {item.amount}
              </p>
            </div>
          ))}
          <div className="p-3 bg-surface-container-low text-center">
            <button className="text-tertiary font-label-bold text-label-bold hover:underline">
              View All Transactions
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
