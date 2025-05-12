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
  area?: number; // Área em hectares
  cultura?: Crop
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
}

// ProductStock type
export interface ProductStock {
  id: string; // UUID
  nome: string;
  categoria?: string;
  unidade?: string;
  quantidade?: number;
  propriedade_id: string;
}

// StockMovement type
export interface StockMovement {
  id: string; // UUID
  produto_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data: string;
  descricao?: string;
}

// Irrigation type
export interface Irrigation {
  id: string; // UUID
  lote_id: string;
  data: string;
  volume_agua: number;
  metodo: string;
}

// Pest type
export interface Pest {
  id: string; // UUID
  lote_id: string;
  data: string;
  tipo_praga: string;
  metodo_controle: string;
  resultado: string;
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
