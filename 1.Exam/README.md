# Mini-Application Web Temps Réel

## Installation 

- Completer le fichier ```.env```
- Executer ```node db.js``` pour creer la base de données
- Quitter le script et lancer le serveur : ```node index.js```

## 1. Architecture logique

L’architecture de l’application repose sur un modèle client-serveur temps réel :

``` Client <-> WebSockets <-> Server Node.js <-> BDD Mysql```

- Client Web : formulaire d’authentification, affichage et modification des notes, mise à jour en temps réel via Socket.IO.
- Serveur Node.js :
    - Routes REST pour authentification et gestion des notes
    - Broadcast des notes en temps réel via Socket.IO
    - Monitoring des connexions, latences et événements
- Base de données MySQL : persistance des utilisateurs et notes avec relations (authorId).

## 2. Choix technologiques

| Composant        | Technologie choisie       | Raison / Avantage                                                     |
| ---------------- | ------------------------- | --------------------------------------------------------------------- |
| Backend          | Node.js + Express         | Léger, rapide, compatible Socket.IO                                   |
| Temps réel       | Socket.IO (WebSockets)    | Bidirectionnel, simple à intégrer et gère la reconnexion              |
| Base de données  | MySQL                     | Persistance locale fiable, supporte relations et transactions         |
| Authentification | JWT + bcrypt              | Sécurisé, simple à utiliser côté client et serveur                    |
| Front-end        | HTML/CSS/JS + Bootstrap   | Rapidité de prototypage et compatibilité navigateur                   |
| Monitoring       | Console + route `/status` | Simple, affichage des connexions, latences et logs de synchronisation |

## 3. Plan de sécurité

- Authentification et gestion des identités
    - JWT pour sécuriser les routes REST et la connexion Socket.IO
    - Hashage des mots de passe avec bcrypt
    - Besoin de l'authentification pour supprimer ou modifier une note
- Validation côté serveur
    - Vérification des champs obligatoires (username, password, content)
    - Limitation des actions aux propriétaires de notes
- Sanitisation / prévention des injections
    - Utilisation de requêtes préparées (?) avec MySQL pour éviter l’injection SQL
- Reconnexion sécurisée
    - Socket.IO gère la reconnexion automatique
    - Vérification du token à chaque nouvelle connexion
- Logs et monitoring
    - Suivi des broadcasts pour détecter un comportement anormal
    - Compteur de connexions actives pour prévenir les attaques DDoS locales

## 4. Gestion des erreurs

- Backend :
    - Codes HTTP standards (```400```, ```401```, ```403```, ```404```, ```500```)
    - ```try/catch``` autour des requêtes MySQL et des opérations JWT
- Frontend :
    - Gestion des erreurs fetch avec messages clairs à l’utilisateur
    - Vérification locale des champs de formulaire avant envoi
- Socket.IO :
    - Protection contre les tokens invalides

## 5. Limites et améliorations possibles

| Limite actuelle                               | Amélioration proposée                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Les notes sont triées par ID seulement        | Ajouter tri par date ou auteur, pagination                                                                     |
| Monitoring affiché uniquement dans la console | Créer un mini-dashboard en front-end avec graphiques et latence moyenne (autre qu'avec la route ```/status```) |
| Sécurité basique pour un usage local          | Ajouter rôles utilisateurs, limite de tentatives de login, HTTPS                                               |
| Front minimaliste                             | Refactorer avec React/Vue pour un vrai SPA temps réel                                                          |
