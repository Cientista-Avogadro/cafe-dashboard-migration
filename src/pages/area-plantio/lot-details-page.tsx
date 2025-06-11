import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lot } from "@/lib/types";
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
  DialogClose,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Textarea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, Droplets, Bug, LineChart, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PestList } from "@/components/pest-list";
import { IrrigationList } from "@/components/irrigation-list";
import { HarvestList } from "@/components/harvest-list";
import { LocationMap } from "@/components/map/LocationMap";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "@/components/ui/bar-chart";

// Importante: As irrigações são gerenciadas enviando apenas o campo relevante 
// para o banco de dados (lote_id, canteiro_id ou setor_id) dependendo do tipo 
// de área selecionado para respeitar a restrição de check no banco.

// Função para inicializar o Leaflet no lado do cliente
const initLeaflet = () => {
  if (typeof window !== "undefined") {
    return true;
  }
  return false;
};

// Interface para tipagem de irrigações
interface Irrigation {
  id: number;
  data: string;
  volume_agua: number;
  metodo: string;
  observacao?: string | null;
  created_at?: string;
  updated_at?: string;
}


const editFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  area: z.number().min(0, "Área deve ser maior que 0"),
  descricao: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  propriedade_id: z.string(),
  setor_id: z.string(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

export default function LotDetailsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute<{ id: string }>("/lotes/:id");
  const id = params?.id;
  const [, navigate] = useLocation(); // Usado para navegação
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
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

  // Query para buscar irrigações do lote
  const { data: irrigacoesData, isLoading: isLoadingIrrigacoes } = useQuery({
    queryKey: ["irrigacoes", id],
    queryFn: async () => {
      return await graphqlRequest("GET_IRRIGACOES_BY_LOTE", { lote_id: id, propriedade_id: user?.propriedade_id });
    },
  });

  // Query para buscar pragas do lote
  const { data: pragasData, isLoading: isLoadingPragas } = useQuery({
    queryKey: ["pragas", id],
    queryFn: async () => {
      return await graphqlRequest("GET_PRAGAS_BY_LOTE", { lote_id: id, propriedade_id: user?.propriedade_id });
    },
  });

  // Query para buscar colheitas do lote
  const { data: colheitasData, isLoading: isLoadingColheitas } = useQuery({
    queryKey: ["colheitas", id],
    queryFn: async () => {
      return await graphqlRequest("GET_COLHEITAS_BY_LOTE", { lote_id: id, propriedade_id: user?.propriedade_id });
    },
  });

  const lote: Lot = data?.lotes_by_pk!;
  const cultura = cultureData?.culturas_by_pk;
  const setor = sectorData?.setores_by_pk;
  const irrigacoes = irrigacoesData?.irrigacoes || [];
  const pragas = pragasData?.pragas || [];
  const colheitas = colheitasData?.colheitas || [];

  // Calcular estatísticas
  const totalAguaUsada = irrigacoes.reduce((acc: number, irr: any) => acc + (irr.volume_agua || 0), 0);
  const mediaAguaPorIrrigacao = Number(irrigacoes.length > 0 ? totalAguaUsada / irrigacoes.length : 0).toFixed(2);
  const totalPragas = pragas.length;
  const totalColheitas = colheitas.length;
  const totalProduzido = colheitas.reduce((acc: number, col: any) => {
    return acc + (Number(col.quantidade_colhida) || 0);
  }, 0);

  // Agrupar irrigações por mês para o gráfico
  const irrigacoesPorMes = irrigacoes.reduce((acc: Record<string, number>, irr: any) => {
    const mes = format(new Date(irr.data), 'MMM', { locale: ptBR });
    acc[mes] = (acc[mes] || 0) + (irr.volume_agua || 0);
    return acc;
  }, {});

  const dadosIrrigacao = Object.entries(irrigacoesPorMes).map(([mes, volume]) => ({
    mes,
    volume
  }));

  // Estado para controlar os diálogos
  const [isIrrigationDialogOpen, setIsIrrigationDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentIrrigation, setCurrentIrrigation] = useState<Irrigation | null>(null);
  const [irrigationToDelete, setIrrigationToDelete] = useState<number | null>(null);
  
  // Schema de validação para o formulário de irrigação
  const irrigationFormSchema = z.object({
    data: z.string().min(1, "A data é obrigatória"),
    volume_agua: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: "O volume deve ser um número positivo"
    }),
    metodo: z.string().min(1, "Método é obrigatório"),
  });

  // Tipo inferido do schema
  type IrrigationFormValues = z.infer<typeof irrigationFormSchema>;
  
  // Inicializar o formulário com react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<IrrigationFormValues>({
    resolver: zodResolver(irrigationFormSchema),
    defaultValues: {
      data: format(new Date(), "yyyy-MM-dd"),
      volume_agua: "",
      metodo: "",
    },
  });

  // Mutation para adicionar irrigação
  const addIrrigationMutation = useMutation({
    mutationFn: async (values: IrrigationFormValues) => {
      if (!id) throw new Error("ID do lote não informado");
      
      // Se não tivermos o propriedadeId do lote ainda, precisamos obtê-lo do lote
      // Isso garante que possamos adicionar irrigações mesmo para lotes sem registros anteriores
      if (!lote.propriedade_id && !data?.lotes_by_pk) {
        throw new Error("Dados do lote não encontrados");
      }
     
      
      // Pegar propriedadeId diretamente do lote se não estiver disponível ainda
      const lotePropId = lote.propriedade_id || (data?.lotes_by_pk!.propriedade_id);

      
      if (!lotePropId) {
        throw new Error("ID da propriedade não encontrado para este lote");
      }
      
      // Estruturar os dados conforme esperado pela API: dentro de um objeto 'irrigacao'
      const variables = {
        irrigacao: {
          data: format(values.data, "yyyy-MM-dd"),
          volume_agua: parseFloat(values.volume_agua.toString()),
          metodo: values.metodo,
          // Enviar os campos necessários para a irrigação
          lote_id: id, // Manter como string UUID
          propriedade_id: lotePropId,
        }
      };
      
      return await graphqlRequest("INSERT_IRRIGACAO" as any, variables);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Registro de irrigação adicionado com sucesso",
      });
      setIsIrrigationDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["lote", id] });
    },
    onError: (error: Error) => {
      console.log(error)
      toast({
        title: "Erro",
        description: `Falha ao adicionar registro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar irrigação
  const updateIrrigationMutation = useMutation({
    mutationFn: async (values: IrrigationFormValues & { id: number }) => {
      if (!lote.propriedade_id) throw new Error("ID da propriedade não informado");
      
      // Estruturar os dados conforme esperado pela API: dentro de um objeto 'irrigacao'
      const variables = {
        id: values.id,
        irrigacao: {
          data: format(values.data, "yyyy-MM-dd"),
          volume_agua: parseFloat(values.volume_agua.toString()),
          metodo: values.metodo,
          // Removido campo observacao pois não existe no banco de dados
          // Garantir que o propriedade_id esteja incluído para validação
          propriedade_id: lote.propriedade_id,
        }
      };
      // Using any as a workaround for the type issue with GraphQL query names
      return await graphqlRequest("EDIT_IRRIGACAO" as any, variables);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Registro de irrigação atualizado com sucesso",
      });
      setIsIrrigationDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["lote", id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar registro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir irrigação
  const deleteIrrigationMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!lote.propriedade_id) throw new Error("ID da propriedade não informado");
      // A exclusão provavelmente também espera uma estrutura específica
      return await graphqlRequest("DELETE_IRRIGACAO" as any, { 
        where: {
          id: { _eq: id },
          propriedade_id: { _eq: lote.propriedade_id }
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Registro de irrigação excluído com sucesso",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["lote", id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Falha ao excluir registro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Função para lidar com o envio do formulário
  const onSubmitIrrigationForm = (values: IrrigationFormValues) => {
    if (currentIrrigation) {
      updateIrrigationMutation.mutate({
        ...values,
        id: currentIrrigation.id,
      });
    } else {
      addIrrigationMutation.mutate(values);
    }
    setIsIrrigationDialogOpen(false);
    reset(); // Limpar formulário
  };

  // Função para abrir o diálogo de edição
  const handleEditIrrigation = (irrigation: Irrigation) => {
    setCurrentIrrigation(irrigation);
    // Formato YYYY-MM-DD - substring para garantir o formato correto para o input date
    setValue("data", irrigation.data.substring(0, 10)); 
    setValue("volume_agua", String(irrigation.volume_agua));
    setValue("metodo", irrigation.metodo);
    setIsIrrigationDialogOpen(true);
  };

  // Função para abrir o diálogo de criação
  const handleCreateIrrigation = () => {
    setCurrentIrrigation(null);
    reset({
      data: format(new Date(), "yyyy-MM-dd"),
      volume_agua: "",
      metodo: "",
    });
    setIsIrrigationDialogOpen(true);
  };

  // Função para confirmar exclusão
  const handleDeleteConfirm = () => {
    if (irrigationToDelete) {
      deleteIrrigationMutation.mutate(irrigationToDelete);
    }
  };

  // Função para abrir diálogo de confirmação de exclusão
  const handleDeleteClick = (id: number) => {
    setIrrigationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Garantir que o mapa seja renderizado apenas no lado do cliente
  useEffect(() => {
    const leafletLoaded = initLeaflet();
    if (leafletLoaded && lote?.latitude && lote?.longitude) {
      // Aqui você pode inicializar o mapa com as coordenadas do lote
      // Exemplo: L.map('map').setView([lote.latitude, lote.longitude], 13);
      setMapLoaded(true);
    }
  }, [lote]);

  // Formulário de edição
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      nome: "",
      area: 0,
      descricao: "",
      latitude: undefined,
      longitude: undefined,
      propriedade_id: user?.propriedade_id || "",
      setor_id: "",
    },
  });

  // Atualizar o formulário quando o lote for carregado
  useEffect(() => {
    if (lote) {
      form.reset({
        nome: lote.nome,
        area: lote.area,
        descricao: lote.descricao || "",
        latitude: lote.latitude,
        longitude: lote.longitude,
        propriedade_id: lote.propriedade_id,
        setor_id: lote.setor_id,
      });
    }
  }, [lote, form]);

  // Mutation para atualizar lote
  const updateLotMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      return await graphqlRequest("UPDATE_LOT", {
        id: id,
        lote: {
          nome: data.nome,
          descricao: data.descricao,
          area: data.area,
          latitude: data.latitude,
          longitude: data.longitude,
          setor_id: data.setor_id,
          propriedade_id: data.propriedade_id,
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Lote atualizado com sucesso",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["lote", id] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar lote",
        variant: "destructive",
      });
    },
  });

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

  const onSubmit = async(data: EditFormValues) => {
    await updateLotMutation.mutateAsync(data);
    setIsEditDialogOpen(false);
  };


  console.log(cultureData);
  

  const handleEditClick = () => {
    if (lote) {
      form.reset({
        nome: lote.nome,
        descricao: lote.descricao || "",
        area: lote.area,
        latitude: lote.latitude,
        longitude: lote.longitude,
        setor_id: lote.setor_id,
        propriedade_id: lote.propriedade_id,
      });
      setIsEditDialogOpen(true);
    }
  };

  const deleteLoteMutation = useMutation({
    mutationFn: async () => {
      return await graphqlRequest("DELETE_LOTE", { id });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Lote removido com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["lotes"] });
      navigate("/lotes");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao remover lote",
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
      <div className="flex md:items-center justify-between md:flex-row flex-col space-y-2 mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/lotes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Lote: {lote?.nome}</h1>
        </div>
        <div className="flex gap-2">
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

      {/* Informações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Lote</CardTitle>
          <CardDescription>Detalhes e características do lote</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative h-64 rounded-lg overflow-hidden bg-slate-100 z-0">
              {lote?.latitude && lote?.longitude && (
                <div className="mt-4">
                  <LocationMap
                    latitude={lote.latitude}
                    longitude={lote.longitude}
                    title={lote.nome}
                    className="z-0"
                  />
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
                    {lote.area ? `${lote.area} ha` : 'Não informada'}
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
            </div>
          </div>
        </CardContent>
      </Card>

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
            <TabsContent value="irrigation">
              <IrrigationList 
                areaId={id!} 
                areaType="lote" 
                areaName={lote?.nome || "Lote"} 
              />
            </TabsContent>

            {/* Aba de Pragas */}
            <TabsContent value="pests" className="space-y-4">
              <PestList 
                areaId={id!} 
                areaType="lote" 
                areaName={lote.nome} 
              />
            </TabsContent>

            {/* Aba de Colheitas */}
            <TabsContent value="harvest" className="space-y-6">
              <HarvestList areaType="lote" areaId={id!} />
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
                        Média de {mediaAguaPorIrrigacao} Litros por Irrigação
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este lote? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLoteMutation.mutate()}
              disabled={deleteLoteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoteMutation.isPending ? (
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="z-50 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Lote</DialogTitle>
            <DialogDescription>
              Atualize as informações do lote.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Lote</FormLabel>
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
                    <FormLabel>Área (ha)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
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
                  <Button type="button" variant="outline" onClick={getCurrentLocation}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Capturar
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateLotMutation.isPending}
                >
                  {updateLotMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Salvando...
                    </>
                  ) : (
                    "Salvar alterações"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
