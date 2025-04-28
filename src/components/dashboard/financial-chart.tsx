import { Card, CardContent } from "@/components/ui/card";
import { FinancialData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface FinancialChartProps {
  data?: FinancialData;
  isLoading: boolean;
}

export default function FinancialChart({ data, isLoading }: FinancialChartProps) {
  // Transform data for Recharts
  const chartData = data?.months.map((month, index) => ({
    name: month,
    receitas: data.income[index],
    despesas: data.expenses[index]
  }));

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
                top: 10,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis 
                width={60} 
                tickFormatter={(value) => `R$${value / 1000}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
              <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
