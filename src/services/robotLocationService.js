import { isValidCoord } from '../utils/distance.js';

/* Accepted update shape:
   { lat, lng, timestamp, status, destination?: {lat,lng}, speed?: m/s }
   ("latitude"/"longitude" are also accepted.) Invalid data is dropped. */
export function normalizeUpdate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const pos = { lat: Number(raw.lat ?? raw.latitude), lng: Number(raw.lng ?? raw.longitude) };
  if (!isValidCoord(pos)) return null;
  const d = raw.destination && { lat: Number(raw.destination.lat), lng: Number(raw.destination.lng) };
  return {
    ...pos,
    timestamp: raw.timestamp ? new Date(raw.timestamp) : new Date(),
    status: String(raw.status ?? 'unknown'),
    destination: isValidCoord(d) ? d : null,
    speed: Number.isFinite(Number(raw.speed)) ? Number(raw.speed) : null,
  };
}

/* Connects to a WebSocket (ws/wss URL) or polls an HTTP endpoint returning JSON.
   Returns a cleanup function. onState: 'connecting' | 'connected' | 'error' */
export function connectLive(url, onUpdate, onState) {
  let closed = false, ws, timer;
  const push = (raw) => { const u = normalizeUpdate(raw); if (u && !closed) onUpdate(u); };
  try {
    if (/^wss?:/i.test(url)) {
      onState('connecting');
      ws = new WebSocket(url);
      ws.onopen = () => onState('connected');
      ws.onmessage = (e) => { try { push(JSON.parse(e.data)); } catch { /* ignore bad frame */ } };
      ws.onerror = () => onState('error');
      ws.onclose = () => !closed && onState('error');
    } else if (/^https?:/i.test(url)) {
      onState('connecting');
      const poll = async () => {
        try { const r = await fetch(url); push(await r.json()); !closed && onState('connected'); }
        catch { !closed && onState('error'); }
      };
      poll(); timer = setInterval(poll, 3000);
    } else onState('error');
  } catch { onState('error'); }
  return () => { closed = true; clearInterval(timer); ws && ws.close(); };
}
