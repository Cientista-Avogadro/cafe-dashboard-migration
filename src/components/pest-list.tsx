import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { graphqlRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  Search, 
  Loader2, 
  Pencil, 
  SprayCan 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Pest, PragaProduto, Produto } from "@/lib/types";

const pestSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  tipo_praga: z.string().min(1, "Tipo de praga é obrigatório"),
  metodo_controle: z.string().min(1, "Método de controle é obrigatório"),
  resultado: z.string().min(1, "Resultado é obrigatório"),
});

interface PestListProps {
  areaId: string;
  areaType: "lote" | "canteiro";
  areaName: string;
}

export function PestList({ areaId, areaType, areaName }: PestListProps) {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pestToEdit, setPestToEdit] = useState<Pest | null>(null);
  const [openTreatmentModal, setOpenTreatmentModal] = useState(false);
  const [selectedPest, setSelectedPest] = useState<Pest | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [usedProducts, setUsedProducts] = useState<PragaProduto[]>([]);
  const [currentProduct, setCurrentProduct] = useState({
    produto_id: "",
    quantidade_utilizada: 0,
    data_aplicacao: new Date().toISOString().split('T')[0],
    observacoes: ""
  });

  // Common pest types
  const pestTypes = [
    "Pulgão",
    "Lagarta",
    "Ácaro",
    "Mosca-branca",
    "Tripes",
    "Cochonilha",
    "Outros"
  ];

  // Common control methods
  const controlMethods = [
    "Controle Químico",
    "Controle Biológico",
    "Controle Cultural",
    "Controle Mecânico",
    "Controle Integrado"
  ];

  // Common results
  const results = [
    "Resolvida",
    "Parcial",
    "Em andamento",
    "Não resolvida"
  ];

  // Fetch products
  const { data: produtosData } = useQuery({
    queryKey: ["produtos_estoque", user?.propriedade_id],
    queryFn: () => graphqlRequest("GET_PRODUTOS_ESTOQUE", {
      propriedade_id: user?.propriedade_id
    }),
    enabled: !!user?.propriedade_id
  });

  // Fetch pest occurrences
  const { data: pestData, isLoading } = useQuery({
    queryKey: ["pragas", areaType, areaId],
    queryFn: () => graphqlRequest(
      areaType === "lote" ? "GET_PRAGAS_BY_LOTE" : "GET_PRAGAS_BY_CANTEIRO",
      {
        [areaType === "lote" ? "lote_id" : "canteiro_id"]: areaId,
        propriedade_id: user?.propriedade_id
      }
    ),
    enabled: !!areaId && !!user?.propriedade_id
  });

  // Fetch treatments for selected pest
  const { data: tratamentosData } = useQuery({
    queryKey: ["tratamentos", selectedPest?.id],
    queryFn: () => graphqlRequest("GET_TRATAMENTOS", {
      praga_id: selectedPest?.id
    }),
    enabled: !!selectedPest?.id
  });

  // Add pest mutation
  const addPestMutation = useMutation({
    mutationFn: (data: z.infer<typeof pestSchema>) => {
      if (pestToEdit) {
        return graphqlRequest("UPDATE_PRAGA", {
          id: pestToEdit.id,
          praga: data
        });
      }
      return graphqlRequest("INSERT_PRAGA", {
        praga: {
          ...data,
          [areaType === "lote" ? "lote_id" : "canteiro_id"]: areaId
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: pestToEdit 
          ? "Ocorrência atualizada com sucesso!"
          : "Ocorrência registrada com sucesso!",
      });
      setIsAddDialogOpen(false);
      setPestToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["pragas"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a ocorrência.",
        variant: "destructive",
      });
    }
  });

  // Update pest status mutation
  const updatePestStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      return graphqlRequest("UPDATE_PRAGA_STATUS", {
        id,
        status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pragas"] });
    }
  });

  // Form for adding pest occurrences
  const addForm = useForm<z.infer<typeof pestSchema>>({
    resolver: zodResolver(pestSchema),
    defaultValues: {
      data: new Date().toISOString().split('T')[0],
      tipo_praga: "",
      metodo_controle: "",
      resultado: ""
    }
  });

  // Update form when editing
  useEffect(() => {
    if (pestToEdit) {
      addForm.reset({
        data: pestToEdit.data.split('T')[0],
        tipo_praga: pestToEdit.tipo_praga,
        metodo_controle: pestToEdit.metodo_controle,
        resultado: pestToEdit.resultado
      });
    } else {
      addForm.reset({
        data: new Date().toISOString().split('T')[0],
        tipo_praga: "",
        metodo_controle: "",
        resultado: ""
      });
    }
  }, [pestToEdit, addForm]);

  // Filter based on search term and status
  const filteredPests = pestData?.pragas?.filter((pest: Pest) => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      pest.tipo_praga.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pest.metodo_controle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pest.resultado.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "resolvido" && pest.resultado === "Resolvida") ||
      (statusFilter === "parcial" && pest.resultado === "Parcial") ||
      (statusFilter === "pendente" && pest.resultado === "Em andamento") ||
      (statusFilter === "falha" && pest.resultado === "Não resolvida");
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const statistics = {
    totalOccurrences: filteredPests?.length || 0,
    resolved: filteredPests?.filter((p: Pest) => p.resultado === "Resolvida").length || 0,
    partial: filteredPests?.filter((p: Pest) => p.resultado === "Parcial").length || 0,
    ongoing: filteredPests?.filter((p: Pest) => p.resultado === "Em andamento").length || 0,
    failed: filteredPests?.filter((p: Pest) => p.resultado === "Não resolvida").length || 0,
  };

  // Function to open treatment modal
  const openTreatment = (pest: Pest) => {
    setSelectedPest(pest);
    setOpenTreatmentModal(true);
  };

  // Function to add a product
  const addProduct = () => {
    if (currentProduct.produto_id && currentProduct.quantidade_utilizada > 0) {
      // Get product stock information
      const selectedProduct = produtosData?.produtos_estoque.find(
        (p: Produto) => p.id === currentProduct.produto_id
      );

      if (!selectedProduct) {
        toast({
          title: "Erro",
          description: "Produto não encontrado no estoque.",
          variant: "destructive",
        });
        return;
      }

      // Check if there's enough stock
      const existingProductIndex = usedProducts.findIndex(
        product => product.produto_id === currentProduct.produto_id
      );

      let totalQuantityUsed = currentProduct.quantidade_utilizada;
      
      // If updating existing product, subtract its current quantity from total
      if (existingProductIndex !== -1) {
        totalQuantityUsed = currentProduct.quantidade_utilizada;
      } else {
        // If adding new product, add to existing quantities
        const otherProductsQuantity = usedProducts
          .filter(p => p.produto_id === currentProduct.produto_id)
          .reduce((sum, p) => sum + p.quantidade_utilizada, 0);
        totalQuantityUsed += otherProductsQuantity;
      }

      if (totalQuantityUsed > selectedProduct.quantidade) {
        toast({
          title: "Estoque insuficiente",
          description: `Quantidade disponível: ${selectedProduct.quantidade} ${selectedProduct.unidade_medida}. Quantidade solicitada: ${totalQuantityUsed} ${selectedProduct.unidade_medida}`,
          variant: "destructive",
        });
        return;
      }

      if (existingProductIndex !== -1) {
        // Update existing product
        const updatedProducts = [...usedProducts];
        updatedProducts[existingProductIndex] = {
          ...currentProduct,
          id: usedProducts[existingProductIndex].id
        };
        setUsedProducts(updatedProducts);
        
        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado no tratamento.",
        });
      } else {
        // Add new product
        setUsedProducts([...usedProducts, {...currentProduct}]);
        toast({
          title: "Produto adicionado",
          description: "Produto adicionado ao tratamento com sucesso.",
        });
      }

      // Reset form
      setCurrentProduct({
        produto_id: "",
        quantidade_utilizada: 0,
        data_aplicacao: new Date().toISOString().split('T')[0],
        observacoes: ""
      });
    }
  };

  // Function to remove a product
  const removeProduct = (index: number) => {
    const updatedProducts = [...usedProducts];
    updatedProducts.splice(index, 1);
    setUsedProducts(updatedProducts);
  };

  const editPest = (pest: Pest) => {
    setPestToEdit(pest);
    setIsAddDialogOpen(true);
  };

  const saveTreatment = async () => {
    if (!selectedPest) return;

    try {
      setIsSaving(true);
      
      // Update pest status to 'andamento'
      await updatePestStatusMutation.mutateAsync({
        id: selectedPest.id,
        status: "Em andamento"
      });

      // Save each product used in the treatment
      for (const product of usedProducts) {
        // Get product info
        const produtoInfo = produtosData?.produtos_estoque.find((p: Produto) => p.id === product.produto_id);
        if (!produtoInfo) continue;

        // Save the product usage
        await graphqlRequest("INSERT_PRAGA_PRODUTO", {
          praga_produto: {
            praga_id: selectedPest.id,
            produto_id: product.produto_id,
            quantidade_utilizada: product.quantidade_utilizada,
            data_aplicacao: product.data_aplicacao,
            observacoes: product.observacoes
          }
        });

        // Update stock quantity
        const novaQuantidade = Math.max(0, produtoInfo.quantidade - product.quantidade_utilizada);
        await graphqlRequest("UPDATE_PRODUTO_ESTOQUE", {
          id: product.produto_id,
          produto: { quantidade: novaQuantidade }
        });

        // Register stock movement
        await graphqlRequest("INSERT_MOVIMENTACAO_ESTOQUE", {
          movimentacao: {
            produto_id: product.produto_id,
            tipo: "saida",
            quantidade: product.quantidade_utilizada,
            data: product.data_aplicacao,
            descricao: `Uso no tratamento de praga: ${selectedPest.tipo_praga}`
          }
        });
      }
      
      toast({
        title: "Sucesso",
        description: "Tratamento registrado com sucesso!",
      });
      
      setOpenTreatmentModal(false);
      setUsedProducts([]);
      queryClient.invalidateQueries({ queryKey: ["tratamentos"] });
      queryClient.invalidateQueries({ queryKey: ["produtos_estoque"] });
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar o tratamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to finalize treatment
  const finalizeTreatment = async () => {
    if (!selectedPest || selectedPest.resultado === "Resolvida") return;

    try {
      setIsSaving(true);
      await updatePestStatusMutation.mutateAsync({
        id: selectedPest.id,
        status: "Resolvida"
      });
      toast({
        title: "Sucesso",
        description: "Tratamento finalizado com sucesso!",
      });
      setOpenTreatmentModal(false);
      queryClient.invalidateQueries({ queryKey: ["pragas"] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao finalizar tratamento.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update usedProducts when tratamentosData changes
  useEffect(() => {
    if (tratamentosData?.praga_produtos) {
      setUsedProducts(tratamentosData.praga_produtos);
    }
  }, [tratamentosData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Controle de Pragas</h2>
          <p className="text-muted-foreground">Monitore e registre ocorrências de pragas em {areaName}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Ocorrência
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ocorrências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalOccurrences}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Controles Efetivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.resolved}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Casos em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statistics.ongoing}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Ocorrências</CardTitle>
          <CardDescription>
            Histórico de todas as ocorrências de pragas e seus tratamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por tipo de praga ou método..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os resultados</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="falha">Falha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : filteredPests?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || statusFilter !== "all" 
                ? "Nenhum registro encontrado com os filtros aplicados"
                : "Nenhum registro de praga para esta área"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo de Praga</TableHead>
                    <TableHead>Método de Controle</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPests?.map((pest: Pest) => (
                    <TableRow key={pest.id}>
                      <TableCell>
                        {format(new Date(pest.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{pest.tipo_praga}</TableCell>
                      <TableCell>{pest.metodo_controle}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pest.resultado === "Resolvida"
                              ? "default"
                              : pest.resultado === "Parcial"
                              ? "secondary"
                              : pest.resultado === "Em andamento"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {pest.resultado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => openTreatment(pest)}
                                >
                                  <SprayCan className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tratar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="outline"
                                  onClick={() => editPest(pest)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Editar</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Pest Occurrence Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{pestToEdit ? "Editar Ocorrência de Praga" : "Registrar Ocorrência de Praga"}</DialogTitle>
            <DialogDescription>
              {pestToEdit ? "Atualize os detalhes da ocorrência de praga" : "Registre uma nova ocorrência de praga e seu método de controle"}
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => addPestMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addForm.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Ocorrência</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="tipo_praga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Praga</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de praga" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pestTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="metodo_controle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Controle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método de controle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {controlMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
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
                name="resultado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o resultado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {results.map((result) => (
                          <SelectItem key={result} value={result}>
                            {result}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={addPestMutation.isPending}>
                  {addPestMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {pestToEdit ? "Atualizar" : "Registrar"} Ocorrência
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Treatment Modal */}
      <Dialog open={openTreatmentModal} onOpenChange={setOpenTreatmentModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Registrar Tratamento</DialogTitle>
            <DialogDescription>
              {selectedPest && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium">Praga: {selectedPest.tipo_praga}</p>
                  <p className="text-sm text-muted-foreground">Método: {selectedPest.metodo_controle}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-6 overflow-y-auto pr-2">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Adicionar Produto ao Tratamento</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Produto</label>
                  <Select 
                    value={currentProduct.produto_id}
                    onValueChange={(value) => {
                      const selectedProduct = produtosData?.produtos_estoque.find((p: Produto) => p.id === value);
                      setCurrentProduct({
                        ...currentProduct, 
                        produto_id: value,
                        quantidade_utilizada: 0
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosData?.produtos_estoque.map((produto: Produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.nome} ({produto.quantidade} {produto.unidade_medida})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentProduct.produto_id && (
                    <p className="text-sm text-muted-foreground">
                      Estoque disponível: {
                        produtosData?.produtos_estoque.find((p: Produto) => p.id === currentProduct.produto_id)?.quantidade
                      } {
                        produtosData?.produtos_estoque.find((p: Produto) => p.id === currentProduct.produto_id)?.unidade_medida
                      }
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantidade</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="Quantidade utilizada"
                      value={currentProduct.quantidade_utilizada}
                      onChange={(e) => setCurrentProduct({...currentProduct, quantidade_utilizada: parseFloat(e.target.value)})}
                    />
                    {currentProduct.produto_id && (
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {produtosData?.produtos_estoque.find((p: Produto) => p.id === currentProduct.produto_id)?.unidade_medida}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Aplicação</label>
                  <Input 
                    type="date"
                    value={currentProduct.data_aplicacao}
                    onChange={(e) => setCurrentProduct({...currentProduct, data_aplicacao: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações</label>
                  <Input
                    placeholder="Observações sobre o tratamento"
                    value={currentProduct.observacoes}
                    onChange={(e) => setCurrentProduct({...currentProduct, observacoes: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={addProduct}
                  disabled={!currentProduct.produto_id || currentProduct.quantidade_utilizada <= 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              </div>
            </div>
            
            {usedProducts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Produtos Adicionados</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usedProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {produtosData?.produtos_estoque.find((p: Produto) => p.id === product.produto_id)?.nome}
                          </TableCell>
                          <TableCell>{product.quantidade_utilizada}</TableCell>
                          <TableCell>{format(new Date(product.data_aplicacao), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {product.observacoes || "-"}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeProduct(index)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Remover
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOpenTreatmentModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={saveTreatment} 
                disabled={isSaving || usedProducts.length === 0}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar Tratamento
              </Button>
              {selectedPest?.resultado !== "Resolvida" && (
                <Button 
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={finalizeTreatment}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Finalizar Tratamento
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 