import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sector } from "@/lib/types";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, Search, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const sectorSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});
type SectorFormValues = z.infer<typeof sectorSchema>;

export default function SectorsPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Query para buscar setores
  const { data, isLoading } = useQuery<{ setores: Sector[] }>({
    queryKey: ["setores", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { setores: [] };
      return await graphqlRequest("GET_SETORES", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Mutation para adicionar setor
  const addSectorMutation = useMutation({
    mutationFn: async (data: SectorFormValues) => {
      const response = await graphqlRequest("INSERT_SETOR", {
        setor: {
          ...data,
          propriedade_id: user?.propriedade_id,
        },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setores", user?.propriedade_id] });
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
    },
  });

  const editForm = useForm<SectorFormValues>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      nome: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

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
                    <TableRow key={setor.id}>
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
                  <Card key={setor.id} className="overflow-hidden">
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
                      {/* Campos extras podem ser adicionados aqui */}
                      <div className="flex space-x-2">
                        <Button variant="outline" className="flex-1">
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
              {searchTerm ? "Nenhum setor encontrado para esta busca." : "Nenhum setor cadastrado."}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Dialog de adicionar setor */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Setor</DialogTitle>
            <DialogDescription>Preencha os detalhes do setor a ser adicionado.</DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
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
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addSectorMutation.isPending}>
                  {addSectorMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Setor
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}