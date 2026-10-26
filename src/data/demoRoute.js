// SIMULATED sample coordinates (not GPS readings from the robot).
export const DEMO_ROUTE = [
  { lat: 12.91650, lng: 79.13250 },
  { lat: 12.91700, lng: 79.13340 },
  { lat: 12.91780, lng: 79.13400 },
  { lat: 12.91870, lng: 79.13420 },
  { lat: 12.91950, lng: 79.13500 },
];
export const DEMO_DESTINATION = DEMO_ROUTE[DEMO_ROUTE.length - 1];
export const DEMO_SPEED_MPS = 1.0; // simulated speed

export function pointAt(t) {
  const n = DEMO_ROUTE.length - 1, x = Math.min(Math.max(t, 0), 1) * n;
  const i = Math.min(Math.floor(x), n - 1), f = x - i;
  const a = DEMO_ROUTE[i], b = DEMO_ROUTE[i + 1];
  return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
}
