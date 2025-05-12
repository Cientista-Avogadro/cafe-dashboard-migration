import { gql } from 'graphql-request';

// Operações de Propriedades
export const GET_PROPRIEDADES = gql`
  query GetPropriedades($user_id: uuid!) {
    propriedades(where: { id: { _eq: $user_id } }) {
      id
      nome
      localizacao
      tamanho
      nif
      latitude
      longitude
    }
  }
`;

export const INSERT_PROPRIEDADE = gql`
  mutation InsertPropriedade($propriedade: propriedades_insert_input!) {
    insert_propriedades_one(object: $propriedade) {
      id
      nome
      localizacao
      tamanho
      nif
      latitude
      longitude
    }
  }
`;

// Operações de Usuário
export const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    users(where: { email: { _eq: $email } }) {
      id
      nome
      email
      password_hash
      propriedade_id
      role
      ativo
    }
  }
`;

export const INSERT_USER = gql`
  mutation InsertUser($user: users_insert_input!) {
    insert_users_one(object: $user) {
      id
      nome
      email
      propriedade_id
      role
      ativo
    }
  }
`;

// Operações de Setores
export const GET_SETORES = gql`
  query GetSetores($propriedade_id: uuid!) {
    setores(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      nome
      propriedade_id
      latitude
      longitude
    }
  }
`;

export const INSERT_SETOR = gql`
  mutation InsertSetor($setor: setores_insert_input!) {
    insert_setores_one(object: $setor) {
      id
      nome
      propriedade_id
    }
  }
`;

export const INSERT_LOTE = gql`
  mutation InsertLote($lote: lotes_insert_input!) {
    insert_lotes_one(object: $lote) {
      id
      nome
      setor_id
    }
  }
`;

// Operações de Culturas
export const GET_CULTURAS = gql`
  query GetCulturas {
    culturas {
      id
      nome
      ciclo_estimado_dias
      variedade
      produtividade
      inicio_epoca_plantio
      fim_epoca_plantio
    }
  }
`;

export const GET_CULTURA_BY_ID = gql`
  query GetCulturaById($id: uuid!) {
      culturas_by_pk(id: $id) {
      id
      nome
      variedade	
      produtividade
      inicio_epoca_plantio
      fim_epoca_plantio
      ciclo_estimado_dias
    }
  }
`;

export const INSERT_CULTURA = gql`
  mutation InsertCultura($cultura: culturas_insert_input!) {
    insert_culturas_one(object: $cultura) {
      id
      nome
      ciclo_estimado_dias
      variedade
      produtividade
      inicio_epoca_plantio
      fim_epoca_plantio
    }
  }
`;

export const UPDATE_CULTURA = gql`
  mutation UpdateCultura($id: uuid!, $cultura: culturas_set_input!) {
    update_culturas_by_pk(pk_columns: { id: $id }, _set: $cultura) {
      id
      nome
      ciclo_estimado_dias
      variedade
      produtividade
      inicio_epoca_plantio
      fim_epoca_plantio
    }
  }
`;

// Operações de Planejamentos
export const GET_PLANEJAMENTOS = gql`
  query GetPlanejamentos($lote_id: uuid!) {
    planejamentos(where: { lote_id: { _eq: $lote_id } }) {
      id
      lote_id
      cultura_id
      data_inicio
      data_fim_prevista
      status
    }
  }
`;

export const INSERT_PLANEJAMENTO = gql`
  mutation InsertPlanejamento($planejamento: planejamentos_insert_input!) {
    insert_planejamentos_one(object: $planejamento) {
      id
      lote_id
      cultura_id
    }
  }
`;

// Operações de Atividades
export const GET_ATIVIDADES = gql`
  query GetAtividades($planejamento_id: uuid!) {
    atividades(where: { planejamento_id: { _eq: $planejamento_id } }) {
      id
      planejamento_id
      tipo
      data_prevista
      observacoes
    }
  }
`;

export const INSERT_ATIVIDADE = gql`
  mutation InsertAtividade($atividade: atividades_insert_input!) {
    insert_atividades_one(object: $atividade) {
      id
      planejamento_id
    }
  }
`;

// Operações de Irrigações
export const GET_IRRIGACOES = gql`
  query GetIrrigacoes($lote_id: uuid!) {
    irrigacoes(where: { lote_id: { _eq: $lote_id } }) {
      id
      lote_id
      data
      volume_agua
      metodo
    }
  }
`;

export const INSERT_IRRIGACAO = gql`
  mutation InsertIrrigacao($irrigacao: irrigacoes_insert_input!) {
    insert_irrigacoes_one(object: $irrigacao) {
      id
      lote_id
    }
  }
`;

// Operações de Pragas
export const GET_PRAGAS = gql`
  query GetPragas($lote_id: uuid!) {
    pragas(where: { lote_id: { _eq: $lote_id } }) {
      id
      lote_id
      data
      tipo_praga
      metodo_controle
      resultado
    }
  }
`;

export const INSERT_PRAGA = gql`
  mutation InsertPraga($praga: pragas_insert_input!) {
    insert_pragas_one(object: $praga) {
      id
      lote_id
    }
  }
`;

// Operações de Transações Financeiras
export const GET_TRANSACOES_FINANCEIRAS = gql`
  query GetTransacoesFinanceiras($propriedade_id: uuid!) {
    transacoes_financeiras(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      propriedade_id
      tipo
      valor
      descricao
      data
      categoria
    }
  }
`;

export const INSERT_TRANSACAO_FINANCEIRA = gql`
  mutation InsertTransacaoFinanceira($transacao: transacoes_financeiras_insert_input!) {
    insert_transacoes_financeiras_one(object: $transacao) {
      id
      propriedade_id
    }
  }
`;

// Operações de Produtos em Estoque
export const GET_PRODUTOS_ESTOQUE = gql`
  query GetProdutosEstoque($propriedade_id: uuid!) {
    produtos_estoque(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      nome
      categoria
      unidade
      quantidade
      propriedade_id
    }
  }
`;

export const INSERT_PRODUTO_ESTOQUE = gql`
  mutation InsertProdutoEstoque($produto: produtos_estoque_insert_input!) {
    insert_produtos_estoque_one(object: $produto) {
      id
      nome
      propriedade_id
    }
  }
`;

// Operações de Movimentações de Estoque
export const GET_MOVIMENTACOES_ESTOQUE = gql`
  query GetMovimentacoesEstoque($produto_id: uuid!) {
    movimentacoes_estoque(where: { produto_id: { _eq: $produto_id } }) {
      id
      produto_id
      tipo
      quantidade
      data
      descricao
    }
  }
`;

export const INSERT_MOVIMENTACAO_ESTOQUE = gql`
  mutation InsertMovimentacaoEstoque($movimentacao: movimentacoes_estoque_insert_input!) {
    insert_movimentacoes_estoque_one(object: $movimentacao) {
      id
      produto_id
    }
  }
`;


export const DELETE_PROPRIEDADE = gql`
  mutation DeletePropriedade($id: uuid!) {
    delete_propriedades_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_SETOR = gql`
  mutation DeleteSetor($id: uuid!) {
    delete_setores_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_LOTE = gql`
  mutation DeleteLote($id: uuid!) {
    delete_lotes_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_CULTURA = gql`
  mutation DeleteCultura($id: uuid!) {
    delete_culturas_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_PLANEJAMENTO = gql`
  mutation DeletePlanejamento($id: uuid!) {
    delete_planejamentos_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_ATIVIDADE = gql`
  mutation DeleteAtividade($id: uuid!) {
    delete_atividades_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_IRRIGACAO = gql`
  mutation DeleteIrrigacao($id: uuid!) {
    delete_irrigacoes_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_PRAGA = gql`
  mutation DeletePraga($id: uuid!) {
    delete_pragas_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_TRANSACAO_FINANCEIRA = gql`
  mutation DeleteTransacaoFinanceira($id: uuid!) {
    delete_transacoes_financeiras_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_PRODUTO_ESTOQUE = gql`
  mutation DeleteProdutoEstoque($id: uuid!) {
    delete_produtos_estoque_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_MOVIMENTACAO_ESTOQUE = gql`
  mutation DeleteMovimentacaoEstoque($id: uuid!) {
    delete_movimentacoes_estoque_by_pk(id: $id) {
      id
    }
  }
`;

// Operações de Usuário
export const GET_USER_BY_ID = gql`
  query GetUserById($id: uuid!) {
    users_by_pk(id: $id) {
      id
      nome
      email
      password_hash
      role

    }
  }
`;


// Operações de Setor (Sector)
export const GET_SECTORS = gql`
  query GetSectors($propriedade_id: uuid) {
    setores(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      nome
      propriedade_id
      latitude
      longitude
    }
  }
`;

export const GET_SECTOR_BY_ID = gql`
  query GetSectorById($id: uuid!) {
    setores_by_pk(id: $id) {
      id
      nome
      propriedade_id
      latitude
      longitude
    }
  }
`;

export const INSERT_SECTOR = gql`
  mutation InsertSector($setor: setores_insert_input!) {
    insert_setores_one(object: $setor) {
      id
      nome
      propriedade_id
      latitude
      longitude
    }
  }
`;

export const UPDATE_SECTOR = gql`
  mutation UpdateSector($id: uuid!, $setor: setores_set_input!) {
    update_setores_by_pk(pk_columns: { id: $id }, _set: $setor) {
      id
      nome
      propriedade_id
      latitude
      longitude
    }
  }
`;

export const DELETE_SECTOR = gql`
  mutation DeleteSector($id: uuid!) {
    delete_setores_by_pk(id: $id) {
      id
    }
  }
`;

// Operações de Lote (Lot)
export const GET_LOTES = gql`
  query GetLots($setor_id: uuid) {
    lotes(where: { setor_id: { _eq: $setor_id } }) {
      id
      nome
      setor_id
      cultura_atual_id
      status
      latitude
      longitude
      area
    }
  }
`;

export const GET_LOTE_BY_ID = gql`
  query GetLotById($id: uuid!) {
    lotes_by_pk(id: $id) {
      id
      nome
      setor_id
      cultura_atual_id
      status
      latitude
      longitude
      area
    }
  }
`;

export const GET_ALL_CULTURAS = gql`
  query GetAllCulturas {
    culturas {
      id
      nome
      ciclo_estimado_dias
    }
  }
`;

export const INSERT_LOT = gql`
  mutation InsertLot($lote: lotes_insert_input!) {
    insert_lotes_one(object: $lote) {
      id
      nome
      setor_id
      cultura_atual
      status
      latitude
      longitude
    }
  }
`;

export const UPDATE_LOT = gql`
  mutation UpdateLot($id: uuid!, $lote: lotes_set_input!) {
    update_lotes_by_pk(pk_columns: { id: $id }, _set: $lote) {
      id
      nome
      setor_id
      cultura_atual
      status
      latitude
      longitude
    }
  }
`;

export const DELETE_LOT = gql`
  mutation DeleteLot($id: uuid!) {
    delete_lotes_by_pk(id: $id) {
      id
    }
  }
`;

// Outras operações podem ser adicionadas conforme necessário