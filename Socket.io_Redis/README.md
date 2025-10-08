# Socket.io X Redis

Ce projet est une application de chat en temps réel avec plusieurs salons, construite avec Node.js, Express, Socket.IO, et Redis (ioredis) pour la communication entre plusieurs instances de serveur.

# Prérequis

- Docker
- Docker compose

# Installation

```
git clone <repo_url>
cd <nom_du_projet>
docker compose up --build
```

# Utilisation

## Sur un serveur

Ouvrir dans un navigateur `http://localhost:3000`.<br>
Dans un navigateur en mode privé, ouvrir la même url.

Rejoignez le même salon avec deux username différents.

Vous avez la possibilité de simuler l'envoie et la reception de message.

## Multi-serveur

Ouvrir dans un navigateur `http://localhost:3000`.<br>
Ouvrir dans un nouvel onglet `http://localhost:3001`.

Vous êtes sur deux instances différentes. Et malgré l'envoie de message sur l'instance 1, l'instance 2 le reçoit aussi.
Elles sont synchronisé.

# Comment Redis Pub/Sub résout le problème

## Sans Redis

Chaque instance Node.js garde sa propre liste de clients Socket.IO.
Un message envoyé à un serveur n’est visible que par ses propres clients et les autres serveurs n’en savent rien.

## Avec Redis Pub/Sub

Redis agit comme un bus de messages partagé entre toutes les instances :
1. Quand un utilisateur envoie un message, le serveur :
    - publie ce message sur un canal Redis (`publisher.publish('chat_messages', ...)`)
2. Toutes les instances abonnées (`subscriber.subscribe('chat_messages')`) reçoivent le message depuis Redis.
3. Chaque instance diffuse ensuite ce message à ses clients connectés localement via : `io.to(data.room).emit('chat message', data);`

Ainsi, toutes les instances restent synchronisées en temps réel.