import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sector } from "@/lib/types";
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
  Textarea,
} from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Search, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const sectorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  area: z.coerce.number().min(0, "A área deve ser um número positivo").optional(),
  descricao: z.string().optional(),
  observacao: z.string().optional(),
});
type SectorFormValues = z.infer<typeof sectorSchema>;

export default function SectorsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Query para buscar setores
  const { data, isLoading } = usePropertyData<{ setores: Sector[] }>(
    "GET_SETORES"
  );

  // Mutation para adicionar setor
  const addSectorMutation = useMutation({
    mutationFn: async (data: SectorFormValues) => {
      const response = await executeHasuraOperation("INSERT_SETOR", {
        setor: {
          ...data,
          propriedade_id: user?.propriedade_id,
        },
      });
      return response;
    },
    onSuccess: () => {
      // Invalida a query de setores para forçar o refetch
      queryClient.invalidateQueries({ 
        queryKey: ["GET_SETORES", { propriedade_id: user?.propriedade_id }] 
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Setor adicionado",
        description: "O setor foi adicionado com sucesso.",
      });
      addForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar setor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formulários
  const addForm = useForm<SectorFormValues>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      nome: "",
      latitude: undefined,
      longitude: undefined,
      area: undefined,
      descricao: "",
      observacao: "",
    },
  });

  // Removing unused editForm as it's not currently used in the application

  // Função de submit do formulário de adição
  const onAddSubmit = (data: SectorFormValues) => {
    addSectorMutation.mutate(data);
  };
  // Filtro de busca
  const filteredSectors = data?.setores?.filter((setor) =>
    setor.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading
  if (isLoading) {
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
          <h1 className="text-2xl font-semibold text-slate-900">Gestão de Setores</h1>
          <p className="text-slate-500">Cadastre e gerencie os setores da sua propriedade</p>
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
            Novo Setor
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Setores Cadastrados</CardTitle>
              <CardDescription>Lista de setores cadastrados na sua propriedade</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar setores..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSectors && filteredSectors.length > 0 ? (
            viewMode === 'table' ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Latitude</TableHead>
                    <TableHead>Longitude</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSectors.map((setor) => (
                    <TableRow 
                      key={setor.id} 
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => navigate(`/setores/${setor.id}`)}
                    >
                      <TableCell className="font-medium">{setor.nome}</TableCell>
                      <TableCell>{setor.latitude ?? "-"}</TableCell>
                      <TableCell>{setor.longitude ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSectors.map((setor) => (
                  <Card 
                    key={setor.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/setores/${setor.id}`)}
                  >
                    <div className="relative h-40 farm-card-image">
                      <img
                        src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                        alt={setor.nome}
                        className="h-full w-full object-cover"
                      />
                      <div className="farm-card-image-overlay">
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="default">Ativo</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{setor.nome}</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        {setor.latitude && setor.longitude
                          ? `Lat: ${setor.latitude}, Long: ${setor.longitude}`
                          : "Sem localização"}
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/setores/${setor.id}`)}>Ver Detalhes</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum setor encontrado para esta busca." : "Nenhum setor cadastrado."}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Dialog de adicionar setor */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
          <div className="flex flex-col h-full max-h-[calc(90vh-8rem)]">
            <DialogHeader className="flex-shrink-0 px-6 pt-6">
              <DialogTitle>Adicionar Novo Setor</DialogTitle>
              <DialogDescription>Preencha os detalhes do setor a ser adicionado.</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto px-6 py-2 flex-1">
              <Form {...addForm}>
                <form id="add-sector-form" onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 pb-4">
              <FormField
                control={addForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Setor*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Setor 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                <FormField
                  control={addForm.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (m²)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição do setor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações adicionais sobre o setor" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </form>
              </Form>
            </div>
            <DialogFooter className="flex-shrink-0 border-t bg-background p-4">
              <div className="flex justify-end gap-2 w-full">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" form="add-sector-form" disabled={addSectorMutation.isPending}>
                  {addSectorMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Setor
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}