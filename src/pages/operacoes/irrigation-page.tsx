import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Irrigation } from "@/lib/types";
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
import { 
  Search,
  Plus,
  Loader2,
  Droplet,
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

// Schema for irrigation record
const irrigationSchema = z.object({
  lote_id: z.string().uuid("ID do lote inválido"),
  data: z.string().min(1, "Data é obrigatória"),
  volume_agua: z.coerce.number().min(0.1, "Volume deve ser maior que zero"),
  metodo: z.string().min(1, "Método é obrigatório"),
});

type IrrigationFormValues = z.infer<typeof irrigationSchema>;

export default function IrrigationPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Query to fetch lots
  const { data: lotesData } = useQuery({
    queryKey: ["lotes", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { lotes: [] };
      return await graphqlRequest("GET_LOTES_BY_PROPRIEDADE", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Query to fetch irrigation records
  const { data: irrigationData, isLoading } = useQuery<{ irrigacoes: Irrigation[] }>({
    queryKey: ["irrigacoes", selectedLoteId],
    queryFn: async () => {
      if (!selectedLoteId) return { irrigacoes: [] };
      return await graphqlRequest("GET_IRRIGACOES", { lote_id: selectedLoteId });
    },
    enabled: !!selectedLoteId,
  });

  // Mutation to add irrigation record
  const addIrrigationMutation = useMutation({
    mutationFn: async (data: IrrigationFormValues) => {
      return await graphqlRequest("INSERT_IRRIGACAO", { irrigacao: data });
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
      lote_id: "",
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
          ) : !selectedLoteId ? (
            <div className="text-center py-10 text-muted-foreground">
              Selecione um lote para ver os registros de irrigação
            </div>
          ) : filteredIrrigations?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || dateFilter !== "all"
                ? "Nenhum registro encontrado com os filtros aplicados"
                : "Nenhum registro de irrigação para este lote"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Volume (L)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIrrigations?.map((irrigation) => (
                    <TableRow key={irrigation.id}>
                      <TableCell>
                        {format(new Date(irrigation.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{irrigation.metodo}</TableCell>
                      <TableCell className="text-right">
                        {irrigation.volume_agua.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
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
              Registre uma nova irrigação realizada em um lote
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => addIrrigationMutation.mutate(data))} className="space-y-4">
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
                    <Select onValueChange={field.onChange} value={field.value}>
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