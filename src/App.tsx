/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import DashboardPreview from './DashboardPreview';

interface UserState {
  username: string;
  email: string;
  balance: number;
}

export default function App() {
  const [user, setUser] = useState<UserState | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Sayfa yüklendiğinde localStorage'a KÖR GÜVENMİYORUZ: token sunucuya
  // gönderilip doğrulanıyor ve GÜNCEL bakiye sunucudan çekiliyor. Böylece
  // birisi tarayıcı konsolundan localStorage'daki "balance" alanını elle
  // değiştirse bile arayüz gerçek (sunucu) bakiyeyi gösterir.
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('auth_token');
      const cachedUser = localStorage.getItem('active_user');

      if (!token || !cachedUser) {
        setCheckingSession(false);
        return;
      }

      try {
        const parsedUser = JSON.parse(cachedUser) as UserState;
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          // Token geçersiz/süresi dolmuş: oturumu temizle
          localStorage.removeItem('active_user');
          localStorage.removeItem('auth_token');
          setUser(null);
        } else {
          const data = await res.json();
          const freshUser = { ...parsedUser, balance: data.balance };
          localStorage.setItem('active_user', JSON.stringify(freshUser));
          setUser(freshUser);
        }
      } catch (err) {
        console.error('Oturum doğrulanamadı:', err);
        localStorage.removeItem('active_user');
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    };

    verifySession();
  }, []);

  const handleLoginSuccess = (userData: UserState) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('active_user');
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  if (checkingSession) {
    return (
      <div className="w-full min-h-screen bg-[#0d0915] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0d0915] text-slate-100">
      {user ? (
        <DashboardPreview user={user} onLogout={handleLogout} />
      ) : (
        <AuthPage onSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}
