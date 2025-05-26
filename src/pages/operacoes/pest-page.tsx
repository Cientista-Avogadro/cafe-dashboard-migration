import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pest, Lot, Sector, Canteiro } from "@/lib/types";
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
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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

// Schema for pest occurrence
const pestSchema = z.object({
  lote_id: z.string().uuid("ID do lote inválido").optional(),
  canteiro_id: z.string().uuid("ID do canteiro inválido").optional(),
  setor_id: z.string().uuid("ID do setor inválido").optional(),
  data: z.string().min(1, "Data é obrigatória"),
  tipo_praga: z.string().min(1, "Tipo de praga é obrigatório"),
  metodo_controle: z.string().min(1, "Método de controle é obrigatório"),
  resultado: z.string().min(1, "Resultado é obrigatório"),
}).refine(data => {
  // Verifica se pelo menos um dos campos de área está preenchido
  return !!(data.lote_id || data.canteiro_id || data.setor_id);
}, {
  message: "Pelo menos um tipo de área (lote, canteiro ou setor) deve ser selecionado",
  path: ["lote_id"], // Mostra a mensagem no campo lote_id
});

type PestFormValues = z.infer<typeof pestSchema>;

export default function PestPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAreaType, setSelectedAreaType] = useState<"lote" | "canteiro" | "setor" | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("-1");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Query to fetch lots
  const { data: lotesData } = useQuery<{ lotes: Lot[] }>({  
    queryKey: ["lotes", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { lotes: [] };
      return await graphqlRequest("GET_LOTES_BY_PROPRIEDADE", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });
  
  // Query to fetch sectors
  const { data: setoresData } = useQuery<{ setores: Sector[] }>({  
    queryKey: ["setores", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { setores: [] };
      return await graphqlRequest("GET_SETORES", { propriedade_id: user.propriedade_id });
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

  // Query to fetch pest occurrences
  const { data: pestData, isLoading } = useQuery<{ pragas: Pest[] }>({  
    queryKey: ["pragas", user?.propriedade_id, selectedAreaId, selectedAreaType, statusFilter],
    queryFn: async () => {
      if (!user?.propriedade_id) return { pragas: [] };
      
      // Se não tiver tipo de área selecionado ou estiver visualizando todas
      if (!selectedAreaType || (selectedAreaId === "-1" && !selectedAreaType)) {
        return await graphqlRequest("GET_PRAGAS", { 
          propriedade_id: user.propriedade_id 
        });
      } 
      
      // Verificar se é para mostrar todos de um tipo ou um item específico
      if (selectedAreaId === "-1") {
        // Exibir todos os itens do tipo selecionado
        if (selectedAreaType === "lote") {
          console.log("Filtrando por todos os lotes");
          // Buscar todas as pragas da propriedade e filtrar no frontend
          const response = await graphqlRequest("GET_PRAGAS", { 
            propriedade_id: user.propriedade_id 
          });
          // Filtrar apenas os que têm lote_id
          response.pragas = response.pragas.filter((item: Pest) => !!item.lote_id);
          return response;
          
        } else if (selectedAreaType === "canteiro") {
          console.log("Filtrando por todos os canteiros");
          // Buscar todas as pragas da propriedade e filtrar no frontend
          const response = await graphqlRequest("GET_PRAGAS", { 
            propriedade_id: user.propriedade_id 
          });
          // Filtrar apenas os que têm canteiro_id
          response.pragas = response.pragas.filter((item: Pest) => !!item.canteiro_id);
          return response;
          
        } else if (selectedAreaType === "setor") {
          console.log("Filtrando por todos os setores");
          // Buscar todas as pragas da propriedade e filtrar no frontend
          const response = await graphqlRequest("GET_PRAGAS", { 
            propriedade_id: user.propriedade_id 
          });
          // Filtrar apenas os que têm setor_id
          response.pragas = response.pragas.filter((item: Pest) => !!item.setor_id);
          return response;
        }
      } else {
        // Filtrar por área específica
        if (selectedAreaType === "lote" && selectedAreaId) {
          console.log("Filtrando por lote_id:", selectedAreaId);
          return await graphqlRequest("GET_PRAGAS_BY_LOTE", { 
            propriedade_id: user.propriedade_id,
            lote_id: selectedAreaId
          });
        } else if (selectedAreaType === "canteiro" && selectedAreaId) {
          console.log("Filtrando por canteiro_id:", selectedAreaId);
          return await graphqlRequest("GET_PRAGAS_BY_CANTEIRO", { 
            propriedade_id: user.propriedade_id,
            canteiro_id: selectedAreaId
          });
        } else if (selectedAreaType === "setor" && selectedAreaId) {
          console.log("Filtrando por setor_id:", selectedAreaId);
          return await graphqlRequest("GET_PRAGAS_BY_SETOR", { 
            propriedade_id: user.propriedade_id,
            setor_id: selectedAreaId
          });
        }
      }
      
      // Caso contrário, retornamos todas as pragas
      return await graphqlRequest("GET_PRAGAS", { 
        propriedade_id: user.propriedade_id 
      });
    },
    enabled: !!user?.propriedade_id,
  });

  // Mutation to add pest occurrence
  const addPestMutation = useMutation({
    mutationFn: async (data: PestFormValues) => {
      // IMPORTANTE: Enviar apenas o campo de área relevante, sem incluir os outros campos
      // (nem mesmo como nulos) para respeitar a restrição do banco de dados
      let pestData: any = {
        data: data.data,
        tipo_praga: data.tipo_praga,
        metodo_controle: data.metodo_controle,
        resultado: data.resultado,
        propriedade_id: user?.propriedade_id,
        area_tipo: undefined // Será definido abaixo
      };
      
      // Criar um novo objeto com apenas o campo de área relevante
      if (data.lote_id) {
        pestData.area_tipo = "lote";
        pestData.lote_id = data.lote_id;
        // NÃO incluir canteiro_id ou setor_id, nem mesmo como undefined ou null
      } else if (data.canteiro_id) {
        pestData.area_tipo = "canteiro";
        pestData.canteiro_id = data.canteiro_id;
        // NÃO incluir lote_id ou setor_id, nem mesmo como undefined ou null
      } else if (data.setor_id) {
        pestData.area_tipo = "setor";
        pestData.setor_id = data.setor_id;
        // NÃO incluir lote_id ou canteiro_id, nem mesmo como undefined ou null
      }
      
      console.log("Dados adaptados para envio:", pestData);
      return await graphqlRequest("INSERT_PRAGA", { praga: pestData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pragas"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Ocorrência registrada",
        description: "A ocorrência de praga foi registrada com sucesso.",
      });
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao registrar ocorrência: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form for adding pest occurrence
  const addForm = useForm<PestFormValues>({
    resolver: zodResolver(pestSchema),
    defaultValues: {
      lote_id: undefined,
      canteiro_id: undefined,
      setor_id: undefined,
      data: new Date().toISOString().split('T')[0],
      tipo_praga: "",
      metodo_controle: "",
      resultado: "",
    },
  });

  // Common pest types
  const pestTypes = [
    "Lagarta",
    "Pulgão",
    "Ácaro",
    "Mosca-branca",
    "Cochonilha",
    "Percevejo",
    "Broca",
    "Formiga",
    "Outro"
  ];

  // Control methods
  const controlMethods = [
    "Biológico",
    "Químico",
    "Cultural",
    "Mecânico",
    "Integrado",
    "Outro"
  ];

  // Results
  const results = [
    "Efetivo",
    "Parcial",
    "Inefetivo",
    "Em andamento"
  ];

  // Filter based on search term and status
  const filteredPests = pestData?.pragas?.filter(pest => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      pest.tipo_praga.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pest.metodo_controle.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "resolvido" && pest.resultado.includes("Controle completo")) ||
      (statusFilter === "parcial" && pest.resultado.includes("Controle parcial")) ||
      (statusFilter === "pendente" && pest.resultado.includes("Sem controle"));
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const statistics = {
    totalOccurrences: filteredPests?.length || 0,
    effectiveControl: filteredPests?.filter(p => p.resultado === "Efetivo").length || 0,
    ongoingCases: filteredPests?.filter(p => p.resultado === "Em andamento").length || 0,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Pragas</h1>
          <p className="text-muted-foreground">Monitore e registre ocorrências de pragas</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Ocorrência
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ocorrências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalOccurrences}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Controles Efetivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.effectiveControl}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statistics.ongoingCases}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Ocorrências</CardTitle>
          <CardDescription>
            Histórico de todas as ocorrências de pragas e seus tratamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por tipo de praga ou método..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-sm font-medium">Filtrar por:</span>
              <Select
                value={selectedAreaType || "todas"}
                onValueChange={(value: "todas" | "lote" | "canteiro" | "setor") => {
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
                  <SelectItem value="todas">Todos</SelectItem>
                  <SelectItem value="lote">Lote</SelectItem>
                  <SelectItem value="canteiro">Canteiro</SelectItem>
                  <SelectItem value="setor">Setor</SelectItem>
                </SelectContent>
              </Select>
              
              {selectedAreaType === "lote" && (
                <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione um lote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos os lotes</SelectItem>
                    {lotesData?.lotes?.filter(lote => !!lote.id).map((lote: Lot) => (
                      <SelectItem key={lote.id} value={lote.id}>
                        {lote.nome || `Lote ${lote.id.substring(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {selectedAreaType === "canteiro" && (
                <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione um canteiro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos os canteiros</SelectItem>
                    {canteirosData?.canteiros?.filter(canteiro => !!canteiro.id).map((canteiro: Canteiro) => (
                      <SelectItem key={canteiro.id} value={canteiro.id}>
                        {canteiro.nome || `Canteiro ${canteiro.id.substring(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {selectedAreaType === "setor" && (
                <Select value={selectedAreaId} onValueChange={setSelectedAreaId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">Todos os setores</SelectItem>
                    {setoresData?.setores?.filter(setor => !!setor.id).map((setor: Sector) => (
                      <SelectItem key={setor.id} value={setor.id}>
                        {setor.nome || `Setor ${setor.id.substring(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os resultados</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : filteredPests?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Nenhum registro encontrado com os filtros aplicados"
                : "Nenhum registro de praga para os filtros selecionados"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo de Praga</TableHead>
                    <TableHead>Método de Controle</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPests?.map((pest) => (
                    <TableRow key={pest.id}>
                      <TableCell>
                        {format(new Date(pest.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{pest.tipo_praga}</TableCell>
                      <TableCell>{pest.metodo_controle}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pest.resultado === "Efetivo"
                              ? "default"
                              : pest.resultado === "Em andamento"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {pest.resultado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Pest Occurrence Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Ocorrência de Praga</DialogTitle>
            <DialogDescription>
              Registre uma nova ocorrência de praga e seu método de controle
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => addPestMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addForm.control}
                name="lote_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Limpar outros campos de área quando este for selecionado
                        if (value) {
                          addForm.setValue("canteiro_id", undefined);
                          addForm.setValue("setor_id", undefined);
                        }
                      }} 
                      value={field.value}
                    >
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
              
              <FormField
                control={addForm.control}
                name="canteiro_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canteiro</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Limpar outros campos de área quando este for selecionado
                        if (value) {
                          addForm.setValue("lote_id", undefined);
                          addForm.setValue("setor_id", undefined);
                        }
                      }} 
                      value={field.value}
                    >
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
              
              <FormField
                control={addForm.control}
                name="setor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Limpar outros campos de área quando este for selecionado
                        if (value) {
                          addForm.setValue("lote_id", undefined);
                          addForm.setValue("canteiro_id", undefined);
                        }
                      }} 
                      value={field.value}
                    >
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
                name="tipo_praga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Praga*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de praga" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pestTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="metodo_controle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Controle*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método de controle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {controlMethods.map((method) => (
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
              
              <FormField
                control={addForm.control}
                name="resultado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o resultado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {results.map((result) => (
                          <SelectItem key={result} value={result}>
                            {result}
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
                  disabled={addPestMutation.isPending}
                >
                  {addPestMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Registrar Ocorrência
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}