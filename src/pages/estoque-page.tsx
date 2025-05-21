import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StockMovement, ProductStock } from "@/lib/types";
import { graphqlRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

// Componentes UI
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
import { 
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Esquema de validação para movimentação de estoque
const movimentacaoSchema = z.object({
  produto_id: z.string().uuid(),
  tipo: z.enum(['entrada', 'saida']),
  quantidade: z.coerce.number().min(0.01, "Quantidade deve ser maior que zero"),
  data: z.string().min(1, "Data é obrigatória"),
  descricao: z.string().optional(),
});

type MovimentacaoFormValues = z.infer<typeof movimentacaoSchema>;

// Using the StockMovement type directly since it now includes the produto property

export default function EstoquePage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");
  const [periodoFiltro, setPeriodoFiltro] = useState<string>("todos");
  const [isMovimentacaoDialogOpen, setIsMovimentacaoDialogOpen] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'entrada' | 'saida'>('entrada');
  const [currentProduto, setCurrentProduto] = useState<ProductStock | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StockMovement | "produto.nome" | "produto.categoria";
    direction: "asc" | "desc";
  }>({ key: "data", direction: "desc" });

  // Query para buscar todas as movimentações de estoque
  const { data: movimentacoesData, isLoading: isLoadingMovimentacoes } = useQuery<{ movimentacoes_estoque: StockMovement[] }>({    
    queryKey: ["movimentacoes_estoque"],
    queryFn: async () => {
      return await graphqlRequest("GET_ALL_MOVIMENTACOES_ESTOQUE", {});
    },
  });

  // Query para buscar todos os produtos
  const { data: produtosData, isLoading: isLoadingProdutos } = useQuery<{ produtos_estoque: ProductStock[] }>({    
    queryKey: ["produtos_estoque", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { produtos_estoque: [] };
      return await graphqlRequest("GET_PRODUTOS_ESTOQUE", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Mutation para adicionar movimentação de estoque
  const addMovimentacaoMutation = useMutation({
    mutationFn: async (data: MovimentacaoFormValues) => {
      return await graphqlRequest("INSERT_MOVIMENTACAO_ESTOQUE", { movimentacao: data });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes_estoque"] });
      queryClient.invalidateQueries({ queryKey: ["produtos_estoque"] });
      
      // Atualizar a quantidade do produto no estoque
      if (currentProduto) {
        const novaQuantidade = variables.tipo === 'entrada'
          ? (currentProduto.quantidade || 0) + variables.quantidade
          : Math.max(0, (currentProduto.quantidade || 0) - variables.quantidade);
        
        updateProdutoMutation.mutate({
          id: currentProduto.id,
          data: { quantidade: novaQuantidade }
        });
      }
      
      setIsMovimentacaoDialogOpen(false);
      toast({
        title: `${variables.tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada`,
        description: `A ${variables.tipo === 'entrada' ? 'entrada' : 'saída'} foi registrada com sucesso.`,
      });
      movimentacaoForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao registrar movimentação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar produto (quantidade)
  const updateProdutoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductStock> }) => {
      return await graphqlRequest("UPDATE_PRODUTO_ESTOQUE", { id, produto: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos_estoque"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar produto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form para movimentação de estoque
  const movimentacaoForm = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: {
      produto_id: "",
      tipo: 'entrada',
      quantidade: 0,
      data: new Date().toISOString().split('T')[0],
      descricao: "",
    },
  });

  // Combinamos os dados de movimentações com os produtos
  const movimentacoes: StockMovement[] = movimentacoesData?.movimentacoes_estoque && produtosData?.produtos_estoque
    ? movimentacoesData.movimentacoes_estoque.map(movimentacao => {
        const produto = produtosData.produtos_estoque.find(p => p.id === movimentacao.produto_id);
        return {
          ...movimentacao,
          produto: produto ? {
            id: produto.id,
            nome: produto.nome,
            categoria: produto.categoria,
            unidade: produto.unidade,
            propriedade_id: produto.propriedade_id
          } : undefined
        };
      }).filter(movimentacao => 
        // Filtramos apenas movimentações de produtos da propriedade do usuário
        movimentacao.produto && movimentacao.produto.propriedade_id === user?.propriedade_id
      )
    : [];

  // Indicador de carregamento combinado
  const isLoading = isLoadingMovimentacoes || isLoadingProdutos;

  // Função para filtrar movimentações
  const filteredMovimentacoes = movimentacoes.filter((movimentacao) => {
    // Garantimos que o produto existe
    if (!movimentacao.produto) return false;
    
    // Filtro de busca
    const matchesSearch = 
      movimentacao.produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movimentacao.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    // Filtro de tipo (entrada/saída)
    const matchesTipo = tipoFiltro === "todos" || movimentacao.tipo === tipoFiltro;
    
    // Filtro de categoria
    const matchesCategoria = 
      categoriaFiltro === "todas" || 
      movimentacao.produto.categoria === categoriaFiltro;
    
    // Filtro de período
    let matchesPeriodo = true;
    const dataMovimentacao = new Date(movimentacao.data);
    const hoje = new Date();
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(hoje.getDate() - 7);
    const umMesAtras = new Date();
    umMesAtras.setMonth(hoje.getMonth() - 1);
    
    if (periodoFiltro === "ultima_semana") {
      matchesPeriodo = dataMovimentacao >= umaSemanaAtras;
    } else if (periodoFiltro === "ultimo_mes") {
      matchesPeriodo = dataMovimentacao >= umMesAtras;
    }
    
    return matchesSearch && matchesTipo && matchesCategoria && matchesPeriodo;
  });

  // Função para ordenar movimentações
  const sortedMovimentacoes = [...filteredMovimentacoes].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    // Tratamento especial para campos aninhados
    if (sortConfig.key === "produto.nome") {
      aValue = a.produto?.nome || "";
      bValue = b.produto?.nome || "";
    } else if (sortConfig.key === "produto.categoria") {
      aValue = a.produto?.categoria || "";
      bValue = b.produto?.categoria || "";
    } else {
      aValue = a[sortConfig.key as keyof StockMovement];
      bValue = b[sortConfig.key as keyof StockMovement];
    }
    
    // Ordenação para datas
    if (sortConfig.key === "data") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    // Ordenação para números
    if (sortConfig.key === "quantidade") {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    
    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Função para alternar a ordenação
  const handleSort = (key: keyof StockMovement | "produto.nome" | "produto.categoria") => {
    setSortConfig({
      key,
      direction: 
        sortConfig.key === key && sortConfig.direction === "asc" 
          ? "desc" 
          : "asc",
    });
  };

  // Função para renderizar o ícone de ordenação
  const renderSortIcon = (key: keyof StockMovement | "produto.nome" | "produto.categoria") => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  // Função para obter categorias únicas
  const getCategorias = () => {
    const categorias = new Set<string>();
    movimentacoes.forEach((movimentacao) => {
      if (movimentacao.produto?.categoria) {
        categorias.add(movimentacao.produto.categoria);
      }
    });
    return Array.from(categorias);
  };

  // Função para abrir o diálogo de movimentação
  const handleNovaMovimentacao = (tipo: 'entrada' | 'saida') => {
    setTipoMovimentacao(tipo);
    setCurrentProduto(null);
    movimentacaoForm.reset({
      produto_id: "",
      tipo: tipo,
      quantidade: 0,
      data: new Date().toISOString().split('T')[0],
      descricao: "",
    });
    setIsMovimentacaoDialogOpen(true);
  };

  // Função para envio do formulário de movimentação
  const onMovimentacaoSubmit = (data: MovimentacaoFormValues) => {
    addMovimentacaoMutation.mutate(data);
  };

  // Estatísticas de movimentações
  const estatisticas = {
    total: filteredMovimentacoes.length,
    entradas: filteredMovimentacoes.filter(m => m.tipo === "entrada").length,
    saidas: filteredMovimentacoes.filter(m => m.tipo === "saida").length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Histórico de Estoque</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleNovaMovimentacao('entrada')} 
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar Entrada
          </Button>
          <Button 
            onClick={() => handleNovaMovimentacao('saida')} 
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Registrar Saída
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.entradas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{estatisticas.saidas}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por produto ou descrição..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas categorias</SelectItem>
              {getCategorias().map((categoria) => (
                <SelectItem key={categoria} value={categoria}>
                  {categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todo período</SelectItem>
              <SelectItem value="ultima_semana">Última semana</SelectItem>
              <SelectItem value="ultimo_mes">Último mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações de Estoque</CardTitle>
          <CardDescription>
            Histórico de todas as entradas e saídas de produtos do estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : sortedMovimentacoes.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || tipoFiltro !== "todos" || categoriaFiltro !== "todas" || periodoFiltro !== "todos" ? (
                <p>Nenhuma movimentação encontrada com os filtros aplicados</p>
              ) : (
                <p>Nenhuma movimentação de estoque registrada</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("data")}
                    >
                      Data {renderSortIcon("data")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("produto.nome")}
                    >
                      Produto {renderSortIcon("produto.nome")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("produto.categoria")}
                    >
                      Categoria {renderSortIcon("produto.categoria")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("tipo")}
                    >
                      Tipo {renderSortIcon("tipo")}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer text-right"
                      onClick={() => handleSort("quantidade")}
                    >
                      Quantidade {renderSortIcon("quantidade")}
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMovimentacoes.map((movimentacao) => (
                    <TableRow key={movimentacao.id}>
                      <TableCell>
                        {format(new Date(movimentacao.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {movimentacao.produto?.nome}
                      </TableCell>
                      <TableCell>
                        {movimentacao.produto?.categoria || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={movimentacao.tipo === "entrada" ? "outline" : "secondary"}
                          className={
                            movimentacao.tipo === "entrada" 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {movimentacao.tipo === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {movimentacao.quantidade} {movimentacao.produto?.unidade || ""}
                      </TableCell>
                      <TableCell>
                        {movimentacao.descricao || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de movimentação de estoque */}
      <Dialog open={isMovimentacaoDialogOpen} onOpenChange={setIsMovimentacaoDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {tipoMovimentacao === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
            </DialogTitle>
            <DialogDescription>
              {tipoMovimentacao === 'entrada'
                ? 'Registre a entrada de produtos no estoque.'
                : 'Registre a saída de produtos do estoque.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...movimentacaoForm}>
            <form onSubmit={movimentacaoForm.handleSubmit(onMovimentacaoSubmit)} className="space-y-4">
              <FormField
                control={movimentacaoForm.control}
                name="produto_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produto*</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value);
                        const produto = produtosData?.produtos_estoque.find(p => p.id === value);
                        setCurrentProduto(produto || null);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {produtosData?.produtos_estoque
                          .filter(p => p.propriedade_id === user?.propriedade_id)
                          .map((produto) => (
                            <SelectItem key={produto.id} value={produto.id}>
                              {produto.nome} ({produto.quantidade || 0} {produto.unidade})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {currentProduto && (
                <div className="p-4 bg-slate-50 rounded-md">
                  <p className="font-medium">{currentProduto.nome}</p>
                  <p className="text-sm text-slate-500">
                    Estoque atual: {currentProduto.quantidade || 0} {currentProduto.unidade}
                  </p>
                </div>
              )}
              
              <FormField
                control={movimentacaoForm.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0.01" placeholder="Ex: 10" {...field} />
                    </FormControl>
                    {tipoMovimentacao === 'saida' && currentProduto && (
                      <FormDescription>
                        Quantidade disponível: {currentProduto.quantidade || 0} {currentProduto.unidade}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={movimentacaoForm.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={movimentacaoForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder={tipoMovimentacao === 'entrada' ? "Ex: Compra de fornecedor X" : "Ex: Uso na plantação"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMovimentacaoDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={addMovimentacaoMutation.isPending}
                  className={tipoMovimentacao === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
                >
                  {addMovimentacaoMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {tipoMovimentacao === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}