const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const Redis = require('ioredis');
const redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1'
});

const users = new Map();

// Servir le fichier index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Écoute des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    // Écoute des connexions pour rejoindre un salon
    socket.on('joinRoom', (joinRoomData) => {
        socket.join(joinRoomData.room);
        socket.to(joinRoomData.room).emit('message', `${joinRoomData.username} a rejoint la room ${joinRoomData.room}`);
    });

    socket.on('chat message', (chatMessageData) => {
        console.log(chatMessageData)
        io.to(chatMessageData.room).emit('chat message', chatMessageData);
    })

    socket.on('disconnect', () => {
    console.log('Un utilisateur est déconnecté');
    });
});

redis.on('connect', () => {
    console.log('Connecté à Redis');
});
redis.on('error', (err) => {
    console.error('Erreur Redis :', err);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});