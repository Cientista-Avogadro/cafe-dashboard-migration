'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const data = [
  {
    name: 'Jan',
    total: 1200,
  },
  {
    name: 'Fev',
    total: 1800,
  },
  {
    name: 'Mar',
    total: 2200,
  },
  {
    name: 'Abr',
    total: 1900,
  },
  {
    name: 'Mai',
    total: 2400,
  },
  {
    name: 'Jun',
    total: 2100,
  },
]

export function ProductionChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}kg`}
        />
        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}