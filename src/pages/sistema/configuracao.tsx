import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Schema para validação do formulário de propriedade
const propriedadeSchema = z.object({
  nome: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  localizacao: z.string().min(3, { message: "Localização deve ter pelo menos 3 caracteres" }),
  tamanho: z.coerce.number().min(0, { message: "Tamanho deve ser um número positivo" }),
  nif: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

type PropriedadeFormValues = z.infer<typeof propriedadeSchema>;

// Schema para validação do formulário de configurações do sistema
const sistemaConfigSchema = z.object({
  unidade_area: z.enum(["ha", "m2", "acre"]),
  moeda_principal: z.enum(["EUR", "USD", "AOA"]),
  taxa_cambio_usd: z.coerce.number().min(0, { message: "A taxa de câmbio deve ser um número positivo" }),
  taxa_cambio_eur: z.coerce.number().min(0, { message: "A taxa de câmbio deve ser um número positivo" }),
  taxa_cambio_aoa: z.coerce.number().min(0, { message: "A taxa de câmbio deve ser um número positivo" }),
  atualizar_cambio_automaticamente: z.boolean(),
  tema: z.enum(["claro", "escuro", "sistema"]),
});

type SistemaConfigFormValues = z.infer<typeof sistemaConfigSchema>;

function SistemaConfigForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Valores padrão para as configurações do sistema
  const defaultConfig: SistemaConfigFormValues = {
    unidade_area: "ha",
    moeda_principal: "EUR",
    taxa_cambio_usd: 1,
    taxa_cambio_eur: 1,
    taxa_cambio_aoa: 1,
    atualizar_cambio_automaticamente: false,
    tema: "sistema",
  };
  
  // Formulário para editar configurações do sistema
  const form = useForm<SistemaConfigFormValues>({
    resolver: zodResolver(sistemaConfigSchema),
    defaultValues: defaultConfig,
  });
  
  // Buscar configurações do sistema do banco de dados
  const { data: configData, isLoading, error } = useQuery({
    queryKey: ["sistema_configuracao", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { sistema_configuracao: [] };
      
      const result = await graphqlRequest(
        "GET_SISTEMA_CONFIGURACAO",
        { propriedade_id: user.propriedade_id }
      );
      
      return result;
    },
    enabled: !!user?.propriedade_id,
  });
  
  // Obter a configuração do sistema
  const config = configData?.sistema_configuracao?.[0];
  
 
  
  // Atualizar o formulário quando os dados forem carregados
  useEffect(() => {
    if (config) {
      console.log('Resetting form with config:', config);
      form.reset({
        unidade_area: config.unidade_area || "ha",
        moeda_principal: config.moeda_principal || "EUR",
        taxa_cambio_usd: config.taxa_cambio_usd || 1,
        taxa_cambio_eur: config.taxa_cambio_eur || 1,
        taxa_cambio_aoa: config.taxa_cambio_aoa || 1,
        atualizar_cambio_automaticamente: config.atualizar_cambio_automaticamente || false,
        tema: config.tema || "sistema",
      });
      console.log('Form values after reset:', form.getValues());
    } else {
      console.log('No config data available to reset form');
    }
  }, [config, form]);
  
  // Mutation para salvar as configurações do sistema
  const { mutate: saveConfig, isPending: isSaving } = useMutation({
    mutationFn: async (values: SistemaConfigFormValues) => {
      if (!user?.propriedade_id) throw new Error("ID da propriedade não encontrado");
      
      const result = await graphqlRequest(
        "UPSERT_SISTEMA_CONFIGURACAO",
        {
          configuracao: {
            propriedade_id: user.propriedade_id,
            ...values,
            atualizado_em: new Date().toISOString(),
          }
        }
      );
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema_configuracao"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações do sistema foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Erro ao salvar configurações:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar as configurações do sistema.",
        variant: "destructive",
      });
    },
  });
  
  // Função para submeter o formulário
  const onSubmit = (values: SistemaConfigFormValues) => {
    saveConfig(values);
  };

    
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Moeda e Câmbio</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="moeda_principal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moeda Principal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a moeda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="AOA">Kwanza Angolano (Kz)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Moeda principal utilizada no sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="atualizar_cambio_automaticamente"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Atualizar Câmbio Automaticamente</FormLabel>
                    <FormDescription>
                      Atualizar taxas de câmbio automaticamente
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <FormField
              control={form.control}
              name="taxa_cambio_usd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Câmbio USD</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.0001" 
                      {...field} 
                      disabled={form.watch("atualizar_cambio_automaticamente")} 
                    />
                  </FormControl>
                  <FormDescription>
                    Taxa de câmbio para Dólar Americano
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="taxa_cambio_eur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Câmbio EUR</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.0001" 
                      {...field} 
                      disabled={form.watch("atualizar_cambio_automaticamente")} 
                    />
                  </FormControl>
                  <FormDescription>
                    Taxa de câmbio para Euro
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="taxa_cambio_aoa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Câmbio AOA</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      disabled={form.watch("atualizar_cambio_automaticamente")} 
                    />
                  </FormControl>
                  <FormDescription>
                    Taxa de câmbio para Kwanza Angolano
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Unidades de Medida</h3>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="unidade_area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidade de Área</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma unidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ha">Hectare (ha)</SelectItem>
                      <SelectItem value="m2">Metro Quadrado (m²)</SelectItem>
                      <SelectItem value="acre">Acre (ac)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Unidade padrão para medição de áreas no sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Aparência</h3>
          <Separator className="mb-4" />
          <FormField
            control={form.control}
            name="tema"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tema</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tema" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="claro">Claro</SelectItem>
                    <SelectItem value="escuro">Escuro</SelectItem>
                    <SelectItem value="sistema">Seguir Sistema</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Tema de aparência do sistema
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full md:w-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </form>
    </Form>
  );
}

function PropriedadeForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Buscar informações da propriedade atual
  const { data: propriedade, isLoading } = useQuery({
    queryKey: ["propriedade", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return null;
      
      const result = await graphqlRequest(
        "GET_PROPRIEDADES",
        { user_id: user.propriedade_id }
      );
      
      return result.propriedades && result.propriedades.length > 0 ? result.propriedades[0] : null;
    },
    enabled: !!user?.propriedade_id,
  });
  
  // Formulário para editar propriedade
  const form = useForm<PropriedadeFormValues>({
    resolver: zodResolver(propriedadeSchema),
    defaultValues: {
      nome: "",
      localizacao: "",
      tamanho: 0,
      nif: "",
      latitude: undefined,
      longitude: undefined,
    },
  });
  
  // Atualizar o formulário quando os dados da propriedade forem carregados
  useEffect(() => {
    if (propriedade) {
      form.reset({
        nome: propriedade.nome || "",
        localizacao: propriedade.localizacao || "",
        tamanho: propriedade.tamanho || 0,
        nif: propriedade.nif || "",
        latitude: propriedade.latitude,
        longitude: propriedade.longitude,
      });
    }
  }, [propriedade, form]);
  
  // Mutation para atualizar propriedade
  const updatePropriedadeMutation = useMutation({
    mutationFn: async (values: PropriedadeFormValues) => {
      if (!user?.propriedade_id) throw new Error("ID da propriedade não encontrado");
      
      const result = await graphqlRequest(
        "UPDATE_PROPRIEDADE",
        {
          id: user.propriedade_id,
          propriedade: values,
        }
      );
      
      return result.update_propriedades_by_pk;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propriedade"] });
      toast({
        title: "Propriedade atualizada",
        description: "As informações da propriedade foram atualizadas com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar propriedade",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Função para submeter o formulário
  const onSubmit = (values: PropriedadeFormValues) => {
    updatePropriedadeMutation.mutate(values);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Propriedade</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da propriedade" {...field} />
                </FormControl>
                <FormDescription>
                  Nome da sua fazenda ou propriedade agrícola
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="localizacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localização</FormLabel>
                <FormControl>
                  <Input placeholder="Endereço ou localização" {...field} />
                </FormControl>
                <FormDescription>
                  Endereço ou localização da propriedade
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tamanho"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tamanho (hectares)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  Área total da propriedade em hectares
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="nif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NIF/NIPC</FormLabel>
                <FormControl>
                  <Input placeholder="Número de identificação fiscal" {...field} />
                </FormControl>
                <FormDescription>
                  Número de identificação fiscal (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input type="number" step="0.000001" placeholder="Ex: 41.1234" {...field} />
                </FormControl>
                <FormDescription>
                  Coordenada geográfica (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input type="number" step="0.000001" placeholder="Ex: -8.6123" {...field} />
                </FormControl>
                <FormDescription>
                  Coordenada geográfica (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full md:w-auto"
          disabled={updatePropriedadeMutation.isPending}
        >
          {updatePropriedadeMutation.isPending ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </form>
    </Form>
  );
}

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
              <h2 className="text-xl font-semibold mb-4">Informações da Propriedade</h2>
              <p className="text-slate-500 mb-6">
                Visualize e atualize as informações da sua propriedade.
              </p>
              <PropriedadeForm />
            </TabsContent>

            <TabsContent value="sistema" className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configurações do Sistema</h2>
              <p className="text-slate-500 mb-6">
                Configure as opções e preferências do sistema.
              </p>
              <SistemaConfigForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
