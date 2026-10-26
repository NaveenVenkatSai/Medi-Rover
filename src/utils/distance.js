export const isValidCoord = (p) =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) &&
  Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;

// Haversine great-circle (straight-line) distance in metres
export function haversine(a, b) {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const formatDistance = (m) =>
  !Number.isFinite(m) ? '—' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
export const formatEta = (m, speedMps) =>
  !(speedMps > 0) || !Number.isFinite(m) ? null : `${Math.max(1, Math.round(m / speedMps / 60))} min`;
