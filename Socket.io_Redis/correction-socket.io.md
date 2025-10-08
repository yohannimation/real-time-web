Voici deux solutions complètes pour le TP "Chat Multi-Salons avec Socket.IO", en suivant les étapes et les consignes données.

---

# Solution 1 : Implémentation Directe des Consignes

Cette solution suit pas à pas les instructions du TP, en complétant les sections "TODO" et en ajoutant les explications nécessaires.

## Partie 1 : Le Serveur (`index.js`)

Le serveur Node.js utilise Express pour servir la page HTML et Socket.IO pour gérer les communications en temps réel, y compris la gestion des salons.

### Code du Serveur (`index.js`)



```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
// Initialise Socket.IO en lui passant le serveur HTTP
const io = new Server(server);

// Servir le fichier index.html depuis la racine du projet
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Écoute des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  // Étape 1 (Serveur) : Gérer l'événement 'join room'
  socket.on('join room', (data) => {
    // Ajoute le socket à un salon spécifique.
    // Si le salon n'existe pas, Socket.IO le crée automatiquement.
    socket.join(data.room); 
    
    // Stocke les informations de l'utilisateur directement sur l'objet socket.
    // Cela permet de récupérer le pseudo et le salon lors d'autres événements (ex: déconnexion).
    socket.data.username = data.username; 
    socket.data.room = data.room; 

    // Émet un message de notification à tous les clients dans ce salon (y compris le nouveau venu).
    // 'io.to(data.room)' cible spécifiquement les sockets dans ce salon.
    io.to(data.room).emit('room message', { message: `${data.username} a rejoint le salon ${data.room}.` });
    console.log(`${data.username} a rejoint le salon ${data.room}`);
  });

  // Étape 2 (Serveur) : Gérer l'événement 'chat message'
  socket.on('chat message', (data) => {
    // Émet le message de chat uniquement aux clients du salon spécifié.
    // Les données sont retransmises telles quelles, incluant username, room et message.
    io.to(data.room).emit('chat message', {
        username: data.username,
        room: data.room,
        message: data.message
    });
    console.log(`[${data.room}] ${data.username}: ${data.message}`);
  });

  // Étape 3 (Serveur) : Gérer les déconnexions
  socket.on('disconnect', () => {
    console.log('Un utilisateur est déconnecté');
    // Vérifie si le socket avait des informations de pseudo et de salon stockées.
    if (socket.data.username && socket.data.room) {
      // Notifie les autres membres du salon que l'utilisateur est parti.
      // 'socket.to(socket.data.room)' émet à tous les clients dans le salon SAUF l'expéditeur (qui est ici le socket déconnecté).
      socket.to(socket.data.room).emit('room message', {
          message: `${socket.data.username} a quitté le salon ${socket.data.room}.`
      });
      console.log(`${socket.data.username} a quitté le salon ${socket.data.room}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
```



### Explications du Serveur

*   **`io = new Server(server)` :** Initialise Socket.IO en l'attachant au serveur HTTP existant, permettant à Socket.IO de gérer les connexions WebSocket en plus des requêtes HTTP classiques.
*   **`io.on('connection', (socket) => { ... })` :** C'est l'événement principal qui se déclenche pour chaque nouvelle connexion d'un client. L'objet `socket` représente la connexion individuelle avec ce client.
*   **`socket.on('join room', (data) => { ... })` :**
    *   `socket.join(data.room)` : C'est la fonction clé de Socket.IO pour la gestion des salons. Elle ajoute le socket courant au salon spécifié par `data.room`.
    *   `socket.data.username = data.username; socket.data.room = data.room;` : Stocker ces informations directement sur l'objet `socket` est une bonne pratique. Cela permet d'accéder au pseudo et au salon de l'utilisateur à tout moment pendant la durée de sa connexion, notamment lors de la déconnexion.
    *   `io.to(data.room).emit('room message', ...)` : Envoie un événement `room message` à *tous* les sockets qui sont membres du `data.room`.
*   **`socket.on('chat message', (data) => { ... })` :**
    *   `io.to(data.room).emit('chat message', ...)` : Diffuse le message de chat uniquement aux clients qui se trouvent dans le `data.room` spécifié.
*   **`socket.on('disconnect', () => { ... })` :**
    *   Lorsqu'un client se déconnecte, on utilise les informations stockées (`socket.data.username`, `socket.data.room`) pour notifier les autres membres du salon.
    *   `socket.to(socket.data.room).emit(...)` : Notez l'utilisation de `socket.to()` au lieu de `io.to()`. `socket.to()` permet d'émettre un message à tous les clients dans un salon *sauf* le socket émetteur (qui est ici le socket qui se déconnecte).

## Partie 2 : Le Client (`index.html`)

Le client est une page HTML avec du JavaScript qui utilise la bibliothèque client Socket.IO pour se connecter au serveur et interagir avec les salons.

### Code du Client (`index.html`)



```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Multi-Salons</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        #chat-container { max-width: 800px; margin: 20px auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        #messages { list-style-type: none; margin: 0; padding: 0; max-height: 400px; overflow-y: auto; border: 1px solid #eee; padding: 10px; margin-bottom: 10px; }
        #messages li { padding: 8px 10px; border-bottom: 1px solid #eee; }
        #messages li:last-child { border-bottom: none; }
        #messages li strong { color: #007bff; }
        #form-join, #form-chat { display: flex; margin-bottom: 10px; }
        #form-join input, #form-chat input { flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 5px; }
        #form-join button, #form-chat button { padding: 10px 15px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
        #form-join button:hover, #form-chat button:hover { background-color: #218838; }
        .hidden { display: none; }
        .status-message { font-style: italic; color: #666; }
    </style>
</head>
<body>
    <div id="chat-container">
        <h1>Chat Multi-Salons</h1>

        <div id="join-section">
            <form id="form-join">
                <input id="username-input" autocomplete="off" placeholder="Votre pseudo" required />
                <input id="room-input" autocomplete="off" placeholder="Nom du salon (ex: général, dev)" required />
                <button type="submit">Rejoindre le salon</button>
            </form>
        </div>

        <div id="chat-section" class="hidden">
            <p>Vous êtes dans le salon : <strong id="current-room-display"></strong></p>
            <ul id="messages"></ul>
            <form id="form-chat">
                <input id="message-input" autocomplete="off" placeholder="Votre message..." />
                <button type="submit">Envoyer</button>
            </form>
        </div>
    </div>

    <!-- La bibliothèque client Socket.IO est servie automatiquement par le serveur Socket.IO -->
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io(); // Initialise la connexion Socket.IO

        const joinSection = document.getElementById('join-section');
        const chatSection = document.getElementById('chat-section');
        const formJoin = document.getElementById('form-join');
        const usernameInput = document.getElementById('username-input');
        const roomInput = document.getElementById('room-input');
        const currentRoomDisplay = document.getElementById('current-room-display');

        const formChat = document.getElementById('form-chat');
        const messageInput = document.getElementById('message-input');
        const messages = document.getElementById('messages');

        let currentUsername = '';
        let currentRoom = '';

        // Étape 1 (Client) : Gérer la soumission du formulaire de connexion
        formJoin.addEventListener('submit', (e) => {
            e.preventDefault(); // Empêche le rechargement de la page
            if (usernameInput.value && roomInput.value) {
                currentUsername = usernameInput.value;
                currentRoom = roomInput.value;
                currentRoomDisplay.textContent = currentRoom;

                // Émet un événement 'join room' vers le serveur avec le pseudo et le nom du salon.
                socket.emit('join room', { username: currentUsername, room: currentRoom });

                joinSection.classList.add('hidden'); // Cache la section de connexion
                chatSection.classList.remove('hidden'); // Affiche la section de chat
            }
        });

        // Étape 2 (Client) : Gérer la soumission du formulaire de chat
        formChat.addEventListener('submit', (e) => {
            e.preventDefault(); // Empêche le rechargement de la page
            if (messageInput.value) {
                // Émet un événement 'chat message' vers le serveur
                // avec le message, le pseudo et le salon actuel.
                socket.emit('chat message', {
                    username: currentUsername,
                    room: currentRoom,
                    message: messageInput.value
                });
                // Affiche le message localement immédiatement pour une meilleure UX
                const item = document.createElement('li');
                item.innerHTML = `<strong>${currentUsername}</strong> (Moi) : ${messageInput.value}`;
                messages.appendChild(item);
                messages.scrollTop = messages.scrollHeight; // Scroll automatique

                messageInput.value = ''; // Vide le champ de saisie
            }
        });

        // Écouter les messages de chat entrants du serveur
        socket.on('chat message', (data) => {
            // N'affiche le message que s'il vient d'un autre utilisateur ou si c'est un message de soi-même (pour confirmation)
            // Pour éviter les doublons si on affiche déjà localement
            if (data.username !== currentUsername) { 
                const item = document.createElement('li');
                item.innerHTML = `<strong>${data.username}</strong> : ${data.message}`;
                messages.appendChild(item);
                messages.scrollTop = messages.scrollHeight;
            }
        });

        socket.on('room message', (data) => {
            const item = document.createElement('li');
            item.classList.add('status-message'); // Ajoute une classe pour le style
            item.textContent = data.message;
            messages.appendChild(item);
            messages.scrollTop = messages.scrollHeight;
        });

        // Écouter les notifications de connexion/déconnexion dans le salon
        socket.on('connect', () => {
            console.log('Connecté au serveur Socket.IO');
        });

        socket.on('disconnect', () => {
            console.log('Déconnecté du serveur Socket.IO');
            // Optionnel : Afficher un message à l'utilisateur ou tenter de reconnecter
        });
    </script>
</body>
</html>
```



### Explications du Client

*   **`<script src="/socket.io/socket.io.js"></script>` :** Cette balise inclut la bibliothèque client Socket.IO. Le serveur Express configuré avec `io = new Server(server)` sert automatiquement ce fichier à cette URL.
*   **`const socket = io();` :** Initialise la connexion Socket.IO avec le serveur. Par défaut, elle tente de se connecter au même hôte et port que la page web.
*   **`formJoin.addEventListener('submit', ...)` :**
    *   Récupère le pseudo et le nom du salon.
    *   `socket.emit('join room', { ... })` : Envoie un événement personnalisé `join room` au serveur avec les données nécessaires.
    *   Met à jour l'interface utilisateur pour afficher la section de chat.
*   **`formChat.addEventListener('submit', ...)` :**
    *   `socket.emit('chat message', { ... })` : Envoie le message de chat au serveur.
    *   Le message est affiché localement (`item.innerHTML = \`<strong>${currentUsername}</strong> (Moi) : ${messageInput.value}\`;`) pour une meilleure réactivité. Le `socket.on('chat message')` côté client est ensuite filtré pour ne pas afficher le message deux fois si l'on est l'expéditeur.
*   **`socket.on('chat message', (data) => { ... })` :** Écoute les messages de chat diffusés par le serveur.
*   **`socket.on('room message', (data) => { ... })` :** Écoute les messages de statut (connexion/déconnexion) diffusés par le serveur.
*   **`messages.scrollTop = messages.scrollHeight;` :** Assure que la zone de messages défile toujours vers le bas pour afficher le dernier message.

---

# Solution 2 : Implémentation avec Gestion des Utilisateurs et Salons Côté Serveur

Cette solution améliore la gestion des utilisateurs et des salons côté serveur en maintenant des structures de données pour suivre les utilisateurs connectés et leurs salons, ce qui est utile pour des fonctionnalités futures (comme la liste des utilisateurs dans un salon).

## Partie 1 : Le Serveur (`index.js`)

Le serveur inclura des objets pour suivre les utilisateurs et les salons.

### Code du Serveur (`index.js`)

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- Structures de données pour gérer les utilisateurs et les salons ---
// { socketId: { username: "pseudo", room: "salon" } }
const users = {}; 
// { roomName: [ "socketId1", "socketId2" ] } - Peut être utilisé pour des listes d'utilisateurs
const rooms = {}; 

// Servir le fichier index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté (ID: ' + socket.id + ')');

  socket.on('join room', (data) => {
    const { username, room } = data;

    // Quitter l'ancien salon si l'utilisateur en faisait déjà partie
    if (users[socket.id] && users[socket.id].room) {
      const oldRoom = users[socket.id].room;
      socket.leave(oldRoom);
      // Notifier l'ancien salon que l'utilisateur est parti
      socket.to(oldRoom).emit('room message', { message: `${users[socket.id].username} a quitté le salon ${oldRoom}.` });
      // Supprimer l'utilisateur de la liste des salons
      if (rooms[oldRoom]) {
        rooms[oldRoom] = rooms[oldRoom].filter(id => id !== socket.id);
      }
    }

    // Rejoindre le nouveau salon
    socket.join(room);
    
    // Stocker les informations de l'utilisateur
    users[socket.id] = { username, room };
    socket.data.username = username; // Pour compatibilité avec la déconnexion
    socket.data.room = room; // Pour compatibilité avec la déconnexion

    // Ajouter l'utilisateur à la liste des membres du salon
    if (!rooms[room]) {
      rooms[room] = [];
    }
    rooms[room].push(socket.id);

    // Notifier le nouveau salon
    io.to(room).emit('room message', { message: `${username} a rejoint le salon ${room}.` });
    console.log(`${username} (ID: ${socket.id}) a rejoint le salon ${room}`);

    // Optionnel : Envoyer la liste des utilisateurs du salon au nouveau venu
    const usersInRoom = rooms[room].map(id => users[id].username);
    socket.emit('room users', { room: room, users: usersInRoom });
  });

  socket.on('chat message', (data) => {
    const { username, room, message } = data;
    io.to(room).emit('chat message', { username, room, message });
    console.log(`[${room}] ${username}: ${message}`);
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur est déconnecté (ID: ' + socket.id + ')');
    const disconnectedUser = users[socket.id];

    if (disconnectedUser) {
      const { username, room } = disconnectedUser;

      // Notifier le salon que l'utilisateur est parti
      socket.to(room).emit('room message', { message: `${username} a quitté le salon ${room}.` });
      console.log(`${username} a quitté le salon ${room}`);

      // Supprimer l'utilisateur de la liste globale et du salon
      delete users[socket.id];
      if (rooms[room]) {
        rooms[room] = rooms[room].filter(id => id !== socket.id);
        if (rooms[room].length === 0) {
          delete rooms[room]; // Supprime le salon s'il est vide
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
```



### Explications du Serveur

*   **`users = {}` et `rooms = {}` :** Ces objets sont introduits pour maintenir un état plus détaillé des utilisateurs et des salons sur le serveur.
    *   `users` mappe les `socket.id` aux objets utilisateur (`{ username, room }`).
    *   `rooms` mappe les noms de salon à des tableaux de `socket.id` des membres.
*   **Gestion du changement de salon :** Dans `socket.on('join room')`, le code gère désormais le cas où un utilisateur change de salon. Il quitte l'ancien salon, notifie les membres de cet ancien salon, puis rejoint le nouveau.
*   **`socket.emit('room users', ...)` (Optionnel) :** Un événement supplémentaire est émis au client qui vient de rejoindre un salon, lui fournissant la liste des utilisateurs déjà présents. Cela nécessite une gestion côté client.
*   **Gestion de la déconnexion améliorée :** Lors de la déconnexion, les structures `users` et `rooms` sont nettoyées pour maintenir un état cohérent.

## Partie 2 : Le Client (`index.html`)

Le client sera légèrement modifié pour prendre en compte l'événement `room users` si l'on implémente la liste des utilisateurs. Pour le reste, la logique de base reste la même.

### Code du Client (`index.html`)



```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Multi-Salons (Amélioré)</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; display: flex; justify-content: center; }
        #chat-container { display: flex; width: 90%; max-width: 1200px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        #sidebar { width: 250px; background-color: #e9ecef; padding: 20px; border-right: 1px solid #ddd; }
        #sidebar h2 { margin-top: 0; color: #333; font-size: 1.2em; }
        #user-list { list-style-type: none; margin: 0; padding: 0; }
        #user-list li { padding: 5px 0; color: #555; }
        #main-chat { flex-grow: 1; padding: 20px; display: flex; flex-direction: column; }
        #main-chat h1 { margin-top: 0; text-align: center; color: #333; }
        #messages { list-style-type: none; margin: 0; padding: 0; flex-grow: 1; overflow-y: auto; border: 1px solid #eee; padding: 10px; margin-bottom: 10px; background-color: #fdfdfd; border-radius: 4px; }
        #messages li { padding: 8px 10px; border-bottom: 1px solid #eee; }
        #messages li:last-child { border-bottom: none; }
        #messages li strong { color: #007bff; }
        #form-join, #form-chat { display: flex; margin-bottom: 10px; }
        #form-join input, #form-chat input { flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 5px; }
        #form-join button, #form-chat button { padding: 10px 15px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
        #form-join button:hover, #form-chat button:hover { background-color: #218838; }
        .hidden { display: none; }
        .status-message { font-style: italic; color: #666; }
    </style>
</head>
<body>
    <div id="chat-container">
        <div id="join-section">
            <form id="form-join">
                <h1>Rejoindre le Chat</h1>
                <input id="username-input" autocomplete="off" placeholder="Votre pseudo" required />
                <input id="room-input" autocomplete="off" placeholder="Nom du salon (ex: général, dev)" required />
                <button type="submit">Rejoindre le salon</button>
            </form>
        </div>

        <div id="chat-section" class="hidden">
            <div id="sidebar">
                <h2>Salon : <strong id="current-room-display"></strong></h2>
                <h3>Utilisateurs :</h3>
                <ul id="user-list">
                    <!-- Les utilisateurs seront listés ici -->
                </ul>
            </div>
            <div id="main-chat">
                <h1>Chat Multi-Salons</h1>
                <ul id="messages"></ul>
                <form id="form-chat">
                    <input id="message-input" autocomplete="off" placeholder="Votre message..." />
                    <button type="submit">Envoyer</button>
                </form>
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();

        const joinSection = document.getElementById('join-section');
        const chatSection = document.getElementById('chat-section');
        const formJoin = document.getElementById('form-join');
        const usernameInput = document.getElementById('username-input');
        const roomInput = document.getElementById('room-input');
        const currentRoomDisplay = document.getElementById('current-room-display');
        const userList = document.getElementById('user-list'); // Nouveau : liste des utilisateurs

        const formChat = document.getElementById('form-chat');
        const messageInput = document.getElementById('message-input');
        const messages = document.getElementById('messages');

        let currentUsername = '';
        let currentRoom = '';

        function addMessageToChat(message, isStatus = false) {
            const item = document.createElement('li');
            if (isStatus) {
                item.classList.add('status-message');
                item.textContent = message;
            } else {
                item.innerHTML = message;
            }
            messages.appendChild(item);
            messages.scrollTop = messages.scrollHeight;
        }

        function updateUserList(users) {
            userList.innerHTML = ''; // Vide la liste actuelle
            users.forEach(user => {
                const item = document.createElement('li');
                item.textContent = user;
                userList.appendChild(item);
            });
        }

        formJoin.addEventListener('submit', (e) => {
            e.preventDefault();
            if (usernameInput.value && roomInput.value) {
                currentUsername = usernameInput.value;
                currentRoom = roomInput.value;
                currentRoomDisplay.textContent = currentRoom;

                socket.emit('join room', { username: currentUsername, room: currentRoom });

                joinSection.classList.add('hidden');
                chatSection.classList.remove('hidden');
            }
        });

        formChat.addEventListener('submit', (e) => {
            e.preventDefault();
            if (messageInput.value) {
                socket.emit('chat message', {
                    username: currentUsername,
                    room: currentRoom,
                    message: messageInput.value
                });
                addMessageToChat(`<strong>${currentUsername}</strong> (Moi) : ${messageInput.value}`);
                messageInput.value = '';
            }
        });

        socket.on('chat message', (data) => {
            // N'affiche le message que s'il vient d'un autre utilisateur
            if (data.username !== currentUsername) { 
                addMessageToChat(`<strong>${data.username}</strong> : ${data.message}`);
            }
        });

        socket.on('room message', (data) => {
            addMessageToChat(data.message, true); // Utilise la fonction avec isStatus = true
        });

        // Nouveau : Écoute l'événement pour la liste des utilisateurs dans le salon
        socket.on('room users', (data) => {
            if (data.room === currentRoom) {
                updateUserList(data.users);
            }
        });

        socket.on('connect', () => {
            console.log('Connecté au serveur Socket.IO');
        });

        socket.on('disconnect', () => {
            console.log('Déconnecté du serveur Socket.IO');
            addMessageToChat('Vous avez été déconnecté du serveur.', true);
            // Optionnel : Réafficher la section de connexion ou tenter une reconnexion
        });
    </script>
</body>
</html>
```



### Explications du Client

*   **Interface utilisateur améliorée :** Ajout d'une barre latérale (`#sidebar`) pour afficher le nom du salon et la liste des utilisateurs.
*   **`userList` :** Un nouvel élément DOM pour afficher les utilisateurs.
*   **`updateUserList(users)` :** Une fonction pour mettre à jour dynamiquement la liste des utilisateurs affichée dans la barre latérale.
*   **`socket.on('room users', (data) => { ... })` :** Ce gestionnaire écoute l'événement `room users` envoyé par le serveur. Il met à jour la liste des utilisateurs si le message concerne le salon actuel du client.
*   **`addMessageToChat(message, isStatus = false)` :** La fonction d'ajout de message est améliorée pour gérer les messages de statut avec un paramètre `isStatus`.

Ces deux solutions fournissent une base solide pour un chat multi-salons. La deuxième solution, avec sa gestion plus structurée des utilisateurs et des salons côté serveur, est plus évolutive pour des fonctionnalités futures.