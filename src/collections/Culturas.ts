import { CollectionConfig } from 'payload/types'

const Culturas: CollectionConfig = {
  slug: 'culturas',
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'variedade', 'ciclo_estimado_dias', 'produtividade'],
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
      label: 'Nome da Cultura',
    },
    {
      name: 'propriedade',
      type: 'relationship',
      relationTo: 'propriedades',
      required: true,
      label: 'Propriedade',
    },
    {
      name: 'variedade',
      type: 'text',
      label: 'Variedade',
    },
    {
      name: 'ciclo_estimado_dias',
      type: 'number',
      label: 'Ciclo Estimado (dias)',
      min: 1,
    },
    {
      name: 'produtividade',
      type: 'number',
      label: 'Produtividade Esperada (kg/ha)',
      min: 0,
    },
    {
      name: 'epoca_plantio',
      type: 'group',
      label: 'Época de Plantio',
      fields: [
        {
          name: 'inicio',
          type: 'date',
          label: 'Início da Época',
        },
        {
          name: 'fim',
          type: 'date',
          label: 'Fim da Época',
        },
      ],
    },
  ],
}

export default Culturas