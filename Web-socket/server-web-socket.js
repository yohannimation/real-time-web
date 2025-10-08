const WebSocket = require("ws");

// Création du serveur WebSocket sur le port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log("Serveur WebSocket démarré sur ws://localhost:8080");

// Gestion des nouvelles connexions
wss.on("connection", (ws) => {
    console.log("Nouveau client connecté");

    // Gestion des messages reçus d'un client
    ws.on("message", (message) => {
        console.log(`Message reçu : ${message}`);

        // Broadcast du message à tous les autres clients connectés
        wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
        }
        });
    });

    // Gestion de la déconnexion
    ws.on("close", () => {
        console.log("Client déconnecté");
    });
});
