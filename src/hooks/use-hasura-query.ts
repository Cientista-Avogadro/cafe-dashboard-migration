import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { executeOperation } from "@/lib/hasura";
import * as operations from "@/graphql/operations";
import { useAuth } from "./use-auth";

/**
 * Hook personalizado para realizar consultas GraphQL com Hasura
 * Garante consistência em todas as páginas e respeita o modelo multitenancy
 */
export function useHasuraQuery<TData = any, TVariables = Record<string, any>>(
  operationName: keyof typeof operations,
  variables?: TVariables,
  options?: Omit<UseQueryOptions<TData, Error, TData, (string | TVariables | undefined)[]>, "queryKey" | "queryFn">
) {
  return useQuery<TData, Error, TData, (string | TVariables | undefined)[]>({
    queryKey: [operationName, variables],
    queryFn: async () => {
      // @ts-ignore - As tipagens do GraphQL são complexas, mas isso funcionará em runtime
      const result = await executeOperation<TData>(operations[operationName], variables);
      return result;
    },
    ...options
  });
}

/**
 * Função auxiliar para executar uma operação GraphQL diretamente
 * Útil para chamadas dentro de outras consultas
 */
export async function executeHasuraOperation<TData = any, TVariables = Record<string, any>>(
  operationName: keyof typeof operations,
  variables?: TVariables
): Promise<TData> {
  // @ts-ignore - As tipagens do GraphQL são complexas, mas isso funcionará em runtime
  return await executeOperation<TData>(operations[operationName], variables || {});
}

/**
 * Hook para buscar dados específicos da propriedade do usuário
 * Automaticamente adiciona o propriedade_id às variáveis
 */
export function usePropertyData<TData = any>(
  operationName: keyof typeof operations,
  variables?: Record<string, any>,
  options?: Omit<UseQueryOptions<TData, Error, TData, (string | Record<string, any> | undefined)[]>, "queryKey" | "queryFn" | "enabled">
) {
  const { user } = useAuth();
  
  const fullVariables = {
    ...(variables || {}),
    propriedade_id: user?.propriedade_id
  };
  
  return useQuery<TData, Error, TData, (string | Record<string, any> | undefined)[]>({
    queryKey: [operationName, fullVariables],
    queryFn: async () => {
      if (!user?.propriedade_id) return {} as TData;
      
      // @ts-ignore
      const result = await executeOperation<TData>(operations[operationName], fullVariables);
      return result;
    },
    enabled: !!user?.propriedade_id,
    ...options
  });
}
