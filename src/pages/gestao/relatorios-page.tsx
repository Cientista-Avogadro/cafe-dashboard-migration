import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('financeiro');

  // Query para buscar transações financeiras
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["transacoes", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { transacoes_financeiras: [] };
      return await graphqlRequest(
        "GET_TRANSACOES_FINANCEIRAS",
        { propriedade_id: user.propriedade_id }
      );
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar produtos em estoque
  const { data: estoqueData, isLoading: isLoadingEstoque } = useQuery({
    queryKey: ["produtos_estoque", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { produtos_estoque: [] };
      return await graphqlRequest(
        "GET_PRODUTOS_ESTOQUE",
        { propriedade_id: user.propriedade_id }
      );
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar planejamentos (produção)
  const { data: planejamentosData, isLoading: isLoadingPlanejamentos } = useQuery({
    queryKey: ["planejamentos", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { planejamentos: [] };
      return await graphqlRequest(
        "GET_PLANEJAMENTOS",
        { propriedade_id: user.propriedade_id }
      );
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar culturas
  const { data: culturasData, isLoading: isLoadingCulturas } = useQuery({
    queryKey: ["culturas", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { culturas: [] };
      return await graphqlRequest(
        "GET_CULTURAS",
        { propriedade_id: user.propriedade_id }
      );
    },
    enabled: !!user?.propriedade_id,
  });

  // Processar dados financeiros
  const transactions = transactionsData?.transacoes_financeiras || [];
  const receitas = transactions.filter((tx: { tipo: string }) => tx.tipo === 'entrada');
  const despesas = transactions.filter((tx: { tipo: string }) => tx.tipo === 'saida');

  // Agrupar transações por mês
  const transacoesPorMes = transactions.reduce((acc: Record<string, { receitas: number; despesas: number }>, tx: { data: string; tipo: string; valor: number }) => {
    const mes = format(new Date(tx.data), 'MMM', { locale: pt });
    if (!acc[mes]) {
      acc[mes] = { receitas: 0, despesas: 0 };
    }
    if (tx.tipo === 'entrada') {
      acc[mes].receitas += tx.valor;
    } else {
      acc[mes].despesas += tx.valor;
    }
    return acc;
  }, {} as Record<string, { receitas: number; despesas: number }>);

  const dadosFinanceiros = (Object.entries(transacoesPorMes) as [string, { receitas: number; despesas: number }][]).map(([mes, dados]) => ({
    mes,
    receitas: dados.receitas,
    despesas: dados.despesas
  }));

  const handleExport = (tipo: string) => {
    let dados: any[] = [];
    if (tipo === 'financeiro') {
      dados = transactionsData?.transacoes_financeiras || [];
    } else if (tipo === 'producao') {
      dados = planejamentosData?.planejamentos || [];
    } else if (tipo === 'estoque') {
      dados = estoqueData?.produtos_estoque || [];
    }
    let csvContent = '';
    
    if (tipo === 'financeiro') {
      const header = 'Mês,Receitas,Despesas\n';
      const rows = dados.map((dados: { mes: string; receitas: number; despesas: number }) => 
        `${dados.mes},${dados.receitas},${dados.despesas}`
      ).join('\n');
      csvContent = header + rows;
    } else if (tipo === 'producao') {
      const header = 'Cultura,Área (ha),Status,Data Início,Data Fim Prevista\n';
      const rows = dados.map((p: { cultura_id: string; area_plantada?: number; status: string; data_inicio: string; data_fim_prevista: string }) => 
        `${p.cultura_id},${p.area_plantada || 0},${p.status},${p.data_inicio},${p.data_fim_prevista}`
      ).join('\n') || '';
      csvContent = header + rows;
    } else if (tipo === 'estoque') {
      const header = 'Item,Quantidade,Unidade,Preço Unitário\n';
      const rows = dados.map((item: { nome: string; quantidade: number; unidade: string; preco_unitario: number }) => 
        `${item.nome},${item.quantidade},${item.unidade},${item.preco_unitario}`
      ).join('\n') || '';
      csvContent = header + rows;
    }

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
  };

  const isLoading = isLoadingTransactions || isLoadingEstoque || isLoadingPlanejamentos || isLoadingCulturas;

  // Função para imprimir
  const handlePrint = () => {
    window.print();
  };

  // Função para exportar PDF
  const handleExportPDF = async (tipo: string) => {
    // Seleciona o conteúdo do relatório atual
    let element: HTMLElement | null = null;
    if (tipo === "financeiro") {
      element = document.querySelector("[data-relatorio='financeiro']");
    } else if (tipo === "producao") {
      element = document.querySelector("[data-relatorio='producao']");
    } else if (tipo === "estoque") {
      element = document.querySelector("[data-relatorio='estoque']");
    }
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save(`relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const calcularTotal = (items: any[]) => {
    return items.reduce((acc: number, item: { quantidade?: number; preco_unitario?: number }) => acc + (item.quantidade || 0) * (item.preco_unitario || 0), 0);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex md:items-center justify-between md:flex-row flex-col space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
      </div>

      <Tabs 
        defaultValue="financeiro" 
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <div className="flex justify-between items-center flex-wrap no-print">
          <TabsList>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="producao">Produção</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 flex-wrap ml-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8"
              onClick={() => handleExport(activeTab)}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => handlePrint()}
            >
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => handleExportPDF(activeTab)}
            >
              Exportar PDF
            </Button>
          </div>
        </div>

        <TabsContent value="financeiro" className="space-y-4">
          <div data-relatorio="financeiro">
            <Card>
              <CardHeader>
                <CardTitle>Balanço Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Receitas</h3>
                      <p className="text-2xl font-bold">
                        {formatCurrency(receitas.reduce((acc: number, tx: { valor: number }) => acc + tx.valor, 0))}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Despesas</h3>
                      <p className="text-2xl font-bold">
                        {formatCurrency(despesas.reduce((acc: number, tx: { valor: number }) => acc + tx.valor, 0))}
                      </p>
                    </div>
                  </div>
                  <div className="h-[400px]">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dadosFinanceiros}
                          margin={{
                            top: 20,
                            right: 40,
                            left: 40,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip formatter={(value) => formatCurrency(value as number)} />
                          <Legend />
                          <Bar dataKey="receitas" fill="#10B981" name="Receitas" />
                          <Bar dataKey="despesas" fill="#EF4444" name="Despesas" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="producao" className="space-y-4">
          <div data-relatorio="producao">
            <Card>
              <CardHeader>
                <CardTitle>Produção</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Total de Planejamentos</h3>
                        <p className="text-2xl font-bold">
                          {planejamentosData?.planejamentos.length || 0}
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Em Andamento</h3>
                        <p className="text-2xl font-bold">
                          {planejamentosData?.planejamentos.filter((p: { status: string }) => p.status === 'Em andamento' || p.status === 'em_andamento').length || 0}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border">
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Planejamentos Recentes(5 mais recentes)</h3>
                        <div className="space-y-2">
                          {planejamentosData?.planejamentos.filter((p: { data_inicio: string }) => p.data_inicio).sort((a: { data_inicio: string }, b: { data_inicio: string }) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()).slice(0, 5).map((planejamento: any) => (
                            <div key={planejamento.id} className="flex justify-between items-center p-2 rounded-lg bg-muted">
                              <div>
                                <p className="font-medium">Cultura: {culturasData?.culturas.find((c: any) => c.id === planejamento.cultura_id)?.nome || 'Cultura não encontrada'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(planejamento.data_inicio), 'dd/MM/yyyy')} - {format(new Date(planejamento.data_fim_prevista), 'dd/MM/yyyy')}
                                </p>
                              </div>
                              <span className="text-sm font-medium">{planejamento.status === 'Em andamento' || planejamento.status === 'em_andamento' ? 'Em andamento' : planejamento.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-4">
          <div data-relatorio="estoque">
            <Card>
              <CardHeader>
                <CardTitle>Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Total de Itens</h3>
                        <p className="text-2xl font-bold">
                          {estoqueData?.produtos_estoque.length || 0}
                        </p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Valor Total em Estoque</h3>
                        <p className="text-2xl font-bold">
                          {formatCurrency(calcularTotal(estoqueData?.produtos_estoque || []))}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border">
                      <div className="p-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Itens em Estoque</h3>
                        <div className="space-y-2">
                          {estoqueData?.produtos_estoque.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-muted">
                              <div>
                                <p className="font-medium">{item.nome}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantidade} {item.unidade}
                                </p>
                              </div>
                              <span className="text-sm font-medium">
                                {formatCurrency((item.quantidade || 0) * (item.preco_unitario || 0))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
