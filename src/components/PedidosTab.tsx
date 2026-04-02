import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { Clock, CheckCircle2, AlertCircle, ClipboardList, XCircle, BellOff, BedDouble, Plus, X, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LogModal from './LogModal';

export default function PedidosTab({ user }: { user: any }) {
  const { orders, rooms, updateOrderStatus, packSizes, requestableItems, createOrder, swapRequests, approveSwap, rejectSwap } = useSocket();
  const [activeSubTab, setActiveSubTab] = useState<'pedidos' | 'enxoval' | 'trocas'>('pedidos');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [newOrderRoom, setNewOrderRoom] = useState('');
  const [newOrderItems, setNewOrderItems] = useState<{item: string, quantity: number}[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTarget, setLogTarget] = useState<any>(null);

  // Sort by newest first
  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Calculate required linens for rooms that are NOT limpo
  // Floor 200: 2 camas de casal (4 lençóis de casal)
  // Other floors: 2 camas de solteiro (4 lençóis de solteiro) + 1 cama de casal (2 lençóis de casal)
  // All rooms: 5 fronhas
  const roomsToClean = rooms.filter(r => r.condition !== 'limpo');
  
  let totalLencolCasal = 0;
  let totalLencolSolteiro = 0;
  let totalFronhas = 0;

  roomsToClean.forEach(room => {
    totalFronhas += 5;
    if (room.floor === 200) {
      totalLencolCasal += 4; // 2 beds * 2 linens
    } else {
      totalLencolSolteiro += 4; // 2 beds * 2 linens
      totalLencolCasal += 2; // 1 bed * 2 linens
    }
  });

  const handleAddItemToNewOrder = (itemName: string) => {
    const existingItem = newOrderItems.find(i => i.item === itemName);
    if (existingItem) {
      setNewOrderItems(newOrderItems.map(i => i.item === itemName ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setNewOrderItems([...newOrderItems, { item: itemName, quantity: 1 }]);
    }
  };

  const handleRemoveItemFromNewOrder = (itemName: string) => {
    const existingItem = newOrderItems.find(i => i.item === itemName);
    if (existingItem && existingItem.quantity > 1) {
      setNewOrderItems(newOrderItems.map(i => i.item === itemName ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setNewOrderItems(newOrderItems.filter(i => i.item !== itemName));
    }
  };

  const handleSubmitNewOrder = () => {
    if (newOrderRoom && newOrderItems.length > 0) {
      createOrder(newOrderRoom, newOrderItems);
      setIsCreatingOrder(false);
      setNewOrderRoom('');
      setNewOrderItems([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Gestão de Pedidos</h2>
        {activeSubTab === 'pedidos' && (
          <button
            onClick={() => setIsCreatingOrder(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700 shadow-sm"
          >
            <Plus size={16} /> Novo Pedido
          </button>
        )}
      </div>

      <div className="flex rounded-xl bg-gray-200 dark:bg-gray-700 p-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('pedidos')}
          className={`flex-1 shrink-0 min-w-max whitespace-nowrap rounded-lg py-2 px-4 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'pedidos' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-gray-50'
          }`}
        >
          Pedidos de Camareiras
        </button>
        <button
          onClick={() => setActiveSubTab('enxoval')}
          className={`flex-1 shrink-0 min-w-max whitespace-nowrap rounded-lg py-2 px-4 text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'enxoval' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-gray-50'
          }`}
        >
          Resumo de Enxoval
        </button>
        {user.role === 'gestor' && (
          <button
            onClick={() => setActiveSubTab('trocas')}
            className={`flex-1 shrink-0 min-w-max whitespace-nowrap rounded-lg py-2 px-4 text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'trocas' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-gray-50'
            }`}
          >
            Trocas de Chegada
            {swapRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/300 px-2 py-0.5 text-xs text-white">
                {swapRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        )}
      </div>

      {isCreatingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50">Novo Pedido</h3>
              <button onClick={() => setIsCreatingOrder(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-200">Quarto</label>
                <select 
                  value={newOrderRoom}
                  onChange={(e) => setNewOrderRoom(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-gray-900 dark:text-gray-50 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Selecione um quarto...</option>
                  {rooms.sort((a, b) => Number(a.id) - Number(b.id)).map(room => (
                    <option key={room.id} value={room.id}>Quarto {room.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Itens Disponíveis</label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                  {(requestableItems || []).map(item => (
                    <button
                      key={item}
                      onClick={() => handleAddItemToNewOrder(item)}
                      className="rounded-full border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:bg-blue-900/50"
                    >
                      + {item}
                    </button>
                  ))}
                  {(!requestableItems || requestableItems.length === 0) && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic w-full">Nenhum item cadastrado nas configurações.</p>
                  )}
                </div>
              </div>

              {newOrderItems.length > 0 && (
                <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-200">Itens Selecionados</h4>
                  <ul className="space-y-2">
                    {newOrderItems.map(item => (
                      <li key={item.item} className="flex items-center justify-between">
                        <span className="text-sm text-gray-800 dark:text-gray-100">{item.item}</span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleRemoveItemFromNewOrder(item.item)}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300"
                          >-</button>
                          <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => handleAddItemToNewOrder(item.item)}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200"
                          >+</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleSubmitNewOrder}
                disabled={!newOrderRoom || newOrderItems.length === 0}
                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'enxoval' ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <div className="mb-4 sm:mb-6 flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <BedDouble size={24} className="sm:w-7 sm:h-7" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Enxoval Necessário</h3>
          </div>
          
          <p className="mb-4 sm:mb-6 text-sm text-gray-600 dark:text-gray-300">
            Quantidade de enxoval necessária para finalizar todos os <strong>{roomsToClean.length}</strong> quartos que ainda não estão limpos.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 p-6 border border-blue-100 dark:border-blue-900/50">
              <span className="text-4xl font-black text-blue-700 dark:text-blue-300">{Math.ceil(totalLencolCasal / packSizes.lencolCasal)}</span>
              <span className="mt-2 text-sm font-bold text-blue-900 uppercase tracking-wider text-center">Pacotes de Casal</span>
              <span className="mt-1 text-xs text-blue-600 dark:text-blue-400 text-center">{totalLencolCasal} unidades ({packSizes.lencolCasal} un/pacote)</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 p-6 border border-emerald-100">
              <span className="text-4xl font-black text-emerald-700">{Math.ceil(totalLencolSolteiro / packSizes.lencolSolteiro)}</span>
              <span className="mt-2 text-sm font-bold text-emerald-900 uppercase tracking-wider text-center">Pacotes de Solteiro</span>
              <span className="mt-1 text-xs text-emerald-600 text-center">{totalLencolSolteiro} unidades ({packSizes.lencolSolteiro} un/pacote)</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 p-6 border border-purple-100">
              <span className="text-4xl font-black text-purple-700 dark:text-purple-300">{Math.ceil(totalFronhas / packSizes.fronhas)}</span>
              <span className="mt-2 text-sm font-bold text-purple-900 uppercase tracking-wider text-center">Pacotes de Fronhas</span>
              <span className="mt-1 text-xs text-purple-600 dark:text-purple-400 text-center">{totalFronhas} unidades ({packSizes.fronhas} un/pacote)</span>
            </div>
          </div>
          
          <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
            <p><strong>Regras aplicadas:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Andar 200:</strong> 4 lençóis de casal por quarto (confirmando: isso equivale a 2 pares de lençóis de casal por quarto).</li>
              <li><strong>Outros andares:</strong> 4 lençóis de solteiro (2 pares) + 2 lençóis de casal (1 par) por quarto.</li>
              <li><strong>Todos os quartos:</strong> 5 fronhas.</li>
            </ul>
            <p className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2"><strong>Embalagens (Configurável):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Lençóis de Casal: Pacotes com {packSizes.lencolCasal} unidades.</li>
              <li>Lençóis de Solteiro: Pacotes com {packSizes.lencolSolteiro} unidades.</li>
              <li>Fronhas: Pacotes com {packSizes.fronhas} unidades.</li>
            </ul>
          </div>
        </div>
      ) : activeSubTab === 'trocas' && user.role === 'gestor' ? (
        <div className="space-y-4">
          {swapRequests.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 text-center text-gray-500 dark:text-gray-400">
              <ClipboardList size={48} className="mb-4 opacity-20" />
              <p>Nenhuma solicitação de troca de chegada.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...swapRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(req => (
                <div key={req.id} className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {req.oldRoomId} &rarr; {req.newRoomId}
                      </span>
                      <button 
                        onClick={() => { setLogTarget(req); setShowLogModal(true); }}
                        className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <History size={14} />
                      </button>
                    </div>
                    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' : 
                      req.status === 'approved' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                    }`}>
                      {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-2 mb-4">
                    <p className="text-sm text-gray-700 dark:text-gray-200"><strong>Motivo:</strong> {req.reason || <span className="text-gray-400 italic">Não informado</span>}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Solicitado por: {req.requestedBy}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(req.createdAt), "dd/MM HH:mm", { locale: ptBR })}</p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="mt-auto flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => approveSwap(req.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-100 dark:bg-green-900/50 py-2 text-xs font-bold text-green-700 dark:text-green-300 hover:bg-green-200 transition-colors"
                      >
                        <CheckCircle2 size={14} /> Aprovar
                      </button>
                      <button
                        onClick={() => rejectSwap(req.id)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-100 dark:bg-red-900/50 py-2 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors"
                      >
                        <XCircle size={14} /> Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {sortedOrders.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 text-center text-gray-500 dark:text-gray-400">
              <ClipboardList size={48} className="mb-4 opacity-20" />
              <p>Nenhum pedido de enxoval registrado.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedOrders.map(order => {
                const room = rooms.find(r => r.id === order.roomId);
                const isDnd = room?.dnd;

                return (
                  <div key={order.id} className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 font-bold text-blue-700 dark:text-blue-300">
                          {order.roomId}
                        </span>
                        <button 
                          onClick={() => { setLogTarget(order); setShowLogModal(true); }}
                          className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <History size={14} />
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(order.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    
                    <ul className="mb-4 flex-1 space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-200">{item.item}</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-50">{item.quantity} un</span>
                        </li>
                      ))}
                    </ul>

                    {order.status === 'pendente' && (
                      <div className="mt-auto flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                        {isDnd ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 p-2 text-xs font-medium text-red-700 dark:text-red-300 border border-red-100">
                              <BellOff size={14} /> Quarto em Não Perturbe
                            </div>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'nao_perturbe')}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700 transition-colors"
                            >
                              Marcar como Não Perturbe
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateOrderStatus(order.id, 'entregue')}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-100 dark:bg-green-900/50 py-2 text-xs font-bold text-green-700 dark:text-green-300 hover:bg-green-200 transition-colors"
                              >
                                <CheckCircle2 size={14} /> Entregue
                              </button>
                              <button
                                onClick={() => updateOrderStatus(order.id, 'nao_entregue')}
                                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-100 dark:bg-red-900/50 py-2 text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-200 transition-colors"
                              >
                                <XCircle size={14} /> Não Entregue
                              </button>
                            </div>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'nao_perturbe')}
                              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:bg-gray-700 transition-colors"
                            >
                              <BellOff size={14} /> Hóspede em Não Perturbe
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {showLogModal && logTarget && (
        <LogModal 
          target={logTarget} 
          onClose={() => { setShowLogModal(false); setLogTarget(null); }} 
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pendente: { color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200', icon: <Clock size={12} />, label: 'Pendente' },
    entregue: { color: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200', icon: <CheckCircle2 size={12} />, label: 'Entregue' },
    nao_entregue: { color: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200', icon: <XCircle size={12} />, label: 'Não Entregue' },
    nao_perturbe: { color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100', icon: <BellOff size={12} />, label: 'Não Perturbe' },
  };

  const c = config[status as keyof typeof config] || config.pendente;

  return (
    <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}
