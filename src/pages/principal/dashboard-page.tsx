import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Sector, Lot, Canteiro, Crop } from "@/lib/types";
import HasuraStatus from "@/components/hasura-status";
import { usePropertyData, executeHasuraOperation } from "@/hooks/use-hasura-query";
import ProductionChart from "@/components/dashboard/production-chart";
import { executeOperation } from "@/lib/hasura";
import { useEffect, useState } from "react";
import type { ProductionData, FinancialData } from "@/lib/types";
import FinancialChart from "@/components/dashboard/financial-chart";
import { formatKwanza } from "@/components/dashboard/financial-chart";
import { GET_TRANSACOES_FINANCEIRAS, GET_COLHEITAS_BY_PROPRIEDADE, GET_ATIVIDADES } from "@/graphql/operations";
import { PieChart, Pie, Cell, Legend as PieLegend, Tooltip as PieTooltip, ResponsiveContainer as PieResponsiveContainer } from 'recharts';
import { BarChart as SimpleBarChart, Bar as SimpleBar, XAxis as SimpleXAxis, YAxis as SimpleYAxis, CartesianGrid as SimpleCartesianGrid, Tooltip as SimpleTooltip, ResponsiveContainer as SimpleResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Buscar dados de setores
  const { data: setoresResponse } = usePropertyData<{setores: Sector[]}>(
    'GET_SETORES'
  );
  
  // Extrair o array de setores
  const setoresData = setoresResponse?.setores || [];

  // Buscar dados de lotes
  const { data: lotesData } = useQuery<Lot[]>({
    queryKey: ['lotes-by-setores', setoresData],
    queryFn: async () => {
      if (!Array.isArray(setoresData) || setoresData.length === 0) return [];
      
      // Obter IDs dos setores
      const setorIds = setoresData.map(setor => setor.id);
      
      // Buscar lotes para cada setor
      const lotesArrays: Lot[][] = [];
      
      for (const setorId of setorIds) {
        const result = await executeHasuraOperation('GET_LOTES', { setor_id: setorId });
        lotesArrays.push(result?.lotes || []);
      }
      
      // Combinar resultados
      return lotesArrays.flat();
    },
    enabled: Array.isArray(setoresData) && setoresData.length > 0
  });

  // Buscar dados de culturas
  const { data: culturasResponse } = usePropertyData<{culturas: Crop[]}>(
    'GET_CULTURAS'
  );
  
  // Extrair o array de culturas
  const culturasData = culturasResponse?.culturas || [];

  // Buscar dados de canteiros
  const { data: canteirosResponse } = usePropertyData<{canteiros: Canteiro[]}>(
    'GET_CANTEIROS'
  );
  
  // Extrair o array de canteiros
  const canteirosData = canteirosResponse?.canteiros || [];

  // Buscar dados reais de colheitas para o gráfico
  const [productionData, setProductionData] = useState<ProductionData[]>([]);
  const [isLoadingProduction, setIsLoadingProduction] = useState(true);

  useEffect(() => {
    async function fetchProduction() {
      setIsLoadingProduction(true);
      if (!user?.propriedade_id) {
        setProductionData([]);
        setIsLoadingProduction(false);
        return;
      }
      // Buscar todas as colheitas da propriedade
      const response = await executeOperation(GET_COLHEITAS_BY_PROPRIEDADE, {
        propriedade_id: user.propriedade_id,
      });
      const colheitas = response.colheitas || [];
      // Agrupar por cultura
      const culturaMap = new Map();
      colheitas.forEach((colheita: any) => {
        if (!colheita.cultura_id) return;
        const culturaNome = culturasData.find(c => c.id === colheita.cultura_id)?.nome || "Outra";
        if (!culturaMap.has(culturaNome)) {
          culturaMap.set(culturaNome, 0);
        }
        culturaMap.set(culturaNome, culturaMap.get(culturaNome) + colheita.quantidade_colhida);
      });
      // Calcular total
      const total = Array.from(culturaMap.values()).reduce((a, b) => a + b, 0) || 1;
      // Montar dados para o gráfico
      const colors = ["primary", "accent", "secondary", "warning", "info"];
      const data = Array.from(culturaMap.entries()).map(([crop, value], i) => ({
        crop,
        percentage: Math.round((value / total) * 100),
        color: colors[i % colors.length],
      }));
      setProductionData(data);
      setIsLoadingProduction(false);
    }
    fetchProduction();
  }, [user?.propriedade_id, culturasData]);

  // Buscar dados reais de transações financeiras para o gráfico
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(true);

  useEffect(() => {
    async function fetchFinancial() {
      setIsLoadingFinancial(true);
      if (!user?.propriedade_id) {
        setFinancialData(null);
        setIsLoadingFinancial(false);
        return;
      }
      const response = await executeOperation(GET_TRANSACOES_FINANCEIRAS, {
        propriedade_id: user.propriedade_id,
      });
      const transacoes = response.transacoes_financeiras || [];
      // Agrupar por mês
      const meses: string[] = [];
      const receitas: number[] = [];
      const despesas: number[] = [];
      const mapMes: Record<string, { receitas: number; despesas: number }> = {};
      transacoes.forEach((tx: any) => {
        const data = new Date(tx.data);
        const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
        if (!mapMes[mes]) mapMes[mes] = { receitas: 0, despesas: 0 };
        if (tx.tipo === "entrada") mapMes[mes].receitas += tx.valor;
        if (tx.tipo === "saida") mapMes[mes].despesas += tx.valor;
      });
      Object.entries(mapMes).forEach(([mes, valores]) => {
        meses.push(mes);
        receitas.push(valores.receitas);
        despesas.push(valores.despesas);
      });
      setFinancialData({ months: meses, income: receitas, expenses: despesas });
      setIsLoadingFinancial(false);
    }
    fetchFinancial();
  }, [user?.propriedade_id]);

  // Gráfico de pizza: distribuição de despesas por categoria
  const [expensePieData, setExpensePieData] = useState<{ name: string; value: number }[]>([]);
  const pieColors = ["#EF4444", "#F59E42", "#10B981", "#6366F1", "#FBBF24", "#3B82F6", "#A21CAF", "#F472B6"];
  useEffect(() => {
    if (!financialData) return;
    // Buscar novamente as transações para agrupar por categoria
    (async () => {
      if (!user?.propriedade_id) return;
      const response = await executeOperation(GET_TRANSACOES_FINANCEIRAS, {
        propriedade_id: user.propriedade_id,
      });
      const transacoes = response.transacoes_financeiras || [];
      const despesasPorCategoria: Record<string, number> = {};
      transacoes.forEach((tx: any) => {
        if (tx.tipo === 'saida') {
          const categoria = tx.categoria || 'Outros';
          if (!despesasPorCategoria[categoria]) despesasPorCategoria[categoria] = 0;
          despesasPorCategoria[categoria] += tx.valor;
        }
      });
      setExpensePieData(Object.entries(despesasPorCategoria).map(([name, value]) => ({ name, value })));
    })();
  }, [financialData, user?.propriedade_id]);

  // Buscar atividades recentes
  const { data: atividadesData, isLoading: isLoadingAtividades } = useQuery({
    queryKey: ["atividades", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { atividades: [] };
      const response = await executeOperation(GET_ATIVIDADES, { 
        propriedade_id: user.propriedade_id
      });
      
      // Agrupar atividades por tipo e data para evitar duplicatas
      const atividadesUnicas = response.atividades.reduce((acc: any[], atividade: any) => {
        const chave = `${atividade.tipo}-${atividade.data_prevista}`;
        const existe = acc.find(a => `${a.tipo}-${a.data_prevista}` === chave);
        if (!existe) {
          acc.push(atividade);
        }
        return acc;
      }, []);

      return { 
        atividades: atividadesUnicas
          .sort((a: any, b: any) => new Date(b.data_prevista).getTime() - new Date(a.data_prevista).getTime())
          .slice(0, 5)
      };
    },
    enabled: !!user?.propriedade_id,
  });


  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
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

      {/* Estatísticas rápidas como gráfico de barras agrupadas */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Visão Geral</h2>
          <div className="h-64">
            <SimpleResponsiveContainer width="100%" height="100%">
              <SimpleBarChart
                data={[
                  {
                    name: 'Setores',
                    quantidade: Array.isArray(setoresData) ? setoresData.length : 0,
                  },
                  {
                    name: 'Lotes',
                    quantidade: Array.isArray(lotesData) ? lotesData.length : 0,
                  },
                  {
                    name: 'Canteiros',
                    quantidade: Array.isArray(canteirosData) ? canteirosData.length : 0,
                  },
                  {
                    name: 'Culturas',
                    quantidade: Array.isArray(culturasData) ? culturasData.length : 0,
                  },
                ]}
                margin={{ top: 30, right: 40, left: 40, bottom: 30 }}
                barCategoryGap={32}
              >
                <SimpleCartesianGrid strokeDasharray="3 3" />
                <SimpleXAxis dataKey="name" />
                <SimpleYAxis allowDecimals={false} />
                <SimpleTooltip />
                <SimpleBar dataKey="quantidade" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </SimpleBarChart>
            </SimpleResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Linha de gráficos: produção e pizza lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProductionChart data={productionData} isLoading={isLoadingProduction} />
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-medium text-slate-900 mb-4">Despesas por Categoria</h2>
            <div className="h-72">
              <PieResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <PieTooltip formatter={(value: number) => formatKwanza(value)} />
                  <PieLegend />
                </PieChart>
              </PieResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico financeiro embaixo */}
      <FinancialChart data={financialData!} isLoading={isLoadingFinancial} />

      {/* Categorias do Sistema */}
      <h2 className="text-lg font-semibold text-slate-900 mt-8">Categorias do Sistema</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CategoryCard 
          title="Área de Plantio" 
          icon="ri-plant-line" 
          color="bg-emerald-100 text-emerald-600"
          items={[
            { name: "Culturas", path: "/culturas", count: Array.isArray(culturasData) ? culturasData.length : 0 },
            { name: "Lotes", path: "/lotes", count: Array.isArray(lotesData) ? lotesData.length : 0 },
            { name: "Canteiros", path: "/canteiros", count: Array.isArray(canteirosData) ? canteirosData.length : 0 }
          ]}
        />
        <CategoryCard 
          title="Operações" 
          icon="ri-tools-line" 
          color="bg-blue-100 text-blue-600"
          items={[
            { name: "Produção", path: "/producao", count: 0 },
            { name: "Irrigação", path: "/irrigacao", count: 0 },
            { name: "Pragas", path: "/pragas", count: 0 }
          ]}
        />
        <CategoryCard 
          title="Recursos" 
          icon="ri-shopping-basket-2-line" 
          color="bg-amber-100 text-amber-600"
          items={[
            { name: "Insumos", path: "/insumos", count: 0 },
            { name: "Estoque", path: "/estoque", count: 0 }
          ]}
        />
        <CategoryCard 
          title="Gestão" 
          icon="ri-bar-chart-2-line" 
          color="bg-purple-100 text-purple-600"
          items={[
            { name: "Financeiro", path: "/financeiro", count: 0 },
            { name: "Relatórios", path: "/relatorios", count: 0 }
          ]}
        />
      </div>

      {/* Atividades Recentes */}
      <h2 className="text-lg font-semibold text-slate-900 mt-8">Atividades Recentes</h2>
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Últimas Atividades</h3>
            <Link href="/atividades">
              <Button variant="ghost" size="sm" className="gap-2">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {isLoadingAtividades ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-full h-10" />
              ))}
            </div>
          ) : atividadesData?.atividades.length ? (
            <div className="space-y-2">
              {atividadesData.atividades.map((atividade: any) => (
                <div key={atividade.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium">{atividade.tipo}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(atividade.data_prevista), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{atividade.observacoes}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              Nenhuma atividade recente.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



// Componente para exibir cards de categoria
interface CategoryCardProps {
  title: string;
  icon: string;
  color: string;
  items: {
    name: string;
    path: string;
    count: number;
  }[];
}

function CategoryCard({ title, icon, color, items }: CategoryCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-md ${color}`}>
          <i className={`${icon} text-xl`}></i>
        </div>
        <h3 className="ml-3 font-medium text-slate-800">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <Link key={index} href={item.path}>
            <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-md cursor-pointer">
              <span className="text-sm text-slate-600">{item.name}</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{item.count}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
