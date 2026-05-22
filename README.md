# Sistema de Gerenciamento de Seguranca

Projeto web simples para controle de acesso nas Industrias Wayne, com autenticacao, autorizacao por perfil, gestao de recursos e dashboard.

## Objetivo
Permitir que apenas usuarios autorizados acessem areas restritas e que perfis com mais permissao possam gerenciar recursos internos.

## Perfis de usuario
- Funcionario: `marcio / 123`
- Gerente: `bruce / 123`
- Administrador: `alfred / 123`

## Funcionalidades
- Login com validacao no backend
- Controle de acesso por perfil
- Verificacao de entrada em areas restritas
- Cadastro, edicao e remocao de recursos
- Registro de atividades recentes
- Persistencia de dados em arquivo JSON

## Tecnologias
- HTML
- CSS
- JavaScript
- Node.js

## Estrutura
- `index.html`: interface principal
- `style.css`: visual e responsividade
- `script.js`: logica do front-end e consumo da API
- `server.js`: backend e rotas da aplicacao
- `database.json`: banco de dados simples em arquivo

## Como executar
1. Abra o terminal na pasta do projeto.
2. Execute `npm start`.
3. Acesse `http://localhost:3000`.

## Rotas principais da API
- `POST /api/login`
- `GET /api/config`
- `GET /api/resources`
- `GET /api/activities`
- `POST /api/access-check`
- `POST /api/resources`
- `PUT /api/resources/:id`
- `DELETE /api/resources/:id`
- `POST /api/reset`

## Observacoes
- O sistema foi feito de forma simples, com foco academico.
- O backend salva os dados no arquivo `database.json`.
- Para aplicar mudancas no servidor, pode ser necessario reiniciar o `npm start`.
