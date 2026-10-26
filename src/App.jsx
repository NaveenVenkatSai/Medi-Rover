import { useState, useEffect, useRef, useCallback } from 'react';
import RobotMap from './components/RobotMap.jsx';
import { DEMO_ROUTE, DEMO_DESTINATION, DEMO_SPEED_MPS, pointAt } from './data/demoRoute.js';
import { connectLive } from './services/robotLocationService.js';

const TABS = [['rover', '🕹️ Rover'], ['patients', '🛏️ Patients'], ['rx', '📝 Prescription'], ['settings', '⚙️ Settings']];
const load = () => { try { return JSON.parse(localStorage.getItem('mr-settings')) || {}; } catch { return {}; } };

export default function App() {
  const [tab, setTab] = useState('rover');
  const [settings, setSettings] = useState({ ip: '', key: '', shop: '', beds: '4', feed: import.meta.env.VITE_ROBOT_FEED_URL || '', ...load() });
  const [speed, setSpeed] = useState(200);
  const [seq, setSeq] = useState([]);
  const [msg, setMsg] = useState('');

  // ---- location state ----
  const [mode, setMode] = useState('demo');
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState(null);
  const [liveState, setLiveState] = useState('idle');
  const [cmd, setCmd] = useState(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setT((v) => { const n = Math.min(1, v + 0.004); if (n >= 1) setRunning(false); return n; }), 100);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (mode !== 'live') return;
    if (!settings.feed) { setLiveState('error'); return; }
    setLive(null);
    return connectLive(settings.feed, setLive, setLiveState);
  }, [mode, settings.feed]);

  const demoPos = pointAt(t);
  const robot = mode === 'demo' ? demoPos : live && { lat: live.lat, lng: live.lng };
  const destination = mode === 'demo' ? DEMO_DESTINATION : live?.destination;
  const status = mode === 'demo' ? (t >= 1 ? 'Arrived (simulated)' : running ? 'En route (simulated)' : t === 0 ? 'Idle (simulated)' : 'Paused (simulated)') : live?.status || 'No data';

  const send = useCallback(async (c) => {
    if (!settings.ip) return setMsg('Set the ESP32 IP address in Settings first.');
    try { await fetch(`http://${settings.ip}/${c}?speed=${speed}&key=${encodeURIComponent(settings.key)}`, { mode: 'no-cors' }); setMsg(`Sent: ${c}`); }
    catch { setMsg('Could not reach the rover.'); }
  }, [settings, speed]);

  const save = () => { localStorage.setItem('mr-settings', JSON.stringify(settings)); setMsg('Settings saved.'); };
  const set = (k) => (e) => setSettings({ ...settings, [k]: e.target.value });
  const beds = Math.max(1, Math.min(12, parseInt(settings.beds) || 4));

  return (
    <div className="app">
      <header>
        <img src="/logo.jpg" alt="MediRover Logo" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <h1>MediRover</h1>
      </header>
      <nav>{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
      {msg && <div className="toast" onClick={() => setMsg('')}>{msg}</div>}

      {tab === 'rover' && <>
        <div className="grid">
          <section className="card">
            <h2>Rover Control</h2>
            <div className="dpad">
              <span /><button onClick={() => send('forward')}>▲</button><span />
              <button onClick={() => send('left')}>◀</button><button onClick={() => send('stop')}>◼</button><button onClick={() => send('right')}>▶</button>
              <span /><button onClick={() => send('backward')}>▼</button><span />
            </div>
            <label>Top Speed: {speed}<input type="range" min="50" max="255" value={speed} onChange={(e) => setSpeed(+e.target.value)} /></label>
          </section>
          <section className="card">
            <h2>Auto-Sequence Planner</h2>
            <p className="muted">{seq.length ? seq.join(' → ') : 'No steps recorded.'}</p>
            <div className="btns">
              {['forward', 'left', 'right', 'backward'].map((c) => <button key={c} onClick={() => setSeq([...seq, c])}>+ {c}</button>)}
            </div>
            <div className="btns">
              <button onClick={() => { localStorage.setItem('mr-seq', JSON.stringify(seq)); setMsg('Sequence saved.'); }}>Save Sequence</button>
              <button onClick={async () => { for (const c of seq) { await send(c); await new Promise((r) => setTimeout(r, 1000)); } }}>▶ Play Sequence</button>
              <button className="danger" onClick={() => { setSeq([]); send('stop'); }}>🛑 Stop Sequence</button>
            </div>
          </section>
        </div>

        <div className="modebar card">
          <span>Location source:</span>
          <button className={mode === 'demo' ? 'on' : ''} onClick={() => { setMode('demo'); setRunning(false); }}>Demo</button>
          <button className={mode === 'live' ? 'on' : ''} onClick={() => { setMode('live'); setRunning(false); }}>Live GPS</button>
          {mode === 'live' && <small className="muted">
            {liveState === 'connected' ? 'Connected' : liveState === 'connecting' ? 'Connecting…' : settings.feed ? 'Feed unavailable — no live data.' : 'No feed URL set (Settings). No GPS hardware connected, so nothing is tracked.'}
          </small>}
        </div>
        <RobotMap robot={robot} destination={destination} status={status} mode={mode}
          speed={mode === 'demo' ? DEMO_SPEED_MPS : live?.speed} running={running} cmd={cmd} setCmd={setCmd}
          onStart={() => { if (t >= 1) setT(0); setRunning(true); }} onPause={() => setRunning(false)} onReset={() => { setRunning(false); setT(0); }} />
      </>}

      {tab === 'patients' && <section className="card"><h2>Patient Monitoring</h2>
        <div className="beds">{Array.from({ length: beds }, (_, i) => <div key={i} className="bed"><b>Bed {i + 1}</b><small className="muted">No data</small></div>)}</div></section>}

      {tab === 'rx' && <section className="card"><h2>Issue Prescription</h2>
        <select><option>Select Patient...</option>{Array.from({ length: beds }, (_, i) => <option key={i}>Bed {i + 1}</option>)}</select>
        <textarea rows="5" placeholder="Prescription…" />
        <button onClick={() => setMsg('Telegram sending needs a bot backend — not configured.')}>Send to Telegram Bot</button></section>}

      {tab === 'settings' && <section className="card"><h2>System Settings</h2>
        <h4>Rover Connection</h4><p className="muted">Enter the ESP32 IP Address for the MediRover.</p><input value={settings.ip} onChange={set('ip')} placeholder="192.168.x.x" />
        <h4>Project Access Key</h4><p className="muted">Required to Access The Rover.</p><input type="password" value={settings.key} onChange={set('key')} />
        <h4>Medical Shop ID</h4><p className="muted">Enter Id To Get Your Medicine.</p><input value={settings.shop} onChange={set('shop')} />
        <h4>Patient Beds</h4><input type="number" min="1" max="12" value={settings.beds} onChange={set('beds')} />
        <h4>GPS Feed URL (optional)</h4><p className="muted">ws:// / wss:// WebSocket or http(s):// JSON endpoint for Live GPS.</p><input value={settings.feed} onChange={set('feed')} />
        <button onClick={save}>Save Settings</button></section>}

      <footer>© All rights reserved by NC Robotics</footer>
    </div>
  );
}
