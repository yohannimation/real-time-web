import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import url from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// =======================
// Données en mémoire
// =======================
const users = {};          // socket.id -> { username, room }
const validTokens = ['12345', 'abcd']; // clés d’accès valides
let eventCount = 0;

// =======================
// Monitoring basique
// =======================
setInterval(() => {
    console.log('--- STATUS ---');
    console.log('Connexions actives:', io.engine.clientsCount);
    console.log('Événements/minute:', eventCount);
    console.log('Rooms actives:', Array.from(io.sockets.adapter.rooms.keys()));
    console.log('----------------');
    eventCount = 0;
}, 60 * 1000);

app.get('/status', (req, res) => {
    res.json({
        activeConnections: io.engine.clientsCount,
        rooms: Array.from(io.sockets.adapter.rooms.keys()),
    });
});

// =======================
// Routing
// =======================
app.use('/client', express.static(path.join(__dirname, '../client')));

// =======================
// Gestion Socket.IO
// =======================
io.on('connection', (socket) => {
    const query = url.parse(socket.handshake.url, true).query;
    const { username, room, token } = query;

    // --- Vérif. sécurité ---
    if (!validTokens.includes(token)) {
        console.log(`Connexion refusée: token invalide (${username})`);
        socket.disconnect(true);
        return;
    }

    // --- Connexion et room ---
    users[socket.id] = { username, room };
    socket.join(room);

    // Notification globale dans la room
    io.to(room).emit('notification', `${username} a rejoint ${room}`);

    console.log(`${username} connecté à ${room}`);
    eventCount++;

    // --- Collaboration en temps réel ---
    socket.on('update', (data) => {
        eventCount++;
        // Réémet aux autres clients de la même room
        socket.to(room).emit('update', { username, data });
    });

    // --- Déconnexion ---
    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
        io.to(user.room).emit('notification', `${user.username} a quitté ${user.room}`);
        delete users[socket.id];
        console.log(`${user.username} déconnecté`);
        }
    });
});

// =======================
// Lancement du serveur
// =======================
const PORT = 3000;
server.listen(PORT, () => console.log(`✅ Serveur temps réel sur http://localhost:${PORT}`));
