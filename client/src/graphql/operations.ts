import { gql } from 'graphql-request';

// Operações de Cultura (Crop)
export const GET_CROPS = gql`
  query GetCrops {
    crops {
      id
      name
      variety
      cycle_days
      yield_per_hectare
      planting_season_start
      planting_season_end
      created_at
    }
  }
`;

export const GET_CROP_BY_ID = gql`
  query GetCropById($id: Int!) {
    crops_by_pk(id: $id) {
      id
      name
      variety
      cycle_days
      yield_per_hectare
      planting_season_start
      planting_season_end
      created_at
    }
  }
`;

export const INSERT_CROP = gql`
  mutation InsertCrop(
    $name: String!,
    $variety: String,
    $cycle_days: Int,
    $yield_per_hectare: numeric,
    $planting_season_start: String,
    $planting_season_end: String
  ) {
    insert_crops_one(object: {
      name: $name,
      variety: $variety,
      cycle_days: $cycle_days,
      yield_per_hectare: $yield_per_hectare,
      planting_season_start: $planting_season_start,
      planting_season_end: $planting_season_end
    }) {
      id
      name
      variety
      cycle_days
      yield_per_hectare
      planting_season_start
      planting_season_end
      created_at
    }
  }
`;

export const UPDATE_CROP = gql`
  mutation UpdateCrop(
    $id: Int!,
    $name: String,
    $variety: String,
    $cycle_days: Int,
    $yield_per_hectare: numeric,
    $planting_season_start: String,
    $planting_season_end: String
  ) {
    update_crops_by_pk(
      pk_columns: { id: $id },
      _set: {
        name: $name,
        variety: $variety,
        cycle_days: $cycle_days,
        yield_per_hectare: $yield_per_hectare,
        planting_season_start: $planting_season_start,
        planting_season_end: $planting_season_end
      }
    ) {
      id
      name
      variety
      cycle_days
      yield_per_hectare
      planting_season_start
      planting_season_end
      created_at
    }
  }
`;

export const DELETE_CROP = gql`
  mutation DeleteCrop($id: Int!) {
    delete_crops_by_pk(id: $id) {
      id
    }
  }
`;

// Operações de Usuário
export const GET_USER_BY_ID = gql`
  query GetUserById($id: Int!) {
    users_by_pk(id: $id) {
      id
      username
      created_at
    }
  }
`;

export const GET_USER_BY_USERNAME = gql`
  query GetUserByUsername($username: String!) {
    users(where: { username: { _eq: $username } }) {
      id
      username
      password
    }
  }
`;

export const INSERT_USER = gql`
  mutation InsertUser($username: String!, $password: String!) {
    insert_users_one(object: { username: $username, password: $password }) {
      id
      username
      created_at
    }
  }
`;

// Operações de Fazenda (Farm)
export const GET_FARMS = gql`
  query GetFarms($userId: Int) {
    farms(where: { user_id: { _eq: $userId } }) {
      id
      name
      location
      area
      cultivated_area
      crops
      employees
      status
      image
      user_id
    }
  }
`;

export const GET_FARM_BY_ID = gql`
  query GetFarmById($id: Int!) {
    farms_by_pk(id: $id) {
      id
      name
      location
      area
      cultivated_area
      crops
      employees
      status
      image
      user_id
    }
  }
`;

export const INSERT_FARM = gql`
  mutation InsertFarm($farm: farms_insert_input!) {
    insert_farms_one(object: $farm) {
      id
      name
      location
      area
      cultivated_area
      crops
      employees
      status
      image
      user_id
    }
  }
`;

export const UPDATE_FARM = gql`
  mutation UpdateFarm($id: Int!, $farm: farms_set_input!) {
    update_farms_by_pk(pk_columns: { id: $id }, _set: $farm) {
      id
      name
      location
      area
      cultivated_area
      crops
      employees
      status
      image
      user_id
    }
  }
`;

export const DELETE_FARM = gql`
  mutation DeleteFarm($id: Int!) {
    delete_farms_by_pk(id: $id) {
      id
    }
  }
`;

// Operações de Setor (Sector)
export const GET_SECTORS = gql`
  query GetSectors($farmId: Int) {
    sectors(where: { farm_id: { _eq: $farmId } }) {
      id
      name
      farm_id
      area
      current_crop
      status
    }
  }
`;

export const GET_SECTOR_BY_ID = gql`
  query GetSectorById($id: Int!) {
    sectors_by_pk(id: $id) {
      id
      name
      farm_id
      area
      current_crop
      status
    }
  }
`;

export const INSERT_SECTOR = gql`
  mutation InsertSector($sector: sectors_insert_input!) {
    insert_sectors_one(object: $sector) {
      id
      name
      farm_id
      area
      current_crop
      status
    }
  }
`;

export const UPDATE_SECTOR = gql`
  mutation UpdateSector($id: Int!, $sector: sectors_set_input!) {
    update_sectors_by_pk(pk_columns: { id: $id }, _set: $sector) {
      id
      name
      farm_id
      area
      current_crop
      status
    }
  }
`;

export const DELETE_SECTOR = gql`
  mutation DeleteSector($id: Int!) {
    delete_sectors_by_pk(id: $id) {
      id
    }
  }
`;

// Operações de Lote (Lot)
export const GET_LOTS = gql`
  query GetLots($sectorId: Int) {
    lots(where: { sector_id: { _eq: $sectorId } }) {
      id
      name
      sector_id
      area
      current_crop
      planting_date
      expected_harvest_date
      status
    }
  }
`;

export const GET_LOT_BY_ID = gql`
  query GetLotById($id: Int!) {
    lots_by_pk(id: $id) {
      id
      name
      sector_id
      area
      current_crop
      planting_date
      expected_harvest_date
      status
    }
  }
`;

export const INSERT_LOT = gql`
  mutation InsertLot($lot: lots_insert_input!) {
    insert_lots_one(object: $lot) {
      id
      name
      sector_id
      area
      current_crop
      planting_date
      expected_harvest_date
      status
    }
  }
`;

export const UPDATE_LOT = gql`
  mutation UpdateLot($id: Int!, $lot: lots_set_input!) {
    update_lots_by_pk(pk_columns: { id: $id }, _set: $lot) {
      id
      name
      sector_id
      area
      current_crop
      planting_date
      expected_harvest_date
      status
    }
  }
`;

export const DELETE_LOT = gql`
  mutation DeleteLot($id: Int!) {
    delete_lots_by_pk(id: $id) {
      id
    }
  }
`;

// Outras operações podem ser adicionadas conforme necessário