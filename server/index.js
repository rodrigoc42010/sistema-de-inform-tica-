const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const WebSocket = require('ws');
const signaling = require('./signaling');

const app = express();
app.use(cors());
app.get('/', (req, res) => res.json({ status: 'ok' }));
app.use('/client', express.static(path.resolve(__dirname, '..', 'client')));
app.use('/tech', express.static(path.resolve(__dirname, '..', 'tech')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

const sockets = new Map();

function send(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcastTechs(msg) {
  signaling.techSockets().forEach((ws) => send(ws, msg));
}

wss.on('connection', (ws) => {
  let socketId = null;
  let role = null;
  let targetClient = null;
  sockets.set(ws, true);

  ws.on('message', async (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }
    const type = msg.type;
    if (type === 'join') {
      role = msg.role;
      socketId = signaling.genId();
      const info = { id: socketId, name: msg.name || 'user', browser: msg.browser || '', os: msg.os || '', ping: null, last: Date.now() };
      if (role === 'client') signaling.addClient(socketId, ws, info);
      else signaling.addTech(socketId, ws, info);
      send(ws, { type: 'joined', id: socketId });
      broadcastTechs({ type: 'clients', items: signaling.clientInfos() });
    } else if (type === 'ping') {
      send(ws, { type: 'pong', ts: msg.ts });
    } else if (type === 'netupdate') {
      if (role === 'client' && socketId) signaling.updateClient(socketId, { ping: msg.ping, last: Date.now() });
      broadcastTechs({ type: 'clients', items: signaling.clientInfos() });
    } else if (type === 'offer') {
      targetClient = msg.to;
      const cw = signaling.clientSocket(targetClient);
      if (cw) send(cw, { type: 'offer', from: socketId, sdp: msg.sdp });
    } else if (type === 'answer') {
      const tw = signaling.techSocket(msg.to);
      if (tw) send(tw, { type: 'answer', from: socketId, sdp: msg.sdp });
    } else if (type === 'candidate') {
      const dest = msg.toRole === 'client' ? signaling.clientSocket(msg.to) : signaling.techSocket(msg.to);
      if (dest) send(dest, { type: 'candidate', from: socketId, candidate: msg.candidate });
    } else if (type === 'request_control') {
      const cw = signaling.clientSocket(msg.to);
      if (cw) send(cw, { type: 'request_control', from: socketId, enable: msg.enable });
    } else if (type === 'set_quality') {
      const cw = signaling.clientSocket(msg.to);
      if (cw) send(cw, { type: 'set_quality', mode: msg.mode });
    } else if (type === 'upload_probe') {
      send(ws, { type: 'upload_ack', size: msg.size, ts: msg.ts });
    }
  });

  ws.on('close', () => {
    if (role === 'client') signaling.removeClient(socketId);
    else signaling.removeTech(socketId);
    sockets.delete(ws);
    broadcastTechs({ type: 'clients', items: signaling.clientInfos() });
  });
});

const port = process.env.PORT || 7000;
server.listen(port, () => {});