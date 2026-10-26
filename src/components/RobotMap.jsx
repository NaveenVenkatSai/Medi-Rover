import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { isValidCoord, haversine, formatDistance, formatEta } from '../utils/distance.js';

const robotIcon = L.divIcon({ className: 'mk', html: '<div class="mk-robot">🤖</div>', iconSize: [38, 38], iconAnchor: [19, 19] });
const destIcon = L.divIcon({ className: 'mk', html: '<div class="mk-dest">🏥</div>', iconSize: [34, 34], iconAnchor: [17, 17] });
const ll = (p) => [p.lat, p.lng];

function View({ robot, destination, cmd }) {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 0); }, [map]);
  useEffect(() => {
    if (!cmd) return;
    if (cmd.type === 'center' && isValidCoord(robot)) map.setView(ll(robot), Math.max(map.getZoom(), 17));
    if (cmd.type === 'fit') {
      const pts = [robot, destination].filter(isValidCoord).map(ll);
      if (pts.length) map.fitBounds(pts, { padding: [50, 50], maxZoom: 18 });
    }
  }, [cmd]); // eslint-disable-line
  return null;
}

export default function RobotMap(p) {
  const { robot, destination, status, mode, speed, running, cmd, setCmd, onStart, onPause, onReset } = p;
  const hasRobot = isValidCoord(robot), hasDest = isValidCoord(destination);
  const dist = hasRobot && hasDest ? haversine(robot, destination) : NaN;
  const eta = formatEta(dist, speed);
  const fmt = (q) => (isValidCoord(q) ? `${q.lat.toFixed(5)}, ${q.lng.toFixed(5)}` : 'No GPS data');
  const center = hasRobot ? ll(robot) : hasDest ? ll(destination) : [12.9165, 79.1325];

  return (
    <div className="card">
      <div className="map-head">
        <h2>Live Map</h2>
        <span className={'badge ' + (mode === 'demo' ? 'demo' : 'live')}>{mode === 'demo' ? 'DEMO MODE – simulated data' : 'LIVE'}</span>
      </div>
      <div className="map-wrap">
        <MapContainer center={center} zoom={17} zoomControl scrollWheelZoom className="map">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <View robot={robot} destination={destination} cmd={cmd} />
          {hasRobot && hasDest && <Polyline positions={[ll(robot), ll(destination)]} pathOptions={{ color: '#00d4ff', weight: 4, dashArray: '8 8' }} />}
          {hasDest && <Marker position={ll(destination)} icon={destIcon}><Popup><b>Destination</b><br />{fmt(destination)}</Popup></Marker>}
          {hasRobot && <Marker position={ll(robot)} icon={robotIcon}><Popup><b>MediRover</b><br />Status: {status}<br />{fmt(robot)}{mode === 'demo' && <><br /><i>Simulated position</i></>}</Popup></Marker>}
        </MapContainer>
        {!hasRobot && <div className="overlay">Waiting for GPS data… the robot has not reported a valid position.</div>}
        <div className="legend">
          <div><span className="lg">🤖</span> Robot</div>
          <div><span className="lg">🏥</span> Destination</div>
          <div><span className="lg dash" /> Straight-line (not a navigable route)</div>
        </div>
      </div>
      <div className="btns">
        <button onClick={() => setCmd({ type: 'center', n: Date.now() })}>🎯 Center on robot</button>
        <button onClick={() => setCmd({ type: 'fit', n: Date.now() })}>🗺️ Fit route</button>
        {mode === 'demo' && <>
          <button onClick={onStart} disabled={running}>▶ Start</button>
          <button onClick={onPause} disabled={!running}>⏸ Pause</button>
          <button onClick={onReset}>↺ Reset</button>
        </>}
      </div>
      <div className="stats">
        <div><small>Position</small><b>{fmt(robot)}</b></div>
        <div><small>Destination</small><b>{fmt(destination)}</b></div>
        <div><small>Straight-line distance left</small><b>{formatDistance(dist)}</b></div>
        <div><small>Status</small><b>{status}</b></div>
        {eta && <div><small>ETA (straight-line, est.)</small><b>{eta}</b></div>}
      </div>
    </div>
  );
}
