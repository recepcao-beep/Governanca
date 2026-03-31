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
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-yellow-900">
          <ShieldAlert /> Aguardando Aprovação
        </h2>
        
        {pendingUsers.length === 0 ? (
          <p className="text-sm text-yellow-800">Nenhum usuário aguardando aprovação.</p>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.email} className="rounded-lg bg-white p-4 shadow-sm border border-yellow-100">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold text-gray-800">{user.email}</span>
                  <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-800">Camareira</span>
                </div>
                
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Atribuir Andares</p>
                  <div className="flex flex-wrap gap-2">
                    {allFloors.map(floor => {
                      const isSelected = (selectedFloors[user.email] || []).includes(floor);
                      return (
                        <button
                          key={floor}
                          onClick={() => toggleFloor(user.email, floor)}
                          className={clsx(
                            'rounded-full px-3 py-1 text-xs font-bold transition-colors',
                            isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
          <UserCheck /> Equipe Aprovada
        </h2>
        
        {approvedUsers.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma camareira aprovada ainda.</p>
        ) : (
          <div className="space-y-3">
            {approvedUsers.map(user => (
              <div key={user.email} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div>
                  <p className="font-semibold text-gray-800">{user.email}</p>
                  <p className="text-xs text-gray-500">Andares: {user.floors?.join(', ')}</p>
                </div>
                <button className="rounded-full bg-gray-200 p-2 text-gray-600 hover:bg-gray-300">
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
