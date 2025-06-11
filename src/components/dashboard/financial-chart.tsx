import { Card, CardContent } from "@/components/ui/card";
import { FinancialData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { TooltipProps } from 'recharts';
import React from 'react';

interface FinancialChartProps {
  data?: FinancialData;
  isLoading: boolean;
}

const formatKwanza = (value: number) =>
  new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 0 }).format(value);

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;
  const receitas = payload.find(p => p.dataKey === 'receitas');
  const despesas = payload.find(p => p.dataKey === 'despesas');
  const saldo = payload.find(p => p.dataKey === 'saldo');
  const saldoAcumulado = payload.find(p => p.dataKey === 'saldoAcumulado');
  return (
    <div className="bg-white rounded shadow p-2 text-xs min-w-[120px]">
      <div className="font-semibold mb-1">{label}</div>
      {receitas && (
        <div style={{ color: '#10B981' }}>Receitas: {formatKwanza(receitas.value as number)}</div>
      )}
      {despesas && (
        <div style={{ color: '#EF4444' }}>Despesas: {formatKwanza(despesas.value as number)}</div>
      )}
      {saldo && (
        <div style={{ color: '#3B82F6' }}>Saldo: {formatKwanza(saldo.value as number)}</div>
      )}
      {saldoAcumulado && (
        <div style={{ color: '#6366F1' }}>Saldo Acumulado: {formatKwanza(saldoAcumulado.value as number)}</div>
      )}
    </div>
  );
};

export { formatKwanza };
export default function FinancialChart({ data, isLoading }: FinancialChartProps) {
  let saldoAcumulado = 0;
  const chartData = data?.months.map((month, index) => {
    const receitas = data.income[index];
    const despesas = data.expenses[index];
    const saldo = receitas - despesas;
    saldoAcumulado += saldo;
    return {
      name: month,
      receitas,
      despesas,
      saldo,
      saldoAcumulado
    };
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-7 w-40 mb-4" />
          <Skeleton className="h-64 w-full" />
          <div className="flex justify-center space-x-4 text-sm mt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Balanço Financeiro</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 30,
                right: 40,
                left: 40,
                bottom: 30,
              }}
              barCategoryGap={24}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" padding={{ left: 20, right: 20 }} />
              <YAxis 
                width={80}
                tickFormatter={(value) => formatKwanza(value)}
                padding={{ top: 20, bottom: 20 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
              />
              <Legend />
              <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
              <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
              <Bar dataKey="saldo" fill="#3B82F6" name="Saldo" />
              <Line type="monotone" dataKey="saldoAcumulado" stroke="#6366F1" name="Saldo Acumulado" strokeWidth={2} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
