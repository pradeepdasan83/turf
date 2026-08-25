'use client';

import React, { useState } from 'react';

interface RazorpayModalProps {
  amount: number;
  payeeName: string;
  ledgerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RazorpayModal({
  amount,
  payeeName,
  ledgerId,
  onClose,
  onSuccess,
}: RazorpayModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm'>('gpay');
  const [loading, setLoading] = useState(false);

  const handlePayNow = async () => {
    setLoading(true);

    try {
      // Step 1: Create Order via API
      const orderRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-order',
          amount,
          ledgerId,
        }),
      });
      const orderData = await orderRes.json();

      const orderId = orderData.order?.id || `order_mock_${Date.now()}`;
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Step 2: Verify & Settle Payment
      const verifyRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-payment',
          ledgerId,
          amount,
          razorpayOrderId: orderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: 'mock_signature',
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        onSuccess();
        onClose();
      } else {
        alert(verifyData.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Error initiating Razorpay payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-on-background/60 backdrop-blur-sm flex items-center justify-center p-md">
      <div className="bg-surface rounded-2xl p-lg max-w-md w-full shadow-2xl border border-outline-variant/30 relative">
        {/* Razorpay Badge Header */}
        <div className="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-sm">
          <div className="flex items-center gap-2">
            <span className="bg-tertiary text-on-tertiary px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase">
              Razorpay
            </span>
            <span className="font-label-bold text-label-bold text-on-surface">Secure Checkout</span>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-variant/50 p-1 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="text-center mb-lg">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Paying to {payeeName}</p>
          <div className="font-headline-lg text-headline-lg text-primary font-bold mt-xs">
            ₹{amount.toLocaleString()}
          </div>
        </div>

        {/* Payment Methods Tabs */}
        <div className="space-y-sm mb-lg">
          <p className="font-label-bold text-label-bold text-on-surface mb-xs">Select Payment Method</p>

          <div className="grid grid-cols-3 gap-xs">
            <button
              onClick={() => setSelectedMethod('upi')}
              className={`p-sm rounded-lg border text-xs font-label-bold flex flex-col items-center gap-1 ${
                selectedMethod === 'upi'
                  ? 'border-primary bg-primary-container/20 text-primary font-bold'
                  : 'border-outline-variant text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-lg">qr_code_2</span>
              UPI / QR
            </button>
            <button
              onClick={() => setSelectedMethod('card')}
              className={`p-sm rounded-lg border text-xs font-label-bold flex flex-col items-center gap-1 ${
                selectedMethod === 'card'
                  ? 'border-primary bg-primary-container/20 text-primary font-bold'
                  : 'border-outline-variant text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-lg">credit_card</span>
              Cards
            </button>
            <button
              onClick={() => setSelectedMethod('netbanking')}
              className={`p-sm rounded-lg border text-xs font-label-bold flex flex-col items-center gap-1 ${
                selectedMethod === 'netbanking'
                  ? 'border-primary bg-primary-container/20 text-primary font-bold'
                  : 'border-outline-variant text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-lg">account_balance</span>
              NetBanking
            </button>
          </div>

          {selectedMethod === 'upi' && (
            <div className="mt-md bg-surface-container-low p-md rounded-xl border border-outline-variant/30 space-y-sm">
              <p className="font-label-sm text-label-sm text-on-surface-variant font-medium">Choose UPI App:</p>
              <div className="flex gap-md justify-around">
                <button
                  onClick={() => setUpiApp('gpay')}
                  className={`flex flex-col items-center p-xs rounded-lg border ${
                    upiApp === 'gpay' ? 'border-primary bg-surface' : 'border-transparent'
                  }`}
                >
                  <span className="font-bold text-xs text-primary">Google Pay</span>
                </button>
                <button
                  onClick={() => setUpiApp('phonepe')}
                  className={`flex flex-col items-center p-xs rounded-lg border ${
                    upiApp === 'phonepe' ? 'border-primary bg-surface' : 'border-transparent'
                  }`}
                >
                  <span className="font-bold text-xs text-tertiary">PhonePe</span>
                </button>
                <button
                  onClick={() => setUpiApp('paytm')}
                  className={`flex flex-col items-center p-xs rounded-lg border ${
                    upiApp === 'paytm' ? 'border-primary bg-surface' : 'border-transparent'
                  }`}
                >
                  <span className="font-bold text-xs text-secondary">Paytm</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handlePayNow}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-bold py-md rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 font-bold"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Verifying Payment...
            </span>
          ) : (
            `Pay ₹${amount} via Razorpay`
          )}
        </button>
      </div>
    </div>
  );
}
