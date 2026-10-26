# MediRover (rebuild + live map)

Rebuilt from the **publicly visible structure** of https://medirover-nc.vercel.app/ (original source was not available).
Sections kept: Rover Control, Auto-Sequence Planner, Patient Monitoring, Issue Prescription, System Settings, Patient Beds.
New: interactive Leaflet/OpenStreetMap map (Demo + Live modes).

## Run
    npm install
    npm run dev      # http://localhost:5173
    npm run build    # production build in dist/

## Live GPS
Settings -> GPS Feed URL: a `ws://`/`wss://` WebSocket or `http(s)://` JSON endpoint sending
`{ "lat": 12.9, "lng": 79.1, "timestamp": "ISO", "status": "En route", "destination": {"lat":..,"lng":..}, "speed": 1.0 }`.
No GPS hardware is known to exist; until a feed is connected, Live mode shows "no data". Demo Mode is always simulated.
The straight-line distance is Haversine, not a navigable route.

## Known assumptions (verify against your original)
- Colors/fonts are a dark theme guess; the page's CSS could not be read.
- Rover commands call `http://<ESP32-IP>/<forward|left|right|backward|stop>?speed=..&key=..` — adjust endpoints in `App.jsx` `send()` to your firmware. (Browsers block http:// calls from the https Vercel site as mixed content; use a local run or HTTPS proxy.)
- Place your `logo.jpg` in `public/`.

## Deploy to Vercel
    git init && git add . && git commit -m "MediRover"
    git remote add origin <your-repo-url> && git push -u origin main
Then Vercel -> Add New Project -> import repo -> Framework: Vite -> Deploy.
