import { CollectionConfig } from 'payload/types'

const Colheitas: CollectionConfig = {
  slug: 'colheitas',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['cultura', 'quantidade_colhida', 'data', 'propriedade'],
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
      name: 'cultura',
      type: 'relationship',
      relationTo: 'culturas',
      required: true,
      label: 'Cultura',
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
      label: 'Data da Colheita',
    },
    {
      name: 'quantidade_colhida',
      type: 'number',
      required: true,
      label: 'Quantidade Colhida (kg)',
      min: 0,
    },
    {
      name: 'area_colhida',
      type: 'number',
      label: 'Área Colhida (hectares)',
      min: 0,
    },
    {
      name: 'produtividade_real',
      type: 'number',
      label: 'Produtividade Real (kg/ha)',
      min: 0,
    },
    {
      name: 'unidade',
      type: 'select',
      defaultValue: 'kg',
      options: [
        {
          label: 'Quilograma (kg)',
          value: 'kg',
        },
        {
          label: 'Tonelada (t)',
          value: 't',
        },
        {
          label: 'Saco (sc)',
          value: 'sc',
        },
      ],
      label: 'Unidade',
    },
    {
      name: 'destino',
      type: 'select',
      options: [
        {
          label: 'Venda',
          value: 'venda',
        },
        {
          label: 'Consumo Próprio',
          value: 'consumo_proprio',
        },
        {
          label: 'Armazenamento',
          value: 'armazenamento',
        },
        {
          label: 'Processamento',
          value: 'processamento',
        },
      ],
      label: 'Destino',
    },
    {
      name: 'observacoes',
      type: 'textarea',
      label: 'Observações',
    },
  ],
}

export default Colheitas