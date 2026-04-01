import React from 'react';
import { useSocket } from '../SocketContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Wrench, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DashboardTab() {
  const { rooms, maintenanceRequests } = useSocket();

  // Condition Data
  const limpoCount = rooms.filter(r => r.condition === 'limpo').length;
  const sujoCount = rooms.filter(r => r.condition === 'sujo').length;
  const vestirCount = rooms.filter(r => r.condition === 'vestir').length;

  const conditionData = [
    { name: 'Limpos', value: limpoCount, color: '#16a34a' }, // green-600
    { name: 'Sujos', value: sujoCount, color: '#dc2626' }, // red-600
    { name: 'Vestir', value: vestirCount, color: '#2563eb' }, // blue-600
  ];

  // Status Data
  const ocupadoCount = rooms.filter(r => r.status === 'ocupado').length;
  const saidaCount = rooms.filter(r => r.status === 'saida').length;
  const chegadaCount = rooms.filter(r => r.status === 'chegada').length;
  const interditadoCount = rooms.filter(r => r.status === 'interditado').length;
  const vagoCount = rooms.filter(r => r.status === 'vago').length;

  const statusData = [
    { name: 'Ocupados', value: ocupadoCount, color: '#3b82f6' }, // blue-500
    { name: 'Saídas', value: saidaCount, color: '#ef4444' }, // red-500
    { name: 'Chegadas', value: chegadaCount, color: '#10b981' }, // emerald-500
    { name: 'Interditados', value: interditadoCount, color: '#eab308' }, // yellow-500
    { name: 'Vagos', value: vagoCount, color: '#9ca3af' }, // gray-400
  ];

  // Maintenance Data
  const pendingMaintenance = maintenanceRequests.filter(req => req.status === 'pendente');
  const resolvedMaintenance = maintenanceRequests.filter(req => req.status === 'corrigida');
  const notExecutedMaintenance = maintenanceRequests.filter(req => req.status === 'nao_executada');

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>

      {/* Room Condition Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-green-100 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-300">
            <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 uppercase">Quartos Limpos</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{limpoCount}</p>
          </div>
        </div>
        
        <div className="rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-300">
            <AlertCircle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 uppercase">Quartos Sujos</p>
            <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300">{sujoCount}</p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
            <Wrench size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase">Quartos para Vestir</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{vestirCount}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Condição */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-700 dark:text-gray-200">Condição dos Quartos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conditionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {conditionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} quartos`, 'Quantidade']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-2">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Limpos</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">{limpoCount}</p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-2">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Sujos</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-300">{sujoCount}</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-2">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Vestir</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{vestirCount}</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Status */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-700 dark:text-gray-200">Status dos Quartos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  formatter={(value: number) => [`${value} quartos`, 'Quantidade']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Maintenance Report */}
      <div className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-gray-700 dark:text-gray-200">Relatório de Manutenções</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-300">
              <Wrench size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase">Pendentes</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{pendingMaintenance.length}</p>
            </div>
          </div>
          
          <div className="rounded-xl border border-green-100 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-300">
              <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 uppercase">Corrigidas</p>
              <p className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{resolvedMaintenance.length}</p>
            </div>
          </div>

          <div className="rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-300">
              <AlertCircle size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400 uppercase">Não Executadas</p>
              <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300">{notExecutedMaintenance.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
