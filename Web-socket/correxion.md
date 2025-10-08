Voici deux solutions possibles pour le TP sur les WebSockets, chacune construite autour de la bibliothèque `ws` pour le serveur Node.js et l'API `WebSocket` native pour le client HTML/JavaScript.

---

# Solution 1 : Chat WebSocket Basique

Cette solution met en place un serveur WebSocket simple en Node.js et un client HTML/JavaScript pour échanger des messages. Le serveur reçoit les messages et les retransmet à tous les clients connectés.

## Partie 1 : Le Serveur WebSocket (Node.js)

Le serveur utilisera la bibliothèque `ws` pour gérer les connexions et la diffusion des messages.

### Structure du Projet


```
tp-websocket-chat/
├── node_modules/
├── package.json
├── package-lock.json
├── server.js
└── client.html
```


### Code du Serveur (`server.js`)


```javascript
const WebSocket = require('ws'); // Importe la bibliothèque ws

const wss = new WebSocket.Server({ port: 8080 }); // Crée un serveur WebSocket écoutant sur le port 8080

console.log('Serveur WebSocket démarré sur le port 8080');

// Événement déclenché lorsqu'un nouveau client se connecte
wss.on('connection', ws => {
    console.log('Nouveau client connecté !');

    // Événement déclenché lorsqu'un message est reçu d'un client
    ws.on('message', message => {
        // Convertit le Buffer reçu en chaîne de caractères (UTF-8 par défaut)
        const messageString = message.toString('utf8'); 
        console.log(`Message reçu du client : ${messageString}`);

        // Retransmet le message à tous les autres clients connectés (broadcast)
        wss.clients.forEach(client => {
            // S'assure que le client est bien ouvert avant d'envoyer le message
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(messageString); // Envoie le message
            }
        });
    });

    // Événement déclenché lorsqu'un client se déconnecte
    ws.on('close', () => {
        console.log('Un client s\'est déconnecté.');
    });

    // Événement déclenché en cas d'erreur
    ws.on('error', error => {
        console.error('Erreur WebSocket:', error);
    });

    // Envoie un message de bienvenue au client nouvellement connecté (optionnel)
    ws.send('Bienvenue sur le chat !');
});
```


### Explications du Serveur

*   **`WebSocket.Server({ port: 8080 })` :** Crée une instance de serveur WebSocket qui écoute les connexions entrantes sur le port 8080.
*   **`wss.on('connection', ws => { ... })` :** Ce gestionnaire est appelé chaque fois qu'un nouveau client établit une connexion WebSocket. L'objet `ws` représente la connexion individuelle avec ce client.
*   **`ws.on('message', message => { ... })` :** Lorsqu'un client envoie des données, cet événement est déclenché.
    *   `message.toString('utf8')` convertit le `Buffer` reçu en une chaîne de caractères lisible.
    *   **Broadcast :** `wss.clients.forEach(...)` itère sur tous les clients actuellement connectés au serveur. Pour chaque client, il vérifie s'il n'est pas l'expéditeur (`client !== ws`) et si sa connexion est ouverte (`client.readyState === WebSocket.OPEN`) avant de lui envoyer le message.
*   **`ws.on('close', ...)` et `ws.on('error', ...)` :** Ces gestionnaires permettent de loguer les déconnexions et les erreurs, ce qui est utile pour le débogage et la robustesse.
*   **`ws.send('Bienvenue...')` :** Un message initial est envoyé au client dès sa connexion pour confirmer que le canal est ouvert.

## Partie 2 : Le Client WebSocket (HTML/JavaScript)

Le client sera une page HTML simple avec du JavaScript pour interagir avec le serveur WebSocket.

### Code du Client (`client.html`)


```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat WebSocket Basique</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; }
        .chat-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        #messages {
            width: 100%;
            height: 300px;
            border: 1px solid #ddd;
            padding: 10px;
            margin-bottom: 10px;
            overflow-y: scroll;
            background-color: #e9e9e9;
            border-radius: 4px;
            box-sizing: border-box; /* Inclut padding et border dans la largeur/hauteur */
        }
        #messageInput {
            width: calc(100% - 80px); /* Ajuste la largeur pour laisser de la place au bouton */
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-right: 5px;
            box-sizing: border-box;
        }
        #sendButton {
            padding: 10px 15px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #sendButton:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <h1>Chat WebSocket</h1>
        <div id="messages"></div>
        <input type="text" id="messageInput" placeholder="Tapez votre message...">
        <button id="sendButton">Envoyer</button>
    </div>

    <script>
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        // Crée une nouvelle connexion WebSocket au serveur
        const socket = new WebSocket('ws://localhost:8080');

        // Événement déclenché lorsque la connexion est établie
        socket.onopen = function(event) {
            console.log('Connecté au serveur WebSocket.');
            addMessageToChat('Vous êtes connecté au chat.');
        };

        // Événement déclenché lorsqu'un message est reçu du serveur
        socket.onmessage = function(event) {
            console.log('Message reçu du serveur:', event.data);
            addMessageToChat('Autre : ' + event.data);
        };

        // Événement déclenché en cas d'erreur de connexion
        socket.onerror = function(error) {
            console.error('Erreur WebSocket:', error);
            addMessageToChat('Erreur de connexion au chat.');
        };

        // Événement déclenché lorsque la connexion est fermée
        socket.onclose = function(event) {
            console.log('Déconnecté du serveur WebSocket.');
            addMessageToChat('Vous avez été déconnecté du chat.');
        };

        // Fonction pour ajouter un message à la zone d'affichage
        function addMessageToChat(message) {
            const p = document.createElement('p');
            p.textContent = message;
            messagesDiv.appendChild(p);
            // Fait défiler la zone de messages vers le bas (messages vers le haut)
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Gestionnaire d'événement pour le bouton "Envoyer"
        sendButton.addEventListener('click', function() {
            const message = messageInput.value;
            if (message.trim() !== '') {
                socket.send(message); // Envoie le message au serveur
                addMessageToChat('Moi : ' + message); // Affiche le message localement
                messageInput.value = ''; // Vide le champ de saisie
            }
        });

        // Permet d'envoyer le message en appuyant sur "Entrée"
        messageInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                sendButton.click();
            }
        });
    </script>
</body>
</html>
```


### Explications du Client

*   **`new WebSocket('ws://localhost:8080')` :** Crée une nouvelle instance de l'objet `WebSocket` et tente de se connecter au serveur spécifié. L'URL commence par `ws://` (ou `wss://` pour une connexion sécurisée).
*   **`socket.onopen` :** Ce gestionnaire est appelé lorsque la connexion WebSocket est établie avec succès.
*   **`socket.onmessage = function(event) { ... }` :** C'est le cœur de la réception des messages. `event.data` contient les données envoyées par le serveur. Le message est ensuite ajouté à la zone d'affichage.
*   **`socket.onerror` et `socket.onclose` :** Gèrent les erreurs et la fermeture de la connexion, fournissant un feedback à l'utilisateur et au développeur.
*   **`sendButton.addEventListener('click', ...)` :** Lorsque le bouton "Envoyer" est cliqué, le texte du champ de saisie est récupéré.
    *   `socket.send(message)` : Envoie le message au serveur via la connexion WebSocket.
    *   Le message est également affiché localement (`addMessageToChat('Moi : ' + message)`) pour une meilleure expérience utilisateur.
*   **`messageInput.addEventListener('keypress', ...)` :** Permet d'envoyer un message en appuyant sur la touche "Entrée", améliorant l'ergonomie.
*   **`addMessageToChat(message)` :** Une fonction utilitaire pour ajouter des messages à la zone d'affichage et faire défiler automatiquement vers le bas.

---

# Solution 2 : Chat WebSocket avec Noms d'Utilisateur et Gestion des Déconnexions

Cette solution étend la première en ajoutant la gestion des noms d'utilisateur et des notifications de connexion/déconnexion, rendant le chat plus interactif.

## Partie 1 : Le Serveur WebSocket (Node.js)

Le serveur sera modifié pour associer un nom d'utilisateur à chaque connexion et diffuser les événements de connexion/déconnexion.

### Structure du Projet


```
tp-websocket-chat-enhanced/
├── node_modules/
├── package.json
├── package-lock.json
├── server_enhanced.js
└── client_enhanced.html
```


### Code du Serveur (`server_enhanced.js`)


```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

console.log('Serveur WebSocket amélioré démarré sur le port 8080');

// Fonction pour diffuser un message à tous les clients
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Fonction pour diffuser un message à tous les clients SAUF l'expéditeur
function broadcastExceptSender(senderWs, message) {
    wss.clients.forEach(client => {
        if (client !== senderWs && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

wss.on('connection', ws => {
    // Chaque connexion WebSocket aura une propriété 'username'
    ws.username = `Invité${wss.clients.size}`; // Nom d'utilisateur par défaut

    console.log(`Nouveau client connecté : ${ws.username}`);
    broadcast(JSON.stringify({ type: 'status', message: `${ws.username} a rejoint le chat.` }));

    // Envoie un message de bienvenue personnel au nouveau client
    ws.send(JSON.stringify({ type: 'welcome', message: `Bienvenue, ${ws.username} !` }));

    ws.on('message', message => {
        const messageString = message.toString('utf8');
        let parsedMessage;

        try {
            parsedMessage = JSON.parse(messageString);
        } catch (e) {
            console.error('Message non JSON reçu:', messageString);
            return; // Ignore les messages non JSON
        }

        // Gère différents types de messages
        if (parsedMessage.type === 'chat') {
            console.log(`[${ws.username}] : ${parsedMessage.text}`);
            // Retransmet le message de chat à tous les autres clients
            broadcastExceptSender(ws, JSON.stringify({ 
                type: 'chat', 
                username: ws.username, 
                text: parsedMessage.text 
            }));
        } else if (parsedMessage.type === 'setUsername') {
            const oldUsername = ws.username;
            ws.username = parsedMessage.username.substring(0, 20); // Limite la longueur du nom
            console.log(`${oldUsername} a changé son nom en ${ws.username}`);
            broadcast(JSON.stringify({ 
                type: 'status', 
                message: `${oldUsername} est maintenant connu sous le nom de ${ws.username}.` 
            }));
            // Envoie une confirmation au client qui a changé de nom
            ws.send(JSON.stringify({ type: 'status', message: `Votre nom est maintenant ${ws.username}.` }));
        }
    });

    ws.on('close', () => {
        console.log(`Client déconnecté : ${ws.username}`);
        broadcast(JSON.stringify({ type: 'status', message: `${ws.username} a quitté le chat.` }));
    });

    ws.on('error', error => {
        console.error(`Erreur WebSocket pour ${ws.username}:`, error);
    });
});
```


### Explications du Serveur

*   **`broadcast(message)` et `broadcastExceptSender(senderWs, message)` :** Fonctions utilitaires pour simplifier l'envoi de messages à tous les clients ou à tous sauf l'expéditeur.
*   **`ws.username = ...` :** Une propriété `username` est ajoutée à l'objet `ws` de chaque connexion. Cela permet d'associer un nom d'utilisateur à une connexion spécifique. Un nom par défaut est attribué.
*   **Messages JSON structurés :** Au lieu d'envoyer de simples chaînes, le serveur envoie et attend des objets JSON avec un champ `type` (ex: `chat`, `status`, `setUsername`) pour mieux gérer la logique côté client.
*   **`type: 'status'` :** Utilisé pour les messages système (connexion, déconnexion, changement de nom).
*   **`type: 'setUsername'` :** Un client peut envoyer un message de ce type pour changer son nom d'utilisateur. Le serveur met à jour `ws.username` et diffuse un message de statut.
*   **`ws.on('close', ...)` :** Lors de la déconnexion, le serveur diffuse un message de statut indiquant que l'utilisateur a quitté le chat.

## Partie 2 : Le Client WebSocket (HTML/JavaScript)

Le client sera adapté pour gérer les noms d'utilisateur, envoyer des messages structurés et afficher les différents types de messages reçus.

### Code du Client (`client_enhanced.html`)


```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat WebSocket Amélioré</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background-color: #eef; color: #333; }
        .chat-container {
            max-width: 700px;
            margin: 20px auto;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            padding: 25px;
        }
        h1 { text-align: center; color: #2c3e50; margin-bottom: 25px; }
        #usernameInput {
            width: calc(100% - 120px);
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            margin-bottom: 15px;
            box-sizing: border-box;
        }
        #setUsernameButton {
            padding: 10px 15px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 5px;
        }
        #setUsernameButton:hover {
            background-color: #218838;
        }
        #messages {
            width: 100%;
            height: 350px;
            border: 1px solid #e0e0e0;
            padding: 15px;
            margin-bottom: 15px;
            overflow-y: auto;
            background-color: #f9f9f9;
            border-radius: 5px;
            box-sizing: border-box;
            line-height: 1.5;
        }
        .message-input-area {
            display: flex;
            gap: 10px;
        }
        #messageInput {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-sizing: border-box;
        }
        #sendButton {
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        #sendButton:hover {
            background-color: #0056b3;
        }
        .chat-message { margin-bottom: 8px; }
        .chat-message strong { color: #0056b3; }
        .status-message { font-style: italic; color: #6c757d; text-align: center; margin: 10px 0; }
        .welcome-message { color: #28a745; font-weight: bold; text-align: center; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="chat-container">
        <h1>Chat WebSocket Amélioré</h1>
        <div>
            <input type="text" id="usernameInput" placeholder="Votre nom d'utilisateur">
            <button id="setUsernameButton">Définir le nom</button>
        </div>
        <div id="messages"></div>
        <div class="message-input-area">
            <input type="text" id="messageInput" placeholder="Tapez votre message...">
            <button id="sendButton">Envoyer</button>
        </div>
    </div>

    <script>
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const usernameInput = document.getElementById('usernameInput');
        const setUsernameButton = document.getElementById('setUsernameButton');

        const socket = new WebSocket('ws://localhost:8080');
        let currentUsername = ''; // Pour stocker le nom d'utilisateur actuel du client

        socket.onopen = function(event) {
            console.log('Connecté au serveur WebSocket.');
            // Le serveur enverra un message de bienvenue avec le nom par défaut
        };

        socket.onmessage = function(event) {
            const data = JSON.parse(event.data); // Parse le message JSON

            if (data.type === 'chat') {
                addMessageToChat(`<strong>${data.username}</strong> : ${data.text}`, 'chat-message');
            } else if (data.type === 'status') {
                addMessageToChat(data.message, 'status-message');
                // Si le message de statut est une confirmation de changement de nom
                if (data.message.startsWith('Votre nom est maintenant')) {
                    currentUsername = data.message.split('est maintenant ')[1].slice(0, -1); // Extrait le nom
                    usernameInput.value = currentUsername; // Met à jour l'input
                }
            } else if (data.type === 'welcome') {
                addMessageToChat(data.message, 'welcome-message');
                currentUsername = data.message.split(', ')[1].slice(0, -2); // Extrait le nom du message de bienvenue
                usernameInput.value = currentUsername;
            }
        };

        socket.onerror = function(error) {
            console.error('Erreur WebSocket:', error);
            addMessageToChat('Erreur de connexion au chat.', 'status-message');
        };

        socket.onclose = function(event) {
            console.log('Déconnecté du serveur WebSocket.');
            addMessageToChat('Vous avez été déconnecté du chat.', 'status-message');
        };

        function addMessageToChat(message, className = '') {
            const p = document.createElement('p');
            p.innerHTML = message; // Utilise innerHTML pour permettre le gras du nom d'utilisateur
            p.className = className;
            messagesDiv.appendChild(p);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        sendButton.addEventListener('click', function() {
            const messageText = messageInput.value;
            if (messageText.trim() !== '') {
                // Envoie un objet JSON au serveur
                socket.send(JSON.stringify({ type: 'chat', text: messageText }));
                addMessageToChat(`<strong>Moi (${currentUsername})</strong> : ${messageText}`, 'chat-message');
                messageInput.value = '';
            }
        });

        messageInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                sendButton.click();
            }
        });

        setUsernameButton.addEventListener('click', function() {
            const newUsername = usernameInput.value.trim();
            if (newUsername !== '' && newUsername !== currentUsername) {
                socket.send(JSON.stringify({ type: 'setUsername', username: newUsername }));
            }
        });

        usernameInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                setUsernameButton.click();
            }
        });
    </script>
</body>
</html>
```


### Explications du Client

*   **`currentUsername` :** Une variable JavaScript pour garder une trace du nom d'utilisateur actuel du client.
*   **`socket.onmessage` :** Le gestionnaire de messages est plus complexe. Il parse le JSON reçu et agit en fonction du `data.type` :
    *   `'chat'` : Affiche le message avec le nom d'utilisateur de l'expéditeur.
    *   `'status'` : Affiche les messages système (connexion, déconnexion, changement de nom).
    *   `'welcome'` : Affiche un message de bienvenue personnel et initialise `currentUsername`.
*   **`addMessageToChat(message, className)` :** Cette fonction est améliorée pour accepter une classe CSS, permettant de styliser différemment les messages de chat et les messages de statut. Elle utilise `innerHTML` pour permettre l'affichage de balises HTML (comme `<strong>` pour le nom d'utilisateur).
*   **Envoi de messages :** Lorsque l'utilisateur envoie un message, un objet JSON `{ type: 'chat', text: messageText }` est envoyé au serveur.
*   **Changement de nom d'utilisateur :**
    *   Un champ `usernameInput` et un bouton `setUsernameButton` sont ajoutés.
    *   Lorsque le bouton est cliqué, un message JSON `{ type: 'setUsername', username: newUsername }` est envoyé au serveur.
    *   Le client met à jour `currentUsername` et le champ `usernameInput` après avoir reçu la confirmation du serveur.