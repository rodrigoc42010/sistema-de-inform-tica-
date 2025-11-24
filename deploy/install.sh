#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
cd server
npm install
node index.js &
sleep 1
echo "WebSocket: ws://localhost:7000/ws"
echo "Cliente:   http://localhost:7000/client/"
echo "Técnico:   http://localhost:7000/tech/"