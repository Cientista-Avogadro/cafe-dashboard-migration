import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { graphqlRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  Search, 
  Loader2, 
  Pencil, 
  Droplets 
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Irrigation } from "@/lib/types";

const irrigationSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  volume_agua: z.coerce.number().min(0.1, "Volume deve ser maior que zero"),
  metodo: z.string().min(1, "Método é obrigatório"),
});

interface IrrigationListProps {
  areaId: string;
  areaType: "lote" | "canteiro";
  areaName: string;
}

export function IrrigationList({ areaId, areaType, areaName }: IrrigationListProps) {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [irrigationToEdit, setIrrigationToEdit] = useState<Irrigation | null>(null);

  // Common irrigation methods
  const irrigationMethods = [
    "Aspersão",
    "Gotejamento",
    "Microaspersão",
    "Superficial",
    "Subsuperficial",
    "Outro"
  ];

  // Fetch irrigation records
  const { data: irrigationData, isLoading } = useQuery({
    queryKey: ["irrigacoes", areaType, areaId],
    queryFn: () => graphqlRequest(
      areaType === "lote" ? "GET_IRRIGACOES_BY_LOTE" : "GET_IRRIGACOES_BY_CANTEIRO",
      {
        [areaType === "lote" ? "lote_id" : "canteiro_id"]: areaId,
        propriedade_id: user?.propriedade_id
      }
    ),
    enabled: !!areaId && !!user?.propriedade_id
  });

  // Add irrigation mutation
  const addIrrigationMutation = useMutation({
    mutationFn: (data: z.infer<typeof irrigationSchema>) => {
      if (irrigationToEdit) {
        return graphqlRequest("EDIT_IRRIGACAO" as any, {
          id: irrigationToEdit.id,
          irrigacao: data
        });
      }
      return graphqlRequest("INSERT_IRRIGACAO", {
        irrigacao: {
          ...data,
          [areaType === "lote" ? "lote_id" : "canteiro_id"]: areaId,
          propriedade_id: user?.propriedade_id
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: irrigationToEdit 
          ? "Registro atualizado com sucesso!"
          : "Registro adicionado com sucesso!",
      });
      setIsAddDialogOpen(false);
      setIrrigationToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["irrigacoes"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o registro.",
        variant: "destructive",
      });
    }
  });

  // Form for adding irrigation records
  const addForm = useForm<z.infer<typeof irrigationSchema>>({
    resolver: zodResolver(irrigationSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      volume_agua: 0,
      metodo: ""
    }
  });

  // Filter irrigation records
  const filteredIrrigations = irrigationData?.irrigacoes?.filter((irrigation: Irrigation) => {
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
    totalVolume: filteredIrrigations?.reduce((acc: number, curr: Irrigation) => acc + curr.volume_agua, 0) || 0,
    averageVolume: filteredIrrigations?.length 
      ? (filteredIrrigations.reduce((acc: number, curr: Irrigation) => acc + curr.volume_agua, 0) / filteredIrrigations.length)
      : 0,
    lastIrrigation: filteredIrrigations?.length 
      ? new Date(Math.max(...filteredIrrigations.map((i: Irrigation) => new Date(i.data).getTime())))
      : null,
  };

  const editIrrigation = (irrigation: Irrigation) => {
    setIrrigationToEdit(irrigation);
    addForm.reset({
      data: irrigation.data.split('T')[0],
      volume_agua: irrigation.volume_agua,
      metodo: irrigation.metodo
    });
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Controle de Irrigação</h2>
          <p className="text-muted-foreground">Monitore e registre irrigações em {areaName}</p>
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
              {statistics.totalVolume.toLocaleString('pt-BR')} L
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
            <div className="text-2xl font-bold text-blue-600">
              {statistics.averageVolume.toLocaleString('pt-BR')} L
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
            <div className="text-2xl font-bold text-green-600">
              {statistics.lastIrrigation 
                ? format(statistics.lastIrrigation, "dd/MM/yyyy")
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Irrigações</CardTitle>
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
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
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
          ) : filteredIrrigations?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || dateFilter !== "all" 
                ? "Nenhum registro encontrado com os filtros aplicados"
                : "Nenhum registro de irrigação para esta área"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Volume (L)</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIrrigations?.map((irrigation: Irrigation) => (
                    <TableRow key={irrigation.id}>
                      <TableCell>
                        {format(new Date(irrigation.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{irrigation.volume_agua.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>{irrigation.metodo}</TableCell>
                      <TableCell>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => editIrrigation(irrigation)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
            <DialogTitle>{irrigationToEdit ? "Editar Irrigação" : "Nova Irrigação"}</DialogTitle>
            <DialogDescription>
              {irrigationToEdit ? "Atualize os detalhes da irrigação" : "Registre uma nova irrigação"}
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => addIrrigationMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addForm.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
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
                    <FormLabel>Volume de Água (L)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min="0.1"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
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
                    <FormLabel>Método</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método" />
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
                <Button type="submit" disabled={addIrrigationMutation.isPending}>
                  {addIrrigationMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {irrigationToEdit ? "Atualizar" : "Registrar"} Irrigação
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 