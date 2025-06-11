import { useState, useEffect, useMemo } from "react";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Planejamento, Lot, Canteiro, Crop, ProductStock } from "@/lib/types";
import { queryClient, graphqlRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Input,
  Skeleton,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Loader2, Calendar as CalendarIcon, Ban, Check, Pencil } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO, isAfter, addDays, isBefore } from "date-fns";
import { pt } from "date-fns/locale";
import { PlanningDetailButton } from "@/components/planning-detail-button";
import { useLocation } from "wouter";
import { INSERT_ATIVIDADE, UPDATE_PLANEJAMENTO } from "@/graphql/operations";
import { executeOperation } from "@/lib/hasura";

const planejamentoSchema = z.object({
  cultura_id: z.string().uuid("ID da cultura inválido"),
  lote_id: z.string().uuid("ID do lote inválido").optional(),
  canteiro_id: z.string().uuid("ID do canteiro inválido").optional(),
  data_inicio: z.string().min(1, "Data de início é obrigatória"),
  data_fim_prevista: z.string().min(1, "Data de fim prevista é obrigatória"),
  status: z.string().optional(),
  area_plantada: z.number().min(0, "Área plantada deve ser maior que zero").optional(),
  produtividade_esperada: z.number().min(0, "Produtividade esperada deve ser maior que zero").optional(),
  insumos: z.array(
    z.object({
      produto_id: z.string().uuid("ID do produto inválido"),
      quantidade: z.number().min(0, "Quantidade deve ser maior que zero"),
      unidade: z.string().optional(),
    })
  ).optional(),
});

// Schema estendido para edição, incluindo o ID
const planejamentoEditSchema = planejamentoSchema.extend({
  id: z.string().uuid("ID do planejamento inválido")
});

type PlanejamentoFormValues = z.infer<typeof planejamentoSchema>;

export default function PlanningPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPlanejamento, setSelectedPlanejamento] = useState<Planejamento | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<'grid' | 'table'>('grid');
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [selectedCanteiroId, setSelectedCanteiroId] = useState<string | null>(null);
  const [selectedInsumos, setSelectedInsumos] = useState<Array<{
    produto_id: string;
    nome: string;
    quantidade: number;
    unidade: string;
    preco_unitario?: number;
    custo_total?: number;
    dose_por_hectare?: number;
  }>>([]);
  const [isInsumoDialogOpen, setIsInsumoDialogOpen] = useState(false);
  const [insumoToAdd, setInsumoToAdd] = useState<{
    produto_id: string;
    quantidade: number;
    unidade: string;
    preco_unitario?: number;
    custo_total?: number;
    dose_por_hectare?: number;
  }>({ produto_id: "", quantidade: 1, unidade: "" });

  // Form para o dialog de insumos (evita erro de context)
  const insumoForm = useForm();

  // Query para buscar culturas para o dropdown
  const { data: culturasData } = useQuery<{ culturas: Array<{ id: string; nome: string; ciclo_estimado_dias?: number }> }>({
    queryKey: ["culturas", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { culturas: [] };
      const response = await graphqlRequest("GET_ALL_CULTURAS", { propriedade_id: user.propriedade_id });
      return response;
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar setores para o dropdown
  const { data: setoresData } = useQuery<{ setores: Array<{ id: string; nome: string }> }>({
    queryKey: ["setores", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { setores: [] };
      return await graphqlRequest("GET_SETORES", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar lotes para o dropdown
  const { data: lotesData } = useQuery<{ lotes: Lot[] }>({
    queryKey: ["all-lotes", user?.propriedade_id, setoresData],
    queryFn: async () => {
      if (!user?.propriedade_id) return { lotes: [] };
      // Aqui precisaríamos de uma query para buscar todos os lotes da propriedade
      const allLotes: Lot[] = [];
      if (setoresData?.setores) {
        for (const setor of setoresData.setores) {
          const result = await graphqlRequest("GET_LOTES", { setor_id: setor.id });
          if (result.lotes) {
            result.lotes.forEach((lote: Lot) => {
              allLotes.push({
                ...lote,
                setor_nome: setor.nome
              });
            });
          }
        }
      }
      return { lotes: allLotes };
    },
    enabled: !!user?.propriedade_id && !!setoresData?.setores,
  });

  // Query para buscar canteiros para o dropdown
  const { data: canteirosData } = useQuery<{ canteiros: Canteiro[] }>({
    queryKey: ["all-canteiros", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { canteiros: [] };
      // Apenas passamos propriedade_id para evitar o erro de uuid null
      const result = await graphqlRequest("GET_CANTEIROS", {
        propriedade_id: user.propriedade_id
      });
      return result;
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar insumos (produtos em estoque) para o dropdown
  const { data: insumosData } = useQuery<{ produtos_estoque: ProductStock[] }>({
    queryKey: ["produtos_estoque", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { produtos_estoque: [] };
      return await graphqlRequest("GET_PRODUTOS_ESTOQUE", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Query para buscar todos os planejamentos da propriedade
  const { data: allPlanejamentosData, isLoading: isAllPlanejamentosLoading } = useQuery<{ planejamentos: Planejamento[] }>({
    queryKey: ["all-planejamentos", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { planejamentos: [] };

      try {
        // Buscar todos os planejamentos da propriedade com apenas o filtro de propriedade_id
        const result = await graphqlRequest("GET_PLANEJAMENTOS", {
          propriedade_id: user.propriedade_id
        });

        if (!result.planejamentos) return { planejamentos: [] };

        // Adicionar informações de cultura, lote e canteiro para exibição
        if (culturasData?.culturas) {
          result.planejamentos.forEach((planejamento: Planejamento) => {
            // Adicionar cultura
            const cultura = culturasData.culturas.find(c => c.id === planejamento.cultura_id);
            if (cultura) {
              planejamento.cultura = cultura;
            }

            // Adicionar lote
            if (planejamento.lote_id && lotesData?.lotes) {
              const lote = lotesData.lotes.find(l => l.id === planejamento.lote_id);
              if (lote) {
                planejamento.lote = lote;
              }
            }

            // Adicionar canteiro
            if (planejamento.canteiro_id && canteirosData?.canteiros) {
              const canteiro = canteirosData.canteiros.find(c => c.id === planejamento.canteiro_id);
              if (canteiro) {
                planejamento.canteiro = canteiro;
              }
            }
          });
        }

        return result;
      } catch (error) {
        console.error("Erro ao buscar planejamentos:", error);
        return { planejamentos: [] };
      }
    },
    enabled: !!user?.propriedade_id && !!culturasData?.culturas && !!lotesData?.lotes && !!canteirosData?.canteiros,
  });

  // Derivar planejamentos de lotes a partir de allPlanejamentosData
  const lotePlanejamentosData = useMemo(() => {
    if (!allPlanejamentosData?.planejamentos || !selectedLoteId) return { planejamentos: [] };
    return {
      planejamentos: allPlanejamentosData.planejamentos.filter(p => p.lote_id === selectedLoteId)
    };
  }, [allPlanejamentosData, selectedLoteId]);

  // Derivar planejamentos de canteiros a partir de allPlanejamentosData
  const canteiroPlanejamentosData = useMemo(() => {
    if (!allPlanejamentosData?.planejamentos || !selectedCanteiroId) return { planejamentos: [] };
    return {
      planejamentos: allPlanejamentosData.planejamentos.filter(p => p.canteiro_id === selectedCanteiroId)
    };
  }, [allPlanejamentosData, selectedCanteiroId]);

  // Flags de carregamento derivados
  const isLotePlanejamentosLoading = isAllPlanejamentosLoading;
  const isCanteiroPlanejamentosLoading = isAllPlanejamentosLoading;

  // Query para buscar colheitas
  const { data: colheitasData } = useQuery<{ colheitas: Array<{ id: string; planejamento_id: string; quantidade_colhida: number }> }>({
    queryKey: ["colheitas", user?.propriedade_id],
    queryFn: async () => {
      if (!user?.propriedade_id) return { colheitas: [] };
      return await graphqlRequest("GET_COLHEITAS_BY_PROPRIEDADE", { propriedade_id: user.propriedade_id });
    },
    enabled: !!user?.propriedade_id,
  });

  // Função para calcular a percentagem de colheita
  const calcularPercentagemColheita = (planejamento: Planejamento) => {
    if (!planejamento.area_plantada || !planejamento.produtividade_esperada) return 0;

    const quantidadeTotalEsperada = planejamento.area_plantada * planejamento.produtividade_esperada;
    if (quantidadeTotalEsperada === 0) return 0;

    const colheitasDoPlanejamento = colheitasData?.colheitas.filter(
      c => c.planejamento_id === planejamento.id
    ) || [];

    const quantidadeTotalColhida = colheitasDoPlanejamento.reduce(
      (acc, colheita) => acc + colheita.quantidade_colhida,
      0
    );

    return Math.min(Math.round((quantidadeTotalColhida / quantidadeTotalEsperada) * 100), 100);
  };

  // Função para obter os planejamentos com percentagem de colheita
  const getPlanejamentosComPercentagem = () => {
    return getPlanejamentos().map(planejamento => ({
      ...planejamento,
      percentagem_colheita: calcularPercentagemColheita(planejamento)
    }));
  };

  // Mutation para adicionar planejamento
  const addPlanejamentoMutation = useMutation({
    mutationFn: async (data: PlanejamentoFormValues) => {
      if (!user?.propriedade_id) {
        throw new Error("Usuário não possui propriedade associada");
      }

      // Encontrar o setor_id se um lote foi selecionado
      let setor_id = undefined;
      if (data.lote_id) {
        const lote = lotesData?.lotes?.find(l => l.id === data.lote_id);
        setor_id = lote?.setor_id;
      }

      const planejamentoData = {
        cultura_id: data.cultura_id,
        lote_id: data.lote_id,
        canteiro_id: data.canteiro_id,
        data_inicio: data.data_inicio,
        data_fim_prevista: data.data_fim_prevista,
        status: data.status || "Planejado",
        propriedade_id: user.propriedade_id,
        setor_id: setor_id,
        area_plantada: data.area_plantada,
        produtividade_esperada: data.produtividade_esperada
      };

      // Inserimos o planejamento
      const result = await graphqlRequest("INSERT_PLANEJAMENTO", { planejamento: planejamentoData });

      // Verificamos se o planejamento foi criado com sucesso e tem um ID
      if (result?.insert_planejamentos_one?.id && selectedInsumos.length > 0) {
        const planejamentoId = result.insert_planejamentos_one.id;

        // Preparamos os dados dos insumos para inserção
        const insumosPromises = selectedInsumos.map(async insumo => {
          const insumoData = {
            planejamento_id: planejamentoId,
            produto_id: insumo.produto_id,
            quantidade: insumo.quantidade,
            unidade: insumo.unidade,
            observacoes: `Preço unitário: R$ ${insumo.preco_unitario?.toFixed(2) || '0.00'}`,
            data_uso: data.data_inicio,
          };

          // Chamada para inserir cada insumo na tabela de relacionamento
          await graphqlRequest("INSERT_PLANEJAMENTO_INSUMO", { insumo: insumoData });

          // Atualizar estoque do produto
          const produtoInfo = insumosData?.produtos_estoque.find(p => p.id === insumo.produto_id);
          if (produtoInfo && typeof produtoInfo.quantidade === 'number') {
            // Atualizar quantidade em estoque
            const novaQuantidade = Math.max(0, produtoInfo.quantidade - insumo.quantidade);
            await graphqlRequest("UPDATE_PRODUTO_ESTOQUE", {
              id: insumo.produto_id,
              produto: { quantidade: novaQuantidade }
            });

            // Registrar movimentação no estoque
            await graphqlRequest("INSERT_MOVIMENTACAO_ESTOQUE", {
              movimentacao: {
                produto_id: insumo.produto_id,
                tipo: "saida",
                quantidade: insumo.quantidade,
                data: data.data_inicio,
                descricao: `Uso no planejamento: ${culturasData?.culturas.find(c => c.id === data.cultura_id)?.nome || 'Cultura'}`
              }
            });
          }
        });

        // Aguardamos todas as inserções de insumos
        await Promise.all(insumosPromises);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-planejamentos"] });
      queryClient.invalidateQueries({ queryKey: ["planejamentos-lote"] });
      queryClient.invalidateQueries({ queryKey: ["planejamentos-canteiro"] });
      queryClient.invalidateQueries({ queryKey: ["produtos_estoque"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Planejamento adicionado",
        description: "O planejamento foi adicionado com sucesso.",
      });
      addForm.reset();
      insumoForm.reset();
      setSelectedInsumos([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Erro ao adicionar planejamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Formulário para adicionar planejamento
  const addForm = useForm<PlanejamentoFormValues>({
    resolver: zodResolver(planejamentoSchema),
    defaultValues: {
      cultura_id: "",
      lote_id: selectedTab === 'grid' ? selectedLoteId || undefined : undefined,
      canteiro_id: selectedTab === 'grid' ? selectedCanteiroId || undefined : undefined,
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim_prevista: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      status: "Planejado",
    },
  });

  // Atualizar valores padrão quando mudar a aba ou seleção
  useEffect(() => {
    if (selectedTab === 'grid') {
      addForm.setValue('lote_id', selectedLoteId || undefined);
      addForm.setValue('canteiro_id', selectedCanteiroId || undefined);
    } else {
      addForm.setValue('canteiro_id', undefined);
      addForm.setValue('lote_id', undefined);
    }
  }, [selectedTab, selectedLoteId, selectedCanteiroId, addForm]);

  // Função de submit do formulário de adição
  const onAddSubmit = (data: PlanejamentoFormValues) => {
    addPlanejamentoMutation.mutate(data);
  };

  // Mutation para editar um planejamento
  const editPlanejamentoMutation = useMutation({
    mutationFn: async (data: PlanejamentoFormValues & { id: string }) => {
      if (!user?.propriedade_id) {
        throw new Error("Usuário não possui propriedade associada");
      }

      try {
        // Encontrar o setor_id se um lote foi selecionado
        let setor_id = undefined;
        if (data.lote_id) {
          const lote = lotesData?.lotes?.find(l => l.id === data.lote_id);
          setor_id = lote?.setor_id;
        }

        // Garantir que apenas um dos campos (lote_id ou canteiro_id) esteja preenchido
        const lote_id = selectedTab === 'grid' ? data.lote_id : null;
        const canteiro_id = selectedTab === 'grid' ? data.canteiro_id : null;

        const planejamentoData = {
          cultura_id: data.cultura_id,
          lote_id: lote_id,
          canteiro_id: canteiro_id,
          data_inicio: data.data_inicio,
          data_fim_prevista: data.data_fim_prevista,
          status: data.status,
          propriedade_id: user.propriedade_id,
          setor_id: setor_id,
          area_plantada: data.area_plantada,
          produtividade_esperada: data.produtividade_esperada
        };

        // Usar uma abordagem mais direta para a chamada GraphQL
        const response = await graphqlRequest("UPDATE_PLANEJAMENTO", {
          id: data.id,
          planejamento: planejamentoData
        });

        // Atualizar os insumos do planejamento
        if (selectedInsumos.length > 0) {
          // Primeiro, buscar os insumos existentes para calcular as diferenças
          const insumosExistentes = await graphqlRequest("GET_PLANEJAMENTO_INSUMOS", {
            planejamento_id: data.id
          });

          // Excluir todos os insumos existentes
          await graphqlRequest("DELETE_PLANEJAMENTO_INSUMOS", {
            planejamento_id: data.id
          });

          // Inserir os novos insumos e atualizar o estoque
          const insumosPromises = selectedInsumos.map(async insumo => {
            const insumoData = {
              planejamento_id: data.id,
              produto_id: insumo.produto_id,
              quantidade: insumo.quantidade,
              unidade: insumo.unidade,
              observacoes: `Preço unitário: R$ ${insumo.preco_unitario?.toFixed(2) || '0.00'}`
            };

            // Inserir o novo insumo
            await graphqlRequest("INSERT_PLANEJAMENTO_INSUMO", { insumo: insumoData });

            // Encontrar o insumo existente correspondente
            const insumoExistente = insumosExistentes?.planejamentos_insumos?.find(
              (i: any) => i.produto_id === insumo.produto_id
            );

            // Calcular a diferença na quantidade
            const quantidadeAntiga = insumoExistente?.quantidade || 0;
            const diferencaQuantidade = insumo.quantidade - quantidadeAntiga;

            if (diferencaQuantidade !== 0) {
              // Atualizar estoque do produto
              const produtoInfo = insumosData?.produtos_estoque.find(p => p.id === insumo.produto_id);
              if (produtoInfo && typeof produtoInfo.quantidade === 'number') {
                // Atualizar quantidade em estoque
                const novaQuantidade = Math.max(0, produtoInfo.quantidade - diferencaQuantidade);
                await graphqlRequest("UPDATE_PRODUTO_ESTOQUE", {
                  id: insumo.produto_id,
                  produto: { quantidade: novaQuantidade }
                });

                // Registrar movimentação no estoque
                await graphqlRequest("INSERT_MOVIMENTACAO_ESTOQUE", {
                  movimentacao: {
                    produto_id: insumo.produto_id,
                    tipo: diferencaQuantidade > 0 ? "saida" : "entrada",
                    quantidade: Math.abs(diferencaQuantidade),
                    data: data.data_inicio,
                    descricao: `Ajuste no planejamento: ${culturasData?.culturas.find(c => c.id === data.cultura_id)?.nome || 'Cultura'}`
                  }
                });
              }
            }
          });

          await Promise.all(insumosPromises);
        }

        return response;
      } catch (error) {
        console.error("Erro ao atualizar planejamento:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-planejamentos"] });
      queryClient.invalidateQueries({ queryKey: ["produtos_estoque"] });
      setIsEditDialogOpen(false);
      setSelectedPlanejamento(null);
      toast({
        title: "Planejamento atualizado",
        description: "O planejamento foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar planejamento",
        description: error.message || "Ocorreu um erro ao atualizar o planejamento.",
        variant: "destructive",
      });
    },
  });

  // Form para edição
  const editForm = useForm<PlanejamentoFormValues & { id: string }>({
    resolver: zodResolver(planejamentoEditSchema),
    defaultValues: {
      id: "",
      cultura_id: "",
      lote_id: "",
      canteiro_id: "",
      status: "Planejado",
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim_prevista: new Date().toISOString().split('T')[0],
    },
  });

  const handleEditClick = async (planejamento: Planejamento) => {
    setSelectedPlanejamento(planejamento);

    // Limpar os insumos selecionados antes de carregar os novos
    setSelectedInsumos([]);

    // Carregar os insumos associados a este planejamento
    try {
      const insumosResult = await graphqlRequest("GET_PLANEJAMENTO_INSUMOS", {
        planejamento_id: planejamento.id
      });

      if (insumosResult?.planejamentos_insumos?.length > 0) {
        // Buscar os produtos do estoque para obter informações adicionais
        const produtosIds = insumosResult.planejamentos_insumos.map((insumo: any) => insumo.produto_id);
        let produtosMap: Record<string, any> = {};

        try {
          // Tentar buscar os produtos do estoque para complementar as informações
          if (insumosData?.produtos_estoque) {
            produtosMap = insumosData.produtos_estoque.reduce((acc: Record<string, any>, produto: any) => {
              acc[produto.id] = produto;
              return acc;
            }, {});
          }
        } catch (err) {
          console.warn("Não foi possível buscar informações detalhadas dos produtos", err);
        }

        // Converter para o formato usado pelo estado selectedInsumos
        const insumosFormatados = insumosResult.planejamentos_insumos.map((insumo: any) => {
          const produto = produtosMap[insumo.produto_id] || {};
          const preco_unitario = produto?.preco_unitario || 0;
          const quantidade = insumo.quantidade || 0;

          return {
            produto_id: insumo.produto_id,
            nome: produto?.nome || 'Produto não encontrado',
            quantidade: quantidade,
            unidade: insumo.unidade || produto?.unidade || 'un',
            preco_unitario: preco_unitario,
            custo_total: preco_unitario * quantidade,
            dose_por_hectare: produto?.dose_por_hectare
          };
        });

        // Atualizar o estado com os insumos carregados
        setSelectedInsumos(insumosFormatados);
      }

      // Atualizar o formulário com os dados do planejamento
      editForm.reset({
        id: planejamento.id,
        cultura_id: planejamento.cultura_id,
        lote_id: planejamento.lote_id || "",
        canteiro_id: planejamento.canteiro_id || "",
        status: planejamento.status || "Planejado",
        data_inicio: planejamento.data_inicio.split('T')[0],
        data_fim_prevista: planejamento.data_fim_prevista.split('T')[0],
        area_plantada: planejamento.area_plantada || undefined,
        produtividade_esperada: planejamento.produtividade_esperada || undefined,
      });

      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Erro ao carregar insumos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os insumos do planejamento.",
        variant: "destructive",
      });
    }
  };

  const handleRowClick = (id: string) => {
    setLocation(`/producao/${id}`);
  };

  const onEditSubmit = (data: PlanejamentoFormValues & { id: string }) => {
    console.log("Dados do formulário de edição:", data);
    editPlanejamentoMutation.mutate(data);
  };

  // Mutation para excluir um planejamento
  const deletePlanejamentoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await graphqlRequest("DELETE_PLANEJAMENTO", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-planejamentos"] });
      queryClient.invalidateQueries({ queryKey: ["planejamentos-lote"] });
      queryClient.invalidateQueries({ queryKey: ["planejamentos-canteiro"] });
      setIsDeleteDialogOpen(false);
      setSelectedPlanejamento(null);
      toast({
        title: "Planejamento excluído",
        description: "O planejamento foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir planejamento",
        description: error.message || "Ocorreu um erro ao excluir o planejamento.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (planejamento: Planejamento) => {
    setSelectedPlanejamento(planejamento);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPlanejamento) {
      deletePlanejamentoMutation.mutate(selectedPlanejamento.id);
    }
  };

  // Filtrar planejamentos com base no termo de busca
  const getPlanejamentos = () => {
    if (selectedTab === 'grid' && selectedLoteId) {
      return lotePlanejamentosData?.planejamentos || [];
    } else if (selectedTab === 'grid' && selectedCanteiroId) {
      return canteiroPlanejamentosData?.planejamentos || [];
    } else {
      return allPlanejamentosData?.planejamentos || [];
    }
  };

  const filteredPlanejamentos = getPlanejamentos().filter((planejamento) => {
    if (!planejamento) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (planejamento.cultura?.nome?.toLowerCase() || '').includes(searchLower) ||
      (planejamento.lote?.nome?.toLowerCase() || '').includes(searchLower) ||
      (planejamento.canteiro?.nome?.toLowerCase() || '').includes(searchLower) ||
      (planejamento.status?.toLowerCase() || '').includes(searchLower)
    );
  });

  // Add the status update mutation
  const updatePlanejamentoStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await graphqlRequest("UPDATE_PLANEJAMENTO", {
        id,
        planejamento: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-planejamentos"] });
    },
  });

  // Add the function to check and update planning status
  const checkAndUpdatePlanningStatus = async (planejamento: Planejamento) => {
    const hoje = new Date();
    const dataFim = new Date(planejamento.data_fim_prevista);
    
    if (planejamento.status === 'Em andamento' && isBefore(dataFim, hoje)) {
      try {
        await executeOperation(UPDATE_PLANEJAMENTO, {
          id: planejamento.id,
          planejamento: { status: 'Concluído' }
        });
        
        // Criar atividade de conclusão
        await executeOperation(INSERT_ATIVIDADE, {
          atividade: {
            tipo: "Conclusão de Planejamento",
            data_prevista: hoje.toISOString(),
            observacoes: `Planejamento concluído para ${planejamento.cultura?.nome || 'cultura'} em ${planejamento.lote?.nome || planejamento.canteiro?.nome || 'área'}`,
            planejamento_id: planejamento.id,
            propriedade_id: planejamento.propriedade_id
          }
        });
      } catch (error) {
        console.error("Erro ao atualizar status do planejamento:", error);
      }
    } else {
      // Verificar se precisa criar atividade de colheita
      await checkAndCreateHarvestActivities(planejamento);
    }
  };

  // Add useEffect to check planning status periodically
  useEffect(() => {
    // Função para verificar todos os planejamentos
    const checkAllPlanejamentos = async () => {
      if (!allPlanejamentosData?.planejamentos) return;

      for (const planejamento of allPlanejamentosData.planejamentos) {
        await checkAndUpdatePlanningStatus(planejamento);
      }
    };

    // Verificar imediatamente ao carregar
    checkAllPlanejamentos();

    // Configurar verificação periódica (a cada hora)
    const intervalId = setInterval(checkAllPlanejamentos, 60 * 60 * 1000);

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, [allPlanejamentosData?.planejamentos]);

  // Add status badge component
  const StatusBadge = ({ status }: { status?: string }) => {
    const getStatusStyle = (status: string = 'planejado') => {
      switch (status) {
        case "em_andamento":
          return "bg-orange-100 text-orange-800"; // Laranja
        case "concluido":
          return "bg-green-100 text-green-800"; // Verde
        case "planejado":
          return "bg-amber-900 text-amber-50"; // Castanho (marrom)
        case "cancelado":
          return "bg-red-100 text-red-800"; // Vermelho
        default:
          return "bg-gray-100 text-gray-800";
      }
    };
    const getStatusText = (status: string = 'planejado') => {
      switch (status) {
        case "em_andamento":
          return "Em Andamento";
        case "concluido":
          return "Concluído";
        case "planejado":
          return "Planejado";
        case "cancelado":
          return "Cancelado";
        default:
          return status;
      }
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getStatusStyle(status)}`}>
        {getStatusText(status)}
      </span>
    );
  };

  // Corrigir mutation para usar 'planejamento'
  const cancelPlanejamentoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await graphqlRequest("UPDATE_PLANEJAMENTO", { id, planejamento: { status: "cancelado" } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-planejamentos"] });
      toast({
        title: "Planejamento cancelado",
        description: "O planejamento foi cancelado com sucesso.",
      });
      setIsCancelDialogOpen(false);
      setPlanejamentoToCancel(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar planejamento",
        description: error.message || "Ocorreu um erro ao cancelar o planejamento.",
        variant: "destructive",
      });
      setIsCancelDialogOpen(false);
      setPlanejamentoToCancel(null);
    },
  });

  const handleCancelClick = (planejamento: Planejamento) => {
    setPlanejamentoToCancel(planejamento);
    setIsCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (planejamentoToCancel) {
      cancelPlanejamentoMutation.mutate(planejamentoToCancel.id);
    }
  };

  const closeCancelDialog = () => {
    setIsCancelDialogOpen(false);
    setPlanejamentoToCancel(null);
  };

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [planejamentoToCancel, setPlanejamentoToCancel] = useState<any>(null);

  // Função para verificar e criar atividades de colheita
  const checkAndCreateHarvestActivities = async (planejamento: Planejamento) => {
    if (!planejamento.data_fim_prevista) return;

    const harvestDate = new Date(planejamento.data_fim_prevista);
    const tomorrow = addDays(new Date(), 1);
    const today = new Date();

    // Verifica se a data da colheita está entre hoje e amanhã
    if (isBefore(harvestDate, tomorrow) && isAfter(harvestDate, today)) {
      // Verifica se já existe uma atividade de alerta de colheita para este planejamento
      const existingActivities = await graphqlRequest(
        "GET_ATIVIDADES",
        { planejamento_id: planejamento.id }
      );

      const hasHarvestAlert = existingActivities?.atividades?.some(
        (activity: any) => 
          activity.tipo === 'Alerta de Colheita' && 
          activity.data_prevista === format(harvestDate, 'yyyy-MM-dd')
      );

      if (!hasHarvestAlert) {
        // Cria a atividade apenas se não existir uma atividade similar
        await graphqlRequest(
          "INSERT_ATIVIDADE",
          {
            planejamento_id: planejamento.id,
            tipo: 'Alerta de Colheita',
            data_prevista: format(harvestDate, 'yyyy-MM-dd'),
            observacoes: `Colheita prevista para ${format(harvestDate, 'dd/MM/yyyy')}`
          }
        );
      }
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex md:items-center justify-between md:flex-row flex-col space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Planejamentos</h2>
        <div className="flex items-center md:flex-row flex-col-reverse space-y-2 space-x-2 flex-wrap gap-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar planejamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button className="w-full md:w-auto" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Planejamento
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="grid"
        value={selectedTab}
        onValueChange={(value) => setSelectedTab(value as 'grid' | 'table')}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          {isAllPlanejamentosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/6" />
                      </div>
                      <Skeleton className="h-2.5 w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getPlanejamentosComPercentagem().map((planejamento) => (
                <div
                  key={planejamento.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleRowClick(planejamento.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-lg">
                        {planejamento.cultura?.nome || 'Cultura não encontrada'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(planejamento.data_inicio), 'dd/MM/yyyy')} - {format(new Date(planejamento.data_fim_prevista), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <StatusBadge status={planejamento.status} />
                  </div>

                  <div className="space-y-3 mt-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Progresso da Colheita</span>
                        <span className="text-sm font-medium">{planejamento.percentagem_colheita}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${planejamento.percentagem_colheita}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Área:</span>
                        <p className="font-medium">{planejamento.area_plantada || 0} ha</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Local:</span>
                        <p className="font-medium">
                          {planejamento.lote?.nome || planejamento.canteiro?.nome || 'Não definido'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">

                      {
                        planejamento.status !== "concluido" && (
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(planejamento)
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </div>
                        )
                      }
                      {planejamento.status === 'em_andamento' && (
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelClick(planejamento);
                            }}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cultura</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Fim Prevista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Área (ha)</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isAllPlanejamentosLoading ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : getPlanejamentos().length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhum planejamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  getPlanejamentos().map((planejamento) => (
                    <TableRow
                      key={planejamento.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(planejamento.id)}
                    >
                      <TableCell>{planejamento.cultura?.nome || 'Cultura não encontrada'}</TableCell>
                      <TableCell>{format(new Date(planejamento.data_inicio), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{format(new Date(planejamento.data_fim_prevista), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <StatusBadge status={planejamento.status} />
                      </TableCell>
                      <TableCell>{planejamento.area_plantada || 0}</TableCell>
                      <TableCell>
                        {planejamento.lote?.nome || planejamento.canteiro?.nome || 'Não definido'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">

                          {
                            planejamento.status !== "concluido" && (
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" size="sm" onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(planejamento)
                                }}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                </Button>
                              </div>
                            )
                          }
                          {planejamento.status === 'em_andamento' && (
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelClick(planejamento);
                                }}
                              >
                                <Ban className="h-4 w-4 mr-2" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para adicionar planejamento */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Planejamento</DialogTitle>
            <DialogDescription>
              Preencha as informações para adicionar um novo planejamento.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="cultura_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura*</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Selecione uma cultura</option>
                        {culturasData?.culturas?.map((cultura) => (
                          <option key={cultura.id} value={cultura.id}>
                            {cultura.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedTab === 'grid' ? (
                <FormField
                  control={addForm.control}
                  name="lote_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lote*</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ""}
                        >
                          <option value="">Selecione um lote</option>
                          {lotesData?.lotes?.map((lote) => (
                            <option key={lote.id} value={lote.id}>
                              {lote.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={addForm.control}
                  name="canteiro_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canteiro*</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ""}
                        >
                          <option value="">Selecione um canteiro</option>
                          {canteirosData?.canteiros?.map((canteiro) => (
                            <option key={canteiro.id} value={canteiro.id}>
                              {canteiro.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início*</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="data_fim_prevista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim Prevista*</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="area_plantada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área Plantada (ha)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={addForm.control}
                  name="produtividade_esperada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produtividade Esperada (t/ha)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="Planejado">Planejado</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seção de Insumos */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Insumos</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInsumoToAdd({ produto_id: "", quantidade: 1, unidade: "" });
                      setIsInsumoDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Insumo
                  </Button>
                </div>

                {selectedInsumos.length === 0 ? (
                  <div className="text-center p-4 border rounded-md bg-muted/30">
                    <p className="text-sm text-muted-foreground">Nenhum insumo selecionado</p>
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Insumo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead className="w-16">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInsumos.map((insumo, index) => (
                          <TableRow key={index}>
                            <TableCell>{insumo.nome}</TableCell>
                            <TableCell>{insumo.quantidade}</TableCell>
                            <TableCell>{insumo.unidade}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedInsumos(selectedInsumos.filter((_, i) => i !== index));
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4 text-red-500"
                                >
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addPlanejamentoMutation.isPending}>
                  {addPlanejamentoMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Adicionar Planejamento
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição de planejamento */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Planejamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do planejamento.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4">
              <input type="hidden" {...editForm.register("id")} />

              <FormField
                control={editForm.control}
                name="cultura_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura*</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">Selecione uma cultura</option>
                        {culturasData?.culturas?.map((cultura) => (
                          <option key={cultura.id} value={cultura.id}>
                            {cultura.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedTab === 'grid' ? (
                <FormField
                  control={editForm.control}
                  name="lote_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lote*</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ""}
                        >
                          <option value="">Selecione um lote</option>
                          {lotesData?.lotes?.map((lote) => (
                            <option key={lote.id} value={lote.id}>
                              {lote.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={editForm.control}
                  name="canteiro_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canteiro*</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          value={field.value || ""}
                        >
                          <option value="">Selecione um canteiro</option>
                          {canteirosData?.canteiros?.map((canteiro) => (
                            <option key={canteiro.id} value={canteiro.id}>
                              {canteiro.nome}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início*</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="data_fim_prevista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim Prevista*</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="area_plantada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área Plantada (ha)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="produtividade_esperada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produtividade Esperada (t/ha)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="Planejado">Planejado</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    console.log("Botão Salvar clicado");
                    const formData = editForm.getValues();
                    console.log("Dados do formulário:", formData);
                    editPlanejamentoMutation.mutate(formData);
                  }}
                  disabled={editPlanejamentoMutation.isPending}
                >
                  {editPlanejamentoMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este planejamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deletePlanejamentoMutation.isPending}>
              {deletePlanejamentoMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para seleção de insumos */}
      <Dialog open={isInsumoDialogOpen} onOpenChange={setIsInsumoDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Insumo</DialogTitle>
            <DialogDescription>
              Selecione um insumo e a quantidade necessária para o planejamento.
            </DialogDescription>
          </DialogHeader>
          {!insumosData?.produtos_estoque ? (
            <div className="py-6 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Carregando insumos...</span>
            </div>
          ) : insumosData.produtos_estoque.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">Nenhum insumo disponível.</p>
              <p className="text-sm mt-2">Adicione insumos na seção de Recursos.</p>
            </div>
          ) : (
            <Form {...insumoForm}>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label htmlFor="produto" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Insumo</label>
                  <select
                    id="produto"
                    aria-label="Selecione um insumo"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={insumoToAdd.produto_id}
                    onChange={(e) => {
                      const selectedProduct = insumosData.produtos_estoque.find(p => p.id === e.target.value);
                      if (selectedProduct) {
                        const quantidade = insumoToAdd.quantidade;
                        const preco = selectedProduct.preco_unitario || 0;
                        setInsumoToAdd({
                          produto_id: e.target.value,
                          quantidade: quantidade,
                          unidade: selectedProduct.unidade || "",
                          preco_unitario: preco,
                          custo_total: preco * quantidade,
                          dose_por_hectare: selectedProduct.dose_por_hectare
                        });
                      } else {
                        setInsumoToAdd({
                          produto_id: e.target.value,
                          quantidade: insumoToAdd.quantidade,
                          unidade: ""
                        });
                      }
                    }}
                  >
                    <option value="">Selecione um insumo</option>
                    {insumosData.produtos_estoque
                      .filter(produto => (produto.quantidade ?? 0) > 0)
                      .map((produto) => (
                        <option key={produto.id} value={produto.id}>
                          {produto.nome} ({produto.quantidade} {produto.unidade})
                        </option>
                      ))}
                  </select>
                  {insumoToAdd.produto_id && (
                    <p className="text-sm text-muted-foreground">
                      Estoque disponível: {
                        insumosData.produtos_estoque.find(p => p.id === insumoToAdd.produto_id)?.quantidade
                      } {
                        insumosData.produtos_estoque.find(p => p.id === insumoToAdd.produto_id)?.unidade
                      }
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="quantidade" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Quantidade</label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="0.1"
                      step="0.1"
                      max={insumoToAdd.produto_id ? insumosData.produtos_estoque.find(p => p.id === insumoToAdd.produto_id)?.quantidade : undefined}
                      value={insumoToAdd.quantidade}
                      onChange={(e) => {
                        const quantidade = parseFloat(e.target.value) || 0;
                        const preco = insumoToAdd.preco_unitario || 0;
                        setInsumoToAdd({
                          ...insumoToAdd,
                          quantidade: quantidade,
                          custo_total: preco * quantidade
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="unidade" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Unidade</label>
                    <Input
                      id="unidade"
                      placeholder="ex: kg, L, un"
                      value={insumoToAdd.unidade}
                      onChange={(e) => setInsumoToAdd({ ...insumoToAdd, unidade: e.target.value })}
                    />
                  </div>
                </div>

                {insumoToAdd.produto_id && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="preco" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Preço Unitário (AOA)</label>
                        <Input
                          id="preco"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={insumoToAdd.preco_unitario || 0}
                          onChange={(e) => {
                            const preco = parseFloat(e.target.value) || 0;
                            const quantidade = insumoToAdd.quantidade || 0;
                            setInsumoToAdd({
                              ...insumoToAdd,
                              preco_unitario: preco,
                              custo_total: preco * quantidade
                            });
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="dose" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Dose por Hectare</label>
                        <Input
                          id="dose"
                          type="number"
                          min="0"
                          step="0.01"
                          value={insumoToAdd.dose_por_hectare || 0}
                          onChange={(e) => setInsumoToAdd({ ...insumoToAdd, dose_por_hectare: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    {insumoToAdd.preco_unitario && insumoToAdd.quantidade > 0 && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">Custo Total: AOA {(insumoToAdd.preco_unitario * insumoToAdd.quantidade).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Form>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInsumoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={Boolean(!insumosData?.produtos_estoque ||
                insumosData.produtos_estoque.length === 0 ||
                !insumoToAdd.produto_id ||
                insumoToAdd.quantidade <= 0)}
              onClick={() => {
                // Adicionar insumo apenas se produto selecionado e quantidade válida
                if (insumoToAdd.produto_id && insumoToAdd.quantidade > 0) {
                  const produto = insumosData?.produtos_estoque?.find(p => p.id === insumoToAdd.produto_id);
                  if (produto) {
                    const preco_unitario = insumoToAdd.preco_unitario || produto.preco_unitario || 0;
                    const quantidade = insumoToAdd.quantidade;
                    const custo_total = preco_unitario * quantidade;

                    setSelectedInsumos([
                      ...selectedInsumos,
                      {
                        produto_id: insumoToAdd.produto_id,
                        nome: produto.nome,
                        quantidade: quantidade,
                        unidade: insumoToAdd.unidade || produto.unidade || "un",
                        preco_unitario: preco_unitario,
                        custo_total: custo_total,
                        dose_por_hectare: insumoToAdd.dose_por_hectare || produto.dose_por_hectare
                      }
                    ]);
                    setIsInsumoDialogOpen(false);

                    // Feedback visual para o usuário
                    toast({
                      title: "Insumo adicionado",
                      description: `${produto.nome} foi adicionado ao planejamento.`,
                    });
                  }
                } else {
                  // Feedback de erro
                  toast({
                    title: "Dados incompletos",
                    description: "Selecione um insumo e informe a quantidade.",
                    variant: "destructive"
                  });
                }
              }}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de cancelamento */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Planejamento</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja cancelar este planejamento? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={closeCancelDialog}>Não</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelPlanejamentoMutation.isPending}>
              {cancelPlanejamentoMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sim, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
