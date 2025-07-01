import { CollectionConfig } from 'payload/types'

const SistemaConfiguracao: CollectionConfig = {
  slug: 'sistema-configuracao',
  admin: {
    useAsTitle: 'propriedade',
    defaultColumns: ['propriedade', 'moeda_principal', 'unidade_area'],
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
      unique: true,
      label: 'Propriedade',
    },
    {
      name: 'moeda_principal',
      type: 'select',
      defaultValue: 'EUR',
      options: [
        {
          label: 'Euro (€)',
          value: 'EUR',
        },
        {
          label: 'Dólar Americano ($)',
          value: 'USD',
        },
        {
          label: 'Kwanza Angolano (Kz)',
          value: 'AOA',
        },
      ],
      label: 'Moeda Principal',
    },
    {
      name: 'taxas_cambio',
      type: 'group',
      label: 'Taxas de Câmbio',
      fields: [
        {
          name: 'usd',
          type: 'number',
          defaultValue: 1,
          label: 'Taxa USD',
        },
        {
          name: 'eur',
          type: 'number',
          defaultValue: 1,
          label: 'Taxa EUR',
        },
        {
          name: 'aoa',
          type: 'number',
          defaultValue: 1,
          label: 'Taxa AOA',
        },
      ],
    },
    {
      name: 'atualizar_cambio_automaticamente',
      type: 'checkbox',
      defaultValue: false,
      label: 'Atualizar Câmbio Automaticamente',
    },
    {
      name: 'unidade_area',
      type: 'select',
      defaultValue: 'ha',
      options: [
        {
          label: 'Hectare (ha)',
          value: 'ha',
        },
        {
          label: 'Metro Quadrado (m²)',
          value: 'm2',
        },
        {
          label: 'Acre (ac)',
          value: 'acre',
        },
      ],
      label: 'Unidade de Área',
    },
    {
      name: 'tema',
      type: 'select',
      defaultValue: 'sistema',
      options: [
        {
          label: 'Claro',
          value: 'claro',
        },
        {
          label: 'Escuro',
          value: 'escuro',
        },
        {
          label: 'Seguir Sistema',
          value: 'sistema',
        },
      ],
      label: 'Tema',
    },
  ],
}

export default SistemaConfiguracao