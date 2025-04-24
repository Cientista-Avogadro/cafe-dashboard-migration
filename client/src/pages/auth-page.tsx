import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { graphqlRequest } from "@/lib/queryClient";

// Extend the schema with validation
const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

import { registerSchema } from "@shared/register-schema";

export default function AuthPage() {
  const { user, loginMutation, registerWithProperty } = useAuth();
  const [_, setLocation] = useLocation();


  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Este efeito lida com o redirecionamento de maneira segura
  React.useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    // Envia email e password
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    registerWithProperty.mutate(values, {
      onSuccess: () => {
        setLocation("/");
      },
      onError: (error) => {
        console.error(error);
      },
    });
  };



  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-slate-50">
      {/* Left column with forms */}
      <div className="flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <span className="text-3xl font-bold text-primary">AgroGestão</span>
            </div>
            <CardTitle className="text-2xl font-bold">Bem-vindo</CardTitle>
            <CardDescription>
              Faça login ou crie uma conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Digite seu email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Digite sua senha" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
                    {/* Dados do Usuário */}
                    <div>
  <h3 className="text-lg font-semibold mb-2">Dados do Usuário</h3>
                      <FormField
                        control={registerForm.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite seu nome" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Escolha um email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Crie uma senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirme a Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirme sua senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Dados da Propriedade */}
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Dados da Propriedade</h3>
                      <FormField
                        control={registerForm.control}
                        name="propriedade_nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Propriedade</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome da propriedade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="propriedade_localizacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Localização</FormLabel>
                            <FormControl>
                              <Input placeholder="Digite a localização (opcional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="propriedade_tamanho"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tamanho (ha)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Digite o tamanho em hectares (opcional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerWithProperty.isPending}
                    >
                      {registerWithProperty.isPending ? "Criando conta..." : "Criar Conta"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Right column with hero section */}
      <div className="hidden md:flex items-center justify-center p-8 bg-primary-light bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-bold">AgroGestão</h1>
          <h2 className="text-2xl font-medium">Sistema Completo de Gestão Agrícola</h2>
          <p className="text-lg opacity-90">
            Controle completo das suas propriedades rurais, produções, 
            insumos e finanças em uma única plataforma.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-start space-x-2">
              <i className="ri-plant-line text-2xl"></i>
              <div>
                <h3 className="font-bold">Gestão de Produção</h3>
                <p className="text-sm opacity-80">Planeje e acompanhe todas as suas culturas</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <i className="ri-money-dollar-circle-line text-2xl"></i>
              <div>
                <h3 className="font-bold">Controle Financeiro</h3>
                <p className="text-sm opacity-80">Monitore receitas, custos e lucratividade</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <i className="ri-store-2-line text-2xl"></i>
              <div>
                <h3 className="font-bold">Gestão de Insumos</h3>
                <p className="text-sm opacity-80">Controle seu estoque e uso de recursos</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <i className="ri-bar-chart-2-line text-2xl"></i>
              <div>
                <h3 className="font-bold">Relatórios</h3>
                <p className="text-sm opacity-80">Dados e análises para melhores decisões</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
