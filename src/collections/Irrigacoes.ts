import { CollectionConfig } from 'payload/types'

const Irrigacoes: CollectionConfig = {
  slug: 'irrigacoes',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['data', 'volume_agua', 'metodo', 'propriedade'],
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
      name: 'setor',
      type: 'relationship',
      relationTo: 'setores',
      label: 'Setor',
    },
    {
      name: 'lote',
      type: 'relationship',
      relationTo: 'lotes',
      label: 'Lote',
    },
    {
      name: 'canteiro',
      type: 'relationship',
      relationTo: 'canteiros',
      label: 'Canteiro',
    },
    {
      name: 'data',
      type: 'date',
      required: true,
      label: 'Data da Irrigação',
    },
    {
      name: 'volume_agua',
      type: 'number',
      required: true,
      label: 'Volume de Água (litros)',
      min: 0,
    },
    {
      name: 'metodo',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Aspersão',
          value: 'Aspersão',
        },
        {
          label: 'Gotejamento',
          value: 'Gotejamento',
        },
        {
          label: 'Microaspersão',
          value: 'Microaspersão',
        },
        {
          label: 'Superficial',
          value: 'Superficial',
        },
        {
          label: 'Subsuperficial',
          value: 'Subsuperficial',
        },
        {
          label: 'Outro',
          value: 'Outro',
        },
      ],
      label: 'Método de Irrigação',
    },
  ],
}

export default Irrigacoes