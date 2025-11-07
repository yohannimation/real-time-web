# Question 1 – Services cloud temps réel

## A - Deux services

Deux services managés de synchronisation temps réel (hors WebSocket natif) :

- Firebase Realtime Database (Google Cloud)
- AWS AppSync (Amazon Web Services, basé sur GraphQL Subscriptions)

## B - Comparaison

| Critère               | Firebase Realtime Database                                                       | AWS AppSync                                               |
| --------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Modèle de données** | Arbre JSON (NoSQL hiérarchique)                                                  | GraphQL (schéma typé, requêtes structurées)               |
| **Persistance**       | Données persistées automatiquement dans la base cloud                            | Persistance optionnelle (souvent couplé à DynamoDB)       |
| **Mode d’écoute**     | Listeners temps réel sur des chemins JSON (push automatique des updates)         | Subscriptions GraphQL sur des requêtes définies           |
| **Scalabilité**       | Scalabilité automatique gérée par Google (mais structure JSON parfois limitante) | Très scalable via AWS infra (AppSync + DynamoDB + Lambda) |

## C - Cas d’usage

- Firebase Realtime Database → Chat en ligne ou tableau de bord collaboratif simple (rapidité d’implémentation).
- AWS AppSync → Application d’entreprise complexe nécessitant des requêtes structurées, authentification fine et intégration à l’écosystème AWS.

# Question 2 – Sécurité temps réel

## A - Trois risques + contre-mesures

| Risque                                   | Description                                       | Protection                                                           |
| ---------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| **DDoS via connexions persistantes**     | Trop de connexions WebSocket saturent le serveur  | Limiter les connexions, quotas IP, WAF, CDN (Cloudflare, AWS Shield) |
| **Fuite de données temps réel**          | Messages envoyés à de mauvais clients             | Authentification stricte, scopes JWT, vérification serveur           |
| **Injection ou usurpation d’événements** | Un client malveillant émet des messages falsifiés | Signature des messages, validation côté serveur, TLS obligatoire     |

## B - Importance de la gestion des identités

Chaque connexion temps réel doit être liée à une identité authentifiée.
Cela garantit que les événements envoyés/reçus proviennent d’un utilisateur autorisé, limite l’usurpation, et permet de propager les permissions dynamiquement (ex. changement de rôle en live).

# Question 3 – WebSockets vs Webhooks

## A - Définitions

- WebSocket : protocole bidirectionnel permettant une communication temps réel et persistante entre client et serveur.
- Webhook : mécanisme de callback HTTP déclenché par un événement sur un serveur tiers.

## B - Avantages et limites

| Technologie   | Avantages                                                                                     | Limites                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **WebSocket** | - Communication bidirectionnelle instantanée<br>- Idéal pour temps réel (chat, jeux, trading) | - Connexion persistante coûteuse en ressources<br>- Plus complexe à sécuriser et scaler |
| **Webhook**   | - Simple (HTTP POST)<br>- Pas de connexion persistante (léger)                                | - Unidirectionnel (serveur → client)<br>- Non instantané si latence réseau              |

## C - Quand préférer un Webhook ?

Lorsqu’on n’a pas besoin de connexion permanente, par exemple :

- notification de paiement (Stripe, PayPal),
- mise à jour d’un dépôt (GitHub → CI/CD).

Le client reçoit l’événement dès qu’il survient, sans maintenir une connexion ouverte.

# Question 4 – CRDT & Collaboration

## A - Définition

Un CRDT (Conflict-free Replicated Data Type) est une structure de données distribuée qui permet à plusieurs nœuds de modifier simultanément un état partagé sans coordination, tout en assurant la convergence automatique.

## B - Exemple concret

Éditeur collaboratif (ex : Google Docs, Notion) où plusieurs utilisateurs modifient le même texte en parallèle.

## C - Pourquoi pas de conflits ?

Les CRDT reposent sur des opérations commutatives et idempotentes :
quel que soit l’ordre d’application des mises à jour, l’état final converge vers le même résultat sur tous les nœuds.

# Question 5 – Monitoring temps réel

## a  -Trois métriques clés

- Nombre de connexions actives
- Latence moyenne des messages
- Taux de reconnexion / erreurs réseau

## B - Prometheus / Grafana

- Prometheus collecte et stocke des métriques temps réel (via scraping).
- Grafana les visualise sous forme de dashboards interactifs (alertes, graphes dynamiques).

Ensemble, ils permettent de détecter les anomalies et la dégradation des performances en temps réel.

## C - Différences : logs / traces / métriques

| Type          | Description                                         | Exemple                                |
| ------------- | --------------------------------------------------- | -------------------------------------- |
| **Logs**      | Événements textuels détaillés                       | “User X connected”                     |
| **Traces**    | Parcours d’une requête à travers plusieurs services | Traçage d’un message via microservices |
| **Métriques** | Valeurs chiffrées agrégées dans le temps            | Latence = 120 ms                       |

# Question 6 – Déploiement & Connexions persistantes

## A - Impacts

| Aspect             | Impact                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Load balancing** | Les connexions WebSocket doivent rester **collées (sticky)** au même nœud, sinon perte de session.                                           |
| **Scalabilité**    | Nécessite des serveurs capables de gérer des milliers de connexions persistantes ; souvent via un **message broker** (Redis Pub/Sub, Kafka). |

## B - Pourquoi Kubernetes ?

- Gère la scalabilité horizontale (auto-scaling de pods).
- Permet des services persistants avec sticky sessions.
- Facilite le déploiement distribué de serveurs WebSocket avec gestion d’état via Redis ou NATS.

# Question 7 – Stratégies de résilience client

## A - Trois mécanismes côté client

- Reconnexion automatique après déconnexion.
- Buffer local des messages non envoyés (replay après reconnexion).
- Fallback sur HTTP polling / long polling en cas d’échec WebSocket.

## B - Exponential backoff

Principe : augmenter progressivement le délai entre chaque tentative de reconnexion (ex. 1 s, 2 s, 4 s, 8 s…).

Évite la surcharge réseau et la “tempête” de requêtes quand le serveur est temporairement indisponible.