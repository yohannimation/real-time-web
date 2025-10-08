# Solution 1 : Implémentation avec Python (Flask)

Cette solution utilise le framework web Flask pour le serveur et le JavaScript natif côté client. Flask est choisi pour sa simplicité et sa légèreté, ce qui est idéal pour illustrer le concept du Long Polling.

## Partie 1 : Le Serveur (Back-end)

Le serveur Flask gérera l'état de la tâche et les requêtes de Long Polling. Pour gérer les requêtes clientes en attente, nous utiliserons un mécanisme basé sur des événements et des verrous pour assurer la sécurité des threads.

### Structure du Fichier

`app.py`

### Code du Serveur (`app.py`)


```python
import time
import threading
from flask import Flask, request, jsonify, Response
from collections import deque
import os

app = Flask(__name__, static_folder='static')

# --- Variables Globales pour l'État de la Tâche ---
current_task_status = "En attente"
status_version = 0
# Un verrou pour protéger l'accès aux variables globales partagées
status_lock = threading.Lock()
# Une liste pour stocker les objets d'événement pour chaque client en attente
# Chaque événement sera déclenché lorsqu'un changement de statut se produit
waiting_clients = deque() # Utilisation d'une deque pour une gestion efficace des clients

# --- Endpoint pour la Mise à Jour du Statut (Admin) ---
@app.route('/update-status', methods=['POST'])
def update_status():
    global current_task_status, status_version

    new_status = request.json.get('status')
    if not new_status:
        return jsonify({"error": "Le statut est requis"}), 400

    with status_lock:
        # Mettre à jour le statut et incrémenter la version
        current_task_status = new_status
        status_version += 1
        print(f"Statut mis à jour: {current_task_status} (Version: {status_version})")

        # Notifier tous les clients en attente
        # On itère sur une copie pour éviter les problèmes de modification pendant l'itération
        for client_event_info in list(waiting_clients):
            client_event_info['event'].set() # Déclenche l'événement pour ce client
        waiting_clients.clear() # Une fois notifiés, on vide la liste

    return jsonify({"message": "Statut mis à jour", "new_status": current_task_status, "version": status_version})

# --- Endpoint de Long Polling (Client) ---
@app.route('/poll-status', methods=['GET'])
def poll_status():
    global current_task_status, status_version

    client_last_version = request.args.get('last_version', type=int)
    if client_last_version is None:
        return jsonify({"error": "Le paramètre 'last_version' est requis"}), 400

    # Vérifier si le statut a déjà changé depuis la dernière version connue du client
    with status_lock:
        if client_last_version < status_version:
            # Le statut a changé, renvoyer immédiatement
            return jsonify({"status": current_task_status, "version": status_version})

    # Si le statut n'a pas changé, le serveur doit maintenir la connexion ouverte
    # Créer un événement spécifique pour cette requête cliente
    client_event = threading.Event()
    request_info = {'event': client_event, 'timestamp': time.time()}

    with status_lock:
        waiting_clients.append(request_info)

    # Attendre un changement de statut ou un timeout
    # Le timeout est défini ici à 25 secondes pour le Long Polling
    # Si l'événement est déclenché (client_event.set()), wait() retourne True
    # Si le timeout est atteint, wait() retourne False
    event_set = client_event.wait(timeout=25) # Attente maximale de 25 secondes

    with status_lock:
        # Retirer l'événement de la liste si toujours présent (il pourrait avoir été retiré par update_status)
        # Pour cette implémentation, on s'appuie sur clear() dans update_status.
        # Cependant, pour une robustesse générale, on pourrait le retirer ici si update_status ne vide pas la liste.
        # Par exemple: if request_info in waiting_clients: waiting_clients.remove(request_info)

        if event_set or client_last_version < status_version:
            # Le statut a changé pendant l'attente ou juste avant de répondre
            return jsonify({"status": current_task_status, "version": status_version})
        else:
            # Timeout atteint, aucun changement de statut
            # Renvoyer un statut 204 No Content pour indiquer qu'il n'y a rien de nouveau
            return Response(status=204)

@app.route('/')
def index():
    # Sert le fichier index.html depuis le dossier 'static'
    return app.send_static_file('index.html')

if __name__ == '__main__':
    # Pour le développement, désactiver le rechargement automatique pour éviter des problèmes avec les threads
    # 'threaded=True' est important pour permettre à Flask de gérer plusieurs requêtes simultanément
    app.run(debug=True, port=5000, threaded=True)
```


### Explications du Serveur

*   **Variables Globales et Verrou (`status_lock`) :** `current_task_status` et `status_version` sont partagées entre les threads. `threading.Lock` est utilisé pour éviter les conditions de concurrence lors de leur modification ou lecture.
*   **`waiting_clients` :** Une `deque` (double-ended queue) est utilisée pour stocker les objets `threading.Event` associés à chaque requête `/poll-status` en attente. Chaque `threading.Event` est un drapeau qui peut être mis à `True` (set) ou `False` (clear).
*   **`/update-status` :**
    *   Met à jour le statut et incrémente la version.
    *   Parcourt la liste `waiting_clients` et appelle `set()` sur chaque `threading.Event`. Cela réveille les threads qui attendaient sur ces événements.
    *   `waiting_clients.clear()` est appelé pour vider la liste des clients notifiés.
*   **`/poll-status` :**
    *   Récupère `last_version` du client.
    *   Si `last_version` est inférieur à `status_version`, cela signifie que le client est en retard, et le serveur renvoie immédiatement le statut actuel.
    *   Si `last_version` est à jour, le serveur crée un `threading.Event` unique pour cette requête.
    *   Cet événement est ajouté à `waiting_clients`.
    *   `client_event.wait(timeout=25)` met le thread de la requête en pause pendant 25 secondes maximum.
        *   Si `set()` est appelé sur `client_event` par `/update-status`, `wait()` retourne `True` et la requête est débloquée.
        *   Si le timeout est atteint, `wait()` retourne `False`.
    *   Après `wait()`, le serveur vérifie si un changement a eu lieu ou si le timeout a été atteint et renvoie la réponse appropriée (nouveau statut ou 204 No Content).
*   **`app.run(threaded=True)` :** Essentiel pour permettre à Flask de gérer plusieurs requêtes simultanément, ce qui est nécessaire pour le Long Polling où certaines requêtes restent ouvertes.

## Partie 2 : Le Client (Front-end)

Le client sera une page HTML simple avec du JavaScript pour interagir avec le serveur.

### Structure des Fichiers

*   `static/index.html`
*   `static/script.js`

### Code HTML (`static/index.html`)


```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Long Polling Client</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #status-display {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 20px;
            padding: 10px;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
        }
        .controls { margin-top: 20px; }
        .controls input, .controls button { padding: 8px; margin-right: 5px; }
    </style>
    <script src="script.js" defer></script>
</head>
<body>
    <h1>Statut de la Tâche</h1>
    <p>Statut actuel : <span id="current-status">Chargement...</span> (Version: <span id="status-version">0</span>)</p>

    <div id="status-display">
        <!-- Le statut sera affiché ici -->
    </div>

    <div class="controls">
        <input type="text" id="new-status-input" placeholder="Nouveau statut" value="En cours">
        <button id="update-status-btn">Mettre à jour le statut</button>
    </div>
</body>
</html>
```


### Code JavaScript (`static/script.js`)


```javascript
document.addEventListener('DOMContentLoaded', () => {
    const currentStatusSpan = document.getElementById('current-status');
    const statusVersionSpan = document.getElementById('status-version');
    const statusDisplayDiv = document.getElementById('status-display');
    const newStatusInput = document.getElementById('new-status-input');
    const updateStatusBtn = document.getElementById('update-status-btn');

    let lastKnownVersion = 0; // Version du statut connue par le client

    // --- Fonction de Long Polling ---
    async function pollForStatus() {
        try {
            const response = await fetch(`/poll-status?last_version=${lastKnownVersion}`);

            if (response.status === 200) {
                // Nouveau statut reçu
                const data = await response.json();
                currentStatusSpan.textContent = data.status;
                statusVersionSpan.textContent = data.version;
                statusDisplayDiv.textContent = `Mise à jour: ${data.status} (Version: ${data.version})`;
                lastKnownVersion = data.version;
            } else if (response.status === 204) {
                // Pas de nouveau contenu (timeout du serveur)
                statusDisplayDiv.textContent = `Pas de changement (timeout). Relance du polling...`;
            } else {
                // Gérer d'autres codes d'erreur
                console.error('Erreur lors du polling:', response.status);
                statusDisplayDiv.textContent = `Erreur serveur (${response.status}). Réessai...`;
                // Attendre un court instant avant de relancer en cas d'erreur
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error('Erreur réseau lors du polling:', error);
            statusDisplayDiv.textContent = `Erreur réseau. Réessai...`;
            // Attendre un court instant avant de relancer en cas d'erreur réseau
            await new Promise(resolve => setTimeout(resolve, 2000));
        } finally {
            // Relancer immédiatement une nouvelle requête de Long Polling
            // C'est le cœur du mécanisme côté client
            pollForStatus();
        }
    }

    // --- Gestion du bouton de mise à jour ---
    updateStatusBtn.addEventListener('click', async () => {
        const newStatus = newStatusInput.value;
        if (!newStatus) {
            alert('Veuillez entrer un nouveau statut.');
            return;
        }

        try {
            const response = await fetch('/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Statut mis à jour par l\'admin:', data.new_status);
                // Le polling client devrait automatiquement récupérer cette mise à jour
            } else {
                console.error('Erreur lors de la mise à jour du statut:', response.status);
                alert('Erreur lors de la mise à jour du statut.');
            }
        } catch (error) {
            console.error('Erreur réseau lors de la mise à jour:', error);
            alert('Erreur réseau lors de la mise à jour du statut.');
        }
    });

    // Démarrer le Long Polling au chargement de la page
    pollForStatus();
});
```


### Explications du Client

*   **`lastKnownVersion` :** Cette variable JavaScript stocke la dernière version du statut que le client a reçue. Elle est cruciale pour que le serveur puisse déterminer si le client est à jour.
*   **`pollForStatus()` :**
    *   C'est la fonction principale qui implémente la boucle de Long Polling.
    *   Elle effectue une requête `GET` vers `/poll-status`, en passant `lastKnownVersion` comme paramètre.
    *   **Gestion de la réponse :**
        *   Si le statut HTTP est `200` (OK), cela signifie que le serveur a renvoyé un nouveau statut. Le client met à jour son affichage et `lastKnownVersion`.
        *   Si le statut HTTP est `204` (No Content), cela indique que le timeout du Long Polling a été atteint côté serveur sans qu'aucun changement ne se produise. Le client ne fait rien d'autre que de relancer le polling.
        *   Les erreurs réseau ou d'autres codes HTTP sont gérés avec un court délai avant de relancer le polling.
    *   **`finally { pollForStatus(); }` :** C'est l'élément clé du Long Polling côté client. Que la requête ait réussi, échoué ou qu'elle ait expiré, une nouvelle requête `pollForStatus()` est *immédiatement* lancée. Cela assure une boucle continue de Long Polling.
*   **Bouton de mise à jour (`updateStatusBtn`) :**
    *   Envoie une requête `POST` à `/update-status` avec le nouveau statut.
    *   Ceci simule l'action d'un administrateur et déclenche un changement d'état sur le serveur, qui à son tour notifiera tous les clients en Long Polling.

---

# Solution 2 : Implémentation avec Node.js (Express)

Cette solution utilise Node.js avec le framework Express pour le serveur. Express est un choix populaire pour les applications web légères et les APIs, et il gère bien la concurrence grâce à son modèle d'E/S non bloquant.

## Partie 1 : Le Serveur (Back-end)

Le serveur Express gérera l'état de la tâche et les requêtes de Long Polling. Pour gérer les clients en attente, nous stockerons leurs objets de réponse HTTP et les notifierons lors d'un changement d'état.

### Structure du Fichier

`server.js`

### Code du Serveur (`server.js`)


```javascript
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// --- Configuration Express ---
app.use(bodyParser.json()); // Pour parser les corps de requêtes JSON
app.use(express.static(path.join(__dirname, 'public'))); // Servir les fichiers statiques (HTML, JS, CSS)

// --- Variables Globales pour l'État de la Tâche ---
let currentTaskStatus = "En attente";
let statusVersion = 0;
// Tableau pour stocker les objets de réponse des clients en attente
const waitingClients = [];

// --- Endpoint pour la Mise à Jour du Statut (Admin) ---
app.post('/update-status', (req, res) => {
    const newStatus = req.body.status;
    if (!newStatus) {
        return res.status(400).json({ error: "Le statut est requis" });
    }

    // Mettre à jour le statut et incrémenter la version
    currentTaskStatus = newStatus;
    statusVersion++;
    console.log(`Statut mis à jour: ${currentTaskStatus} (Version: ${statusVersion})`);

    // Notifier tous les clients en attente
    // On itère sur une copie pour éviter les problèmes si des clients se déconnectent pendant l'itération
    while (waitingClients.length > 0) {
        const clientRes = waitingClients.shift(); // Récupère et retire le premier client
        clientRes.json({ status: currentTaskStatus, version: statusVersion });
    }

    res.json({ message: "Statut mis à jour", new_status: currentTaskStatus, version: statusVersion });
});

// --- Endpoint de Long Polling (Client) ---
app.get('/poll-status', (req, res) => {
    const clientLastVersion = parseInt(req.query.last_version, 10);
    if (isNaN(clientLastVersion)) {
        return res.status(400).json({ error: "Le paramètre 'last_version' est requis et doit être un nombre" });
    }

    // Vérifier si le statut a déjà changé depuis la dernière version connue du client
    if (clientLastVersion < statusVersion) {
        // Le statut a changé, renvoyer immédiatement
        return res.json({ status: currentTaskStatus, version: statusVersion });
    }

    // Si le statut n'a pas changé, le serveur doit maintenir la connexion ouverte
    // Ajouter l'objet de réponse du client à la liste des clients en attente
    waitingClients.push(res);

    // Définir un timeout pour la requête Long Polling
    // Si le timeout est atteint sans changement de statut, on renvoie une réponse "pas de changement"
    const timeoutId = setTimeout(() => {
        // Vérifier si le client est toujours dans la liste (il pourrait avoir été notifié entre-temps)
        const index = waitingClients.indexOf(res);
        if (index > -1) {
            waitingClients.splice(index, 1); // Retirer le client de la liste
            res.status(204).send(); // Renvoyer 204 No Content
            console.log('Long Polling timeout pour un client.');
        }
    }, 25000); // 25 secondes de timeout

    // Gérer la déconnexion prématurée du client (ex: fermeture de l'onglet)
    req.on('close', () => {
        clearTimeout(timeoutId); // Annuler le timeout si le client se déconnecte
        const index = waitingClients.indexOf(res);
        if (index > -1) {
            waitingClients.splice(index, 1); // Retirer le client de la liste
            console.log('Client déconnecté avant la fin du Long Polling.');
        }
    });
});

// --- Route pour servir la page HTML principale ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Démarrage du Serveur ---
app.listen(PORT, () => {
    console.log(`Serveur Long Polling démarré sur http://localhost:${PORT}`);
});
```


### Explications du Serveur

*   **`express` et `body-parser` :** `express` est le framework web, `body-parser` est utilisé pour analyser les corps de requêtes JSON.
*   **`waitingClients` :** Un tableau JavaScript est utilisé pour stocker les objets `res` (réponse HTTP) de toutes les requêtes `/poll-status` qui sont actuellement en attente.
*   **`/update-status` :**
    *   Met à jour `currentTaskStatus` et `statusVersion`.
    *   Parcourt le tableau `waitingClients`. Pour chaque `res` stocké, il envoie la nouvelle version du statut et ferme la connexion.
    *   `waitingClients.shift()` est utilisé pour retirer les clients un par un après les avoir notifiés.
*   **`/poll-status` :**
    *   Récupère `clientLastVersion` du client.
    *   Si `clientLastVersion` est inférieur à `statusVersion`, le serveur renvoie immédiatement le statut actuel.
    *   Si le statut n'a pas changé, l'objet `res` de la requête est ajouté à `waitingClients`.
    *   **`setTimeout` :** Un timer est mis en place pour chaque requête en attente. Si le timeout (25 secondes) est atteint avant qu'un changement de statut ne se produise, le serveur retire le client de `waitingClients` et envoie un statut `204 No Content`.
    *   **`req.on('close', ...)` :** Il est important de gérer la déconnexion prématurée du client. Si le client ferme la connexion (par exemple, ferme l'onglet du navigateur), le serveur annule le timeout et retire l'objet `res` de `waitingClients` pour éviter des erreurs.

## Partie 2 : Le Client (Front-end)

Le client sera une page HTML simple avec du JavaScript pour interagir avec le serveur. Le code JavaScript est identique à la solution Flask, car l'interaction avec le serveur via l'API Fetch reste la même.

### Structure des Fichiers

*   `public/index.html`
*   `public/script.js`

### Code HTML (`public/index.html`)


```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Long Polling Client (Node.js)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #status-display {
            font-size: 1.5em;
            font-weight: bold;
            margin-top: 20px;
            padding: 10px;
            border: 1px solid #ccc;
            background-color: #f9f9f9;
        }
        .controls { margin-top: 20px; }
        .controls input, .controls button { padding: 8px; margin-right: 5px; }
    </style>
</head>
<body>
    <h1>Statut de la Tâche</h1>
    <p>Statut actuel : <span id="current-status">Chargement...</span> (Version: <span id="status-version">0</span>)</p>

    <div id="status-display">
        <!-- Le statut sera affiché ici -->
    </div>

    <div class="controls">
        <input type="text" id="new-status-input" placeholder="Nouveau statut" value="Terminée">
        <button id="update-status-btn">Mettre à jour le statut</button>
    </div>

    <script src="script.js"></script>
</body>
</html>
```


### Code JavaScript (`public/script.js`)


```javascript
document.addEventListener('DOMContentLoaded', () => {
    const currentStatusSpan = document.getElementById('current-status');
    const statusVersionSpan = document.getElementById('status-version');
    const statusDisplayDiv = document.getElementById('status-display');
    const newStatusInput = document.getElementById('new-status-input');
    const updateStatusBtn = document.getElementById('update-status-btn');

    let lastKnownVersion = 0; // Version du statut connue par le client

    // --- Fonction de Long Polling ---
    async function pollForStatus() {
        try {
            const response = await fetch(`/poll-status?last_version=${lastKnownVersion}`);

            if (response.status === 200) {
                // Nouveau statut reçu
                const data = await response.json();
                currentStatusSpan.textContent = data.status;
                statusVersionSpan.textContent = data.version;
                statusDisplayDiv.textContent = `Mise à jour: ${data.status} (Version: ${data.version})`;
                lastKnownVersion = data.version;
            } else if (response.status === 204) {
                // Pas de nouveau contenu (timeout du serveur)
                statusDisplayDiv.textContent = `Pas de changement (timeout). Relance du polling...`;
            } else {
                // Gérer d'autres codes d'erreur
                console.error('Erreur lors du polling:', response.status);
                statusDisplayDiv.textContent = `Erreur serveur (${response.status}). Réessai...`;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error('Erreur réseau lors du polling:', error);
            statusDisplayDiv.textContent = `Erreur réseau. Réessai...`;
            await new Promise(resolve => setTimeout(resolve, 2000));
        } finally {
            // Relancer immédiatement une nouvelle requête de Long Polling
            pollForStatus();
        }
    }

    // --- Gestion du bouton de mise à jour ---
    updateStatusBtn.addEventListener('click', async () => {
        const newStatus = newStatusInput.value;
        if (!newStatus) {
            alert('Veuillez entrer un nouveau statut.');
            return;
        }

        try {
            const response = await fetch('/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Statut mis à jour par l\'admin:', data.new_status);
            } else {
                console.error('Erreur lors de la mise à jour du statut:', response.status);
                alert('Erreur lors de la mise à jour du statut.');
            }
        } catch (error) {
            console.error('Erreur réseau lors de la mise à jour:', error);
            alert('Erreur réseau lors de la mise à jour du statut.');
        }
    });

    // Démarrer le Long Polling au chargement de la page
    pollForStatus();
});
```


### Explications du Client

Les explications pour le client sont identiques à celles de la solution Flask, car la logique d'interaction avec le serveur via l'API Fetch reste la même, indépendamment de la technologie back-end utilisée. Le client envoie `lastKnownVersion` et attend une réponse, puis relance immédiatement une nouvelle requête de Long Polling.

---