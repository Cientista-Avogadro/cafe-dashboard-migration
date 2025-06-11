import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Crop } from "@/lib/types";
import { graphqlRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
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
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  variedade: z.string().optional(),
  ciclo_estimado_dias: z.coerce.number().min(1, "Deve ser pelo menos 1").optional(),
  produtividade: z.coerce.number().min(0, "Deve ser um valor positivo").optional(),
  inicio_epoca_plantio: z.string().optional(),
  fim_epoca_plantio: z.string().optional(),
  propriedade_id: z.string().uuid().optional(),
});

type CropFormValues = z.infer<typeof cropSchema>;

export default function CropsPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCrop, setCurrentCrop] = useState<Crop | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Query para buscar culturas
  const { data: culturas, isLoading } = useQuery<{ culturas: Crop[] }>({
    queryKey: ["culturas", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { culturas: [] };
      return await graphqlRequest("GET_CULTURAS", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });
  
  const crops = culturas?.culturas || [];

  // Mutation para adicionar cultura
  const addCropMutation = useMutation({
    mutationFn: async (data: CropFormValues) => {
      const culturaData = {
        ...data,
        propriedade_id: user?.propriedade_id
      };
      return await graphqlRequest("INSERT_CULTURA", { cultura: culturaData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["culturas"] });
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
    mutationFn: async ({ id, data }: { id: string; data: CropFormValues }) => {
      return await graphqlRequest("UPDATE_CULTURA", { id, cultura: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["culturas"] });
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
    mutationFn: async (id: string) => {
      await graphqlRequest("DELETE_CULTURA", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["culturas"] });
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

  // Lista de meses para os selects
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Form para adicionar cultura
  const addForm = useForm<CropFormValues>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      nome: "",
      variedade: "",
      ciclo_estimado_dias: undefined,
      produtividade: undefined,
      inicio_epoca_plantio: "",
      fim_epoca_plantio: "",
      propriedade_id: user?.propriedade_id!,
    },
  });

  // Form para editar cultura
  const editForm = useForm<CropFormValues>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      nome: "",
      variedade: "",
      ciclo_estimado_dias: undefined,
      produtividade: undefined,
      inicio_epoca_plantio: "",
      fim_epoca_plantio: "",
      propriedade_id: user?.propriedade_id!,
    },
  });

  // Função para abrir o dialog de edição
  const handleEdit = (crop: Crop) => {
    setCurrentCrop(crop);
    console.log(crop)
    editForm.reset({
      nome: crop.nome,
      variedade: crop.variedade || "",
      ciclo_estimado_dias: crop.ciclo_estimado_dias || 0,
      produtividade: crop.produtividade ? Number(crop.produtividade) : 0,
      inicio_epoca_plantio: crop.inicio_epoca_plantio || "",
      fim_epoca_plantio: crop.fim_epoca_plantio || "",
    });
    setIsEditDialogOpen(true);
  };

  // Função para confirmar exclusão
  const handleDelete = (id: string) => {
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
    }+3
  };

  // Filtrar culturas com base no termo de busca
  const filteredCrops = crops?.filter((crop) =>
    crop.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (crop.variedade && crop.variedade.toLowerCase().includes(searchTerm.toLowerCase()))
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
                    <TableCell className="font-medium">{crop.nome}</TableCell>
                    <TableCell>{crop.variedade || "-"}</TableCell>
                    <TableCell>{crop.ciclo_estimado_dias || "-"}</TableCell>
                    <TableCell>{crop.produtividade ? `${Number(crop.produtividade).toFixed(2)}` : "-"}</TableCell>
                    <TableCell>
                      {crop.inicio_epoca_plantio && crop.fim_epoca_plantio
                        ? `${crop.inicio_epoca_plantio} a ${crop.fim_epoca_plantio}`
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
                          onClick={() => handleDelete(String(crop.id))}
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
                name="nome"
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
                name="variedade"
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
                  name="ciclo_estimado_dias"
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
                  name="produtividade"
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
                  name="inicio_epoca_plantio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início Época de Plantio</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Selecione um mês</option>
                          {meses.map((mes) => (
                            <option key={mes} value={mes}>{mes}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="fim_epoca_plantio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim Época de Plantio</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Selecione um mês</option>
                          {meses.map((mes) => (
                            <option key={mes} value={mes}>{mes}</option>
                          ))}
                        </select>
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
                name="nome"
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
                name="variedade"
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
                  name="ciclo_estimado_dias"
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
                  name="produtividade"
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
                  name="inicio_epoca_plantio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início Época de Plantio</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Selecione um mês</option>
                          {meses.map((mes) => (
                            <option key={mes} value={mes}>{mes}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="fim_epoca_plantio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim Época de Plantio</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Selecione um mês</option>
                          {meses.map((mes) => (
                            <option key={mes} value={mes}>{mes}</option>
                          ))}
                        </select>
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