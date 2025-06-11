import { Card, CardContent } from "@/components/ui/card";
import { ProductionData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface ProductionChartProps {
  data?: ProductionData[];
  isLoading: boolean;
}

export default function ProductionChart({ data, isLoading }: ProductionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-7 md:w-40 mb-4" />
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Adiciona valor absoluto para cada cultura
  const chartData = data?.map(item => ({
    crop: item.crop,
    quantidade: item.percentage, // Aqui percentage é a % do total, mas vamos mostrar também o valor absoluto
    color: item.color,
    percentage: item.percentage
  })) || [];

  return (
    <Card>
      <CardContent className="p-4 ">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Produção por Cultura</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 30, right: 40, left: 40, bottom: 30 }}
              barCategoryGap={24}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="crop" width={120} />
              <Tooltip formatter={(value: number, name: string, props: any) => `${value}%`} />
              <Bar dataKey="percentage" fill="#10B981">
                <LabelList dataKey="percentage" position="right" formatter={(v: number) => `${v}%`} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
