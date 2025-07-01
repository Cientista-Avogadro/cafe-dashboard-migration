import { CollectionConfig } from 'payload/types'

const Lotes: CollectionConfig = {
  slug: 'lotes',
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'setor', 'area', 'status'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'nome',
      type: 'text',
      required: true,
      label: 'Nome do Lote',
    },
    {
      name: 'setor',
      type: 'relationship',
      relationTo: 'setores',
      required: true,
      label: 'Setor',
    },
    {
      name: 'propriedade',
      type: 'relationship',
      relationTo: 'propriedades',
      required: true,
      label: 'Propriedade',
    },
    {
      name: 'area',
      type: 'number',
      label: 'Área (hectares)',
      min: 0,
    },
    {
      name: 'cultura_atual',
      type: 'relationship',
      relationTo: 'culturas',
      label: 'Cultura Atual',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'disponivel',
      options: [
        {
          label: 'Disponível',
          value: 'disponivel',
        },
        {
          label: 'Plantado',
          value: 'plantado',
        },
        {
          label: 'Em Preparação',
          value: 'preparacao',
        },
        {
          label: 'Colheita',
          value: 'colheita',
        },
      ],
      label: 'Status',
    },
    {
      name: 'descricao',
      type: 'textarea',
      label: 'Descrição',
    },
    {
      name: 'observacao',
      type: 'textarea',
      label: 'Observações',
    },
    {
      name: 'coordenadas',
      type: 'group',
      label: 'Coordenadas GPS',
      fields: [
        {
          name: 'latitude',
          type: 'number',
          label: 'Latitude',
        },
        {
          name: 'longitude',
          type: 'number',
          label: 'Longitude',
        },
      ],
    },
  ],
}

export default Lotes