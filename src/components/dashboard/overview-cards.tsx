import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsProps {
  farmCount: number;
  cultivatedArea: number;
  activeCrops: number;
  alertCount: number;
}

interface OverviewCardsProps {
  stats?: StatsProps;
  isLoading: boolean;
}

export default function OverviewCards({ stats, isLoading }: OverviewCardsProps) {
  const cards = [
    {
      title: "Fazendas",
      value: stats?.farmCount || 0,
      icon: "ri-home-4-line",
      iconClass: "bg-primary/10 text-primary",
    },
    {
      title: "Áreas Cultivadas",
      value: `${stats?.cultivatedArea || 0} ha`,
      icon: "ri-layout-grid-line",
      iconClass: "bg-accent/10 text-accent",
    },
    {
      title: "Culturas Ativas",
      value: stats?.activeCrops || 0,
      icon: "ri-plant-line",
      iconClass: "bg-success/10 text-success",
    },
    {
      title: "Alertas",
      value: stats?.alertCount || 0,
      icon: "ri-alert-line",
      iconClass: "bg-warning/10 text-warning",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="ml-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-md ${card.iconClass}`}>
              <i className={`${card.icon} text-xl`}></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-slate-500">{card.title}</h3>
              <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
