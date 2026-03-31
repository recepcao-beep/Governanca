import React from 'react';
import { useSocket } from '../SocketContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function DashboardTab() {
  const { rooms } = useSocket();

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

  return (
    <div className="space-y-6 pb-8">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico de Condição */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-700">Condição dos Quartos</h3>
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
            <div className="rounded-lg bg-green-50 p-2">
              <p className="text-xs font-semibold text-green-600 uppercase">Limpos</p>
              <p className="text-xl font-bold text-green-700">{limpoCount}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-2">
              <p className="text-xs font-semibold text-red-600 uppercase">Sujos</p>
              <p className="text-xl font-bold text-red-700">{sujoCount}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2">
              <p className="text-xs font-semibold text-blue-600 uppercase">Vestir</p>
              <p className="text-xl font-bold text-blue-700">{vestirCount}</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-gray-700">Status dos Quartos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
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
    </div>
  );
}
