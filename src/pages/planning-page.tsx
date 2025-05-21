import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Planejamento, Lot, Canteiro, Crop } from "@/lib/types";
import { queryClient, graphqlRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Input,
  Skeleton,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

const planejamentoSchema = z.object({
  cultura_id: z.string().uuid("ID da cultura inválido"),
  lote_id: z.string().uuid("ID do lote inválido").optional(),
  canteiro_id: z.string().uuid("ID do canteiro inválido").optional(),
  data_inicio: z.date({
    required_error: "Data de início é obrigatória",
  }),
  data_fim_prevista: z.date({
    required_error: "Data de fim prevista é obrigatória",
  }),
  status: z.string().optional(),
});

// Schema estendido para edição, incluindo o ID
const planejamentoEditSchema = planejamentoSchema.extend({
  id: z.string().uuid("ID do planejamento inválido")
});

type PlanejamentoFormValues = z.infer<typeof planejamentoSchema>;

export default function PlanningPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlanejamento, setSelectedPlanejamento] = useState<Planejamento | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<'lotes' | 'canteiros'>('lotes');
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [selectedCanteiroId, setSelectedCanteiroId] = useState<string | null>(null);

  // Query para buscar culturas para o dropdown
  const { data: culturasData } = useQuery<{ culturas: Array<{ id: string; nome: string; ciclo_estimado_dias?: number }> }>({  
    queryKey: ["culturas", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { culturas: [] };
      const response = await graphqlRequest("GET_ALL_CULTURAS", { propriedade_id: user.propriedade_id });
      return response;
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar setores para o dropdown
  const { data: setoresData } = useQuery<{ setores: Array<{ id: string; nome: string }> }>({  
    queryKey: ["setores", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { setores: [] };
      return await graphqlRequest("GET_SETORES", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });
  
  // Query para buscar lotes para o dropdown
  const { data: lotesData } = useQuery<{ lotes: Lot[] }>({  
    queryKey: ["all-lotes", user?.propriedade_id, setoresData],
    queryFn: async () => {
      if (!user?.propriedade_id) return { lotes: [] };
      // Aqui precisaríamos de uma query para buscar todos os lotes da propriedade
      const allLotes: Lot[] = [];
      if (setoresData?.setores) {
        for (const setor of setoresData.setores) {
          const result = await graphqlRequest("GET_LOTES", { setor_id: setor.id });
          if (result.lotes) {
            result.lotes.forEach((lote: Lot) => {
              allLotes.push({
                ...lote,
                setor_nome: setor.nome
              });
            });
          }
        }
      }
      return { lotes: allLotes };
    },
    enabled: !!user?.propriedade_id && !!setoresData?.setores,
  });

  // Query para buscar canteiros para o dropdown
  const { data: canteirosData } = useQuery<{ canteiros: Canteiro[] }>({  
    queryKey: ["all-canteiros", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { canteiros: [] };
      // Apenas passamos propriedade_id para evitar o erro de uuid null
      const result = await graphqlRequest("GET_CANTEIROS", { 
        propriedade_id: user.propriedade_id 
      });
      return result;
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar todos os planejamentos da propriedade
  const { data: allPlanejamentosData, isLoading: isAllPlanejamentosLoading } = useQuery<{ planejamentos: Planejamento[] }>({  
    queryKey: ["all-planejamentos", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { planejamentos: [] };
      
      try {
        // Buscar todos os planejamentos da propriedade com apenas o filtro de propriedade_id
        const result = await graphqlRequest("GET_PLANEJAMENTOS", { 
          propriedade_id: user.propriedade_id
        });
        
        if (!result.planejamentos) return { planejamentos: [] };
        
        // Adicionar informações de cultura, lote e canteiro para exibição
        if (culturasData?.culturas) {
          result.planejamentos.forEach((planejamento: Planejamento) => {
            // Adicionar cultura
            const cultura = culturasData.culturas.find(c => c.id === planejamento.cultura_id);
            if (cultura) {
              planejamento.cultura = cultura;
            }
            
            // Adicionar lote
            if (planejamento.lote_id && lotesData?.lotes) {
              const lote = lotesData.lotes.find(l => l.id === planejamento.lote_id);
              if (lote) {
                planejamento.lote = lote;
              }
            }
            
            // Adicionar canteiro
            if (planejamento.canteiro_id && canteirosData?.canteiros) {
              const canteiro = canteirosData.canteiros.find(c => c.id === planejamento.canteiro_id);
              if (canteiro) {
                planejamento.canteiro = canteiro;
              }
            }
          });
        }
        
        return result;
      } catch (error) {
        console.error("Erro ao buscar planejamentos:", error);
        return { planejamentos: [] };
      }
    },
    enabled: !!user?.propriedade_id && !!culturasData?.culturas && !!lotesData?.lotes && !!canteirosData?.canteiros,
  });
  
  // Derivar planejamentos de lotes a partir de allPlanejamentosData
  const lotePlanejamentosData = useMemo(() => {
    if (!allPlanejamentosData?.planejamentos || !selectedLoteId) return { planejamentos: [] };
    return {
      planejamentos: allPlanejamentosData.planejamentos.filter(p => p.lote_id === selectedLoteId)
    };
  }, [allPlanejamentosData, selectedLoteId]);
  
  // Derivar planejamentos de canteiros a partir de allPlanejamentosData
  const canteiroPlanejamentosData = useMemo(() => {
    if (!allPlanejamentosData?.planejamentos || !selectedCanteiroId) return { planejamentos: [] };
    return {
      planejamentos: allPlanejamentosData.planejamentos.filter(p => p.canteiro_id === selectedCanteiroId)
    };
  }, [allPlanejamentosData, selectedCanteiroId]);
  
  // Flags de carregamento derivados
  const isLotePlanejamentosLoading = isAllPlanejamentosLoading;
  const isCanteiroPlanejamentosLoading = isAllPlanejamentosLoading;

  // Mutation para adicionar planejamento
  const addPlanejamentoMutation = useMutation({
    mutationFn: async (data: PlanejamentoFormValues) => {
      if (!user?.propriedade_id) {
        throw new Error("Usuário não possui propriedade associada");
      }
      
      // Encontrar o setor_id se um lote foi selecionado
      let setor_id = undefined;
      if (data.lote_id) {
        const lote = lotesData?.lotes?.find(l => l.id === data.lote_id);
        setor_id = lote?.setor_id;
      }
      
      const planejamentoData = {
        cultura_id: data.cultura_id,
        lote_id: data.lote_id,
        canteiro_id: data.canteiro_id,
        data_inicio: format(data.data_inicio, 'yyyy-MM-dd'),
        data_fim_prevista: format(data.data_fim_prevista, 'yyyy-MM-dd'),
        status: data.status || "Planejado",
        propriedade_id: user.propriedade_id,
        setor_id: setor_id
      };
      
      return await graphqlRequest("INSERT_PLANEJAMENTO", { planejamento: planejamentoData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-planejamentos"] });
      queryClient.invalidateQueries({ queryKey: ["planejamentos-lote"] });
      queryClient.invalidateQueries({ queryKey: ["planejamentos-canteiro"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Planejamento adicionado",
        description: "O planejamento foi adicionado com sucesso.",
      });
      addForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar planejamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formulário para adicionar planejamento
  const addForm = useForm<PlanejamentoFormValues>({
    resolver: zodResolver(planejamentoSchema),
    defaultValues: {
      cultura_id: "",
      lote_id: selectedTab === 'lotes' ? selectedLoteId || undefined : undefined,
      canteiro_id: selectedTab === 'canteiros' ? selectedCanteiroId || undefined : undefined,
      data_inicio: new Date(),
      data_fim_prevista: new Date(new Date().setDate(new Date().getDate() + 30)),
      status: "Planejado",
    },
  });

  // Atualizar valores padrão quando mudar a aba ou seleção
  useEffect(() => {
    if (selectedTab === 'lotes') {
      addForm.setValue('lote_id', selectedLoteId || undefined);
      addForm.setValue('canteiro_id', undefined);
    } else {
      addForm.setValue('canteiro_id', selectedCanteiroId || undefined);
      addForm.setValue('lote_id', undefined);
    }
  }, [selectedTab, selectedLoteId, selectedCanteiroId, addForm]);

  // Função de submit do formulário de adição
  const onAddSubmit = (data: PlanejamentoFormValues) => {
    addPlanejamentoMutation.mutate(data);
  };
  
  // Mutation para editar um planejamento
  const editPlanejamentoMutation = useMutation({
    mutationFn: async (data: PlanejamentoFormValues & { id: string }) => {
      if (!user?.propriedade_id) {
        throw new Error("Usuário não possui propriedade associada");
      }
      
      try {
        // Encontrar o setor_id se um lote foi selecionado
        let setor_id = undefined;
        if (data.lote_id) {
          const lote = lotesData?.lotes?.find(l => l.id === data.lote_id);
          setor_id = lote?.setor_id;
        }
        
        // Garantir que apenas um dos campos (lote_id ou canteiro_id) esteja preenchido
        const lote_id = selectedTab === 'lotes' ? data.lote_id : null;
        const canteiro_id = selectedTab === 'canteiros' ? data.canteiro_id : null;
        
        const planejamentoData = {
          cultura_id: data.cultura_id,
          lote_id: lote_id,
          canteiro_id: canteiro_id,
          data_inicio: format(data.data_inicio, 'yyyy-MM-dd'),
          data_fim_prevista: format(data.data_fim_prevista, 'yyyy-MM-dd'),
          status: data.status,
          propriedade_id: user.propriedade_id,
          setor_id: setor_id
        };
        
        console.log("Dados enviados para atualização:", {
          id: data.id,
          planejamento: planejamentoData
        });
        
        // Usar uma abordagem mais direta para a chamada GraphQL
        const response = await graphqlRequest("UPDATE_PLANEJAMENTO", { 
          id: data.id,
          planejamento: planejamentoData 
        });
        
        console.log("Resposta da atualização:", response);
        return response;
      } catch (error) {
        console.error("Erro ao atualizar planejamento:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-planejamentos"] });
      setIsEditDialogOpen(false);
      setSelectedPlanejamento(null);
      toast({
        title: "Planejamento atualizado",
        description: "O planejamento foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar planejamento",
        description: error.message || "Ocorreu um erro ao atualizar o planejamento.",
        variant: "destructive",
      });
    },
  });
  
  // Form para edição
  const editForm = useForm<PlanejamentoFormValues & { id: string }>({
    resolver: zodResolver(planejamentoEditSchema),
    defaultValues: {
      id: "",
      cultura_id: "",
      lote_id: "",
      canteiro_id: "",
      status: "Planejado",
      data_inicio: new Date(),
      data_fim_prevista: new Date(),
    },
  });
  
  const handleEditClick = (planejamento: Planejamento) => {
    setSelectedPlanejamento(planejamento);
    
    console.log("Planejamento selecionado para edição:", planejamento);
    
    // Preparar as datas para o formulário
    const dataInicio = typeof planejamento.data_inicio === 'string' 
      ? parseISO(planejamento.data_inicio) 
      : new Date(planejamento.data_inicio);
      
    const dataFimPrevista = typeof planejamento.data_fim_prevista === 'string' 
      ? parseISO(planejamento.data_fim_prevista) 
      : new Date(planejamento.data_fim_prevista);
    
    // Resetar o form com os valores do planejamento selecionado
    editForm.reset({
      id: planejamento.id,
      cultura_id: planejamento.cultura_id,
      lote_id: planejamento.lote_id || "",
      canteiro_id: planejamento.canteiro_id || "",
      status: planejamento.status || "Planejado",
      data_inicio: dataInicio,
      data_fim_prevista: dataFimPrevista,
    });
    
    // Definir a tab correta com base no tipo de planejamento
    if (planejamento.lote_id) {
      setSelectedTab('lotes');
    } else if (planejamento.canteiro_id) {
      setSelectedTab('canteiros');
    }
    
    setIsEditDialogOpen(true);
  };
  
  const onEditSubmit = (data: PlanejamentoFormValues & { id: string }) => {
    console.log("Dados do formulário de edição:", data);
    editPlanejamentoMutation.mutate(data);
  };

  // Mutation para excluir um planejamento
  const deletePlanejamentoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await graphqlRequest("DELETE_PLANEJAMENTO", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-planejamentos"] });
      queryClient.invalidateQueries({ queryKey: ["planejamentos-lote"] });
      queryClient.invalidateQueries({ queryKey: ["planejamentos-canteiro"] });
      setIsDeleteDialogOpen(false);
      setSelectedPlanejamento(null);
      toast({
        title: "Planejamento excluído",
        description: "O planejamento foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir planejamento",
        description: error.message || "Ocorreu um erro ao excluir o planejamento.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (planejamento: Planejamento) => {
    setSelectedPlanejamento(planejamento);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlanejamento) {
      deletePlanejamentoMutation.mutate(selectedPlanejamento.id);
    }
  };

  // Filtrar planejamentos com base no termo de busca
  const getPlanejamentos = () => {
    if (selectedTab === 'lotes' && selectedLoteId) {
      return lotePlanejamentosData?.planejamentos || [];
    } else if (selectedTab === 'canteiros' && selectedCanteiroId) {
      return canteiroPlanejamentosData?.planejamentos || [];
    } else {
      return allPlanejamentosData?.planejamentos || [];
    }
  };

  const filteredPlanejamentos = getPlanejamentos().filter((planejamento) => {
    if (!planejamento) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (planejamento.cultura?.nome?.toLowerCase() || '').includes(searchLower) ||
      (planejamento.lote?.nome?.toLowerCase() || '').includes(searchLower) ||
      (planejamento.canteiro?.nome?.toLowerCase() || '').includes(searchLower) ||
      (planejamento.status?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produção</h1>
          <p className="text-muted-foreground">
            Gerencie o planejamento de cultivo e produção da sua propriedade
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Planejamento
        </Button>
      </div>

      <Tabs defaultValue="lotes" value={selectedTab} onValueChange={(value) => setSelectedTab(value as 'lotes' | 'canteiros')}>
        <div className="flex items-center space-x-2 mb-4">
          <TabsList>
            <TabsTrigger value="lotes">Lotes</TabsTrigger>
            <TabsTrigger value="canteiros">Canteiros</TabsTrigger>
          </TabsList>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar planejamentos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            {selectedTab === 'lotes' ? (
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2"
                value={selectedLoteId || ""}
                onChange={(e) => setSelectedLoteId(e.target.value || null)}
              >
                <option value="">Todos os Lotes</option>
                {lotesData?.lotes?.map((lote) => (
                  <option key={lote.id} value={lote.id}>
                    {lote.nome}
                  </option>
                ))}
              </select>
            ) : (
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2"
                value={selectedCanteiroId || ""}
                onChange={(e) => setSelectedCanteiroId(e.target.value || null)}
              >
                <option value="">Todos os Canteiros</option>
                {canteirosData?.canteiros?.map((canteiro) => (
                  <option key={canteiro.id} value={canteiro.id}>
                    {canteiro.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <TabsContent value="lotes">
          {isLotePlanejamentosLoading || isAllPlanejamentosLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lote</TableHead>
                    <TableHead>Cultura</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Fim Prevista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlanejamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Nenhum planejamento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlanejamentos
                      .filter(p => p.lote_id)
                      .map((planejamento) => (
                        <TableRow key={planejamento.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>{planejamento.lote?.nome || "Não definido"}</TableCell>
                          <TableCell>{planejamento.cultura?.nome || "Não definido"}</TableCell>
                          <TableCell>{format(typeof planejamento.data_inicio === 'string' ? parseISO(planejamento.data_inicio) : planejamento.data_inicio, "dd/MM/yyyy", { locale: pt })}</TableCell>
                          <TableCell>{format(typeof planejamento.data_fim_prevista === 'string' ? parseISO(planejamento.data_fim_prevista) : planejamento.data_fim_prevista, "dd/MM/yyyy", { locale: pt })}</TableCell>
                          <TableCell>
                            <Badge variant={
                              planejamento.status === "Em andamento" ? "default" :
                              planejamento.status === "Planejado" ? "outline" :
                              planejamento.status === "Concluído" ? "secondary" :
                              "destructive"
                            }>
                              {planejamento.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(planejamento)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                  <path d="m15 5 4 4"></path>
                                </svg>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(planejamento)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4 text-red-500"
                                >
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="canteiros">
          {isCanteiroPlanejamentosLoading || isAllPlanejamentosLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canteiro</TableHead>
                    <TableHead>Cultura</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Fim Prevista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlanejamentos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Nenhum planejamento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlanejamentos
                      .filter(p => p.canteiro_id)
                      .map((planejamento) => (
                        <TableRow key={planejamento.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>{planejamento.canteiro?.nome || "Não definido"}</TableCell>
                          <TableCell>{planejamento.cultura?.nome || "Não definido"}</TableCell>
                          <TableCell>{format(typeof planejamento.data_inicio === 'string' ? parseISO(planejamento.data_inicio) : planejamento.data_inicio, "dd/MM/yyyy", { locale: pt })}</TableCell>
                          <TableCell>{format(typeof planejamento.data_fim_prevista === 'string' ? parseISO(planejamento.data_fim_prevista) : planejamento.data_fim_prevista, "dd/MM/yyyy", { locale: pt })}</TableCell>
                          <TableCell>
                            <Badge variant={
                              planejamento.status === "Em andamento" ? "default" :
                              planejamento.status === "Planejado" ? "outline" :
                              planejamento.status === "Concluído" ? "secondary" :
                              "destructive"
                            }>
                              {planejamento.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(planejamento)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                                  <path d="m15 5 4 4"></path>
                                </svg>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(planejamento)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4 text-red-500"
                                >
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog para adicionar planejamento */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Adicionar Planejamento</DialogTitle>
            <DialogDescription>
              Preencha as informações para adicionar um novo planejamento.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="cultura_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura*</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Selecione uma cultura</option>
                        {culturasData?.culturas?.map((cultura) => (
                          <option key={cultura.id} value={cultura.id}>
                            {cultura.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedTab === 'lotes' ? (
                <FormField
                  control={addForm.control}
                  name="lote_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lote*</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ""}
                        >
                          <option value="">Selecione um lote</option>
                          {lotesData?.lotes?.map((lote) => (
                            <option key={lote.id} value={lote.id}>
                              {lote.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={addForm.control}
                  name="canteiro_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canteiro*</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ""}
                        >
                          <option value="">Selecione um canteiro</option>
                          {canteirosData?.canteiros?.map((canteiro) => (
                            <option key={canteiro.id} value={canteiro.id}>
                              {canteiro.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: pt })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="data_fim_prevista"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Fim Prevista*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: pt })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="Planejado">Planejado</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addPlanejamentoMutation.isPending}>
                  {addPlanejamentoMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Planejamento
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição de planejamento */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Planejamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do planejamento.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={(e) => {
                e.preventDefault();
                console.log("Formulário de edição enviado");
                const formData = editForm.getValues();
                console.log("Dados do formulário:", formData);
                editPlanejamentoMutation.mutate(formData);
              }} 
              className="space-y-4">
              <input type="hidden" {...editForm.register("id")} />
              
              <FormField
                control={editForm.control}
                name="cultura_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura*</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Selecione uma cultura</option>
                        {culturasData?.culturas?.map((cultura) => (
                          <option key={cultura.id} value={cultura.id}>
                            {cultura.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedTab === 'lotes' ? (
                <FormField
                  control={editForm.control}
                  name="lote_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lote*</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ""}
                        >
                          <option value="">Selecione um lote</option>
                          {lotesData?.lotes?.map((lote) => (
                            <option key={lote.id} value={lote.id}>
                              {lote.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={editForm.control}
                  name="canteiro_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canteiro*</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ""}
                        >
                          <option value="">Selecione um canteiro</option>
                          {canteirosData?.canteiros?.map((canteiro) => (
                            <option key={canteiro.id} value={canteiro.id}>
                              {canteiro.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: pt })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="data_fim_prevista"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Fim Prevista*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: pt })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="Planejado">Planejado</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    console.log("Botão Salvar clicado");
                    const formData = editForm.getValues();
                    console.log("Dados do formulário:", formData);
                    editPlanejamentoMutation.mutate(formData);
                  }} 
                  disabled={editPlanejamentoMutation.isPending}
                >
                  {editPlanejamentoMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este planejamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletePlanejamentoMutation.isPending}>
              {deletePlanejamentoMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
