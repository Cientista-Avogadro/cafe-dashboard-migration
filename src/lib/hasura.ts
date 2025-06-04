import { GraphQLClient } from 'graphql-request';
import { DocumentNode } from 'graphql';
import { gql } from '@apollo/client';

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

export const GET_COLHEITAS_BY_LOTE = gql`
  query GetColheitasByLote($propriedade_id: uuid!, $lote_id: uuid!) {
    colheitas(
      where: {
        propriedade_id: { _eq: $propriedade_id },
        lote_id: { _eq: $lote_id }
      },
      order_by: { data: desc }
    ) {
      id
      data
      quantidade_colhida
      unidade
      destino
      observacoes
      cultura_id
      lote_id
      propriedade_id
      planejamento_id
    }
  }
`;

export const GET_COLHEITAS_BY_CANTEIRO = gql`
  query GetColheitasByCanteiro($propriedade_id: uuid!, $canteiro_id: uuid!) {
    colheitas(
      where: {
        propriedade_id: { _eq: $propriedade_id },
        canteiro_id: { _eq: $canteiro_id }
      },
      order_by: { data: desc }
    ) {
      id
      data
      quantidade_colhida
      unidade
      destino
      observacoes
      cultura_id
      canteiro_id
      propriedade_id
      planejamento_id
    }
  }
`;

export const GET_COLHEITAS_BY_SETOR = gql`
  query GetColheitasBySetor($propriedade_id: uuid!, $setor_id: uuid!) {
    colheitas(
      where: {
        propriedade_id: { _eq: $propriedade_id },
        setor_id: { _eq: $setor_id }
      },
      order_by: { data: desc }
    ) {
      id
      data
      quantidade_colhida
      unidade
      destino
      observacoes
      cultura_id
      setor_id
      propriedade_id
      planejamento_id
    }
  }
`;

export const GET_PLANEJAMENTOS_BY_LOTE = gql`
  query GetPlanejamentosByLote($propriedade_id: uuid!, $lote_id: uuid!) {
    planejamentos(
      where: {
        propriedade_id: { _eq: $propriedade_id },
        lote_id: { _eq: $lote_id }
      },
      order_by: { data_inicio: desc }
    ) {
      id
      canteiro_id
      cultura_id
      data_fim_prevista
      data_inicio
      lote_id
      propriedade_id
      setor_id
      status
      area_plantada
      produtividade_esperada
    }
  }
`;

export const GET_PLANEJAMENTOS_BY_CANTEIRO = gql`
  query GetPlanejamentosByCanteiro($propriedade_id: uuid!, $canteiro_id: uuid!) {
    planejamentos(
      where: {
        propriedade_id: { _eq: $propriedade_id },
        canteiro_id: { _eq: $canteiro_id }
      },
      order_by: { data_inicio: desc }
    ) {
      id
      canteiro_id
      cultura_id
      data_fim_prevista
      data_inicio
      lote_id
      propriedade_id
      setor_id
      status
      area_plantada
      produtividade_esperada
    }
  }
`;

export const GET_PLANEJAMENTOS_BY_SETOR = gql`
  query GetPlanejamentosBySetor($propriedade_id: uuid!, $setor_id: uuid!) {
    planejamentos(
      where: {
        propriedade_id: { _eq: $propriedade_id },
        setor_id: { _eq: $setor_id }
      },
      order_by: { data_inicio: desc }
    ) {
      id
      canteiro_id
      cultura_id
      data_fim_prevista
      data_inicio
      lote_id
      propriedade_id
      setor_id
      status
      area_plantada
      produtividade_esperada
    }
  }
`;

export const ADD_COLHEITA = gql`
  mutation AddColheita($colheita: colheitas_insert_input!) {
    insert_colheitas_one(object: $colheita) {
      id
    }
  }
`;

export const EDIT_COLHEITA = gql`
  mutation EditColheita($id: uuid!, $colheita: colheitas_set_input!) {
    update_colheitas_by_pk(pk_columns: { id: $id }, _set: $colheita) {
      id
    }
  }
`;