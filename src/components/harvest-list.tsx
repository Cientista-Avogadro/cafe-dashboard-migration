import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  ADD_COLHEITA,
  EDIT_COLHEITA,
} from "@/lib/queries/colheitas";
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
import { ClickableTableRow } from "@/components/ui/table";
import { TableCell } from "@/components/ui/table";
import { Pencil } from "lucide-react";

const harvestSchema = z.object({
  data: z.string(),
  quantidade_colhida: z.string().transform(Number),
  unidade: z.string(),
  destino: z.string(),
  observacoes: z.string().optional(),
  cultura_id: z.string().uuid(),
  planejamento_id: z.string().uuid(),
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
  const [isAddingHarvest, setIsAddingHarvest] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingHarvest, setEditingHarvest] = useState<HarvestRecord | null>(null);

  const form = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestSchema),
    defaultValues: {
      data: new Date().toISOString().split("T")[0],
      quantidade_colhida: 0,
      unidade: "kg",
      destino: "",
      observacoes: "",
      cultura_id: "",
      planejamento_id: "",
    },
  });

  const getColheitasQuery = () => {
    switch (areaType) {
      case "lote":
        return GET_COLHEITAS_BY_LOTE;
      case "canteiro":
        return GET_COLHEITAS_BY_CANTEIRO;
      case "setor":
        return GET_COLHEITAS_BY_SETOR;
    }
  };

  const getPlanejamentosQuery = () => {
    switch (areaType) {
      case "lote":
        return GET_PLANEJAMENTOS_BY_LOTE;
      case "canteiro":
        return GET_PLANEJAMENTOS_BY_CANTEIRO;
      case "setor":
        return GET_PLANEJAMENTOS_BY_SETOR;
    }
  };

  const { data: harvests = [] } = useQuery({
    queryKey: ["harvests", areaType, areaId],
    queryFn: async () => {
      if (!user?.propriedade_id) return [];
      const query = getColheitasQuery();
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
      const query = getPlanejamentosQuery();
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
  });

  const editHarvestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof harvestSchema>) => {
      if (!editingHarvest) return;
      const variables = {
        id: editingHarvest.id,
        colheita: data,
      };
      return executeOperation(EDIT_COLHEITA, variables);
    },
  });

  const onSubmit = async (data: z.infer<typeof harvestSchema>) => {
    try {
      if (editingHarvest) {
        await editHarvestMutation.mutateAsync(data);
      } else {
        await addHarvestMutation.mutateAsync(data);
      }
      setIsAddingHarvest(false);
      setEditingHarvest(null);
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar colheita:", error);
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

  const handleRowClick = (id: string) => {
    // Implement the logic to handle row click
  };

  const handleEdit = (harvest: HarvestRecord) => {
    // Implement the logic to handle edit
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

      <div className="rounded-md border">
        <div className="grid grid-cols-5 gap-4 p-4 font-medium">
          <div className="col-span-2">Cultura</div>
          <div>Quantidade</div>
          <div>Destino</div>
          <div>Data</div>
        </div>
        {filteredHarvests.map((harvest: HarvestRecord) => (
          <ClickableTableRow 
            key={harvest.id}
            onClick={() => handleRowClick(harvest.id)}
          >
            <TableCell>{format(new Date(harvest.data), "dd/MM/yyyy")}</TableCell>
            <TableCell>{harvest.quantidade_colhida.toLocaleString('pt-BR')} kg</TableCell>
            <TableCell>{harvest.destino}</TableCell>
            <TableCell>{harvest.observacoes || "-"}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(harvest);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </ClickableTableRow>
        ))}
      </div>

      <Dialog open={isAddingHarvest} onOpenChange={setIsAddingHarvest}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingHarvest ? "Editar Colheita" : "Adicionar Colheita"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="planejamento_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planejamento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o planejamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {planejamentos.map((planejamento: PlanningRecord) => (
                            <SelectItem key={planejamento.id} value={planejamento.id}>
                              {planejamento.area_plantada ? `${planejamento.area_plantada} ha` : 'Sem área'} - 
                              {planejamento.produtividade_esperada ? `${planejamento.produtividade_esperada} t/ha` : 'Sem produtividade'}
                            </SelectItem>
                          ))}
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
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantidade_colhida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Colhida</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a unidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="t">t</SelectItem>
                            <SelectItem value="un">un</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="destino"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destino</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingHarvest(false);
                setEditingHarvest(null);
                form.reset();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={addHarvestMutation.isPending || editHarvestMutation.isPending}
            >
              {editingHarvest ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 