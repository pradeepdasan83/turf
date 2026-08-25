'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const { loginWithEmail, signup } = useAuth();

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up state (players only)
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUpi, setSignUpUpi] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);

  const handleSuccess = () => {
    if (onLoginSuccess) onLoginSuccess();
    else window.location.href = '/';
  };

  const switchTab = (tab: 'LOGIN' | 'SIGNUP') => {
    setActiveTab(tab);
    setErrorMsg(null);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    const res = await loginWithEmail(email, password);
    setSubmitting(false);
    if (res.success) handleSuccess();
    else setErrorMsg(res.error || 'Sign in failed. Please try again.');
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!signUpEmail.trim()) {
      setErrorMsg('Email is required to sign in later');
      return;
    }
    if (!signUpPassword) {
      setErrorMsg('Please set a password');
      return;
    }
    if (signUpPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters');
      return;
    }
    if (signUpPassword !== signUpConfirm) {
      setErrorMsg('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    const res = await signup({
      name: signUpName,
      phone: signUpPhone,
      email: signUpEmail,
      role: 'PLAYER',
      upiId: signUpUpi,
      password: signUpPassword,
    });
    setSubmitting(false);
    if (res.success) handleSuccess();
    else setErrorMsg(res.error || 'Sign Up failed');
  };

  const inputCls =
    'w-full bg-surface-container-low border border-outline-variant rounded-xl p-md text-sm text-on-surface focus:outline-primary font-medium';
  const labelCls = 'block font-label-bold text-xs text-on-surface-variant mb-1 font-bold';

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center items-center p-margin-mobile relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface rounded-2xl p-lg shadow-2xl border border-outline-variant/30 relative z-10 space-y-md">
        {/* Branding */}
        <div className="text-center space-y-xs">
          <div className="w-14 h-14 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-3xl icon-fill">sports_soccer</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-extrabold tracking-tight">TurfSplit</h1>
          <p className="font-body-md text-xs text-on-surface-variant">
            Smart Turf Booking &amp; Player Payment System
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-surface-container-low rounded-xl p-1 border border-outline-variant/30 text-sm font-label-bold">
          <button
            type="button"
            onClick={() => switchTab('LOGIN')}
            className={`flex-1 py-2.5 rounded-lg transition-all ${
              activeTab === 'LOGIN' ? 'bg-primary text-on-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => switchTab('SIGNUP')}
            className={`flex-1 py-2.5 rounded-lg transition-all ${
              activeTab === 'SIGNUP' ? 'bg-primary text-on-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Sign Up
          </button>
        </div>

        {errorMsg && (
          <div className="bg-error-container text-on-error-container p-sm rounded-xl text-xs font-label-bold text-center border border-error/20">
            {errorMsg}
          </div>
        )}

        {/* LOGIN */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleEmailLogin} className="space-y-sm">
            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input
                  type={showLoginPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls + ' pr-11'}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPw((v) => !v)}
                  aria-label={showLoginPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary rounded-full"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showLoginPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-bold text-sm py-md rounded-xl shadow-md transition-all active:scale-95 font-bold mt-xs flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? 'Signing In...' : 'Sign In 🔑'}
            </button>
            <p className="text-center text-xs text-on-surface-variant pt-1">
              New here?{' '}
              <button type="button" onClick={() => switchTab('SIGNUP')} className="text-primary font-bold hover:underline">
                Create an account
              </button>
            </p>
          </form>
        )}

        {/* SIGN UP */}
        {activeTab === 'SIGNUP' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-sm">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input
                type="text"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Email *</label>
              <input
                type="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputCls}
                autoComplete="email"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className={labelCls}>Phone</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Optional"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>UPI ID</label>
                <input
                  type="text"
                  value={signUpUpi}
                  onChange={(e) => setSignUpUpi(e.target.value)}
                  placeholder="Optional"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Password *</label>
              <div className="relative">
                <input
                  type={showSignupPw ? 'text' : 'password'}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className={inputCls + ' pr-11'}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPw((v) => !v)}
                  aria-label={showSignupPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary rounded-full"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showSignupPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Confirm Password *</label>
              <input
                type={showSignupPw ? 'text' : 'password'}
                value={signUpConfirm}
                onChange={(e) => setSignUpConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className={`${inputCls} ${signUpConfirm && signUpConfirm !== signUpPassword ? 'border-error' : ''}`}
                autoComplete="new-password"
                required
              />
              {signUpConfirm && signUpConfirm !== signUpPassword && (
                <p className="text-error text-[11px] font-label-bold mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-bold text-sm py-md rounded-xl shadow-md transition-all active:scale-95 font-bold mt-xs disabled:opacity-60"
            >
              {submitting ? 'Creating Account...' : 'Create Account 🎉'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
