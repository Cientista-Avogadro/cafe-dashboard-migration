import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Farm } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function FarmsPage() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newFarm, setNewFarm] = useState({
    name: "",
    location: "",
    area: "",
    cultivated_area: "",
    crops: "",
    employees: ""
  });

  // Fetch farms data
  const { data: farms, isLoading } = useQuery({
    queryKey: ["/api/farms"],
    queryFn: async () => {
      // Fallback data for demonstration
      return [
        {
          id: 1,
          name: "Fazenda Boa Vista",
          location: "Uberlândia, MG",
          area: 58,
          cultivated_area: 32,
          crops: ["Milho", "Soja"],
          employees: 5,
          status: "active",
          image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          id: 2,
          name: "Fazenda Santa Luzia",
          location: "Patos de Minas, MG",
          area: 45,
          cultivated_area: 28,
          crops: ["Feijão", "Café"],
          employees: 4,
          status: "active",
          image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        },
        {
          id: 3,
          name: "Sítio Renascer",
          location: "Araxá, MG",
          area: 12,
          cultivated_area: 8,
          crops: ["Tomate", "Batata"],
          employees: 3,
          status: "active",
          image: "https://images.unsplash.com/photo-1516054575922-f0b8eeadec1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
        }
      ] as Farm[];
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFarm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convert string values to appropriate types
      const formattedFarm = {
        ...newFarm,
        area: parseFloat(newFarm.area),
        cultivated_area: parseFloat(newFarm.cultivated_area),
        crops: newFarm.crops.split(',').map(crop => crop.trim()),
        employees: parseInt(newFarm.employees),
        status: "active",
        // Default image for new farms
        image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
      };
      
      await apiRequest("POST", "/api/farms", formattedFarm);
      
      // Invalidate cache to refresh farms list
      queryClient.invalidateQueries({ queryKey: ["/api/farms"] });
      
      // Reset form and close dialog
      setNewFarm({
        name: "",
        location: "",
        area: "",
        cultivated_area: "",
        crops: "",
        employees: ""
      });
      setOpen(false);
      
      toast({
        title: "Fazenda adicionada",
        description: "A fazenda foi cadastrada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao adicionar fazenda",
        description: "Não foi possível adicionar a fazenda. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Fazendas</h1>
          <p className="text-slate-500">Gerencie suas propriedades agrícolas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <i className="ri-add-line mr-1"></i> Nova Fazenda
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Fazenda</DialogTitle>
              <DialogDescription>
                Preencha os dados da nova propriedade
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={newFarm.name}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Localização
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={newFarm.location}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="area" className="text-right">
                    Área total (ha)
                  </Label>
                  <Input
                    id="area"
                    name="area"
                    type="number"
                    value={newFarm.area}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cultivated_area" className="text-right">
                    Área cultivada (ha)
                  </Label>
                  <Input
                    id="cultivated_area"
                    name="cultivated_area"
                    type="number"
                    value={newFarm.cultivated_area}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="crops" className="text-right">
                    Culturas
                  </Label>
                  <Input
                    id="crops"
                    name="crops"
                    value={newFarm.crops}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="Milho, Soja, etc."
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employees" className="text-right">
                    Funcionários
                  </Label>
                  <Input
                    id="employees"
                    name="employees"
                    type="number"
                    value={newFarm.employees}
                    onChange={handleInputChange}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Adicionar Fazenda</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Skeleton loading state
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4">
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Array(4).fill(0).map((_, j) => (
                    <Skeleton key={j} className="h-16 w-full" />
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </Card>
          ))
        ) : (
          // Farm cards
          farms?.map((farm) => (
            <Card key={farm.id} className="overflow-hidden">
              <div className="farm-card-image">
                <img 
                  src={farm.image} 
                  alt={farm.name} 
                  className="h-full w-full object-cover"
                />
                <div className="farm-card-image-overlay">
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="success">{farm.status === 'active' ? 'Ativa' : 'Inativa'}</Badge>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{farm.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{farm.location}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 p-2 rounded-md">
                    <p className="text-xs text-slate-500">Área total</p>
                    <p className="font-medium">{farm.area} hectares</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-md">
                    <p className="text-xs text-slate-500">Área cultivada</p>
                    <p className="font-medium">{farm.cultivated_area} hectares</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-md">
                    <p className="text-xs text-slate-500">Culturas</p>
                    <p className="font-medium">{farm.crops.join(', ')}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-md">
                    <p className="text-xs text-slate-500">Funcionários</p>
                    <p className="font-medium">{farm.employees}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <i className="ri-eye-line mr-1"></i> Detalhes
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    <i className="ri-edit-line mr-1"></i> Editar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}

        {/* Add New Farm Card */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 h-full min-h-[300px] cursor-pointer hover:bg-slate-50">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <i className="ri-add-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Adicionar Nova Fazenda</h3>
              <p className="text-sm text-slate-500 text-center mb-4">Cadastre uma nova propriedade no sistema</p>
              <Button>
                <i className="ri-add-line mr-1"></i> Nova Fazenda
              </Button>
            </Card>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  );
}
