# WebSocket
Le style n'a pas été l'objectif de ce projet. J'ai vraiment voulu me concentrer sur l'aspect du WebSocket

## Lancer le serveur

- Cloner le repo

- Installer les packages
```
npm i
```

- Lancer le server
```
node server-web-socket.js
```

- Ouvrir dans un navigateur le fichier templates/index.html

- Ouvrir une fenêtre de navigation privée avec la même url de sorte à avoir de navigateurs distinct.

## Fonctionnalités

- Un chat dans chaque navigateur permet d'envoyer et de recevoir des messages.

## Fonctionnement

Le serveur attend que des connexions se fassent sur l'url WebSocket. Une fois cela, il va écouter les messages entrants pour les rediffuser aux autres clients (autres navigateurs connectés).
Le navigateur lui a ouvert la connexion WebSocket en se connectant au serveur et écoute les messages du serveur. Il peut lui aussi envoyer des messages à ce serveur.