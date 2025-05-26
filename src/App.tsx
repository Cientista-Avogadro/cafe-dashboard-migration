import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/sistema/auth-page";
import DashboardPage from "@/pages/principal/dashboard-page";

// Área de Plantio
import CropsPage from "@/pages/area-plantio/crops-page";
import SectorsPage from "@/pages/area-plantio/sectors-page";
import SectorDetailsPage from "@/pages/area-plantio/sector-details-page";
import LotsPage from "@/pages/area-plantio/lots-page";
import LotDetailsPage from "@/pages/area-plantio/lot-details-page";
import CanteirosPage from "@/pages/area-plantio/canteiros-page";
import CanteiroDetailsPage from "@/pages/area-plantio/canteiro-details-page";

// Operações
import PlanningPage from "@/pages/operacoes/planning-page";

// Recursos
import InsumosPage from "@/pages/recursos/insumos-page";
import EstoquePage from "@/pages/recursos/estoque-page";

// Sistema
import ModulePage from "@/pages/sistema/module-page";
import IrrigationPage from "./pages/operacoes/irrigation-page";
import PestPage from "./pages/operacoes/pest-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />

      <ProtectedRoute path="/culturas" component={CropsPage} />
      <ProtectedRoute path="/setores" component={SectorsPage} />
      <ProtectedRoute path="/setores/:id" component={SectorDetailsPage} />
      <ProtectedRoute path="/lotes" component={LotsPage} />
      <ProtectedRoute path="/lotes/:id" component={LotDetailsPage} />
      <ProtectedRoute path="/canteiros" component={CanteirosPage} />
      <ProtectedRoute path="/canteiros/:id" component={CanteiroDetailsPage} />
      <ProtectedRoute path="/producao" component={PlanningPage} />
      <ProtectedRoute path="/insumos" component={InsumosPage} />
      <ProtectedRoute path="/irrigacao" component={IrrigationPage} />
      <ProtectedRoute path="/pragas" component={PestPage} />
      <ProtectedRoute path="/financeiro" component={() => <ModulePage title="Financeiro" icon="ri-money-dollar-circle-line" />} />
      <ProtectedRoute path="/estoque" component={EstoquePage} />
      <ProtectedRoute path="/relatorios" component={() => <ModulePage title="Relatórios" icon="ri-bar-chart-2-line" />} />
      <ProtectedRoute path="/configuracoes" component={() => <ModulePage title="Configurações" icon="ri-settings-4-line" />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
