import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";

import CropsPage from "@/pages/crops-page";
import SectorsPage from "@/pages/sectors-page";
import ModulePage from "@/pages/module-page";
import LotsPage from "./pages/lots-page";
import LotDetailsPage from "@/pages/lot-details-page";
import CanteirosPage from "@/pages/canteiros-page";
import CanteiroDetailsPage from "@/pages/canteiro-details-page";
import PlanningPage from "@/pages/planning-page";
import InsumosPage from "./pages/insumos-page";
import EstoquePage from "./pages/estoque-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />

      <ProtectedRoute path="/culturas" component={CropsPage} />
      <ProtectedRoute path="/setores" component={SectorsPage} />
      <ProtectedRoute path="/lotes" component={LotsPage} />
      <ProtectedRoute path="/lotes/:id" component={LotDetailsPage} />
      <ProtectedRoute path="/canteiros" component={CanteirosPage} />
      <ProtectedRoute path="/canteiros/:id" component={CanteiroDetailsPage} />
      <ProtectedRoute path="/producao" component={PlanningPage} />
      <ProtectedRoute path="/insumos" component={InsumosPage} />
      <ProtectedRoute path="/irrigacao" component={() => <ModulePage title="Irrigação" icon="ri-drop-line" />} />
      <ProtectedRoute path="/pragas" component={() => <ModulePage title="Pragas" icon="ri-bug-line" />} />
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
