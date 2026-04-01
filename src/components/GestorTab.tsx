import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Check, X, UserCheck, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

export default function GestorTab() {
  const { users, approveUser } = useSocket();
  const [selectedFloors, setSelectedFloors] = useState<Record<string, number[]>>({});

  const pendingUsers = users.filter(u => !u.approved && u.role === 'camareira');
  const approvedUsers = users.filter(u => u.approved && u.role === 'camareira');

  const allFloors = [200, 300, 400, 500, 600, 700];

  const toggleFloor = (email: string, floor: number) => {
    setSelectedFloors(prev => {
      const current = prev[email] || [];
      const updated = current.includes(floor) ? current.filter(f => f !== floor) : [...current, floor];
      return { ...prev, [email]: updated };
    });
  };

  const handleApprove = (email: string) => {
    const floors = selectedFloors[email] || [];
    if (floors.length === 0) {
      alert('Selecione pelo menos um andar para a camareira.');
      return;
    }
    approveUser(email, floors);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/30 p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg sm:text-xl font-bold text-yellow-900">
          <ShieldAlert /> Aguardando Aprovação
        </h2>
        
        {pendingUsers.length === 0 ? (
          <p className="text-sm text-yellow-800 dark:text-yellow-200">Nenhum usuário aguardando aprovação.</p>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.email} className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-yellow-100">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{user.email}</span>
                  <span className="rounded-full bg-yellow-100 dark:bg-yellow-900/50 px-2.5 py-0.5 text-xs font-bold text-yellow-800 dark:text-yellow-200">Camareira</span>
                </div>
                
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Atribuir Andares</p>
                  <div className="flex flex-wrap gap-2">
                    {allFloors.map(floor => {
                      const isSelected = (selectedFloors[user.email] || []).includes(floor);
                      return (
                        <button
                          key={floor}
                          onClick={() => toggleFloor(user.email, floor)}
                          className={clsx(
                            'rounded-full px-3 py-1 text-xs font-bold transition-colors',
                            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700'
                          )}
                        >
                          {floor}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => handleApprove(user.email)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2 font-bold text-white transition-colors hover:bg-green-700"
                >
                  <Check size={16} /> Aprovar Acesso
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
          <UserCheck /> Equipe Aprovada
        </h2>
        
        {approvedUsers.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma camareira aprovada ainda.</p>
        ) : (
          <div className="space-y-3">
            {approvedUsers.map(user => (
              <div key={user.email} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{user.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Andares: {user.floors?.join(', ')}</p>
                </div>
                <button className="rounded-full bg-gray-200 dark:bg-gray-700 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-300">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
