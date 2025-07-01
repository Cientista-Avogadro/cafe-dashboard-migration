import { CollectionConfig } from 'payload/types'

const Propriedades: CollectionConfig = {
  slug: 'propriedades',
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'localizacao', 'tamanho'],
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
      label: 'Nome da Propriedade',
    },
    {
      name: 'localizacao',
      type: 'text',
      required: true,
      label: 'Localização',
    },
    {
      name: 'tamanho',
      type: 'number',
      required: true,
      label: 'Tamanho (hectares)',
      min: 0,
    },
    {
      name: 'nif',
      type: 'text',
      label: 'NIF/NIPC',
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

export default Propriedades