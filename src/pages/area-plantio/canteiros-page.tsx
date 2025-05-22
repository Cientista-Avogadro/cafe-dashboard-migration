import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Canteiro, Lot, Crop } from "@/lib/types";
import { queryClient, graphqlRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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

const canteiroSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lote_id: z.string().uuid("ID do lote inválido"),
  cultura_id: z.string().uuid("ID da cultura inválido").optional(),
  status: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  area: z.coerce.number().optional(),
});
type CanteiroFormValues = z.infer<typeof canteiroSchema>;

export default function CanteirosPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [, navigate] = useLocation();

  // Query para buscar culturas para o dropdown
  const { data: culturasData } = useQuery<{ culturas: Array<{ id: string; nome: string; ciclo_estimado_dias?: number }> }>({  
    queryKey: ["culturas", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { culturas: [] };
      const response = await graphqlRequest("GET_ALL_CULTURAS", { propriedade_id: user.propriedade_id });
      return response;
    },
    enabled: !!user?.propriedade_id,
  });

   // Query para buscar setores para o dropdown
   const { data: setoresData } = useQuery<{ setores: Array<{ id: string; nome: string }> }>({  
    queryKey: ["setores", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { setores: [] };
      return await graphqlRequest("GET_SETORES", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar lotes para o dropdown
  const { data: lotesData } = useQuery<{ lotes: Array<{ id: string; nome: string }> }>({  
    queryKey: ["all-lotes", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { lotes: [] };
      // Aqui precisaríamos de uma query para buscar todos os lotes da propriedade
      const allLotes: Lot[] = [];
      if (setoresData?.setores) {
        for (const setor of setoresData.setores) {
          const result = await graphqlRequest("GET_LOTES", { setor_id: setor.id });
          if (result.lotes) {
            result.lotes.forEach((lote: Lot) => {
              allLotes.push({
                ...lote,
                setor_nome: setor.nome
              });
            });
          }
        }
      }
      return { lotes: allLotes };
    },
    enabled: !!user?.propriedade_id && !!setoresData?.setores,
  });

 

  // Query para buscar todos os canteiros
  const { data: allCanteirosData, isLoading: isAllCanteirosLoading } = useQuery<{ canteiros: Canteiro[] }>({  
    queryKey: ["all-canteiros", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { canteiros: [] };
      const result = await graphqlRequest("GET_CANTEIROS", { propriedade_id: user.propriedade_id });
      
      // Adicionar informações de lote e cultura para exibição
      if (result.canteiros && lotesData?.lotes && culturasData?.culturas) {
        result.canteiros.forEach((canteiro: Canteiro) => {
          const lote = lotesData.lotes.find(l => l.id === canteiro.lote_id);
          const cultura = culturasData.culturas.find(c => c.id === canteiro.cultura_id);
          
          if (lote) {
            canteiro.lote_nome = lote.nome;
          }
          
          if (cultura) {
            canteiro.cultura = cultura;
          }
        });
      }
      
      return result;
    },
    enabled: !!user?.propriedade_id && !!lotesData?.lotes && !!culturasData?.culturas,
  });

  // Query para buscar canteiros de um lote específico
  const { data: loteCanteirosData, isLoading: isLoteCanteirosLoading } = useQuery<{ canteiros: Canteiro[] }>({  
    queryKey: ["canteiros", selectedLoteId],
    queryFn: async () => {
      if (!selectedLoteId) return { canteiros: [] };
      const result = await graphqlRequest("GET_CANTEIROS", { lote_id: selectedLoteId });
      
      // Adicionar informações de lote e cultura para exibição
      if (result.canteiros && lotesData?.lotes && culturasData?.culturas) {
        result.canteiros.forEach((canteiro: Canteiro) => {
          const lote = lotesData.lotes.find(l => l.id === canteiro.lote_id);
          const cultura = culturasData.culturas.find(c => c.id === canteiro.cultura_id);
          
          if (lote) {
            canteiro.lote_nome = lote.nome;
          }
          
          if (cultura) {
            canteiro.cultura = cultura;
          }
        });
      }
      
      return result;
    },
    enabled: !!selectedLoteId && !!lotesData?.lotes && !!culturasData?.culturas,
  });

  // Mutation para adicionar canteiro
  const addCanteiroMutation = useMutation({
    mutationFn: async (data: CanteiroFormValues) => {
      const canteiroData = {
        ...data,
        propriedade_id: user?.propriedade_id
      };
      return await graphqlRequest("INSERT_CANTEIRO", { canteiro: canteiroData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-canteiros"] });
      queryClient.invalidateQueries({ queryKey: ["canteiros"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Canteiro adicionado",
        description: "O canteiro foi adicionado com sucesso.",
      });
      addForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar canteiro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formulário para adicionar canteiro
  const addForm = useForm<CanteiroFormValues>({
    resolver: zodResolver(canteiroSchema),
    defaultValues: {
      nome: "",
      lote_id: "",
      cultura_id: "",
      status: "Disponível",
      latitude: undefined,
      longitude: undefined,
      area: undefined,
    },
  });

  // Função de submit do formulário de adição
  const onAddSubmit = (data: CanteiroFormValues) => {
    addCanteiroMutation.mutate(data);
  };

  console.log((selectedLoteId ? loteCanteirosData?.canteiros! : allCanteirosData?.canteiros!))
  // Filtrar canteiros com base no termo de busca
  const filteredCanteiros = ((selectedLoteId ? loteCanteirosData?.canteiros! : allCanteirosData?.canteiros!)||[] as Canteiro[])
    .filter((canteiro) => 
      canteiro.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      canteiro.lote_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      canteiro.cultura?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Canteiros</h1>
          <p className="text-muted-foreground">
            Gerencie os canteiros da sua propriedade
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Canteiro
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar canteiros..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2"
              value={selectedLoteId || ""}
              onChange={(e) => setSelectedLoteId(e.target.value || null)}
            >
              <option value="">Todos os Lotes</option>
              {lotesData?.lotes?.map((lote) => (
                <option key={lote.id} value={lote.id}>
                  {lote.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-1">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Tabela
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
          </div>
        </div>
      </div>

      {isAllCanteirosLoading || isLoteCanteirosLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Cultura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Área (m²)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCanteiros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Nenhum canteiro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredCanteiros.map((canteiro) => (
                  <TableRow 
                    key={canteiro.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/canteiros/${canteiro.id}`)}
                  >
                    <TableCell>{canteiro.nome}</TableCell>
                    <TableCell>{canteiro.lote_nome || "Não definido"}</TableCell>
                    <TableCell>{canteiro.cultura?.nome || "Não definido"}</TableCell>
                    <TableCell>
                      <Badge variant={
                        canteiro.status === "Em cultivo" ? "default" :
                        canteiro.status === "Disponível" ? "outline" :
                        canteiro.status === "Em manutenção" ? "secondary" :
                        "destructive"
                      }>
                        {canteiro.status || "Não definido"}
                      </Badge>
                    </TableCell>
                    <TableCell>{canteiro.area ? `${canteiro.area} m²` : "Não definido"}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">Ver detalhes</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCanteiros.length === 0 ? (
            <div className="col-span-full text-center py-8">
              Nenhum canteiro encontrado
            </div>
          ) : (
            filteredCanteiros.map((canteiro) => (
              <Card 
                key={canteiro.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  navigate(`/canteiros/${canteiro.id}`);
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle>{canteiro.nome}</CardTitle>
                  <CardDescription>
                    Lote: {canteiro.lote_nome || "Não definido"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cultura:</span>
                      <span className="text-sm font-medium">{canteiro.cultura?.nome || "Não definido"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={
                        canteiro.status === "Em cultivo" ? "default" :
                        canteiro.status === "Disponível" ? "outline" :
                        canteiro.status === "Em manutenção" ? "secondary" :
                        "destructive"
                      }>
                        {canteiro.status || "Não definido"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Área:</span>
                      <span className="text-sm font-medium">{canteiro.area ? `${canteiro.area} m²` : "Não definido"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Dialog para adicionar canteiro */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Adicionar Canteiro</DialogTitle>
            <DialogDescription>
              Preencha as informações para adicionar um novo canteiro.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Canteiro*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Canteiro 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="lote_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote*</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Selecione um lote</option>
                        {lotesData?.lotes?.map((lote) => (
                          <option key={lote.id} value={lote.id}>
                            {lote.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="cultura_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cultura</FormLabel>
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
                    <FormLabel>Área (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="Ex: 100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addCanteiroMutation.isPending}>
                  {addCanteiroMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Canteiro
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
