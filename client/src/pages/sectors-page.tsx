import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { executeOperation } from "@/lib/hasura";
import { queryClient } from "@/lib/queryClient";
import { Sector } from "@/lib/types";
import { GET_SECTORS, CREATE_SECTOR, UPDATE_SECTOR, DELETE_SECTOR } from "@/graphql/sector-operations";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";

// Esquema para validação do formulário de setor
const sectorSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  description: z.string().optional(),
  area: z.coerce.number().min(0, { message: "Área deve ser um número positivo" }),
  farm_id: z.coerce.number().min(1, { message: "Fazenda é obrigatória" }),
});

type SectorFormValues = z.infer<typeof sectorSchema>;

export default function SectorsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentSector, setCurrentSector] = useState<Sector | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  // Fetch de setores
  const { data: sectors, isLoading } = useQuery({
    queryKey: ["/api/sectors", selectedFarmId],
    queryFn: async () => {
      const result = await executeOperation<{ sectors: Sector[] }>(
        GET_SECTORS,
        { farmId: selectedFarmId }
      );
      return result.sectors;
    },
  });

  // Fetch de fazendas para o select
  const { data: farms } = useQuery({
    queryKey: ["/api/farms"],
    queryFn: async () => {
      const result = await executeOperation<{ farms: Array<{ id: number; name: string }> }>(
        `query GetFarms {
          farms {
            id
            name
          }
        }`
      );
      return result.farms;
    },
  });

  // Mutation para adicionar setor
  const addSectorMutation = useMutation({
    mutationFn: async (data: SectorFormValues) => {
      return await executeOperation(CREATE_SECTOR, {
        sector: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sectors"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Setor adicionado",
        description: "O setor foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar setor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar setor
  const updateSectorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SectorFormValues }) => {
      return await executeOperation(UPDATE_SECTOR, {
        id,
        sector: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sectors"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: "Setor atualizado",
        description: "O setor foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar setor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir setor
  const deleteSectorMutation = useMutation({
    mutationFn: async (id: number) => {
      return await executeOperation(DELETE_SECTOR, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sectors"] });
      toast({
        title: "Setor excluído",
        description: "O setor foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir setor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form para adicionar setor
  const addForm = useForm<SectorFormValues>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      name: "",
      description: "",
      area: 0,
      farm_id: 0,
    },
  });

  // Form para editar setor
  const editForm = useForm<SectorFormValues>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      name: "",
      description: "",
      area: 0,
      farm_id: 0,
    },
  });

  // Função para abrir o dialog de edição
  const handleEdit = (sector: Sector) => {
    setCurrentSector(sector);
    editForm.reset({
      name: sector.name,
      description: sector.description || "",
      area: sector.area || 0,
      farm_id: sector.farm_id,
    });
    setIsEditDialogOpen(true);
  };

  // Função para confirmar exclusão
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este setor?")) {
      deleteSectorMutation.mutate(id);
    }
  };

  // Função para envio do formulário de adição
  const onAddSubmit = (data: SectorFormValues) => {
    addSectorMutation.mutate(data);
  };

  // Função para envio do formulário de edição
  const onEditSubmit = (data: SectorFormValues) => {
    if (currentSector) {
      updateSectorMutation.mutate({ id: currentSector.id, data });
    }
  };

  // Filtrar setores com base no termo de busca
  const filteredSectors = sectors?.filter((sector) =>
    sector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sector.description && sector.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sector.farm?.name && sector.farm.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Renderização de estado de carregamento
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
          <p className="text-slate-500">
            Cadastre e gerencie os setores das suas fazendas
          </p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Setor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Setores Cadastrados</CardTitle>
              <CardDescription>
                Lista de setores disponíveis no sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={selectedFarmId?.toString() || ""}
                onValueChange={(value) => setSelectedFarmId(value ? Number(value) : null)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas as fazendas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as fazendas</SelectItem>
                  {farms?.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id.toString()}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
        </CardHeader>
        <CardContent>
          {filteredSectors && filteredSectors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Fazenda</TableHead>
                  <TableHead>Área (ha)</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSectors.map((sector) => (
                  <TableRow key={sector.id}>
                    <TableCell className="font-medium">{sector.name}</TableCell>
                    <TableCell>{sector.farm?.name || "-"}</TableCell>
                    <TableCell>{sector.area ? `${Number(sector.area).toFixed(2)}` : "-"}</TableCell>
                    <TableCell className="max-w-md truncate">{sector.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(sector)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(sector.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <DialogDescription>
              Preencha os detalhes do setor a ser adicionado.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="farm_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fazenda*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma fazenda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {farms?.map((farm) => (
                          <SelectItem key={farm.id} value={farm.id.toString()}>
                            {farm.name}
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Setor*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Setor Norte" {...field} />
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
                    <FormLabel>Área (hectares)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 5.5" {...field} />
                    </FormControl>
                    <FormDescription>Área em hectares</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Setor com plantio de milho"
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
                  onClick={() => setIsAddDialogOpen(false)}
                >
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

      {/* Dialog de editar setor */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
            <DialogDescription>
              Atualize as informações do setor.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="farm_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fazenda*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma fazenda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {farms?.map((farm) => (
                          <SelectItem key={farm.id} value={farm.id.toString()}>
                            {farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Setor*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Setor Norte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (hectares)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Ex: 5.5" {...field} />
                    </FormControl>
                    <FormDescription>Área em hectares</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Setor com plantio de milho"
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
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateSectorMutation.isPending}>
                  {updateSectorMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}