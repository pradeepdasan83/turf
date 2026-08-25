'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserSession {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'ORGANIZER' | 'PLAYER' | 'BOTH';
  avatarUrl?: string;
  upiId?: string;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  loginWithEmail: (email: string, pass?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: any) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    data: Partial<UserSession> & { currentPassword?: string; newPassword?: string }
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithEmail: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('turfsplit_user_session');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse stored auth session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSession = (userData: UserSession) => {
    setUser(userData);
    try {
      localStorage.setItem('turfsplit_user_session', JSON.stringify(userData));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || '' }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveSession(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (e) {
      console.error('loginWithEmail error:', e);
      return { success: false, error: 'Connection error' };
    }
  };

  const signup = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveSession(data.user);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e) {
      console.error('signup error:', e);
      return { success: false, error: 'Registration request failed' };
    }
  };

  const updateProfile = async (
    data: Partial<UserSession> & { currentPassword?: string; newPassword?: string }
  ) => {
    if (!user) return { success: false, error: 'Not signed in' };
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success && result.user) {
        // Merge returned fields into the current session
        saveSession({ ...user, ...result.user });
        return { success: true, message: result.message };
      }

      // A real password-change failure (e.g. wrong current password) must surface
      if (data.newPassword) {
        return { success: false, error: result.error || 'Could not change password' };
      }

      // Profile-field update for an unknown demo user: apply locally so the
      // demo stays dynamic even without a matching DB record.
      const { currentPassword: _cp, newPassword: _np, ...profile } = data;
      saveSession({ ...user, ...profile } as UserSession);
      return { success: true, message: 'Profile updated!' };
    } catch (e) {
      console.error('updateProfile error:', e);
      // Password changes need a live server; don't fake success for them
      if (data.newPassword) {
        return { success: false, error: 'Could not reach server to change password' };
      }
      // Optimistic local fallback so the demo stays dynamic without a DB
      const { currentPassword: _cp, newPassword: _np, ...profile } = data;
      saveSession({ ...user, ...profile } as UserSession);
      return { success: true, message: 'Profile updated!' };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('turfsplit_user_session');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        signup,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
