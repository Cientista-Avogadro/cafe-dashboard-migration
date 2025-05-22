import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sector, Lot } from "@/lib/types";
import { graphqlRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
  Badge,
} from "@/components/ui";
import { ArrowLeft, MapPin, Calendar, Edit, LineChart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Função para inicializar o Leaflet no lado do cliente
const initLeaflet = () => {
  if (typeof window !== "undefined") {
    return true;
  }
  return false;
};

export default function SectorDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/setores/:id");
  const id = params?.id;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Query para buscar detalhes do setor
  const { data, isLoading, error } = useQuery<{ setores_by_pk: Sector }>({
    queryKey: ["setor", id],
    queryFn: async () => {
      if (!id) throw new Error("ID do setor não fornecido");
      return await graphqlRequest("GET_SECTOR_BY_ID", { id: id });
    },
    enabled: !!id
  });

  // Query para buscar lotes associados a este setor
  const { data: lotesData, isLoading: isLoadingLotes } = useQuery<{ lotes: Lot[] }>({
    queryKey: ["lotes_por_setor", id],
    queryFn: async () => {
      if (!id) throw new Error("ID do setor não fornecido");
      return await graphqlRequest("GET_LOTES_BY_SECTOR_ID", { setor_id: id });
    },
    enabled: !!id
  });

  // Extrair IDs de culturas únicas dos lotes
  const culturaIds = Array.from(
    new Set(
      lotesData?.lotes
        ?.map((lote) => lote.cultura_atual_id)
        .filter((id): id is string => !!id) // Filtra valores nulos/undefined
    )
  );

  // Query para buscar detalhes das culturas
  const { data: culturasData } = useQuery<{ culturas: Array<{ id: string; nome: string }> }>({
    queryKey: ["culturas_por_lotes", culturaIds],
    queryFn: async () => {
      if (culturaIds.length === 0) return { culturas: [] };
      return await graphqlRequest("GET_CULTURAS_BY_IDS", { ids: culturaIds });
    },
    enabled: culturaIds.length > 0
  });

  const setor: Sector = data?.setores_by_pk!;
  
  // Combinar dados de lotes com informações de culturas
  const lotes = useMemo(() => {
    if (!lotesData?.lotes) return [];
    
    return lotesData.lotes.map((lote: Lot) => ({
      ...lote,
      cultura_nome: culturasData?.culturas?.find(c => c.id === lote.cultura_atual_id)?.nome || 'Sem cultura'
    }));
  }, [lotesData, culturasData]);

  // Garantir que o mapa seja renderizado apenas no lado do cliente
  useEffect(() => {
    const leafletLoaded = initLeaflet();
    if (leafletLoaded && setor?.latitude && setor?.longitude) {
      // Aqui você pode inicializar o mapa com as coordenadas do setor
      setMapLoaded(true);
    }
  }, [setor]);

  // Dados simulados para as abas
  const productivityData = [
    { id: 1, mes: "Janeiro", producao: 3200, unidade: "kg" },
    { id: 2, mes: "Fevereiro", producao: 3500, unidade: "kg" },
    { id: 3, mes: "Março", producao: 3800, unidade: "kg" },
    { id: 4, mes: "Abril", producao: 4000, unidade: "kg" },
  ];

  const activityData = [
    { id: 1, data: "2025-05-10", tipo: "Manutenção", descricao: "Manutenção de cercas" },
    { id: 2, data: "2025-05-05", tipo: "Inspeção", descricao: "Inspeção de segurança" },
    { id: 3, data: "2025-04-28", tipo: "Limpeza", descricao: "Limpeza de áreas" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-40 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !setor) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-xl font-medium mb-2">Setor não encontrado</h3>
        <p className="text-slate-500 mb-4">Não foi possível encontrar o setor solicitado.</p>
        <Button onClick={() => navigate("/setores")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para lista de setores
        </Button>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => navigate("/setores")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Detalhes do Setor</h1>
      </div>

      {/* Card de informações gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {setor.nome}
          </CardTitle>
          <CardDescription>
            Informações detalhadas sobre o setor e suas características
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Mapa ou imagem representativa */}
            <div className="bg-slate-100 rounded-lg p-2 min-h-[200px] flex items-center justify-center">
              {mapLoaded ? (
                <div id="map" className="w-full h-full rounded-md"></div>
              ) : (
                <div className="text-center">
                  <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">
                    {setor.latitude && setor.longitude
                      ? `Localização: ${setor.latitude}, ${setor.longitude}`
                      : "Localização não definida"}
                  </p>
                </div>
              )}
            </div>

            {/* Detalhes principais */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Identificação</h3>
                <p className="text-lg font-medium">{setor.nome}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Área</h3>
                <p className="text-lg font-medium">{setor.area ? `${setor.area} m²` : "Não informada"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Localização</h3>
                <p className="text-lg font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                  {setor.latitude && setor.longitude
                    ? `${setor.latitude}, ${setor.longitude}`
                    : "Coordenadas não definidas"}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Lotes Associados</h3>
                <p className="text-lg font-medium">{lotes.length} lotes</p>
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="outline" className="w-1/2">
                  <Edit className="h-4 w-4 mr-2" /> Editar Setor
                </Button>
                <Button variant="secondary" className="w-1/2">
                  <MapPin className="h-4 w-4 mr-2" /> Gerenciar Localização
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs para diferentes visualizações */}
          <Tabs defaultValue="overview" className="mt-6" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="lotes">Lotes</TabsTrigger>
              <TabsTrigger value="activity">Atividades</TabsTrigger>
            </TabsList>
            
            {/* Aba de Visão Geral */}
            <TabsContent value="overview" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Área Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{setor.area || "0"} m²</div>
                    <p className="text-xs text-muted-foreground">Área total do setor</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Lotes Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{lotes.filter(l => l.status === "ativo").length}</div>
                    <p className="text-xs text-muted-foreground">Lotes em uso no setor</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Produtividade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {productivityData.length > 0 ? `${productivityData[productivityData.length - 1].producao} kg` : "0 kg"}
                    </div>
                    <p className="text-xs text-muted-foreground">Produção do último mês</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-4">Informações Adicionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Descrição</h4>
                    <p className="text-slate-700">
                      {setor.descricao || "Nenhuma descrição disponível para este setor."}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-2">Observações</h4>
                    <p className="text-slate-700">
                      {setor.observacao || "Nenhuma observação registrada para este setor."}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Aba de Lotes */}
            <TabsContent value="lotes" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Lotes no Setor</h3>
                <Button size="sm">
                  Adicionar Lote
                </Button>
              </div>

              {lotes.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cultura Atual</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lotes.map((lote) => (
                        <tr key={lote.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {lote.nome}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lote.area ? `${lote.area} m²` : "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Badge variant={lote.status === "ativo" ? "default" : "outline"}>
                              {lote.status || "Não definido"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lote.cultura?.nome || "Sem cultura"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/lotes/${lote.id}`)}>
                                Ver Detalhes
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum lote associado a este setor.
                </div>
              )}
            </TabsContent>
            
            {/* Aba de Atividades */}
            <TabsContent value="activity" className="space-y-4 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Registro de Atividades</h3>
                <Button size="sm">
                  Registrar Atividade
                </Button>
              </div>

              {activityData.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activityData.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Badge variant="outline">{item.tipo}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descricao}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro de atividade.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Gráficos e Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
          <CardDescription>Dados e métricas sobre o desempenho do setor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <LineChart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Estatísticas em desenvolvimento</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
              Aqui você poderá visualizar gráficos de produtividade, consumo de água e outros indicadores 
              específicos para este setor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
