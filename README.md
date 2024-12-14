# delbank-prova-backend

Projeto de Gestão de DVDs e Diretores

Este é um sistema que utiliza um conjunto de tecnologias e integrações para gerenciar DVDs e diretores. Ele oferece endpoints RESTful para realizar operações CRUD, cache com Redis, fila de mensagens com RabbitMQ e suporte a banco de dados MySQL e MongoDB.

Tecnologias utilizadas

Node.js: Ambiente de execução para JavaScript no servidor.

Express: Framework para criar a API REST.

MySQL: Banco de dados relacional para armazenar informações primárias sobre DVDs e diretores.

MongoDB: Banco de dados NoSQL para armazenamento paralelo das informações, com suporte a operações baseadas em mensagens.

Redis: Sistema de cache para otimizar o acesso aos dados.

RabbitMQ: Sistema de filas de mensagens para sincronização entre os bancos de dados.

Dependências do projeto

Este projeto utiliza os seguintes pacotes e bibliotecas:

Dependências principais:

express: Para criar rotas e gerenciar requisições HTTP.

body-parser: Para processar o corpo das requisições HTTP no formato JSON.

mysql2: Para integração com o banco de dados MySQL.

mongoose: Para conexão e modelagem de dados no MongoDB.

ioredis: Cliente para integração com Redis.

amqplib: Biblioteca para interação com RabbitMQ.

Dependências de desenvolvimento:

nodemon (opcional): Para reiniciar automaticamente o servidor durante o desenvolvimento.

Requisitos do ambiente

Antes de executar o projeto, assegure-se de ter as seguintes dependências instaladas localmente:

Node.js: Versão 14 ou superior.

Redis: Serviço em execução na porta padrão (6379).

RabbitMQ: Serviço em execução na porta padrão (5672).

MongoDB: Serviço em execução na porta padrão (27017).

MySQL: Serviço configurado com um banco de dados chamado crud_db.

Configuração do ambiente

Clone o repositório:

git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>

Instale as dependências:

npm install

Configure as variáveis de ambiente:

Crie um arquivo .env na raiz do projeto com as seguintes configurações (modifique conforme seu ambiente):

MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=guest
MYSQL_DATABASE=crud_db

RABBITMQ_URL=amqp://localhost
PORT=3000

Configure o banco de dados MySQL:

Execute os comandos SQL abaixo para criar as tabelas necessárias:

CREATE DATABASE IF NOT EXISTS crud_db;

USE crud_db;

CREATE TABLE IF NOT EXISTS dvds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    director_id INT NOT NULL,
    release_date DATE NOT NULL,
    copies INT NOT NULL,
    available BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS directors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL
);

Execução do projeto

Certifique-se de que os seguintes serviços estão em execução:

Redis

RabbitMQ

MongoDB

MySQL

Inicie o servidor:

node index.js

Acesse a API:
O servidor estará rodando em: http://localhost:3000

Endpoints da API

DVDs

Criar DVD

POST /dvds

Corpo da requisição:

{
  "title": "Titulo do Filme",
  "genre": "Gênero",
  "directorId": 1,
  "releaseDate": "2024-12-01",
  "copies": 10
}

Listar DVDs

GET /dvds

Obter DVD por ID

GET /dvds/:id

Atualizar DVD

PUT /dvds/:id

Corpo da requisição:

{
  "title": "Novo Titulo",
  "genre": "Novo Gênero",
  "directorId": 2,
  "releaseDate": "2024-12-10",
  "copies": 5
}

Excluir DVD

DELETE /dvds/:id

Diretores

Criar Diretor

POST /directors

Corpo da requisição:

{
  "name": "Nome",
  "surname": "Sobrenome"
}

Listar Diretores

GET /directors

Obter Diretor por ID

GET /directors/:id

Atualizar Diretor

PUT /directors/:id

Corpo da requisição:

{
  "name": "Novo Nome",
  "surname": "Novo Sobrenome"
}

Excluir Diretor

DELETE /directors/:id

Integrações

RabbitMQ: Utilizado para sincronizar dados entre o MySQL e MongoDB.

Redis: Cache implementado para otimizar o tempo de resposta dos endpoints.
