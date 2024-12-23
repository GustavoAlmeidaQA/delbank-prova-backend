Projeto CRUD com MySQL, MongoDB, Redis e RabbitMQ

Este é um projeto de exemplo que utiliza Node.js com integração de múltiplos serviços: MySQL, MongoDB, Redis e RabbitMQ. Ele fornece um sistema de CRUD para gerenciar DVDs e diretores. O projeto utiliza filas para comunicação assíncrona e cache para otimização de consultas.

Dependências Externas

Certifique-se de ter as seguintes ferramentas instaladas localmente no seu ambiente:

Node.js (versão 14 ou superior): Download Node.js

MySQL: Guia de Instalação do MySQL

MongoDB: Guia de Instalação do MongoDB

Redis: Guia de Instalação do Redis

RabbitMQ: Guia de Instalação do RabbitMQ

Observação: Todas as dependências mencionadas acima devem ser instaladas e configuradas localmente para a execução do projeto.

Configuração do Projeto

1. Clonar o Repositório

git clone https://github.com/seu-usuario/delbank-prova-backend.git
cd delbank-prova-backend

2. Instalar Dependências

Instale as dependências necessárias do projeto com o comando abaixo:

npm install express body-parser mysql2 mongoose ioredis amqplib

3. Configuração do Banco de Dados NoSQL (MongoDB)

Certifique-se de que o MongoDB está em execução localmente e use a seguinte URL de conexão:

mongodb://localhost:27017/crud_db

4. Configuração do Banco de Dados Relacional (MySQL)

Certifique-se de que o serviço MySQL está ativo e:

Crie um banco de dados chamado crud_db com o comando:

CREATE DATABASE crud_db;

Execute os comandos SQL abaixo para criar as tabelas necessárias:

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

5. Configuração do Redis

Certifique-se de que o Redis está instalado e em execução localmente.

Acesse o diretório de instalação do Redis e verifique sua execução com o comando:

redis-cli ping

Se o Redis estiver funcionando corretamente, o retorno será:

PONG

Utilize os seguintes comandos para manipular o cache durante os testes:

KEYS *   # Retorna todas as chaves no banco de dados atual
GET <key> # Retorna o valor associado a uma chave específica

6. Configuração do RabbitMQ

Certifique-se de que o RabbitMQ está instalado e em execução localmente.

Acesse o painel de administração do RabbitMQ no navegador em:

http://localhost:15672

Use o login e senha padrão (guest/guest) para acessar o painel.

Execução do Projeto

Certifique-se de que os serviços MySQL, MongoDB, Redis e RabbitMQ estão em execução localmente.

Inicie o servidor com o comando:

node index.js

O servidor estará disponível em:

http://localhost:3000

Funcionalidades do Sistema

Endpoints para Diretores

Adicionar um novo diretor

POST /directors

Exemplo de requisição:

{
    "name": "Gustavo",
    "surname": "Almeida"
}

Listar todos os diretores

GET /directors

Obter detalhes de um diretor específico

GET /directors/:id

Atualizar informações de um diretor

PUT /directors/:id

Excluir um diretor

DELETE /directors/:id

Endpoints para DVDs

Adicionar um novo DVD

POST /dvds

Exemplo de requisição:

{
    "title": "Aventuras de Gustavo",
    "genre": "Comédia",
    "directorId": 1,
    "releaseDate": "2005-05-05",
    "copies": 1
}

Listar todos os DVDs

GET /dvds

Obter detalhes de um DVD específico

GET /dvds/:id

Atualizar informações de um DVD

PUT /dvds/:id

Excluir um DVD

DELETE /dvds/:id

Fluxo para Teste Completo

Criar um diretor:

Use o endpoint POST /directors para criar um diretor.

Criar um DVD:

Use o endpoint POST /dvds para adicionar um DVD vinculado ao diretor criado anteriormente.

Manipular os dados:

Liste, atualize ou exclua os diretores e DVDs utilizando os respectivos endpoints.

Verificar o cache no Redis:

Após realizar requisições de listagem, use os comandos KEYS * e GET <key> para verificar se os dados estão sendo armazenados em cache corretamente.

Verificar no MySQL:

Acesse o banco de dados crud_db no MySQL e execute os comandos SELECT * FROM directors; e SELECT * FROM dvds; para verificar se os dados foram salvos corretamente.

Verificar no RabbitMQ:

Acesse o painel de administração do RabbitMQ em http://localhost:15672 e navegue até as filas para verificar se as mensagens relacionadas às operações CRUD estão sendo enviadas corretamente.

Verificar no MongoDB:

Acesse o banco de dados MongoDB e crie uma conexão local com a url fornecida (mongodb://127.0.0.1:27017/crud_db), assim poderá validar os dados que estão sendo inseridos.

Com estas instruções, o sistema estará configurado para execução local e pronto para ser testado em sua totalidade.
