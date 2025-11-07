# Pourquoi importer New Relic avant tout le reste ?

Parce que New Relic doit instrumenter automatiquement les modules Node.js avant leur chargement.

- L’agent New Relic fonctionne en “monkey-patching” : il modifie certains modules (comme express, http, mysql, etc.) pour insérer du code de monitoring et mesurer les performances.
- Si on importe New Relic après express, il est déjà chargé et New Relic ne pourra plus intercepter les appels.

C’est pour cette raison que la ligne : ```require('newrelic');``` doit être tout en haut du fichier principal, avant tout autre import.

# Pourquoi utiliser JSON pour les logs ?

Parce que le format JSON est structuré, standardisé et facilement exploitable par des outils externes.

- Lisible par les machines : JSON permet à des systèmes comme New Relic, ELK (ElasticSearch / Logstash / Kibana) ou Datadog de parser les logs automatiquement.
- Facile à filtrer et à agréger : on peut filtrer par niveau (info, error, warn), par route, par timestamp, etc.
- Compatible avec le logging distribué : dans des systèmes de microservices, des formats structurés comme JSON permettent de corréler des logs entre plusieurs services.

# Quelle limite au monitoring sans logs ?

Le monitoring (APM, métriques, traces) donne une vue macro — mais sans logs, on perd le détail du contexte.

- New Relic te dira “cette requête est lente” ou “il y a une erreur 500”,
mais sans logs, tu ne sais pas pourquoi.
- Les logs contiennent le contexte applicatif : valeurs, utilisateurs, étapes précises, messages personnalisés.
- En cas d’incident, les logs permettent de retracer la séquence d’événements et d’analyser la cause racine.

# Comment scaler ce système en production ?

- Centraliser les logs :
    - Ne pas garder les fichiers .log localement.
    - Utiliser un collecteur : Elastic Stack, Loki, Datadog Logs, New Relic Logs, etc.
    - Envoyer les logs via un transport Winston (ex. winston-newrelic ou winston-transport HTTP).
- Configurer des niveaux de logs adaptés :
    - En dev : debug
    - En prod : info ou warn pour limiter le volume
    - Les erreurs critiques (error) doivent déclencher des alertes.
- Surveiller avec des dashboards et des alertes :
    - New Relic APM pour la performance.
    - New Relic Logs pour la corrélation logs ↔ métriques.
- Adapter l’architecture :
    - Load balancing entre plusieurs instances Node.js.
    - Containerisation (Docker) et orchestration (Kubernetes) → exporter les logs vers un système central.