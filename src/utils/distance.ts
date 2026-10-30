const earthRadiusKm = 6371;

export function distanceInKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number | null {
  if (
    !Number.isFinite(from.lat) ||
    !Number.isFinite(from.lng) ||
    !Number.isFinite(to.lat) ||
    !Number.isFinite(to.lng) ||
    Math.abs(from.lat) > 90 ||
    Math.abs(to.lat) > 90 ||
    Math.abs(from.lng) > 180 ||
    Math.abs(to.lng) > 180 ||
    (to.lat === 0 && to.lng === 0)
  ) {
    return null;
  }

  const radians = Math.PI / 180;
  const latitudeDifference = (to.lat - from.lat) * radians;
  const longitudeDifference = (to.lng - from.lng) * radians;
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(from.lat * radians) *
      Math.cos(to.lat * radians) *
      Math.sin(longitudeDifference / 2) ** 2;
  const boundedHaversine = Math.min(1, Math.max(0, haversine));
  return earthRadiusKm * 2 * Math.atan2(
    Math.sqrt(boundedHaversine),
    Math.sqrt(1 - boundedHaversine),
  );
}
