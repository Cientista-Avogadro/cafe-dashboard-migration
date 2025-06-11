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
import { ArrowLeft, Printer, CircleDollarSign, Bookmark, FileText, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Leaf, 
  Package, 
  DollarSign, 
  Clock, 
  BarChart3
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    area_plantada?: number;
    produtividade_esperada?: number;
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

// Add status badge component
const StatusBadge = ({ status }: { status?: string }) => {
  const getStatusStyle = (status: string = 'planejado') => {
    switch (status) {
      case "em_andamento":
        return "bg-orange-100 text-orange-800"; // Laranja
      case "concluido":
        return "bg-green-100 text-green-800"; // Verde
      case "planejado":
        return "bg-amber-900 text-amber-50"; // Castanho (marrom)
      case "cancelado":
        return "bg-red-100 text-red-800"; // Vermelho
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusText = (status: string = 'planejado') => {
    switch (status) {
      case "em_andamento":
        return "Em Andamento";
      case "concluido":
        return "Concluído";
      case "planejado":
        return "Planejado";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getStatusStyle(status)}`}>
      {getStatusText(status)}
    </span>
  );
};

// Add helper functions for calculations
const calcularCustoTotal = (insumos: InsumosPlanejamento[], produtos: ProdutoEstoque[]): number => {
  return insumos.reduce((total, insumo) => {
    const produto = produtos.find(p => p.id === insumo.produto_id);
    if (!produto || !produto.preco_unitario || insumo.quantidade <= 0) return total;
    return total + (produto.preco_unitario * insumo.quantidade);
  }, 0);
};

const calcularCustoPorHectare = (custoTotal: number, area: number): number => {
  if (area <= 0) return 0;
  return custoTotal / area;
};

const calcularCustoPorTonelada = (custoTotal: number, produtividade: number, area: number): number => {
  if (produtividade <= 0 || area <= 0) return 0;
  return custoTotal / (produtividade * area);
};

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
    setLocation('/producao');
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

  // Add this after the areaInfo useMemo
  const planejamentoInfo = useMemo(() => {
    if (!planejamentoData?.planejamento) return null;
    const { area_plantada, produtividade_esperada } = planejamentoData.planejamento;
    return {
      area_plantada,
      produtividade_esperada
    };
  }, [planejamentoData]);

  // Update the useMemo calculation
  const { insumosCategorizados, custoTotal, custoPorHectare } = useMemo(() => {
    if (!planejamentoData) {
      return { insumosCategorizados: [], custoTotal: 0, custoPorHectare: 0 };
    }

    const { insumos, produtos } = planejamentoData;
    const categorias: { [key: string]: InsumoCategoria } = {};
    const total = calcularCustoTotal(insumos, produtos);

    // Mapear insumos com seus produtos e calcular custos
    insumos.forEach(insumo => {
      const produto = produtos.find(p => p.id === insumo.produto_id);
      if (!produto || !produto.preco_unitario || insumo.quantidade <= 0) return;

      const categoria = produto.categoria || 'Outros';
      const custo = produto.preco_unitario * insumo.quantidade;
      const custoPorHectare = calcularCustoPorHectare(custo, areaInfo.tamanho);

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
    const custoPorHectare = calcularCustoPorHectare(total, areaInfo.tamanho);

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

  // Add export functions
  const handleExportPDF = async () => {
    if (!componentRef.current) return;
    
    const canvas = await html2canvas(componentRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save(`planejamento_${id}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const handleExportCSV = () => {
    if (!planejamentoData?.planejamento) return;

    const headers = [
      "Categoria",
      "Insumo",
      "Dose por hectare",
      "Quantidade Total",
      "Unidade",
      "Custo Unitário",
      "Custo por hectare",
      "Custo Total"
    ];

    const rows = insumosCategorizados.flatMap(categoria =>
      categoria.insumos.map(insumo => [
        categoria.categoria,
        insumo.produto?.nome || "Não definido",
        insumo.produto?.dose_por_hectare ?? '-',
        insumo.quantidade,
        insumo.produto?.unidade || insumo.unidade || "un",
        insumo.produto?.preco_unitario ? formatarMoeda(insumo.produto.preco_unitario) : '-',
        formatarMoeda(insumo.custo_por_hectare),
        formatarMoeda(insumo.custo_total)
      ])
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `planejamento_${id}_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* Header with actions */}
      <div className="flex justify-between md:items-center print:hidden">
        <Button onClick={handleBack} variant="outline" className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Voltar
        </Button>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Printer size={16} />
            Imprimir
          </Button>
          <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
            <FileText size={16} />
            Exportar PDF
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Exportar CSV
          </Button>
        </div>
      </div>
      
      <div ref={componentRef} className="space-y-6">
        {/* Main Info Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Planejamento de Produção</CardTitle>
                <CardDescription>
                  Visualização completa do planejamento e custos de produção
                </CardDescription>
              </div>
              <StatusBadge status={planejamentoData.planejamento.status} />
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Leaf className="h-4 w-4" />
                    Cultura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{culturaData?.cultura?.nome || 'Não definida'}</p>
                  {culturaData?.cultura?.variedade && (
                    <p className="text-sm text-muted-foreground">Variedade: {culturaData.cultura.variedade}</p>
                  )}
                  {culturaData?.cultura?.ciclo_estimado_dias && (
                    <p className="text-sm text-muted-foreground">Ciclo: {culturaData.cultura.ciclo_estimado_dias} dias</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Área
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{areaInfo.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {areaInfo.tipo}: {areaInfo.tamanho.toFixed(2)} hectares
                  </p>
                  {planejamentoInfo?.area_plantada && (
                    <p className="text-sm text-muted-foreground">
                      Área plantada: {planejamentoInfo.area_plantada.toFixed(2)} ha
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Período
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        Início: {planejamentoData.planejamento.data_inicio 
                          ? format(new Date(planejamentoData.planejamento.data_inicio), "dd/MM/yyyy", { locale: pt })
                          : 'Não definido'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        Fim previsto: {planejamentoData.planejamento.data_fim_prevista
                          ? format(new Date(planejamentoData.planejamento.data_fim_prevista), "dd/MM/yyyy", { locale: pt })
                          : 'Não definido'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Produtividade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {planejamentoInfo?.produtividade_esperada 
                        ? `${planejamentoInfo.produtividade_esperada.toFixed(2)} t/ha`
                        : 'Não definida'}
                    </p>
                    {culturaData?.cultura?.produtividade && (
                      <p className="text-sm text-muted-foreground">
                        Média da cultura: {culturaData.cultura.produtividade} kg/ha
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cost Summary Card */}
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
                    <h3 className="text-sm font-medium text-muted-foreground">Custo por Tonelada</h3>
                    <p className="text-2xl font-bold">
                      {planejamentoInfo?.produtividade_esperada && planejamentoInfo.produtividade_esperada > 0
                        ? formatarMoeda(calcularCustoPorTonelada(
                            custoTotal,
                            planejamentoInfo.produtividade_esperada,
                            areaInfo.tamanho
                          ))
                        : 'Não calculado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Inputs Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={18} />
              Detalhamento de Insumos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insumosCategorizados.length === 0 ? (
              <p className="text-muted-foreground">Nenhum insumo registrado para este planejamento.</p>
            ) : (
              <div className="space-y-6">
                {insumosCategorizados.map(categoria => (
                  <Card key={categoria.categoria} className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{categoria.categoria}</CardTitle>
                        <p className="text-lg font-bold">{formatarMoeda(categoria.total)}</p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoria.insumos.map((insumo, index) => (
                          <div key={index} className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-b last:border-0 gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{insumo.produto?.nome || 'Produto não encontrado'}</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                                <span><strong>Dose por hectare:</strong> {insumo.produto?.dose_por_hectare ?? '-'}</span>
                                <span><strong>Quantidade Total:</strong> {insumo.quantidade}</span>
                                <span><strong>Custo Unitário:</strong> {insumo.produto?.preco_unitario ? formatarMoeda(insumo.produto.preco_unitario) : '-'}</span>
                                <span><strong>Custo por hectare:</strong> {formatarMoeda(insumo.custo_por_hectare)}</span>
                                <span><strong>Custo Total:</strong> {formatarMoeda(insumo.custo_total)}</span>
                              </div>
                            </div>
                            <div className="text-right hidden md:block">
                              <span className="text-xs text-muted-foreground">Unidade: {insumo.produto?.unidade || insumo.unidade || 'un'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-sm text-muted-foreground mt-8 text-center print:mt-16 border-t pt-4">
          <p>Relatório gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}</p>
          <p>Katanda - Sistema de Gestão Agrícola</p>
        </div>
      </div>
    </div>
  );
}
