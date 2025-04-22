import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { executeOperation, getUserHeaders, hasuraClient } from './hasura';
import * as operations from '../graphql/operations';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Nova função para fazer requisições GraphQL
export async function graphqlRequest<TData = any, TVariables = Record<string, any>>(
  operation: keyof typeof operations,
  variables?: TVariables,
  userId?: number
): Promise<TData> {
  try {
    // @ts-ignore - As tipagens do GraphQL são complexas, mas isso funcionará em runtime
    const data = await executeOperation<TData>(operations[operation], variables);
    return data;
  } catch (error) {
    console.error(`Error executing GraphQL operation ${operation}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Função para realizar consultas GraphQL usando o Hasura diretamente
export const getGraphQLQueryFn: <T>(options: {
  operationName: keyof typeof operations;
  on401?: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ operationName, on401 = "throw" }) =>
  async ({ queryKey }) => {
    try {
      // O primeiro elemento de queryKey é o nome da operação GraphQL
      // O segundo elemento, se existir, são as variáveis
      const variables = queryKey.length > 1 ? queryKey[1] : undefined;
      // @ts-ignore
      const data = await executeOperation<T>(operations[operationName], variables);
      return data;
    } catch (error: any) {
      if (error.response?.status === 401 && on401 === "returnNull") {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
