# 🧭 TP – Tableau de Bord Collaboratif

## 🚀 Lancer l’application

### 1️⃣ Installation

```bash
git clone <repo>
cd <project>
npm install
```

> Renomme le fichier `.env.dist` en `.env` et ajoute une clé JWT.

### 2️⃣ Lancement du serveur

```bash
node index.js
```

Le serveur démarre par défaut sur : **[http://localhost:3000](http://localhost:3000)**

### 3️⃣ Accès à l’interface

Ouvre ton navigateur sur :

```
http://localhost:3000
```

### 4️⃣ Utilisation

* Inscris un nouvel utilisateur.
* Connecte-toi pour obtenir un **token JWT**.
* Crée, modifie ou supprime des notes.
* Ouvre plusieurs onglets pour observer la **synchronisation en temps réel** via Socket.IO.

## 🧩 Architecture

### Backend :

* **Node.js / Express.js** : API REST (authentification et gestion des notes).
* **Socket.IO** : mise à jour temps réel des notes.
* **bcrypt** : hachage sécurisé des mots de passe.
* **jsonwebtoken (JWT)** : gestion de l’authentification.
* **cors** : autorise les requêtes entre origines pour le front.
* **uuid** : génération d’identifiants uniques.

### Frontend :

* **HTML / CSS / JS Vanilla** : interface simple sans framework.
* **Socket.IO client** pour la communication temps réel.
* **localStorage** pour stocker le JWT côté navigateur.

### Données :

* Stockées **en mémoire** (tableaux JS) pour simplifier le TP.

## 🔒 Sécurité – Choix techniques majeurs

### 1. Authentification JWT

Chaque utilisateur connecté reçoit un **token JWT signé** par le serveur, contenant son `userId` et `username`.
Ce token est ensuite envoyé dans les en-têtes `Authorization: Bearer <token>` pour les routes protégées.

✅ Avantages :

* Pas de session côté serveur.
* Le token est autoportant et signé.
* Le token expire automatiquement (`expiresIn: '12h'`).

### 2. Hachage des mots de passe (bcrypt)

Les mots de passe sont **hachés** avec `bcrypt` avant d’être stockés.
Ainsi, même si la base était compromise, les mots de passe ne sont pas récupérables.

### 3. Contrôle d’accès (middleware Express)

Un middleware `authMiddleware` :

* Vérifie la présence et la validité du JWT.
* Attache `req.userId` pour identifier l’utilisateur courant.

Règles :

* Les routes `POST /notes`, `PUT /notes/:id` et `DELETE /notes/:id` nécessitent un token valide.
* Un utilisateur ne peut modifier/supprimer **que ses propres notes** (`authorId === req.userId`).

### 4. Sécurité des communications temps réel

Socket.IO est configuré pour recevoir un **token JWT dans le handshake** (`socket.handshake.auth.token`).
Cela permet au serveur d’associer une connexion à un utilisateur authentifié.

Les événements `notes_updated` ne contiennent aucune donnée sensible — uniquement la liste publique des notes.

## 📂 Structure du projet

```
project/
├── server.js          # Backend (Express + Socket.IO)
├── package.json       # Dépendances et scripts
├── public/
│   └── index.html     # Interface utilisateur
└── README.md          # Documentation
```