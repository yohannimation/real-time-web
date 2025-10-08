const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const Redis = require('ioredis');

/**
 * |======================|
 * | Redis                |
 * |======================|
 */
const subscriber = new Redis({host: process.env.REDIS_HOST || '127.0.0.1'});
const publisher = new Redis({host: process.env.REDIS_HOST || '127.0.0.1'});

const CHANNEL = 'chat_messages';

subscriber.subscribe(CHANNEL, (err, count) => {
    if (err) {
        console.error('Erreur abonnement Redis :', err);
    } else {
        console.log(`Abonné au canal Redis : ${CHANNEL}`);
    }
});

subscriber.on('message', (channel, message) => {
    if (channel === CHANNEL) {
        const data = JSON.parse(message);        

        // Diffuser à tous les clients du salon concerné
        io.to(data.room).emit('chat message', data);
    }
});

/**
 * |======================|
 * | Route                |
 * |======================|
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

/**
 * |======================|
 * | Socket.io            |
 * |======================|
 */
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté');

    // Écoute des connexions pour rejoindre un salon
    socket.on('joinRoom', (joinRoomData) => {
        socket.join(joinRoomData.room);
        io.to(joinRoomData.room).emit('message', `${joinRoomData.username} a rejoint la room ${joinRoomData.room}`);
    });

    socket.on('chat message', (chatMessageData) => {
        // Publier sur Redis au lieu d’envoyer directement
        publisher.publish(CHANNEL, JSON.stringify(chatMessageData));
    })

    socket.on('disconnect', () => {
    console.log('Un utilisateur est déconnecté');
    });
});

/**
 * |======================|
 * | Server               |
 * |======================|
 */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});