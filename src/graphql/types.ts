export interface Irrigacao {
  id: string;
  data: string;
  volume_agua: number;
  metodo: string;
}

export interface Praga {
  id: string;
  tipo_praga: string;
  data: string;
  metodo_controle: string;
  resultado: string;
}

export interface Colheita {
  id: string;
  data: string;
  quantidade_colhida: number;
  area_colhida: number;
  produtividade_real: number;
  unidade: string;
  destino: string;
  observacoes?: string;
  cultura_id: string;
  canteiro_id: string;
} 