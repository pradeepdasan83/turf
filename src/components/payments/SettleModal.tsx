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
  const [copied, setCopied] = useState(false);

  const hasUpi = !!payeeUpi && payeeUpi.trim().length > 0;

  const copyUpi = async () => {
    if (!payeeUpi) return;
    try {
      await navigator.clipboard.writeText(payeeUpi.trim());
    } catch {
      const t = document.createElement('textarea');
      t.value = payeeUpi.trim();
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(t);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        </div>

        {hasUpi ? (
          <>
            {/* Copy the UPI ID, then pay in any UPI app */}
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-md">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Pay to this UPI ID</p>
              <div className="flex items-center gap-2">
                <span className="flex-1 min-w-0 truncate font-label-bold text-label-bold text-on-surface">
                  {payeeUpi}
                </span>
                <button
                  onClick={copyUpi}
                  className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-full font-label-bold text-label-bold transition-all active:scale-95 ${
                    copied
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-primary text-on-primary hover:bg-primary-fixed-dim'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant text-center mt-2 leading-snug">
              Open GPay / PhonePe / any UPI app, pay ₹{amount} to this ID, then tap below.
            </p>
          </>
        ) : (
          <div className="bg-error-container text-on-error-container rounded-xl p-md flex items-start gap-2 text-label-sm font-label-bold">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>{payeeName} hasn&apos;t added a UPI ID yet. Pay them directly, then mark it settled below.</span>
          </div>
        )}

        {/* Confirm settlement */}
        <div className="mt-md pt-md border-t border-outline-variant/30">
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
