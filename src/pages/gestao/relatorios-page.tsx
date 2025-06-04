import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from 'lucide-react';

// Dados de exemplo - substituir por chamadas à API real
const sampleData = {
  financeiro: {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    receitas: [300000, 450000, 280000, 520000, 480000, 390000], // Valores em Kwanza (AOA)
    despesas: [200000, 250000, 300000, 220000, 280000, 310000], // Valores em Kwanza (AOA)
  },
  producao: {
    culturas: [
      { nome: 'Alface', area: 1.5, producao: 1500, unidade: 'pés', areaUnidade: 'ha' },
      { nome: 'Tomate', area: 2.0, producao: 800, unidade: 'kg', areaUnidade: 'ha' },
      { nome: 'Cenoura', area: 1.2, producao: 1200, unidade: 'kg', areaUnidade: 'ha' },
    ]
  },
  estoque: {
    itens: [
      { nome: 'Adubo NPK', quantidade: 150, unidade: 'kg', preco: 25000 }, // Preço em AOA
      { nome: 'Defensivo Agrícola', quantidade: 45, unidade: 'litros', preco: 15000 }, // Preço em AOA
      { nome: 'Sementes', quantidade: 2000, unidade: 'un', preco: 500 }, // Preço em AOA por unidade
    ]
  }
};

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState('financeiro');

  const handleExport = (tipo: string) => {
    // Função para exportar os dados
    let csvContent = '';
    
    if (tipo === 'financeiro') {
      const { labels, receitas, despesas } = sampleData.financeiro;
      const header = 'Mês,Receitas,Despesas\n';
      const rows = labels.map((mes, index) => 
        `${mes},${receitas[index]},${despesas[index]}`
      ).join('\n');
      csvContent = header + rows;
    } else if (tipo === 'producao') {
      const header = 'Cultura,Área (ha),Produção,Unidade\n';
      const rows = sampleData.producao.culturas.map(item => 
        `${item.nome},${item.area},${item.producao},${item.unidade}`
      ).join('\n');
      csvContent = header + rows;
    } else if (tipo === 'estoque') {
      const header = 'Item,Quantidade,Unidade\n';
      const rows = sampleData.estoque.itens.map(item => 
        `${item.nome},${item.quantidade},${item.unidade}`
      ).join('\n');
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

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
      </div>

      <Tabs 
        defaultValue="financeiro" 
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="producao">Produção</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
          </TabsList>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto h-8"
            onClick={() => handleExport(activeTab)}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>

        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balanço Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Receitas</h3>
                    <p className="text-2xl font-bold">
                      {sampleData.financeiro.receitas.reduce((a, b) => a + b, 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Despesas</h3>
                    <p className="text-2xl font-bold">
                      {sampleData.financeiro.despesas.reduce((a, b) => a + b, 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA', minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                {/* Gráfico de barras pode ser adicionado aqui */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="producao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produção por Cultura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleData.producao.culturas.map((cultura, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{cultura.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {cultura.producao.toLocaleString()} {cultura.unidade} em {cultura.area} {cultura.areaUnidade}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {((cultura.area / sampleData.producao.culturas.reduce((acc, curr) => acc + curr.area, 0)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nível de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleData.estoque.itens.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{item.nome}</p>
                      <div className="flex flex-col">
                        <p className="text-sm">
                          {item.quantidade} {item.unidade}
                        </p>
                        {item.preco && (
                          <p className="text-xs text-muted-foreground">
                            {item.preco.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}/{item.unidade}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${Math.min(100, (item.quantidade / 100) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
