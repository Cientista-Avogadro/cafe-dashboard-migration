import { insertUserSchema } from "./schema";
import { z } from "zod";

export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  propriedade_nome: z.string().nonempty({ message: "Nome da propriedade é obrigatório" }),
  propriedade_localizacao: z.string().optional(),
  propriedade_tamanho: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});
