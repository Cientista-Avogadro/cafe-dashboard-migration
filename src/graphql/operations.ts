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

export const UPDATE_PROPRIEDADE = gql`
  mutation UpdatePropriedade($id: uuid!, $propriedade: propriedades_set_input!) {
    update_propriedades_by_pk(pk_columns: {id: $id}, _set: $propriedade) {
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

// Operações para configurações do sistema
export const GET_SISTEMA_CONFIGURACAO = gql`
  query GetSistemaConfiguracao($propriedade_id: uuid!) {
    sistema_configuracao(where: {propriedade_id: {_eq: $propriedade_id}}) {
      id
      propriedade_id
      moeda_principal
      taxa_cambio_usd
      taxa_cambio_eur
      taxa_cambio_aoa
      atualizar_cambio_automaticamente
      unidade_area
      tema
      criado_em
      atualizado_em
    }
  }
`;

export const UPSERT_SISTEMA_CONFIGURACAO = gql`
  mutation UpsertSistemaConfiguracao($configuracao: sistema_configuracao_insert_input!) {
    insert_sistema_configuracao_one(
      object: $configuracao,
      on_conflict: {
        constraint: sistema_configuracao_propriedade_id_key,
        update_columns: [
          moeda_principal,
          taxa_cambio_usd,
          taxa_cambio_eur,
          taxa_cambio_aoa,
          atualizar_cambio_automaticamente,
          unidade_area,
          tema,
          atualizado_em
        ]
      }
    ) {
      id
      propriedade_id
      moeda_principal
      taxa_cambio_usd
      taxa_cambio_eur
      taxa_cambio_aoa
      atualizar_cambio_automaticamente
      unidade_area
      tema
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

export const GET_USERS = gql`
  query GetUsers($propriedade_id: uuid!) {
    users(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      nome
      email
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

export const UPDATE_USER = gql`
  mutation UpdateUser($id: uuid!, $user: users_set_input!) {
    update_users_by_pk(pk_columns: { id: $id }, _set: $user) {
      id
      nome
      email
      propriedade_id
      role
      ativo
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: uuid!) {
    delete_users_by_pk(id: $id) {
      id
    }
  }
`;

// Operações de Setores
export const GET_SETORES = gql`
  query GetSetores($propriedade_id: uuid!) {
    setores(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      area
      latitude
      descricao
      longitude
      nome
      observacao
      propriedade_id
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

export const GET_LOTES_BY_SECTOR_ID = gql`
  query GetLotesBySectorId($setor_id: uuid!) {
    lotes(where: { setor_id: { _eq: $setor_id } }) {
      area
      cultura_atual_id
      descricao
      latitude
      longitude
      nome
      observacao
      propriedade_id
      status
      setor_id
      id
    }
  }
`;

// Operações de Culturas
export const GET_CULTURAS = gql`
  query GetCulturas($propriedade_id: uuid) {
    culturas(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      nome
      ciclo_estimado_dias
      variedade
      produtividade
      inicio_epoca_plantio
      fim_epoca_plantio
      propriedade_id
    }
  }
`;

// Cleaned up old queries

export const GET_CULTURAS_BY_IDS = gql`
  query GetCulturasByIds($ids: [uuid!]!) {
    culturas(where: { id: { _in: $ids } }) {
      id
      nome
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
      propriedade_id
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
      propriedade_id
    }
  }
`;

// Operações de Planejamentos
export const GET_PLANEJAMENTOS = gql`
  query GetPlanejamentos($lote_id: uuid, $canteiro_id: uuid, $propriedade_id: uuid) {
    planejamentos(where: {
      propriedade_id: { _eq: $propriedade_id }
    }) {
      id
      lote_id
      canteiro_id
      setor_id
      cultura_id
      data_inicio
      data_fim_prevista
      status
      propriedade_id
      area_plantada
      produtividade_esperada
    }
  }
`;

export const INSERT_PLANEJAMENTO = gql`
  mutation InsertPlanejamento($planejamento: planejamentos_insert_input!) {
    insert_planejamentos_one(object: $planejamento) {
      id
      lote_id
      canteiro_id
      setor_id
      cultura_id
      data_inicio
      data_fim_prevista
      status
      propriedade_id
    }
  }
`;

export const UPDATE_PLANEJAMENTO = gql`
  mutation UpdatePlanejamento($id: uuid!, $planejamento: planejamentos_set_input!) {
    update_planejamentos_by_pk(pk_columns: { id: $id }, _set: $planejamento) {
      id
    }
  }
`;

// Operações de Atividades
export const GET_ATIVIDADES = gql`
  query GetAtividades($propriedade_id: uuid) {
    atividades(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      planejamento_id
      canteiro_id
      tipo
      data_prevista
      observacoes
      propriedade_id
    }
  }
`;

export const INSERT_ATIVIDADE = gql`
  mutation InsertAtividade($atividade: atividades_insert_input!) {
    insert_atividades_one(object: $atividade) {
      id
      planejamento_id
      canteiro_id
      propriedade_id
    }
  }
`;

// Operações de Irrigações
export const GET_IRRIGACOES = gql`
  query GetIrrigacoes($propriedade_id: uuid!) {
    irrigacoes(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      lote_id
      canteiro_id
      setor_id
      data
      volume_agua
      metodo
      propriedade_id
    }
  }
`;

export const GET_IRRIGACOES_BY_LOTE = gql`
  query GetIrrigacoesByLote($lote_id: uuid, $propriedade_id: uuid) {
    irrigacoes(where: {
      _and: [
        { propriedade_id: { _eq: $propriedade_id } },
        { lote_id: { _eq: $lote_id } }
      ]
    }) {
      id
      lote_id
      data
      volume_agua
      metodo
      propriedade_id
    }
  }
`;

export const GET_IRRIGACOES_BY_CANTEIRO = gql`
  query GetIrrigacoesByCanteiro($canteiro_id: uuid, $propriedade_id: uuid) {
    irrigacoes(where: {
      _and: [
        { propriedade_id: { _eq: $propriedade_id } },
        { canteiro_id: { _eq: $canteiro_id } }
      ]
    }) {
      id
      canteiro_id
      data
      volume_agua
      metodo
      propriedade_id
    }
  }
`;

export const GET_IRRIGACOES_BY_SETOR = gql`
  query GetIrrigacoesBySetor($setor_id: uuid, $propriedade_id: uuid) {
    irrigacoes(where: {
      _and: [
        { propriedade_id: { _eq: $propriedade_id } },
        { setor_id: { _eq: $setor_id } }
      ]
    }) {
      id
      setor_id
      data
      volume_agua
      metodo
      propriedade_id
    }
  }
`;

export const INSERT_IRRIGACAO = gql`
  mutation InsertIrrigacao($irrigacao: irrigacoes_insert_input!) {
    insert_irrigacoes_one(object: $irrigacao) {
      id
      lote_id
      canteiro_id
      setor_id
      data
      volume_agua
      metodo
      propriedade_id
    }
  }
`;

// Operações de Pragas
export const GET_PRAGAS = gql`
  query GetPragas($propriedade_id: uuid) {
    pragas(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      lote_id
      data
      tipo_praga
      metodo_controle
      resultado
      propriedade_id
    }
  }
`;

export const GET_PRAGAS_BY_LOTE = gql`
  query GetPragasByLote($lote_id: uuid, $propriedade_id: uuid) {
    pragas(where: {
      _and: [
        { propriedade_id: { _eq: $propriedade_id } },
        { lote_id: { _eq: $lote_id } }
      ]
    }) {
      id
      lote_id
      canteiro_id
      setor_id
      data
      tipo_praga
      metodo_controle
      resultado
      propriedade_id
    }
  }
`;

export const GET_PRAGAS_BY_CANTEIRO = gql`
  query GetPragasByCanteiro($canteiro_id: uuid, $propriedade_id: uuid) {
    pragas(where: {
      _and: [
        { propriedade_id: { _eq: $propriedade_id } },
        { canteiro_id: { _eq: $canteiro_id } }
      ]
    }) {
      id
      lote_id
      canteiro_id
      setor_id
      data
      tipo_praga
      metodo_controle
      resultado
      propriedade_id
    }
  }
`;

export const GET_PRAGAS_BY_SETOR = gql`
  query GetPragasBySetor($setor_id: uuid, $propriedade_id: uuid) {
    pragas(where: {
      _and: [
        { propriedade_id: { _eq: $propriedade_id } },
        { setor_id: { _eq: $setor_id } }
      ]
    }) {
      id
      lote_id
      canteiro_id
      setor_id
      data
      tipo_praga
      metodo_controle
      resultado
      propriedade_id
    }
  }
`;

export const INSERT_PRAGA = gql`
  mutation InsertPraga($praga: pragas_insert_input!) {
    insert_pragas_one(object: $praga) {
      id
      lote_id
      canteiro_id
      setor_id
      tipo_area
      data
      tipo_praga
      metodo_controle
      resultado
      propriedade_id
    }
  }
`;

export const UPDATE_PRAGA = gql`
  mutation UpdatePraga($id: uuid!, $updates: pragas_set_input!) {
    update_pragas_by_pk(pk_columns: { id: $id }, _set: $updates) {
      id
      lote_id
      canteiro_id
      setor_id
      tipo_area
      data
      tipo_praga
      metodo_controle
      resultado
      propriedade_id
    }
  }
`;

export const UPDATE_PRAGA_STATUS = gql`
  mutation UpdatePragaStatus($id: uuid!, $status: String!) {
    update_pragas_by_pk(pk_columns: { id: $id }, _set: { resultado: $status }) {
      id
      resultado
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
      dose_por_hectare
      preco_unitario
    }
  }
`;

export const INSERT_PRODUTO_ESTOQUE = gql`
  mutation InsertProdutoEstoque($produto: produtos_estoque_insert_input!) {
    insert_produtos_estoque_one(object: $produto) {
      id
      nome
      propriedade_id
      dose_por_hectare
      preco_unitario
    }
  }
`;

export const UPDATE_PRODUTO_ESTOQUE = gql`
  mutation UpdateProdutoEstoque($id: uuid!, $produto: produtos_estoque_set_input!) {
    update_produtos_estoque_by_pk(pk_columns: { id: $id }, _set: $produto) {
      id
      nome
      propriedade_id
    }
  }
`;

export const GET_PRODUTOS = gql`
  query GetProdutos {
    produtos_estoque {
      id
      nome
      unidade_medida
      quantidade
      categoria
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

export const GET_ALL_MOVIMENTACOES_ESTOQUE = gql`
  query GetAllMovimentacoesEstoque {
    movimentacoes_estoque(
      order_by: { data: desc }
    ) {
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
      area
      latitude
      descricao
      longitude
      nome
      observacao
      propriedade_id
    }
  }
`;

export const GET_SECTOR_BY_ID = gql`
  query GetSectorById($id: uuid!) {
    setores_by_pk(id: $id) {
      id
      area
      latitude
      descricao
      longitude
      nome
      observacao
      propriedade_id
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
      area
      cultura_atual_id
      descricao
      latitude
      longitude
      nome
      observacao
      propriedade_id
      status
      setor_id
      id
    }
  }
`;

export const GET_LOTES_BY_PROPRIEDADE = gql`
  query GetLotesByPropriedade($propriedade_id: uuid) {
    lotes(where: { propriedade_id: { _eq: $propriedade_id } }) {
      area
      cultura_atual_id
      descricao
      latitude
      longitude
      nome
      observacao
      propriedade_id
      status
      setor_id
      id
    }
  }
`;

export const GET_LOTE_BY_ID = gql`
  query GetLotById($id: uuid!) {
    lotes_by_pk(id: $id) {
      area
      cultura_atual_id
      descricao
      latitude
      longitude
      nome
      observacao
      propriedade_id
      status
      setor_id
      id
    }
  }
`;

export const GET_ALL_CULTURAS = gql`
  query GetAllCulturas($propriedade_id: uuid) {
    culturas(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      nome
      ciclo_estimado_dias
      propriedade_id
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
      cultura_atual_id
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

// Operações de Canteiros (Beds)
export const GET_CANTEIROS = gql`
  query GetCanteiros($lote_id: uuid, $propriedade_id: uuid) {
    canteiros(where: { propriedade_id: { _eq: $propriedade_id } }) {
      id
      nome
      lote_id
      propriedade_id
      area
      status
      cultura_id
      latitude
      longitude
    }
  }
`;

export const GET_CANTEIRO_BY_ID = gql`
  query GetCanteiroById($id: uuid!) {
    canteiros_by_pk(id: $id) {
      id
      nome
      lote_id
      propriedade_id
      area
      status
      cultura_id
      latitude
      longitude
    }
  }
`;

export const INSERT_CANTEIRO = gql`
  mutation InsertCanteiro($canteiro: canteiros_insert_input!) {
    insert_canteiros_one(object: $canteiro) {
      id
      nome
      lote_id
      propriedade_id
      area
      status
      cultura_id
      latitude
      longitude
    }
  }
`;

export const UPDATE_CANTEIRO = gql`
  mutation UpdateCanteiro($id: uuid!, $canteiro: canteiros_set_input!) {
    update_canteiros_by_pk(pk_columns: { id: $id }, _set: $canteiro) {
      id
      nome
      lote_id
      propriedade_id
      area
      status
      cultura_id
      latitude
      longitude
    }
  }
`;

export const DELETE_CANTEIRO = gql`
  mutation DeleteCanteiro($id: uuid!) {
    delete_canteiros_by_pk(id: $id) {
      id
    }
  }
`;

// Operações para planejamentos_insumos (relação N:M)
export const INSERT_PLANEJAMENTO_INSUMO = gql`
  mutation InsertPlanejamentoInsumo($insumo: planejamentos_insumos_insert_input!) {
    insert_planejamentos_insumos_one(object: $insumo) {
      id
      planejamento_id
      produto_id
      quantidade
      unidade
      data_uso
      observacoes
    }
  }
`;

export const GET_PLANEJAMENTO_INSUMOS = gql`
  query GetPlanejamentoInsumos($planejamento_id: uuid!) {
    planejamentos_insumos(where: { planejamento_id: { _eq: $planejamento_id } }) {
      id
      planejamento_id
      produto_id
      quantidade
      unidade
      data_uso
      observacoes
    }
  }
`;

export const DELETE_PLANEJAMENTO_INSUMOS = gql`
  mutation DeletePlanejamentoInsumos($planejamento_id: uuid!) {
    delete_planejamentos_insumos(where: { planejamento_id: { _eq: $planejamento_id } }) {
      affected_rows
    }
  }
`;

// Operação para obter detalhes completos de um planejamento específico
export const GET_PLANEJAMENTO_BY_ID = gql`
  query GetPlanejamentoById($id: uuid!) {
    planejamento: planejamentos_by_pk(id: $id) {
      id
      propriedade_id
      lote_id
      canteiro_id
      setor_id
      cultura_id
      data_inicio
      data_fim_prevista
      status
      area_plantada
      produtividade_esperada
    }
    
    # Obter insumos relacionados ao planejamento
    insumos: planejamentos_insumos(where: { planejamento_id: { _eq: $id } }) {
      id
      planejamento_id
      produto_id
      quantidade
      unidade
      data_uso
      observacoes
    }
    
    # Obter produtos do estoque para relacionar com os insumos
    produtos: produtos_estoque {
      id
      nome
      categoria
      unidade
      preco_unitario
      dose_por_hectare
    }
  }
`;

// Operação para obter detalhes da cultura para o planejamento
export const GET_CULTURA_DETAILS = gql`
  query GetCulturaDetails($id: uuid!) {
    cultura: culturas_by_pk(id: $id) {
      id
      nome
      ciclo_estimado_dias
      variedade
      produtividade
    }
  }
`;

// Operação para obter detalhes do lote
export const GET_LOTE_DETAILS = gql`
  query GetLoteDetails($id: uuid!) {
    lote: lotes_by_pk(id: $id) {
      id
      nome
      area
      setor_id
    }
  }
`;

// Operação para obter detalhes do canteiro
export const GET_CANTEIRO_DETAILS = gql`
  query GetCanteiroDetails($id: uuid!) {
    canteiro: canteiros_by_pk(id: $id) {
      id
      nome
      area
      lote_id
    }
  }
`;

// Operação para obter detalhes do setor
export const GET_SETOR_DETAILS = gql`
  query GetSetorDetails($id: uuid!) {
    setor: setores_by_pk(id: $id) {
      id
      nome
      area
    }
  }
`;

// Operação para obter tratamentos
export const GET_TRATAMENTOS = gql`
  query GetTratamentos($praga_id: uuid!) {
    praga_produtos(where: {praga_id: {_eq: $praga_id}}) {
      id
      produto_id
      quantidade_utilizada
      data_aplicacao
      observacoes
    }
  }
`;

export const INSERT_PRAGA_PRODUTO = gql`
  mutation InsertPragaProduto($praga_produto: praga_produtos_insert_input!) {
    insert_praga_produtos_one(object: $praga_produto) {
      id
      praga_id
      produto_id
      quantidade_utilizada
      data_aplicacao
      observacoes
    }
  }
`;

// Outras operações podem ser adicionadas conforme necessário

export const GET_CULTURA_BY_ID = gql`
  query GetCulturaById($id: uuid!) {
    cultura: culturas_by_pk(id: $id) {
      id
      nome
      variedade
      ciclo_estimado_dias
      produtividade
    }
  }
`;

export const ADD_COLHEITA = gql`
  mutation AddColheita($colheita: colheitas_insert_input!) {
    insert_colheitas_one(object: $colheita) {
      id
      quantidade_colhida
      unidade
      propriedade_id
      planejamento_id
      observacoes
      lote_id
      destino
      cultura_id
      data
      canteiro_id
      produtividade_real
      area_colhida
    }
  }
`;

export const GET_COLHEITAS_BY_PROPRIEDADE = gql`
  query GetColheitasByPropriedade($propriedade_id: uuid!) {
    colheitas(where: { propriedade_id: { _eq: $propriedade_id } }, order_by: { data: desc }) {
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

export const GET_COLHEITAS = gql`
  query GetColheitas($canteiro_id: uuid!) {
    colheitas(where: { canteiro_id: { _eq: $canteiro_id } }, order_by: { data: desc }) {
      id
      data
      quantidade_colhida
      area_colhida
      produtividade_real
      unidade
      destino
      observacoes
      cultura_id
      canteiro_id
    }
  }
`;

export const GET_LOTE = gql`
  query GetLote($id: Int!) {
    lote(id: $id) {
      id
      nome
      area
      descricao
      latitude
      longitude
      status
      cultura_id
      setor_id
      propriedade_id
      setor {
        id
        nome
      }
      canteiros {
        id
        nome
        area
        status
        cultura_id
      }
    }
  }
`;

export const GET_COLHEITAS_BY_LOTE = gql`
  query GetColheitasByLote($lote_id: uuid!, $propriedade_id: uuid!) {
    colheitas(where: { lote_id: { _eq: $lote_id }, propriedade_id: { _eq: $propriedade_id } }) {
      id
      data
      quantidade_colhida
      lote_id
      propriedade_id
    }
  }
`;