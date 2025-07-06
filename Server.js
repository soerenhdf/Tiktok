const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const TikTokLive = require('tiktok-live-connector').default;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// TikTok-Nutzername hier eintragen (ohne @)
const TIKTOK_USERNAME = "dein_nutzername";

// Statt 'public' jetzt Hauptverzeichnis als statischer Ordner
app.use(express.static(__dirname));

let clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
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
      let coins = 1;
      if (data.giftType && data.giftType !== 1) coins = 3;

      console.log(`Spende von ${username}: ${coins} Coin(s)`);

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

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
