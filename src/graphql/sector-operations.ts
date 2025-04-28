import { gql } from 'graphql-request';

// Consulta para buscar todos os setores
export const GET_SECTORS = gql`
  query GetSectors($farmId: Int) {
    sectors(where: { farm_id: { _eq: $farmId } }, order_by: { name: asc }) {
      id
      name
      description
      area
      farm_id
      farm {
        name
      }
      created_at
      updated_at
    }
  }
`;

// Consulta para buscar um setor específico por ID
export const GET_SECTOR = gql`
  query GetSector($id: Int!) {
    sectors_by_pk(id: $id) {
      id
      name
      description
      area
      farm_id
      farm {
        name
      }
      created_at
      updated_at
    }
  }
`;

// Mutation para criar um novo setor
export const CREATE_SECTOR = gql`
  mutation CreateSector($sector: sectors_insert_input!) {
    insert_sectors_one(object: $sector) {
      id
      name
      description
      area
      farm_id
      created_at
      updated_at
    }
  }
`;

// Mutation para atualizar um setor existente
export const UPDATE_SECTOR = gql`
  mutation UpdateSector($id: Int!, $sector: sectors_set_input!) {
    update_sectors_by_pk(pk_columns: { id: $id }, _set: $sector) {
      id
      name
      description
      area
      farm_id
      created_at
      updated_at
    }
  }
`;

// Mutation para excluir um setor
export const DELETE_SECTOR = gql`
  mutation DeleteSector($id: Int!) {
    delete_sectors_by_pk(id: $id) {
      id
    }
  }
`;