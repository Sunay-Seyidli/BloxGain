/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

  // Load existing logged in session if exists on mount
  useEffect(() => {
    try {
      const activeUser = localStorage.getItem('active_user');
      if (activeUser) {
        setUser(JSON.parse(activeUser));
      }
    } catch (err) {
      console.error('Failed to parse active user from localStorage', err);
    }
  }, []);

  const handleLoginSuccess = (userData: UserState) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('active_user');
    setUser(null);
  };

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

