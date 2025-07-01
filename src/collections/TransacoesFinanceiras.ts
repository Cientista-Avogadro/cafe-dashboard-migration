import { CollectionConfig } from 'payload/types'

const TransacoesFinanceiras: CollectionConfig = {
  slug: 'transacoes-financeiras',
  admin: {
    useAsTitle: 'descricao',
    defaultColumns: ['descricao', 'tipo', 'valor', 'data'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'propriedade',
      type: 'relationship',
      relationTo: 'propriedades',
      required: true,
      label: 'Propriedade',
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
      label: 'Tipo de Transação',
    },
    {
      name: 'valor',
      type: 'number',
      required: true,
      label: 'Valor',
      min: 0,
    },
    {
      name: 'descricao',
      type: 'text',
      required: true,
      label: 'Descrição',
    },
    {
      name: 'data',
      type: 'date',
      required: true,
      label: 'Data da Transação',
    },
    {
      name: 'categoria',
      type: 'text',
      required: true,
      label: 'Categoria',
    },
  ],
}

export default TransacoesFinanceiras