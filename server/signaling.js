const clients = new Map();
const techs = new Map();

function genId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function addClient(id, ws, info) {
  clients.set(id, { ws, info });
}

function addTech(id, ws, info) {
  techs.set(id, { ws, info });
}

function removeClient(id) {
  clients.delete(id);
}

function removeTech(id) {
  techs.delete(id);
}

function updateClient(id, patch) {
  const c = clients.get(id);
  if (!c) return;
  c.info = { ...c.info, ...patch };
}

function clientInfos() {
  return Array.from(clients.values()).map((c) => ({ id: c.info.id, name: c.info.name, browser: c.info.browser, os: c.info.os, ping: c.info.ping, last: c.info.last }));
}

function clientSocket(id) {
  const c = clients.get(id);
  return c ? c.ws : null;
}

function techSocket(id) {
  const t = techs.get(id);
  return t ? t.ws : null;
}

function techSockets() {
  return Array.from(techs.values()).map((t) => t.ws);
}

module.exports = { genId, addClient, addTech, removeClient, removeTech, updateClient, clientInfos, clientSocket, techSocket, techSockets };