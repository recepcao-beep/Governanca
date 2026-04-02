import React, { useState, useRef } from 'react';
import { useSocket } from '../SocketContext';
import { BedDouble, Sparkles, Trash2, User, Calendar, BellOff, CheckCircle2, ArrowLeft, Home, Check, Filter, ArrowRightLeft, Search, Camera, X, History } from 'lucide-react';
import clsx from 'clsx';
import LogModal from './LogModal';

export default function ApartamentosTab({ user }: { user: any }) {
  const { rooms, dailyRooms, updateRoom, createOrder, requestSwap, createMaintenance, swapRooms, swapRequests } = useSocket();
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [showArrumacaoModal, setShowArrumacaoModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTarget, setLogTarget] = useState<any>(null);
  const [filter, setFilter] = useState<'todos' | 'ocupado' | 'limpo' | 'sujo' | 'saida' | 'vestir' | 'chegada' | 'saida_chegada'>('todos');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const floors = [200, 300, 400, 500, 600, 700];
  const allowedFloors = user.role === 'gestor' ? floors : user.floors || [];

  const currentDailyRooms = dailyRooms[selectedDayIndex] || {};
  const displayRooms = selectedDayIndex === 0 ? rooms : Object.values(currentDailyRooms);

  if (allowedFloors.length === 0) {
    return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Nenhum andar atribuído a você.</div>;
  }

  const handleOpenArrumacao = (room: any) => {
    setSelectedRoom(room);
    setShowArrumacaoModal(true);
  };

  return (
    <div className="flex flex-col relative">
      {selectedFloor === null ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Selecione um Andar</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {allowedFloors.map(floor => {
              const floorRooms = rooms.filter(r => r.floor === floor);
              const dirtyRooms = floorRooms.filter(r => r.condition === 'sujo').length;
              const arrivals = floorRooms.filter(r => r.status === 'chegada' || r.status === 'saida_chegada').length;
              const departures = floorRooms.filter(r => r.status === 'saida' || r.status === 'saida_chegada').length;
              const occupied = floorRooms.filter(r => r.status === 'ocupado').length;
              
              return (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className="flex flex-col items-center justify-center rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:shadow-md active:scale-95"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    <Home size={24} />
                  </div>
                  <span className="text-lg font-bold text-gray-800 dark:text-gray-100">Andar {floor}</span>
                  
                  <div className="mt-2 flex flex-wrap justify-center gap-1">
                    <span className="rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      {arrivals} Cheg.
                    </span>
                    <span className="rounded-md bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">
                      {departures} Saíd.
                    </span>
                    <span className="rounded-md bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      {occupied} Ocup.
                    </span>
                  </div>

                  {dirtyRooms > 0 && (
                    <span className="mt-2 rounded-full bg-red-100 dark:bg-red-900/50 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                      {dirtyRooms} Sujos
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-gray-50 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedFloor(null);
                  setFilter('todos');
                  setShowFilterMenu(false);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 hover:text-gray-900 dark:text-gray-50 transition-colors"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              
              <button
                onClick={() => setShowSwapModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 hover:text-gray-900 dark:text-gray-50 transition-colors"
              >
                <ArrowRightLeft size={16} /> <span className="hidden sm:inline">Trocar Chegada</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium shadow-sm border transition-colors",
                    filter !== 'todos' ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 hover:text-gray-900 dark:text-gray-50"
                  )}
                >
                  <Filter size={16} />
                  <span className="hidden sm:inline">Filtrar</span>
                </button>
                
                {showFilterMenu && (
                  <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-lg z-20">
                    <FilterOption label="Todos" value="todos" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Ocupados" value="ocupado" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Chegadas" value="chegada" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Saídas (Check-out)" value="saida" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Saída com Chegada" value="saida_chegada" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Limpos" value="limpo" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Sujos" value="sujo" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Vestir" value="vestir" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-2">
                <Calendar size={16} className="text-gray-400" />
                <select 
                  value={selectedDayIndex}
                  onChange={(e) => setSelectedDayIndex(parseInt(e.target.value))}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {dailyRooms.map((_, idx) => (
                    <option key={idx} value={idx}>
                      {idx === 0 ? 'Hoje' : idx === 1 ? 'Amanhã' : `Dia +${idx}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100">Andar {selectedFloor}</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-2">
            {displayRooms
              .filter(r => r.floor === selectedFloor)
              .filter(r => {
                if (filter === 'todos') return true;
                if (filter === 'ocupado') return r.status === 'ocupado';
                if (filter === 'saida') return r.status === 'saida';
                if (filter === 'chegada') return r.status === 'chegada';
                if (filter === 'saida_chegada') return r.status === 'saida_chegada';
                if (filter === 'limpo') return r.condition === 'limpo';
                if (filter === 'sujo') return r.condition === 'sujo';
                if (filter === 'vestir') return r.condition === 'vestir';
                return true;
              })
              .map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onUpdate={(updates) => updateRoom(room.id, updates, selectedDayIndex)}
                onOpenArrumacao={() => handleOpenArrumacao(room)}
                onOpenLog={() => { setLogTarget(room); setShowLogModal(true); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && logTarget && (
        <LogModal 
          target={logTarget} 
          onClose={() => { setShowLogModal(false); setLogTarget(null); }} 
        />
      )}

      {/* Arrumação Modal */}
      {showArrumacaoModal && selectedRoom && (
        <ArrumacaoModal
          room={selectedRoom}
          onClose={() => setShowArrumacaoModal(false)}
          onSubmit={(items) => {
            if (items.length > 0) createOrder(selectedRoom.id, items);
            updateRoom(selectedRoom.id, { arrumacao: true });
            setShowArrumacaoModal(false);
          }}
        />
      )}

      {/* Swap Modal */}
      {showSwapModal && (
        <SwapModal
          rooms={rooms}
          allowedFloors={allowedFloors}
          user={user}
          swapRequests={swapRequests}
          onClose={() => setShowSwapModal(false)}
          onRequestSwap={(oldId, newId, reason, isMaintenance, photoUrl) => {
            requestSwap(oldId, newId, reason, user.email);
            if (isMaintenance) {
              createMaintenance(oldId, `Manutenção solicitada via troca de chegada: ${reason}`, photoUrl, user.email);
            }
          }}
        />
      )}
    </div>
  );
}

function RoomCard({ room, onUpdate, onOpenArrumacao, onOpenLog }: { key?: React.Key; room: any; onUpdate: (updates: any) => void; onOpenArrumacao: () => void; onOpenLog: () => void }) {
  const [showConditionMenu, setShowConditionMenu] = useState(false);

  const bgColors = {
    vago: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100',
    interditado: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 text-yellow-900',
    saida: 'bg-red-50 dark:bg-red-900/30 border-red-200 text-red-900',
    chegada: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    ocupado: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50 text-blue-900',
    saida_chegada: 'bg-purple-50 border-purple-300 text-purple-900 border-2 shadow-md',
  };

  const badgeColors = {
    vago: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    interditado: 'bg-yellow-200 text-yellow-800 dark:text-yellow-200',
    saida: 'bg-red-200 text-red-800 dark:text-red-200',
    chegada: 'bg-emerald-200 text-emerald-800',
    ocupado: 'bg-blue-200 text-blue-800 dark:text-blue-200',
    saida_chegada: 'bg-purple-200 text-purple-800',
  };

  const isSecondNightOrMore = () => {
    if (!room.arrivalDate) return false;
    // arrivalDate is in YYYY-MM-DD format
    const [year, month, day] = room.arrivalDate.split('-').map(Number);
    if (!year || !month || !day) return false;
    
    const arrival = new Date(year, month - 1, day);
    const today = new Date();
    arrival.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - arrival.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // If diffDays >= 2, it means they have stayed at least 2 nights.
    // Example: Arrive 1st. On the 2nd (diff 1), normal cleaning. On the 3rd (diff 2), linen change.
    return diffDays >= 2;
  };

  let controls = null;

  if (room.status === 'ocupado') {
    if (room.dnd) {
      controls = (
        <div className="mt-2">
          <button 
            onClick={() => onUpdate({ dnd: false })}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 py-2 px-1 text-[11px] sm:text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:bg-red-900/50 border border-red-100 transition-colors text-center"
          >
            <BellOff size={14} className="flex-shrink-0" /> Remover Não Perturbe
          </button>
        </div>
      );
    } else {
      controls = (
        <div className="mt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              if (room.arrumacao) {
                onUpdate({ arrumacao: false });
              } else {
                onOpenArrumacao();
              }
            }}
            className={clsx(
              'flex w-full items-center justify-center gap-1.5 rounded-lg py-2 px-1 transition-colors border text-center',
              room.arrumacao 
                ? 'bg-green-50 dark:bg-green-900/30 border-green-200 text-green-700 dark:text-green-300' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-900'
            )}
          >
            {room.arrumacao ? <CheckCircle2 size={14} className="flex-shrink-0" /> : <Sparkles size={14} className="flex-shrink-0" />}
            <span className="text-[11px] sm:text-xs font-semibold whitespace-normal leading-tight">{room.arrumacao ? 'Arrumado' : 'Arrumação'}</span>
          </button>
          
          {isSecondNightOrMore() && (
            <button
              onClick={() => onUpdate({ trocaEnxoval: !room.trocaEnxoval })}
              className={clsx(
                'flex w-full items-center justify-center gap-1.5 rounded-lg py-2 px-1 transition-colors border text-center',
                room.trocaEnxoval 
                  ? 'bg-green-50 dark:bg-green-900/30 border-green-200 text-green-700 dark:text-green-300' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-900'
              )}
            >
              {room.trocaEnxoval ? <CheckCircle2 size={14} className="flex-shrink-0" /> : <BedDouble size={14} className="flex-shrink-0" />}
              <span className="text-[11px] sm:text-xs font-semibold whitespace-normal leading-tight">{room.trocaEnxoval ? 'Enxoval Trocado' : 'Troca de Enxoval'}</span>
            </button>
          )}
          
          {!room.arrumacao && (
            <button 
              onClick={() => onUpdate({ dnd: true })}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-50 dark:bg-gray-900 py-1.5 px-1 text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors text-center"
            >
              <BellOff size={12} className="flex-shrink-0" /> Ativar Não Perturbe
            </button>
          )}
        </div>
      );
    }
  } else if (room.status === 'vago' || room.status === 'chegada' || room.status === 'saida_chegada') {
    const conditionColors = {
      sujo: 'bg-red-800 text-white hover:bg-red-700 border-red-900',
      limpo: 'bg-green-600 text-white hover:bg-green-50 dark:bg-green-900/300 border-green-700',
      vestir: 'bg-blue-600 text-white hover:bg-blue-50 dark:bg-blue-900/300 border-blue-700'
    };
    
    const conditionIcons = {
      sujo: <Trash2 size={16} />,
      limpo: <Sparkles size={16} />,
      vestir: <BedDouble size={16} />
    };

    const conditionLabels = {
      sujo: 'Sujo',
      limpo: 'Limpo',
      vestir: 'Vestir'
    };

    const currentCondition = room.condition || 'sujo';

    controls = (
      <div className="mt-2 relative">
        <button
          onClick={() => setShowConditionMenu(!showConditionMenu)}
          className={clsx(
            'flex w-full items-center justify-center gap-1.5 rounded-lg py-2 px-1 text-[11px] sm:text-xs font-bold transition-colors shadow-sm border text-center',
            conditionColors[currentCondition as keyof typeof conditionColors] || conditionColors.sujo
          )}
        >
          <div className="flex-shrink-0">{conditionIcons[currentCondition as keyof typeof conditionIcons]}</div>
          <span className="uppercase tracking-wider whitespace-normal leading-tight">{conditionLabels[currentCondition as keyof typeof conditionLabels]}</span>
        </button>

        {showConditionMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowConditionMenu(false)} />
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-xl z-20">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { onUpdate({ condition: 'sujo' }); setShowConditionMenu(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-700 dark:text-red-300 hover:bg-red-50 dark:bg-red-900/30"
                >
                  <Trash2 size={16} /> Sujo
                </button>
                <button
                  onClick={() => { onUpdate({ condition: 'vestir' }); setShowConditionMenu(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:bg-blue-900/30"
                >
                  <BedDouble size={16} /> Vestir
                </button>
                <button
                  onClick={() => { onUpdate({ condition: 'limpo' }); setShowConditionMenu(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-green-700 dark:text-green-300 hover:bg-green-50 dark:bg-green-900/30"
                >
                  <Sparkles size={16} /> Limpo
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  } else if (room.status === 'saida') {
    controls = (
      <div className="mt-2 flex justify-center rounded-lg bg-red-50 dark:bg-red-900/30 p-2.5 text-xs font-bold text-red-700 dark:text-red-300 text-center border border-red-100">
        Check-out
      </div>
    );
  } else if (room.status === 'interditado') {
    controls = (
      <div className="mt-2 flex justify-center rounded-lg bg-yellow-50 dark:bg-yellow-900/30 p-2.5 text-xs font-medium text-yellow-800 dark:text-yellow-200 text-center border border-yellow-100">
        Interditado / Manutenção
      </div>
    );
  }

  return (
    <div className={clsx('relative flex flex-col justify-between rounded-xl border p-3 shadow-sm transition-all', bgColors[room.status as keyof typeof bgColors])}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight">{room.id}</span>
          <button 
            onClick={onOpenLog}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 transition-colors"
            title="Ver Histórico"
          >
            <History size={14} />
          </button>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={clsx('text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-center', badgeColors[room.status as keyof typeof badgeColors])}>
            {room.status === 'saida_chegada' ? 'SAIDA COM CHEGADA' : room.status}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="my-2 flex flex-col gap-1 text-xs opacity-80 font-medium">
        {['ocupado', 'chegada'].includes(room.status) && room.pax > 0 && (
          <div className="flex items-center gap-1">
            <User size={12} /> {room.pax} Pax
          </div>
        )}
        {['ocupado', 'chegada'].includes(room.status) && room.departureDate && (
          <div className="flex items-center gap-1">
            <Calendar size={12} /> Saída: {room.departureDate}
          </div>
        )}
      </div>

      {/* Controls */}
      {controls}
    </div>
  );
}

function ConditionBtn({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-1 flex-col items-center justify-center rounded-md py-1.5 transition-all',
        active ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-700' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:bg-gray-800/50 hover:text-gray-700 dark:text-gray-200'
      )}
    >
      {icon}
      <span className="mt-0.5 text-[9px] font-bold uppercase">{label}</span>
    </button>
  );
}

function FilterOption({ label, value, current, onSelect }: { label: string; value: string; current: string; onSelect: (v: string) => void }) {
  const isSelected = current === value;
  return (
    <button
      onClick={() => onSelect(value)}
      className={clsx(
        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
        isSelected ? "bg-blue-50 dark:bg-blue-900/30 font-bold text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-900"
      )}
    >
      {label}
      {isSelected && <Check size={16} />}
    </button>
  );
}

function ArrumacaoModal({ room, onClose, onSubmit }: { room: any; onClose: () => void; onSubmit: (items: any[]) => void }) {
  const [items, setItems] = useState<{ item: string; quantity: number }[]>([]);
  const [selectedItem, setSelectedItem] = useState('Lençol');
  const [quantity, setQuantity] = useState(1);

  const enxovalOptions = ['Lençol', 'Fronha', 'Toalha de Banho', 'Toalha de Rosto', 'Piso'];

  const handleAdd = () => {
    const existing = items.find(i => i.item === selectedItem);
    if (existing) {
      setItems(items.map(i => i.item === selectedItem ? { ...i, quantity: i.quantity + quantity } : i));
    } else {
      setItems([...items, { item: selectedItem, quantity }]);
    }
    setQuantity(1);
  };

  const handleSubmit = () => {
    let finalItems = [...items];
    // Se o usuário não adicionou nenhum item na lista, mas tem um selecionado com quantidade > 0, adiciona automaticamente
    if (items.length === 0 && quantity > 0) {
      finalItems = [{ item: selectedItem, quantity }];
    }
    onSubmit(finalItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto mx-auto">
        <h3 className="mb-4 text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Arrumação - Quarto {room.id}</h3>
        
        <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-900 p-3 sm:p-4">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">Quais itens foram retirados do quarto?</label>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm outline-none"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              {enxovalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <input
              type="number"
              min="1"
              className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-center text-sm outline-none"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            <button onClick={handleAdd} className="rounded-lg bg-blue-100 dark:bg-blue-900/50 px-3 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-200">+</button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-300">Itens Retirados:</h4>
            <ul className="space-y-2">
              {items.map((i, idx) => (
                <li key={idx} className="flex justify-between rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm">
                  <span>{i.item}</span>
                  <span className="font-bold">{i.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">Finalizar Arrumação</button>
        </div>
      </div>
    </div>
  );
}

function SwapModal({ rooms, allowedFloors, user, swapRequests, onClose, onRequestSwap }: { rooms: any[], allowedFloors: number[], user: any, swapRequests: any[], onClose: () => void, onRequestSwap: (oldId: string, newId: string, reason: string, isMaintenance: boolean, photoUrl?: string) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedOldRoom, setSelectedOldRoom] = useState<any | null>(null);
  const [selectedNewRoom, setSelectedNewRoom] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reason, setReason] = useState('');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingSwapNewRoomIds = swapRequests.filter(req => req.status === 'pending').map(req => req.newRoomId);
  const pendingSwapOldRoomIds = swapRequests.filter(req => req.status === 'pending').map(req => req.oldRoomId);
  const chegadaRooms = rooms.filter(r => allowedFloors.includes(r.floor) && r.status === 'chegada' && !pendingSwapOldRoomIds.includes(r.id));
  
  // Restrict suggestions to the same floor
  const vagoRooms = rooms.filter(r => 
    allowedFloors.includes(r.floor) && 
    r.status === 'vago' && 
    (!selectedOldRoom || r.floor === selectedOldRoom.floor) &&
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !pendingSwapNewRoomIds.includes(r.id)
  );

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    let photoUrl = undefined;
    if (isMaintenance && photoBase64) {
      setIsUploading(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            imageBase64: photoBase64,
            filename: `manutencao_troca_${selectedOldRoom?.id}_${Date.now()}.jpg`
          })
        });
        const data = await res.json();
        if (data.url) {
          photoUrl = data.url;
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
      setIsUploading(false);
    }
    onRequestSwap(selectedOldRoom.id, selectedNewRoom.id, reason, isMaintenance, photoUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-xl flex flex-col max-h-[90vh] mx-auto">
        <h3 className="mb-4 text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Trocar Chegada</h3>
        
        {step === 1 ? (
          <>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Selecione a chegada que deseja trocar:</p>
            <div className="flex-1 overflow-y-auto space-y-2">
              {chegadaRooms.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma chegada encontrada nos seus andares.</p>
              ) : (
                chegadaRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => { setSelectedOldRoom(room); setStep(2); }}
                    className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                  >
                    <span className="font-bold text-lg">{room.id}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-bold uppercase">Chegada</span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : step === 2 ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <button onClick={() => setStep(1)} className="p-1 rounded-lg hover:bg-gray-100 dark:bg-gray-800"><ArrowLeft size={20} /></button>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Trocando <span className="font-bold text-gray-900 dark:text-gray-50">{selectedOldRoom?.id}</span> por:
              </p>
            </div>
            
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Pesquisar apartamento vago..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {vagoRooms.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">Nenhum apartamento vago encontrado.</p>
              ) : (
                vagoRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => {
                      setSelectedNewRoom(room);
                      setStep(3);
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-3 hover:bg-blue-50 dark:bg-blue-900/30 hover:border-blue-200 dark:border-blue-800/50 transition-colors"
                  >
                    <span className="font-bold text-lg">{room.id}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full font-bold uppercase">Vago</span>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <button onClick={() => setStep(2)} className="p-1 rounded-lg hover:bg-gray-100 dark:bg-gray-800"><ArrowLeft size={20} /></button>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Confirmar troca do <span className="font-bold text-gray-900 dark:text-gray-50">{selectedOldRoom?.id}</span> pelo <span className="font-bold text-gray-900 dark:text-gray-50">{selectedNewRoom?.id}</span>
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Motivo da Troca (Opcional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Quarto com mofo, ar condicionado quebrado..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  rows={3}
                />
              </div>
              
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:bg-gray-900 transition-colors">
                <input
                  type="checkbox"
                  checked={isMaintenance}
                  onChange={(e) => setIsMaintenance(e.target.checked)}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">O motivo é um problema de manutenção? (Gerar pedido)</span>
              </label>

              {isMaintenance && (
                <div className="pt-2">
                  <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-200">Foto do Problema (Opcional)</label>
                  {photoBase64 ? (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={photoBase64} alt="Preview" className="w-full h-32 object-cover" />
                      <button 
                        onClick={() => setPhotoBase64(null)}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900 hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                      <Camera size={24} />
                      <span className="text-sm font-medium">Tirar foto ou escolher da galeria</span>
                    </button>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    ref={fileInputRef}
                    onChange={handlePhotoCapture}
                    className="hidden" 
                  />
                </div>
              )}
            </div>
            
            <div className="mt-6 flex gap-3">
              <button onClick={onClose} disabled={isUploading} className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 disabled:opacity-50">Cancelar</button>
              <button 
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Enviando...
                  </>
                ) : (
                  'Sugerir Troca'
                )}
              </button>
            </div>
          </>
        )}
        
        {step !== 3 && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={onClose} className="w-full rounded-xl bg-gray-100 dark:bg-gray-800 py-3 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}
