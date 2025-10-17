### Teste NodeJS – Registro de Produtos (NestJS + PostgreSQL)

Este repositório contém a base de um projeto NestJS e a infraestrutura (Docker) para o desafio de Registro de Produtos. Abaixo você encontra a estrutura do projeto, como executar localmente e o enunciado do teste com critérios de avaliação.

### Estrutura do projeto

```
/
├─ docker-compose.yaml        # Infra local: PostgreSQL + RabbitMQ (opcional/diferencial)
├─ server/                    # Aplicação NestJS (API)
│  ├─ package.json            # Scripts, dependências e configuração do Jest
│  ├─ src/
│  │  ├─ main.ts             # Bootstrap da aplicação Nest
│  │  ├─ app.module.ts       # Módulo raiz
│  │  └─ products/           # Módulo de Produtos (ponto de partida)
│  │     └─ products.module.ts
│  ├─ tsconfig*.json          # Configurações TypeScript
│  ├─ eslint.config.mjs       # Linting
│  └─ test/                   # Testes (Jest)
└─ README.md                  # Este arquivo
```

### Requisitos do ambiente

- NodeJS versão 16 ou superior
- PostgreSQL (via Docker incluso neste repositório)
- NestJS (framework da API)
- Jest (testes unitários)

### Execução (modo local)

1. Subir infraestrutura (PostgreSQL e, opcionalmente, RabbitMQ):

```bash
docker compose up -d database rabbitmq
```

Credenciais padrão (definidas em `docker-compose.yaml`):

- PostgreSQL: host `localhost`, porta `5432`, db `batch_processing`, user `user`, password `password`
- RabbitMQ (diferencial): host `localhost`, porta `5672`; painel em `http://localhost:15672` (user: `user`, pass: `password`)

2. Instalar e rodar a API:

```bash
cd server
npm install

npm run start:dev
```

3. Variáveis de ambiente (sugestão):

Você pode configurar via `.env` (ou por variáveis de ambiente) algo como:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=user
DATABASE_PASSWORD=password
DATABASE_NAME=batch_processing
TYPEORM_SYNCHRONIZE=true   # apenas para desenvolvimento

# Diferencial (assíncrono)
RABBITMQ_URL=amqp://user:password@localhost:5672
```

### Endpoints esperados (diretriz do teste)

- POST `/produtos/upload` — recebe um arquivo (CSV ou JSON) via `multipart/form-data` (campo `file`) e inicia o processamento síncrono (ler, validar e persistir os registros válidos no PostgreSQL). Deve retornar sucesso/erro do recebimento e início do processamento.
- (Diferencial) GET `/produtos` — lista todos os produtos cadastrados.

Exemplo de requisição (CSV):

```bash
curl -X POST http://localhost:3000/produtos/upload \
  -F "file=@./exemplo.csv"
```

Formato CSV sugerido:

```
nome,descricao,preco
"Caneta Azul","Esferográfica",2.50
"Caderno","96 folhas",12.90
```

Exemplo JSON alternativo (array de objetos):

```json
[
  { "nome": "Caneta Azul", "descricao": "Esferográfica", "preco": 2.5 },
  { "nome": "Caderno", "descricao": "96 folhas", "preco": 12.9 }
]
```

### Como rodar os testes

```bash
cd server
npm run test

# Cobertura
npm run test:cov
```

### Enunciado do teste (o que deve ser implementado)

- Objetivo: Avaliar habilidades fundamentais de um desenvolvedor NodeJS Júnior: criação de API RESTful, persistência com PostgreSQL, processamento básico de arquivos e testes unitários.

- Instruções gerais:

  - Utilize NodeJS 16+ e NestJS
  - Utilize PostgreSQL
  - Utilize Jest para testes unitários
  - Entrega em repositório Git público, com README explicando execução e testes
  - Opcional: documentar decisões de design
  - Prazo: negociável (sugestão: 3–5 dias úteis)

- Problema:

  - Desenvolver um sistema simples de registro de dados. O sistema deve receber um arquivo de texto (CSV ou JSON), processar, validar e armazenar Produtos em PostgreSQL.

- Requisitos obrigatórios:

  - API RESTful (NestJS)
    - Endpoint POST `/produtos/upload` para receber arquivo CSV ou JSON (escolha um)
    - Retornar mensagem de sucesso/erro após o recebimento e início do processamento
  - Processamento de arquivo
    - Ler e mapear cada linha/registro para um objeto Produto
  - Validação de dados
    - Campos obrigatórios: Nome do Produto e Preço
    - Tipo: Preço deve ser numérico
    - Registros inválidos devem ser ignorados; registre o erro (array em memória ou log no console)
  - Banco de Dados (PostgreSQL)
    - Tabela `produtos` com: `id`, `nome`, `descricao`, `preco`
    - Inserir apenas registros válidos
  - Persistência simples (sincronismo)
    - Processamento e persistência ocorrem na mesma requisição após o upload
  - Testes unitários (Jest)
    - Cobrir validação (ex.: rejeitar preço inválido)
    - Cobrir leitura e mapeamento do arquivo (mockar conteúdo)

- Diferenciais (opcionais):

  - Mensageria com RabbitMQ (processamento assíncrono)
    - Ao receber o arquivo, enviar mensagem para fila; um Consumer realiza leitura, validação e persistência
    - Bibliotecas sugeridas: `@nestjs/microservices` (transporte RMQ) ou `@golevelup/nestjs-rabbitmq`
  - Endpoint GET para listar produtos
  - Tratamento de erros robusto (ex.: HTTP 400 para erros de validação/upload)
  - Caso utilize rabbitmq, documente no README.md a arquitetura de processamento escolhida utilizando o rabbitmq

- Avaliação:

  - Funcionalidade (API, processamento, validação, persistência)
  - Qualidade do código (organização, legibilidade, convenções NestJS)
  - Testes unitários (cobertura da lógica crítica)
  - Uso correto de NestJS, PostgreSQL e Jest
  - Diferenciais (RabbitMQ é um grande bônus)

- Observações:
  - Priorize a qualidade do código e a cobertura de testes

### Dicas rápidas

- Comece pelo módulo `products` e adicione controller, service, DTOs e entidade do TypeORM.
- Para o upload, use `multer` (já adicionado) com `@nestjs/platform-express`.
- Para parsing de CSV, você pode usar bibliotecas como `csv-parse` ou implementar parsing simples.
- Em desenvolvimento, `TYPEORM_SYNCHRONIZE=true` ajuda a criar a tabela automaticamente (não usar em produção).

### Licença

Este projeto é disponibilizado apenas para fins de avaliação técnica.
