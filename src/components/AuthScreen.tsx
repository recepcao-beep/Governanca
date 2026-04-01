import React, { useState, useEffect } from 'react';
import { User, Building, ArrowLeft } from 'lucide-react';

export default function AuthScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [view, setView] = useState<'selection' | 'gestor'>('selection');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        localStorage.setItem('token', event.data.token);
        onLogin(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const handleGestorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/gestor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        onLogin(data.user);
      } else {
        alert(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      alert('Erro de conexão');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) throw new Error('Failed to get auth URL');
      const { url } = await res.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      alert('Erro ao iniciar login com Google. Verifique as configurações de OAuth.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-gray-800 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
            <Building size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">Governança</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Vilage Inn</p>
        </div>

        {view === 'selection' && (
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 font-semibold text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-gray-50 dark:bg-gray-900 active:scale-95"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sou Colaborador
            </button>
            <button
              onClick={() => setView('gestor')}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 p-4 font-semibold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
            >
              <User size={20} />
              Sou Gestor
            </button>
          </div>
        )}

        {view === 'gestor' && (
          <form onSubmit={handleGestorLogin} className="space-y-4">
            <button
              type="button"
              onClick={() => setView('selection')}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-50"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">Senha de Acesso</label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="****"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 p-4 font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
