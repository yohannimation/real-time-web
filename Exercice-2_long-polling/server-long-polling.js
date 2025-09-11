const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const availableState = [
    'state-0',
    'state-1',
    'state-2',
    'state-3'
]
let selectedState = 0
let waitingClients = [];

// Route principale -> index.html (dans "templates")
app.use(express.static(path.join(__dirname, "templates")));

// Route pour envoyer une réponse à un long polling
app.post("/update-status", (req, res) => {
    const { state } = req.body

    // Répond à tous les clients en attente
    waitingClients.forEach((client) => {
        client.json({ state: availableState[state] });
    });
    waitingClients = [];

    res.json({ success: true, state: state });
});

// Route pour receptionner les long polling
app.get("/poll", (req, res) => {
    // Si le client demande immédiatement, on l'ajoute à la liste d'attente
    waitingClients.push(res);

    // Sécurité : ne pas laisser une requête ouverte trop longtemps
    setTimeout(() => {
        const index = waitingClients.indexOf(res);
        if (index !== -1) {
            waitingClients.splice(index, 1);
            res.json({ state: selectedState });
        }
    }, 30000); // max 30s d’attente
})

app.listen(3000, () => {
    console.log('Long polling server started on port 3000');
});