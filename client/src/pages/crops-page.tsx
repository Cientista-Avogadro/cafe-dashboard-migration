import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Crop } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Componentes UI
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trash2, 
  Plus, 
  Edit,
  Search,
  Loader2
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Esquema de validação para cultura
const cropSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  variety: z.string().optional(),
  cycle_days: z.coerce.number().min(1, "Deve ser pelo menos 1").optional(),
  yield_per_hectare: z.coerce.number().min(0, "Deve ser um valor positivo").optional(),
  planting_season_start: z.string().optional(),
  planting_season_end: z.string().optional(),
});

type CropFormValues = z.infer<typeof cropSchema>;

export default function CropsPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCrop, setCurrentCrop] = useState<Crop | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Query para buscar culturas
  const { data: crops, isLoading } = useQuery<Crop[]>({
    queryKey: ["/api/crops"],
    enabled: !!user,
  });

  // Mutation para adicionar cultura
  const addCropMutation = useMutation({
    mutationFn: async (data: CropFormValues) => {
      const response = await apiRequest("POST", "/api/crops", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crops"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Cultura adicionada",
        description: "A cultura foi adicionada com sucesso.",
      });
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar cultura: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar cultura
  const updateCropMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CropFormValues }) => {
      const response = await apiRequest("PATCH", `/api/crops/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crops"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Cultura atualizada",
        description: "A cultura foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar cultura: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir cultura
  const deleteCropMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/crops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crops"] });
      toast({
        title: "Cultura excluída",
        description: "A cultura foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir cultura: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form para adicionar cultura
  const addForm = useForm<CropFormValues>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      name: "",
      variety: "",
      cycle_days: undefined,
      yield_per_hectare: undefined,
      planting_season_start: "",
      planting_season_end: "",
    },
  });

  // Form para editar cultura
  const editForm = useForm<CropFormValues>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      name: "",
      variety: "",
      cycle_days: undefined,
      yield_per_hectare: undefined,
      planting_season_start: "",
      planting_season_end: "",
    },
  });

  // Função para abrir o dialog de edição
  const handleEdit = (crop: Crop) => {
    setCurrentCrop(crop);
    editForm.reset({
      name: crop.name,
      variety: crop.variety || "",
      cycle_days: crop.cycle_days || undefined,
      yield_per_hectare: crop.yield_per_hectare ? Number(crop.yield_per_hectare) : undefined,
      planting_season_start: crop.planting_season_start || "",
      planting_season_end: crop.planting_season_end || "",
    });
    setIsEditDialogOpen(true);
  };

  // Função para confirmar exclusão
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta cultura?")) {
      deleteCropMutation.mutate(id);
    }
  };

  // Função para envio do formulário de adição
  const onAddSubmit = (data: CropFormValues) => {
    addCropMutation.mutate(data);
  };

  // Função para envio do formulário de edição
  const onEditSubmit = (data: CropFormValues) => {
    if (currentCrop) {
      updateCropMutation.mutate({ id: currentCrop.id, data });
    }
  };

  // Filtrar culturas com base no termo de busca
  const filteredCrops = crops?.filter((crop) =>
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (crop.variety && crop.variety.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <h1 className="text-2xl font-semibold text-slate-900">Gestão de Culturas</h1>
          <p className="text-slate-500">
            Cadastre e gerencie as culturas disponíveis para plantio
          </p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Cultura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Culturas Cadastradas</CardTitle>
              <CardDescription>
                Lista de culturas disponíveis no sistema
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar culturas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCrops && filteredCrops.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Variedade</TableHead>
                  <TableHead>Ciclo (Dias)</TableHead>
                  <TableHead>Produtividade (t/ha)</TableHead>
                  <TableHead>Período de Plantio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCrops.map((crop) => (
                  <TableRow key={crop.id}>
                    <TableCell className="font-medium">{crop.name}</TableCell>
                    <TableCell>{crop.variety || "-"}</TableCell>
                    <TableCell>{crop.cycle_days || "-"}</TableCell>
                    <TableCell>{crop.yield_per_hectare ? `${Number(crop.yield_per_hectare).toFixed(2)}` : "-"}</TableCell>
                    <TableCell>
                      {crop.planting_season_start && crop.planting_season_end
                        ? `${crop.planting_season_start} a ${crop.planting_season_end}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(crop)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(crop.id)}
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
              {searchTerm ? "Nenhuma cultura encontrada para esta busca." : "Nenhuma cultura cadastrada."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de adicionar cultura */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Cultura</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da cultura a ser adicionada.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Cultura*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Milho" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="variety"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variedade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Híbrido 30F53" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="cycle_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciclo (dias)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="yield_per_hectare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produtividade (t/ha)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 7.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="planting_season_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início da Época de Plantio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Setembro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="planting_season_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim da Época de Plantio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Novembro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={addCropMutation.isPending}>
                  {addCropMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Cultura
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de editar cultura */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cultura</DialogTitle>
            <DialogDescription>
              Atualize as informações da cultura.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Cultura*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Milho" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="variety"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variedade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Híbrido 30F53" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="cycle_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciclo (dias)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 120" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="yield_per_hectare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produtividade (t/ha)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 7.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="planting_season_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início da Época de Plantio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Setembro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="planting_season_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim da Época de Plantio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Novembro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCropMutation.isPending}>
                  {updateCropMutation.isPending && (
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