import { CollectionConfig } from 'payload/types'

const Setores: CollectionConfig = {
  slug: 'setores',
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'propriedade', 'area'],
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
      label: 'Nome do Setor',
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

export default Setores