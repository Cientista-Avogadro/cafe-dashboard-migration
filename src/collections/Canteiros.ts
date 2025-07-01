import { CollectionConfig } from 'payload/types'

const Canteiros: CollectionConfig = {
  slug: 'canteiros',
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'lote', 'area', 'status'],
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
      label: 'Nome do Canteiro',
    },
    {
      name: 'lote',
      type: 'relationship',
      relationTo: 'lotes',
      required: true,
      label: 'Lote',
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
      label: 'Área (m²)',
      min: 0,
    },
    {
      name: 'cultura',
      type: 'relationship',
      relationTo: 'culturas',
      label: 'Cultura',
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

export default Canteiros