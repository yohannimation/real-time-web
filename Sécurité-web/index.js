const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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