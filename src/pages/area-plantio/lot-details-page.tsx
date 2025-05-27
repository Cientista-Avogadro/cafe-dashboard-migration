import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lot } from "@/lib/types";
import { graphqlRequest } from "@/lib/queryClient";
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
} from "@/components/ui";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Calendar, Droplets, Bug, LineChart, Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

export default function LotDetailsPage() {
  const { toast } = useToast();
  const [, params] = useRoute<{ id: string }>("/lotes/:id");
  const id = params?.id;
  const [, navigate] = useLocation(); // Usado para navegação
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

  // Acessamos a propriedade_id diretamente do lote para garantir que funcione mesmo que o lote não tenha irrigações
  const propriedadeId = data?.lotes_by_pk?.propriedade_id;
  
  // Query para buscar irrigações do lote
  const { data: irrigationData, isLoading: isLoadingIrrigations, refetch: refetchIrrigations } = useQuery({
    queryKey: ["irrigacoes", id, propriedadeId],
    queryFn: async () => {
      // Se não tiver propriedadeId, retornamos um array vazio, mas ainda permitimos adicionar irrigações
      if (!id || !propriedadeId) return { irrigacoes: [] };
      return await graphqlRequest("GET_IRRIGACOES_BY_LOTE" as any, { 
        lote_id: id, // Enviar como string UUID original
        propriedade_id: propriedadeId
      });
    },
    // A query só executa se tiver id e propriedadeId
    enabled: !!id && !!propriedadeId
  });

  const lote = data?.lotes_by_pk;
  const cultura = cultureData?.culturas_by_pk;
  const setor = sectorData?.setores_by_pk;
  const irrigacoes = irrigationData?.irrigacoes || [];

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
      if (!propriedadeId && !data?.lotes_by_pk) {
        throw new Error("Dados do lote não encontrados");
      }
     
      
      // Pegar propriedadeId diretamente do lote se não estiver disponível ainda
      const lotePropId = propriedadeId || (data?.lotes_by_pk!.propriedade_id);

      
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
      refetchIrrigations();
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
      if (!propriedadeId) throw new Error("ID da propriedade não informado");
      
      // Estruturar os dados conforme esperado pela API: dentro de um objeto 'irrigacao'
      const variables = {
        id: values.id,
        irrigacao: {
          data: format(values.data, "yyyy-MM-dd"),
          volume_agua: parseFloat(values.volume_agua.toString()),
          metodo: values.metodo,
          // Removido campo observacao pois não existe no banco de dados
          // Garantir que o propriedade_id esteja incluído para validação
          propriedade_id: propriedadeId,
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
      refetchIrrigations();
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
      if (!propriedadeId) throw new Error("ID da propriedade não informado");
      // A exclusão provavelmente também espera uma estrutura específica
      return await graphqlRequest("DELETE_IRRIGACAO" as any, { 
        where: {
          id: { _eq: id },
          propriedade_id: { _eq: propriedadeId }
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Registro de irrigação excluído com sucesso",
      });
      setIsDeleteDialogOpen(false);
      refetchIrrigations();
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

  // Dados simulados para as abas (apenas para pragas e colheitas)
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
                <Button size="sm" onClick={handleCreateIrrigation}>
                  <Plus className="h-4 w-4 mr-1" /> Registrar Irrigação
                </Button>
              </div>

              {isLoadingIrrigations ? (
                <div className="space-y-2 py-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : irrigacoes.length > 0 ? (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (L)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {irrigacoes.map((item: Irrigation) => (
                        <tr key={item.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(item.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.volume_agua} L</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.metodo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.observacao || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditIrrigation(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(item.id)}>
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
              
              {/* Diálogo para adicionar/editar irrigação */}
              <Dialog open={isIrrigationDialogOpen} onOpenChange={setIsIrrigationDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {currentIrrigation ? "Editar Registro de Irrigação" : "Novo Registro de Irrigação"}
                    </DialogTitle>
                    <DialogDescription>
                      {currentIrrigation 
                        ? "Atualize os detalhes do registro de irrigação abaixo." 
                        : "Preencha os detalhes do novo registro de irrigação."}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit(onSubmitIrrigationForm)} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="data">Data da Irrigação</Label>
                        <Input 
                          id="data" 
                          type="date" 
                          {...register("data")} 
                          className={errors.data ? "border-red-500" : ""}
                        />
                        {errors.data && (
                          <p className="text-red-500 text-xs mt-1">{errors.data.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="volume_agua">Volume de Água (L)</Label>
                        <Input 
                          id="volume_agua" 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          {...register("volume_agua")} 
                          className={errors.volume_agua ? "border-red-500" : ""}
                        />
                        {errors.volume_agua && (
                          <p className="text-red-500 text-xs mt-1">{errors.volume_agua.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="metodo">Método de Irrigação</Label>
                      <Select
                        defaultValue={currentIrrigation?.metodo || ""}
                        onValueChange={(value) => setValue("metodo", value)}
                      >
                        <SelectTrigger
                          id="metodo"
                          className={errors.metodo ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Selecione um método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aspersão">Aspersão</SelectItem>
                          <SelectItem value="Gotejamento">Gotejamento</SelectItem>
                          <SelectItem value="Microaspersão">Microaspersão</SelectItem>
                          <SelectItem value="Inundação">Inundação</SelectItem>
                          <SelectItem value="Sulcos">Sulcos</SelectItem>
                          <SelectItem value="Manual">Manual</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.metodo && (
                        <p className="text-red-500 text-xs mt-1">{errors.metodo.message}</p>
                      )}
                    </div>
                    
                    <DialogFooter className="pt-4">
                      <DialogClose asChild>
                        <Button variant="outline" type="button">
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button 
                        type="submit" 
                        disabled={addIrrigationMutation.isPending || updateIrrigationMutation.isPending}
                      >
                        {addIrrigationMutation.isPending || updateIrrigationMutation.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              
              {/* Diálogo de confirmação para exclusão */}
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este registro de irrigação? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteConfirm}
                      disabled={deleteIrrigationMutation.isPending}
                    >
                      {deleteIrrigationMutation.isPending ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
