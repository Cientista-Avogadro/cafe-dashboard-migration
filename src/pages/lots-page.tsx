import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lot } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePropertyData, executeHasuraOperation } from "@/hooks/use-hasura-query";
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
} from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Search, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";

const lotSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  setor_id: z.string().uuid("ID do setor inválido"),
  cultura_atual_id: z.string().uuid("ID da cultura inválido").optional(),
  status: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  area: z.coerce.number().optional(),
});
type LotFormValues = z.infer<typeof lotSchema>;

export default function LotsPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [, navigate] = useLocation();

  // Query para buscar culturas para o dropdown
  const { data: culturasData } = usePropertyData<{ culturas: Array<{ id: string; nome: string; ciclo_estimado_dias?: number }> }>(
    "GET_ALL_CULTURAS"
  );

  // Query para buscar setores para o dropdown
  const { data: setoresData } = usePropertyData<{ setores: Array<{ id: string; nome: string }> }>(
    "GET_SETORES"
  );

  // Query para buscar todos os lotes
  const { data: allLotsData, isLoading: isAllLotsLoading } = useQuery<{ lotes: Lot[] }>({  
    queryKey: ["all-lotes", setoresData],
    queryFn: async () => {
      if (!user?.propriedade_id) return { lotes: [] };
      // Aqui precisaríamos de uma query para buscar todos os lotes da propriedade
      // Como não temos essa query específica, vamos simular buscando os lotes de cada setor
      const allLotes: Lot[] = [];
      if (setoresData?.setores) {
        for (const setor of setoresData.setores) {
          const result = await executeHasuraOperation("GET_LOTES", { setor_id: setor.id });
          if (result.lotes) {
            // Adicionar o nome do setor a cada lote para exibição
            result.lotes.forEach((lote: Lot) => {
              allLotes.push({
                ...lote,
                setor_nome: setor.nome // Adicionando o nome do setor ao lote
              });
            });
          }
        }
      }
      return { lotes: allLotes };
    },
    enabled: !!user?.propriedade_id && !!setoresData?.setores,
  });

  // Query para buscar lotes de um setor específico
  const { data: sectorLotsData, isLoading: isSectorLotsLoading } = useQuery<{ lotes: Lot[] }>({  
    queryKey: ["lotes", selectedSectorId],
    queryFn: async () => {
      if (!selectedSectorId) return { lotes: [] };
      const result = await executeHasuraOperation("GET_LOTES", { setor_id: selectedSectorId });
      // Adicionar o nome do setor a cada lote para exibição
      const setor = setoresData?.setores?.find(s => s.id === selectedSectorId);
      const lotesWithSectorName = result.lotes?.map((lote: Lot) => ({
        ...lote,
        setor_nome: setor?.nome || 'Setor desconhecido'
      }));
      return { lotes: lotesWithSectorName || [] };
    },
    enabled: !!selectedSectorId,
  });

  // Mutation para adicionar lote
  const addLotMutation = useMutation({
    mutationFn: async (data: LotFormValues) => {
      const response = await executeHasuraOperation("INSERT_LOTE", {
        lote: {
          ...data,
          // Outros campos que possam ser necessários
        },
      });
      return response;
    },
    onSuccess: () => {
      // Invalidar tanto a query de todos os lotes quanto a query do setor específico
      queryClient.invalidateQueries({ queryKey: ["all-lotes"] });
      if (selectedSectorId) {
        queryClient.invalidateQueries({ queryKey: ["lotes", selectedSectorId] });
      }
      setIsAddDialogOpen(false);
      toast({
        title: "Lote adicionado",
        description: "O lote foi adicionado com sucesso.",
      });
      addForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar lote: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formulários
  const addForm = useForm<LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      nome: "",
      setor_id: "",
      cultura_atual_id: "",
      status: "Disponível",
      latitude: undefined,
      longitude: undefined,
      area: undefined,
    },
  });

  // Função de submit do formulário de adição
  const onAddSubmit = (data: LotFormValues) => {
    addLotMutation.mutate(data);
  };

  // Determinar qual conjunto de dados usar com base na seleção do setor
  const lotsData = selectedSectorId ? sectorLotsData : allLotsData;
  const isLoadingLots = selectedSectorId ? isSectorLotsLoading : isAllLotsLoading;
  
  // Filtro de busca
  const filteredLots = lotsData?.lotes?.filter((lote: Lot) =>
    lote.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading
  if (isLoadingLots) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gestão de Lotes</h1>
          <p className="text-slate-500">Cadastre e gerencie os lotes dos setores da sua propriedade</p>
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant={viewMode === 'table' ? 'default' : 'secondary'}
            onClick={() => setViewMode('table')}
            className="ri-list-check hover:bg-brown-200"
          >
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'secondary'}
            onClick={() => setViewMode('cards')}
            className="ri-grid-line"
          >
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lote
          </Button>
        </div>
      </div>

      {/* Card principal com filtro de setor */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Lotes Cadastrados</CardTitle>
              <CardDescription>Lista de lotes cadastrados por setor</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedSectorId || ""}
                  onChange={(e) => setSelectedSectorId(e.target.value)}
                >
                  <option value="">Selecione um setor</option>
                  {setoresData?.setores?.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar lotes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLots && filteredLots.length > 0 ? (
            viewMode === 'table' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Cultura Atual</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Latitude</TableHead>
                      <TableHead>Longitude</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLots.map((lote: Lot) => (
                      <TableRow key={lote.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/lotes/${lote.id}`)}>
                        <TableCell className="font-medium">{lote.nome}</TableCell>
                        <TableCell>{lote.setor_nome ?? "-"}</TableCell>
                        
                        <TableCell>
                          <Badge variant={lote.status === "Disponível" ? "outline" : "default"}>
                            {lote.status ?? "Disponível"}
                          </Badge>
                        </TableCell>
                        <TableCell>{lote.latitude ?? "-"}</TableCell>
                        <TableCell>{lote.longitude ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLots.map((lote: Lot) => (
                    <Card key={lote.id} className="overflow-hidden">
                      <div className="relative h-40 farm-card-image">
                        <img
                          src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                          alt={lote.nome}
                          className="h-full w-full object-cover"
                        />
                        <div className="farm-card-image-overlay">
                          <div className="absolute bottom-3 left-3">
                            <Badge variant={lote.status === "Disponível" ? "outline" : "default"}>
                              {lote.status ?? "Disponível"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{lote.nome}</h3>
                        <p className="text-sm text-slate-500 mb-2">
                          <span className="font-medium">Setor:</span> {lote.setor_nome ?? "-"}
                        </p>
                        
                        <p className="text-sm text-slate-500 mb-4">
                          {lote.latitude && lote.longitude
                            ? `Lat: ${lote.latitude}, Long: ${lote.longitude}`
                            : "Sem localização"}
                        </p>
                        <div className="flex space-x-2">
                          <Button variant="outline" className="flex-1" onClick={() => navigate(`/lotes/${lote.id}`)}>
                            <i className="ri-eye-line mr-1"></i> Detalhes
                          </Button>
                          <Button variant="secondary" className="flex-1">
                            <i className="ri-edit-line mr-1"></i> Editar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhum lote encontrado para esta busca." : selectedSectorId ? "Nenhum lote cadastrado neste setor." : "Nenhum lote cadastrado."}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Dialog de adicionar lote */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Lote</DialogTitle>
            <DialogDescription>Preencha os detalhes do lote a ser adicionado.</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit as any)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="setor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor*</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        value={field.value || selectedSectorId || ""}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                      >
                        <option value="">Selecione um setor</option>
                        {setoresData?.setores?.map((setor) => (
                          <option key={setor.id} value={setor.id}>
                            {setor.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Lote*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Lote 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="cultura_atual_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cultura Atual</FormLabel>
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
                          <option value="Disponível">Disponível</option>
                          <option value="Em cultivo">Em cultivo</option>
                          <option value="Em manutenção">Em manutenção</option>
                          <option value="Inativo">Inativo</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="Ex: -23.5505" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="Ex: -46.6333" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addForm.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (hectares)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Ex: 5.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addLotMutation.isPending}>
                  {addLotMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Lote
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}