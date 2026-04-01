import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { PackageOpen, Users, CheckCircle2, BedDouble } from 'lucide-react';
import clsx from 'clsx';

export default function RoupariaTab({ user }: { user: any }) {
  const { rooms, dailyRooms, updateRoom, packSizes } = useSocket();
  const [activeSubTab, setActiveSubTab] = useState<'lencois' | 'chegadas'>('lencois');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Get rooms for the selected day
  const currentRooms = selectedDayIndex === 0 ? rooms : (dailyRooms[selectedDayIndex] ? Object.values(dailyRooms[selectedDayIndex]) : []);

  // Calculate required linens for rooms that are NOT limpo
  const roomsToClean = currentRooms.filter(r => r.condition !== 'limpo');
  
  // Group by floor
  const floors = Array.from(new Set(roomsToClean.map(r => r.floor))).sort((a: number, b: number) => a - b);
  
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

  const chegadas = currentRooms.filter(r => r.status === 'chegada');

  // Group chegadas by floor
  const chegadasFloors = Array.from(new Set(chegadas.map(r => r.floor))).sort((a: number, b: number) => a - b);

  const handleConfirmChegada = (roomId: string) => {
    updateRoom(roomId, { linenDelivered: true });
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Rouparia</h2>
        <div className="flex items-center gap-2">
          <select 
            value={selectedDayIndex}
            onChange={(e) => setSelectedDayIndex(parseInt(e.target.value))}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value={0}>Hoje</option>
            {dailyRooms.length > 1 && dailyRooms.slice(1).map((_, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {idx === 0 ? 'Amanhã' : `Dia ${idx + 2}`}
              </option>
            ))}
          </select>
        </div>
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
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Chegadas Previstas</h3>
          {chegadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-8 text-center text-gray-500 dark:text-gray-400">
              <BedDouble size={48} className="mb-4 opacity-20" />
              <p>Nenhuma chegada prevista para este dia.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {chegadasFloors.map(floor => {
                const floorChegadas = chegadas.filter(r => r.floor === floor);
                return (
                  <div key={floor} className="space-y-3">
                    <h4 className="font-bold text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider flex items-center gap-2">
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                      Andar {floor}
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {floorChegadas.map(room => (
                        <div 
                          key={room.id} 
                          className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl border transition-all duration-300 shadow-sm ${
                            room.linenDelivered 
                              ? 'bg-emerald-50/50 border-emerald-300 dark:bg-emerald-900/10 dark:border-emerald-800' 
                              : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-xl font-black text-gray-900 dark:text-gray-50 leading-none">
                              {room.id}
                            </div>
                            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              <Users size={10} /> {room.pax} pax
                            </div>
                          </div>

                          <div className="mt-3">
                            <button
                              onClick={() => updateRoom(room.id, { linenDelivered: !room.linenDelivered }, selectedDayIndex)}
                              className={clsx(
                                "flex h-10 w-10 items-center justify-center rounded-full transition-all active:scale-90 shadow-lg",
                                room.linenDelivered 
                                  ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                                  : "bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700"
                              )}
                            >
                              <CheckCircle2 size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
