# WebSocket

> Ce projet met l’accent sur l’implémentation du **WebSocket**. Le style visuel n’a pas été priorisé ; l’objectif est de démontrer le fonctionnement des flux WebSocket.

---

## Lancer le serveur

### 1. Cloner le dépôt :

```bash
    git clone <URL_DU_REPO>
    cd <NOM_DU_REPO>
```

### 2. Installer les dépendances :

```npm install```

### Lancer le serveur WebSocket :

```node server-web-socket.js```

### Ouvrir le client dans un navigateur :

- Ouvrir le fichier templates/index.html.
- Pour tester plusieurs clients, ouvrir une fenêtre de navigation privée ou un autre navigateur avec le même fichier.

## Fonctionnalités

- Chat en temps réel entre plusieurs navigateurs.
- Les messages envoyés depuis un navigateur sont retransmis à tous les autres clients connectés.
- Le serveur affiche dans la console chaque connexion et chaque message reçu.

## Fonctionnement

- Le serveur WebSocket écoute les connexions entrantes sur le port défini (8080).
- Lorsqu’un client se connecte :
    - Le serveur affiche "Nouveau client connecté" dans la console.
    - Il écoute tous les messages envoyés par ce client.
    - Chaque message reçu est diffusé à tous les autres clients connectés (broadcast).
- Côté navigateur :
    - Le client ouvre une connexion WebSocket avec le serveur.
    - Il peut envoyer des messages via ```.send()```.
    - Il écoute les messages entrants via l’événement ```onmessage``` pour les afficher dans la zone de chat.