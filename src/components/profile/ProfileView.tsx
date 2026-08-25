'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firstLetter, avatarColor } from '@/lib/avatar';

export default function ProfileView({ onToast }: { onToast?: (msg: string) => void }) {
  const { user, updateProfile, logout } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable profile fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');

  // Password change fields
  const [showPwPanel, setShowPwPanel] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!user) return null;

  const resetEdits = () => {
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setUpiId(user.upiId || '');
    setError(null);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }
    setSaving(true);
    setError(null);
    const res = await updateProfile({ name, email, phone, upiId });
    setSaving(false);
    if (res.success) {
      setEditing(false);
      onToast?.(res.message || 'Profile updated!');
    } else {
      setError(res.error || 'Update failed');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError('Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setSaving(true);
    setError(null);
    const res = await updateProfile({ currentPassword, newPassword });
    setSaving(false);
    if (res.success) {
      setShowPwPanel(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onToast?.('Password changed successfully!');
    } else {
      setError(res.error || 'Could not change password');
    }
  };

  const inputCls =
    'w-full bg-surface-container-low border border-outline-variant rounded-xl p-sm text-sm text-on-surface focus:outline-primary font-medium';
  const labelCls = 'block font-label-bold text-xs text-on-surface-variant mb-1 font-bold';

  return (
    <div className="max-w-xl mx-auto px-margin-mobile py-lg space-y-md">
      {/* Header card */}
      <div className="relative bg-surface rounded-2xl p-lg border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-primary to-tertiary opacity-90"></div>
        <div className="relative flex flex-col items-center text-center pt-6">
          <div
            className="w-24 h-24 rounded-full border-4 border-surface shadow-md flex items-center justify-center text-white font-extrabold text-4xl select-none"
            style={{ backgroundColor: avatarColor(user.id || user.name) }}
            aria-label={user.name}
          >
            {firstLetter(user.name)}
          </div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-background mt-sm">{user.name}</h2>
          <span className="mt-1 inline-flex items-center gap-1 bg-primary-container text-on-primary-container font-label-sm text-label-sm px-3 py-1 rounded-full font-bold">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            {user.role}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-sm rounded-xl text-xs font-label-bold text-center border border-error/20">
          {error}
        </div>
      )}

      {/* Profile details / edit form */}
      <div className="bg-surface rounded-2xl p-md border border-outline-variant/30 shadow-sm space-y-sm">
        <div className="flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md font-bold text-on-background">Account Details</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-primary font-label-bold text-label-bold px-3 py-1.5 rounded-full hover:bg-primary-container/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit
            </button>
          ) : (
            <button
              onClick={() => {
                setEditing(false);
                resetEdits();
              }}
              className="text-on-surface-variant font-label-bold text-label-bold px-3 py-1.5 rounded-full hover:bg-surface-variant/50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {!editing ? (
          <div className="space-y-2">
            <Detail icon="person" label="Full Name" value={user.name} />
            <Detail icon="mail" label="Email" value={user.email || 'Not set'} />
            <Detail icon="call" label="Phone" value={user.phone || 'Not set'} />
            <Detail icon="account_balance" label="UPI ID" value={user.upiId || 'Not set'} />
          </div>
        ) : (
          <div className="space-y-sm">
            <div>
              <label className={labelCls}>Full Name</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>UPI ID (for payouts)</label>
              <input className={inputCls} value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="you@upi" />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-primary text-on-primary font-label-bold text-sm py-md rounded-xl shadow-md hover:bg-primary-fixed-dim transition-all active:scale-95 font-bold disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Security / password */}
      <div className="bg-surface rounded-2xl p-md border border-outline-variant/30 shadow-sm space-y-sm">
        <div className="flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md font-bold text-on-background">Security</h3>
          <button
            onClick={() => {
              setShowPwPanel((v) => !v);
              setError(null);
            }}
            className="flex items-center gap-1 text-primary font-label-bold text-label-bold px-3 py-1.5 rounded-full hover:bg-primary-container/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">{showPwPanel ? 'close' : 'lock'}</span>
            {showPwPanel ? 'Close' : 'Change Password'}
          </button>
        </div>

        {showPwPanel && (
          <div className="space-y-sm">
            <div>
              <label className={labelCls}>Current Password</label>
              <input className={inputCls} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className={labelCls}>New Password</label>
              <input className={inputCls} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 4 characters" />
            </div>
            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input className={inputCls} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={saving}
              className="w-full bg-secondary-container text-on-secondary font-label-bold text-sm py-md rounded-xl shadow-md hover:brightness-95 transition-all active:scale-95 font-bold disabled:opacity-60"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 bg-error-container text-on-error-container px-6 py-3 rounded-xl font-label-bold text-sm shadow-sm hover:brightness-95 transition-all active:scale-95 font-bold"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Sign Out
      </button>
    </div>
  );
}

function Detail({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-sm py-2 border-b border-outline-variant/20 last:border-0">
      <span className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </span>
      <div className="flex flex-col">
        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
        <span className="font-label-bold text-label-bold text-on-background font-semibold">{value}</span>
      </div>
    </div>
  );
}
