import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { executeOperation } from "@/lib/hasura";
import { queryClient } from "@/lib/queryClient";
import { Lot } from "@/lib/types";
import { GET_LOTS, CREATE_LOT, UPDATE_LOT, DELETE_LOT } from "@/graphql/lot-operations";
import { format } from "date-fns";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, Loader2, CalendarIcon } from "lucide-react";

// Esquema para validação do formulário de lote
const lotSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  description: z.string().optional(),
  area: z.coerce.number().min(0, { message: "Área deve ser um número positivo" }),
  sector_id: z.coerce.number().min(1, { message: "Setor é obrigatório" }),
  crop_id: z.coerce.number().nullable().optional(),
  planting_date: z.date().nullable().optional(),
  harvest_date: z.date().nullable().optional(),
  status: z.string().optional(),
});

type LotFormValues = z.infer<typeof lotSchema>;

export default function LotsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentLot, setCurrentLot] = useState<Lot | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);

  // Fetch de lotes
  const { data: lots, isLoading } = useQuery({
    queryKey: ["/api/lots", selectedSectorId],
    queryFn: async () => {
      const result = await executeOperation<{ lots: Lot[] }>(
        GET_LOTS,
        { sectorId: selectedSectorId }
      );
      return result.lots;
    },
  });

  // Fetch de setores para o select
  const { data: sectors } = useQuery({
    queryKey: ["/api/sectors"],
    queryFn: async () => {
      const result = await executeOperation<{ 
        sectors: Array<{ 
          id: number; 
          name: string;
          farm: { name: string } 
        }> 
      }>(
        `query GetSectors {
          sectors {
            id
            name
            farm {
              name
            }
          }
        }`
      );
      return result.sectors;
    },
  });

  // Fetch de culturas para o select
  const { data: crops } = useQuery({
    queryKey: ["/api/crops"],
    queryFn: async () => {
      const result = await executeOperation<{ 
        crops: Array<{ 
          id: number; 
          name: string;
          variety: string | null;
        }> 
      }>(
        `query GetCrops {
          crops {
            id
            name
            variety
          }
        }`
      );
      return result.crops;
    },
  });

  // Mutation para adicionar lote
  const addLotMutation = useMutation({
    mutationFn: async (data: LotFormValues) => {
      // Convertendo as datas para o formato ISO 8601
      const formattedData = {
        ...data,
        planting_date: data.planting_date ? data.planting_date.toISOString() : null,
        harvest_date: data.harvest_date ? data.harvest_date.toISOString() : null,
      };
      
      return await executeOperation(CREATE_LOT, {
        lot: formattedData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lots"] });
      setIsAddDialogOpen(false);
      addForm.reset();
      toast({
        title: "Lote adicionado",
        description: "O lote foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar lote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar lote
  const updateLotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: LotFormValues }) => {
      // Convertendo as datas para o formato ISO 8601
      const formattedData = {
        ...data,
        planting_date: data.planting_date ? data.planting_date.toISOString() : null,
        harvest_date: data.harvest_date ? data.harvest_date.toISOString() : null,
      };
      
      return await executeOperation(UPDATE_LOT, {
        id,
        lot: formattedData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lots"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: "Lote atualizado",
        description: "O lote foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar lote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para excluir lote
  const deleteLotMutation = useMutation({
    mutationFn: async (id: number) => {
      return await executeOperation(DELETE_LOT, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lots"] });
      toast({
        title: "Lote excluído",
        description: "O lote foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir lote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form para adicionar lote
  const addForm = useForm<LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      name: "",
      description: "",
      area: 0,
      sector_id: 0,
      crop_id: null,
      planting_date: null,
      harvest_date: null,
      status: "planejado",
    },
  });

  // Form para editar lote
  const editForm = useForm<LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      name: "",
      description: "",
      area: 0,
      sector_id: 0,
      crop_id: null,
      planting_date: null,
      harvest_date: null,
      status: "planejado",
    },
  });

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "plantado":
        return "bg-green-100 text-green-800 border-green-300";
      case "em_crescimento":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "pronto_para_colheita":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "colhido":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "problemas":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  // Função para formatar o status para exibição
  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      planejado: "Planejado",
      plantado: "Plantado",
      em_crescimento: "Em Crescimento",
      pronto_para_colheita: "Pronto para Colheita",
      colhido: "Colhido",
      problemas: "Com Problemas",
    };
    return statusMap[status] || status;
  };

  // Função para abrir o dialog de edição
  const handleEdit = (lot: Lot) => {
    setCurrentLot(lot);
    
    // Converter strings ISO para objetos Date
    const planting_date = lot.planting_date ? new Date(lot.planting_date) : null;
    const harvest_date = lot.harvest_date ? new Date(lot.harvest_date) : null;
    
    editForm.reset({
      name: lot.name,
      description: lot.description || "",
      area: lot.area || 0,
      sector_id: lot.sector_id,
      crop_id: lot.crop_id,
      planting_date,
      harvest_date,
      status: lot.status || "planejado",
    });
    setIsEditDialogOpen(true);
  };

  // Função para confirmar exclusão
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este lote?")) {
      deleteLotMutation.mutate(id);
    }
  };

  // Função para envio do formulário de adição
  const onAddSubmit = (data: LotFormValues) => {
    addLotMutation.mutate(data);
  };

  // Função para envio do formulário de edição
  const onEditSubmit = (data: LotFormValues) => {
    if (currentLot) {
      updateLotMutation.mutate({ id: currentLot.id, data });
    }
  };

  // Filtrar lotes com base no termo de busca
  const filteredLots = lots?.filter((lot) =>
    lot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lot.description && lot.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lot.sector?.name && lot.sector.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (lot.crop?.name && lot.crop.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Função para formatar data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return "-";
    }
  };

  // Renderização de estado de carregamento
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gestão de Lotes</h1>
          <p className="text-slate-500">
            Cadastre e gerencie os lotes de produção
          </p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lote
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Lotes Cadastrados</CardTitle>
              <CardDescription>
                Lista de lotes disponíveis no sistema
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={selectedSectorId?.toString() || ""}
                onValueChange={(value) => setSelectedSectorId(value ? Number(value) : null)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os setores</SelectItem>
                  {sectors?.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id.toString()}>
                      {sector.name} - {sector.farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar lotes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLots && filteredLots.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Setor/Fazenda</TableHead>
                  <TableHead>Cultura</TableHead>
                  <TableHead>Área (ha)</TableHead>
                  <TableHead>Plantio/Colheita</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{lot.name}</TableCell>
                    <TableCell>
                      {lot.sector ? (
                        <>
                          {lot.sector.name}
                          <div className="text-xs text-slate-500">
                            {lot.sector.farm?.name}
                          </div>
                        </>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {lot.crop ? (
                        <>
                          {lot.crop.name}
                          {lot.crop.variety && (
                            <div className="text-xs text-slate-500">
                              {lot.crop.variety}
                            </div>
                          )}
                        </>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{lot.area ? `${Number(lot.area).toFixed(2)}` : "-"}</TableCell>
                    <TableCell>
                      <div className="whitespace-nowrap">
                        {formatDate(lot.planting_date)}
                        {lot.planting_date && lot.harvest_date && " → "}
                        {formatDate(lot.harvest_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lot.status && (
                        <Badge className={getStatusColor(lot.status)}>
                          {formatStatus(lot.status)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(lot)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lot.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "Nenhum lote encontrado para esta busca." : "Nenhum lote cadastrado."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de adicionar lote */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Lote</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do lote a ser adicionado.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="sector_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectors?.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id.toString()}>
                            {sector.name} - {sector.farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Lote*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Lote 01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (hectares)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 1.5" {...field} />
                      </FormControl>
                      <FormDescription>Área em hectares</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planejado">Planejado</SelectItem>
                          <SelectItem value="plantado">Plantado</SelectItem>
                          <SelectItem value="em_crescimento">Em Crescimento</SelectItem>
                          <SelectItem value="pronto_para_colheita">Pronto para Colheita</SelectItem>
                          <SelectItem value="colhido">Colhido</SelectItem>
                          <SelectItem value="problemas">Com Problemas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addForm.control}
                name="crop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma cultura" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {crops?.map((crop) => (
                          <SelectItem key={crop.id} value={crop.id.toString()}>
                            {crop.name} {crop.variety ? `(${crop.variety})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="planting_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Plantio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date) => field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="harvest_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Colheita</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date) => field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Lote para plantio de milho"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={addLotMutation.isPending}>
                  {addLotMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Lote
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de editar lote */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Lote</DialogTitle>
            <DialogDescription>
              Atualize as informações do lote.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="sector_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectors?.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id.toString()}>
                            {sector.name} - {sector.farm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Lote*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Lote 01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="area"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (hectares)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Ex: 1.5" {...field} />
                      </FormControl>
                      <FormDescription>Área em hectares</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planejado">Planejado</SelectItem>
                          <SelectItem value="plantado">Plantado</SelectItem>
                          <SelectItem value="em_crescimento">Em Crescimento</SelectItem>
                          <SelectItem value="pronto_para_colheita">Pronto para Colheita</SelectItem>
                          <SelectItem value="colhido">Colhido</SelectItem>
                          <SelectItem value="problemas">Com Problemas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="crop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma cultura" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {crops?.map((crop) => (
                          <SelectItem key={crop.id} value={crop.id.toString()}>
                            {crop.name} {crop.variety ? `(${crop.variety})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="planting_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Plantio</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date) => field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="harvest_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Colheita</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione a data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date) => field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Lote para plantio de milho"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateLotMutation.isPending}>
                  {updateLotMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}