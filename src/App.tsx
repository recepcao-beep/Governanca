/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SocketProvider } from './SocketContext';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            if (data.token) localStorage.setItem('token', data.token);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

  return (
    <SocketProvider user={user}>
      {user ? <Dashboard user={user} onLogout={() => { localStorage.removeItem('token'); setUser(null); }} /> : <AuthScreen onLogin={setUser} />}
    </SocketProvider>
  );
}
