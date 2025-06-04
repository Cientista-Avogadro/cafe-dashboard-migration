// Propriedade type
export interface Propriedade {
  id: string; // UUID
  nome: string;
  localizacao?: string;
  tamanho?: number;
  nif?: string;
  latitude?: number;
  longitude?: number;
}

// Alert type
export interface Alert {
  id: number;
  type: string;
  message: string;
  location: string;
  icon: string;
  severity: string;
}

// Activity type
export interface Activity {
  id: number;
  data_prevista: string;
  tipo: string;
  planejamento_id: string;
  observacoes?: string;
}

// Financial data type
export interface FinancialData {
  months: string[];
  income: number[];
  expenses: number[];
}

// Production data type
export interface ProductionData {
  crop: string;
  percentage: number;
  color: string;
}

// Sector type
export interface Sector {
  id: string; // UUID
  nome: string;
  propriedade_id: string;
  latitude?: number;
  longitude?: number;
  area?: number; // Área em metros quadrados
  descricao?: string; // Descrição do setor
  observacao?: string; // Observações adicionais
  updated_at?: string; // Data da última atualização
}

// Lot type
export interface Lot {
  id: string; // UUID
  nome: string;
  setor_id: string;
  cultura_atual_id?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  setor_nome?: string; // Nome do setor para exibição
  area?: number; // Área em metros quadrados
  descricao?: string; // Descrição do lote
  observacao?: string; // Observações adicionais
  cultura?: Crop;
  updated_at?: string; // Data da última atualização
  propriedade_id?: string;
}

// Crop type
export interface Crop {
  id: string; // UUID
  nome: string;
  ciclo_estimado_dias?: number;
  variedade?: string;
  produtividade?: number;
  inicio_epoca_plantio?: string;
  fim_epoca_plantio?: string;
  propriedade_id?: string;
}

// ProductStock type
export interface ProductStock {
  id: string; // UUID
  nome: string;
  categoria?: string;
  unidade?: string;
  quantidade?: number;
  propriedade_id: string;
  dose_por_hectare?: number; // Dose recomendada por hectare
  preco_unitario?: number; // Preço unitário do insumo
}

// StockMovement type
export interface StockMovement {
  id: string; // UUID
  produto_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data: string;
  descricao?: string;
  produto?: {
    id: string;
    nome: string;
    categoria?: string;
    unidade?: string;
    propriedade_id: string;
  };
}

// Irrigation type
export interface Irrigation {
  id: string; // UUID
  lote_id?: string;
  canteiro_id?: string;
  setor_id?: string;
  data: string;
  volume_agua: number;
  metodo: string;
}

// Pest type
export interface Pest {
  id: string;
  propriedade_id: string;
  lote_id?: string;
  canteiro_id?: string;
  setor_id?: string;
  tipo_area?: string;
  data: string;
  tipo_praga: string;
  metodo_controle: string;
  resultado: "Em andamento" | "Resolvida" | "Parcial" | "Não resolvida";
}

// Transaction type
export interface Transaction {
  id: string; // UUID
  propriedade_id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao?: string;
  data: string;
  categoria?: string;
}

// Canteiro (Bed) type
export interface Canteiro {
  id: string; // UUID
  nome: string;
  lote_id: string;
  propriedade_id: string;
  area?: number;
  status?: string;
  cultura_id?: string;
  latitude?: number;
  longitude?: number;
  lote_nome?: string; // Nome do lote para exibição
  cultura?: Crop;
}

// PlanejamentoInsumo type (relação N:M entre planejamentos e insumos)
export interface PlanejamentoInsumo {
  id: string; // UUID
  planejamento_id: string;
  produto_id: string;
  quantidade: number;
  unidade?: string;
  data_uso?: string; // Data específica para uso do insumo
  observacoes?: string;
  produto?: ProductStock; // Relação com o produto
}

// Planejamento (Planning) type
export interface Planejamento {
  id: string; // UUID
  propriedade_id: string;
  lote_id?: string;
  canteiro_id?: string;
  setor_id?: string;
  cultura_id: string;
  data_inicio: string;
  data_fim_prevista: string;
  status: string;
  cultura?: Crop;
  lote?: Lot;
  canteiro?: Canteiro;
  insumos?: PlanejamentoInsumo[]; // Relação com insumos
}

// PragaProduto type
export interface PragaProduto {
  id?: string;
  praga_id?: string;
  produto_id: string;
  quantidade_utilizada: number;
  data_aplicacao: string;
  observacoes: string;
}

// Produto type
export interface Produto {
  id: string;
  nome: string;
  unidade_medida: string;
  quantidade: number;
  categoria: string;
}

// Tratamento type
export interface Tratamento {
  id: string;
  produto_id: string;
  quantidade_utilizada: number;
  data_aplicacao: string;
  observacoes: string;
}
