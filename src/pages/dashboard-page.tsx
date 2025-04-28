import { useQuery } from "@tanstack/react-query";
import OverviewCards from "@/components/dashboard/overview-cards";
import FarmOverview from "@/components/dashboard/farm-overview";
import Alerts from "@/components/dashboard/alerts";
import FinancialChart from "@/components/dashboard/financial-chart";
import ProductionChart from "@/components/dashboard/production-chart";
import RecentActivities from "@/components/dashboard/recent-activities";
import HasuraStatus from "@/components/hasura-status";
import { useAuth } from "@/hooks/use-auth";
import { Farm, Alert, Activity, FinancialData, ProductionData } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      // Fallback data for demonstration
      return {
        stats: {
          farmCount: 3,
          cultivatedArea: 18,
          activeCrops: 8,
          alertCount: 4
        },
        farms: [
          { 
            id: 1, 
            name: "Fazenda Boa Vista", 
            area: 8, 
            location: "Uberlândia, MG",
            image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
          },
          { 
            id: 2, 
            name: "Fazenda Santa Luzia", 
            area: 7,
            location: "Patos de Minas, MG",
            image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
          },
          { 
            id: 3, 
            name: "Sítio Renascer", 
            area: 3,
            location: "Araxá, MG",
            image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
          }
        ] as Farm[],
        alerts: [
          {
            id: 1,
            type: "pest",
            message: "Detecção de praga em Milho",
            location: "Fazenda Boa Vista - Setor A",
            icon: "ri-bug-line",
            severity: "warning"
          },
          {
            id: 2,
            type: "irrigation",
            message: "Irrigação abaixo do ideal",
            location: "Fazenda Santa Luzia - Setor B",
            icon: "ri-drop-line",
            severity: "error"
          },
          {
            id: 3,
            type: "inventory",
            message: "Insumo com estoque baixo",
            location: "Fertilizante NPK - 2 unidades",
            icon: "ri-shopping-basket-2-line",
            severity: "info"
          },
          {
            id: 4,
            type: "harvest",
            message: "Colheita Programada",
            location: "Tomate - Sítio Renascer (5 dias)",
            icon: "ri-calendar-check-line",
            severity: "primary"
          }
        ] as Alert[],
        financialData: {
          months: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
          income: [15000, 18000, 21000, 17000, 25000, 22000],
          expenses: [8000, 9000, 14000, 11000, 16000, 13000]
        } as FinancialData,
        productionData: [
          { crop: "Milho", percentage: 35, color: "primary" },
          { crop: "Soja", percentage: 27, color: "accent" },
          { crop: "Tomate", percentage: 18, color: "secondary" },
          { crop: "Feijão", percentage: 12, color: "warning" },
          { crop: "Outros", percentage: 8, color: "info" }
        ] as ProductionData[],
        recentActivities: [
          {
            id: 1,
            date: "25/06/2023",
            activity: "Plantio de Milho",
            farm: "Fazenda Boa Vista",
            responsible: "Carlos Silva",
            status: "Concluído"
          },
          {
            id: 2,
            date: "23/06/2023",
            activity: "Aplicação de Fertilizante",
            farm: "Fazenda Santa Luzia",
            responsible: "Marcos Oliveira",
            status: "Concluído"
          },
          {
            id: 3,
            date: "22/06/2023",
            activity: "Irrigação",
            farm: "Sítio Renascer",
            responsible: "Ricardo Santos",
            status: "Concluído"
          },
          {
            id: 4,
            date: "20/06/2023",
            activity: "Controle de Pragas",
            farm: "Fazenda Boa Vista",
            responsible: "Carlos Silva",
            status: "Em andamento"
          },
          {
            id: 5,
            date: "18/06/2023",
            activity: "Manutenção de Equipamentos",
            farm: "Fazenda Santa Luzia",
            responsible: "Marcos Oliveira",
            status: "Em andamento"
          }
        ] as Activity[]
      };
    }
  });

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Visão geral da sua operação agrícola
            {user ? `, ${user.nome}` : ''}
          </p>
        </div>
        <div className="mt-2 md:mt-0">
          <HasuraStatus />
        </div>
      </div>

      {/* Quick Stats */}
      <OverviewCards stats={dashboardData?.stats} isLoading={isLoading} />

      {/* Farm Overview and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <FarmOverview farms={dashboardData?.farms} isLoading={isLoading} />
        <Alerts alerts={dashboardData?.alerts} isLoading={isLoading} />
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FinancialChart data={dashboardData?.financialData} isLoading={isLoading} />
        <ProductionChart data={dashboardData?.productionData} isLoading={isLoading} />
      </div>

      {/* Recent Activities */}
      <RecentActivities activities={dashboardData?.recentActivities} isLoading={isLoading} />
    </div>
  );
}
