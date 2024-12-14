Projeto CRUD com MySQL, MongoDB, Redis e RabbitMQ

Este é um projeto de exemplo que utiliza Node.js com integração de múltiplos serviços: MySQL, MongoDB, Redis e RabbitMQ. Ele fornece um sistema de CRUD para gerenciar DVDs e diretores. O projeto utiliza filas para comunicação assíncrona e cache para otimização de consultas.

Dependências Externas

Certifique-se de ter as seguintes ferramentas instaladas no seu ambiente:

Node.js (versão 14 ou superior): https://nodejs.org/

MySQL: https://dev.mysql.com/doc/refman/8.0/en/installing.html

MongoDB: https://www.mongodb.com/docs/manual/installation/

Redis: https://redis.io/docs/getting-started/installation/

RabbitMQ: https://www.rabbitmq.com/download.html

*TODAS AS DEPENDÊNCIAS FORAM INSTALADAS LOCALMENTE*

Configuração do Projeto

1. Clonar o repositório

git clone https://github.com/seu-usuario/delbank-prova-backend.git
cd delbank-prova-backend

2. Instalar dependências

Instale as dependências do projeto com o comando abaixo:

npm install express body-parser mysql2 mongoose ioredis amqplib

Configuração do Banco de Dados NoSQL (MongoDB):

Certifique-se de que está na url de connect certa.

Url: mongodb://localhost:27017/crud_db

Configuração do Banco de Dados MySQL:

Certifique-se de que o serviço MySQL está ativo.

Crie um banco de dados chamado crud_db com o comando:

CREATE DATABASE crud_db;

Execute os seguintes comandos SQL para criar as tabelas necessárias:

CREATE TABLE directors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE TABLE dvds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    director_id INT NOT NULL,
    release_date DATE NOT NULL,
    copies INT NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (director_id) REFERENCES directors(id) ON DELETE CASCADE
);

Execução do Projeto

Certifique-se de que os serviços MySQL, MongoDB, Redis e RabbitMQ estão em execução localmente.

Certifique-se de que o Redis está instalado e em execução localmente.

Acesse o diretório que foi feita a instalação do redis.
Para verificar, execute o seguinte comando no terminal:
redis-cli ping

Se o Redis estiver funcionando corretamente, o retorno será:
PONG

Caso esteja tudo correto, basta listar o cache com o comando:
Keys * (Retorna todas as chaves no banco de dados atual)
GET <key> (Retorna o valor associado a uma chave específica)

Inicie o servidor com o comando:

node index.js

O servidor estará disponível em http://localhost:3000.

Funcionalidades

Endpoints para DVDs

Adicionar um novo DVD POST /dvds Exemplo de requisição:

{
    "title": "Aventuras de Gustavo",
    "genre": "Comédia",
    "directorId": 1,
    "releaseDate": "2005-05-05",
    "copies": 1
}

Listar todos os DVDs GET /dvds

Obter detalhes de um DVD específico GET /dvds/:id

Atualizar informações de um DVD PUT /dvds/:id

Excluir um DVD DELETE /dvds/:id

Endpoints para Diretores

Adicionar um novo diretor POST /directors Exemplo de requisição:

{
  "name": "Gustavo",
  "surname": "Almeida"
}

Listar todos os diretores GET /directors

Obter detalhes de um diretor específico GET /directors/:id

Atualizar informações de um diretorPUT /directors/:id

Excluir um diretorDELETE /directors/:id
