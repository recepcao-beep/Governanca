import React, { useState } from 'react';
import { useSocket } from '../SocketContext';
import { AlertTriangle, FileSpreadsheet, CheckCircle2, XCircle, RefreshCw, X, Package, ListPlus } from 'lucide-react';

export default function ConfiguracoesTab({ user }: { user: any }) {
  const { syncStatus, rooms, deleteRoom, packSizes, updatePackSizes, requestableItems, updateRequestableItems } = useSocket();
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  
  const [localPackSizes, setLocalPackSizes] = useState(packSizes);
  const [isEditingPacks, setIsEditingPacks] = useState(false);

  const [localItems, setLocalItems] = useState<string[]>(requestableItems || []);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  if (user.role !== 'gestor') {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-gray-500 dark:text-gray-400">
        <AlertTriangle size={48} className="mb-4 opacity-20 text-yellow-500" />
        <p>Apenas gestores têm acesso às configurações.</p>
      </div>
    );
  }

  const handleSavePackSizes = () => {
    updatePackSizes(localPackSizes);
    setIsEditingPacks(false);
  };

  const handleSaveItems = () => {
    updateRequestableItems(localItems);
    setIsEditingItems(false);
  };

  const handleAddItem = () => {
    if (newItemName.trim() && !localItems.includes(newItemName.trim())) {
      setLocalItems([...localItems, newItemName.trim()]);
      setNewItemName('');
    }
  };

  const handleRemoveItem = (itemToRemove: string) => {
    setLocalItems(localItems.filter(item => item !== itemToRemove));
  };

  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-orange-100 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/30 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-orange-900 dark:text-orange-100">
            <ListPlus /> Itens para Pedidos
          </h2>
          {!isEditingItems ? (
            <button 
              onClick={() => {
                setLocalItems(requestableItems || []);
                setIsEditingItems(true);
              }}
              className="rounded-lg bg-orange-100 dark:bg-orange-900/50 px-4 py-2 text-sm font-bold text-orange-700 dark:text-orange-300 hover:bg-orange-200 w-full sm:w-auto"
            >
              Editar Itens
            </button>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => {
                  setLocalItems(requestableItems || []);
                  setIsEditingItems(false);
                  setNewItemName('');
                }}
                className="flex-1 sm:flex-none rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveItems}
                className="flex-1 sm:flex-none rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
              >
                Salvar
              </button>
            </div>
          )}
        </div>
        
        <p className="mb-6 text-sm text-orange-800 dark:text-orange-200">
          Cadastre os materiais que as camareiras podem solicitar na aba de Pedidos.
        </p>

        {isEditingItems && (
          <div className="mb-4 flex gap-2">
            <input 
              type="text" 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Novo item (ex: Berço)"
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 p-2 text-sm focus:border-orange-500 focus:ring-orange-500"
            />
            <button 
              onClick={handleAddItem}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700"
            >
              Adicionar
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(isEditingItems ? localItems : (requestableItems || [])).map(item => (
            <div key={item} className="flex items-center gap-2 rounded-full border border-orange-200 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-medium text-orange-800 dark:text-orange-200 shadow-sm">
              <span>{item}</span>
              {isEditingItems && (
                <button onClick={() => handleRemoveItem(item)} className="text-orange-400 hover:text-red-500">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {(!requestableItems || requestableItems.length === 0) && !isEditingItems && (
            <p className="text-sm text-orange-600 italic">Nenhum item cadastrado.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-purple-100 bg-purple-50 dark:bg-purple-900/30 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-purple-900">
            <Package /> Configuração de Enxoval
          </h2>
          {!isEditingPacks ? (
            <button 
              onClick={() => setIsEditingPacks(true)}
              className="rounded-lg bg-purple-100 dark:bg-purple-900/50 px-4 py-2 text-sm font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-200 w-full sm:w-auto"
            >
              Editar Tamanhos
            </button>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => {
                  setLocalPackSizes(packSizes);
                  setIsEditingPacks(false);
                }}
                className="flex-1 sm:flex-none rounded-lg bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSavePackSizes}
                className="flex-1 sm:flex-none rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700"
              >
                Salvar
              </button>
            </div>
          )}
        </div>
        
        <p className="mb-6 text-sm text-purple-800 dark:text-purple-200">
          Defina a quantidade de unidades que vem em cada pacote fechado de enxoval. Isso afeta o cálculo na aba de Pedidos.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-purple-100">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Lençol de Casal</label>
            {isEditingPacks ? (
              <input 
                type="number" 
                value={localPackSizes.lencolCasal}
                onChange={(e) => setLocalPackSizes({...localPackSizes, lencolCasal: Number(e.target.value)})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-lg font-bold text-gray-900 dark:text-gray-50 focus:border-purple-500 focus:ring-purple-500"
              />
            ) : (
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300">{packSizes.lencolCasal} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">un/pacote</span></div>
            )}
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-purple-100">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Lençol de Solteiro</label>
            {isEditingPacks ? (
              <input 
                type="number" 
                value={localPackSizes.lencolSolteiro}
                onChange={(e) => setLocalPackSizes({...localPackSizes, lencolSolteiro: Number(e.target.value)})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-lg font-bold text-gray-900 dark:text-gray-50 focus:border-purple-500 focus:ring-purple-500"
              />
            ) : (
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300">{packSizes.lencolSolteiro} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">un/pacote</span></div>
            )}
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-purple-100">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Fronhas</label>
            {isEditingPacks ? (
              <input 
                type="number" 
                value={localPackSizes.fronhas}
                onChange={(e) => setLocalPackSizes({...localPackSizes, fronhas: Number(e.target.value)})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 text-lg font-bold text-gray-900 dark:text-gray-50 focus:border-purple-500 focus:ring-purple-500"
              />
            ) : (
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300">{packSizes.fronhas} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">un/pacote</span></div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/30 p-6">
        <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-blue-900">
          <FileSpreadsheet /> Integração Google Sheets
        </h2>
        <p className="mb-6 text-sm text-blue-800 dark:text-blue-200">
          As credenciais do robô e o ID da planilha já foram configurados no código do servidor. A sincronização ocorre automaticamente a cada 30 segundos.
        </p>
        
        <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-200">Status da Sincronização</h3>
          
          <div className="flex items-center gap-3">
            {syncStatus.status === 'success' && <CheckCircle2 className="text-green-500" size={24} />}
            {syncStatus.status === 'error' && <XCircle className="text-red-500" size={24} />}
            {syncStatus.status === 'pending' && <RefreshCw className="animate-spin text-blue-500" size={24} />}
            
            <div className="flex-1">
              <p className={`font-semibold ${
                syncStatus.status === 'success' ? 'text-green-700 dark:text-green-300' : 
                syncStatus.status === 'error' ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'
              }`}>
                {syncStatus.message}
              </p>
              {syncStatus.time && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Última tentativa: {syncStatus.time}</p>
              )}
            </div>
          </div>

          {syncStatus.debug && (
            <div className="mt-4 rounded bg-gray-100 dark:bg-gray-800 p-3 text-[11px] font-mono text-gray-700 dark:text-gray-200">
              <strong className="block mb-1 text-gray-900 dark:text-gray-50">Debug (Primeiros 5 quartos lidos):</strong>
              {syncStatus.debug.split(' | ').map((log, i) => (
                <div key={i} className="border-b border-gray-200 dark:border-gray-700 last:border-0 py-1">{log}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h3 className="mb-3 text-lg font-bold text-gray-800 dark:text-gray-100">Como funciona a integração?</h3>
        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
            <span>O sistema lê os apartamentos que estão chegando da aba <strong>VINCULACAO_HOJE</strong> (Coluna A).</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
            <span>O sistema lê o status geral e a quantidade de pessoas da aba <strong>DADOS_BRUTOS_HITS</strong> (Colunas E e F).</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
            <span>Quando uma camareira atualiza a condição do quarto (Sujo, Limpo, Não Perturbe), o sistema salva essa informação na aba <strong>STATUS_GOVERNANCA</strong>.</span>
          </li>
        </ul>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h3 className="mb-3 text-lg font-bold text-gray-800 dark:text-gray-100">Gerenciar Apartamentos</h3>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Clique no "X" ao lado do número do apartamento para excluí-lo do sistema.
        </p>
        
        <div className="space-y-4">
          {floors.map(floor => (
            <div key={floor} className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
              <h4 className="mb-3 font-bold text-gray-700 dark:text-gray-200">Andar {floor}</h4>
              <div className="flex flex-wrap gap-2">
                {rooms
                  .filter(r => r.floor === floor)
                  .sort((a, b) => Number(a.id) - Number(b.id))
                  .map(room => (
                    <div 
                      key={room.id} 
                      className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm"
                    >
                      <span>{room.id}</span>
                      <button 
                        onClick={() => setRoomToDelete(room.id)}
                        className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-red-50 dark:bg-red-900/30 hover:text-red-500 transition-colors"
                        title="Excluir apartamento"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Excluir Apartamento</h3>
            </div>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Tem certeza que deseja excluir o apartamento <strong className="text-gray-900 dark:text-gray-50">{roomToDelete}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setRoomToDelete(null)} 
                className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800 py-3 font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  deleteRoom(roomToDelete);
                  setRoomToDelete(null);
                }} 
                className="flex-1 rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
