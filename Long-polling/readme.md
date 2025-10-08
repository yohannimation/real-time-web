# Long Polling

> Ce projet met l’accent sur l’implémentation du **long polling**. Le style visuel n’a pas été priorisé ; l’objectif est de démontrer le fonctionnement du flux de données en temps réel avec requêtes HTTP.

---

## Lancer le serveur

### 1. Cloner le dépôt :

```bash
    git clone <URL_DU_REPO>
    cd <NOM_DU_REPO>
```

### 2. Installer les dépendances :

```npm install```

### 3. Lancer le serveur :

```node server-long-polling.js```

### 4. Ouvrir l’application dans un navigateur :

[http://localhost:3000](http://localhost:3000)

### 5. Ouvrir une fenêtre de navigation privée

Ouvrir une fenêtre de navigation privée avec la même URL pour simuler plusieurs clients distincts.

## Fonctionnalités

- Lors de la modification de valeur du ```<select>```, les données sont actualisées simultanément sur tous les navigateurs connectés.
- Les changements d’état sont propagés en quasi-temps réel grâce au long polling.

## Fonctionnement

- Chaque navigateur envoie une requête HTTP vers l’endpoint ```/poll```.
- Le serveur met cette requête en attente jusqu’à ce qu’un changement de données se produise.
- Lorsqu’une donnée est disponible (un utilisateur change le select), le serveur parcourt toutes les requêtes en attente et renvoie la réponse correspondante.
- Chaque client, dès qu’il reçoit une réponse, traite la donnée et renvoie immédiatement une nouvelle requête pour continuer à recevoir les mises à jour.

Ce mécanisme permet de simuler un flux de données temps réel via des requêtes HTTP classiques, sans utiliser WebSocket ou SSE.