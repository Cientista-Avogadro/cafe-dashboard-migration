import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Canteiro, Crop, Lot } from "@/lib/types";
import { Irrigacao, Colheita } from "@/graphql/types";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast, useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, Droplets, Bug, LineChart, Edit, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PestList } from "@/components/pest-list";
import { IrrigationList } from "@/components/irrigation-list";
import { HarvestList } from "@/components/harvest-list";
import { LocationMap } from "@/components/map/LocationMap";
import { useForm } from "react-hook-form";
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  ResponsiveContainer,
} from "@/components/ui/bar-chart";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  // Query para buscar irrigações do canteiro
  const { data: irrigacoesData, isLoading: isLoadingIrrigacoes } = useQuery({
    queryKey: ["irrigacoes", id],
    queryFn: async () => {
      return await graphqlRequest("GET_IRRIGACOES_BY_CANTEIRO", { canteiro_id: id, propriedade_id: user?.propriedade_id });
    },
  });

  // Query para buscar pragas do canteiro
  const { data: pragasData, isLoading: isLoadingPragas } = useQuery({
    queryKey: ["pragas", id],
    queryFn: async () => {
      return await graphqlRequest("GET_PRAGAS_BY_CANTEIRO", { canteiro_id: id, propriedade_id: user?.propriedade_id });
    },
  });

  // Query para buscar colheitas do canteiro
  const { data: colheitasData, isLoading: isLoadingColheitas } = useQuery({
    queryKey: ["colheitas", id],
    queryFn: async () => {
      return await graphqlRequest("GET_COLHEITAS", { canteiro_id: id });
    },
  });

  const canteiro: Canteiro = data?.canteiros_by_pk!;
  const cultura = cultureData?.culturas_by_pk;
  const lote = loteData?.lotes_by_pk;
  const irrigacoes = irrigacoesData?.irrigacoes || [];
  const pragas = pragasData?.pragas || [];
  const colheitas = colheitasData?.colheitas || [];

  console.log('Dados de colheita:', colheitasData);
  console.log('Colheitas:', colheitas);

  // Calcular estatísticas
  const totalAguaUsada = irrigacoes.reduce((acc: number, irr: Irrigacao) => acc + (irr.volume_agua || 0), 0);
  const mediaAguaPorIrrigacao = irrigacoes.length > 0 ? totalAguaUsada / irrigacoes.length : 0;
  const totalPragas = pragas.length;
  const totalColheitas = colheitas.length;
  const totalProduzido = colheitas.reduce((acc: number, col: Colheita) => {
    console.log('Colheita:', col);
    return acc + (Number(col.quantidade_colhida) || 0);
  }, 0);

  console.log('Total produzido:', totalProduzido);

  // Agrupar irrigações por mês para o gráfico
  const irrigacoesPorMes = irrigacoes.reduce((acc: Record<string, number>, irr: Irrigacao) => {
    const mes = format(new Date(irr.data), 'MMM', { locale: ptBR });
    acc[mes] = (acc[mes] || 0) + (irr.volume_agua || 0);
    return acc;
  }, {});

  const dadosIrrigacao = Object.entries(irrigacoesPorMes).map(([mes, volume]) => ({
    mes,
    volume
  }));

  // Garantir que o mapa seja renderizado apenas no lado do cliente
  useEffect(() => {
    const leafletLoaded = initLeaflet();
    if (leafletLoaded && canteiro?.latitude && canteiro?.longitude) {
      // Aqui você pode inicializar o mapa com as coordenadas do canteiro
      setMapLoaded(true);
    }
  }, [canteiro]);

  // Função para capturar localização
  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          toast({
            title: "Localização capturada",
            description: "As coordenadas foram atualizadas com sucesso.",
          });
        },
        (error) => {
          toast({
            title: "Erro ao capturar localização",
            description: error.message,
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Erro",
        description: "Geolocalização não é suportada neste navegador.",
        variant: "destructive",
      });
    }
  };

  const form = useForm({
    defaultValues: {
      nome: canteiro?.nome,
      status: canteiro?.status,
      area: canteiro?.area,
      lote_id: canteiro?.lote_id,
      cultura_id: canteiro?.cultura_id,
      latitude: canteiro?.latitude,
      longitude: canteiro?.longitude,
    },
  });

  // Mutation para atualizar canteiro
  const updateCanteiroMutation = useMutation({
    mutationFn: async (data: any) => {
      return await graphqlRequest("UPDATE_CANTEIRO", {
        id: id,
        canteiro: {
          nome: data.nome,
          status: data.status,
          area: data.area,
          latitude: data.latitude,
          longitude: data.longitude,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Canteiro atualizado com sucesso",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["canteiro", id] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar canteiro",
        variant: "destructive",
      });
    },
  });

  const onEditSubmit = async (data: any) => {
    updateCanteiroMutation.mutate(data);
  };

  // Atualizar o formulário quando o canteiro for carregado
  useEffect(() => {
    if (canteiro) {
      form.reset({
        nome: canteiro.nome,
        status: canteiro.status,
        area: canteiro.area,
        lote_id: canteiro.lote_id,
        cultura_id: canteiro.cultura_id,
        latitude: canteiro.latitude,
        longitude: canteiro.longitude,
      });
    }
  }, [canteiro, form]);

  const deleteCanteiroMutation = useMutation({
    mutationFn: async () => {
      return await graphqlRequest("DELETE_CANTEIRO", { id });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Canteiro removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["canteiros"] });
      navigate("/canteiros");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover canteiro",
        variant: "destructive",
      });
    },
  });

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
      <div className="flex md:items-center justify-between md:flex-row flex-col space-y-2 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/canteiros")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Canteiro: {canteiro?.nome}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Remover
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-0">
            <div className="z-0 rounded-md bg-slate-100 h-48">
              {canteiro?.latitude && canteiro?.longitude ? (
                <LocationMap
                  latitude={canteiro.latitude}
                  longitude={canteiro.longitude}
                  title={canteiro.nome}
                  height="100%"
                  className="z-0"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">
                      Localização não definida
                    </p>
                  </div>
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
                    <p className="font-medium">{canteiro?.area ? `${canteiro.area} ha` : "Não definida"}</p>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas para gerenciamento do canteiro */}
      <Tabs defaultValue="irrigation" className="mt-6">
        <TabsList>
          <TabsTrigger value="irrigation">Irrigações</TabsTrigger>
          <TabsTrigger value="pests">Pragas</TabsTrigger>
          <TabsTrigger value="harvest">Colheitas</TabsTrigger>
        </TabsList>

       
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
            areaId={id!} 
            areaType="canteiro" 
            areaName={canteiro.nome} 
          />
        </TabsContent>

        {/* Aba de Colheitas */}
        <TabsContent value="harvest" className="space-y-4">
          <HarvestList areaType="canteiro" areaId={id!} />
        </TabsContent>
      </Tabs>

      {/* Gráficos e Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
          <CardDescription>Dados e métricas sobre o desempenho do canteiro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Métricas Gerais</h3>
              <div className="grid grid-cols-2 gap-4">
                {isLoadingIrrigacoes ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        <Skeleton className="h-4 w-[100px]" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-[60px]" />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Água Usada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalAguaUsada}L</div>
                      <p className="text-xs text-muted-foreground">
                        Média de {mediaAguaPorIrrigacao}L por irrigação
                      </p>
                    </CardContent>
                  </Card>
                )}
                {isLoadingPragas ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        <Skeleton className="h-4 w-[100px]" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-[60px]" />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Pragas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalPragas}</div>
                      <p className="text-xs text-muted-foreground">
                        {pragas.length} pragas registradas
                      </p>
                    </CardContent>
                  </Card>
                )}
                {isLoadingColheitas ? (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        <Skeleton className="h-4 w-[100px]" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-[60px]" />
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Colheitas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalColheitas}</div>
                      <p className="text-xs text-muted-foreground">
                        {totalProduzido}kg produzidos
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Consumo de Água por Mês</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosIrrigacao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="volume" fill="#10B981" name="Volume (L)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="z-50 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Canteiro</DialogTitle>
            <DialogDescription>
              Atualize as informações do canteiro.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Canteiro</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                        {...field}
                      >
                        <option value="Disponível">Disponível</option>
                        <option value="Em cultivo">Em cultivo</option>
                        <option value="Em manutenção">Em manutenção</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Localização</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="number" step="any" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="number" step="any" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="shrink-0"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updateCanteiroMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={updateCanteiroMutation.isPending}
                >
                  {updateCanteiroMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Canteiro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este canteiro? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCanteiroMutation.mutate()}
              disabled={deleteCanteiroMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCanteiroMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Removendo...
                </>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
