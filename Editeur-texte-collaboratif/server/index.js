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
const users = {}; // socket.id -> { username, room }
const roomTokens = {}; // roomName -> token
let eventCount = 0;

// =======================
// Monitoring basique
// =======================
setInterval(() => {
    const status = getStatus();
    console.log(JSON.stringify(status, null, 2));
    eventCount = 0;
  }, 60 * 1000);

function getStatus() {
    const allRooms = Array.from(io.sockets.adapter.rooms.entries())
    .filter(([name, members]) => !members.has(name))
    .map(([name, members]) => ({
        name,
        token: roomTokens[name],
        users: Array.from(members).map(socketId => ({
            socketId,
            username: users[socketId]?.username || 'inconnu',
        })),
    }));

    return {
        activeConnection: io.engine.clientsCount,
        eventPerMinute: eventCount,
        rooms: allRooms,
        timestamp: new Date().toISOString(),
    };
}

app.get('/status', (req, res) => {
    res.json(getStatus());
});

// =======================
// Routing
// =======================
app.use('/client', express.static(path.join(__dirname, '../client')));

// =======================
// Gestion Socket.IO
// =======================
io.on('connection', (socket) => {
    const { username, room, token } = socket.handshake.query;

    console.log('Nouvelle connexion:', socket.id);

    if (!username || !room || !token) {
        socket.emit('notification', { message: 'Informations incomplètes.' });
        socket.disconnect();
        return;
    }

    if (!roomTokens[room]) {
        roomTokens[room] = token;
        console.log(`🆕 Room "${room}" créée avec token "${token}"`);
    } else if (roomTokens[room] !== token) {
        console.log(`❌ Mauvais token pour la room "${room}"`);
        socket.emit('notification', { message: 'Token invalide pour cette room.' });
        socket.disconnect();
        return;
    }

    users[socket.id] = { username, room };
    socket.join(room);

    io.to(room).emit('notification', { message: `<strong>${username}</strong> a rejoint la room.` });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`${username} s’est déconnecté de ${room}`);
        delete users[socket.id];
        io.to(room).emit('notification', { message: `<strong>${username}</strong> a quitté la room.` });
    });

    // Mise à jour
    socket.on('update', (data) => {
        eventCount++;
        const user = users[socket.id];
        if (user && user.room) {
            io.to(user.room).emit('update', { username: user.username, data });
        }
    });
    
});

// =======================
// Lancement du serveur
// =======================
const PORT = 3000;
server.listen(PORT, () => console.log(`✅ Serveur temps réel sur http://localhost:${PORT}`));
