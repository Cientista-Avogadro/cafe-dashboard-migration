import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { graphqlRequest } from "@/lib/queryClient";
import { INSERT_PROPRIEDADE } from "@/graphql/operations";

const farmSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  localizacao: z.string().min(2, "Localização obrigatória"),
  tamanho: z.string().min(1, "Tamanho obrigatório"),
  nif: z.string().min(1, "NIF obrigatório"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export default function RegisterFarmPage() {
  const [_, setLocation] = useLocation();
  const form = useForm({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      nome: "",
      localizacao: "",
      tamanho: "",
      nif: "",
      latitude: "",
      longitude: "",
    },
  });

  const onSubmit = async (values: any) => {
    try {
      await graphqlRequest("INSERT_PROPRIEDADE", { propriedade: values });
      setLocation("/");
    } catch (error) {
      alert("Erro ao cadastrar fazenda");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cadastro da Fazenda</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Fazenda</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome da fazenda" {...field} />
                    </FormControl>
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
                      <Input placeholder="Digite a localização" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tamanho"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho (ha)</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o tamanho em hectares" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIF</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o NIF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a latitude" {...field} />
                    </FormControl>
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
                      <Input placeholder="Digite a longitude" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">Cadastrar Fazenda</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
