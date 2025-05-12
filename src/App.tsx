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

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />

      <ProtectedRoute path="/culturas" component={CropsPage} />
      <ProtectedRoute path="/setores" component={SectorsPage} />
      <ProtectedRoute path="/lotes" component={LotsPage} />
      <ProtectedRoute path="/lotes/:id" component={LotDetailsPage} />
      <ProtectedRoute path="/producao" component={() => <ModulePage title="Produção" icon="ri-plant-line" />} />
      <ProtectedRoute path="/insumos" component={() => <ModulePage title="Insumos" icon="ri-shopping-basket-2-line" />} />
      <ProtectedRoute path="/irrigacao" component={() => <ModulePage title="Irrigação" icon="ri-drop-line" />} />
      <ProtectedRoute path="/pragas" component={() => <ModulePage title="Pragas" icon="ri-bug-line" />} />
      <ProtectedRoute path="/financeiro" component={() => <ModulePage title="Financeiro" icon="ri-money-dollar-circle-line" />} />
      <ProtectedRoute path="/estoque" component={() => <ModulePage title="Estoque" icon="ri-store-2-line" />} />
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
