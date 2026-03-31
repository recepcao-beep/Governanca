import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { BedDouble, Sparkles, Trash2, User, Calendar, BellOff, CheckCircle2, ArrowLeft, Layers, Check, Filter } from 'lucide-react';
import clsx from 'clsx';

export default function ApartamentosTab({ user }: { user: any }) {
  const { rooms, updateRoom, createOrder } = useSocket();
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [showArrumacaoModal, setShowArrumacaoModal] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'ocupado' | 'limpo' | 'sujo' | 'saida' | 'vestir' | 'chegada'>('todos');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const floors = [200, 300, 400, 500, 600, 700];
  const allowedFloors = user.role === 'gestor' ? floors : user.floors || [];

  if (allowedFloors.length === 0) {
    return <div className="p-4 text-center text-gray-500">Nenhum andar atribuído a você.</div>;
  }

  const handleOpenArrumacao = (room: any) => {
    setSelectedRoom(room);
    setShowArrumacaoModal(true);
  };

  return (
    <div className="flex flex-col h-full relative">
      {selectedFloor === null ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Selecione um Andar</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {allowedFloors.map(floor => {
              const floorRooms = rooms.filter(r => r.floor === floor);
              const dirtyRooms = floorRooms.filter(r => r.condition === 'sujo').length;
              
              return (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className="flex flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition-all hover:bg-blue-50 hover:shadow-md active:scale-95"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Layers size={24} />
                  </div>
                  <span className="text-lg font-bold text-gray-800">Andar {floor}</span>
                  <span className="mt-1 text-xs font-medium text-gray-500">{floorRooms.length} Quartos</span>
                  {dirtyRooms > 0 && (
                    <span className="mt-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
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
          <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-gray-50/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedFloor(null);
                  setFilter('todos');
                  setShowFilterMenu(false);
                }}
                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-sm border transition-colors",
                    filter !== 'todos' ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Filter size={16} />
                  <span className="hidden sm:inline">Filtrar</span>
                </button>
                
                {showFilterMenu && (
                  <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                    <FilterOption label="Todos" value="todos" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Ocupados" value="ocupado" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Chegadas" value="chegada" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Saídas (Check-out)" value="saida" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Limpos" value="limpo" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Sujos" value="sujo" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                    <FilterOption label="Vestir" value="vestir" current={filter} onSelect={(v) => { setFilter(v as any); setShowFilterMenu(false); }} />
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Andar {selectedFloor}</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 pt-2">
            {rooms
              .filter(r => r.floor === selectedFloor)
              .filter(r => {
                if (filter === 'todos') return true;
                if (filter === 'ocupado') return r.status === 'ocupado';
                if (filter === 'saida') return r.status === 'saida';
                if (filter === 'chegada') return r.status === 'chegada';
                if (filter === 'limpo') return r.condition === 'limpo';
                if (filter === 'sujo') return r.condition === 'sujo';
                if (filter === 'vestir') return r.condition === 'vestir';
                return true;
              })
              .map(room => (
              <RoomCard
                key={room.id}
                room={room}
                onUpdate={(updates) => updateRoom(room.id, updates)}
                onOpenArrumacao={() => handleOpenArrumacao(room)}
              />
            ))}
          </div>
        </div>
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
    </div>
  );
}

function RoomCard({ room, onUpdate, onOpenArrumacao }: { key?: React.Key; room: any; onUpdate: (updates: any) => void; onOpenArrumacao: () => void }) {
  const [showConditionMenu, setShowConditionMenu] = useState(false);

  const bgColors = {
    vago: 'bg-white border-gray-200 text-gray-800',
    interditado: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    saida: 'bg-red-50 border-red-200 text-red-900',
    chegada: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    ocupado: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const badgeColors = {
    vago: 'bg-gray-100 text-gray-600',
    interditado: 'bg-yellow-200 text-yellow-800',
    saida: 'bg-red-200 text-red-800',
    chegada: 'bg-emerald-200 text-emerald-800',
    ocupado: 'bg-blue-200 text-blue-800',
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
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100 border border-red-100 transition-colors"
          >
            <BellOff size={14} /> Remover Não Perturbe
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
              'flex w-full items-center justify-center gap-2 rounded-lg py-2 transition-colors border',
              room.arrumacao 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            )}
          >
            {room.arrumacao ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
            <span className="text-xs font-semibold">{room.arrumacao ? 'Arrumado' : 'Arrumação'}</span>
          </button>
          
          {isSecondNightOrMore() && (
            <button
              onClick={() => onUpdate({ trocaEnxoval: !room.trocaEnxoval })}
              className={clsx(
                'flex w-full items-center justify-center gap-2 rounded-lg py-2 transition-colors border',
                room.trocaEnxoval 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              )}
            >
              {room.trocaEnxoval ? <CheckCircle2 size={16} /> : <BedDouble size={16} />}
              <span className="text-xs font-semibold">{room.trocaEnxoval ? 'Enxoval Trocado' : 'Troca de Enxoval'}</span>
            </button>
          )}
          
          {!room.arrumacao && (
            <button 
              onClick={() => onUpdate({ dnd: true })}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-50 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
            >
              <BellOff size={12} /> Ativar Não Perturbe
            </button>
          )}
        </div>
      );
    }
  } else if (room.status === 'vago' || room.status === 'chegada') {
    const conditionColors = {
      sujo: 'bg-red-800 text-white hover:bg-red-700 border-red-900',
      limpo: 'bg-green-600 text-white hover:bg-green-500 border-green-700',
      vestir: 'bg-blue-600 text-white hover:bg-blue-500 border-blue-700'
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
            'flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-colors shadow-sm border',
            conditionColors[currentCondition as keyof typeof conditionColors] || conditionColors.sujo
          )}
        >
          {conditionIcons[currentCondition as keyof typeof conditionIcons]}
          <span className="uppercase tracking-wider">{conditionLabels[currentCondition as keyof typeof conditionLabels]}</span>
        </button>

        {showConditionMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowConditionMenu(false)} />
            <div className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-gray-200 bg-white p-2 shadow-xl z-20">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { onUpdate({ condition: 'sujo' }); setShowConditionMenu(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} /> Sujo
                </button>
                <button
                  onClick={() => { onUpdate({ condition: 'vestir' }); setShowConditionMenu(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
                >
                  <BedDouble size={16} /> Vestir
                </button>
                <button
                  onClick={() => { onUpdate({ condition: 'limpo' }); setShowConditionMenu(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-50"
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
      <div className="mt-2 flex justify-center rounded-lg bg-red-50 p-2.5 text-xs font-bold text-red-700 text-center border border-red-100">
        Check-out
      </div>
    );
  } else if (room.status === 'interditado') {
    controls = (
      <div className="mt-2 flex justify-center rounded-lg bg-yellow-50 p-2.5 text-xs font-medium text-yellow-800 text-center border border-yellow-100">
        Interditado / Manutenção
      </div>
    );
  }

  return (
    <div className={clsx('relative flex flex-col justify-between rounded-xl border p-3 shadow-sm transition-all', bgColors[room.status as keyof typeof bgColors])}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <span className="text-2xl font-bold tracking-tight">{room.id}</span>
        <div className="flex flex-col items-end gap-1">
          <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', badgeColors[room.status as keyof typeof badgeColors])}>
            {room.status}
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
        active ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:bg-white/50 hover:text-gray-700'
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
        isSelected ? "bg-blue-50 font-bold text-blue-700" : "text-gray-700 hover:bg-gray-50"
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-800">Arrumação - Quarto {room.id}</h3>
        
        <div className="mb-4 rounded-lg bg-gray-50 p-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Quais itens foram retirados do quarto?</label>
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-gray-300 p-2 text-sm outline-none"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
            >
              {enxovalOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <input
              type="number"
              min="1"
              className="w-20 rounded-lg border border-gray-300 p-2 text-center text-sm outline-none"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            <button onClick={handleAdd} className="rounded-lg bg-blue-100 px-3 text-blue-600 font-bold hover:bg-blue-200">+</button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-2 text-sm font-semibold text-gray-600">Itens Retirados:</h4>
            <ul className="space-y-2">
              {items.map((i, idx) => (
                <li key={idx} className="flex justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm">
                  <span>{i.item}</span>
                  <span className="font-bold">{i.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 py-3 font-semibold text-gray-600 hover:bg-gray-200">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">Finalizar Arrumação</button>
        </div>
      </div>
    </div>
  );
}
