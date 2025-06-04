import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Canteiro, Crop, Lot } from "@/lib/types";
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
import { ArrowLeft, MapPin, Calendar, Droplets, Bug, LineChart, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PestList } from "@/components/pest-list";
import { IrrigationList } from "@/components/irrigation-list";

// Função para inicializar o Leaflet no lado do cliente
const initLeaflet = () => {
  if (typeof window !== "undefined") {
    return true;
  }
  return false;
};

export default function CanteiroDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/canteiros/:id");
  const id = params?.id;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Query para buscar detalhes do canteiro
  const { data, isLoading, error } = useQuery<{ canteiros_by_pk: Canteiro }>({
    queryKey: ["canteiro", id],
    queryFn: async () => {
      if (!id) throw new Error("ID do canteiro não fornecido");
      return await graphqlRequest("GET_CANTEIRO_BY_ID", { id: id });
    },
    enabled: !!id
  });

  // Query para buscar detalhes da cultura
  const { data: cultureData } = useQuery({
    queryKey: ["cultura", data?.canteiros_by_pk?.cultura_id],
    queryFn: async () => {
      if (!data?.canteiros_by_pk?.cultura_id) return null;
      return await graphqlRequest("GET_CULTURA_BY_ID", { id: data.canteiros_by_pk.cultura_id });
    },
    enabled: !!data?.canteiros_by_pk?.cultura_id
  });

  // Query para buscar detalhes do lote
  const { data: loteData } = useQuery({
    queryKey: ["lote", data?.canteiros_by_pk?.lote_id],
    queryFn: async () => {
      if (!data?.canteiros_by_pk?.lote_id) return null;
      return await graphqlRequest("GET_LOTE_BY_ID", { id: data.canteiros_by_pk.lote_id });
    },
    enabled: !!data?.canteiros_by_pk?.lote_id
  });

  const canteiro: Canteiro = data?.canteiros_by_pk!;
  const cultura = cultureData?.culturas_by_pk;
  const lote = loteData?.lotes_by_pk;

  // Garantir que o mapa seja renderizado apenas no lado do cliente
  useEffect(() => {
    const leafletLoaded = initLeaflet();
    if (leafletLoaded && canteiro?.latitude && canteiro?.longitude) {
      // Aqui você pode inicializar o mapa com as coordenadas do canteiro
      setMapLoaded(true);
    }
  }, [canteiro]);

  // Dados simulados para as abas
  const irrigationData = [
    { id: 1, data: "2025-04-15", volume_agua: 250, metodo: "Gotejamento" },
    { id: 2, data: "2025-04-22", volume_agua: 200, metodo: "Gotejamento" },
    { id: 3, data: "2025-04-29", volume_agua: 220, metodo: "Gotejamento" },
  ];

  const pestData = [
    { id: 1, data: "2025-04-10", tipo_praga: "Pulgão", metodo_controle: "Biológico", resultado: "Efetivo" },
    { id: 2, data: "2025-04-25", tipo_praga: "Cochonilha", metodo_controle: "Natural", resultado: "Parcial" },
  ];

  const harvestData = [
    { id: 1, data: "2025-05-15", quantidade: 120, unidade: "kg", qualidade: "Boa" },
    { id: 2, data: "2025-05-30", quantidade: 150, unidade: "kg", qualidade: "Excelente" },
  ];

  const plantingData = [
    { id: 1, data: "2025-04-01", cultura: "Alface", metodo: "Semente", densidade: "10 plantas/m²" },
    { id: 2, data: "2025-05-10", cultura: "Couve", metodo: "Muda", densidade: "5 plantas/m²" },
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
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Erro ao carregar dados do canteiro.</p>
        <Button onClick={() => navigate("/canteiros")}>Voltar para Canteiros</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/canteiros")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Canteiro: {canteiro?.nome}</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-md bg-slate-100 h-48 flex items-center justify-center">
              {mapLoaded ? (
                <div id="map" className="h-full w-full rounded-md" />
              ) : (
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">
                    {canteiro?.latitude && canteiro?.longitude
                      ? "Carregando mapa..."
                      : "Localização não definida"}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Informações do Canteiro</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">
                      <Badge variant={canteiro?.status === "Em cultivo" ? "default" : "outline"}>
                        {canteiro?.status || "Não definido"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Área</p>
                    <p className="font-medium">{canteiro?.area ? `${canteiro.area} m²` : "Não definida"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lote</p>
                    <p className="font-medium">
                      {lote?.nome ? (
                        <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/lotes/${lote.id}`)}>
                          {lote.nome}
                        </Button>
                      ) : (
                        "Não definido"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cultura atual</p>
                    <p className="font-medium">{cultura?.nome || "Sem cultura"}</p>
                  </div>
                  {cultura && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Ciclo estimado</p>
                        <p className="font-medium">
                          {cultura.ciclo_estimado_dias ? `${cultura.ciclo_estimado_dias} dias` : "Não definido"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Variedade</p>
                        <p className="font-medium">{cultura.variedade || "Não definida"}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => navigate(`/canteiros/editar/${canteiro.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Canteiro
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Canteiro
                </Button>
              </div>
            </div>
          </div>
        </CardContent>

        <CardContent>
          {/* Abas para gerenciamento do canteiro */}
          <Tabs defaultValue="planting" className="mt-6">
            <TabsList>
              <TabsTrigger value="planting">Plantios</TabsTrigger>
              <TabsTrigger value="irrigation">Irrigações</TabsTrigger>
              <TabsTrigger value="pests">Pragas</TabsTrigger>
              <TabsTrigger value="harvest">Colheitas</TabsTrigger>
            </TabsList>

            {/* Aba de Plantios */}
            <TabsContent value="planting" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Histórico de Plantios</h3>
                <Button size="sm">
                  Registrar Plantio
                </Button>
              </div>

              {plantingData.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cultura</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Densidade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {plantingData.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cultura}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.metodo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.densidade}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
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
                  Nenhum registro de plantio encontrado.
                </div>
              )}
            </TabsContent>

            {/* Aba de Irrigações */}
            <TabsContent value="irrigation">
              <IrrigationList 
                areaId={id!} 
                areaType="canteiro" 
                areaName={canteiro?.nome || "Canteiro"} 
              />
            </TabsContent>

            {/* Aba de Pragas */}
            <TabsContent value="pests" className="space-y-4">
              <PestList 
                areaId={id} 
                areaType="canteiro" 
                areaName={canteiro.nome} 
              />
            </TabsContent>

            {/* Aba de Colheitas */}
            <TabsContent value="harvest" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Histórico de Colheitas</h3>
                <Button size="sm">
                  Registrar Colheita
                </Button>
              </div>

              {harvestData.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualidade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {harvestData.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantidade} {item.unidade}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Badge variant={item.qualidade === "Excelente" ? "default" : "outline"}>
                              {item.qualidade}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
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
                  Nenhum registro de colheita encontrado.
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
          <CardDescription>Dados e métricas sobre o desempenho do canteiro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <LineChart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Estatísticas em desenvolvimento</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
              Aqui você poderá visualizar gráficos de produtividade, consumo de água e outros indicadores 
              específicos para este canteiro.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
