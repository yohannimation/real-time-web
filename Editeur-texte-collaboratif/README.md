# Éditeur de texte Collaboratif Temps Réel

## Description

Ce projet est un éditeur de texte collaboratif en temps réel utilisant **Node.js**, **Express**, et **Socket.IO**.  
Chaque utilisateur peut créer ou rejoindre une room, partager un espace de travail, et collaborer en temps réel avec d’autres utilisateurs.

## Fonctionnalités

- Connexion avec pseudo, nom de salon (room) et clé d’accès (token).  
- Création dynamique de rooms avec token associé.  
- Vérification du token pour rejoindre une room existante.  
- Collaboration en temps réel sur un éditeur de texte.  
- Notifications pour les arrivées et départs d’utilisateurs.  
- Déconnexion propre avec bouton “Déconnexion”.  
- Monitoring basique : nombre de connexions actives, événements par minute, rooms actives.  
- Endpoint `/status` pour visualiser les informations en JSON.

## Architecture

### Choix techniques

1. **Node.js + Express**  
   - Fournit un serveur HTTP léger pour servir les fichiers statiques et l’API `/status`.  

2. **Socket.IO**  
   - Gestion de la communication temps réel bidirectionnelle.  
   - Permet de créer des **rooms** dynamiques et de diffuser les événements uniquement aux utilisateurs de la room concernée.  

3. **Rooms + Tokens dynamiques**  
   - Chaque room est créée au moment de la première connexion.  
   - Le token choisi par le créateur est enregistré côté serveur.  
   - Les autres utilisateurs doivent fournir le même token pour rejoindre la room.  
   - Pas besoin de stockage persistant : tout est en mémoire pour simplicité.

4. **Monitoring intégré**  
   - Compte les connexions, les événements, les rooms et les utilisateurs.  
   - Permet un suivi rapide et un debug facile.

## Structure du projet

```
/server
|   index.js # Serveur Node.js + Socket.IO
/client
|   index.html # Interface utilisateur
|   script.js # Logique frontend (Socket.IO, UI)
package.json # Dépendances et configuration
```

## Installation

1. Cloner le projet :

```bash
git clone <URL_DU_REPO>
cd <NOM_DU_PROJET>
```

2. Installer les dépendances :

```
npm install
```

## Lancer le projet

```
node server/index.js
```

- Serveur temps réel disponible sur : http://localhost:3000/client
- Endpoint monitoring JSON : http://localhost:3000/status

## Utilisation

1. Ouvrir le navigateur à l’adresse http://localhost:3000/client.
2. Saisir :
- Pseudo : nom de l’utilisateur
- Nom du salon (room) : nom du projet ou de la room
- Clé du salon (token) : clé choisie par le créateur
- Cliquer sur Créer/Rejoindre.
3. L’éditeur s’affiche et les mises à jour sont synchronisées en temps réel.
4. Pour quitter la room, cliquer sur Déconnexion.

## Avantages de cette architecture

- Simplicité : tout est en mémoire, pas besoin de base de données pour ce projet prototype.
- Scalabilité facile : Socket.IO + rooms permet d’isoler les flux par projet sans complexité.
- Sécurité minimale : contrôle par token pour éviter les intrusions dans les rooms.
- Monitoring intégré : facilite le suivi et le debug.
- Extensible : possibilité d’ajouter tableau blanc, historique, ou stockage persistant.