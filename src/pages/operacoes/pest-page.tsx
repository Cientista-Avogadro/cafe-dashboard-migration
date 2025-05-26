import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pest } from "@/lib/types";
import { graphqlRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  Bug,
  Calendar,
  ArrowUpDown,
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
  FormDescription,
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
  lote_id: z.string().uuid("ID do lote inválido"),
  data: z.string().min(1, "Data é obrigatória"),
  tipo_praga: z.string().min(1, "Tipo de praga é obrigatório"),
  metodo_controle: z.string().min(1, "Método de controle é obrigatório"),
  resultado: z.string().min(1, "Resultado é obrigatório"),
});

type PestFormValues = z.infer<typeof pestSchema>;

export default function PestPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Query to fetch lots
  const { data: lotesData } = useQuery({
    queryKey: ["lotes", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { lotes: [] };
      return await graphqlRequest("GET_LOTES_BY_PROPRIEDADE", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Query to fetch pest occurrences
  const { data: pestData, isLoading } = useQuery<{ pragas: Pest[] }>({
    queryKey: ["pragas", selectedLoteId],
    queryFn: async () => {
      if (!selectedLoteId) return { pragas: [] };
      return await graphqlRequest("GET_PRAGAS", { lote_id: selectedLoteId });
    },
    enabled: !!selectedLoteId,
  });

  // Mutation to add pest occurrence
  const addPestMutation = useMutation({
    mutationFn: async (data: PestFormValues) => {
      return await graphqlRequest("INSERT_PRAGA", { praga: data });
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
      lote_id: "",
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

  // Filter pest occurrences
  const filteredPests = pestData?.pragas?.filter((pest) => {
    const matchesSearch = 
      pest.tipo_praga.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pest.metodo_controle.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && pest.resultado.toLowerCase() === statusFilter.toLowerCase();
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
            
            <Select value={selectedLoteId || ""} onValueChange={setSelectedLoteId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione um lote" />
              </SelectTrigger>
              <SelectContent>
                {lotesData?.lotes?.map((lote) => (
                  <SelectItem key={lote.id} value={lote.id}>
                    {lote.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os resultados</SelectItem>
                {results.map((result) => (
                  <SelectItem key={result} value={result.toLowerCase()}>
                    {result}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : !selectedLoteId ? (
            <div className="text-center py-10 text-muted-foreground">
              Selecione um lote para ver as ocorrências de pragas
            </div>
          ) : filteredPests?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Nenhuma ocorrência encontrada com os filtros aplicados"
                : "Nenhuma ocorrência registrada para este lote"}
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
                    <FormLabel>Lote*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um lote" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lotesData?.lotes?.map((lote) => (
                          <SelectItem key={lote.id} value={lote.id}>
                            {lote.nome}
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