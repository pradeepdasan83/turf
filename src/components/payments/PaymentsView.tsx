'use client';

import React from 'react';
import { firstLetter, avatarColor } from '@/lib/avatar';

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

function LetterAvatar({ name, seed }: { name?: string; seed?: string }) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg select-none shrink-0"
      style={{ backgroundColor: avatarColor(seed || name) }}
      aria-label={name}
    >
      {firstLetter(name)}
    </div>
  );
}

function EmptyRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-surface rounded-lg p-lg border border-outline-variant/20 flex flex-col items-center text-center gap-1 text-on-surface-variant">
      <span className="material-symbols-outlined text-3xl opacity-60">{icon}</span>
      <p className="font-label-sm text-label-sm">{text}</p>
    </div>
  );
}

export default function PaymentsView({
  balance = { totalOwedToUser: 0, totalUserOwes: 0, netBalance: 0 },
  toReceive = [],
  toPay = [],
  history = [],
  onSettlePayment,
  onSendReminder,
}: PaymentsViewProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-margin-mobile pt-lg md:pt-xl space-y-xl pb-24">
      {/* Balance Overview */}
      <section className="bg-surface-container-low rounded-xl p-md card-shadow border border-outline-variant/30 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-fixed/20 rounded-full blur-2xl pointer-events-none"></div>
        <h2 className="font-headline-md text-headline-md text-on-background mb-1 font-bold">My Balance</h2>
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
            {toReceive.length === 0 ? (
              <EmptyRow icon="sentiment_satisfied" text="Nobody owes you right now." />
            ) : (
              toReceive.map((item: any) => {
                const u = item.fromUser || {};
                return (
                  <div
                    key={item.id}
                    className="bg-surface rounded-lg p-md card-shadow flex items-center justify-between border border-outline-variant/20"
                  >
                    <div className="flex items-center gap-md">
                      <LetterAvatar name={u.name} seed={u.id} />
                      <div>
                        <p className="font-label-bold text-label-bold text-on-surface font-semibold">
                          {u.name || 'Player'}
                        </p>
                        <p className="font-body-md text-body-md text-primary font-bold">₹{item.amount}</p>
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
              })
            )}
          </div>
        </section>

        {/* Who You Owe */}
        <section className="flex flex-col gap-sm">
          <h3 className="font-label-bold text-label-bold text-on-background px-xs flex items-center gap-xs font-bold">
            <span className="material-symbols-outlined text-secondary text-sm">arrow_upward</span>
            To Pay
          </h3>
          <div className="space-y-sm">
            {toPay.length === 0 ? (
              <EmptyRow icon="check_circle" text="You're all settled up." />
            ) : (
              toPay.map((item: any) => {
                const u = item.toUser || {};
                return (
                  <div
                    key={item.id}
                    className="bg-surface rounded-lg p-md card-shadow flex items-center justify-between border-l-2 border-secondary/50 border border-outline-variant/20"
                  >
                    <div className="flex items-center gap-md">
                      <LetterAvatar name={u.name} seed={u.id} />
                      <div>
                        <p className="font-label-bold text-label-bold text-on-surface font-semibold">
                          {u.name || 'Organizer'}
                        </p>
                        <p className="font-body-md text-body-md text-secondary font-bold">₹{item.amount}</p>
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
              })
            )}
          </div>
        </section>
      </div>

      {/* Payment History */}
      <section className="pt-lg">
        <h2 className="font-headline-md text-headline-md text-on-background mb-md font-bold">Payment History</h2>
        {history.length === 0 ? (
          <div className="bg-surface rounded-xl card-shadow border border-outline-variant/30 p-xl flex flex-col items-center text-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl opacity-60">receipt_long</span>
            <p className="font-label-bold text-label-bold">No payment history yet</p>
            <p className="font-label-sm text-label-sm opacity-80">
              Settlements you make or receive will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-surface rounded-xl card-shadow overflow-hidden border border-outline-variant/30 divide-y divide-outline-variant/20">
            {history.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="p-md flex items-center justify-between hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-primary-container/30 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">
                      {item.isCredit ? 'call_received' : 'call_made'}
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
          </div>
        )}
      </section>
    </div>
  );
}
