import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ProductStock } from "@/lib/types";
import { graphqlRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Componentes UI
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Esquema de validação para insumo
const insumoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  categoria: z.string().min(2, "Categoria deve ter pelo menos 2 caracteres"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  quantidade: z.coerce.number().min(0, "Quantidade deve ser um valor positivo").default(0),
  propriedade_id: z.string().uuid().optional(),
});

type InsumoFormValues = z.infer<typeof insumoSchema>;

export default function InsumosPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentInsumo, setCurrentInsumo] = useState<ProductStock | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  // Query para buscar insumos
  const { data: insumosData, isLoading } = useQuery<{ produtos_estoque: ProductStock[] }>({
    queryKey: ["produtos_estoque", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { produtos_estoque: [] };
      return await graphqlRequest("GET_PRODUTOS_ESTOQUE", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });
  
  const insumos = insumosData?.produtos_estoque || [];

  // Mutation para adicionar insumo
  const addInsumoMutation = useMutation({
    mutationFn: async (data: InsumoFormValues) => {
      const insumoData = {
        ...data,
        propriedade_id: user?.propriedade_id
      };
      return await graphqlRequest("INSERT_PRODUTO_ESTOQUE", { produto: insumoData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos_estoque"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Insumo adicionado",
        description: "O insumo foi adicionado com sucesso.",
      });
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar insumo: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar insumo
  const updateInsumoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsumoFormValues }) => {
      // Mantemos a quantidade atual ao atualizar outros campos
      return await graphqlRequest("UPDATE_PRODUTO_ESTOQUE", { id, produto: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos_estoque"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Insumo atualizado",
        description: "O insumo foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar insumo: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir insumo
  const deleteInsumoMutation = useMutation({
    mutationFn: async (id: string) => {
      await graphqlRequest("DELETE_PRODUTO_ESTOQUE", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos_estoque"] });
      toast({
        title: "Insumo excluído",
        description: "O insumo foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir insumo: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Lista de categorias comuns para insumos agrícolas
  const categorias = [
    "Fertilizante",
    "Defensivo",
    "Semente",
    "Adubo",
    "Herbicida",
    "Fungicida",
    "Inseticida",
    "Ferramenta",
    "Equipamento",
    "Outro"
  ];

  // Lista de unidades comuns
  const unidades = [
    "kg", "g", "L", "mL", "unid.", "ton", "m²", "m³", "ha", "saco"
  ];

  // Form para adicionar insumo
  const addForm = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      nome: "",
      categoria: "",
      unidade: "",
      quantidade: 0,
      propriedade_id: user?.propriedade_id!,
    },
  });

  // Form para editar insumo
  const editForm = useForm<InsumoFormValues>({
    resolver: zodResolver(insumoSchema),
    defaultValues: {
      nome: "",
      categoria: "",
      unidade: "",
      propriedade_id: user?.propriedade_id!,
    },
  });

  // Função para abrir o dialog de edição
  const handleEdit = (insumo: ProductStock) => {
    setCurrentInsumo(insumo);
    editForm.reset({
      nome: insumo.nome,
      categoria: insumo.categoria || "",
      unidade: insumo.unidade || "",
      propriedade_id: insumo.propriedade_id,
    });
    setIsEditDialogOpen(true);
  };

  // Função para confirmar exclusão
  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este insumo?")) {
      deleteInsumoMutation.mutate(id);
    }
  };

  // Função para envio do formulário de adição
  const onAddSubmit = (data: InsumoFormValues) => {
    addInsumoMutation.mutate(data);
  };

  // Função para envio do formulário de edição
  const onEditSubmit = (data: InsumoFormValues) => {
    if (currentInsumo) {
      updateInsumoMutation.mutate({ id: currentInsumo.id, data });
    }
  };

  // Filtrar insumos com base no termo de busca e categoria selecionada
  const filteredInsumos = insumos?.filter((insumo) => {
    const matchesSearch =
      insumo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (insumo.categoria && insumo.categoria.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === "todos") {
      return matchesSearch;
    } else if (activeTab === "baixo_estoque") {
      return matchesSearch && (insumo.quantidade || 0) < 10; // Exemplo de limite para baixo estoque
    } else {
      return matchesSearch && insumo.categoria === activeTab;
    }
  });

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

  // Agrupar insumos por categoria para as abas
  const categoriasDisponiveis = ["todos", "baixo_estoque", ...new Set(insumos.map(i => i.categoria).filter(Boolean))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gestão de Insumos</h1>
          <p className="text-slate-500">
            Cadastre e gerencie os insumos utilizados na propriedade
          </p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Insumo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Insumos Cadastrados</CardTitle>
              <CardDescription>
                Lista de insumos disponíveis no sistema
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar insumos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="baixo_estoque">Baixo Estoque</TabsTrigger>
              {categoriasDisponiveis
                .filter(cat => cat !== "todos" && cat !== "baixo_estoque")
                .map(categoria => (
                  <TabsTrigger key={categoria || 'sem-categoria'} value={categoria || 'sem-categoria'}>
                    {categoria}
                  </TabsTrigger>
                ))
              }
            </TabsList>
          </Tabs>

          {filteredInsumos && filteredInsumos.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInsumos.map((insumo) => (
                    <TableRow key={insumo.id}>
                      <TableCell className="font-medium">{insumo.nome}</TableCell>
                      <TableCell>{insumo.categoria}</TableCell>
                      <TableCell>{insumo.unidade}</TableCell>
                      <TableCell>
                        {insumo.quantidade || 0} {insumo.unidade}
                        {(insumo.quantidade || 0) < 10 && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Baixo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(insumo)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(insumo.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              {searchTerm ? (
                <p>Nenhum insumo encontrado para a busca "{searchTerm}"</p>
              ) : (
                <p>Nenhum insumo cadastrado. Clique em "Novo Insumo" para adicionar.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de adição de insumo */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Insumo</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo insumo a ser cadastrado.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Adubo NPK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Fertilizante" 
                        {...field} 
                        list="categorias-list"
                      />
                    </FormControl>
                    <datalist id="categorias-list">
                      {categorias.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: kg" 
                        {...field} 
                        list="unidades-list"
                      />
                    </FormControl>
                    <datalist id="unidades-list">
                      {unidades.map(un => (
                        <option key={un} value={un} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Inicial</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Quantidade inicial em estoque
                    </FormDescription>
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
                <Button type="submit" disabled={addInsumoMutation.isPending}>
                  {addInsumoMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Insumo
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição de insumo */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Insumo</DialogTitle>
            <DialogDescription>
              Atualize os dados do insumo selecionado.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Adubo NPK" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Fertilizante" 
                        {...field} 
                        list="categorias-list-edit"
                      />
                    </FormControl>
                    <datalist id="categorias-list-edit">
                      {categorias.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: kg" 
                        {...field} 
                        list="unidades-list-edit"
                      />
                    </FormControl>
                    <datalist id="unidades-list-edit">
                      {unidades.map(un => (
                        <option key={un} value={un} />
                      ))}
                    </datalist>
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
                <Button type="submit" disabled={updateInsumoMutation.isPending}>
                  {updateInsumoMutation.isPending && (
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
