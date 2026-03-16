import type { Principal } from "@icp-sdk/core/principal";

export const nsToDate = (ns: bigint): Date => new Date(Number(ns / 1_000_000n));

export const formatTime = (ns: bigint): string =>
  nsToDate(ns).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const formatDate = (ns: bigint): string =>
  nsToDate(ns).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const formatDateTime = (ns: bigint): string =>
  `${formatDate(ns)} ${formatTime(ns)}`;

export const shortPrincipal = (p: Principal): string => {
  const s = p.toString();
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-5)}` : s;
};

export const nowNs = (): bigint => BigInt(Date.now()) * 1_000_000n;

export const daysAgoNs = (days: number): bigint =>
  nowNs() - BigInt(days * 24 * 60 * 60 * 1000) * 1_000_000n;

export const getGeolocation = (): Promise<GeolocationCoordinates> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(new Error(`Location error: ${err.message}`)),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
