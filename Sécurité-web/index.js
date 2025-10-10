// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middlewares
app.use(cors());
app.use(express.json()); // parse JSON bodies
app.use(express.static('public')); // sert index.html et les assets depuis /public

// Port
const PORT = process.env.PORT || 3000;

// In-memory storage pour les notes
// Chaque note : { id: string, content: string, authorId: string|null, createdAt: ISOString, updatedAt: ISOString }
let notes = [];
let nextId = 1;

// Helper pour émettre la liste mise à jour à tous les clients
function broadcastNotes() {
    io.emit('notes_updated', notes);
}

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connecté', socket.id);
    // Envoie initial des notes au nouveau client
    socket.emit('notes_updated', notes);

    socket.on('disconnect', () => {
        console.log('Client déconnecté', socket.id);
    });
});

// Routes REST pour la gestion des notes

// GET /notes - retourne toutes les notes
app.get('/notes', (req, res) => {
    res.json(notes);
});

// POST /notes - ajoute une nouvelle note
app.post('/notes', (req, res) => {
    const { content, authorId = null } = req.body;
    if (typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ error: 'content is required and must be a non-empty string' });
    }

    const now = new Date().toISOString();
    const newNote = {
        id: String(nextId++),
        content: content.trim(),
        authorId,
        createdAt: now,
        updatedAt: now
    };
    notes.push(newNote);

    // Broadcast
    broadcastNotes();

    res.status(201).json(newNote);
});

// PUT /notes/:id - met à jour une note existante
app.put('/notes/:id', (req, res) => {
    const id = req.params.id;
    const { content, authorId } = req.body;

    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Note not found' });
    }

    if (typeof content === 'string') {
        notes[idx].content = content.trim();
    }
    if (typeof authorId !== 'undefined') {
        notes[idx].authorId = authorId;
    }
    notes[idx].updatedAt = new Date().toISOString();

    // Broadcast
    broadcastNotes();

    res.json(notes[idx]);
});

// DELETE /notes/:id - supprime une note
app.delete('/notes/:id', (req, res) => {
    const id = req.params.id;
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Note not found' });
    }

    const removed = notes.splice(idx, 1)[0];

    // Broadcast
    broadcastNotes();

    res.json({ success: true, removed });
});

// Démarrage du serveur
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
