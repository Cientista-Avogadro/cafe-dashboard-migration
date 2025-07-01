import { buildConfig } from 'payload/config'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { slateEditor } from '@payloadcms/richtext-slate'
import path from 'path'

// Collections
import Users from './collections/Users'
import Propriedades from './collections/Propriedades'
import Setores from './collections/Setores'
import Lotes from './collections/Lotes'
import Canteiros from './collections/Canteiros'
import Culturas from './collections/Culturas'
import Planejamentos from './collections/Planejamentos'
import Atividades from './collections/Atividades'
import Irrigacoes from './collections/Irrigacoes'
import Pragas from './collections/Pragas'
import ProdutosEstoque from './collections/ProdutosEstoque'
import MovimentacoesEstoque from './collections/MovimentacoesEstoque'
import TransacoesFinanceiras from './collections/TransacoesFinanceiras'
import Colheitas from './collections/Colheitas'
import SistemaConfiguracao from './collections/SistemaConfiguracao'

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    meta: {
      titleSuffix: '- CAFÉ Sistema de Gestão Agrícola',
      favicon: '/favicon.svg',
      ogImage: '/og-image.jpg',
    },
  },
  editor: slateEditor({}),
  collections: [
    Users,
    Propriedades,
    Setores,
    Lotes,
    Canteiros,
    Culturas,
    Planejamentos,
    Atividades,
    Irrigacoes,
    Pragas,
    ProdutosEstoque,
    MovimentacoesEstoque,
    TransacoesFinanceiras,
    Colheitas,
    SistemaConfiguracao,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI!,
  }),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
})