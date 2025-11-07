const Database = require('better-sqlite3');
const db = new Database('data.db');

// Création des tables si elles n'existent pas
db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        passwordHash VARCHAR(255) NOT NULL
    )
`).run();

db.prepare(`
    CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(36) PRIMARY KEY,
        content TEXT NOT NULL,
        authorId VARCHAR(36) NOT NULL,
        FOREIGN KEY (authorId) REFERENCES users(id)
    )
`).run();

module.exports = db;
