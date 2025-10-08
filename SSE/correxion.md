Voici deux solutions possibles pour le TP sur les Server-Sent Events (SSE), chacune utilisant une technologie back-end différente mais une approche client similaire.

---

# Solution 1 : Serveur Python (Flask)

Cette solution utilise le framework web Flask pour le serveur, réputé pour sa simplicité et sa flexibilité, et le JavaScript natif côté client pour la gestion des événements SSE.

## Partie 1 : Le Serveur SSE (Python avec Flask)

Le serveur Flask générera des données de cotations boursières fictives et les diffusera via un endpoint SSE.

### Structure du Projet


```
sse_stock_app/
├── templates/
│   └── index.html
└── server.py
```


### Code du Serveur (`server.py`)


```python
from flask import Flask, Response, render_template
import json
import time
import random
import os

app = Flask(__name__, template_folder='templates') # Spécifie le dossier des templates

# Prix initiaux pour simuler des variations
stock_prices = {
    "AAPL": 170.00,
    "GOOG": 1500.00,
    "MSFT": 250.00,
    "AMZN": 130.00
}

def generate_stock_update():
    """
    Génère une mise à jour aléatoire pour une action.
    Met à jour le prix globalement pour simuler une évolution continue.
    """
    symbol = random.choice(list(stock_prices.keys()))
    current_price = stock_prices[symbol]
    
    # Simule une variation de prix aléatoire (+/- 0.5%)
    change_percent = random.uniform(-0.5, 0.5) / 100 
    new_price = current_price * (1 + change_percent)
    new_price = round(new_price, 2) # Arrondir à 2 décimales
    
    # Calculer le changement réel pour l'affichage
    change_value = round(new_price - current_price, 2)
    
    stock_prices[symbol] = new_price # Mettre à jour le prix pour la prochaine itération
    
    return {
        "symbol": symbol,
        "price": new_price,
        "change": change_value
    }

@app.route('/')
def index():
    """
    Route principale qui sert la page HTML du client.
    """
    return render_template('index.html')

@app.route('/stream')
def stream():
    """
    Endpoint SSE qui diffuse les mises à jour des cotations boursières.
    """
    def event_stream():
        # Un compteur pour l'ID de l'événement (pour la résilience de EventSource)
        event_id = 0 
        while True:
            stock_data = generate_stock_update()
            event_id += 1
            
            # Format SSE: id: <id>\ndata: <votre_json>\n\n
            # Le 'id' est optionnel mais recommandé pour la gestion des reconnexions par EventSource.
            # Les deux '\n' finaux sont cruciaux pour délimiter chaque événement.
            yield f"id: {event_id}\ndata: {json.dumps(stock_data)}\n\n"
            
            time.sleep(2) # Envoyer une mise à jour toutes les 2 secondes

    # Retourne une réponse avec le mimetype 'text/event-stream'
    # Les en-têtes Cache-Control et X-Accel-Buffering sont importants
    # pour s'assurer que les événements sont envoyés immédiatement et non mis en cache.
    return Response(event_stream(), mimetype='text/event-stream', headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive", # Indique que la connexion doit rester ouverte
        "X-Accel-Buffering": "no" # Spécifique pour Nginx/proxies pour désactiver le buffering
    })

if __name__ == '__main__':
    # Lance l'application Flask.
    # debug=True permet le rechargement automatique et des messages d'erreur détaillés.
    # port=5000 est le port par défaut.
    app.run(debug=True, port=5000)
```


### Explications du Serveur

*   **`stock_prices` :** Un dictionnaire global maintient l'état actuel des prix des actions. Il est mis à jour à chaque génération pour simuler une évolution réaliste.
*   **`generate_stock_update()` :** Cette fonction choisit une action au hasard, calcule une nouvelle variation de prix et met à jour le prix global de l'action. Elle retourne un dictionnaire avec le symbole, le nouveau prix et le changement.
*   **`@app.route('/')` :** Sert le fichier `index.html` situé dans le dossier `templates`. Flask utilise `render_template` pour cela.
*   **`@app.route('/stream')` :** C'est l'endpoint SSE.
    *   La fonction interne `event_stream()` est un générateur (`yield`). Flask l'utilise pour envoyer des morceaux de données au fur et à mesure qu'ils sont générés.
    *   La boucle `while True` assure une diffusion continue.
    *   Chaque événement est formaté avec `id: <numéro>\ndata: <JSON>\n\n`. L'ID est utile pour la gestion des reconnexions par le client `EventSource`.
    *   `time.sleep(2)` introduit un délai de 2 secondes entre chaque événement.
    *   La `Response` est configurée avec `mimetype='text/event-stream'` et des en-têtes spécifiques (`Cache-Control`, `Connection`, `X-Accel-Buffering`) pour garantir le bon fonctionnement des SSE, en empêchant la mise en cache et en forçant la persistance de la connexion.

## Partie 2 : Le Client Web (HTML/JavaScript)

Le client est une page HTML simple qui utilise JavaScript pour se connecter à l'endpoint SSE et afficher les mises à jour en temps réel.

### Structure du Fichier

`templates/index.html`

### Code HTML (`templates/index.html`)


```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotations Boursières en Temps Réel (SSE)</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; background-color: #eef; color: #333; }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        #stock-quotes {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin: 0 auto;
            max-width: 1200px;
        }
        .stock-card {
            background-color: #ffffff;
            border: 1px solid #cce;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            transition: transform 0.2s ease-in-out;
        }
        .stock-card:hover {
            transform: translateY(-5px);
        }
        .stock-card h2 {
            margin-top: 0;
            color: #3498db;
            font-size: 1.8em;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .stock-card p {
            margin: 8px 0;
            font-size: 1.2em;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .stock-card p strong {
            color: #555;
        }
        .price, .change {
            font-weight: bold;
            font-size: 1.3em;
        }
        .price-up { color: #27ae60; } /* Vert */
        .price-down { color: #e74c3c; } /* Rouge */
        .price-unchanged { color: #7f8c8d; } /* Gris */
    </style>
</head>
<body>
    <h1>Cotations Boursières en Temps Réel</h1>
    <div id="stock-quotes">
        <!-- Les cotations seront insérées ici par JavaScript -->
        <div class="stock-card" id="stock-AAPL">
            <h2>AAPL</h2>
            <p><strong>Prix:</strong> <span class="price">Chargement...</span></p>
            <p><strong>Changement:</strong> <span class="change price-unchanged">--</span></p>
        </div>
        <div class="stock-card" id="stock-GOOG">
            <h2>GOOG</h2>
            <p><strong>Prix:</strong> <span class="price">Chargement...</span></p>
            <p><strong>Changement:</strong> <span class="change price-unchanged">--</span></p>
        </div>
        <div class="stock-card" id="stock-MSFT">
            <h2>MSFT</h2>
            <p><strong>Prix:</strong> <span class="price">Chargement...</span></p>
            <p><strong>Changement:</strong> <span class="change price-unchanged">--</span></p>
        </div>
        <div class="stock-card" id="stock-AMZN">
            <h2>AMZN</h2>
            <p><strong>Prix:</strong> <span class="price">Chargement...</span></p>
            <p><strong>Changement:</strong> <span class="change price-unchanged">--</span></p>
        </div>
    </div>

    <script>
        // Crée une nouvelle connexion EventSource à l'endpoint SSE du serveur.
        const eventSource = new EventSource('/stream');
        const stockQuotesDiv = document.getElementById('stock-quotes');
        // Un objet pour stocker les références aux éléments DOM des actions,
        // permettant une mise à jour efficace sans recréer les éléments.
        const stockElements = {}; 

        // Initialisation des éléments existants dans le DOM
        document.querySelectorAll('.stock-card').forEach(card => {
            const symbol = card.querySelector('h2').textContent;
            stockElements[symbol] = card;
        });

        // Gestionnaire pour les messages reçus du serveur via SSE.
        eventSource.onmessage = function(event) {
            // Les données sont envoyées sous forme de chaîne JSON, il faut les parser.
            const data = JSON.parse(event.data);
            const symbol = data.symbol;
            const price = data.price;
            const change = data.change;

            let stockCard = stockElements[symbol];

            // Si la carte de l'action n'existe pas encore (utile si des actions sont ajoutées dynamiquement)
            if (!stockCard) {
                stockCard = document.createElement('div');
                stockCard.className = 'stock-card';
                stockCard.id = `stock-${symbol}`;
                stockCard.innerHTML = `
                    <h2>${symbol}</h2>
                    <p><strong>Prix:</strong> <span class="price"></span></p>
                    <p><strong>Changement:</strong> <span class="change"></span></p>
                `;
                stockQuotesDiv.appendChild(stockCard);
                stockElements[symbol] = stockCard;
            }

            // Mettre à jour les informations de prix et de changement
            const priceSpan = stockCard.querySelector('.price');
            const changeSpan = stockCard.querySelector('.change');

            priceSpan.textContent = `${price.toFixed(2)} €`; // Afficher le prix avec 2 décimales
            changeSpan.textContent = `${change.toFixed(2)} €`; // Afficher le changement avec 2 décimales

            // Appliquer la classe CSS appropriée en fonction du changement de prix
            changeSpan.classList.remove('price-up', 'price-down', 'price-unchanged');
            if (change > 0) {
                changeSpan.classList.add('price-up');
            } else if (change < 0) {
                changeSpan.classList.add('price-down');
            } else {
                changeSpan.classList.add('price-unchanged');
            }
        };

        // Gestionnaire pour les erreurs de connexion EventSource.
        eventSource.onerror = function(err) {
            console.error("EventSource failed:", err);
            // Ici, vous pourriez afficher un message d'erreur à l'utilisateur
            // ou tenter de relancer la connexion si nécessaire (EventSource le fait souvent automatiquement).
        };
    </script>
</body>
</html>
```


### Explications du Client

*   **`EventSource('/stream')` :** C'est l'API JavaScript native pour établir une connexion SSE. Elle pointe vers l'endpoint `/stream` de notre serveur.
*   **`stockElements` :** Un objet JavaScript est utilisé pour stocker les références aux éléments DOM (`div.stock-card`) de chaque action. Cela permet de trouver et de mettre à jour rapidement les informations d'une action sans avoir à parcourir le DOM à chaque mise à jour.
*   **`eventSource.onmessage` :** Ce gestionnaire est appelé chaque fois que le serveur envoie un événement `data:`.
    *   `event.data` contient la chaîne JSON envoyée par le serveur, qui est ensuite parsée.
    *   Le code vérifie si une carte pour l'action existe déjà. Si oui, il met à jour ses `<span>` de prix et de changement. Sinon, il crée une nouvelle carte.
    *   Des classes CSS (`price-up`, `price-down`, `price-unchanged`) sont ajoutées ou retirées pour changer dynamiquement la couleur du texte en fonction de la variation du prix.
*   **`eventSource.onerror` :** Ce gestionnaire est appelé en cas d'erreur de connexion. `EventSource` a une logique de reconnexion intégrée, mais ce gestionnaire permet de loguer les erreurs ou d'informer l'utilisateur.

---

# Solution 2 : Serveur Node.js (Express)

Cette solution propose un serveur basé sur Node.js avec le framework Express. Node.js est excellent pour les applications en temps réel grâce à son modèle d'E/S non bloquant. Le client JavaScript reste identique à la solution Flask, car l'API `EventSource` est standard.

## Partie 1 : Le Serveur SSE (Node.js avec Express)

Le serveur Express gérera la diffusion des cotations boursières via SSE.

### Structure du Projet


```
sse_stock_app_node/
├── public/
│   └── index.html
└── server.js
```


### Initialisation du Projet Node.js

1.  Créez un dossier `sse_stock_app_node`.
2.  Initialisez un projet Node.js : `npm init -y`
3.  Installez Express : `npm install express`

### Code du Serveur (`server.js`)


```javascript
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000; // Port pour le serveur Node.js

// --- Configuration Express ---
// Sert les fichiers statiques (index.html, CSS, JS) depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Prix initiaux pour simuler des variations
const stockPrices = {
    "AAPL": 170.00,
    "GOOG": 1500.00,
    "MSFT": 250.00,
    "AMZN": 130.00
};

function generateStockUpdate() {
    /**
     * Génère une mise à jour aléatoire pour une action.
     * Met à jour le prix globalement pour simuler une évolution continue.
     */
    const symbols = Object.keys(stockPrices);
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    let currentPrice = stockPrices[symbol];
    
    // Simule une variation de prix aléatoire (+/- 0.5%)
    const changePercent = (Math.random() * 1 - 0.5) / 100; // entre -0.005 et +0.005
    const newPrice = currentPrice * (1 + changePercent);
    const roundedNewPrice = parseFloat(newPrice.toFixed(2)); // Arrondir à 2 décimales
    
    // Calculer le changement réel pour l'affichage
    const changeValue = parseFloat((roundedNewPrice - currentPrice).toFixed(2));
    
    stockPrices[symbol] = roundedNewPrice; // Mettre à jour le prix pour la prochaine itération
    
    return {
        "symbol": symbol,
        "price": roundedNewPrice,
        "change": changeValue
    };
}

// --- Route principale qui sert la page HTML du client ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Endpoint SSE qui diffuse les mises à jour des cotations boursières ---
app.get('/stream', (req, res) => {
    // Configure les en-têtes pour une connexion SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Important pour Nginx/proxies
    });

    let eventId = 0; // Compteur pour l'ID de l'événement

    // Fonction pour envoyer un événement SSE
    const sendEvent = () => {
        const stockData = generateStockUpdate();
        eventId++;
        // Format SSE: id: <id>\ndata: <votre_json>\n\n
        res.write(`id: ${eventId}\ndata: ${JSON.stringify(stockData)}\n\n`);
    };

    // Envoie un événement immédiatement, puis toutes les 2 secondes
    sendEvent(); // Premier événement
    const intervalId = setInterval(sendEvent, 2000); // Événements suivants toutes les 2 secondes

    // Gère la déconnexion du client
    req.on('close', () => {
        console.log('Client déconnecté, arrêt de la diffusion SSE.');
        clearInterval(intervalId); // Arrête l'envoi d'événements pour ce client
        res.end(); // Termine la réponse HTTP
    });
});

// --- Démarrage du Serveur ---
app.listen(PORT, () => {
    console.log(`Serveur SSE démarré sur http://localhost:${PORT}`);
});
```


### Explications du Serveur

*   **`express` et `path` :** `express` est le framework web, `path` est utilisé pour gérer les chemins de fichiers.
*   **`app.use(express.static(...))` :** Configure Express pour servir les fichiers statiques (comme `index.html` et son JavaScript) depuis le dossier `public`.
*   **`stockPrices` et `generateStockUpdate()` :** La logique est très similaire à la version Python, mais implémentée en JavaScript.
*   **`app.get('/')` :** Sert le fichier `index.html` situé dans le dossier `public`.
*   **`app.get('/stream')` :** C'est l'endpoint SSE.
    *   `res.writeHead(200, {...})` : Configure les en-têtes HTTP nécessaires pour SSE, similaires à la solution Flask.
    *   `setInterval(sendEvent, 2000)` : Une fonction `sendEvent` est appelée toutes les 2 secondes pour générer et envoyer un nouvel événement SSE. `res.write()` est utilisé pour envoyer les données.
    *   `req.on('close', ...)` : Il est crucial de gérer la déconnexion du client. Lorsque le client ferme la connexion (par exemple, ferme l'onglet du navigateur), l'événement `close` est déclenché. Le serveur doit alors `clearInterval` pour arrêter l'envoi d'événements inutiles et `res.end()` pour terminer la réponse.

## Partie 2 : Le Client Web (HTML/JavaScript)

Le client est une page HTML simple avec du JavaScript. Le code JavaScript est **identique** à celui de la solution Flask, car l'API `EventSource` est une fonctionnalité standard du navigateur et ne dépend pas de la technologie back-end.

### Structure du Fichier

`public/index.html`

### Code HTML (`public/index.html`)

Le contenu de `public/index.html` est exactement le même que `templates/index.html` de la Solution 1.

### Code JavaScript

Le code JavaScript intégré dans `public/index.html` est exactement le même que celui de la Solution 1.

---