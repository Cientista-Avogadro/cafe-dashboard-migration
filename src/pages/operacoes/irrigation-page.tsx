import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sector, Lot, Canteiro } from "@/lib/types";
import { graphqlRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search,
  Plus,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Schema for irrigation record
const irrigationSchema = z.discriminatedUnion('tipo_area', [
  // Schema para lote
  z.object({
    tipo_area: z.literal("lote"),
    lote_id: z.string().uuid("ID do lote inválido"),
    canteiro_id: z.string().optional(),
    setor_id: z.string().optional(),
    data: z.string().min(1, "Data é obrigatória"),
    volume_agua: z.coerce.number().min(0.1, "Volume deve ser maior que zero"),
    metodo: z.string().min(1, "Método é obrigatório"),
  }),
  // Schema para canteiro
  z.object({
    tipo_area: z.literal("canteiro"),
    lote_id: z.string().optional(),
    canteiro_id: z.string().uuid("ID do canteiro inválido"),
    setor_id: z.string().optional(),
    data: z.string().min(1, "Data é obrigatória"),
    volume_agua: z.coerce.number().min(0.1, "Volume deve ser maior que zero"),
    metodo: z.string().min(1, "Método é obrigatório"),
  }),
  // Schema para setor
  z.object({
    tipo_area: z.literal("setor"),
    lote_id: z.string().optional(),
    canteiro_id: z.string().optional(),
    setor_id: z.string().uuid("ID do setor inválido"),
    data: z.string().min(1, "Data é obrigatória"),
    volume_agua: z.coerce.number().min(0.1, "Volume deve ser maior que zero"),
    metodo: z.string().min(1, "Método é obrigatório"),
  }),
]);

// Interfaces
interface IrrigationRecord {
  id: string;
  lote_id?: string;
  canteiro_id?: string;
  setor_id?: string;
  data: string;
  volume_agua: number;
  metodo: string;
  propriedade_id?: string;
}

// Removido IrrigationSubmitData pois não é mais utilizado

type IrrigationFormValues = z.infer<typeof irrigationSchema>;

export default function IrrigationPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAreaType, setSelectedAreaType] = useState<"lote" | "canteiro" | "setor" | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Query to fetch sectors
  const { data: setoresData } = useQuery<{ setores: Sector[] }>({
    queryKey: ["setores", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { setores: [] };
      return await graphqlRequest("GET_SETORES", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Query to fetch lots
  const { data: lotesData } = useQuery<{ lotes: Lot[] }>({
    queryKey: ["lotes", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { lotes: [] };
      return await graphqlRequest("GET_LOTES_BY_PROPRIEDADE", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });
  
  // Query to fetch beds (canteiros)
  const { data: canteirosData } = useQuery<{ canteiros: Canteiro[] }>({
    queryKey: ["canteiros", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { canteiros: [] };
      return await graphqlRequest("GET_CANTEIROS", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Query to fetch irrigation data
  const { data: irrigationData, isLoading } = useQuery<{ irrigacoes: IrrigationRecord[] }>({
    queryKey: ["irrigacoes", user?.propriedade_id, selectedAreaId, selectedAreaType],
    queryFn: async () => {
      if (!user?.propriedade_id) return { irrigacoes: [] };
      
      // Se não tiver tipo de área selecionado ou estiver visualizando todas as irrigações
      if (!selectedAreaType || (selectedAreaId === "-1" && !selectedAreaType)) {
        return await graphqlRequest("GET_IRRIGACOES", { 
          propriedade_id: user.propriedade_id 
        });
      } 
      
      // Verificar se é para mostrar todos de um tipo ou um item específico
      if (selectedAreaId === "-1") {
        // Exibir todos os itens do tipo selecionado
        if (selectedAreaType === "lote") {
          console.log("Filtrando por todos os lotes");
          // Buscar todas as irrigações da propriedade e filtrar no frontend
          const response = await graphqlRequest("GET_IRRIGACOES", { 
            propriedade_id: user.propriedade_id 
          });
          // Filtrar apenas os que têm lote_id
          response.irrigacoes = response.irrigacoes.filter((item: IrrigationRecord) => !!item.lote_id);
          return response;
          
        } else if (selectedAreaType === "canteiro") {
          console.log("Filtrando por todos os canteiros");
          // Buscar todas as irrigações da propriedade e filtrar no frontend
          const response = await graphqlRequest("GET_IRRIGACOES", { 
            propriedade_id: user.propriedade_id 
          });
          // Filtrar apenas os que têm canteiro_id
          response.irrigacoes = response.irrigacoes.filter((item: IrrigationRecord) => !!item.canteiro_id);
          return response;
          
        } else if (selectedAreaType === "setor") {
          console.log("Filtrando por todos os setores");
          // Buscar todas as irrigações da propriedade e filtrar no frontend
          const response = await graphqlRequest("GET_IRRIGACOES", { 
            propriedade_id: user.propriedade_id 
          });
          // Filtrar apenas os que têm setor_id
          response.irrigacoes = response.irrigacoes.filter((item: IrrigationRecord) => !!item.setor_id);
          return response;
        }
      } else {
        // Filtrar por item específico
        if (selectedAreaType === "lote" && selectedAreaId) {
          console.log("Filtrando por lote_id:", selectedAreaId);
          return await graphqlRequest("GET_IRRIGACOES_BY_LOTE", { 
            propriedade_id: user.propriedade_id,
            lote_id: selectedAreaId
          });
        } else if (selectedAreaType === "canteiro" && selectedAreaId) {
          console.log("Filtrando por canteiro_id:", selectedAreaId);
          return await graphqlRequest("GET_IRRIGACOES_BY_CANTEIRO", { 
            propriedade_id: user.propriedade_id,
            canteiro_id: selectedAreaId
          });
        } else if (selectedAreaType === "setor" && selectedAreaId) {
          console.log("Filtrando por setor_id:", selectedAreaId);
          return await graphqlRequest("GET_IRRIGACOES_BY_SETOR", { 
            propriedade_id: user.propriedade_id,
            setor_id: selectedAreaId
          });
        }
      }
      
      // Caso contrário, retornamos todas as irrigações
      return await graphqlRequest("GET_IRRIGACOES", { 
        propriedade_id: user.propriedade_id 
      });
    },
    enabled: !!user?.propriedade_id,
  });

  console.log("irrigationData", irrigationData);

  // Mutation to add irrigation record
  const addIrrigationMutation = useMutation({
    mutationFn: async (data: IrrigationFormValues) => {
      // Preparar os dados para envio
      const { tipo_area } = data;
      
      // Criar objeto com os campos comuns
      const baseData = {
        data: data.data,
        volume_agua: data.volume_agua,
        metodo: data.metodo,
        propriedade_id: user?.propriedade_id || undefined
      };
      
      // Criar objeto para envio incluindo APENAS o campo relevante
      let dataToSubmit: any;
      
      if (tipo_area === "lote") {
        dataToSubmit = {
          ...baseData,
          lote_id: data.lote_id,
          // Não incluir canteiro_id ou setor_id
        };
      } else if (tipo_area === "canteiro") {
        dataToSubmit = {
          ...baseData,
          canteiro_id: data.canteiro_id,
          // Não incluir lote_id ou setor_id
        };
      } else { // setor
        dataToSubmit = {
          ...baseData,
          setor_id: data.setor_id,
          // Não incluir lote_id ou canteiro_id
        };
      }
      
      console.log("Dados adaptados para envio:", dataToSubmit);
      
      return await graphqlRequest("INSERT_IRRIGACAO", { irrigacao: dataToSubmit });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["irrigacoes"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Irrigação registrada",
        description: "O registro de irrigação foi adicionado com sucesso.",
      });
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao registrar irrigação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form for adding irrigation record
  const addForm = useForm<IrrigationFormValues>({
    resolver: zodResolver(irrigationSchema),
    defaultValues: {
      tipo_area: "lote",
      lote_id: undefined,
      canteiro_id: undefined,
      setor_id: undefined,
      data: new Date().toISOString().split('T')[0],
      volume_agua: 0,
      metodo: "",
    },
  });

  // Available irrigation methods
  const irrigationMethods = [
    "Aspersão",
    "Gotejamento",
    "Microaspersão",
    "Superficial",
    "Subsuperficial",
    "Outro"
  ];

  // Filter irrigation records
  const filteredIrrigations = irrigationData?.irrigacoes?.filter((irrigation) => {
    const matchesSearch = irrigation.metodo.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (dateFilter === "all") return matchesSearch;
    
    const irrigationDate = new Date(irrigation.data);
    const today = new Date();
    const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
    
    if (dateFilter === "last7days") {
      return matchesSearch && irrigationDate >= sevenDaysAgo;
    }
    if (dateFilter === "last30days") {
      return matchesSearch && irrigationDate >= thirtyDaysAgo;
    }
    
    return matchesSearch;
  });

  // Calculate statistics
  const statistics = {
    totalVolume: filteredIrrigations?.reduce((acc, curr) => acc + curr.volume_agua, 0) || 0,
    averageVolume: filteredIrrigations?.length 
      ? (filteredIrrigations.reduce((acc, curr) => acc + curr.volume_agua, 0) / filteredIrrigations.length)
      : 0,
    lastIrrigation: filteredIrrigations?.length 
      ? new Date(Math.max(...filteredIrrigations.map(i => new Date(i.data).getTime())))
      : null,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Irrigação</h1>
          <p className="text-muted-foreground">Monitore e registre as irrigações da sua propriedade</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Irrigação
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalVolume.toLocaleString()} L
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.averageVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })} L
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última Irrigação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.lastIrrigation 
                ? format(statistics.lastIrrigation, "dd/MM/yyyy")
                : "Nenhuma"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Irrigação</CardTitle>
          <CardDescription>
            Histórico de todas as irrigações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por método..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm font-medium">Filtrar por Área:</span>
              <Select
                value={selectedAreaType || "todas"}
                onValueChange={(value:"todas" | "lote" | "canteiro" | "setor") => {
                  console.log("Valor selecionado:", value);
                  if (value === "todas") {
                    setSelectedAreaType(null);
                    setSelectedAreaId("-1");
                  } else {
                    setSelectedAreaType(value);
                    // Definir -1 para mostrar todos do tipo selecionado
                    setSelectedAreaId("-1");
                  }
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="setor">Setor</SelectItem>
                  <SelectItem value="lote">Lote</SelectItem>
                  <SelectItem value="canteiro">Canteiro</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedAreaType === "setor" && (
                <Select value={selectedAreaId || ""} onValueChange={(value) => setSelectedAreaId(value || null)}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos os setores</SelectItem>
                    {setoresData?.setores?.map((setor: Sector) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        {setor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {selectedAreaType === "lote" && (
                <Select value={selectedAreaId || ""} onValueChange={(value) => setSelectedAreaId(value || null)}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione um lote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos os lotes</SelectItem>
                    {lotesData?.lotes?.map((lote: Lot) => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {lote.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {selectedAreaType === "canteiro" && (
                <Select value={selectedAreaId || ""} onValueChange={(value) => setSelectedAreaId(value || null)}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione um canteiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos os canteiros</SelectItem>
                    {canteirosData?.canteiros?.map((canteiro: Canteiro) => (
                      <SelectItem key={canteiro.id} value={canteiro.id}>
                        {canteiro.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                <SelectItem value="last30days">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : !selectedAreaId ? (
            <div className="text-center py-10 text-muted-foreground">
              Selecione uma área para ver os registros de irrigação
            </div>
          ) : filteredIrrigations?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || dateFilter !== "all"
                ? "Nenhum registro encontrado com os filtros aplicados"
                : "Nenhum registro de irrigação para esta área"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Área</TableCell>
                    <TableCell>Data</TableCell>
                    <TableCell>Volume (L)</TableCell>
                    <TableCell>Método</TableCell>
                    <TableCell>Tipo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {irrigationData?.irrigacoes?.map((irrigacao: IrrigationRecord) => {
                    // Encontrar o nome da área
                    let areaName = "";
                    if (irrigacao.lote_id) {
                      const lote = lotesData?.lotes?.find(l => l.id === irrigacao.lote_id);
                      areaName = lote?.nome || "Lote não encontrado";
                    } else if (irrigacao.canteiro_id) {
                      const canteiro = canteirosData?.canteiros?.find(c => c.id === irrigacao.canteiro_id);
                      areaName = canteiro?.nome || "Canteiro não encontrado";
                    } else if (irrigacao.setor_id) {
                      const setor = setoresData?.setores?.find(s => s.id === irrigacao.setor_id);
                      areaName = setor?.nome || "Setor não encontrado";
                    }

                    return (
                      <TableRow key={irrigacao.id}>
                        <TableCell>{areaName}</TableCell>
                        <TableCell>
                          {new Date(irrigacao.data).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>{irrigacao.volume_agua.toLocaleString('pt-BR')} L</TableCell>
                        <TableCell>{irrigacao.metodo}</TableCell>
                        <TableCell>{irrigacao.lote_id ? 'Lote' : irrigacao.canteiro_id ? 'Canteiro' : 'Setor'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Irrigation Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Irrigação</DialogTitle>
            <DialogDescription>
              Registre uma nova irrigação realizada em uma área
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => {
              console.log("Dados do formulário:", data);
              addIrrigationMutation.mutate(data);
            })} className="space-y-4">

              
              <FormField
                control={addForm.control}
                name="tipo_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Área*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="setor">Setor</SelectItem>
                        <SelectItem value="lote">Lote</SelectItem>
                        <SelectItem value="canteiro">Canteiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {addForm.watch("tipo_area") === "setor" && (
                <FormField
                  control={addForm.control}
                  name="setor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "-1"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um setor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {setoresData?.setores?.filter(setor => !!setor.id).map((setor: Sector) => (
                            <SelectItem key={setor.id} value={setor.id}>
                              {setor.nome || `Setor ${setor.id.substring(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {addForm.watch("tipo_area") === "lote" && (
                <FormField
                  control={addForm.control}
                  name="lote_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lote*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "-1"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um lote" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lotesData?.lotes?.filter(lote => !!lote.id).map((lote: Lot) => (
                            <SelectItem key={lote.id} value={lote.id}>
                              {lote.nome || `Lote ${lote.id.substring(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {addForm.watch("tipo_area") === "canteiro" && (
                <FormField
                  control={addForm.control}
                  name="canteiro_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canteiro*</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "-1"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um canteiro" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {canteirosData?.canteiros?.filter(canteiro => !!canteiro.id).map((canteiro: Canteiro) => (
                            <SelectItem key={canteiro.id} value={canteiro.id}>
                              {canteiro.nome || `Canteiro ${canteiro.id.substring(0, 8)}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={addForm.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="volume_agua"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume de Água (L)*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="Ex: 1000" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="metodo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Irrigação*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {irrigationMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={addIrrigationMutation.isPending}
                  onClick={() => {
                    console.log("Estado do formulário:", addForm.formState);
                    if (Object.keys(addForm.formState.errors).length > 0) {
                      console.log("Erros de validação:", addForm.formState.errors);
                    }
                  }}
                >
                  {addIrrigationMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Registrar Irrigação
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}