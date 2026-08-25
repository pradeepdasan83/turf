'use client';

import React from 'react';

interface BottomNavProps {
  activeTab: 'dashboard' | 'games' | 'payments' | 'profile';
  onChangeTab: (tab: 'dashboard' | 'games' | 'payments' | 'profile') => void;
}

export default function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: 'dashboard' },
    { id: 'games', label: 'Games', icon: 'sports_soccer' },
    { id: 'payments', label: 'Wallet', icon: 'account_balance_wallet' },
    { id: 'profile', label: 'Profile', icon: 'person' },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[60] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 md:hidden pointer-events-none">
      <nav className="pointer-events-auto mx-auto max-w-md flex justify-around items-center gap-1 rounded-full bg-surface/90 backdrop-blur-xl border border-outline-variant/40 shadow-[0px_8px_28px_rgba(9,29,46,0.18)] px-2 py-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center justify-center gap-1.5 rounded-full transition-all duration-300 ease-out active:scale-90 ${
                isActive
                  ? 'bg-primary text-on-primary px-4 py-2.5 shadow-md'
                  : 'text-on-surface-variant hover:text-primary px-3 py-2.5'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-transform ${
                  isActive ? 'icon-fill scale-110' : ''
                }`}
              >
                {tab.icon}
              </span>
              {/* Label only expands for the active tab (pill-with-label pattern) */}
              <span
                className={`font-label-bold text-label-bold font-bold overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
