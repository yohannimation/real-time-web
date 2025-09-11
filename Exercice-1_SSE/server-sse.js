const express = require("express");
const path = require("path");

const app = express();

// Prix initiaux pour simuler des variations
let stockPrices = {
    AAPL: { price: 170.0, change: 0 },
    GOOG: { price: 1500.0, change: 0 },
    MSFT: { price: 250.0, change: 0 },
    AMZN: { price: 130.0, change: 0 }
};

// Buffer pour stocker les derniers événements SSE
const eventBuffer = [];
let eventCounter = 0; // identifiant unique pour chaque événement
const MAX_BUFFER = 50;

// Fonction qui génère des cotations boursières aléatoires
function generateStockData(stockPrices) {
    const data = {};

    Object.keys(stockPrices).forEach((symbol) => {
        const oldPrice = stockPrices[symbol].price

        const change = Math.round((Math.random() * 10 - 5));
        const price = Math.round((oldPrice + change) * 100) / 100

        data[symbol] = {
            price,
            change,
        };
    });
    return data;
}

// Route principale -> index.html (dans "templates")
app.use(express.static(path.join(__dirname, "templates")));

// Route SSE
app.get("/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Important pour Nginx/proxies

    const lastEventId = parseInt(req.headers["last-event-id"]) || 0;

    // Envoyer les événements manqués depuis le buffer
    eventBuffer.forEach(ev => {
        if (ev.id > lastEventId) {
            res.write(`id: ${ev.id}\n`);
            res.write(`data: ${ev.data}\n\n`);
        }
    });

    // Fonction qui envoie les événements
    const sendUpdate = () => {
        stockPrices = generateStockData(stockPrices);
        const data = JSON.stringify(stockPrices);

        eventCounter++;
        // Ajouter au buffer
        eventBuffer.push({ id: eventCounter, data });
        if (eventBuffer.length > MAX_BUFFER) eventBuffer.shift();

        res.write(`id: ${eventCounter}\n`);
        res.write(`data: ${data}\n\n`);
    };
    
    // Envoie des mises à jour toutes les 2 secondes
    const interval = setInterval(sendUpdate, 2000);

    // Nettoyage si le client se déconnecte
    req.on("close", () => {
        clearInterval(interval);
    });
});

app.listen(3000, () => {
    console.log('SSE server started on port 3000');
});