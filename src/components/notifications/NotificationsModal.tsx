'use client';

import React from 'react';

interface NotificationsModalProps {
  onClose: () => void;
  notifications?: any[];
}

export default function NotificationsModal({
  onClose,
  notifications = [],
}: NotificationsModalProps) {
  const defaultNotifications = notifications.length > 0 ? notifications : [
    {
      id: 'notif-1',
      title: '⚽ Game Tomorrow',
      message: 'Football at Green Valley Turf tomorrow 7:00 PM – 8:00 PM. Your share: ₹200',
      time: '10m ago',
      type: 'GAME_REMINDER',
    },
    {
      id: 'notif-2',
      title: '💳 Payment Received',
      message: 'David paid ₹15.00 for ABC Football Arena',
      time: '2h ago',
      type: 'PAYMENT',
    },
    {
      id: 'notif-3',
      title: '🙌 Player Joined',
      message: 'Priya joined 5v5 Evening Match. Per player share updated!',
      time: '1d ago',
      type: 'GAME',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-on-background/50 backdrop-blur-sm flex items-start justify-end p-md pt-16">
      <div className="bg-surface rounded-2xl p-md max-w-md w-full shadow-2xl border border-outline-variant/30 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-md border-b border-outline-variant/20 pb-xs">
          <h3 className="font-headline-md text-headline-md text-primary font-bold">Notifications</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:bg-surface-variant/50 p-1 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-sm divide-y divide-outline-variant/20">
          {defaultNotifications.map((n) => (
            <div key={n.id} className="pt-sm pb-xs flex gap-sm">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center flex-shrink-0 mt-1">
                <span className="material-symbols-outlined text-sm">notifications</span>
              </div>
              <div>
                <p className="font-label-bold text-label-bold text-on-surface font-semibold">{n.title}</p>
                <p className="font-body-md text-sm text-on-surface-variant">{n.message}</p>
                <p className="font-label-sm text-xs text-outline mt-1">{n.time || 'Recently'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
