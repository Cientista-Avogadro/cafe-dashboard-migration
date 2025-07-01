import { CollectionConfig } from 'payload/types'

const Atividades: CollectionConfig = {
  slug: 'atividades',
  admin: {
    useAsTitle: 'tipo',
    defaultColumns: ['tipo', 'data_prevista', 'propriedade'],
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
      name: 'planejamento',
      type: 'relationship',
      relationTo: 'planejamentos',
      label: 'Planejamento',
    },
    {
      name: 'canteiro',
      type: 'relationship',
      relationTo: 'canteiros',
      label: 'Canteiro',
    },
    {
      name: 'tipo',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Alerta de Colheita',
          value: 'Alerta de Colheita',
        },
        {
          label: 'Conclusão de Planejamento',
          value: 'Conclusão de Planejamento',
        },
        {
          label: 'Irrigação',
          value: 'Irrigação',
        },
        {
          label: 'Tratamento de Praga',
          value: 'Tratamento de Praga',
        },
        {
          label: 'Outros',
          value: 'Outros',
        },
      ],
      label: 'Tipo de Atividade',
    },
    {
      name: 'data_prevista',
      type: 'date',
      required: true,
      label: 'Data Prevista',
    },
    {
      name: 'observacoes',
      type: 'textarea',
      label: 'Observações',
    },
  ],
}

export default Atividades