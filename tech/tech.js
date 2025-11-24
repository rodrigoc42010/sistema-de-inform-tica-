const state = { ws: null, id: null, pc: null, dc: null, target: null, clients: [] };
function wsUrl() { const p = location.protocol === 'https:' ? 'wss' : 'ws'; return `${p}://${location.host}/ws`; }
function connectWs() { state.ws = new WebSocket(wsUrl()); state.ws.onmessage = onWsMessage; state.ws.onopen = () => join(); }
function sendWs(o) { if (state.ws && state.ws.readyState === WebSocket.OPEN) state.ws.send(JSON.stringify(o)); }
function join() { const name = document.getElementById('name').value || 'Tecnico'; const browser = navigator.userAgent; const os = navigator.platform || ''; sendWs({ type: 'join', role: 'tech', name, browser, os }); }
function onWsMessage(ev) { const msg = JSON.parse(ev.data); if (msg.type === 'joined') { state.id = msg.id; } else if (msg.type === 'clients') { state.clients = msg.items; renderClients(); } else if (msg.type === 'answer') { handleAnswer(msg); } else if (msg.type === 'candidate') { addIce(msg); } }
function renderClients() { const el = document.getElementById('list'); el.innerHTML = ''; state.clients.forEach((c) => { const r = document.createElement('div'); r.className = 'item'; const last = Math.round((Date.now() - c.last) / 1000) + 's'; r.innerHTML = `<div>${c.id}</div><div>${c.name}</div><div>${c.browser.slice(0,20)}</div><div>${c.os}</div><div>${c.ping || ''}</div>`; const bt = document.createElement('button'); bt.textContent = 'Conectar'; bt.onclick = () => connectClient(c.id); r.appendChild(bt); el.appendChild(r); }); }
async function connectClient(id) { state.target = id; await ensurePc(); const offer = await state.pc.createOffer({ offerToReceiveVideo: true }); await state.pc.setLocalDescription(offer); sendWs({ type: 'offer', to: id, sdp: offer.sdp }); sendWs({ type: 'request_control', to: id, enable: true }); setQuality(); }
async function ensurePc() { if (state.pc) return; state.pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'turn:localhost:3478', username: 'webrtc', credential: '12345' }] }); state.pc.addEventListener('icecandidate', (e) => { if (e.candidate) sendWs({ type: 'candidate', to: state.target, toRole: 'client', candidate: e.candidate }); }); state.pc.addEventListener('track', (e) => { document.getElementById('view').srcObject = e.streams[0]; }); state.dc = state.pc.createDataChannel('control'); state.dc.onopen = () => {}; }
async function handleAnswer(msg) { await state.pc.setRemoteDescription({ type: 'answer', sdp: msg.sdp }); }
function addIce(msg) { state.pc && state.pc.addIceCandidate(msg.candidate); }
function setQuality() { const m = document.getElementById('quality').value; sendWs({ type: 'set_quality', to: state.target, mode: m }); }
function sendMouse(e) { if (!state.dc || state.dc.readyState !== 'open') return; state.dc.send(JSON.stringify({ type: 'mouse', x: e.clientX, y: e.clientY, b: 0 })); }
function sendKey(e) { if (!state.dc || state.dc.readyState !== 'open') return; state.dc.send(JSON.stringify({ type: 'key', k: e.key })); }
document.getElementById('start').onclick = connectWs;
document.getElementById('quality').onchange = setQuality;
document.getElementById('view').onmousemove = sendMouse;
window.onkeydown = sendKey;
document.getElementById('fullscreen').onclick = () => { const v = document.getElementById('view'); if (v.requestFullscreen) v.requestFullscreen(); };