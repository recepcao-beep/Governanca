import React, { useState, useRef, useMemo } from 'react';
import { useSocket } from '../SocketContext';
import { Plus, X, Camera, CheckCircle2, Clock, Image as ImageIcon, XCircle, Filter, History } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LogModal from './LogModal';

export default function ManutencaoTab({ user }: { user: any }) {
  const { maintenanceRequests, rooms, createMaintenance, resolveMaintenance } = useSocket();
  const [activeTab, setActiveTab] = useState<'pendente' | 'corrigida' | 'nao_executada'>('pendente');
  const [filterDate, setFilterDate] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomId, setNewRoomId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'corrigida' | 'nao_executada'>('corrigida');
  const [resolutionReason, setResolutionReason] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logTarget, setLogTarget] = useState<any>(null);

  const filteredRequests = useMemo(() => {
    return maintenanceRequests
      .filter(req => req.status === activeTab)
      .filter(req => {
        if (filterDate) {
          return isSameDay(parseISO(req.createdAt), parseISO(filterDate));
        }
        return true;
      })
      .filter(req => {
        if (filterRoom) {
          return req.roomId.toLowerCase().includes(filterRoom.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [maintenanceRequests, activeTab, filterDate, filterRoom]);

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
    if (!newRoomId || !newDescription) return;

    setIsUploading(true);
    let photoUrl = undefined;

    if (photoBase64) {
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            imageBase64: photoBase64,
            filename: `manutencao_${newRoomId}_${Date.now()}.jpg`
          })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          photoUrl = data.url;
        } else {
          alert(data.error || 'Erro ao enviar foto.');
          setIsUploading(false);
          return;
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Erro ao enviar foto. Verifique sua conexão.');
        setIsUploading(false);
        return;
      }
    }

    createMaintenance(newRoomId, newDescription, photoUrl, user.email);
    
    setIsUploading(false);
    setIsCreating(false);
    setNewRoomId('');
    setNewDescription('');
    setPhotoBase64(null);
  };

  const handleResolve = () => {
    if (resolvingId) {
      if (resolutionStatus === 'nao_executada' && !resolutionReason.trim()) {
        return; // require reason
      }
      resolveMaintenance(resolvingId, resolutionStatus, resolutionReason);
      setResolvingId(null);
      setResolutionReason('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">Manutenção</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-700 shadow-sm"
        >
          <Plus size={16} /> Nova Manutenção
        </button>
      </div>

      <div className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('pendente')}
            className={`flex-1 min-w-[100px] whitespace-nowrap px-3 py-2 rounded-md text-xs sm:text-sm font-bold transition-colors ${
              activeTab === 'pendente' ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-gray-50'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setActiveTab('corrigida')}
            className={`flex-1 min-w-[100px] whitespace-nowrap px-3 py-2 rounded-md text-xs sm:text-sm font-bold transition-colors ${
              activeTab === 'corrigida' ? 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-gray-50'
            }`}
          >
            Corrigidas
          </button>
          <button
            onClick={() => setActiveTab('nao_executada')}
            className={`flex-1 min-w-[120px] whitespace-nowrap px-3 py-2 rounded-md text-xs sm:text-sm font-bold transition-colors ${
              activeTab === 'nao_executada' ? 'bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-gray-50'
            }`}
          >
            Não Executadas
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="pl-3 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Filtrar por quarto..."
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="pl-3 pr-8 py-2 w-40 rounded-lg border border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {filterRoom && (
              <button onClick={() => setFilterRoom('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50">Registrar Problema</h3>
              <button onClick={() => setIsCreating(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-200">Quarto</label>
                <select 
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 text-gray-900 dark:text-gray-50 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Selecione um quarto...</option>
                  {rooms.sort((a, b) => Number(a.id) - Number(b.id)).map(room => (
                    <option key={room.id} value={room.id}>Quarto {room.id}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-200">Descrição do Defeito</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex: Ar condicionado pingando, parede mofada..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 text-gray-900 dark:text-gray-50 focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-200">Foto (Opcional)</label>
                {photoBase64 ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img src={photoBase64} alt="Preview" className="w-full h-48 object-cover" />
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
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900 hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    <Camera size={32} />
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

              <button
                onClick={handleSubmit}
                disabled={!newRoomId || !newDescription || isUploading}
                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Enviando...
                  </>
                ) : (
                  'Registrar Manutenção'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredRequests.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 text-center text-gray-500 dark:text-gray-400">
          <ImageIcon size={48} className="mb-4 opacity-20" />
          <p>Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map(req => (
            <div key={req.id} className="flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm overflow-hidden">
              <div className="mb-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 font-bold text-blue-700 dark:text-blue-300">
                    {req.roomId}
                  </span>
                  <button 
                    onClick={() => { setLogTarget(req); setShowLogModal(true); }}
                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <History size={14} />
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(req.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  req.status === 'pendente' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' : 
                  req.status === 'corrigida' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                }`}>
                  {req.status === 'pendente' ? <Clock size={12} /> : req.status === 'corrigida' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {req.status === 'pendente' ? 'Pendente' : req.status === 'corrigida' ? 'Corrigida' : 'Não Executada'}
                </span>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-100 mb-3">{req.description}</p>
                {req.photoUrl && (
                  <button 
                    onClick={() => setViewingPhoto(req.photoUrl!)}
                    className="block w-full mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity text-left"
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 h-32 flex items-center justify-center relative">
                       <img src={req.photoUrl} alt="Manutenção" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                         <span className="bg-white dark:bg-gray-800/90 text-gray-900 dark:text-gray-50 text-xs font-bold px-2 py-1 rounded">Ver foto ampliada</span>
                       </div>
                    </div>
                  </button>
                )}
                {req.status === 'nao_executada' && req.resolutionReason && (
                  <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/30 p-3 border border-red-100">
                    <p className="text-xs font-bold text-red-800 dark:text-red-200 mb-1">Motivo da não execução:</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{req.resolutionReason}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">Registrado por: {req.createdBy}</p>
              </div>

              {req.status === 'pendente' && user.role === 'gestor' && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => {
                      setResolvingId(req.id);
                      setResolutionStatus('corrigida');
                      setResolutionReason('');
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Resolver Manutenção
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {resolvingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50">Resolver Manutenção</h3>
              <button onClick={() => setResolvingId(null)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-200">Status da Resolução</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResolutionStatus('corrigida')}
                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                      resolutionStatus === 'corrigida' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    Corrigida
                  </button>
                  <button
                    onClick={() => setResolutionStatus('nao_executada')}
                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                      resolutionStatus === 'nao_executada' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    Não Executada
                  </button>
                </div>
              </div>

              {resolutionStatus === 'nao_executada' && (
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-200">Motivo (Obrigatório)</label>
                  <textarea
                    value={resolutionReason}
                    onChange={(e) => setResolutionReason(e.target.value)}
                    placeholder="Por que não foi executada?"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 text-gray-900 dark:text-gray-50 focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              )}

              <button
                onClick={handleResolve}
                disabled={resolutionStatus === 'nao_executada' && !resolutionReason.trim()}
                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                Confirmar Resolução
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingPhoto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setViewingPhoto(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewingPhoto(null)} 
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <img src={viewingPhoto} alt="Foto da manutenção" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
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
