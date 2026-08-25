'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const { sendOtp, verifyOtp, loginWithEmail, signup } = useAuth();

  const [activeTab, setActiveTab] = useState<'PHONE' | 'EMAIL' | 'SIGNUP'>('PHONE');

  // Phone OTP State
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Email Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State (players only)
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpUpi, setSignUpUpi] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Password visibility toggles
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);

  const handleSuccess = () => {
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      window.location.href = '/';
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setErrorMsg('Please enter a valid phone number');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await sendOtp(phone);
    setSubmitting(false);

    if (res.success) {
      setOtpSent(true);
      setInfoMsg(res.message || 'OTP sent to your phone.');
    } else {
      setErrorMsg(res.error || res.message || 'Failed to send OTP');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await verifyOtp(phone, otpCode);
    setSubmitting(false);

    if (res.success) {
      handleSuccess();
    } else {
      setErrorMsg(res.error || 'Invalid OTP code');
    }
  };

  // Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await loginWithEmail(email, password || 'admin123');
    setSubmitting(false);

    if (res.success) {
      handleSuccess();
    } else {
      setErrorMsg(res.error || 'Sign in failed. Please try again.');
    }
  };

  // Sign Up Submit (players only)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || (!signUpPhone && !signUpEmail)) {
      setErrorMsg('Full Name and Phone or Email are required');
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

    if (res.success) {
      handleSuccess();
    } else {
      setErrorMsg(res.error || 'Sign Up failed');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-center items-center p-margin-mobile relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface rounded-2xl p-lg shadow-2xl border border-outline-variant/30 relative z-10 space-y-md">
        {/* Header Branding */}
        <div className="text-center space-y-xs">
          <div className="w-14 h-14 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <span className="material-symbols-outlined text-3xl icon-fill">sports_soccer</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary font-extrabold tracking-tight">
            TurfSplit
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant">
            Smart Turf Booking & Player Payment System
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex bg-surface-container-low rounded-xl p-1 border border-outline-variant/30 text-xs font-label-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PHONE');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'PHONE'
                ? 'bg-surface text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Phone OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('EMAIL');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'EMAIL'
                ? 'bg-surface text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('SIGNUP');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'SIGNUP'
                ? 'bg-surface text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Dynamic Alerts */}
        {errorMsg && (
          <div className="bg-error-container text-on-error-container p-sm rounded-xl text-xs font-label-bold text-center border border-error/20">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="bg-primary-container/20 text-on-primary-container p-sm rounded-xl text-xs font-label-bold text-center border border-primary-container/40">
            {infoMsg}
          </div>
        )}

        {/* TAB 1: PHONE OTP LOGIN */}
        {activeTab === 'PHONE' && (
          <div className="space-y-sm">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-sm">
                <div>
                  <label className="block font-label-bold text-xs text-on-surface-variant mb-1 font-bold">
                    Mobile Number (India)
                  </label>
                  <div className="flex items-stretch">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-outline-variant bg-surface-container-high text-on-surface-variant font-medium text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="95XXXXXXXX"
                      className="flex-1 w-full bg-surface-container-low border border-outline-variant rounded-r-xl p-md text-sm text-on-surface focus:outline-primary font-medium"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !phone}
                  className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-bold text-sm py-md rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 font-bold"
                >
                  {submitting ? 'Sending OTP...' : 'Send OTP via Phone 📲'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-sm">
                <div>
                  <label className="block font-label-bold text-xs text-on-surface mb-1 font-bold">
                    Enter the 6-digit OTP sent to your phone
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-surface-container-low border-2 border-primary rounded-xl p-md text-center text-xl font-bold tracking-widest text-primary focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-on-primary font-label-bold text-sm py-md rounded-xl shadow-md hover:bg-primary-fixed-dim transition-all active:scale-95 font-bold"
                >
                  {submitting ? 'Verifying...' : 'Verify OTP & Sign In 🚀'}
                </button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-xs text-on-surface-variant hover:underline text-center pt-1"
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: EMAIL LOGIN */}
        {activeTab === 'EMAIL' && (
          <form onSubmit={handleEmailLogin} className="space-y-sm">
            <div>
              <label className="block font-label-bold text-xs text-on-surface-variant mb-1 font-bold">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@turfsplit.com or player@turfsplit.com"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-md text-sm text-on-surface focus:outline-primary font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-label-bold text-xs text-on-surface-variant mb-1 font-bold">
                Password
              </label>
              <div className="relative">
                <input
                  type={showLoginPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-md pr-11 text-sm text-on-surface focus:outline-primary font-medium"
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
              className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-bold text-sm py-md rounded-xl shadow-md transition-all active:scale-95 font-bold mt-xs flex items-center justify-center gap-2"
            >
              {submitting ? 'Signing In...' : 'Sign In 🔑'}
            </button>
          </form>
        )}

        {/* TAB 3: SIGN UP */}
        {activeTab === 'SIGNUP' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-sm">
            <div>
              <label className="block font-label-bold text-xs text-on-surface-variant mb-1 font-bold">
                Full Name *
              </label>
              <input
                type="text"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-sm text-sm text-on-surface focus:outline-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className="block font-label-bold text-xs text-on-surface-variant mb-1 font-bold">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-sm text-sm text-on-surface focus:outline-primary"
                  required
                />
              </div>

              <div>
                <label className="block font-label-bold text-xs text-on-surface-variant mb-1 font-bold">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-sm text-sm text-on-surface focus:outline-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-bold text-xs text-on-surface-variant mb-1 font-bold">
                UPI ID (For payouts)
              </label>
              <input
                type="text"
                value={signUpUpi}
                onChange={(e) => setSignUpUpi(e.target.value)}
                placeholder="alex@upi"
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-sm text-sm text-on-surface focus:outline-primary"
              />
            </div>

            <div>
              <label className="block font-label-bold text-xs text-on-surface-variant mb-1 font-bold">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showSignupPw ? 'text' : 'password'}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-sm pr-11 text-sm text-on-surface focus:outline-primary"
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
              <label className="block font-label-bold text-xs text-on-surface-variant mb-1 font-bold">
                Confirm Password *
              </label>
              <input
                type={showSignupPw ? 'text' : 'password'}
                value={signUpConfirm}
                onChange={(e) => setSignUpConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full bg-surface-container-low border rounded-xl p-sm text-sm text-on-surface focus:outline-primary ${
                  signUpConfirm && signUpConfirm !== signUpPassword
                    ? 'border-error'
                    : 'border-outline-variant'
                }`}
                required
              />
              {signUpConfirm && signUpConfirm !== signUpPassword && (
                <p className="text-error text-[11px] font-label-bold mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-bold text-sm py-md rounded-xl shadow-md transition-all active:scale-95 font-bold mt-xs"
            >
              {submitting ? 'Creating Account...' : 'Create Account & Sign In 🎉'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
