'use client';

import React, { useState } from 'react';

interface SettleModalProps {
  amount: number;
  payeeName: string;
  payeeUpi?: string;
  ledgerId?: string;
  gameId?: string;
  fromUserId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SettleModal({
  amount,
  payeeName,
  payeeUpi,
  ledgerId,
  gameId,
  fromUserId,
  onClose,
  onSuccess,
}: SettleModalProps) {
  const [marking, setMarking] = useState(false);
  const [opened, setOpened] = useState(false);

  const note = `TurfSplit settlement`;
  const hasUpi = !!payeeUpi && payeeUpi.trim().length > 0;

  // Build a UPI intent URL. `scheme` lets us target Google Pay (tez) or any app (upi).
  const buildUpiUrl = (scheme: 'tez' | 'upi') => {
    const params = new URLSearchParams({
      pa: (payeeUpi || '').trim(),
      pn: payeeName || 'Payee',
      am: String(amount),
      cu: 'INR',
      tn: note,
    });
    return scheme === 'tez'
      ? `tez://upi/pay?${params.toString()}`
      : `upi://pay?${params.toString()}`;
  };

  const openUpi = (scheme: 'tez' | 'upi') => {
    if (!hasUpi) return;
    setOpened(true);
    // Navigating to the UPI scheme hands off to the installed app
    window.location.href = buildUpiUrl(scheme);
  };

  const markSettled = async () => {
    setMarking(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'settle', ledgerId, gameId, fromUserId, amount }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.error || 'Could not mark as settled');
      }
    } catch (err) {
      console.error('Settle error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-on-background/60 backdrop-blur-sm flex items-center justify-center p-md">
      <div className="bg-surface rounded-2xl p-lg max-w-md w-full shadow-2xl border border-outline-variant/30 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-md">
          <h2 className="font-headline-md text-headline-md text-on-background font-bold">Settle Payment</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-variant/50 p-1 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Amount + payee */}
        <div className="bg-gradient-to-br from-primary to-tertiary text-on-primary rounded-2xl p-lg text-center mb-md shadow-md">
          <p className="font-label-sm text-label-sm opacity-90">Paying to</p>
          <p className="font-headline-md text-headline-md font-bold">{payeeName}</p>
          <div className="font-display-lg text-display-lg font-extrabold mt-1">₹{amount.toLocaleString()}</div>
          {hasUpi && (
            <p className="font-label-sm text-label-sm opacity-90 mt-1 flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[16px]">account_balance</span>
              {payeeUpi}
            </p>
          )}
        </div>

        {hasUpi ? (
          <div className="space-y-sm">
            <button
              onClick={() => openUpi('tez')}
              className="w-full bg-primary text-on-primary font-label-bold py-md rounded-xl shadow-md hover:bg-primary-fixed-dim transition-all active:scale-95 flex items-center justify-center gap-2 font-bold"
            >
              <span className="material-symbols-outlined">account_balance_wallet</span>
              Pay ₹{amount} with Google Pay
            </button>
            <button
              onClick={() => openUpi('upi')}
              className="w-full bg-surface-container-high text-on-surface font-label-bold py-3 rounded-xl hover:bg-surface-variant transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
              Pay with another UPI app
            </button>
          </div>
        ) : (
          <div className="bg-error-container text-on-error-container rounded-xl p-md flex items-start gap-2 text-label-sm font-label-bold">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>{payeeName} hasn&apos;t added a UPI ID yet. Pay them directly, then mark it settled below.</span>
          </div>
        )}

        {/* Confirm settlement — UPI apps can't notify the web, so confirm manually */}
        <div className="mt-md pt-md border-t border-outline-variant/30">
          <p className="font-label-sm text-label-sm text-on-surface-variant text-center mb-sm">
            {opened ? 'Finished paying in your UPI app?' : 'Already paid, or paying by cash?'}
          </p>
          <button
            onClick={markSettled}
            disabled={marking}
            className="w-full bg-secondary-container text-on-secondary font-label-bold py-md rounded-xl hover:brightness-95 transition-all active:scale-95 flex items-center justify-center gap-2 font-bold disabled:opacity-60"
          >
            {marking ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                Marking…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">check_circle</span>
                I&apos;ve Paid — Mark Settled
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
