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

CONSULTAS:

SELECT 
    dvds.id AS dvd_id, 
    dvds.title, 
    dvds.genre, 
    dvds.release_date, 
    dvds.copies, 
    dvds.available, 
    directors.id AS director_id,
    directors.name AS director_name, 
    directors.surname AS director_surname
FROM 
    dvds
INNER JOIN 
    directors 
ON 
    dvds.director_id = directors.id;

SELECT 
    dvds.id AS dvd_id, 
    dvds.title, 
    dvds.genre, 
    dvds.release_date, 
    dvds.copies, 
    dvds.available, 
    directors.id AS director_id,
    directors.name AS director_name, 
    directors.surname AS director_surname
FROM 
    dvds
INNER JOIN 
    directors 
ON 
    dvds.director_id = directors.id
WHERE 
    dvds.id = ?;

SELECT * FROM directors WHERE deleted_at IS NULL;

SELECT id FROM directors WHERE name = ? AND surname = ? AND deleted_at IS NULL;

SELECT COUNT(*) AS total FROM dvds WHERE director_id = ?;