# SSE – Server-Sent Events

> Ce projet met l’accent sur l’implémentation de **SSE** (Server-Sent Events). Le style visuel n’a pas été priorisé ; l’objectif principal est de démontrer le fonctionnement des flux SSE.

---

## Lancer le serveur

### 1. Cloner le dépôt :

```bash
    git clone <URL_DU_REPO>
    cd <NOM_DU_REPO>
```

### 2. Installer les dépendances :

```npm install```

### 3. Lancer le serveur SSE :

```node server-sse.js```

### 4. Ouvrir l’application dans votre navigateur :

[http://localhost:3000](http://localhost:3000)

## Fonctionnalités

- Affichage en temps réel de données aléatoires générées côté serveur dans un tableau HTML.
- Possibilité de couper la connexion SSE via un bouton.
- Possibilité de reprendre la connexion après interruption, avec récupération des données manquées grâce à un système d’identifiants.

## Fonctionnement

- Le navigateur fait une requête HTTP vers l’endpoint ```/stream``` pour ouvrir une connexion SSE.
- Le serveur envoie des données JSON à intervalles réguliers (toutes les 2 secondes).
- Chaque événement contient un identifiant unique (id) permettant de rejouer les événements manqués si la connexion est interrompue.
- Le client met à jour dynamiquement le tableau avec les nouvelles données, tout en gérant la reconnexion et la récupération des données perdues.