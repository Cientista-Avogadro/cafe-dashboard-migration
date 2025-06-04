import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, PlusCircle, FileText, PieChart, BarChart3, X, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Categorias de transações
const categorias = {
  receita: [
    'Venda de produtos',
    'Serviços agrícolas',
    'Subsídios',
    'Outras receitas'
  ],
  despesa: [
    'Insumos',
    'Mão de obra',
    'Equipamentos',
    'Manutenção',
    'Energia e água',
    'Outras despesas'
  ]
};

// Dados de exemplo - substituir por chamadas à API real
const useSampleData = () => {
  const [data, setData] = useState({
    transacoes: [
      { id: 1, tipo: 'receita', categoria: 'Venda de produtos', valor: 1500000, data: '2025-05-15', descricao: 'Venda de alface' },
      { id: 2, tipo: 'despesa', categoria: 'Insumos', valor: 250000, data: '2025-05-10', descricao: 'Compra de adubo' },
      { id: 3, tipo: 'despesa', categoria: 'Mão de obra', valor: 350000, data: '2025-05-05', descricao: 'Pagamento de funcionários' },
      { id: 4, tipo: 'receita', categoria: 'Venda de produtos', valor: 1200000, data: '2025-04-28', descricao: 'Venda de tomate' },
    ]
  });

  const saldoAtual = data.transacoes.reduce((acc, tx) => {
    return tx.tipo === 'receita' ? acc + tx.valor : acc - tx.valor;
  }, 0);

  const receitasMensal = data.transacoes
    .filter(tx => tx.tipo === 'receita' && new Date(tx.data).getMonth() === new Date().getMonth())
    .reduce((acc, tx) => acc + tx.valor, 0);

  const despesasMensal = data.transacoes
    .filter(tx => tx.tipo === 'despesa' && new Date(tx.data).getMonth() === new Date().getMonth())
    .reduce((acc, tx) => acc + tx.valor, 0);

  const adicionarTransacao = (novaTransacao) => {
    const novaTransacaoCompleta = {
      ...novaTransacao,
      id: Math.max(0, ...data.transacoes.map(t => t.id)) + 1,
      data: new Date().toISOString().split('T')[0]
    };
    
    setData(prev => ({
      ...prev,
      transacoes: [...prev.transacoes, novaTransacaoCompleta]
    }));
  };

  return {
    ...data,
    saldoAtual,
    receitasMensal,
    despesasMensal,
    adicionarTransacao
  };
};

// Componente do formulário de transação
const FormularioTransacao = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    tipo: 'receita',
    categoria: '',
    valor: '',
    descricao: '',
    data: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      valor: Number(formData.valor)
    });
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Select 
            value={formData.tipo}
            onValueChange={(value) => setFormData({...formData, tipo: value, categoria: ''})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Select 
            value={formData.categoria}
            onValueChange={(value) => setFormData({...formData, categoria: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias[formData.tipo].map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor">Valor (AOA)</Label>
        <Input 
          id="valor" 
          type="number" 
          value={formData.valor}
          onChange={(e) => setFormData({...formData, valor: e.target.value})}
          placeholder="0,00" 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="data">Data</Label>
        <Input 
          id="data" 
          type="date" 
          value={formData.data}
          onChange={(e) => setFormData({...formData, data: e.target.value})}
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea 
          id="descricao" 
          value={formData.descricao}
          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
          placeholder="Adicione detalhes sobre esta transação" 
          rows={3} 
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button type="submit">
          <Save className="mr-2 h-4 w-4" /> Salvar
        </Button>
      </div>
    </form>
  );
};

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState('transacoes');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {
    transacoes,
    saldoAtual,
    receitasMensal,
    despesasMensal,
    adicionarTransacao
  } = useSampleData();

  const handleExport = () => {
    const header = 'Data,Tipo,Categoria,Descrição,Valor (AOA)\n';
    const rows = transacoes
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .map(tx => 
        `${tx.data},${tx.tipo === 'receita' ? 'Receita' : 'Despesa'},${tx.categoria},${tx.descricao},${tx.valor.toLocaleString('pt-AO')}`
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-AO', { 
      style: 'currency', 
      currency: 'AOA',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleNovaTransacao = (transacao) => {
    adicionarTransacao(transacao);
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
              <FormularioTransacao 
                onSave={handleNovaTransacao}
                onCancel={() => setIsDialogOpen(false)}
              />
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
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted">
                    <tr>
                      <th className="px-6 py-3">Data</th>
                      <th className="px-6 py-3">Descrição</th>
                      <th className="px-6 py-3">Categoria</th>
                      <th className="px-6 py-3 text-right">Valor (AOA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoes
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
                              transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {transacao.tipo === 'receita' ? '+' : '-'} 
                            {formatCurrency(transacao.valor)}
                          </td>
                        </tr>
                      ))}
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
