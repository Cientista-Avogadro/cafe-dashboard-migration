import { CollectionConfig } from 'payload/types'

const Pragas: CollectionConfig = {
  slug: 'pragas',
  admin: {
    useAsTitle: 'tipo_praga',
    defaultColumns: ['tipo_praga', 'data', 'resultado', 'propriedade'],
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
      label: 'Data da Ocorrência',
    },
    {
      name: 'tipo_praga',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Pulgão',
          value: 'Pulgão',
        },
        {
          label: 'Lagarta',
          value: 'Lagarta',
        },
        {
          label: 'Mosca-branca',
          value: 'Mosca-branca',
        },
        {
          label: 'Ácaro',
          value: 'Ácaro',
        },
        {
          label: 'Cochonilha',
          value: 'Cochonilha',
        },
        {
          label: 'Tripes',
          value: 'Tripes',
        },
        {
          label: 'Broca',
          value: 'Broca',
        },
        {
          label: 'Nematóide',
          value: 'Nematóide',
        },
        {
          label: 'Fungos',
          value: 'Fungos',
        },
        {
          label: 'Bactérias',
          value: 'Bactérias',
        },
        {
          label: 'Vírus',
          value: 'Vírus',
        },
      ],
      label: 'Tipo de Praga',
    },
    {
      name: 'metodo_controle',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Inseticida orgânico',
          value: 'Inseticida orgânico',
        },
        {
          label: 'Inseticida químico',
          value: 'Inseticida químico',
        },
        {
          label: 'Controle biológico',
          value: 'Controle biológico',
        },
        {
          label: 'Armadilhas',
          value: 'Armadilhas',
        },
        {
          label: 'Barreiras físicas',
          value: 'Barreiras físicas',
        },
        {
          label: 'Rotação de culturas',
          value: 'Rotação de culturas',
        },
        {
          label: 'Práticas culturais',
          value: 'Práticas culturais',
        },
        {
          label: 'Resistência genética',
          value: 'Resistência genética',
        },
      ],
      label: 'Método de Controle',
    },
    {
      name: 'resultado',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Em andamento',
          value: 'Em andamento',
        },
        {
          label: 'Resolvida',
          value: 'Resolvida',
        },
        {
          label: 'Parcial',
          value: 'Parcial',
        },
        {
          label: 'Não resolvida',
          value: 'Não resolvida',
        },
      ],
      label: 'Resultado',
    },
  ],
}

export default Pragas