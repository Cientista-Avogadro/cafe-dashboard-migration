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
  Loader2,
  Table as TableIcon,
  Grid,
  Package2,
  Leaf,
  Droplet,
  Download,
  Printer,
  FileText
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Esquema de validação para insumo
const insumoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  categoria: z.string().min(2, "Categoria deve ter pelo menos 2 caracteres"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  quantidade: z.coerce.number().min(0, "Quantidade deve ser um valor positivo").default(0),
  preco_unitario: z.coerce.number().min(0, "Preço unitário deve ser um valor positivo").optional(),
  dose_por_hectare: z.coerce.number().min(0, "Dose por hectare deve ser um valor positivo").optional(),
  propriedade_id: z.string().uuid().optional(),
});

type InsumoFormValues = z.infer<typeof insumoSchema>;

export default function InsumosPage() {
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentInsumo, setCurrentInsumo] = useState<ProductStock | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("todos");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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
      preco_unitario: insumo.preco_unitario || 0,
      dose_por_hectare: insumo.dose_por_hectare || 0,
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
      (insumo.categoria && insumo.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (insumo.unidade && insumo.unidade.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeCategory === "todos") {
      return matchesSearch;
    } else if (activeCategory === "baixo_estoque") {
      return matchesSearch && (insumo.quantidade || 0) < 10; // Exemplo de limite para baixo estoque
    } else {
      return matchesSearch && insumo.categoria === activeCategory;
    }
  });

  const handleExportCSV = () => {
    const headers = ["Nome", "Categoria", "Quantidade", "Unidade", "Preço Unitário", "Valor Total"];
    const rows = filteredInsumos.map(item => [
      item.nome,
      item.categoria || '',
      item.quantidade || 0,
      item.unidade || '',
      item.preco_unitario || 0,
      (item.quantidade || 0) * (item.preco_unitario || 0)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `insumos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const tableElement = document.querySelector('[data-table="insumos"]') as HTMLElement;
    if (!tableElement) return;
    
    const canvas = await html2canvas(tableElement);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save(`insumos_${new Date().toISOString().split('T')[0]}.pdf`);
  };

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

  // Agrupar insumos por categoria para o select
  const categoriasDisponiveis = ["todos", "baixo_estoque", ...new Set(insumos.map(i => i.categoria).filter(Boolean))].sort();
  
  // Função para obter ícone com base na categoria
  const getCategoryIcon = (categoria: string) => {
    const lowerCategoria = categoria.toLowerCase();
    if (lowerCategoria.includes('fertilizante') || lowerCategoria.includes('adubo')) {
      return <Leaf className="h-3 w-3 text-green-600" />;
    } else if (lowerCategoria.includes('defensivo') || lowerCategoria.includes('herbicida') || 
               lowerCategoria.includes('fungicida') || lowerCategoria.includes('inseticida')) {
      return <Droplet className="h-3 w-3 text-blue-600" />;
    } else if (lowerCategoria.includes('semente')) {
      return <Leaf className="h-3 w-3 text-amber-600" />;
    } else if (lowerCategoria.includes('ferramenta') || lowerCategoria.includes('equipamento')) {
      return <Package2 className="h-3 w-3 text-slate-600" />;
    } else {
      return <Package2 className="h-3 w-3 text-slate-600" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Insumos Agrícolas</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os insumos utilizados na propriedade</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Insumo
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="no-print">
            <FileText className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} className="no-print">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="no-print">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Insumos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insumos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(insumos.map(i => i.categoria).filter(Boolean)).size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Baixo Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{insumos.filter(i => (i.quantidade || 0) < 10).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sem Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{insumos.filter(i => !i.quantidade || i.quantidade === 0).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Inventário de Insumos</CardTitle>
              <CardDescription>
                Gerencie todos os insumos utilizados na sua propriedade
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewMode("table")} 
                className={viewMode === "table" ? "bg-slate-100" : ""}
              >
                <TableIcon className="mr-2 h-4 w-4" />
                Tabela
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setViewMode("cards")} 
                className={viewMode === "cards" ? "bg-slate-100" : ""}
              >
                <Grid className="mr-2 h-4 w-4" />
                Grelha
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome, categoria ou unidade..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="w-full max-w-xs">
                <Select value={activeCategory} onValueChange={setActiveCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as categorias</SelectItem>
                    <SelectItem value="baixo_estoque">Baixo Estoque</SelectItem>
                    {categoriasDisponiveis
                      .filter(cat => cat !== "todos" && cat !== "baixo_estoque")
                      .map(categoria => (
                        <SelectItem key={categoria || 'sem-categoria'} value={categoria || 'sem-categoria'}>
                          {categoria}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : filteredInsumos && filteredInsumos.length > 0 ? (
            viewMode === "table" ? (
              <div className="rounded-md border" data-table="insumos">
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
                        <TableCell>
                          {insumo.categoria ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-slate-100 flex items-center gap-1 w-fit">
                              {getCategoryIcon(insumo.categoria)}
                              {insumo.categoria}
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{insumo.unidade}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${(insumo.quantidade || 0) < 10 ? 'text-amber-600' : (insumo.quantidade || 0) === 0 ? 'text-red-600' : ''}`}>
                              {insumo.quantidade || 0} {insumo.unidade}
                            </span>
                            {(insumo.quantidade || 0) === 0 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Esgotado</span>
                            )}
                            {(insumo.quantidade || 0) > 0 && (insumo.quantidade || 0) < 10 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Baixo</span>
                            )}
                          </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredInsumos.map((insumo) => (
                  <Card key={insumo.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{insumo.nome}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(insumo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(insumo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {insumo.categoria && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-100 mt-1">
                          {getCategoryIcon(insumo.categoria)}
                          {insumo.categoria}
                        </span>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Unidade:</span>
                          <span>{insumo.unidade}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Quantidade:</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${(insumo.quantidade || 0) < 10 ? 'text-amber-600' : (insumo.quantidade || 0) === 0 ? 'text-red-600' : ''}`}>
                              {insumo.quantidade || 0} {insumo.unidade}
                            </span>
                            {(insumo.quantidade || 0) === 0 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Esgotado</span>
                            )}
                            {(insumo.quantidade || 0) > 0 && (insumo.quantidade || 0) < 10 && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Baixo</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 px-4 border rounded-md bg-slate-50">
              {searchTerm ? (
                <>
                  <p className="text-lg font-medium">Nenhum insumo encontrado</p>
                  <p className="text-muted-foreground mt-1">Não encontramos resultados para "{searchTerm}"</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setSearchTerm("")}
                  >
                    Limpar busca
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">Nenhum insumo cadastrado</p>
                  <p className="text-muted-foreground mt-1">Comece adicionando seu primeiro insumo</p>
                  <Button 
                    className="mt-4 bg-green-600 hover:bg-green-700" 
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Insumo
                  </Button>
                </>
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
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidades.map(un => (
                            <SelectItem key={un} value={un}>{un}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="preco_unitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Unitário (AOA)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Preço por unidade do insumo em Kwanzas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="dose_por_hectare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dose por Hectare</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Dose recomendada por hectare
                      </FormDescription>
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
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {unidades.map(un => (
                            <SelectItem key={un} value={un}>{un}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="preco_unitario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Unitário (AOA)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Preço por unidade do insumo em Kwanzas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="dose_por_hectare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dose por Hectare</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        Dose recomendada por hectare
                      </FormDescription>
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
