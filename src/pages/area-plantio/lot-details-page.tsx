import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lot, Crop } from "@/lib/types";
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

// Função para inicializar o Leaflet no lado do cliente
const initLeaflet = () => {
  if (typeof window !== "undefined") {
    return true;
  }
  return false;
};

export default function LotDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/lotes/:id");
  const id = params?.id;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient()
  const { user } = useAuth();
  const [mapLoaded, setMapLoaded] = useState(false);
  

  // Query para buscar detalhes do lote
  const { data, isLoading, error } = useQuery<{ lotes_by_pk: Lot }>({
    queryKey: ["lote", id],
    queryFn: async () => {
      if (!id) throw new Error("ID do lote não fornecido");
      return await graphqlRequest("GET_LOTE_BY_ID", { id: id });
    },
    enabled: !!id
  });

  // Query para buscar detalhes da cultura
  const { data: cultureData } = useQuery({
    queryKey: ["cultura", data?.lotes_by_pk?.cultura_atual_id],
    queryFn: async () => {
      if (!data?.lotes_by_pk?.cultura_atual_id) return null;
      return await graphqlRequest("GET_CULTURA_BY_ID", { id: data.lotes_by_pk.cultura_atual_id });
    },
    enabled: !!data?.lotes_by_pk?.cultura_atual_id
  });

  // Query para buscar detalhes do setor
  const { data: sectorData } = useQuery({
    queryKey: ["setor", data?.lotes_by_pk?.setor_id],
    queryFn: async () => {
      if (!data?.lotes_by_pk?.setor_id) return null;
      return await graphqlRequest("GET_SECTOR_BY_ID", { id: data.lotes_by_pk.setor_id });
    },
    enabled: !!data?.lotes_by_pk?.setor_id
  });

  const lote: Lot = data?.lotes_by_pk!
  const cultura = cultureData?.culturas_by_pk
  const setor = sectorData?.setores_by_pk;

  // Garantir que o mapa seja renderizado apenas no lado do cliente
  useEffect(() => {
   
    const leafletLoaded = initLeaflet();
    if (leafletLoaded && lote?.latitude && lote?.longitude) {
      // Aqui você pode inicializar o mapa com as coordenadas do lote
      // Exemplo: L.map('map').setView([lote.latitude, lote.longitude], 13);
      setMapLoaded(true);
    }
    console.log(cultureData)
  }, [lote]);

  // Dados simulados para as abas
  const irrigationData = [
    { id: 1, data: "2025-04-15", volume_agua: 2500, metodo: "Aspersão" },
    { id: 2, data: "2025-04-22", volume_agua: 2000, metodo: "Gotejamento" },
    { id: 3, data: "2025-04-29", volume_agua: 2200, metodo: "Aspersão" },
  ];

  const pestData = [
    { id: 1, data: "2025-04-10", tipo_praga: "Pulgão", metodo_controle: "Biológico", resultado: "Efetivo" },
    { id: 2, data: "2025-04-25", tipo_praga: "Lagarta", metodo_controle: "Químico", resultado: "Parcial" },
  ];

  const harvestData = [
    { id: 1, data: "2025-05-15", quantidade: 1200, unidade: "kg", qualidade: "Boa" },
    { id: 2, data: "2025-05-30", quantidade: 1500, unidade: "kg", qualidade: "Excelente" },
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
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !lote) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Erro ao carregar detalhes do lote</h2>
        <p className="text-slate-500 mb-6">{error?.message || "Lote não encontrado"}</p>
        <Button onClick={() => navigate("/lotes")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Lotes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/lotes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{lote.nome}</h1>
            <p className="text-slate-500">Detalhes e atividades do lote</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Informações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Lote</CardTitle>
          <CardDescription>Detalhes e características do lote</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative h-64 rounded-lg overflow-hidden bg-slate-100">
              {mapLoaded ? (
                <div id="map" className="h-full w-full"></div>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500">
                      {lote.latitude && lote.longitude
                        ? "Carregando mapa..."
                        : "Coordenadas não disponíveis"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Setor</h3>
                  <p className="text-lg font-medium">{setor?.nome || "Não especificado"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500">Status</h3>
                  <Badge variant={lote.status === 'Ativo' ? 'default' : 'outline'} className="mt-1">
                    {lote.status || 'Não definido'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500">Área</h3>
                  <p className="text-lg font-medium">
                    {lote.area ? `${lote.area} m²` : 'Não informada'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500">Cultura Atual</h3>
                  <p className="text-lg font-medium">
                    {cultura?.nome || 'Nenhuma cultura definida'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Localização</h3>
                  <p className="text-sm text-slate-700">
                    {lote.latitude && lote.longitude 
                      ? `${lote.latitude.toFixed(6)}, ${lote.longitude.toFixed(6)}`
                      : 'Não especificada'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <h3 className="text-sm font-medium text-slate-500 mb-1">Última Atualização</h3>
                  <p className="text-sm text-slate-700">
                    {lote.updated_at 
                      ? format(new Date(lote.updated_at), "PPp", { locale: ptBR }) 
                      : 'Não informada'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="outline" className="w-1/2">
                  <Edit className="h-4 w-4 mr-2" /> Editar Lote
                </Button>
                <Button variant="secondary" className="w-1/2">
                  <MapPin className="h-4 w-4 mr-2" /> Gerenciar Localização
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades e Registros</CardTitle>
          <CardDescription>Histórico de atividades realizadas neste lote</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="irrigation">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="irrigation">
                <Droplets className="mr-2 h-4 w-4" />
                Irrigações
              </TabsTrigger>
              <TabsTrigger value="pests">
                <Bug className="mr-2 h-4 w-4" />
                Pragas
              </TabsTrigger>
              <TabsTrigger value="harvest">
                <Calendar className="mr-2 h-4 w-4" />
                Colheitas
              </TabsTrigger>
            </TabsList>

            {/* Aba de Irrigações */}
            <TabsContent value="irrigation" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Histórico de Irrigações</h3>
                <Button size="sm">
                  Registrar Irrigação
                </Button>
              </div>

              {irrigationData.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (L)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {irrigationData.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.volume_agua}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.metodo}</td>
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
                  Nenhum registro de irrigação encontrado.
                </div>
              )}
            </TabsContent>

            {/* Aba de Pragas */}
            <TabsContent value="pests" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Histórico de Pragas</h3>
                <Button size="sm">
                  Registrar Praga
                </Button>
              </div>

              {pestData.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método de Controle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pestData.map((item) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.tipo_praga}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.metodo_controle}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <Badge variant={item.resultado === "Efetivo" ? "default" : "outline"}>
                              {item.resultado}
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
                  Nenhum registro de pragas encontrado.
                </div>
              )}
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

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
          <CardDescription>Detalhes adicionais sobre o lote</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-2">Descrição</h4>
              <p className="text-slate-700">
                {lote.descricao || "Nenhuma descrição disponível para este lote."}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-2">Observações</h4>
              <p className="text-slate-700">
                {lote.observacao || "Nenhuma observação registrada para este lote."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos e Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
          <CardDescription>Dados e métricas sobre o desempenho do lote</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <LineChart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Estatísticas em desenvolvimento</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
              Aqui você poderá visualizar gráficos de produtividade, consumo de água e outros indicadores.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
