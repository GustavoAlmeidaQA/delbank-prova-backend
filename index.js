const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const amqp = require('amqplib/callback_api');
const mongoose = require('mongoose');
const Redis = require('ioredis');

const redis = new Redis();
const app = express();
const PORT = process.env.PORT || 3000;
const ObjectId = mongoose.Types.ObjectId;

app.use(bodyParser.json());

redis.on('connect', () => console.log('Connected to Redis!'));
redis.on('error', (err) => console.error('Redis error:', err));

const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'guest',
  database: process.env.MYSQL_DATABASE || 'crud_db',
};

const mysqlConnection = mysql.createConnection(mysqlConfig);
mysqlConnection.connect((err) => {
  if (err) {
    console.error('Connection to MySQL failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL!');
});

mongoose
  .connect('mongodb://127.0.0.1:27017/crud_db', { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const DVD = mongoose.model('DVD', new mongoose.Schema({
  _id: String,
  title: String,
  genre: String,
  director: {
    id: String,
    name: String,
    surname: String
  },
  releaseDate: Date,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}));

const Director = mongoose.model('Director', new mongoose.Schema({
  _id: String,
  name: String,
  surname: String,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}));

let rabbitChannel;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

amqp.connect(RABBITMQ_URL, (err, connection) => {
  if (err) {
    console.error('Failed to connect to RabbitMQ:', err);
    process.exit(1);
  }
  connection.createChannel((err, channel) => {
    if (err) {
      console.error('Failed to create RabbitMQ channel:', err);
      process.exit(1);
    }
    rabbitChannel = channel;
    rabbitChannel.assertQueue('dvds_queue', { durable: true });
    rabbitChannel.assertQueue('directors_queue', { durable: true });
    console.log('Connected to RabbitMQ and queues created!');

    rabbitChannel.consume(
      'dvds_queue',
      async (msg) => {
        const { action, dvd, id } = JSON.parse(msg.content.toString());
        try {
          if (action === 'insert') {
            await DVD.create({
              _id: dvd.id,
              title: dvd.title,
              genre: dvd.genre,
              director: dvd.director,
              releaseDate: dvd.releaseDate,
              createdAt: dvd.createdAt,
              updatedAt: dvd.updatedAt
            });
            console.log('DVD inserted into MongoDB:', dvd);
          } else if (action === 'update') {
            await DVD.updateOne(
              { _id: dvd.id },
              {
                $set: {
                  title: dvd.title,
                  genre: dvd.genre,
                  director: dvd.director,
                  releaseDate: dvd.releaseDate,
                  updatedAt: dvd.updatedAt
                }
              }
            );
            console.log('DVD updated in MongoDB:', dvd);
          } else if (action === 'delete') {
            await DVD.updateOne(
              { _id: id },
              { $set: { deletedAt: new Date() } }
            );
            console.log('DVD marked as deleted in MongoDB with ID:', id);
          }
          rabbitChannel.ack(msg);
        } catch (err) {
          console.error('Error processing RabbitMQ message:', err);
          rabbitChannel.nack(msg);
        }
      },
      { noAck: false }
    );

    rabbitChannel.consume(
      'directors_queue',
      async (msg) => {
        const { action, director, id } = JSON.parse(msg.content.toString());
        try {
          if (action === 'insert') {
            await Director.create({
              _id: director.id,
              name: director.name,
              surname: director.surname,
              createdAt: director.createdAt,
              updatedAt: director.updatedAt
            });
            console.log('Director inserted into MongoDB:', director);
          } else if (action === 'update') {
            await Director.updateOne(
              { _id: director.id },
              {
                $set: {
                  name: director.name,
                  surname: director.surname,
                  updatedAt: director.updatedAt
                }
              }
            );
            console.log('Director updated in MongoDB:', director);
          } else if (action === 'delete') {
            await Director.updateOne(
              { _id: id },
              { $set: { deletedAt: new Date() } }
            );
            console.log('Director marked as deleted in MongoDB with ID:', id);
          }
          rabbitChannel.ack(msg);
        } catch (err) {
          console.error('Error processing RabbitMQ message:', err);
          rabbitChannel.nack(msg);
        }
      },
      { noAck: false }
    );
  });
});

app.post('/dvds', async (req, res) => {
  const { title, genre, directorId, releaseDate, copies } = req.body;
  if (!title || !genre || !directorId || !releaseDate || copies == null) {
    return res.status(400).json({ error: 'All fields are required: title, genre, directorId, releaseDate, copies.' });
  }

  const query = 'INSERT INTO dvds (title, genre, director_id, release_date, copies, available) VALUES (?, ?, ?, ?, ?, ?)';
  mysqlConnection.query(query, [title, genre, directorId, releaseDate, copies, true], (err, results) => {
    if (err) {
      console.error('Error inserting DVD:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const dvd = {
      id: results.insertId.toString(),
      title,
      genre,
      director: { id: directorId },
      releaseDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      copies,
      available: true
    };
    rabbitChannel.sendToQueue(
      'dvds_queue',
      Buffer.from(JSON.stringify({ action: 'insert', dvd })),
      { persistent: true }
    );

    console.log('DVD published to RabbitMQ:', dvd);
    res.status(201).json(dvd);
  });
});

app.get('/dvds', async (req, res) => {
  try {
    const cachedDvds = await redis.get('dvds');
    if (cachedDvds) {
      console.log('Cache hit for all DVDs');
      return res.json(JSON.parse(cachedDvds));
    }

    const query = `
      SELECT dvds.*, directors.name AS director_name, directors.surname AS director_surname
      FROM dvds
      JOIN directors ON dvds.director_id = directors.id
    `;
    mysqlConnection.query(query, async (err, results) => {
      if (err) {
        console.error('Error fetching DVDs:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const dvds = results.map((dvd) => ({
        ...dvd,
        director: `${dvd.director_name} ${dvd.director_surname}`
      }));

      await redis.set('dvds', JSON.stringify(dvds), 'EX', 3600);
      console.log('Cache updated for all DVDs');
      res.json(dvds);
    });
  } catch (err) {
    console.error('Error handling cache:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/dvds/:id', async (req, res) => {
  const dvdId = req.params.id;

  try {
    const cachedDvd = await redis.get(`dvd:${dvdId}`);
    if (cachedDvd) {
      console.log('Cache hit for DVD:', dvdId);
      return res.json(JSON.parse(cachedDvd));
    }

    const query = `
      SELECT dvds.*, directors.name AS director_name, directors.surname AS director_surname
      FROM dvds
      JOIN directors ON dvds.director_id = directors.id
      WHERE dvds.id = ?
    `;
    mysqlConnection.query(query, [dvdId], async (err, results) => {
      if (err) {
        console.error('Error fetching DVD:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'DVD not found' });
      }

      const dvd = {
        ...results[0],
        director: `${results[0].director_name} ${results[0].director_surname}`
      };

      await redis.set(`dvd:${dvdId}`, JSON.stringify(dvd), 'EX', 3600);
      console.log('Cache updated for DVD:', dvdId);
      res.json(dvd);
    });
  } catch (err) {
    console.error('Error handling cache:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/dvds/:id', async (req, res) => {
  const { title, genre, directorId, releaseDate, copies } = req.body;
  if (!title || !genre || !directorId || !releaseDate || copies == null) {
    return res.status(400).json({ error: 'All fields are required: title, genre, directorId, releaseDate, copies.' });
  }

  const query = 'UPDATE dvds SET title = ?, genre = ?, director_id = ?, release_date = ?, copies = ? WHERE id = ?';
  mysqlConnection.query(query, [title, genre, directorId, releaseDate, copies, req.params.id], async (err, results) => {
    if (err) {
      console.error('Error updating DVD:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'DVD not found' });
    }

    const updatedDvd = {
      id: req.params.id,
      title,
      genre,
      director: { id: directorId },
      releaseDate,
      updatedAt: new Date(),
      copies
    };
    rabbitChannel.sendToQueue(
      'dvds_queue',
      Buffer.from(JSON.stringify({ action: 'update', dvd: updatedDvd })),
      { persistent: true }
    );

    await redis.set(`dvd:${req.params.id}`, JSON.stringify(updatedDvd), 'EX', 3600);
    await redis.del('dvds');
    res.json(updatedDvd);
  });
});

app.delete('/dvds/:id', async (req, res) => {
  const query = 'DELETE FROM dvds WHERE id = ?';
  mysqlConnection.query(query, [req.params.id], async (err, results) => {
    if (err) {
      console.error('Error deleting DVD:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'DVD not found' });
    }

    rabbitChannel.sendToQueue(
      'dvds_queue',
      Buffer.from(JSON.stringify({ action: 'delete', id: req.params.id })),
      { persistent: true }
    );

    await redis.del(`dvd:${req.params.id}`);
    await redis.del('dvds');
    res.status(204).send();
  });
});

app.post('/directors', async (req, res) => {
  const { name, surname } = req.body;
  if (!name || !surname) {
    return res.status(400).json({ error: 'All fields are required: name, surname.' });
  }

  const query = 'INSERT INTO directors (name, surname) VALUES (?, ?)';
  mysqlConnection.query(query, [name, surname], (err, results) => {
    if (err) {
      console.error('Error inserting director:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const director = {
      id: results.insertId.toString(),
      name,
      surname,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    rabbitChannel.sendToQueue(
      'directors_queue',
      Buffer.from(JSON.stringify({ action: 'insert', director })),
      { persistent: true }
    );

    console.log('Director published to RabbitMQ:', director);
    res.status(201).json(director);
  });
});

app.get('/directors', async (req, res) => {
  try {
    const cachedDirectors = await redis.get('directors');
    if (cachedDirectors) {
      console.log('Cache hit for all directors');
      return res.json(JSON.parse(cachedDirectors));
    }

    const query = 'SELECT * FROM directors';
    mysqlConnection.query(query, async (err, results) => {
      if (err) {
        console.error('Error fetching directors:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      await redis.set('directors', JSON.stringify(results), 'EX', 3600);
      console.log('Cache updated for all directors');
      res.json(results);
    });
  } catch (err) {
    console.error('Error handling cache:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/directors/:id', async (req, res) => {
  const directorId = req.params.id;

  try {
    const cachedDirector = await redis.get(`director:${directorId}`);
    if (cachedDirector) {
      console.log('Cache hit for director:', directorId);
      return res.json(JSON.parse(cachedDirector));
    }

    const query = 'SELECT * FROM directors WHERE id = ?';
    mysqlConnection.query(query, [directorId], async (err, results) => {
      if (err) {
        console.error('Error fetching director:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Director not found' });
      }

      const director = results[0];
      await redis.set(`director:${directorId}`, JSON.stringify(director), 'EX', 3600);
      console.log('Cache updated for director:', directorId);
      res.json(director);
    });
  } catch (err) {
    console.error('Error handling cache:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/directors/:id', async (req, res) => {
  const { name, surname } = req.body;
  if (!name || !surname) {
    return res.status(400).json({ error: 'All fields are required: name, surname.' });
  }

  const query = 'UPDATE directors SET name = ?, surname = ? WHERE id = ?';
  mysqlConnection.query(query, [name, surname, req.params.id], async (err, results) => {
    if (err) {
      console.error('Error updating director:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Director not found' });
    }

    res.json({ id: req.params.id, name, surname });
  });
});

app.delete('/directors/:id', (req, res) => {
  const query = 'DELETE FROM directors WHERE id = ?';
  mysqlConnection.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error deleting director:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Director not found' });
    }

    res.status(204).send();
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));