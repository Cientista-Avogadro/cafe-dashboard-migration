import { gql } from 'graphql-request';

// Consulta para buscar todos os lotes
export const GET_LOTS = gql`
  query GetLots($sectorId: Int) {
    lots(where: { sector_id: { _eq: $sectorId } }, order_by: { name: asc }) {
      id
      name
      description
      area
      sector_id
      crop_id
      planting_date
      harvest_date
      status
      sector {
        name
        farm {
          name
        }
      }
      crop {
        name
        variety
      }
      created_at
      updated_at
    }
  }
`;

// Consulta para buscar um lote específico por ID
export const GET_LOT = gql`
  query GetLot($id: Int!) {
    lots_by_pk(id: $id) {
      id
      name
      description
      area
      sector_id
      crop_id
      planting_date
      harvest_date
      status
      sector {
        name
        farm {
          name
        }
      }
      crop {
        name
        variety
      }
      created_at
      updated_at
    }
  }
`;

// Mutation para criar um novo lote
export const CREATE_LOT = gql`
  mutation CreateLot($lot: lots_insert_input!) {
    insert_lots_one(object: $lot) {
      id
      name
      description
      area
      sector_id
      crop_id
      planting_date
      harvest_date
      status
      created_at
      updated_at
    }
  }
`;

// Mutation para atualizar um lote existente
export const UPDATE_LOT = gql`
  mutation UpdateLot($id: Int!, $lot: lots_set_input!) {
    update_lots_by_pk(pk_columns: { id: $id }, _set: $lot) {
      id
      name
      description
      area
      sector_id
      crop_id
      planting_date
      harvest_date
      status
      created_at
      updated_at
    }
  }
`;

// Mutation para excluir um lote
export const DELETE_LOT = gql`
  mutation DeleteLot($id: Int!) {
    delete_lots_by_pk(id: $id) {
      id
    }
  }
`;