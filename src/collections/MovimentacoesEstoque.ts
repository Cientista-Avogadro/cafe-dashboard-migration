import { CollectionConfig } from 'payload/types'

const MovimentacoesEstoque: CollectionConfig = {
  slug: 'movimentacoes-estoque',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['produto', 'tipo', 'quantidade', 'data'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'produto',
      type: 'relationship',
      relationTo: 'produtos-estoque',
      required: true,
      label: 'Produto',
    },
    {
      name: 'tipo',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Entrada',
          value: 'entrada',
        },
        {
          label: 'Saída',
          value: 'saida',
        },
      ],
      label: 'Tipo de Movimentação',
    },
    {
      name: 'quantidade',
      type: 'number',
      required: true,
      label: 'Quantidade',
      min: 0,
    },
    {
      name: 'data',
      type: 'date',
      required: true,
      label: 'Data da Movimentação',
    },
    {
      name: 'descricao',
      type: 'textarea',
      label: 'Descrição',
    },
  ],
}

export default MovimentacoesEstoque