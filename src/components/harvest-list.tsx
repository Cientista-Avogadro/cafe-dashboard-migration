import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeOperation } from "@/lib/hasura";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  GET_COLHEITAS_BY_LOTE,
  GET_COLHEITAS_BY_CANTEIRO,
  GET_COLHEITAS_BY_SETOR,
  GET_PLANEJAMENTOS_BY_LOTE,
  GET_PLANEJAMENTOS_BY_CANTEIRO,
  GET_PLANEJAMENTOS_BY_SETOR,
  EDIT_COLHEITA,
} from "@/lib/queries/colheitas";
import { ADD_COLHEITA } from "@/graphql/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { graphqlRequest } from "@/lib/queryClient";
import * as operations from "@/graphql/operations";

const harvestSchema = z.object({
  data: z.string(),
  quantidade_colhida: z.number().min(1, { message: "A quantidade deve ser maior que zero" }),
  unidade: z.string(),
  destino: z.string(),
  observacoes: z.string().optional(),
  cultura_id: z.string().uuid(),
  planejamento_id: z.string().uuid("Planejamento é obrigatório"),
  area_colhida: z.number().optional(),
  produtividade_real: z.number().optional(),
});

type HarvestRecord = {
  id: string;
  data: string;
  quantidade_colhida: number;
  unidade: string;
  destino: string;
  observacoes?: string;
  cultura_id: string;
  lote_id?: string;
  canteiro_id?: string;
  setor_id?: string;
  propriedade_id: string;
  planejamento_id: string;
  area_colhida?: number;
  produtividade_real?: number;
};

type PlanningInsumo = {
  id: string;
  data_uso: string;
  observacoes: string | null;
  produto_id: string;
  quantidade: number;
  unidade: string;
  produto: {
    id: string;
    nome: string;
    unidade_medida: string;
  };
};

type PlanningRecord = {
  id: string;
  canteiro_id: string | null;
  cultura_id: string;
  cultura?: {
    id: string;
    nome: string;
  };
  data_fim_prevista: string;
  data_inicio: string;
  lote_id: string | null;
  propriedade_id: string;
  setor_id: string | null;
  status: string;
  area_plantada: number | null;
  produtividade_esperada: number | null;
};

interface HarvestListProps {
  areaType: "lote" | "canteiro" | "setor";
  areaId: string;
}

type HarvestFormValues = z.infer<typeof harvestSchema>;

export function HarvestList({ areaType, areaId }: HarvestListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddingHarvest, setIsAddingHarvest] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingHarvest, setEditingHarvest] = useState<HarvestRecord | null>(null);
  const [selectedPlanejamento, setSelectedPlanejamento] = useState<PlanningRecord | null>(null);

  const form = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      data: new Date().toISOString().split("T")[0],
      quantidade_colhida: 1,
      unidade: "kg",
      destino: "",
      observacoes: "",
      cultura_id: "",
      planejamento_id: "",
      area_colhida: 0,
      produtividade_real: 0,
    },
  });


  const { data: harvests = [] } = useQuery({
    queryKey: ["harvests", areaType, areaId],
    queryFn: async () => {
      if (!user?.propriedade_id) return [];
      const query = areaType === "lote" ? GET_COLHEITAS_BY_LOTE :
                   areaType === "canteiro" ? GET_COLHEITAS_BY_CANTEIRO :
                   GET_COLHEITAS_BY_SETOR;
      const variables = {
        propriedade_id: user.propriedade_id,
        [`${areaType}_id`]: areaId,
      };
      const response = await executeOperation(query, variables);
      return response.colheitas;
    },
    enabled: !!user?.propriedade_id,
  });

  const { data: planejamentos = [] } = useQuery({
    queryKey: ["planejamentos", areaType, areaId],
    queryFn: async () => {
      if (!user?.propriedade_id) return [];
      const query = areaType === "lote" ? GET_PLANEJAMENTOS_BY_LOTE :
                   areaType === "canteiro" ? GET_PLANEJAMENTOS_BY_CANTEIRO :
                   GET_PLANEJAMENTOS_BY_SETOR;
      const variables = {
        propriedade_id: user.propriedade_id,
        [`${areaType}_id`]: areaId,
      };
      const response = await executeOperation(query, variables);
      return response.planejamentos;
    },
    enabled: !!user?.propriedade_id,
  });

  const addHarvestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof harvestSchema>) => {
      if (!user?.propriedade_id) return;
      const variables = {
        colheita: {
          ...data,
          [`${areaType}_id`]: areaId,
          propriedade_id: user.propriedade_id,
        },
      };
      return executeOperation(ADD_COLHEITA, variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvests", areaType, areaId] });
      setIsAddingHarvest(false);
      setEditingHarvest(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Colheita registrada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao registrar colheita: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const editHarvestMutation = useMutation({
    mutationFn: async ({ id, colheita }: { id: string; colheita: HarvestFormValues }) => {
      return executeOperation("UPDATE_COLHEITA", { id, colheita });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colheitas"] });
      toast({
        title: "Sucesso",
        description: "Colheita atualizada com sucesso!",
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar colheita:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar colheita. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: z.infer<typeof harvestSchema>) => {
    setIsSubmitting(true);
    try {
      const colheitaData = {
        ...data,
        propriedade_id: user?.propriedade_id,
        [`${areaType}_id`]: areaId,
      };

      // Validação da quantidade máxima
      const planejamento = planejamentos.find((p: PlanningRecord) => p.id === data.planejamento_id);
      if (planejamento && !validateQuantidade(data.quantidade_colhida, planejamento)) {
        form.setError("quantidade_colhida", {
          type: "manual",
          message: "A quantidade colhida não pode ultrapassar a quantidade planejada.",
        });
        setIsSubmitting(false);
        return;
      }

      await addHarvestMutation.mutateAsync(colheitaData);
      
      // Atualizar status do planejamento se necessário
      if (planejamento) {
        await checkAndUpdateProductionStatus(planejamento);
      }
      
      queryClient.invalidateQueries({ queryKey: ["harvests", areaType, areaId] });
      setIsAddingHarvest(false);
      toast({
        title: "Colheita registrada",
        description: "A colheita foi registrada com sucesso.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Erro ao salvar colheita:", error);
      toast({
        title: "Erro",
        description: `Erro ao salvar colheita: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredHarvests = harvests.filter((harvest: HarvestRecord) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      harvest.destino.toLowerCase().includes(searchLower) ||
      harvest.observacoes?.toLowerCase().includes(searchLower)
    );
  });


  const totalQuantity = filteredHarvests.reduce(
    (sum: number, harvest: HarvestRecord) => sum + harvest.quantidade_colhida,
    0
  );

  const totalPlannedQuantity = filteredHarvests.reduce(
    (sum: number, harvest: HarvestRecord) => sum + (harvest.planejamento_id ? 0 : 0),
    0
  );

  const lastHarvest = filteredHarvests[0];

  const columns = [
    {
      header: "Data",
      accessorKey: "data",
      cell: (value: string) => format(new Date(value), "dd/MM/yyyy")
    },
    {
      header: "Quantidade",
      accessorKey: "quantidade_colhida",
      cell: (cellInfo: any) => {
        const row = cellInfo?.row;
        const quantidade = row?.original?.quantidade_colhida ?? '';
        const unidade = row?.original?.unidade ?? '';
        return quantidade
          ? `${quantidade.toLocaleString('pt-BR')} ${unidade}`
          : '';
      }
    },
    {
      header: "Destino",
      accessorKey: "destino"
    },
    {
      header: "Observações",
      accessorKey: "observacoes",
      cell: (value: string) => value || "-"
    }
  ];

  // Função para calcular a quantidade total já colhida
  const getQuantidadeColhida = (planejamentoId: string) => {
    return harvests
      .filter((h: HarvestRecord) => h.planejamento_id === planejamentoId)
      .reduce((sum: number, h: HarvestRecord) => sum + h.quantidade_colhida, 0);
  };

  // Função para validar a quantidade máxima
  const validateQuantidade = (value: number, planejamento: PlanningRecord) => {
    if (!planejamento.area_plantada || !planejamento.produtividade_esperada) return true;
    
    const quantidadePlanejada = planejamento.area_plantada * planejamento.produtividade_esperada;
    const quantidadeColhida = getQuantidadeColhida(planejamento.id);
    const novaQuantidade = quantidadeColhida + value;
    
    return novaQuantidade <= quantidadePlanejada;
  };

  // Add this function after the getQuantidadeColhida function
  const checkAndUpdateProductionStatus = async (planejamento: PlanningRecord) => {
    const quantidadeColhida = getQuantidadeColhida(planejamento.id);
    const quantidadePlanejada = planejamento.area_plantada && planejamento.produtividade_esperada 
      ? planejamento.area_plantada * planejamento.produtividade_esperada 
      : 0;

    // Se a quantidade colhida for maior ou igual à planejada, marca como concluído
    if (quantidadeColhida >= quantidadePlanejada) {
      try {
        await executeOperation("UPDATE_PLANEJAMENTO", {
          id: planejamento.id,
          planejamento: {
            status: "concluido"
          }
        });
        queryClient.invalidateQueries({ queryKey: ["planejamentos"] });
      } catch (error) {
        console.error("Erro ao atualizar status do planejamento:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por destino ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Button onClick={() => setIsAddingHarvest(true)}>Adicionar Colheita</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade Colhida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toFixed(2)} kg</div>
            <p className="text-xs text-muted-foreground">
              {totalPlannedQuantity > 0
                ? `${((totalQuantity / totalPlannedQuantity) * 100).toFixed(1)}% do planejado`
                : "Sem planejamento"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Colheita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastHarvest
                ? format(new Date(lastHarvest.data), "dd/MM/yyyy", { locale: ptBR })
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastHarvest ? `${lastHarvest.quantidade_colhida} kg` : "Sem colheitas"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtividade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPlannedQuantity > 0
                ? `${((totalQuantity / totalPlannedQuantity) * 100).toFixed(1)}%`
                : "0.00%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPlannedQuantity > 0
                ? "do planejado"
                : "Sem planejamento"}
            </p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={filteredHarvests}
        title="Registros de Colheita"
      />

      <Dialog open={isAddingHarvest} onOpenChange={setIsAddingHarvest}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingHarvest ? "Editar Colheita" : "Adicionar Colheita"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="planejamento_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planejamento*</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            const planejamento = planejamentos?.find((p: PlanningRecord) => p.id === value);
                            if (planejamento) {
                              form.setValue('cultura_id', planejamento.cultura_id);
                              setSelectedPlanejamento(planejamento);
                            }
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um planejamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {planejamentos
                              ?.filter((planejamento: PlanningRecord) => planejamento.status === 'planejado' || planejamento.status === 'em_andamento')
                              .map((planejamento: PlanningRecord) => {
                              const quantidadeColhida = getQuantidadeColhida(planejamento.id);
                              const quantidadePlanejada = planejamento.area_plantada && planejamento.produtividade_esperada 
                                ? planejamento.area_plantada * planejamento.produtividade_esperada 
                                : 0;
                              const percentualColhido = quantidadePlanejada > 0 
                                ? (quantidadeColhida / quantidadePlanejada) * 100 
                                : 0;

                              return (
                                <SelectItem key={planejamento.id} value={planejamento.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{planejamento.cultura?.nome}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {planejamento.area_plantada ? `${planejamento.area_plantada} ha` : 'Sem área'} - 
                                      {planejamento.produtividade_esperada ? `${planejamento.produtividade_esperada} t/ha` : 'Sem produtividade'}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(planejamento.data_inicio), "dd/MM/yyyy")} a {format(new Date(planejamento.data_fim_prevista), "dd/MM/yyyy")}
                                    </span>
                                    {quantidadePlanejada > 0 && (
                                      <span className="text-sm text-muted-foreground">
                                        {percentualColhido.toFixed(1)}% colhido
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
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
                            value={field.value != null ? field.value : 1}
                            onChange={(e) => {
                              form.setValue("quantidade_colhida", Number(e.target.value));
                              const quantidade = Number(e.target.value);
                              const area = Number(form.getValues("area_colhida"));
                              if (quantidade && area) {
                                form.setValue("produtividade_real", Number(quantidade) / Number(area));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="area_colhida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Área Colhida (ha)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="Ex: 1.5" 
                            {...field}
                            value={field.value != null ? field.value : 0}
                            onChange={(e) => {
                              form.setValue("area_colhida", Number(e.target.value));
                              // Calcular produtividade real se houver quantidade e área
                              const quantidade = form.getValues("quantidade_colhida");
                              const area = e.target.value;
                              if (quantidade && area) {
                                form.setValue("produtividade_real", Number(quantidade) / Number(area));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="produtividade_real"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produtividade Real (kg/ha)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            min="0"
                            placeholder="Ex: 2500" 
                            {...field}
                            value={field.value != null ? field.value : 0}
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade*</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                    control={form.control}
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
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Colheita realizada pela manhã" 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddingHarvest(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingHarvest ? "Salvar Alterações" : "Registrar Colheita"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 