import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, PlusCircle, FileText, PieChart, BarChart3, X, Save, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Schema for transaction form
const transactionSchema = z.object({
  tipo: z.enum(["entrada", "saida"]),
  valor: z.coerce.number().min(0.01, "O valor deve ser maior que zero"),
  descricao: z.string().min(1, "A descrição é obrigatória"),
  data: z.string().min(1, "A data é obrigatória"),
  categoria: z.string().min(1, "A categoria é obrigatória"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

// Categorias de transações
const categorias = {
  entrada: [
    'Venda de produtos',
    'Serviços agrícolas',
    'Subsídios',
    'Outras receitas'
  ],
  saida: [
    'Insumos',
    'Mão de obra',
    'Equipamentos',
    'Manutenção',
    'Energia e água',
    'Outras despesas'
  ]
};

export default function FinanceiroPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('transacoes');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Query to fetch transactions
  const { data: transactionsData, isLoading } = useQuery({
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

  // Form for adding transactions
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      tipo: "entrada",
      valor: 0,
      descricao: "",
      data: new Date().toISOString().split('T')[0],
      categoria: "",
    },
  });

  // Mutation to add transaction
  const addTransactionMutation = useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      if (!user?.propriedade_id) throw new Error("ID da propriedade não encontrado");
      
      const result = await graphqlRequest(
        "INSERT_TRANSACAO_FINANCEIRA",
        {
          transacao: {
            ...values,
            propriedade_id: user.propriedade_id,
          },
        }
      );
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Transação registrada",
        description: "A transação foi registrada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const transactions = transactionsData?.transacoes_financeiras || [];
  
  const saldoAtual = transactions.reduce((acc, tx) => {
    return tx.tipo === 'entrada' ? acc + tx.valor : acc - tx.valor;
  }, 0);

  const receitasMensal = transactions
    .filter(tx => tx.tipo === 'entrada' && new Date(tx.data).getMonth() === new Date().getMonth())
    .reduce((acc, tx) => acc + tx.valor, 0);

  const despesasMensal = transactions
    .filter(tx => tx.tipo === 'saida' && new Date(tx.data).getMonth() === new Date().getMonth())
    .reduce((acc, tx) => acc + tx.valor, 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-AO', { 
      style: 'currency', 
      currency: 'AOA',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleExport = () => {
    const header = 'Data,Tipo,Categoria,Descrição,Valor (AOA)\n';
    const rows = transactions
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .map(tx => 
        `${tx.data},${tx.tipo === 'entrada' ? 'Receita' : 'Despesa'},${tx.categoria},${tx.descricao},${tx.valor.toLocaleString('pt-AO')}`
      ).join('\n');
    
    const csvContent = "\uFEFF" + header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `extrato_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestão Financeira</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Extrato
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => addTransactionMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo*</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="entrada">Entrada</SelectItem>
                            <SelectItem value="saida">Saída</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria*</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categorias[form.watch("tipo")].map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (AOA)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição*</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button type="submit" disabled={addTransactionMutation.isPending}>
                      {addTransactionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" /> Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">AOA</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(saldoAtual)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas (Mensal)</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">AOA</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(receitasMensal)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas (Mensal)</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">AOA</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(despesasMensal)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        defaultValue="transacoes" 
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="transacoes" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="relative overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Data</th>
                      <th className="px-6 py-3">Descrição</th>
                      <th className="px-6 py-3">Categoria</th>
                      <th className="px-6 py-3 text-right">Valor (AOA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                          Nenhuma transação encontrada
                        </td>
                      </tr>
                    ) : (
                      transactions
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                        .map((transacao) => (
                          <tr key={transacao.id} className="border-t">
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(transacao.data).toLocaleDateString('pt-AO')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium">{transacao.descricao}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 text-xs rounded-full bg-muted">
                                {transacao.categoria}
                              </span>
                            </td>
                            <td 
                              className={`px-6 py-4 text-right font-medium ${
                                transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {transacao.tipo === 'entrada' ? '+' : '-'} 
                              {formatCurrency(transacao.valor)}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias">
          <Card>
            <CardHeader>
              <CardTitle>Categorias</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gerenciamento de categorias em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-32 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  Fluxo de Caixa
                </Button>
                <Button variant="outline" className="h-32 flex-col gap-2">
                  <PieChart className="h-6 w-6" />
                  Receitas x Despesas
                </Button>
                <Button variant="outline" className="h-32 flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Desempenho Mensal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}