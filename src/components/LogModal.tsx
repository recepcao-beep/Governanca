import React from 'react';
import { History, X, Clock } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  user: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  action?: string;
}

interface LogModalProps {
  target: {
    id: string;
    logs?: LogEntry[];
  };
  onClose: () => void;
}

export default function LogModal({ target, onClose }: LogModalProps) {
  const logs = target.logs || [];
  
  // Group logs by day
  const groupedLogs: Record<string, LogEntry[]> = {};
  logs.forEach((log) => {
    const date = new Date(log.timestamp).toLocaleDateString('pt-BR');
    if (!groupedLogs[date]) groupedLogs[date] = [];
    groupedLogs[date].push(log);
  });

  const sortedDates = Object.keys(groupedLogs).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-')).getTime();
    const dateB = new Date(b.split('/').reverse().join('-')).getTime();
    return dateB - dateA;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="text-blue-600 dark:text-blue-400" size={24} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Histórico - {target.id || 'Item'}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {sortedDates.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Nenhuma alteração registrada.
            </div>
          ) : (
            sortedDates.map(date => (
              <div key={date} className="space-y-3">
                <h4 className="sticky top-0 bg-white dark:bg-gray-800 py-1 text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  {date}
                </h4>
                <div className="space-y-4">
                  {groupedLogs[date].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <div className="flex-1 w-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-50">{log.user}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                          {log.action ? (
                            <span className="font-medium">{log.action}</span>
                          ) : (
                            <>
                              Alterou <span className="font-bold text-blue-600 dark:text-blue-400">{log.field}</span> de <span className="line-through opacity-50">"{log.oldValue}"</span> para <span className="font-bold">"{log.newValue}"</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="mt-6 w-full rounded-xl bg-gray-100 dark:bg-gray-700 py-3 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
          Fechar
        </button>
      </div>
    </div>
  );
}
