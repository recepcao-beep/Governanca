import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { PackageOpen, Users, CheckCircle2, BedDouble } from 'lucide-react';

export default function RoupariaTab({ user }: { user: any }) {
  const { rooms, updateRoom, packSizes } = useSocket();
  const [activeSubTab, setActiveSubTab] = useState<'lencois' | 'chegadas'>('lencois');

  // Calculate required linens for rooms that are NOT limpo
  const roomsToClean = rooms.filter(r => r.condition !== 'limpo');
  
  // Group by floor
  const floors = Array.from(new Set(roomsToClean.map(r => r.floor))).sort((a, b) => a - b);
  
  const floorData = floors.map(floor => {
    const floorRooms = roomsToClean.filter(r => r.floor === floor);
    let lencolCasal = 0;
    let lencolSolteiro = 0;
    let fronhas = 0;

    floorRooms.forEach(room => {
      fronhas += 5;
      if (room.floor === 200) {
        lencolCasal += 4;
      } else {
        lencolSolteiro += 4;
        lencolCasal += 2;
      }
    });

    return {
      floor,
      lencolCasal,
      lencolSolteiro,
      fronhas,
      casalPacks: Math.ceil(lencolCasal / packSizes.lencolCasal),
      solteiroPacks: Math.ceil(lencolSolteiro / packSizes.lencolSolteiro),
      fronhasPacks: Math.ceil(fronhas / packSizes.fronhas),
    };
  });

  const totalLencolCasal = floorData.reduce((acc, curr) => acc + curr.lencolCasal, 0);
  const totalLencolSolteiro = floorData.reduce((acc, curr) => acc + curr.lencolSolteiro, 0);
  const totalFronhas = floorData.reduce((acc, curr) => acc + curr.fronhas, 0);

  const totalCasalPacks = Math.ceil(totalLencolCasal / packSizes.lencolCasal);
  const totalSolteiroPacks = Math.ceil(totalLencolSolteiro / packSizes.lencolSolteiro);
  const totalFronhasPacks = Math.ceil(totalFronhas / packSizes.fronhas);

  const chegadas = rooms.filter(r => r.status === 'chegada');

  const handleConfirmChegada = (roomId: string) => {
    updateRoom(roomId, { linenDelivered: true });
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Rouparia</h2>
      </div>

      <div className="flex rounded-xl bg-gray-200 dark:bg-gray-700 p-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('lencois')}
          className={`flex-1 shrink-0 min-w-max whitespace-nowrap rounded-lg py-2 px-4 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'lencois' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-gray-50'
          }`}
        >
          Lençóis
        </button>
        <button
          onClick={() => setActiveSubTab('chegadas')}
          className={`flex-1 shrink-0 min-w-max whitespace-nowrap rounded-lg py-2 px-4 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'chegadas' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-gray-50'
          }`}
        >
          Chegadas
        </button>
      </div>

      {activeSubTab === 'lencois' ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <PackageOpen size={20} className="text-blue-500" />
              Total Necessário (Hotel)
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-100 dark:border-blue-900/50">
                <span className="text-3xl font-black text-blue-700 dark:text-blue-300">{totalCasalPacks}</span>
                <span className="mt-1 text-xs font-bold text-blue-900 uppercase tracking-wider text-center">Pct. Casal</span>
                <span className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 text-center">{totalLencolCasal} un.</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-4 border border-emerald-100 dark:border-emerald-900/50">
                <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{totalSolteiroPacks}</span>
                <span className="mt-1 text-xs font-bold text-emerald-900 uppercase tracking-wider text-center">Pct. Solteiro</span>
                <span className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 text-center">{totalLencolSolteiro} un.</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 p-4 border border-purple-100 dark:border-purple-900/50">
                <span className="text-3xl font-black text-purple-700 dark:text-purple-300">{totalFronhasPacks}</span>
                <span className="mt-1 text-xs font-bold text-purple-900 uppercase tracking-wider text-center">Pct. Fronhas</span>
                <span className="mt-1 text-[10px] text-purple-600 dark:text-purple-400 text-center">{totalFronhas} un.</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Necessidade por Andar</h3>
            {floorData.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum enxoval necessário no momento.</p>
            ) : (
              floorData.map(data => (
                <div key={data.floor} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                  <h4 className="mb-3 font-bold text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700 pb-2">
                    Andar {data.floor}
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.casalPacks}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Pct. Casal</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2">
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{data.solteiroPacks}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Pct. Solteiro</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{data.fronhasPacks}</div>
                      <div className="text-[10px] text-gray-500 uppercase">Pct. Fronhas</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Chegadas Previstas</h3>
          {chegadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-8 text-center text-gray-500 dark:text-gray-400">
              <BedDouble size={48} className="mb-4 opacity-20" />
              <p>Nenhuma chegada prevista para hoje.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {chegadas.map(room => (
                <div key={room.id} className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      Apt {room.id}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                      <Users size={16} /> {room.pax} pax
                    </span>
                  </div>
                  
                  <div className="mt-auto pt-2">
                    {room.linenDelivered ? (
                      <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 py-2 text-sm font-bold text-green-600 dark:text-green-400">
                        <CheckCircle2 size={18} /> Entregue (Chegada)
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConfirmChegada(room.id)}
                        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                      >
                        Confirmar Entrega
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
