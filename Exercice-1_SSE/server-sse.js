const express = require("express");
const path = require("path");

const app = express();

// Prix initiaux pour simuler des variations
let stockPrices = {
    AAPL: {
        price: 170.0,
        change: 0
    },
    GOOG: {
        price: 1500.0,
        change: 0
    },
    MSFT: {
        price: 250.0,
        change: 0
    },
    AMZN: {
        price: 130.0,
        change: 0
    }
};

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

    const sendUpdate = () => {
        stockPrices = generateStockData(stockPrices);
        res.write(`data: ${JSON.stringify(stockPrices)}\n\n`);
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