import { useState, useEffect, lazy, Suspense } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Sector } from "@/lib/types";
import { graphqlRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from "@/components/ui";
import { ArrowLeft, MapPin, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { LocationMap } from "@/components/map/LocationMap";

const editFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  area: z.number().min(0, "Área deve ser maior que 0"),
  descricao: z.string().optional(),
  observacao: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

// Fix for default marker icon
const icon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Lazy load the map component
const Map = lazy(() => import('@/components/map/SectorMap'));

export default function SectorDetailsPage() {
  const [, params] = useRoute<{ id: string }>("/setores/:id");
  const id = params?.id;
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Query para buscar detalhes do setor
  const { data, isLoading } = useQuery<{ setores_by_pk: Sector }>({
    queryKey: ["setor", id],
    queryFn: async () => {
      if (!id) throw new Error("ID do setor não fornecido");
      return await graphqlRequest("GET_SECTOR_BY_ID", { id: id });
    },
    enabled: !!id
  });

  const setor = data?.setores_by_pk;

  // Formulário de edição
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      nome: "",
      area: 0,
      descricao: "",
      observacao: "",
      latitude: undefined,
      longitude: undefined,
    },
  });

  // Mutation para atualizar setor
  const updateSectorMutation = useMutation({
    mutationFn: async (data: EditFormValues & { id: string }) => {
      return await graphqlRequest("UPDATE_SECTOR", {
        id: data.id,
        setor: {
          nome: data.nome,
          area: data.area,
          descricao: data.descricao,
          observacao: data.observacao,
          latitude: data.latitude,
          longitude: data.longitude,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setor", id] });
      setIsEditDialogOpen(false);
      toast({
        title: "Setor atualizado",
        description: "O setor foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar setor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onEditSubmit = async (data: EditFormValues) => {
    try {
      await updateSectorMutation.mutateAsync({
        id: id as string,
        ...data,
      });
    } catch (error) {
      console.error("Erro ao atualizar setor:", error);
    }
  };

  // Função para capturar localização
  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
          toast({
            title: "Localização capturada",
            description: "As coordenadas foram atualizadas com sucesso.",
          });
        },
        (error) => {
          toast({
            title: "Erro ao capturar localização",
            description: error.message,
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Erro",
        description: "Geolocalização não é suportada neste navegador.",
        variant: "destructive",
      });
    }
  };

  // Atualizar o formulário quando o setor for carregado
  useEffect(() => {
    if (setor) {
      form.reset({
        nome: setor.nome,
        area: setor.area,
        descricao: setor.descricao || "",
        observacao: setor.observacao || "",
        latitude: setor.latitude || undefined,
        longitude: setor.longitude || undefined,
      });
    }
  }, [setor, form]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => navigate("/setores")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold text-slate-900">Detalhes do Setor</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {setor?.nome}
          </CardTitle>
          <CardDescription>
            Informações detalhadas sobre o setor e suas características
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            <div className="space-y-4 z-0">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Identificação</h3>
                <p className="text-lg font-medium">{setor?.nome}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 ">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Área</h3>
                  <p className="text-lg font-semibold">{setor?.area} ha</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Localização</h3>
                  <p className="text-lg font-semibold">
                    {setor?.latitude && setor?.longitude ? (
                      `${setor.latitude.toFixed(6)}, ${setor.longitude.toFixed(6)}`
                    ) : (
                      "Não definida"
                    )}
                  </p>
                </div>
              </div>

              {setor?.latitude && setor?.longitude && (
                <div className="mt-4 ">
                  <LocationMap
                    latitude={setor.latitude}
                    longitude={setor.longitude}
                    title={setor.nome}
                  />
                </div>
              )}

              <div className="pt-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Editar Setor
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Descrição</h3>
                <p className="text-slate-700">
                  {setor?.descricao || "Nenhuma descrição disponível para este setor."}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Observações</h3>
                <p className="text-slate-700">
                  {setor?.observacao || "Nenhuma observação registrada para este setor."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
            <DialogDescription>
              Atualize as informações do setor.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (ha)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>Localização</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="number" step="any" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input type="number" step="any" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="outline" onClick={getCurrentLocation}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Capturar
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
