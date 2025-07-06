// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const TikTokLive = require('tiktok-live-connector').default;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Ersetze hier deinen TikTok-Namen (ohne @)
const TIKTOK_USERNAME = "dein_nutzername";

app.use(express.static('public'));

let clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Funktion um Nachricht an alle Clients zu senden
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(ws => {
    if(ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

async function startTikTokListener() {
  const tiktokConnection = new TikTokLive(TIKTOK_USERNAME);
  try {
    await tiktokConnection.connect();
    console.log(`Verbunden mit TikTok Live von ${TIKTOK_USERNAME}`);

    tiktokConnection.on('gift', (data) => {
      const username = data.uniqueId;
      // Beispiel: giftType 1 = 1 Coin, sonst 3 Coins
      // Du kannst hier anpassen je nach Geschenk
      let coins = 1;
      if (data.giftType && data.giftType !== 1) coins = 3;

      console.log(`Spende von ${username}: ${coins} Coin(s)`);

      // Sende an Overlay
      broadcast({
        type: 'gift',
        username: username,
        coins: coins
      });
    });

  } catch (err) {
    console.error("Fehler beim Verbinden mit TikTok Live:", err);
  }
}

startTikTokListener();

const PORT_USED = PORT;
server.listen(PORT_USED, () => {
  console.log(`Server läuft auf http://localhost:${PORT_USED}`);
});
