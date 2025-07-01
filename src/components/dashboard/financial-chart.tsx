'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = [
  {
    name: 'Jan',
    receitas: 4000,
    despesas: 2400,
  },
  {
    name: 'Fev',
    receitas: 3000,
    despesas: 1398,
  },
  {
    name: 'Mar',
    receitas: 2000,
    despesas: 9800,
  },
  {
    name: 'Abr',
    receitas: 2780,
    despesas: 3908,
  },
  {
    name: 'Mai',
    receitas: 1890,
    despesas: 4800,
  },
  {
    name: 'Jun',
    receitas: 2390,
    despesas: 3800,
  },
]

export function FinancialChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey="receitas" 
          stroke="#10b981" 
          strokeWidth={2}
          name="Receitas"
        />
        <Line 
          type="monotone" 
          dataKey="despesas" 
          stroke="#ef4444" 
          strokeWidth={2}
          name="Despesas"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}