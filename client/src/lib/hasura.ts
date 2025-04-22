import { GraphQLClient } from 'graphql-request';
import { DocumentNode } from 'graphql';

// Cliente GraphQL para o Hasura
// Usamos import.meta.env em vez de process.env para variáveis no cliente
const endpoint = import.meta.env.VITE_HASURA_ENDPOINT || '';
const adminSecret = import.meta.env.VITE_HASURA_ADMIN_SECRET || '';

if (!endpoint || !adminSecret) {
  console.error('HASURA_ENDPOINT ou HASURA_ADMIN_SECRET não definidos');
}

// Criamos o cliente GraphQL com as credenciais do Hasura
export const hasuraClient = new GraphQLClient(endpoint, {
  headers: {
    'x-hasura-admin-secret': adminSecret,
  },
});

/**
 * Executa uma operação GraphQL com o cliente Hasura
 * @param document Documento GraphQL (query ou mutation)
 * @param variables Variáveis para a operação
 * @returns Resultado da operação
 */
export async function executeOperation<TData = any>(
  document: DocumentNode | string,
  variables?: Record<string, any>
): Promise<TData> {
  try {
    return await hasuraClient.request<TData>(document, variables || {});
  } catch (error) {
    console.error('Erro na operação GraphQL:', error);
    throw error;
  }
}

// Função para gerar cabeçalhos de autenticação do usuário
export function getUserHeaders(userId: number) {
  return {
    'x-hasura-role': 'user',
    'x-hasura-user-id': String(userId),
  };
}

// Cliente GraphQL com autenticação de usuário
export function getAuthenticatedClient(userId: number) {
  return new GraphQLClient(endpoint, {
    headers: {
      'x-hasura-admin-secret': adminSecret,
      ...getUserHeaders(userId),
    },
  });
}