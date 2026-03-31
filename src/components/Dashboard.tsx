import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { LogOut, Home, ClipboardList, Settings, Users, BarChart3 } from 'lucide-react';
import ApartamentosTab from './ApartamentosTab';
import PedidosTab from './PedidosTab';
import ConfiguracoesTab from './ConfiguracoesTab';
import GestorTab from './GestorTab';
import DashboardTab from './DashboardTab';

export default function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const { users } = useSocket();
  const [activeTab, setActiveTab] = useState('apartamentos');

  // Find latest user state from socket
  const currentUser = users.find(u => u.email === user.email) || user;

  if (!currentUser.approved) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-4 text-center">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Aguardando Aprovação</h2>
          <p className="mb-6 text-gray-600">Seu acesso precisa ser liberado por um gestor.</p>
          <button onClick={onLogout} className="rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-700 hover:bg-gray-300">
            Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 z-10 flex w-full items-center justify-between bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
            {currentUser.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-semibold text-gray-800">{currentUser.role === 'gestor' ? 'Gestor' : 'Camareira'}</h1>
            <p className="text-xs text-gray-500">{currentUser.email}</p>
          </div>
        </div>
        <button onClick={onLogout} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-20">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'apartamentos' && <ApartamentosTab user={currentUser} />}
        {activeTab === 'pedidos' && <PedidosTab user={currentUser} />}
        {activeTab === 'configuracoes' && <ConfiguracoesTab user={currentUser} />}
        {activeTab === 'gestor' && currentUser.role === 'gestor' && <GestorTab />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 z-10 flex w-full border-t border-gray-200 bg-white pb-safe">
        {currentUser.role === 'gestor' && (
          <NavItem icon={<BarChart3 size={24} />} label="Dash" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        )}
        <NavItem icon={<Home size={24} />} label="Aptos" active={activeTab === 'apartamentos'} onClick={() => setActiveTab('apartamentos')} />
        <NavItem icon={<ClipboardList size={24} />} label="Pedidos" active={activeTab === 'pedidos'} onClick={() => setActiveTab('pedidos')} />
        {currentUser.role === 'gestor' && (
          <NavItem icon={<Users size={24} />} label="Equipe" active={activeTab === 'gestor'} onClick={() => setActiveTab('gestor')} />
        )}
        <NavItem icon={<Settings size={24} />} label="Config" active={activeTab === 'configuracoes'} onClick={() => setActiveTab('configuracoes')} />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center py-3 transition-colors ${
        active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );
}
