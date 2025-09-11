# SSE

Le style n'a pas été l'objectif de ce projet. J'ai vraiment voulu me concentrer sur l'aspect du SSE

## Lancer le serveur

- Cloner le repo

- Installer les packages
```
npm i
```

- Lancer le server
```
node server-sse.js
```

- Ouvrir dans un navigateur : [http://localhost:3000](http://localhost:3000)

## Fonctionnalités

- Lors de l'affichage de la page, des données aléatoires sont fournies par une connexion SSE, sont affichées dans un tableau.
- La possibilité de couper la connexion est possible.
- La reprise de la connexion coupée est possible, elle va alors récupérer les données manquées pour les afficher avant celle qui vont être générée.

## Fonctionnement

Le navigateur fait une requête à ```/stream``` pour être ouvert à la réception de données venant du serveur. Le serveur envoie donc des données à intervalles régulier et les affiche.
Un système d'id est implémenté pour reprendre le fil des données manqué si une erreur de connexion à lieux ou si la connexion a été fermé.