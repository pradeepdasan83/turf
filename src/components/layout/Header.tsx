'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  currentRole: 'PLAYER' | 'ORGANIZER';
  onToggleRole: (role: 'PLAYER' | 'ORGANIZER') => void;
  onOpenNotifications?: () => void;
}

export default function Header({
  currentRole,
  onToggleRole,
  onOpenNotifications,
}: HeaderProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const isOrganizerUser = user?.role === 'ORGANIZER' || user?.role === 'BOTH';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex justify-between items-center w-full px-4 md:px-8 h-16 max-w-7xl mx-auto">
        {/* Left: Branding & User Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/30 shadow-sm"
              alt="User avatar"
              src={
                user?.avatarUrl ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCa5a-dLFVKOFNIXGHSgxfaerm1V3SaynbjhcWPVLt49ROV_fzipU7Uzl1crf8wqs_3Pi9P3y1lbVWAYCK3Q-YKYGDuWDnBHjipH9LSa5HqgfNheVFf6VMK23HLsqo5pU5IlbupKiN2PKW8CIgOpt5sEqu8rWFWJTqfwfxfUeOjBKDKYnc8nNV6dN9PI1EHZmqNICML4cD9LsxnhpOJEW9ALay1Fi8e1DEUJqO0P5lBLwkNWb3ljpE'
              }
            />
            {user && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${
                  isOrganizerUser ? 'bg-tertiary' : 'bg-primary'
                }`}
                title={user.role}
              />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-headline-md text-base font-extrabold text-primary tracking-tight leading-tight flex items-center gap-1.5">
              TurfSplit
              {isOrganizerUser && (
                <span className="text-[10px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                  Admin
                </span>
              )}
            </h1>
            <span className="text-xs text-on-surface-variant font-medium truncate max-w-[140px] sm:max-w-xs leading-none mt-0.5">
              {user ? user.name : 'Guest'}
            </span>
          </div>
        </div>

        {/* Center: Role Switcher (Visible on medium+ screens) */}
        {user && (
          <div className="hidden md:flex items-center bg-surface-container-high rounded-full p-1 border border-outline-variant/30 text-xs font-label-bold shadow-inner">
            <button
              type="button"
              onClick={() => onToggleRole('PLAYER')}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-bold ${
                currentRole === 'PLAYER'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">sports_soccer</span>
              Player View
            </button>

            <button
              type="button"
              onClick={() => {
                if (isOrganizerUser) {
                  onToggleRole('ORGANIZER');
                } else {
                  alert('Access Restricted: Only Admin / Organizer accounts can switch to Organizer Mode.');
                }
              }}
              className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 font-bold ${
                currentRole === 'ORGANIZER'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              } ${!isOrganizerUser ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              Organizer View {!isOrganizerUser && '🔒'}
            </button>
          </div>
        )}

        {/* Right: Actions (Notifications & Logout) */}
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-10 h-10 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-95 relative shadow-sm"
            aria-label="Notifications"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
          </button>

          {/* Logout Button */}
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="group flex items-center gap-1.5 h-10 px-3 rounded-full bg-surface-container-low hover:bg-error/10 border border-outline-variant/30 hover:border-error/30 text-on-surface-variant hover:text-error transition-all active:scale-95 shadow-sm"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <span className="material-symbols-outlined text-xl transition-transform group-hover:-translate-x-0.5">
                logout
              </span>
              <span className="text-xs font-bold hidden sm:inline-block pr-0.5">
                Logout
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
