import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { useTheme } from '../ThemeContext';
import { LogOut, Home, ClipboardList, Settings, Users, BarChart3, Sun, Moon, Wrench, PackageOpen } from 'lucide-react';
import ApartamentosTab from './ApartamentosTab';
import PedidosTab from './PedidosTab';
import ConfiguracoesTab from './ConfiguracoesTab';
import GestorTab from './GestorTab';
import DashboardTab from './DashboardTab';
import ManutencaoTab from './ManutencaoTab';
import RoupariaTab from './RoupariaTab';

export default function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const { users } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('apartamentos');

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Find latest user state from socket
  const currentUser = users.find(u => u.email === user.email) || user;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '0000') {
      try {
        const res = await fetch('/api/auth/approve-self', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          window.location.reload();
        } else {
          setError('Erro ao atualizar permissão');
        }
      } catch (err) {
        setError('Erro de conexão');
      }
    } else {
      setError('Senha incorreta');
    }
  };

  if (!currentUser.approved) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 text-center">
        <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">Aguardando Aprovação</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">Seu acesso precisa ser liberado por um gestor.</p>
          
          <div className="mb-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Você é um gestor?</p>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-2">
              <input
                type="password"
                placeholder="Senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              <button type="submit" className="rounded-lg bg-blue-600 p-3 font-bold text-white hover:bg-blue-700 dark:hover:bg-blue-500">
                Liberar Acesso
              </button>
            </form>
          </div>

          <button onClick={onLogout} className="w-full rounded-lg bg-gray-200 dark:bg-gray-700 px-6 py-3 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600">
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="fixed top-0 z-10 flex w-full items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 shadow-sm dark:border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 font-bold text-blue-600 dark:text-blue-400">
            {currentUser.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-semibold text-gray-800 dark:text-gray-100">{currentUser.role === 'gestor' ? 'Gestor' : 'Camareira'}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={onLogout} className="rounded-full p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pt-20">
        {activeTab === 'dashboard' && currentUser.role === 'gestor' && <DashboardTab />}
        {activeTab === 'apartamentos' && <ApartamentosTab user={currentUser} />}
        {activeTab === 'pedidos' && <PedidosTab user={currentUser} />}
        {activeTab === 'manutencao' && <ManutencaoTab user={currentUser} />}
        {activeTab === 'rouparia' && <RoupariaTab user={currentUser} />}
        {activeTab === 'configuracoes' && currentUser.role === 'gestor' && <ConfiguracoesTab user={currentUser} />}
        {activeTab === 'gestor' && currentUser.role === 'gestor' && <GestorTab />}
        <div className="h-32 w-full"></div> {/* Spacer for bottom nav */}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 z-10 flex w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pb-safe pt-1 overflow-x-auto no-scrollbar justify-start sm:justify-around px-2">
        {currentUser.role === 'gestor' && (
          <NavItem icon={<BarChart3 size={20} />} label="Dash" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        )}
        <NavItem icon={<Home size={20} />} label="Aptos" active={activeTab === 'apartamentos'} onClick={() => setActiveTab('apartamentos')} />
        <NavItem icon={<ClipboardList size={20} />} label="Pedidos" active={activeTab === 'pedidos'} onClick={() => setActiveTab('pedidos')} />
        <NavItem icon={<Wrench size={20} />} label="Manut." active={activeTab === 'manutencao'} onClick={() => setActiveTab('manutencao')} />
        <NavItem icon={<PackageOpen size={20} />} label="Rouparia" active={activeTab === 'rouparia'} onClick={() => setActiveTab('rouparia')} />
        {currentUser.role === 'gestor' && (
          <>
            <NavItem icon={<Users size={20} />} label="Equipe" active={activeTab === 'gestor'} onClick={() => setActiveTab('gestor')} />
            <NavItem icon={<Settings size={20} />} label="Config" active={activeTab === 'configuracoes'} onClick={() => setActiveTab('configuracoes')} />
          </>
        )}
        <div className="w-4 shrink-0 sm:hidden"></div> {/* Spacer for scrolling past the edge */}
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 min-w-[72px] sm:flex-1 flex-col items-center justify-center py-2 sm:py-3 transition-colors ${
        active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      }`}
    >
      {icon}
      <span className="mt-1 text-[9px] sm:text-[10px] font-medium uppercase tracking-wider truncate w-full text-center px-1">{label}</span>
    </button>
  );
}
