const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function initDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        multipleStatements: true,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);

    await connection.end();

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            passwordHash VARCHAR(255) NOT NULL
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS notes (
            id VARCHAR(36) PRIMARY KEY,
            content TEXT NOT NULL,
            authorId VARCHAR(36) NOT NULL,
            FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    console.log('✅ Base de données et tables initialisées.');
    return pool;
}


initDatabase()