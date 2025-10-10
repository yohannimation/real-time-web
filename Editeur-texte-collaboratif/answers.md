# Question 1 – Les technologies temps réel

| Technologie                  | Principe                                                                                                                                                                                      | Sens de communication                                                                      | Avantages                                                                   | Limites                                                                                                       | Cas d’usage typique                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Long Polling**             | Le client envoie une requête HTTP au serveur. Le serveur garde la connexion ouverte jusqu’à ce qu’un nouvel événement survienne, puis répond. Le client relance ensuite une nouvelle requête. | Client → Serveur (requête), puis réponse Serveur → Client. Communication **semi-duplexe**. | Simple à implémenter, compatible avec la plupart des serveurs/proxies HTTP. | Latence entre requêtes, surcharge réseau (ouverture/fermeture fréquente des connexions), pas vrai temps réel. | Notifications ou messagerie sur anciens navigateurs.            |
| **SSE (Server-Sent Events)** | Connexion HTTP unidirectionnelle où le serveur peut “pousser” des messages vers le client (flux texte). Basé sur `EventSource`.                                                               | Serveur → Client (unidirectionnel).                                                        | Simple, standardisé, utilise HTTP, reconnexion auto.                        | Unidirectionnel, ne supporte pas le binaire, pas supporté par IE.                                             | Flux de données en continu (bourse, logs, notifications).       |
| **WebSockets**               | Canal TCP bidirectionnel après un handshake HTTP. Permet échanges en temps réel sans rouvrir la connexion.                                                                                    | **Bidirectionnel** (Client ↔ Serveur).                                                     | Temps réel véritable, faible latence, prise en charge du binaire.           | Plus complexe à déployer (reverse proxy, load balancer), nécessite support serveur.                           | Jeux multi-joueurs, chat, collaboration, dashboards temps réel. |

# Question 2 – Les fondements de Socket.IO

## Namespaces

- Rôle : Séparer logiquement les canaux de communication (comme des “routes temps réel”).
- Intérêt : Mieux organiser les événements et réduire la charge inutile.
- Exemple :
```
const chat = io.of('/chat');
chat.on('connection', socket => {
  socket.emit('message', 'Bienvenue dans le chat !');
});

const admin = io.of('/admin');
admin.on('connection', socket => {
  socket.emit('alert', 'Bienvenue, admin');
});
```

## Rooms

- Rôle : Regrouper des sockets dans des “salons” pour un envoi sélectif.
- Intérêt : Envoyer des messages à un sous-ensemble d’utilisateurs.
- Exemple :
```
socket.join('room42');
io.to('room42').emit('message', 'Hello room 42!');
```

## Broadcast

- Rôle : Envoyer un message à tous les autres sockets connectés (sauf l’émetteur).
- Intérêt : Diffuser efficacement des informations globales.
- Exemple :
```
socket.broadcast.emit('userJoined', socket.id);
```

# Question 3 – Scalabilité et Redis Pub/Sub

## Problème :

Quand l’application Socket.IO tourne sur plusieurs instances (par exemple plusieurs conteneurs derrière un load balancer), un message émis sur l’instance A n’est pas connu des clients connectés à l’instance B.

Chaque instance ne voit que ses propres sockets en mémoire.

## Solution : Redis Pub/Sub Adapter :

Redis agit comme un canal de diffusion partagé entre toutes les instances Socket.IO :

- Lorsqu’une instance émet un événement, elle le publie dans Redis.
- Redis le diffuse (“subscribe”) à toutes les autres instances, qui le retransmettent à leurs clients connectés.

## Schema :

# Question 4 – Sécurité et Monitoring

1. Risques

- Injection / falsification de messages (si les événements ne sont pas authentifiés).
- Déni de service (DoS) via surcharge de connexions WebSocket.
- Fuite de données (si aucune vérification d’accès aux rooms).

2. Bonne pratiques

- Authentification JWT ou session sécurisée avant d’accepter la connexion.
- Limiter le nombre de connexions / rate limiting.
- Filtrer et valider les messages reçus (ex : `JSON schema`, type checking).

3. Métriques à surveiller

- Nombre de connexions actives.
- Latence moyenne d’envoi / réception.
- Taux d’erreur / reconnexion.

4. Outils de monitoring

- Prometheus + Grafana (métriques temps réel).
- Socket.IO admin UI ou logs internes (`socket.on('connect', ...)`).
- Console / Kibana via logs structurés (JSON).

# Question 5 – Bonnes pratiques

- Utiliser Redis Adapter pour le clustering et la scalabilité.
- Gérer la reconnexion et les timeouts côté client (`socket.io` le fait nativement).
- Compresser et limiter la taille des messages (ex : gzip, JSON minimal).
- Surveiller et nettoyer les connexions inactives régulièrement.
- Mettre un reverse proxy optimisé (Nginx, HAProxy) avec WebSocket support (`upgrade` headers).