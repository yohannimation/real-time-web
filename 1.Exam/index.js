const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

dotenv.config();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_KEY;
const SALT_ROUNDS = 10;

// Database environment
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper to broadcast all notes to clients
async function broadcastNotes() {
    try {
        // Get all notes
        const [rows] = await pool.query(
            'SELECT id, content, authorId FROM notes ORDER BY id DESC'
        );

        // Send it to all connected users
        io.emit('notes_updated', rows);
    } catch (err) {
        console.error('Broadcast error :', err);
    }
}

// ----------------------
// Authentication middleware
// ----------------------
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing token' });
    }
    const token = auth.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ----------------------
// Public routes
// ----------------------

// Get all notes
app.get('/notes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM notes');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'database error' });
    }
});

// Register
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'username and password required' });
    
    try {
        const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (exists.length > 0)
            return res.status(400).json({ error: 'username already taken' });

        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const id = uuidv4();

        await pool.query('INSERT INTO users (id, username, passwordHash) VALUES (?, ?, ?)', [id, username, hash]);
        res.json({ message: 'registered' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'database error' });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0)
            return res.status(401).json({ error: 'Invalid credentials' });
    
        const user = rows[0];
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ error: 'Invalid credentials' });
    
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'database error' });
    }
});

// ----------------------
// Protected routes
// ----------------------

// Note creation
app.post('/notes', authMiddleware, async (req, res) => {
    const { content } = req.body;
    if (!content || typeof content !== 'string')
        return res.status(400).json({ error: 'content required' });

    const id = uuidv4();
    try {
        await pool.query(
            'INSERT INTO notes (id, content, authorId) VALUES (?, ?, ?)',
            [id, content, req.userId]
        );
        const [note] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
        broadcastNotes();
        res.status(201).json(note[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'database error' });
    }
});

// Update note
app.put('/notes/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== 'string')
        return res.status(400).json({ error: 'invalid content' });

    try {
        const [rows] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
        if (rows.length === 0)
            return res.status(404).json({ error: 'note not found' });
    
        const note = rows[0];
        if (note.authorId !== req.userId)
            return res.status(403).json({ error: "You don't own this note" });
    
        await pool.query('UPDATE notes SET content = ? WHERE id = ?', [content, id]);
        const [updated] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
        broadcastNotes();
        res.json(updated[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'database error' });
    }
});

// Delete note
app.delete('/notes/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
        if (rows.length === 0)
            return res.status(404).json({ error: 'note not found' });
    
        const note = rows[0];
        if (note.authorId !== req.userId)
            return res.status(403).json({ error: "You don't own this note" });
    
        await pool.query('DELETE FROM notes WHERE id = ?', [id]);
        broadcastNotes();
        res.json({ message: 'deleted', deleted: note });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'database error' });
    }
});

// User info
app.get('/me', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username FROM users WHERE id = ?', [req.userId]);
        if (rows.length === 0)
            return res.status(404).json({ error: 'user not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'database error' });
    }
});

// ----------------------
// Socket.IO
// ----------------------
io.on('connection', async (socket) => {
    const token = socket.handshake?.auth?.token;
    let user = null;

    // --- Authentication JWT ---
    if (token) {
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            socket.userId = payload.userId;
            socket.username = payload.username;
            user = { id: payload.userId, username: payload.username };
        } catch (err) {
            console.warn('Invalid token');
        }
    } else {
        console.log('Connection with no token');
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, content, authorId FROM notes ORDER BY id DESC'
        );
        socket.emit('notes_updated', rows);
    } catch (err) {
        console.error('DB error :', err);
        socket.emit('notes_updated', []);
    }

    socket.on('disconnect', () => {
        console.log(`Disconect token : ${user ? user.username : 'inconnu'}`);
    });
});

// ----------------------
// Start server
// ----------------------
server.listen(PORT, () =>
    console.log(`✅ Serveur en ligne : http://localhost:${PORT}`)
);
