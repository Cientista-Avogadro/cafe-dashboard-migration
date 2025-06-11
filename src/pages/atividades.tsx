import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { executeOperation } from "@/lib/hasura";
import { GET_ATIVIDADES, INSERT_ATIVIDADE } from "@/graphql/operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Search, Plus, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const atividadeSchema = z.object({
  tipo: z.string().min(1, "Tipo é obrigatório"),
  data_prevista: z.date({
    required_error: "Data prevista é obrigatória",
  }),
  observacoes: z.string().optional(),
});

type AtividadeFormValues = z.infer<typeof atividadeSchema>;

export default function AtividadesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const form = useForm<AtividadeFormValues>({
    resolver: zodResolver(atividadeSchema),
    defaultValues: {
      tipo: "",
      observacoes: "",
    },
  });

  // Buscar atividades da propriedade
  const { data, isLoading } = useQuery<{ atividades: any[] }>({
    queryKey: ["atividades", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { atividades: [] };
      const response = await executeOperation(GET_ATIVIDADES, {
        propriedade_id: user.propriedade_id
      });

      // Agrupar atividades por tipo e data para evitar duplicatas
      const atividadesUnicas = response.atividades.reduce((acc: any[], atividade: any) => {
        const chave = `${atividade.tipo}-${atividade.data_prevista}`;
        const existe = acc.find(a => `${a.tipo}-${a.data_prevista}` === chave);
        if (!existe) {
          acc.push(atividade);
        }
        return acc;
      }, []);

      return { atividades: atividadesUnicas };
    },
    enabled: !!user?.propriedade_id,
  });

  // Mutation para registrar atividade
  const mutation = useMutation({
    mutationFn: async (values: AtividadeFormValues) => {
      return await executeOperation(INSERT_ATIVIDADE, {
        atividade: {
          ...values,
          data_prevista: values.data_prevista.toISOString(),
          propriedade_id: user?.propriedade_id,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades", user?.propriedade_id] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const onSubmit = (values: AtividadeFormValues) => {
    mutation.mutate(values);
  };

  // Filtrar atividades
  const filteredAtividades = data?.atividades.filter(atividade => {
    const matchesSearch = atividade.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      atividade.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = selectedTipo === "todos" || !selectedTipo || atividade.tipo === selectedTipo;
    const matchesStatus = !selectedStatus || atividade.status === selectedStatus;
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const tiposAtividade = ["Alerta de Colheita", "Conclusão de Planejamento", "Irrigação", "Tratamento de Praga", "Outros"];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atividades</h1>
          <p className="text-muted-foreground">Gerencie todas as atividades da sua propriedade</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Atividade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <CardTitle>Lista de Atividades</CardTitle>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar atividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {tiposAtividade.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-full h-16" />
              ))}
            </div>
          ) : filteredAtividades?.length ? (
            <div className="space-y-4">
              {filteredAtividades.map((atividade) => (
                <div key={atividade.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{atividade.tipo}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(atividade.data_prevista), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{atividade.observacoes || "Sem observações"}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma atividade encontrada.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Atividade</DialogTitle>
            <DialogDescription>
              Preencha os dados para registrar uma nova atividade.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposAtividade.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_prevista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Prevista</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
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
                      <Input {...field} placeholder="Adicione observações sobre a atividade" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Registrando..." : "Registrar Atividade"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 