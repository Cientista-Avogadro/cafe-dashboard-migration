import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConfigPage() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("geral");
  
  // Parse the tab parameter from the URL
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const tabParam = params.get('tab');
    if (tabParam && (tabParam === 'geral' || tabParam === 'sistema')) {
      setActiveTab(tabParam);
    }
  }, [location]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Configurações</h1>
        <p className="text-slate-500">Gerencie as configurações do sistema</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full border-b rounded-none justify-start">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="sistema">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configurações Gerais</h2>
              <p className="text-slate-500">
                Configure as opções gerais do sistema.
              </p>
              {/* Conteúdo das configurações gerais aqui */}
            </TabsContent>

            <TabsContent value="sistema" className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configurações do Sistema</h2>
              <p className="text-slate-500">
                Configure as opções do sistema.
              </p>
              {/* Conteúdo das configurações do sistema aqui */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
