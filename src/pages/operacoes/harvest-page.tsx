import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sector, Lot, Canteiro } from "@/lib/types";
import { executeOperation } from "@/lib/hasura";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import {
  GET_COLHEITAS_BY_LOTE,
  GET_COLHEITAS_BY_CANTEIRO,
  GET_COLHEITAS_BY_SETOR,
  ADD_COLHEITA,
} from "@/lib/hasura";
import { GET_CULTURAS } from "@/graphql/operations";

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
  TableHeader,
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

// Schema for harvest record
const harvestSchema = z.discriminatedUnion('tipo_area', [
  // Schema para lote
  z.object({
    tipo_area: z.literal("lote"),
    lote_id: z.string().uuid("ID do lote inválido"),
    canteiro_id: z.string().optional(),
    setor_id: z.string().optional(),
    data: z.string().min(1, "Data é obrigatória"),
    quantidade_colhida: z.coerce.number().min(0.1, "Quantidade deve ser maior que zero"),
    unidade: z.string().min(1, "Unidade é obrigatória"),
    destino: z.string().min(1, "Destino é obrigatório"),
    observacoes: z.string().optional(),
    cultura_id: z.string().uuid("Cultura é obrigatória"),
  }),
  // Schema para canteiro
  z.object({
    tipo_area: z.literal("canteiro"),
    lote_id: z.string().optional(),
    canteiro_id: z.string().uuid("ID do canteiro inválido"),
    setor_id: z.string().optional(),
    data: z.string().min(1, "Data é obrigatória"),
    quantidade_colhida: z.coerce.number().min(0.1, "Quantidade deve ser maior que zero"),
    unidade: z.string().min(1, "Unidade é obrigatória"),
    destino: z.string().min(1, "Destino é obrigatório"),
    observacoes: z.string().optional(),
    cultura_id: z.string().uuid("Cultura é obrigatória"),
  }),
  // Schema para setor
  z.object({
    tipo_area: z.literal("setor"),
    lote_id: z.string().optional(),
    canteiro_id: z.string().optional(),
    setor_id: z.string().uuid("ID do setor inválido"),
    data: z.string().min(1, "Data é obrigatória"),
    quantidade_colhida: z.coerce.number().min(0.1, "Quantidade deve ser maior que zero"),
    unidade: z.string().min(1, "Unidade é obrigatória"),
    destino: z.string().min(1, "Destino é obrigatório"),
    observacoes: z.string().optional(),
    cultura_id: z.string().uuid("Cultura é obrigatória"),
  }),
]);

// Interfaces
interface HarvestRecord {
  id: string;
  lote_id?: string;
  canteiro_id?: string;
  setor_id?: string;
  data: string;
  quantidade_colhida: number;
  unidade: string;
  destino: string;
  observacoes?: string;
  cultura_id: string;
  propriedade_id?: string;
}

interface Cultura {
  id: string;
  nome: string;
}

type HarvestFormValues = z.infer<typeof harvestSchema>;

export default function HarvestPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAreaType, setSelectedAreaType] = useState<"lote" | "canteiro" | "setor" | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Query to fetch cultures
  const { data: culturasData } = useQuery<{ culturas: Cultura[] }>({
    queryKey: ["culturas", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { culturas: [] };
      return await executeOperation(GET_CULTURAS, { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  const addForm = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      tipo_area: "lote",
      data: new Date().toISOString().split("T")[0],
      quantidade_colhida: 0,
      unidade: "kg",
      destino: "",
      observacoes: "",
      cultura_id: "",
    },
  });

  const addHarvestMutation = useMutation({
    mutationFn: async (data: HarvestFormValues) => {
      if (!user?.propriedade_id) return;
      const variables = {
        colheita: {
          ...data,
          propriedade_id: user.propriedade_id,
        },
      };
      return executeOperation(ADD_COLHEITA, variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colheitas", user?.propriedade_id, selectedAreaId, selectedAreaType] });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
  });

  // Query to fetch sectors
  const { data: setoresData } = useQuery<{ setores: Sector[] }>({
    queryKey: ["setores", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { setores: [] };
      return await executeOperation("GET_SETORES", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Query to fetch lots
  const { data: lotesData } = useQuery<{ lotes: Lot[] }>({
    queryKey: ["lotes", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { lotes: [] };
      return await executeOperation("GET_LOTES_BY_PROPRIEDADE", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });
  
  // Query to fetch beds (canteiros)
  const { data: canteirosData } = useQuery<{ canteiros: Canteiro[] }>({
    queryKey: ["canteiros", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { canteiros: [] };
      return await executeOperation("GET_CANTEIROS", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Query to fetch harvest data
  const { data: harvestData, isLoading } = useQuery<{ colheitas: HarvestRecord[] }>({
    queryKey: ["colheitas", user?.propriedade_id, selectedAreaId, selectedAreaType],
    queryFn: async () => {
      if (!user?.propriedade_id) return { colheitas: [] };
      
      // Se não tiver tipo de área selecionado ou estiver visualizando todas as colheitas
      if (!selectedAreaType || (selectedAreaId === "-1" && !selectedAreaType)) {
        return await executeOperation(GET_COLHEITAS_BY_LOTE, { 
          propriedade_id: user.propriedade_id,
          lote_id: "-1"
        });
      } 
      
      // Verificar se é para mostrar todos de um tipo ou um item específico
      if (selectedAreaId === "-1") {
        // Exibir todos os itens do tipo selecionado
        if (selectedAreaType === "lote") {
          console.log("Filtrando por todos os lotes");
          // Buscar todas as colheitas da propriedade e filtrar no frontend
          const response = await executeOperation(GET_COLHEITAS_BY_LOTE, { 
            propriedade_id: user.propriedade_id,
            lote_id: "-1"
          });
          // Filtrar apenas os que têm lote_id
          response.colheitas = response.colheitas.filter((item: HarvestRecord) => !!item.lote_id);
          return response;
          
        } else if (selectedAreaType === "canteiro") {
          console.log("Filtrando por todos os canteiros");
          // Buscar todas as colheitas da propriedade e filtrar no frontend
          const response = await executeOperation(GET_COLHEITAS_BY_CANTEIRO, { 
            propriedade_id: user.propriedade_id,
            canteiro_id: "-1"
          });
          // Filtrar apenas os que têm canteiro_id
          response.colheitas = response.colheitas.filter((item: HarvestRecord) => !!item.canteiro_id);
          return response;
          
        } else if (selectedAreaType === "setor") {
          console.log("Filtrando por todos os setores");
          // Buscar todas as colheitas da propriedade e filtrar no frontend
          const response = await executeOperation(GET_COLHEITAS_BY_SETOR, { 
            propriedade_id: user.propriedade_id,
            setor_id: "-1"
          });
          // Filtrar apenas os que têm setor_id
          response.colheitas = response.colheitas.filter((item: HarvestRecord) => !!item.setor_id);
          return response;
        }
      }
      
      // Filtrar por item específico
      if (selectedAreaType === "lote" && selectedAreaId) {
        console.log("Filtrando por lote_id:", selectedAreaId);
        return await executeOperation(GET_COLHEITAS_BY_LOTE, { 
          propriedade_id: user.propriedade_id,
          lote_id: selectedAreaId
        });
      } else if (selectedAreaType === "canteiro" && selectedAreaId) {
        console.log("Filtrando por canteiro_id:", selectedAreaId);
        return await executeOperation(GET_COLHEITAS_BY_CANTEIRO, { 
          propriedade_id: user.propriedade_id,
          canteiro_id: selectedAreaId
        });
      } else if (selectedAreaType === "setor" && selectedAreaId) {
        console.log("Filtrando por setor_id:", selectedAreaId);
        return await executeOperation(GET_COLHEITAS_BY_SETOR, { 
          propriedade_id: user.propriedade_id,
          setor_id: selectedAreaId
        });
      }
      
      // Caso contrário, retornamos todas as colheitas
      return await executeOperation(GET_COLHEITAS_BY_LOTE, { 
        propriedade_id: user.propriedade_id,
        lote_id: "-1"
      });
    },
    enabled: !!user?.propriedade_id,
  });

  // Filter harvest records
  const filteredHarvests = (harvestData?.colheitas || []).filter((harvest) => {
    if (!harvest) return false;
    // Busca
    const matchesSearch = !searchTerm || 
      harvest.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
      harvest.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Calculate statistics
  const statistics = {
    totalQuantity: filteredHarvests?.reduce((acc, curr) => acc + curr.quantidade_colhida, 0) || 0,
    averageQuantity: filteredHarvests?.length 
      ? (filteredHarvests.reduce((acc, curr) => acc + curr.quantidade_colhida, 0) / filteredHarvests.length)
      : 0,
    lastHarvest: filteredHarvests?.length 
      ? new Date(Math.max(...filteredHarvests.map(i => new Date(i.data).getTime())))
      : null,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Colheitas</h1>
          <p className="text-muted-foreground">Monitore e registre as colheitas da sua propriedade</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Colheita
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quantidade Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalQuantity.toLocaleString()} {filteredHarvests?.[0]?.unidade || "un"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quantidade Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.averageQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} {filteredHarvests?.[0]?.unidade || "un"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Última Colheita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.lastHarvest 
                ? format(statistics.lastHarvest, "dd/MM/yyyy")
                : "Nenhuma"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Colheita</CardTitle>
          <CardDescription>
            Histórico de todas as colheitas realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por destino ou observações..."
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
                    {setoresData?.setores?.filter(setor => !!setor.id).map((setor: Sector) => (
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
                    {lotesData?.lotes?.filter(lote => !!lote.id).map((lote: Lot) => (
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
                    {canteirosData?.canteiros?.filter(canteiro => !!canteiro.id).map((canteiro: Canteiro) => (
                      <SelectItem key={canteiro.id} value={canteiro.id}>
                        {canteiro.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : filteredHarvests?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedAreaType
                ? "Nenhum registro encontrado com os filtros aplicados"
                : "Nenhum registro de colheita encontrado"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Área</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead className="w-[120px]">Quantidade</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="w-[120px]">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHarvests?.map((colheita: HarvestRecord) => {
                    // Encontrar o nome da área
                    let areaName = "";
                    let areaType = "";
                    if (colheita.lote_id) {
                      const lote = lotesData?.lotes?.find(l => l.id === colheita.lote_id);
                      areaName = lote?.nome || "Lote não encontrado";
                      areaType = "Lote";
                    } else if (colheita.canteiro_id) {
                      const canteiro = canteirosData?.canteiros?.find(c => c.id === colheita.canteiro_id);
                      areaName = canteiro?.nome || "Canteiro não encontrado";
                      areaType = "Canteiro";
                    } else if (colheita.setor_id) {
                      const setor = setoresData?.setores?.find(s => s.id === colheita.setor_id);
                      areaName = setor?.nome || "Setor não encontrado";
                      areaType = "Setor";
                    }

                    return (
                      <TableRow key={colheita.id}>
                        <TableCell className="font-medium">{areaName}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            {areaType}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {colheita.quantidade_colhida.toLocaleString('pt-BR')} {colheita.unidade}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                            {colheita.destino}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {colheita.observacoes || "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(colheita.data), "dd/MM/yyyy")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Harvest Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Colheita</DialogTitle>
            <DialogDescription>
              Registre uma nova colheita realizada em uma área
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => {
              console.log("Dados do formulário:", data);
              addHarvestMutation.mutate(data);
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
                name="quantidade_colhida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade*</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min="0.1"
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
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">Quilograma (kg)</SelectItem>
                        <SelectItem value="g">Grama (g)</SelectItem>
                        <SelectItem value="ton">Tonelada (ton)</SelectItem>
                        <SelectItem value="unidade">Unidade (un)</SelectItem>
                        <SelectItem value="caixa">Caixa (cx)</SelectItem>
                        <SelectItem value="saca">Saca (sc)</SelectItem>
                        <SelectItem value="lata">Lata (lt)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="destino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Venda direta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Colheita realizada pela manhã" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="cultura_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a cultura" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {culturasData?.culturas?.map((cultura: Cultura) => (
                          <SelectItem key={cultura.id} value={cultura.id}>
                            {cultura.nome}
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
                  disabled={addHarvestMutation.isPending}
                  onClick={() => {
                    console.log("Estado do formulário:", addForm.formState);
                    if (Object.keys(addForm.formState.errors).length > 0) {
                      console.log("Erros de validação:", addForm.formState.errors);
                    }
                  }}
                >
                  {addHarvestMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Registrar Colheita
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 