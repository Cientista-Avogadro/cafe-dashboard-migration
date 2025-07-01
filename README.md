# CAFÉ - Sistema de Gestão Agrícola

Sistema completo para gestão de propriedades agrícolas desenvolvido com Payload CMS e Next.js.

## Funcionalidades

### Gestão de Propriedades
- Cadastro e gerenciamento de propriedades
- Divisão em setores, lotes e canteiros
- Coordenadas GPS para mapeamento

### Culturas e Planejamento
- Cadastro de culturas e variedades
- Planejamento de plantio e colheita
- Controle de ciclos produtivos

### Operações Agrícolas
- Registro de irrigações
- Controle de pragas e doenças
- Aplicação de defensivos e fertilizantes

### Gestão Financeira
- Controle de receitas e despesas
- Categorização de transações
- Relatórios financeiros

### Estoque
- Controle de produtos e insumos
- Movimentações de entrada e saída
- Alertas de estoque baixo

### Relatórios
- Relatórios de produção
- Análises financeiras
- Exportação em PDF e CSV

## Tecnologias

- **Backend**: Payload CMS
- **Frontend**: Next.js 14 + React
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Maps**: Leaflet

## Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd cafe-agro-payload
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Configure o MongoDB e adicione a URL no arquivo `.env`

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse o painel administrativo em `http://localhost:3000/admin`

## Estrutura do Projeto

```
src/
├── app/                 # Next.js App Router
├── collections/         # Payload Collections
├── components/          # React Components
├── lib/                # Utilities
├── payload.config.ts   # Payload Configuration
└── server.ts           # Express Server
```

## Collections (Modelos de Dados)

- **Users**: Usuários do sistema
- **Propriedades**: Propriedades agrícolas
- **Setores**: Divisões da propriedade
- **Lotes**: Subdivisões dos setores
- **Canteiros**: Áreas de plantio
- **Culturas**: Tipos de culturas
- **Planejamentos**: Planejamento de plantio
- **Atividades**: Atividades programadas
- **Irrigações**: Registros de irrigação
- **Pragas**: Controle de pragas
- **Produtos Estoque**: Produtos em estoque
- **Movimentações Estoque**: Movimentações de estoque
- **Transações Financeiras**: Transações financeiras
- **Colheitas**: Registros de colheita
- **Sistema Configuração**: Configurações do sistema

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.