import { useRef, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer, CircleDollarSign, Bookmark } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Tipo para o produto de estoque
interface ProdutoEstoque {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  preco_unitario?: number;
  dose_por_hectare?: number;
}

// Tipo para o insumo do planejamento
interface InsumosPlanejamento {
  id: string;
  produto_id: string;
  planejamento_id: string;
  quantidade: number;
  unidade?: string;
  data_uso?: string;
  observacoes?: string;
}

// Tipo para cultura
// Note: This type is now handled directly in the query response with appropriate fallbacks
// interface Cultura {
//   id: string;
//   nome: string;
//   variedade?: string;
//   ciclo_estimado_dias?: number;
//   produtividade?: number;
// }

// Tipo para área (lote, canteiro ou setor)
interface Area {
  id: string;
  nome: string;
  area?: number;
}

// Tipo para os dados do resultado da consulta GraphQL
interface PlanejamentoDetalhesResult {
  planejamento: {
    id: string;
    cultura_id?: string;
    lote_id?: string;
    canteiro_id?: string;
    setor_id?: string;
    data_inicio?: string;
    data_fim_prevista?: string;
    status?: string;
    propriedade_id?: string;
  } | null;
  insumos: InsumosPlanejamento[];
  produtos: ProdutoEstoque[];
}

// Tipo para categorização de insumos
interface InsumoCategoria {
  categoria: string;
  insumos: Array<InsumosPlanejamento & {
    custo_total: number;
    custo_por_hectare: number;
    produto?: ProdutoEstoque;
  }>;
  total: number;
}

export default function PlanningDetailsPage() {
  // Referência para impressão
  const componentRef = useRef<HTMLDivElement>(null);
  
  // Parâmetros da rota e navegação
  const [, params] = useRoute<{ id: string }>("/producao/:id");
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Buscar detalhes do planejamento
  const { data: planejamentoData, isLoading } = useQuery<PlanejamentoDetalhesResult>({  
    queryKey: ["planejamento", id],
    queryFn: async () => {
      if (!id) return { planejamento: null, insumos: [], produtos: [] };
      try {
        console.log('Fetching planejamento with ID:', id);
        // @ts-ignore - Ignoring type errors for GraphQL operations
        const response = await graphqlRequest('GET_PLANEJAMENTO_BY_ID', { id });
        console.log('Planejamento response:', response);
        return response;
      } catch (error) {
        console.error('Error fetching planejamento:', error);
        return { planejamento: null, insumos: [], produtos: [] };
      }
    },
    enabled: !!id && !!user?.propriedade_id,
    staleTime: 60000,
    gcTime: 300000
  });

  // Função para voltar à página anterior
  const handleBack = () => {
    setLocation('/planejamentos');
  };
  
  // Função para imprimir a página
  const handlePrint = () => {
    if (componentRef.current) {
      window.print();
    }
  };

  // Buscar detalhes da cultura do planejamento
  const { data: culturaData } = useQuery<{ cultura: any }>({  
    queryKey: ["cultura", planejamentoData?.planejamento?.cultura_id],
    queryFn: async () => {
      if (!planejamentoData?.planejamento?.cultura_id) return { cultura: null };
      try {
        console.log('Fetching cultura with ID:', planejamentoData.planejamento.cultura_id);
        // @ts-ignore - Ignoring type errors for GraphQL operations
        const response = await graphqlRequest('GET_CULTURA_DETAILS', { id: planejamentoData.planejamento.cultura_id });
        console.log('Cultura response:', response);
        return { cultura: response.cultura };
      } catch (error) {
        console.error('Error fetching cultura:', error);
        return { cultura: { 
          id: planejamentoData.planejamento.cultura_id, 
          nome: 'Cultura não encontrada', 
          ciclo_estimado_dias: 0,
          produtividade: 0
        }};
      }
    },
    enabled: !!planejamentoData?.planejamento?.cultura_id,
    staleTime: 60000,
    gcTime: 300000
  });

  // Buscar detalhes do lote
  const { data: loteData } = useQuery<{ lote: Area }>({  
    queryKey: ["lote", planejamentoData?.planejamento?.lote_id],
    queryFn: async () => {
      if (!planejamentoData?.planejamento?.lote_id) return { lote: null };
      try {
        // For debugging - log the query and variables
        console.log('Fetching lote with ID:', planejamentoData.planejamento.lote_id);
        // @ts-ignore - Ignoring type errors for GraphQL operations
        const response = await graphqlRequest('GET_LOTE_DETAILS', { id: planejamentoData.planejamento.lote_id });
        console.log('Lote response:', response);
        return { lote: response.lote };
      } catch (error) {
        console.error('Error fetching lote:', error);
        // Return empty data on error to prevent UI crashes
        return { lote: { id: planejamentoData.planejamento.lote_id, nome: 'Lote não encontrado', area: 0 } };
      }
    },
    enabled: !!planejamentoData?.planejamento?.lote_id,
    staleTime: 60000, // Cache data for 1 minute
    gcTime: 300000 // Keep in cache for 5 minutes
  });

  // Buscar detalhes do canteiro
  const { data: canteiroData } = useQuery<{ canteiro: Area }>({  
    queryKey: ["canteiro", planejamentoData?.planejamento?.canteiro_id],
    queryFn: async () => {
      if (!planejamentoData?.planejamento?.canteiro_id) return { canteiro: null };
      try {
        console.log('Fetching canteiro with ID:', planejamentoData.planejamento.canteiro_id);
        // @ts-ignore - Ignoring type errors for GraphQL operations
        const response = await graphqlRequest('GET_CANTEIRO_DETAILS', { id: planejamentoData.planejamento.canteiro_id });
        console.log('Canteiro response:', response);
        return { canteiro: response.canteiro };
      } catch (error) {
        console.error('Error fetching canteiro:', error);
        return { canteiro: { id: planejamentoData.planejamento.canteiro_id, nome: 'Canteiro não encontrado', area: 0 } };
      }
    },
    enabled: !!planejamentoData?.planejamento?.canteiro_id,
    staleTime: 60000,
    gcTime: 300000
  });

  // Buscar detalhes do setor
  const { data: setorData } = useQuery<{ setor: Area }>({  
    queryKey: ["setor", planejamentoData?.planejamento?.setor_id],
    queryFn: async () => {
      if (!planejamentoData?.planejamento?.setor_id) return { setor: null };
      try {
        console.log('Fetching setor with ID:', planejamentoData.planejamento.setor_id);
        // @ts-ignore - Ignoring type errors for GraphQL operations
        const response = await graphqlRequest('GET_SETOR_DETAILS', { id: planejamentoData.planejamento.setor_id });
        console.log('Setor response:', response);
        return { setor: response.setor };
      } catch (error) {
        console.error('Error fetching setor:', error);
        return { setor: { id: planejamentoData.planejamento.setor_id, nome: 'Setor não encontrado', area: 0 } };
      }
    },
    enabled: !!planejamentoData?.planejamento?.setor_id,
    staleTime: 60000,
    gcTime: 300000
  });

  // Calcular o tamanho da área baseado no tipo (lote, canteiro ou setor)
  const areaInfo = useMemo(() => {
    const planejamento = planejamentoData?.planejamento;
    if (!planejamento) return { nome: '', tamanho: 0, tipo: '' };

    if (planejamento.lote_id && loteData?.lote) {
      return { 
        nome: loteData.lote.nome, 
        tamanho: loteData.lote.area || 0, 
        tipo: 'Lote' 
      };
    }
    if (planejamento.canteiro_id && canteiroData?.canteiro) {
      return { 
        nome: canteiroData.canteiro.nome, 
        tamanho: canteiroData.canteiro.area || 0, 
        tipo: 'Canteiro' 
      };
    }
    if (planejamento.setor_id && setorData?.setor) {
      return { 
        nome: setorData.setor.nome, 
        tamanho: setorData.setor.area || 0, 
        tipo: 'Setor' 
      };
    }

    return { nome: 'Não definido', tamanho: 0, tipo: 'Área' };
  }, [planejamentoData, loteData, canteiroData, setorData]);

  // Categorizar insumos e calcular custos
  const { insumosCategorizados, custoTotal, custoPorHectare } = useMemo(() => {
    if (!planejamentoData) {
      return { insumosCategorizados: [], custoTotal: 0, custoPorHectare: 0 };
    }

    const { insumos, produtos } = planejamentoData;
    const categorias: { [key: string]: InsumoCategoria } = {};
    let total = 0;

    // Mapear insumos com seus produtos e calcular custos
    insumos.forEach(insumo => {
      const produto = produtos.find(p => p.id === insumo.produto_id);
      if (!produto) return;

      const categoria = produto.categoria || 'Outros';
      const custo = (produto.preco_unitario || 0) * insumo.quantidade;
      const custoPorHectare = areaInfo.tamanho > 0 ? custo / areaInfo.tamanho : 0;
      total += custo;

      if (!categorias[categoria]) {
        categorias[categoria] = {
          categoria,
          insumos: [],
          total: 0,
        };
      }

      categorias[categoria].insumos.push({
        ...insumo,
        produto,
        custo_total: custo,
        custo_por_hectare: custoPorHectare,
      });

      categorias[categoria].total += custo;
    });

    // Ordenar categorias pelo valor total
    const insumosCategorizados = Object.values(categorias).sort((a, b) => b.total - a.total);
    const custoPorHectare = areaInfo.tamanho > 0 ? total / areaInfo.tamanho : 0;

    return { insumosCategorizados, custoTotal: total, custoPorHectare };
  }, [planejamentoData, areaInfo.tamanho]);

  // Função para formatar valores monetários para Kwanza Angolano (AOA)
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  };

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Carregando detalhes do planejamento...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Verificar se o planejamento existe
  if (!planejamentoData?.planejamento) {
    return (
      <div className="container mx-auto py-6 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Planejamento não encontrado</CardTitle>
            <CardDescription className="text-center">
              O planejamento que você está procurando não existe ou foi removido.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <Button onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Voltar para a lista de planejamentos
            </Button>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Se você acredita que isso é um erro, verifique se o ID do planejamento está correto ou entre em contato com o suporte.</p>
        </div>
      </div>
    );
  }
  
  // Se o planejamento existe, mostrar os detalhes
  return (
    <div className="container mx-auto py-6 space-y-6 print:py-2">
      <div className="flex justify-between items-center print:hidden">
        <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Voltar
        </Button>
        
        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
          <Printer size={16} />
          Imprimir
        </Button>
      </div>
      
      <div ref={componentRef} className="space-y-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Planejamento de Produção</CardTitle>
                <CardDescription>
                  Visualização completa do planejamento e custos de produção
                </CardDescription>
              </div>
              <Badge variant={planejamentoData.planejamento.status === 'concluido' ? 'secondary' : 'default'}>
                {planejamentoData.planejamento.status === 'concluido' ? 'Concluído' : 'Em andamento'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo do planejamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cultura</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{culturaData?.cultura?.nome || 'Não definida'}</p>
                  {culturaData?.cultura?.variedade && (
                    <p className="text-sm text-muted-foreground">Variedade: {culturaData.cultura.variedade}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Área</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{areaInfo.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {areaInfo.tipo}: {areaInfo.tamanho.toFixed(2)} hectares
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    {planejamentoData.planejamento.data_inicio && (
                      <p className="text-lg font-medium">
                        {format(new Date(planejamentoData.planejamento.data_inicio), "dd/MM/yyyy", { locale: pt })}
                      </p>
                    )}
                    {planejamentoData.planejamento.data_inicio && planejamentoData.planejamento.data_fim_prevista && (
                      <span>até</span>
                    )}
                    {planejamentoData.planejamento.data_fim_prevista && (
                      <p className="text-lg font-medium">
                        {format(new Date(planejamentoData.planejamento.data_fim_prevista), "dd/MM/yyyy", { locale: pt })}
                      </p>
                    )}
                  </div>
                  {planejamentoData.planejamento.data_inicio && planejamentoData.planejamento.data_fim_prevista ? (
                    <p className="text-sm text-muted-foreground">
                      Ciclo real: {differenceInDays(
                        new Date(planejamentoData.planejamento.data_fim_prevista),
                        new Date(planejamentoData.planejamento.data_inicio)
                      )} dias
                      {culturaData?.cultura?.ciclo_estimado_dias && (
                        <span className="ml-2 text-xs">(Estimativa da cultura: {culturaData.cultura.ciclo_estimado_dias} dias)</span>
                      )}
                    </p>
                  ) : culturaData?.cultura?.ciclo_estimado_dias ? (
                    <p className="text-sm text-muted-foreground">
                      Ciclo estimado: {culturaData.cultura.ciclo_estimado_dias} dias
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* Resumo de custos */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircleDollarSign size={18} />
                  Resumo do Custo de Produção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Custo Total</h3>
                    <p className="text-2xl font-bold">{formatarMoeda(custoTotal)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Custo por Hectare</h3>
                    <p className="text-2xl font-bold">{formatarMoeda(custoPorHectare)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Produtividade Estimada</h3>
                    <p className="text-2xl font-bold">
                      {culturaData?.cultura?.produtividade 
                        ? `${culturaData.cultura.produtividade} kg/ha` 
                        : 'Não definida'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalhamento dos insumos por categoria */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bookmark size={18} />
                Detalhamento de Insumos
              </h2>

              {insumosCategorizados.length === 0 ? (
                <p className="text-muted-foreground">Nenhum insumo registrado para este planejamento.</p>
              ) : (
                <div className="space-y-6">
                  {insumosCategorizados.map(categoria => (
                    <Card key={categoria.categoria}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{categoria.categoria}</CardTitle>
                          <p className="text-lg font-bold">{formatarMoeda(categoria.total)}</p>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground mb-2">
                          <span className="inline-flex items-center"><span className="w-3 h-3 inline-block bg-muted/50 mr-2"></span> O custo por hectare representa o valor de cada insumo dividido pela área total.</span>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Insumo</TableHead>
                              <TableHead>Quantidade</TableHead>
                              <TableHead>Preço Unitário</TableHead>
                              <TableHead>Custo por hectare</TableHead>
                              <TableHead className="text-right bg-muted/50 font-bold">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoria.insumos.map(insumo => (
                              <TableRow key={insumo.id}>
                                <TableCell className="font-medium">{insumo.produto?.nome}</TableCell>
                                <TableCell>
                                  {insumo.quantidade} {insumo.unidade || insumo.produto?.unidade}
                                </TableCell>
                                <TableCell>
                                  {insumo.produto?.preco_unitario ? formatarMoeda(insumo.produto.preco_unitario) : '-'}
                                </TableCell>
                                <TableCell >{formatarMoeda(insumo.custo_por_hectare)}</TableCell>
                                <TableCell className="text-right bg-muted/50 font-medium">{formatarMoeda(insumo.custo_total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}

                  <Card className="bg-muted/30">
                    <CardContent className="py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg">Custo Total dos Insumos</h3>
                          <p className="text-xl font-bold">{formatarMoeda(custoTotal)}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg">Custo por Hectare</h3>
                          <p className="text-xl font-bold">{formatarMoeda(custoPorHectare)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground mt-8 text-center print:mt-16 border-t pt-4">
          <p>Relatório gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}</p>
          <p>Katanda - Sistema de Gestão Agrícola</p>
        </div>
      </div>
    </div>
  );
}
