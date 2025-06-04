import { lazy } from 'react';
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
import PlanningDetailsPage from "@/pages/operacoes/planning-details-page";

// Recursos
import InsumosPage from "@/pages/recursos/insumos-page";
import EstoquePage from "@/pages/recursos/estoque-page";

// Sistema
import IrrigationPage from "./pages/operacoes/irrigation-page";
import PestPage from "./pages/operacoes/pest-page";
import ConfigPage from "./pages/sistema/configuracao";
import UsersPage from "./pages/sistema/usuarios";
import RelatoriosPage from './pages/gestao/relatorios-page';
import FinanceiroPage from './pages/gestao/financeiro-page';

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
      <ProtectedRoute path="/producao/:id" component={PlanningDetailsPage} />
      <ProtectedRoute path="/insumos" component={InsumosPage} />
      <ProtectedRoute path="/irrigacao" component={IrrigationPage} />
      <ProtectedRoute path="/pragas" component={PestPage} />
      <ProtectedRoute path="/financeiro" component={FinanceiroPage} />
      <ProtectedRoute path="/estoque" component={EstoquePage} />
      <ProtectedRoute path="/relatorios" component={RelatoriosPage} />
      <ProtectedRoute path="/sistema" component={ConfigPage} />
      <ProtectedRoute path="/sistema/configuracao" component={ConfigPage} />
      <ProtectedRoute path="/sistema/usuarios" component={UsersPage} />
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
