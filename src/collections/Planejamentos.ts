import { CollectionConfig } from 'payload/types'

const Planejamentos: CollectionConfig = {
  slug: 'planejamentos',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['cultura', 'area_tipo', 'data_inicio', 'status'],
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
      name: 'cultura',
      type: 'relationship',
      relationTo: 'culturas',
      required: true,
      label: 'Cultura',
    },
    {
      name: 'area_tipo',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Setor',
          value: 'setor',
        },
        {
          label: 'Lote',
          value: 'lote',
        },
        {
          label: 'Canteiro',
          value: 'canteiro',
        },
      ],
      label: 'Tipo de Área',
    },
    {
      name: 'setor',
      type: 'relationship',
      relationTo: 'setores',
      label: 'Setor',
      admin: {
        condition: (data) => data.area_tipo === 'setor',
      },
    },
    {
      name: 'lote',
      type: 'relationship',
      relationTo: 'lotes',
      label: 'Lote',
      admin: {
        condition: (data) => data.area_tipo === 'lote',
      },
    },
    {
      name: 'canteiro',
      type: 'relationship',
      relationTo: 'canteiros',
      label: 'Canteiro',
      admin: {
        condition: (data) => data.area_tipo === 'canteiro',
      },
    },
    {
      name: 'data_inicio',
      type: 'date',
      required: true,
      label: 'Data de Início',
    },
    {
      name: 'data_fim_prevista',
      type: 'date',
      required: true,
      label: 'Data de Fim Prevista',
    },
    {
      name: 'area_plantada',
      type: 'number',
      label: 'Área Plantada (hectares)',
      min: 0,
    },
    {
      name: 'produtividade_esperada',
      type: 'number',
      label: 'Produtividade Esperada (kg/ha)',
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'planejado',
      options: [
        {
          label: 'Planejado',
          value: 'planejado',
        },
        {
          label: 'Em Andamento',
          value: 'em_andamento',
        },
        {
          label: 'Concluído',
          value: 'concluido',
        },
        {
          label: 'Cancelado',
          value: 'cancelado',
        },
      ],
      label: 'Status',
    },
  ],
}

export default Planejamentos