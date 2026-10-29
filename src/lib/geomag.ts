/**
 * Magnetic declination from the World Magnetic Model (WMM2025, valid 2025–2030).
 * Phone compasses point to magnetic north; adding the declination gives true north.
 * Coefficients: NOAA NCEI WMM.COF — g, h, ġ, ḣ (nT, nT/yr) for n = 1..12, m = 0..n.
 */

const EPOCH = 2025.0;
const N = 12;
// prettier-ignore
const COEF = [
  -29351.8,0.0,12.0,0.0,-1410.8,4545.4,9.7,-21.5,-2556.6,0.0,-11.6,0.0,2951.1,-3133.6,-5.2,-27.7,1649.3,-815.1,-8.0,-12.1,1361.0,0.0,-1.3,0.0,
  -2404.1,-56.6,-4.2,4.0,1243.8,237.5,0.4,-0.3,453.6,-549.5,-15.6,-4.1,895.0,0.0,-1.6,0.0,799.5,278.6,-2.4,-1.1,55.7,-133.9,-6.0,4.1,
  -281.1,212.0,5.6,1.6,12.1,-375.6,-7.0,-4.4,-233.2,0.0,0.6,0.0,368.9,45.4,1.4,-0.5,187.2,220.2,0.0,2.2,-138.7,-122.9,0.6,0.4,
  -142.0,43.0,2.2,1.7,20.9,106.1,0.9,1.9,64.4,0.0,-0.2,0.0,63.8,-18.4,-0.4,0.3,76.9,16.8,0.9,-1.6,-115.7,48.8,1.2,-0.4,
  -40.9,-59.8,-0.9,0.9,14.9,10.9,0.3,0.7,-60.7,72.7,0.9,0.9,79.5,0.0,-0.0,0.0,-77.0,-48.9,-0.1,0.6,-8.8,-14.4,-0.1,0.5,
  59.3,-1.0,0.5,-0.8,15.8,23.4,-0.1,0.0,2.5,-7.4,-0.8,-1.0,-11.1,-25.1,-0.8,0.6,14.2,-2.3,0.8,-0.2,23.2,0.0,-0.1,0.0,
  10.8,7.1,0.2,-0.2,-17.5,-12.6,0.0,0.5,2.0,11.4,0.5,-0.4,-21.7,-9.7,-0.1,0.4,16.9,12.7,0.3,-0.5,15.0,0.7,0.2,-0.6,
  -16.8,-5.2,-0.0,0.3,0.9,3.9,0.2,0.2,4.6,0.0,-0.0,0.0,7.8,-24.8,-0.1,-0.3,3.0,12.2,0.1,0.3,-0.2,8.3,0.3,-0.3,
  -2.5,-3.3,-0.3,0.3,-13.1,-5.2,0.0,0.2,2.4,7.2,0.3,-0.1,8.6,-0.6,-0.1,-0.2,-8.7,0.8,0.1,0.4,-12.9,10.0,-0.1,0.1,
  -1.3,0.0,0.1,0.0,-6.4,3.3,0.0,0.0,0.2,0.0,0.1,-0.0,2.0,2.4,0.1,-0.2,-1.0,5.3,-0.0,0.1,-0.6,-9.1,-0.3,-0.1,
  -0.9,0.4,0.0,0.1,1.5,-4.2,-0.1,0.0,0.9,-3.8,-0.1,-0.1,-2.7,0.9,-0.0,0.2,-3.9,-9.1,-0.0,-0.0,2.9,0.0,0.0,0.0,
  -1.5,0.0,-0.0,-0.0,-2.5,2.9,0.0,0.1,2.4,-0.6,0.0,-0.0,-0.6,0.2,0.0,0.1,-0.1,0.5,-0.1,-0.0,-0.6,-0.3,0.0,-0.0,
  -0.1,-1.2,-0.0,0.1,1.1,-1.7,-0.1,-0.0,-1.0,-2.9,-0.1,0.0,-0.2,-1.8,-0.1,0.0,2.6,-2.3,-0.1,0.0,-2.0,0.0,0.0,0.0,
  -0.2,-1.3,0.0,-0.0,0.3,0.7,-0.0,0.0,1.2,1.0,-0.0,-0.1,-1.3,-1.4,-0.0,0.1,0.6,-0.0,-0.0,-0.0,0.6,0.6,0.1,-0.0,
  0.5,-0.1,-0.0,-0.0,-0.1,0.8,0.0,0.0,-0.4,0.1,0.0,-0.0,-0.2,-1.0,-0.1,-0.0,-1.3,0.1,-0.0,0.0,-0.7,0.2,-0.1,-0.1,
];

const A = 6378.137; // WGS-84 semi-major axis, km
const F = 1 / 298.257223563;
const E2 = F * (2 - F);
const RE = 6371.2; // geomagnetic reference radius, km

const rad = (d: number) => (d * Math.PI) / 180;

/** Schmidt semi-normalisation factors, applied once to the coefficients */
const SCHMIDT = (() => {
  const s: number[][] = [[1]];
  for (let n = 1; n <= N; n++) {
    s[n] = [s[n - 1][0] * (2 * n - 1) / n];
    for (let m = 1; m <= n; m++) s[n][m] = s[n][m - 1] * Math.sqrt(((n - m + 1) * (m === 1 ? 2 : 1)) / (n + m));
  }
  return s;
})();

function decimalYear(d: Date) {
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1), end = Date.UTC(y + 1, 0, 1);
  return y + (d.getTime() - start) / (end - start);
}

/** Declination in degrees, east positive. `altKm` is height above the WGS-84 ellipsoid. */
export function magneticDeclination(lat: number, lng: number, date = new Date(), altKm = 0) {
  const t = decimalYear(date) - EPOCH;
  const φ = rad(lat), λ = rad(lng);

  // geodetic → geocentric spherical
  const sinφ = Math.sin(φ), cosφ = Math.cos(φ);
  const rc = A / Math.sqrt(1 - E2 * sinφ * sinφ);
  const p = (rc + altKm) * cosφ, z = (rc * (1 - E2) + altKm) * sinφ;
  const r = Math.hypot(p, z);
  const φc = Math.asin(z / r);
  const ct = Math.sin(φc), st = Math.cos(φc); // cos/sin of colatitude

  // associated Legendre functions P(n,m) and dP/dθ (Gauss normalised)
  const P: number[][] = [[1]], dP: number[][] = [[0]];
  for (let n = 1; n <= N; n++) {
    P[n] = []; dP[n] = [];
    for (let m = 0; m <= n; m++) {
      if (n === m) {
        P[n][m] = st * P[n - 1][m - 1];
        dP[n][m] = st * dP[n - 1][m - 1] + ct * P[n - 1][m - 1];
      } else {
        const k = n > 1 ? ((n - 1) ** 2 - m * m) / ((2 * n - 1) * (2 * n - 3)) : 0;
        const p2 = n > 1 && m <= n - 2 ? P[n - 2][m] : 0;
        const d2 = n > 1 && m <= n - 2 ? dP[n - 2][m] : 0;
        P[n][m] = ct * P[n - 1][m] - k * p2;
        dP[n][m] = ct * dP[n - 1][m] - st * P[n - 1][m] - k * d2;
      }
    }
  }

  let x = 0, y = 0, zc = 0, i = 0;
  const ar = RE / r;
  for (let n = 1; n <= N; n++) {
    const arn = ar ** (n + 2);
    for (let m = 0; m <= n; m++, i += 4) {
      const g = (COEF[i] + t * COEF[i + 2]) * SCHMIDT[n][m];
      const h = (COEF[i + 1] + t * COEF[i + 3]) * SCHMIDT[n][m];
      const cm = Math.cos(m * λ), sm = Math.sin(m * λ);
      x += arn * (g * cm + h * sm) * dP[n][m];
      y += arn * m * (g * sm - h * cm) * P[n][m];
      zc -= arn * (n + 1) * (g * cm + h * sm) * P[n][m];
    }
  }
  y /= st;

  // rotate the north component back to the geodetic frame
  const ψ = φc - φ;
  const xg = x * Math.cos(ψ) - zc * Math.sin(ψ);
  return (Math.atan2(y, xg) * 180) / Math.PI;
}
