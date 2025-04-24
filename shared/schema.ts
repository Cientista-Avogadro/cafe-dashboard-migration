import { z } from "zod";



// User schema
export const userSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().nonempty(),
  email: z.string().email(),
  password_hash: z.string().nonempty(),
  role: z.enum(['admin', 'gestor', 'operador']).default('operador'),
  ativo: z.boolean().default(true),
});

// Schema for user registration (insert)
export const insertUserSchema = z.object({
  nome: z.string().nonempty(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'gestor', 'operador']).default('operador').optional(),
  ativo: z.boolean().default(true).optional(),
});

// Property schema
export const propertySchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().nonempty(),
  localizacao: z.string().optional(),
  tamanho: z.number().optional(),
});

// Sector schema
export const sectorSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().nonempty(),
  propriedade_id: z.string().uuid(),
});

// Lot schema
export const lotSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().nonempty(),
  setor_id: z.string().uuid(),
  cultura_atual: z.string().optional(),
  status: z.string().optional(),
});

// Crop schema
export const cropSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().nonempty(),
  ciclo_estimado_dias: z.number().optional(),
});

// Planning schema
export const planningSchema = z.object({
  id: z.string().uuid().optional(),
  lote_id: z.string().uuid(),
  cultura_id: z.string().uuid(),
  data_inicio: z.date().optional(),
  data_fim_prevista: z.date().optional(),
  status: z.string().optional(),
});

// Activity schema
export const activitySchema = z.object({
  id: z.string().uuid().optional(),
  planejamento_id: z.string().uuid(),
  tipo: z.string().optional(),
  data_prevista: z.date().optional(),
  observacoes: z.string().optional(),
});

// Irrigation schema
export const irrigationSchema = z.object({
  id: z.string().uuid().optional(),
  lote_id: z.string().uuid(),
  data: z.date().optional(),
  volume_agua: z.number().optional(),
  metodo: z.string().optional(),
});

// Pest schema
export const pestSchema = z.object({
  id: z.string().uuid().optional(),
  lote_id: z.string().uuid(),
  data: z.date().optional(),
  tipo_praga: z.string().optional(),
  metodo_controle: z.string().optional(),
  resultado: z.string().optional(),
});

// Financial transaction schema
export const financialTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  tipo: z.enum(['entrada', 'saida']),
  valor: z.number(),
  descricao: z.string().optional(),
  data: z.date().optional(),
  categoria: z.string().optional(),
});

// Stock product schema
export const stockProductSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().optional(),
  categoria: z.string().optional(),
  unidade: z.string().optional(),
  quantidade: z.number().default(0),
});

// Stock movement schema
export const stockMovementSchema = z.object({
  id: z.string().uuid().optional(),
  produto_id: z.string().uuid(),
  tipo: z.enum(['entrada', 'saida']),
  quantidade: z.number().optional(),
  data: z.date().optional(),
  descricao: z.string().optional(),
});

// Export types

export type User = z.infer<typeof userSchema>;
export type Property = z.infer<typeof propertySchema>;
export type Sector = z.infer<typeof sectorSchema>;
export type Lot = z.infer<typeof lotSchema>;
export type Crop = z.infer<typeof cropSchema>;
export type Planning = z.infer<typeof planningSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Irrigation = z.infer<typeof irrigationSchema>;
export type Pest = z.infer<typeof pestSchema>;
export type FinancialTransaction = z.infer<typeof financialTransactionSchema>;
export type StockProduct = z.infer<typeof stockProductSchema>;
export type StockMovement = z.infer<typeof stockMovementSchema>;
