# Long polling

Le style n'a pas été l'objectif de ce projet. J'ai vraiment voulu me concentrer sur l'aspect du long polling

## Lancer le serveur

- Cloner le repo

- Installer les packages
```
npm i
```

- Lancer le server
```
node server-long-polling.js
```

- Ouvrir dans un navigateur : [http://localhost:3000](http://localhost:3000)

- Ouvrir une fenêtre de navigation privée avec la même url de sorte à avoir de navigateurs distinct.

## Fonctionnalités

- Lors de la modification du select, les données vont s'actualiser sur les deux navigateurs de manière simultané.

## Fonctionnement

Le navigateur fait une requête sur l'url ```/poll```, la session est mise de côté sur le serveur en attendant qu'il ait une réponse à retourner au navigateur.
Ainsi, nos deux navigateurs sont mis en liste d'attente et lorsqu'une réponse peut etre envoyé, le serveur va parcourir toutes les session et envoyer la réponse.
Lorsque le navigateur la reçoit, il la traite et renvoie une requête pour attendre une autre réponse.