import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Sector, Lot, Canteiro, Crop } from "@/lib/types";
import HasuraStatus from "@/components/hasura-status";
import { usePropertyData, executeHasuraOperation } from "@/hooks/use-hasura-query";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Buscar dados de setores
  const { data: setoresResponse, isLoading: isLoadingSetores } = usePropertyData<{setores: Sector[]}>(
    'GET_SETORES'
  );
  
  // Extrair o array de setores
  const setoresData = setoresResponse?.setores || [];

  // Buscar dados de lotes
  const { data: lotesData, isLoading: isLoadingLotes } = useQuery<Lot[]>({
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
  const { data: culturasResponse, isLoading: isLoadingCulturas } = usePropertyData<{culturas: Crop[]}>(
    'GET_CULTURAS'
  );
  
  // Extrair o array de culturas
  const culturasData = culturasResponse?.culturas || [];

  // Buscar dados de canteiros
  const { data: canteirosResponse, isLoading: isLoadingCanteiros } = usePropertyData<{canteiros: Canteiro[]}>(
    'GET_CANTEIROS'
  );
  
  // Extrair o array de canteiros
  const canteirosData = canteirosResponse?.canteiros || [];

  const isLoading = isLoadingSetores || isLoadingLotes || isLoadingCulturas || isLoadingCanteiros;

  return (
    <div className="space-y-6">
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

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="ml-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <>
            <StatCard 
              icon="ri-layout-grid-line" 
              title="Setores" 
              value={Array.isArray(setoresData) ? setoresData.length : 0} 
              color="bg-primary/10 text-primary"
            />
            <StatCard 
              icon="ri-home-line" 
              title="Lotes" 
              value={Array.isArray(lotesData) ? lotesData.length : 0} 
              color="bg-accent/10 text-accent"
            />
            <StatCard 
              icon="ri-layout-3-line" 
              title="Canteiros" 
              value={Array.isArray(canteirosData) ? canteirosData.length : 0} 
              color="bg-success/10 text-success"
            />
            <StatCard 
              icon="ri-seedling-line" 
              title="Culturas" 
              value={Array.isArray(culturasData) ? culturasData.length : 0} 
              color="bg-warning/10 text-warning"
            />
          </>
        )}
      </div>

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

      {/* Canteiros Recentes */}
      <h2 className="text-lg font-semibold text-slate-900 mt-8">Canteiros Recentes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))
        ) : Array.isArray(canteirosData) && canteirosData.length > 0 ? (
          canteirosData.slice(0, 3).map((canteiro) => (
            <Link key={canteiro.id} href={`/canteiros/${canteiro.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <h3 className="font-medium text-slate-800">{canteiro.nome}</h3>
                <div className="mt-2 text-sm text-slate-500">
                  <div className="flex items-center">
                    <i className="ri-layout-3-line mr-2"></i>
                    <span>Área: {canteiro.area || 0} m²</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <i className="ri-plant-line mr-2"></i>
                    <span>Cultura: {canteiro.cultura?.nome || 'Nenhuma'}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <i className="ri-home-line mr-2"></i>
                    <span>Lote: {canteiro.lote_nome || 'Não definido'}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${canteiro.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {canteiro.status || 'Não definido'}
                  </span>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-3 text-center p-8 bg-slate-50 rounded-lg">
            <i className="ri-layout-3-line text-4xl text-slate-400"></i>
            <p className="mt-2 text-slate-500">Nenhum canteiro encontrado</p>
            <Link href="/canteiros/new">
              <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors">
                Criar Canteiro
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Atividades Recentes */}
      <h2 className="text-lg font-semibold text-slate-900 mt-8">Atividades Recentes</h2>
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="ml-4 flex-1">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <i className={`${i === 1 ? 'ri-plant-line' : i === 2 ? 'ri-drop-line' : 'ri-bug-line'} text-primary`}></i>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-slate-900">
                        {i === 1 ? 'Plantio realizado' : i === 2 ? 'Irrigação aplicada' : 'Controle de pragas'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {i === 1 ? 'Canteiro A1' : i === 2 ? 'Canteiro B2' : 'Canteiro C3'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Componente para exibir cards de estatísticas
interface StatCardProps {
  icon: string;
  title: string;
  value: number | string;
  color: string;
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
          <i className={`${icon} text-xl`}></i>
        </div>
        <div className="ml-4">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </Card>
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
