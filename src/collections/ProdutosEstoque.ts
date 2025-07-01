import { CollectionConfig } from 'payload/types'

const ProdutosEstoque: CollectionConfig = {
  slug: 'produtos-estoque',
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'categoria', 'quantidade', 'unidade'],
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
      label: 'Nome do Produto',
    },
    {
      name: 'propriedade',
      type: 'relationship',
      relationTo: 'propriedades',
      required: true,
      label: 'Propriedade',
    },
    {
      name: 'categoria',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Fertilizantes',
          value: 'fertilizantes',
        },
        {
          label: 'Defensivos',
          value: 'defensivos',
        },
        {
          label: 'Sementes',
          value: 'sementes',
        },
        {
          label: 'Ferramentas',
          value: 'ferramentas',
        },
        {
          label: 'Equipamentos',
          value: 'equipamentos',
        },
        {
          label: 'Outros',
          value: 'outros',
        },
      ],
      label: 'Categoria',
    },
    {
      name: 'unidade',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Quilograma (kg)',
          value: 'kg',
        },
        {
          label: 'Litro (L)',
          value: 'L',
        },
        {
          label: 'Unidade (un)',
          value: 'un',
        },
        {
          label: 'Saco (sc)',
          value: 'sc',
        },
        {
          label: 'Tonelada (t)',
          value: 't',
        },
      ],
      label: 'Unidade de Medida',
    },
    {
      name: 'quantidade',
      type: 'number',
      required: true,
      label: 'Quantidade em Estoque',
      min: 0,
    },
    {
      name: 'preco_unitario',
      type: 'number',
      label: 'Preço Unitário',
      min: 0,
    },
    {
      name: 'dose_por_hectare',
      type: 'number',
      label: 'Dose por Hectare',
      min: 0,
    },
  ],
}

export default ProdutosEstoque