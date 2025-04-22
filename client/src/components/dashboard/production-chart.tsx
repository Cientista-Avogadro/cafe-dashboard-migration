import { Card, CardContent } from "@/components/ui/card";
import { ProductionData } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

interface ProductionChartProps {
  data?: ProductionData[];
  isLoading: boolean;
}

export default function ProductionChart({ data, isLoading }: ProductionChartProps) {
  // Get color class based on color name
  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'primary': 'bg-primary',
      'accent': 'bg-accent',
      'secondary': 'bg-secondary',
      'warning': 'bg-warning',
      'info': 'bg-info'
    };
    
    const bgColorMap: Record<string, string> = {
      'primary': 'bg-primary/20',
      'accent': 'bg-accent/20',
      'secondary': 'bg-secondary/20',
      'warning': 'bg-warning/20',
      'info': 'bg-info/20'
    };
    
    return {
      fg: colorMap[color] || 'bg-slate-500',
      bg: bgColorMap[color] || 'bg-slate-200'
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-7 w-40 mb-4" />
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

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-medium text-slate-900 mb-4">Produção por Cultura</h2>
        <div className="space-y-4">
          {data?.map((item, index) => {
            const colors = getColorClass(item.color);
            
            return (
              <div key={index} className="relative pt-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-semibold inline-block text-slate-800">
                      {item.crop}
                    </span>
                  </div>
                  <div className="text-right">
                    <span 
                      className={`text-xs font-semibold inline-block text-${item.color}`}
                      style={{ color: `hsl(var(--${item.color}))` }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className={`overflow-hidden h-2 text-xs flex rounded ${colors.bg}`}>
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${colors.fg}`}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
