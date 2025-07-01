import { CollectionConfig } from 'payload/types'

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true,
  },
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'email', 'role', 'ativo'],
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
      label: 'Nome',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      label: 'Email',
    },
    {
      name: 'propriedade',
      type: 'relationship',
      relationTo: 'propriedades',
      required: true,
      label: 'Propriedade',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'operador',
      options: [
        {
          label: 'Administrador',
          value: 'admin',
        },
        {
          label: 'Gestor',
          value: 'gestor',
        },
        {
          label: 'Operador',
          value: 'operador',
        },
      ],
      label: 'Perfil',
    },
    {
      name: 'ativo',
      type: 'checkbox',
      defaultValue: true,
      label: 'Ativo',
    },
  ],
}

export default Users