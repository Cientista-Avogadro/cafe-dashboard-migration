import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql-request';

// Configure o cliente Hasura
const endpoint = process.env.HASURA_ENDPOINT;
const adminSecret = process.env.HASURA_ADMIN_SECRET;

if (!endpoint || !adminSecret) {
  console.error('HASURA_ENDPOINT ou HASURA_ADMIN_SECRET não definidos');
}

const hasuraClient = new GraphQLClient(String(endpoint), {
  headers: {
    'x-hasura-admin-secret': String(adminSecret),
  },
});

// Consultas e mutações GraphQL
const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    users(where: { username: { _eq: $username } }) {
      id
      username
      password
    }
  }
`;

const GET_USER_BY_ID = gql`
  query GetUserById($id: Int!) {
    users_by_pk(id: $id) {
      id
      username
      created_at
    }
  }
`;

const INSERT_USER = gql`
  mutation InsertUser($username: String!, $password: String!) {
    insert_users_one(object: { username: $username, password: $password }) {
      id
      username
      created_at
    }
  }
`;

// Interfaces para os resultados do Hasura
interface GetUserByUsernameResult {
  users: Array<{
    id: number;
    username: string;
    password: string;
  }>;
}

interface GetUserByIdResult {
  users_by_pk: {
    id: number;
    username: string;
    created_at: string;
  } | null;
}

interface InsertUserResult {
  insert_users_one: {
    id: number;
    username: string;
    created_at: string;
  };
}

// Funções para interagir com o Hasura
export async function getUserByUsername(username: string) {
  try {
    const data = await hasuraClient.request<GetUserByUsernameResult>(GET_USER_BY_USERNAME, { username });
    return data.users[0] || null;
  } catch (error) {
    console.error('Erro ao obter usuário por nome de usuário:', error);
    throw error;
  }
}

export async function getUserById(id: number) {
  try {
    const data = await hasuraClient.request<GetUserByIdResult>(GET_USER_BY_ID, { id });
    return data.users_by_pk;
  } catch (error) {
    console.error('Erro ao obter usuário por ID:', error);
    throw error;
  }
}

export async function createUser(username: string, password: string) {
  try {
    const data = await hasuraClient.request<InsertUserResult>(INSERT_USER, { username, password });
    return data.insert_users_one;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
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
  return new GraphQLClient(String(endpoint), {
    headers: {
      'x-hasura-admin-secret': String(adminSecret),
      ...getUserHeaders(userId),
    },
  });
}