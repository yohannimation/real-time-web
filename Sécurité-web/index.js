const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'mykey';
const SALT_ROUNDS = 10;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage
const users = []; // { id, username, passwordHash }
const notes = []; // { id, content, authorId }

// Helper to broadcast all notes to clients
function broadcastNotes() {
    io.emit('notes_updated', notes);
}

// ----------------------
// Middleware d'authentification
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
// Routes publiques
// ----------------------

// Récupérer toutes les notes
app.get('/notes', (req, res) => {
    res.json(notes);
});

// Inscription
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: 'username and password required' });
    if (users.find((u) => u.username === username))
        return res.status(400).json({ error: 'username already taken' });

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = { id: uuidv4(), username, passwordHash: hash };
    users.push(user);
    res.json({ message: 'registered' });
});

// Connexion
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '12h' }
    );
    res.json({ token });
});

// ----------------------
// Routes protégées
// ----------------------

// Création de note
app.post('/notes', authMiddleware, (req, res) => {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const note = { id: uuidv4(), content, authorId: req.userId };
    notes.push(note);
    broadcastNotes();
    res.status(201).json(note);
});

// Mise à jour de note
app.put('/notes/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const note = notes.find((n) => n.id === id);
    if (!note) return res.status(404).json({ error: 'note not found' });
    if (note.authorId !== req.userId)
        return res.status(403).json({ error: "You don't own this note" });
    if (typeof content === 'string') note.content = content;
    broadcastNotes();
    res.json(note);
});

// Suppression de note
app.delete('/notes/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) return res.status(404).json({ error: 'note not found' });
    if (notes[idx].authorId !== req.userId)
        return res.status(403).json({ error: "You don't own this note" });
    const [deleted] = notes.splice(idx, 1);
    broadcastNotes();
    res.json({ message: 'deleted', deleted });
});

// Info utilisateur (optionnel)
app.get('/me', authMiddleware, (req, res) => {
    const user = users.find((u) => u.id === req.userId);
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json({ id: user.id, username: user.username });
});

// ----------------------
// Socket.IO
// ----------------------
io.on('connection', (socket) => {
    const token = socket.handshake?.auth?.token;
    if (token) {
        try {
                const payload = jwt.verify(token, JWT_SECRET);
                socket.userId = payload.userId;
                socket.username = payload.username;
        } catch (err) {
                console.warn('Socket connection with invalid token');
        }
    }

    // Envoi initial
    socket.emit('notes_updated', notes);

    socket.on('disconnect', () => {});
});

// ----------------------
// Démarrage du serveur
// ----------------------
server.listen(PORT, () =>
    console.log(`✅ Serveur en ligne : http://localhost:${PORT}`)
);
