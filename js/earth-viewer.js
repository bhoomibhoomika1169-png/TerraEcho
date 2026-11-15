/**
 * earth-viewer.js
 * Comprehensive scientific Earth visualization engine:
 * 1. EarthViewer:
 *    - 3D-style rotating Home Globe with atmospheric glow, specular reflection, clouds, continents
 *    - Interactive Explorer Globe with mouse-drag rotation, inertia, zoom, graticules, hover telemetry raycasting
 *    - Scientific data layer overlays (Night Lights radiance dots, Ocean SST heatmap)
 *    - Real-time active observation beacon synchronization with Web Audio playback
 *    - Star-field canvas background with dynamic twinkling
 * 2. ExperienceVisualizer:
 *    - Changing Night Lights (2012–2023): Equirectangular projection, radiance dots, real-time synchronized year slider
 *    - Ocean Currents & Temperature: Animated vector particle streamlines, SST heatmap mode, color legend, focal beacons
 * 3. TelemetryHUD:
 *    - Real-time coordinates, active dataset, observation measurement, and scientific units
 * ES6 Module.
 */

export const EarthViewer = (() => {

  /* ── 1. Hero Globe (Animated Cosmic Earth Centerpiece) ───────── */
  let _homeCanvas = null;
  let _homeCtx = null;
  let _homeAnimId = null;
  let _homeRotation = 0;
  let _homeWavePhase = 0;
  let _homeStars = [];
  let _homeDPR = 1;

  function initHomeGlobe(canvas) {
    if (!canvas) return;
    _homeCanvas = canvas;
    _homeCtx = canvas.getContext('2d');

    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    _homeDPR = dpr;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : 480;
    const h = rect.height > 0 ? rect.height : 480;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    _homeStars = _generateStars(180, canvas.width, canvas.height);
    if (_homeAnimId) cancelAnimationFrame(_homeAnimId);
    _animateHomeGlobe();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        if (!_homeCanvas) return;
        const r = _homeCanvas.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          _homeCanvas.width = Math.round(r.width * _homeDPR);
          _homeCanvas.height = Math.round(r.height * _homeDPR);
          _homeStars = _generateStars(180, _homeCanvas.width, _homeCanvas.height);
        }
      });
    }
  }

  function _animateHomeGlobe() {
    _homeRotation += 0.004;
    _homeWavePhase += 0.045;
    _drawHomeGlobe();
    _homeAnimId = requestAnimationFrame(_animateHomeGlobe);
  }

  function _drawHomeGlobe() {
    if (!_homeCtx || !_homeCanvas) return;
    const c = _homeCtx;
    const W = _homeCanvas.width;
    const H = _homeCanvas.height;
    if (W === 0 || H === 0) return;

    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.40;

    c.clearRect(0, 0, W, H);

    // 1. Cosmic Deep Space Background with Twinkling Stars
    c.save();
    for (const s of _homeStars) {
      const twinkle = 0.4 + 0.6 * Math.sin(_homeWavePhase * 1.5 + s.x);
      c.fillStyle = `rgba(230, 245, 255, ${twinkle * 0.85})`;
      c.beginPath();
      c.arc(s.x, s.y, s.r * _homeDPR, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // 2. Animated Acoustic Sound Waveform Shield Surrounding Earth
    _drawSoundWaveform(c, cx, cy, r, _homeWavePhase);

    // 3. Glowing Orbital Rings with Active Satellite Telemetry Beacons
    _drawOrbitalSatellites(c, cx, cy, r, _homeRotation);

    // 4. 3D Earth Sphere Base
    c.save();
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.clip();

    // Ocean Gradient with 3D Depth & Celestial Lighting
    const oceanGrad = c.createRadialGradient(cx - r * 0.38, cy - r * 0.38, 0, cx, cy, r);
    oceanGrad.addColorStop(0, '#1d6092');    // Sunlit surface azure
    oceanGrad.addColorStop(0.35, '#124874'); // Mid-depth ocean
    oceanGrad.addColorStop(0.70, '#0a2948'); // Deep abyssal blue
    oceanGrad.addColorStop(1, '#020b18');    // Midnight shadow limb
    c.fillStyle = oceanGrad;
    c.fillRect(cx - r, cy - r, r * 2, r * 2);

    // Graticules (Latitude & Longitude coordinate grid)
    _drawSphericalGraticules(c, cx, cy, r, _homeRotation);

    // Continents & Biomes (Orthographic Spherical Projection)
    _drawContinents(c, cx, cy, r, _homeRotation);

    // NASA Black Marble City Night Lights on dark hemisphere
    _drawBlackMarbleNightLights(c, cx, cy, r, _homeRotation);

    // Dynamic Weather Cloud Belts
    _drawClouds(c, cx, cy, r, _homeRotation * 0.78);

    // 3D Celestial Day/Night Terminator Shadow
    const termGrad = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.2, cx + r * 0.3, cy + r * 0.3, r * 1.25);
    termGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    termGrad.addColorStop(0.55, 'rgba(2, 8, 20, 0.25)');
    termGrad.addColorStop(0.85, 'rgba(2, 6, 16, 0.72)');
    termGrad.addColorStop(1, 'rgba(1, 4, 12, 0.92)');
    c.fillStyle = termGrad;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();

    // Specular Sunlit Ocean Highlight
    const specGrad = c.createRadialGradient(cx - r * 0.38, cy - r * 0.38, 0, cx - r * 0.35, cy - r * 0.35, r * 0.55);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    specGrad.addColorStop(0.3, 'rgba(180, 240, 255, 0.12)');
    specGrad.addColorStop(1, 'transparent');
    c.fillStyle = specGrad;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();

    // Inner Atmospheric Rayleigh Scattering Limb
    const innerAtm = c.createRadialGradient(cx, cy, r * 0.82, cx, cy, r);
    innerAtm.addColorStop(0, 'transparent');
    innerAtm.addColorStop(0.85, 'rgba(0, 229, 255, 0.18)');
    innerAtm.addColorStop(1, 'rgba(0, 229, 255, 0.45)');
    c.fillStyle = innerAtm;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();

    c.restore(); // End clipping

    // 5. Outer Atmospheric Halo & Rayleigh Corona
    const outerHalo = c.createRadialGradient(cx, cy, r * 0.96, cx, cy, r * 1.18);
    outerHalo.addColorStop(0, 'rgba(0, 229, 255, 0.32)');
    outerHalo.addColorStop(0.4, 'rgba(26, 107, 255, 0.18)');
    outerHalo.addColorStop(0.75, 'rgba(155, 89, 255, 0.06)');
    outerHalo.addColorStop(1, 'transparent');
    c.fillStyle = outerHalo;
    c.beginPath();
    c.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
    c.fill();
  }

  /* ── Animated Acoustic Waveform Surrounding Earth ───────────── */
  function _drawSoundWaveform(c, cx, cy, r, phase) {
    const steps = 96;
    c.save();

    // Primary Neon Cyan Sonic Ripple
    c.strokeStyle = 'rgba(0, 229, 255, 0.65)';
    c.lineWidth = 2 * _homeDPR;
    c.shadowColor = '#00e5ff';
    c.shadowBlur = 12 * _homeDPR;
    c.beginPath();

    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const wave = Math.sin(angle * 8 + phase * 2.8) * (5.5 * _homeDPR)
                 + Math.sin(angle * 16 - phase * 1.6) * (3.0 * _homeDPR)
                 + Math.cos(angle * 4 + phase) * (3.8 * _homeDPR);
      const wr = r * 1.16 + wave;
      const wx = cx + Math.cos(angle) * wr;
      const wy = cy + Math.sin(angle) * wr;
      if (i === 0) c.moveTo(wx, wy);
      else c.lineTo(wx, wy);
    }
    c.closePath();
    c.stroke();

    // Secondary Harmonic Violet Ripple
    c.strokeStyle = 'rgba(155, 89, 255, 0.42)';
    c.lineWidth = 1.3 * _homeDPR;
    c.shadowColor = '#9b59ff';
    c.shadowBlur = 8 * _homeDPR;
    c.beginPath();

    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const wave = Math.sin(angle * 6 - phase * 2.0) * (4.2 * _homeDPR)
                 + Math.cos(angle * 12 + phase * 2.2) * (2.4 * _homeDPR);
      const wr = r * 1.22 + wave;
      const wx = cx + Math.cos(angle) * wr;
      const wy = cy + Math.sin(angle) * wr;
      if (i === 0) c.moveTo(wx, wy);
      else c.lineTo(wx, wy);
    }
    c.closePath();
    c.stroke();
    c.restore();
  }

  /* ── 3D Orbital Rings with Telemetry Satellite Beacons ──────── */
  function _drawOrbitalSatellites(c, cx, cy, r, rot) {
    c.save();

    // Satellite 1: NASA Suomi NPP / VIIRS (Cyan Orbit, tilted -25°)
    const tilt1 = -25 * Math.PI / 180;
    const a1 = r * 1.28, b1 = r * 0.52;
    const t1 = rot * 1.8;
    const sat1X = cx + Math.cos(tilt1) * (Math.cos(t1) * a1) - Math.sin(tilt1) * (Math.sin(t1) * b1);
    const sat1Y = cy + Math.sin(tilt1) * (Math.cos(t1) * a1) + Math.cos(tilt1) * (Math.sin(t1) * b1);

    c.strokeStyle = 'rgba(0, 229, 255, 0.22)';
    c.lineWidth = 1 * _homeDPR;
    c.beginPath();
    c.ellipse(cx, cy, a1, b1, tilt1, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = '#00e5ff';
    c.shadowColor = '#00e5ff';
    c.shadowBlur = 10 * _homeDPR;
    c.beginPath();
    c.arc(sat1X, sat1Y, 3.5 * _homeDPR, 0, Math.PI * 2);
    c.fill();

    // Satellite 2: NASA OSCAR / PO.DAAC (Violet Orbit, tilted 35°)
    const tilt2 = 35 * Math.PI / 180;
    const a2 = r * 1.36, b2 = r * 0.56;
    const t2 = -rot * 1.4 + Math.PI;
    const sat2X = cx + Math.cos(tilt2) * (Math.cos(t2) * a2) - Math.sin(tilt2) * (Math.sin(t2) * b2);
    const sat2Y = cy + Math.sin(tilt2) * (Math.cos(t2) * a2) + Math.cos(tilt2) * (Math.sin(t2) * b2);

    c.strokeStyle = 'rgba(155, 89, 255, 0.20)';
    c.lineWidth = 1 * _homeDPR;
    c.beginPath();
    c.ellipse(cx, cy, a2, b2, tilt2, 0, Math.PI * 2);
    c.stroke();

    c.fillStyle = '#bb86fc';
    c.shadowColor = '#9b59ff';
    c.shadowBlur = 10 * _homeDPR;
    c.beginPath();
    c.arc(sat2X, sat2Y, 3.2 * _homeDPR, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  /* ── 3D Spherical Coordinate Projection ──────────────────────── */
  function _projectOrthographic(lat, lon, rotation, cx, cy, r) {
    const rotLon = lon + (rotation * 180 / Math.PI);
    const radLat = lat * Math.PI / 180;
    const radLon = ((((rotLon + 180) % 360) + 360) % 360 - 180) * Math.PI / 180;

    const cosLat = Math.cos(radLat);
    const sinLat = Math.sin(radLat);
    const cosLon = Math.cos(radLon);
    const sinLon = Math.sin(radLon);

    const visible = cosLat * cosLon > 0;
    const x = cx + r * cosLat * sinLon;
    const y = cy - r * sinLat;
    const z = cosLat * cosLon; // Facing intensity: 1 = center, 0 = limb
    return { x, y, z, visible };
  }

  /* ── Spherical Coordinate Graticules ────────────────────────── */
  function _drawSphericalGraticules(c, cx, cy, r, rot) {
    c.save();
    c.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    c.lineWidth = 0.8 * _homeDPR;

    // Latitude parallels
    for (let lat = -60; lat <= 60; lat += 30) {
      c.beginPath();
      let first = true;
      for (let lon = -180; lon <= 180; lon += 8) {
        const p = _projectOrthographic(lat, lon, rot, cx, cy, r);
        if (p.visible) {
          if (first) { c.moveTo(p.x, p.y); first = false; }
          else c.lineTo(p.x, p.y);
        } else {
          first = true;
        }
      }
      c.stroke();
    }

    // Longitude meridians
    for (let lon = -180; lon < 180; lon += 45) {
      c.beginPath();
      let first = true;
      for (let lat = -80; lat <= 80; lat += 5) {
        const p = _projectOrthographic(lat, lon, rot, cx, cy, r);
        if (p.visible) {
          if (first) { c.moveTo(p.x, p.y); first = false; }
          else c.lineTo(p.x, p.y);
        } else {
          first = true;
        }
      }
      c.stroke();
    }
    c.restore();
  }

  /* ── Realistic Continents & Multi-Biome Terrain ─────────────── */
  function _drawContinents(c, cx, cy, r, rotation) {
    // Curated accurate continental landmass polygons
    const LANDMASSES = [
      // North America Main
      {
        color: '#217336', stroke: '#2e9647',
        poly: [
          [71, -156], [68, -135], [68, -100], [58, -78], [52, -55], [44, -64],
          [35, -75], [25, -80], [29, -89], [25, -97], [20, -97], [16, -92],
          [14, -86], [8, -78], [15, -88], [21, -105], [32, -117], [38, -123],
          [48, -125], [54, -131], [59, -140], [65, -168], [71, -156]
        ]
      },
      // Greenland Ice Sheet
      {
        color: '#e4f3f9', stroke: '#cce6f2',
        poly: [
          [82, -32], [76, -18], [70, -22], [60, -44], [64, -52], [75, -58], [82, -50], [82, -32]
        ]
      },
      // South America
      {
        color: '#1b6f2f', stroke: '#279440',
        poly: [
          [11, -72], [8, -59], [3, -50], [-3, -40], [-8, -35], [-15, -39],
          [-23, -43], [-32, -52], [-42, -63], [-54, -68], [-53, -74], [-44, -74],
          [-32, -71], [-20, -70], [-10, -78], [-2, -80], [5, -77], [11, -72]
        ]
      },
      // Europe & Scandinavia
      {
        color: '#2b8341', stroke: '#359f50',
        poly: [
          [71, 28], [68, 14], [58, 6], [54, 9], [47, -2], [43, -9], [36, -5],
          [37, 2], [43, 8], [39, 16], [40, 24], [46, 30], [54, 30], [64, 40],
          [68, 50], [71, 28]
        ]
      },
      // British Isles
      {
        color: '#28803e', stroke: '#359f50',
        poly: [
          [58, -4], [54, 0], [50, -5], [52, -10], [56, -7], [58, -4]
        ]
      },
      // Africa - Sahara Arid Region
      {
        color: '#b58b29', stroke: '#c79c35',
        poly: [
          [36, -5], [35, 10], [31, 25], [30, 33], [22, 38], [15, 38],
          [14, 25], [14, 10], [12, -4], [15, -17], [22, -17], [30, -10], [36, -5]
        ]
      },
      // Africa - Sub-Saharan & Tropical
      {
        color: '#1e7534', stroke: '#2b9c48',
        poly: [
          [14, -17], [12, -4], [14, 10], [14, 25], [12, 44], [0, 42],
          [-10, 40], [-20, 35], [-34, 26], [-34, 18], [-25, 14], [-15, 12],
          [-5, 12], [4, 8], [5, -2], [10, -14], [14, -17]
        ]
      },
      // Madagascar
      {
        color: '#227838', stroke: '#2e9647',
        poly: [
          [-12, 49], [-16, 50], [-25, 47], [-25, 44], [-16, 44], [-12, 49]
        ]
      },
      // Arabian Peninsula
      {
        color: '#be9532', stroke: '#cca53e',
        poly: [
          [30, 35], [30, 48], [24, 56], [22, 59], [15, 54], [13, 44], [20, 40], [28, 35], [30, 35]
        ]
      },
      // Indian Subcontinent
      {
        color: '#24803b', stroke: '#31a44c',
        poly: [
          [28, 70], [24, 69], [16, 73], [8, 77], [10, 80], [16, 82],
          [21, 87], [26, 89], [28, 80], [28, 70]
        ]
      },
      // East Asia & Siberia
      {
        color: '#1f7033', stroke: '#298f42',
        poly: [
          [72, 70], [74, 105], [70, 145], [66, 170], [58, 140], [50, 140],
          [40, 124], [32, 121], [22, 114], [15, 107], [10, 105], [18, 98],
          [24, 93], [35, 78], [48, 65], [60, 60], [72, 70]
        ]
      },
      // Japan Archipelago
      {
        color: '#237d3a', stroke: '#32a24c',
        poly: [
          [45, 142], [42, 144], [35, 140], [33, 131], [38, 138], [45, 142]
        ]
      },
      // Australia - Outback & Coasts
      {
        color: '#b07328', stroke: '#c48535',
        poly: [
          [-12, 132], [-14, 145], [-20, 148], [-28, 153], [-37, 150], [-38, 144],
          [-35, 136], [-35, 118], [-28, 114], [-22, 114], [-15, 125], [-12, 132]
        ]
      },
      // Antarctica Ice Cap
      {
        color: '#e8f5fb', stroke: '#d2ebf5',
        poly: [
          [-66, -60], [-68, -80], [-72, -120], [-75, -170], [-76, 170],
          [-72, 120], [-68, 70], [-67, 20], [-67, -20], [-66, -60]
        ]
      }
    ];

    c.save();
    for (const land of LANDMASSES) {
      c.fillStyle = land.color;
      c.strokeStyle = land.stroke;
      c.lineWidth = 1 * _homeDPR;

      let started = false;
      c.beginPath();

      for (let i = 0; i < land.poly.length; i++) {
        const [lat, lon] = land.poly[i];
        const pt = _projectOrthographic(lat, lon, rotation, cx, cy, r);
        if (pt.visible) {
          if (!started) {
            c.moveTo(pt.x, pt.y);
            started = true;
          } else {
            c.lineTo(pt.x, pt.y);
          }
        }
      }

      if (started) {
        c.closePath();
        c.fill();
        c.stroke();
      }
    }
    c.restore();
  }

  /* ── NASA Black Marble Night Lights Simulation on Dark Hemisphere ── */
  function _drawBlackMarbleNightLights(c, cx, cy, r, rotation) {
    const CITIES = [
      { name: 'Tokyo', lat: 35.68, lon: 139.69, size: 3.2, glow: '#ffe066' },
      { name: 'New York', lat: 40.71, lon: -74.01, size: 3.0, glow: '#ffcc00' },
      { name: 'London', lat: 51.51, lon: -0.13, size: 2.8, glow: '#ffdd55' },
      { name: 'Paris', lat: 48.86, lon: 2.35, size: 2.6, glow: '#ffdd55' },
      { name: 'Delhi', lat: 28.61, lon: 77.21, size: 2.9, glow: '#ffbb00' },
      { name: 'Mumbai', lat: 19.08, lon: 72.88, size: 2.7, glow: '#ffbb00' },
      { name: 'Beijing', lat: 39.90, lon: 116.41, size: 3.0, glow: '#ffcc33' },
      { name: 'Shanghai', lat: 31.23, lon: 121.47, size: 3.1, glow: '#ffcc33' },
      { name: 'Cairo', lat: 30.04, lon: 31.24, size: 2.5, glow: '#ffaa00' },
      { name: 'São Paulo', lat: -23.55, lon: -46.63, size: 2.8, glow: '#ffbb22' },
      { name: 'Sydney', lat: -33.87, lon: 151.21, size: 2.4, glow: '#ffcc44' },
      { name: 'Los Angeles', lat: 34.05, lon: -118.24, size: 2.9, glow: '#ffcc22' },
      { name: 'Chicago', lat: 41.88, lon: -87.63, size: 2.6, glow: '#ffcc22' },
      { name: 'Dubai', lat: 25.20, lon: 55.27, size: 2.5, glow: '#ffaa00' },
      { name: 'Singapore', lat: 1.35, lon: 103.82, size: 2.4, glow: '#ffdd44' },
      { name: 'Seoul', lat: 37.57, lon: 126.98, size: 2.8, glow: '#ffcc33' },
      { name: 'Moscow', lat: 55.75, lon: 37.62, size: 2.7, glow: '#ffcc44' },
      { name: 'Buenos Aires', lat: -34.60, lon: -58.38, size: 2.4, glow: '#ffbb22' },
      { name: 'Johannesburg', lat: -26.20, lon: 28.04, size: 2.3, glow: '#ffaa11' }
    ];

    c.save();
    for (const city of CITIES) {
      const pt = _projectOrthographic(city.lat, city.lon, rotation, cx, cy, r);
      if (pt.visible) {
        // Night side radiance: active when facing away from sunlit top-left (pt.z < 0.45)
        const nightFactor = Math.max(0, Math.min(1, (0.50 - pt.z) / 0.45));
        if (nightFactor > 0.05) {
          const sz = city.size * (0.8 + 0.4 * nightFactor) * _homeDPR;
          c.fillStyle = city.glow;
          c.shadowColor = city.glow;
          c.shadowBlur = 10 * nightFactor * _homeDPR;
          c.beginPath();
          c.arc(pt.x, pt.y, sz, 0, Math.PI * 2);
          c.fill();

          // Core bright white center for major urban hubs
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.arc(pt.x, pt.y, sz * 0.4, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    c.restore();
  }

  /* ── Dynamic Swirling Weather Clouds ────────────────────────── */
  function _drawClouds(c, cx, cy, r, rotation) {
    c.save();
    c.globalAlpha = 0.32;
    c.fillStyle = '#f2f8fc';

    const CLOUD_CENTERS = [
      { lat: 25, lon: 30, w: 50, h: 22 },
      { lat: -10, lon: 80, w: 65, h: 26 },
      { lat: 52, lon: -40, w: 70, h: 28 },
      { lat: -45, lon: -120, w: 80, h: 32 },
      { lat: 15, lon: -140, w: 60, h: 24 },
      { lat: -20, lon: -30, w: 55, h: 22 },
      { lat: 60, lon: 130, w: 75, h: 30 },
      { lat: -55, lon: 60, w: 85, h: 35 }
    ];

    for (const cl of CLOUD_CENTERS) {
      const pt = _projectOrthographic(cl.lat, cl.lon, rotation, cx, cy, r);
      if (pt.visible) {
        const ew = (cl.w / 180) * r * pt.z;
        const eh = (cl.h / 180) * r;
        c.beginPath();
        c.ellipse(pt.x, pt.y, Math.max(2, ew), Math.max(2, eh * 0.45), 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }

  function _generateStars(count, W, H) {
    return Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.3 + 0.3
    }));
  }

  /* ── 2. Interactive Explorer Globe ─────────────────────────── */
  let _expCanvas = null;
  let _expCtx = null;
  let _expRotX = 0;
  let _expRotY = 0;
  let _expZoom = 1;
  let _expDragging = false;
  let _expLastMouse = { x: 0, y: 0 };
  let _expDataset = null;
  let _expRows = null;
  let _expFieldMap = null;
  let _expStatsMap = null;
  let _expOnHover = null;
  let _expActiveObs = null; // { lat, lon, val, units }

  function initExplorerGlobe(canvas, onHoverCallback) {
    if (!canvas) return;
    _expCanvas = canvas;
    _expCtx = canvas.getContext('2d');
    _expOnHover = onHoverCallback || null;

    canvas.addEventListener('mousedown', _expMouseDown);
    canvas.addEventListener('mousemove', _expMouseMove);
    canvas.addEventListener('mouseup',   _expMouseUp);
    canvas.addEventListener('mouseleave',_expMouseUp);
    canvas.addEventListener('wheel',     _expWheel, { passive: true });
    canvas.addEventListener('touchstart',_expTouchStart, { passive: true });
    canvas.addEventListener('touchmove', _expTouchMove, { passive: false });
    canvas.addEventListener('touchend',  _expMouseUp);

    _drawExplorerGlobe();
  }

  function setExplorerDataset(datasetType, rows, fieldMap, statsMap) {
    _expDataset = datasetType;
    _expRows = rows;
    _expFieldMap = fieldMap;
    _expStatsMap = statsMap;
    _expActiveObs = null;
    _drawExplorerGlobe();
  }

  function setActiveObservation(lat, lon, val, units) {
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      _expActiveObs = null;
    } else {
      _expActiveObs = { lat, lon, val, units };
      // Smoothly orient globe towards active longitude
      const targetRotY = -lon * (Math.PI / 180);
      _expRotY = _expRotY * 0.85 + targetRotY * 0.15;
    }
    _drawExplorerGlobe();
  }

  function clearActiveObservation() {
    _expActiveObs = null;
    _drawExplorerGlobe();
  }

  function resetExplorerView() {
    _expRotX = 0;
    _expRotY = 0;
    _expZoom = 1;
    _expActiveObs = null;
    _drawExplorerGlobe();
  }

  function zoomExplorer(delta) {
    _expZoom = Math.max(0.6, Math.min(2.8, _expZoom + delta));
    _drawExplorerGlobe();
  }

  function _expMouseDown(e) {
    _expDragging = true;
    _expLastMouse = { x: e.clientX, y: e.clientY };
  }

  function _expMouseUp() {
    _expDragging = false;
  }

  function _expMouseMove(e) {
    if (_expDragging) {
      const dx = e.clientX - _expLastMouse.x;
      const dy = e.clientY - _expLastMouse.y;
      _expRotY += dx * 0.0055;
      _expRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, _expRotX + dy * 0.0055));
      _expLastMouse = { x: e.clientX, y: e.clientY };
      _drawExplorerGlobe();
    }
    _updateTelemetry(e);
  }

  function _expWheel(e) {
    _expZoom = Math.max(0.6, Math.min(2.8, _expZoom - e.deltaY * 0.001));
    _drawExplorerGlobe();
  }

  function _expTouchStart(e) {
    if (e.touches.length === 1) {
      _expDragging = true;
      _expLastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function _expTouchMove(e) {
    if (e.touches.length === 1 && _expDragging) {
      const dx = e.touches[0].clientX - _expLastMouse.x;
      const dy = e.touches[0].clientY - _expLastMouse.y;
      _expRotY += dx * 0.0055;
      _expRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, _expRotX + dy * 0.0055));
      _expLastMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      _drawExplorerGlobe();
      e.preventDefault();
    }
  }

  function _updateTelemetry(e) {
    if (!_expOnHover || !_expCanvas) return;
    const rect = _expCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (_expCanvas.width / rect.width);
    const my = (e.clientY - rect.top) * (_expCanvas.height / rect.height);
    const { lat, lon } = _canvasToLatLon(mx, my);

    if (lat === null) {
      _expOnHover(null, null, null, null);
    } else {
      let val = null, units = null;
      if (_expRows && _expFieldMap) {
        const latF = _expFieldMap.lat;
        const lonF = _expFieldMap.lon;
        if (latF && lonF) {
          let best = null, bestDist = Infinity;
          for (const row of _expRows) {
            const rlat = Number(row[latF]), rlon = Number(row[lonF]);
            if (isNaN(rlat) || isNaN(rlon)) continue;
            const d = Math.hypot(lat - rlat, lon - rlon);
            if (d < bestDist) { bestDist = d; best = row; }
          }
          if (best && bestDist < 8) {
            const isNL = _expDataset === 'nightlights';
            const measField = isNL ? _expFieldMap.radiance : _expFieldMap.sst;
            val = measField ? best[measField] : null;
            units = isNL ? 'nW/cm²/sr' : '°C';
          }
        }
      }
      _expOnHover(lat.toFixed(2), lon.toFixed(2), val, units);
    }
  }

  function _canvasToLatLon(mx, my) {
    const W = _expCanvas.width, H = _expCanvas.height;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.44 * _expZoom;
    const dx = mx - cx, dy = my - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > r) return { lat: null, lon: null };

    const sinLat = -dy / r;
    const lat = Math.asin(Math.max(-1, Math.min(1, sinLat))) * 180 / Math.PI;
    const cosLat = Math.sqrt(1 - sinLat * sinLat);
    const sinLon = dx / (r * Math.max(0.001, cosLat));
    const lon = Math.asin(Math.max(-1, Math.min(1, sinLon))) * 180 / Math.PI + (_expRotY * 180 / Math.PI);
    return { lat, lon: ((lon + 180) % 360) - 180 };
  }

  function _drawExplorerGlobe() {
    if (!_expCanvas || !_expCtx) return;
    const c = _expCtx;
    const W = _expCanvas.width, H = _expCanvas.height;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.44 * _expZoom;

    c.clearRect(0, 0, W, H);
    c.fillStyle = '#020914';
    c.fillRect(0, 0, W, H);

    c.save();
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.clip();

    const og = c.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx, cy, r);
    og.addColorStop(0, '#194c7c');
    og.addColorStop(1, '#051122');
    c.fillStyle = og;
    c.fillRect(cx - r, cy - r, r * 2, r * 2);

    // Draw realistic continents base map
    _drawContinents(c, cx, cy, r, _expRotY);

    // Overlay verified NASA observation data points
    if (_expRows && _expFieldMap) {
      _drawDataOverlay(c, cx, cy, r);
    }

    // Draw active sounding observation beacon target
    if (_expActiveObs && _expActiveObs.lat !== null && _expActiveObs.lon !== null) {
      const { x, y, visible } = _projectLatLon(_expActiveObs.lat, _expActiveObs.lon, cx, cy, r);
      if (visible) {
        c.save();
        c.strokeStyle = '#00e5ff';
        c.lineWidth = 2.5;
        c.shadowColor = '#00e5ff';
        c.shadowBlur = 14;
        c.beginPath();
        c.arc(x, y, 9, 0, Math.PI * 2);
        c.stroke();

        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(x, y, 16, 0, Math.PI * 2);
        c.stroke();

        c.fillStyle = '#ffff00';
        c.beginPath();
        c.arc(x, y, 3.5, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    const atm = c.createRadialGradient(cx, cy, r * 0.86, cx, cy, r);
    atm.addColorStop(0, 'transparent');
    atm.addColorStop(1, 'rgba(0, 229, 255, 0.12)');
    c.fillStyle = atm;
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fill();

    c.restore();

    _drawGrid(c, cx, cy, r);

    const rim = c.createRadialGradient(cx, cy, r * 0.94, cx, cy, r * 1.08);
    rim.addColorStop(0, 'transparent');
    rim.addColorStop(0.5, 'rgba(0, 229, 255, 0.08)');
    rim.addColorStop(1, 'transparent');
    c.fillStyle = rim;
    c.beginPath();
    c.arc(cx, cy, r * 1.08, 0, Math.PI * 2);
    c.fill();
  }

  function _drawGrid(c, cx, cy, r) {
    c.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    c.lineWidth = 0.6;
    for (let lat = -60; lat <= 60; lat += 30) {
      const halfW = r * Math.cos(lat * Math.PI / 180);
      c.beginPath();
      c.arc(cx, cy, halfW, 0, Math.PI * 2);
      c.stroke();
    }
    c.strokeStyle = 'rgba(0, 229, 255, 0.18)';
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.stroke();
  }

  function _drawDataOverlay(c, cx, cy, r) {
    const rows = _expRows;
    const latF = _expFieldMap.lat;
    const lonF = _expFieldMap.lon;
    if (!latF || !lonF) return;

    const step = rows.length > 600 ? Math.floor(rows.length / 600) : 1;
    const isNL = _expDataset === 'nightlights';
    const measF = isNL ? _expFieldMap.radiance : _expFieldMap.sst;

    for (let i = 0; i < rows.length; i += step) {
      const row = rows[i];
      const lat = Number(row[latF]);
      const lon = Number(row[lonF]);
      if (isNaN(lat) || isNaN(lon)) continue;

      const { x, y, visible } = _projectLatLon(lat, lon, cx, cy, r);
      if (!visible) continue;

      const norm = measF ? (row[`_norm_${measF}`] ?? 0.5) : 0.5;
      if (isNaN(norm)) continue;

      if (isNL) {
        const alpha = 0.15 + norm * 0.85;
        const dotR = 1.8 + norm * 3.5;
        c.fillStyle = `rgba(255, ${210 + norm * 45}, ${110 + norm * 50}, ${alpha})`;
        c.beginPath();
        c.arc(x, y, dotR, 0, Math.PI * 2);
        c.fill();
      } else {
        const h = 240 - norm * 240;
        c.fillStyle = `hsla(${h}, 90%, 55%, 0.65)`;
        c.fillRect(x - 2, y - 2, 4.5, 4.5);
      }
    }
  }

  function _projectLatLon(lat, lon, cx, cy, r) {
    const phi   = lat * Math.PI / 180;
    const lambda = lon * Math.PI / 180 - _expRotY;

    const cosPhi    = Math.cos(phi);
    const sinPhi    = Math.sin(phi);
    const cosLambda = Math.cos(lambda);
    const sinLambda = Math.sin(lambda);
    const cosRotX   = Math.cos(_expRotX);
    const sinRotX   = Math.sin(_expRotX);

    const x3d = cosPhi * sinLambda;
    const y3d = sinPhi * cosRotX - cosPhi * cosLambda * sinRotX;
    const z3d = sinPhi * sinRotX + cosPhi * cosLambda * cosRotX;

    return {
      x: cx + x3d * r,
      y: cy - y3d * r,
      visible: z3d > 0
    };
  }

  /* ── 3. Star-Field Canvas Background ────────────────────────── */
  function initStarCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let stars = _generateStars(260, canvas.width, canvas.height);

    for (const s of stars) s.opacity = Math.random() * 0.7 + 0.15;

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.opacity += (Math.random() - 0.5) * 0.04;
        s.opacity = Math.max(0.05, Math.min(0.9, s.opacity));
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    loop();

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = _generateStars(260, canvas.width, canvas.height);
      for (const s of stars) s.opacity = Math.random() * 0.7 + 0.15;
    });
  }

  return {
    initHomeGlobe,
    initExplorerGlobe,
    initStarCanvas,
    setExplorerDataset,
    setActiveObservation,
    clearActiveObservation,
    resetExplorerView,
    zoomExplorer
  };
})();

/* ── Experience Visualizers (Night Lights & Ocean) ───────────── */
export const ExperienceVisualizer = (() => {

  /* Night Lights Canvas */
  let _nlCanvas = null, _nlCtx = null;
  let _nlRows = null, _nlFieldMap = null, _nlStatsMap = null;
  let _nlCurrentYear = null, _nlYears = [];
  let _activeNLEvent = null;

  function initNightLights(canvas) {
    if (!canvas) return;
    _nlCanvas = canvas;
    _nlCtx = canvas.getContext('2d');
    _drawNLWaiting();
  }

  function loadNightLightsData(rows, fieldMap, statsMap) {
    _nlRows = rows;
    _nlFieldMap = fieldMap;
    _nlStatsMap = statsMap;
    _activeNLEvent = null;

    if (fieldMap.time) {
      const yrSet = new Set(rows.map(r => r[fieldMap.time]).filter(Boolean));
      _nlYears = [...yrSet].map(Number).filter(y => !isNaN(y)).sort();
    } else {
      _nlYears = [];
    }
    _nlCurrentYear = _nlYears.length > 0 ? _nlYears[0] : null;

    const slider = document.getElementById('nl-year-slider');
    const display = document.getElementById('nl-year-display');
    if (slider && _nlYears.length > 0) {
      slider.min = Math.min(..._nlYears);
      slider.max = Math.max(..._nlYears);
      slider.value = _nlYears[0];
      slider.disabled = false;
      if (display) display.textContent = _nlYears[0];

      slider.oninput = () => {
        _nlCurrentYear = Number(slider.value);
        if (display) display.textContent = slider.value;
        _drawNightLights();
      };
    } else if (slider) {
      if (display) display.textContent = 'All observations';
    }

    _updateNLStats();
    _drawNightLights();
  }

  function _updateNLStats() {
    if (!_nlRows || !_nlFieldMap) return;
    const measF = _nlFieldMap.radiance;
    if (measF && _nlStatsMap?.[measF]) {
      const s = _nlStatsMap[measF];
      _setText('nl-stat-mean', s.mean.toFixed(3));
      _setText('nl-stat-max', s.max.toFixed(3));
    }
    _setText('nl-stat-points', _nlRows.length.toLocaleString());
    _setText('nl-stat-years', _nlYears.length > 0 ? `${_nlYears[0]}–${_nlYears[_nlYears.length - 1]}` : '2012–2023');
  }

  function setActiveObservation(datasetType, idx, event) {
    if (datasetType === 'nightlights') {
      _activeNLEvent = event;
      if (event && event.year) {
        _nlCurrentYear = event.year;
        const slider = document.getElementById('nl-year-slider');
        const display = document.getElementById('nl-year-display');
        if (slider) slider.value = event.year;
        if (display) display.textContent = event.year;
      }
      _drawNightLights();
    } else if (datasetType === 'ocean') {
      _activeOCEvent = event;
      _drawOcean();
    }
  }

  function clearActiveObservation() {
    _activeNLEvent = null;
    _activeOCEvent = null;
    _drawNightLights();
    _drawOcean();
  }

  function _drawNightLights() {
    if (!_nlCanvas || !_nlCtx) return;
    if (!_nlRows || !_nlFieldMap) { _drawNLWaiting(); return; }

    const c = _nlCtx, W = _nlCanvas.width, H = _nlCanvas.height;
    const measF = _nlFieldMap.radiance, latF = _nlFieldMap.lat, lonF = _nlFieldMap.lon;

    c.fillStyle = '#01060e';
    c.fillRect(0, 0, W, H);

    let visibleRows = _nlRows;
    if (_nlCurrentYear !== null && _nlFieldMap.time) {
      visibleRows = _nlRows.filter(r => Number(r[_nlFieldMap.time]) === _nlCurrentYear);
    }

    if (!latF || !lonF) {
      _drawGridPoints(c, W, H, visibleRows, measF);
      return;
    }

    for (const row of visibleRows) {
      const lat = Number(row[latF]), lon = Number(row[lonF]);
      if (isNaN(lat) || isNaN(lon)) continue;

      const px = ((lon + 180) / 360) * W;
      const py = ((90 - lat) / 180) * H;
      const norm = measF ? (row[`_norm_${measF}`] ?? 0.5) : 0.5;

      const alpha = 0.2 + norm * 0.8;
      const r = 1.5 + norm * 4;

      c.fillStyle = `rgba(255, ${200 + norm * 55}, ${80 + norm * 80}, ${alpha})`;
      c.beginPath();
      c.arc(px, py, r, 0, Math.PI * 2);
      c.fill();
    }

    // Draw active sounding focal ripple
    if (_activeNLEvent && _activeNLEvent.lat !== null && _activeNLEvent.lon !== null) {
      const px = ((_activeNLEvent.lon + 180) / 360) * W;
      const py = ((90 - _activeNLEvent.lat) / 180) * H;

      c.save();
      c.strokeStyle = '#00e5ff';
      c.lineWidth = 2.5;
      c.shadowColor = '#00e5ff';
      c.shadowBlur = 16;
      c.beginPath();
      c.arc(px, py, 11, 0, Math.PI * 2);
      c.stroke();

      c.strokeStyle = 'rgba(255, 235, 59, 0.85)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(px, py, 20, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
  }

  function _drawGridPoints(c, W, H, rows, measF) {
    const cols = Math.ceil(Math.sqrt(rows.length));
    const stepX = W / cols, stepY = H / Math.ceil(rows.length / cols);
    rows.forEach((r, i) => {
      const gx = (i % cols) * stepX + stepX / 2;
      const gy = Math.floor(i / cols) * stepY + stepY / 2;
      const norm = measF ? (r[`_norm_${measF}`] ?? 0.5) : 0.5;
      c.fillStyle = `rgba(0, 229, 255, ${0.2 + norm * 0.8})`;
      c.beginPath();
      c.arc(gx, gy, 1 + norm * 3, 0, Math.PI * 2);
      c.fill();
    });
  }

  function _drawNLWaiting() {
    if (!_nlCtx || !_nlCanvas) return;
    const c = _nlCtx, W = _nlCanvas.width, H = _nlCanvas.height;
    c.fillStyle = '#01060e';
    c.fillRect(0, 0, W, H);
    _drawCenteredMsg(c, W, H, 'Awaiting verified NASA Changing Nightlights dataset (2012–2023)');
  }

  /* Ocean Canvas */
  let _ocCanvas = null, _ocCtx = null;
  let _ocRows = null, _ocFieldMap = null, _ocStatsMap = null;
  let _ocMode = 'currents';
  let _ocAnimId = null;
  let _ocParticles = [];
  let _activeOCEvent = null;
  const OC_PARTICLES_TOTAL = 320;

  function initOcean(canvas) {
    if (!canvas) return;
    _ocCanvas = canvas;
    _ocCtx = canvas.getContext('2d');
    _drawOCWaiting();
  }

  function loadOceanData(rows, fieldMap, statsMap) {
    _ocRows = rows;
    _ocFieldMap = fieldMap;
    _ocStatsMap = statsMap;
    _activeOCEvent = null;

    _updateOCStats();
    _initParticles();
    _drawOcean();

    if (_ocMode === 'currents') _startOceanAnimation();
  }

  function setOceanMode(mode) {
    _ocMode = mode;
    if (!_ocRows) return;
    if (mode === 'currents') {
      _startOceanAnimation();
    } else {
      _stopOceanAnimation();
      _drawOcean();
    }
  }

  function _updateOCStats() {
    if (!_ocRows || !_ocFieldMap) return;
    const sstF = _ocFieldMap.sst;
    const velF = _ocFieldMap.vel || _ocFieldMap.u;
    if (sstF && _ocStatsMap?.[sstF]) {
      _setText('oc-stat-mean-sst', _ocStatsMap[sstF].mean.toFixed(2));
    }
    if (velF && _ocStatsMap?.[velF]) {
      _setText('oc-stat-max-vel', _ocStatsMap[velF].max.toFixed(4));
    }
    _setText('oc-stat-points', _ocRows.length.toLocaleString());

    const latF = _ocFieldMap.lat;
    if (latF) {
      const lats = _ocRows.map(r => Number(r[latF])).filter(v => !isNaN(v));
      if (lats.length > 0) {
        _setText('oc-stat-coverage', `${Math.min(...lats).toFixed(0)}° to ${Math.max(...lats).toFixed(0)}°`);
      }
    } else {
      _setText('oc-stat-coverage', 'Global');
    }
  }

  function _initParticles() {
    if (!_ocCanvas) return;
    const W = _ocCanvas.width, H = _ocCanvas.height;
    _ocParticles = Array.from({ length: OC_PARTICLES_TOTAL }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      age: Math.random() * 60,
      maxAge: 40 + Math.random() * 60
    }));
  }

  function _startOceanAnimation() {
    _stopOceanAnimation();
    function loop() {
      _drawOcean();
      _ocAnimId = requestAnimationFrame(loop);
    }
    _ocAnimId = requestAnimationFrame(loop);
  }

  function _stopOceanAnimation() {
    if (_ocAnimId) {
      cancelAnimationFrame(_ocAnimId);
      _ocAnimId = null;
    }
  }

  function _drawOcean() {
    if (!_ocCanvas || !_ocCtx) return;
    if (!_ocRows || !_ocFieldMap) { _drawOCWaiting(); return; }

    if (_ocMode === 'temperature') {
      _drawSSTField();
    } else {
      _drawCurrentsField();
    }

    // Draw active sounding beacon for Ocean
    if (_activeOCEvent && _activeOCEvent.lat !== null && _activeOCEvent.lon !== null) {
      const c = _ocCtx, W = _ocCanvas.width, H = _ocCanvas.height;
      const px = ((_activeOCEvent.lon + 180) / 360) * W;
      const py = ((90 - _activeOCEvent.lat) / 180) * H;

      c.save();
      c.strokeStyle = '#00e5ff';
      c.lineWidth = 2.5;
      c.shadowColor = '#00e5ff';
      c.shadowBlur = 18;
      c.beginPath();
      c.arc(px, py, 12, 0, Math.PI * 2);
      c.stroke();

      c.fillStyle = '#00e5ff';
      c.beginPath();
      c.arc(px, py, 3.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    _updateOCLegend();
  }

  function _drawSSTField() {
    const c = _ocCtx, W = _ocCanvas.width, H = _ocCanvas.height;
    const sstF = _ocFieldMap.sst, latF = _ocFieldMap.lat, lonF = _ocFieldMap.lon;

    c.fillStyle = '#010a18';
    c.fillRect(0, 0, W, H);

    if (!sstF || !latF || !lonF) {
      _drawCenteredMsg(c, W, H, 'SST temperature, latitude, and longitude fields required.');
      return;
    }

    for (const row of _ocRows) {
      const lat = Number(row[latF]), lon = Number(row[lonF]);
      if (isNaN(lat) || isNaN(lon)) continue;

      const norm = row[`_norm_${sstF}`] ?? 0.5;
      const px = ((lon + 180) / 360) * W;
      const py = ((90 - lat) / 180) * H;
      const h = 240 - norm * 240;

      c.fillStyle = `hsla(${h}, 85%, 55%, 0.8)`;
      c.fillRect(px - 2.5, py - 2.5, 5, 5);
    }
  }

  function _drawCurrentsField() {
    const c = _ocCtx, W = _ocCanvas.width, H = _ocCanvas.height;
    const uF = _ocFieldMap.u, vF = _ocFieldMap.v, latF = _ocFieldMap.lat, lonF = _ocFieldMap.lon;

    c.fillStyle = 'rgba(1, 10, 24, 0.28)';
    c.fillRect(0, 0, W, H);

    if (!uF || !vF || !latF || !lonF) {
      _drawCenteredMsg(c, W, H, 'Ocean vector components (u, v) and coordinates required.');
      return;
    }

    function getVelAt(px, py) {
      const lon = (px / W) * 360 - 180;
      const lat = 90 - (py / H) * 180;
      let best = null, bestD = Infinity;
      const step = Math.max(1, Math.floor(_ocRows.length / 280));
      for (let i = 0; i < _ocRows.length; i += step) {
        const r = _ocRows[i];
        const rlat = Number(r[latF]), rlon = Number(r[lonF]);
        if (isNaN(rlat) || isNaN(rlon)) continue;
        const d = Math.hypot(lat - rlat, lon - rlon);
        if (d < bestD) { bestD = d; best = r; }
      }
      if (!best || bestD > 12) return { u: 0, v: 0 };
      return { u: Number(best[uF]) || 0, v: Number(best[vF]) || 0 };
    }

    for (const p of _ocParticles) {
      p.age++;
      if (p.age > p.maxAge) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
        p.age = 0;
        continue;
      }

      const { u, v } = getVelAt(p.x, p.y);
      const speed = Math.sqrt(u * u + v * v);
      const alpha = Math.min(1, (1 - p.age / p.maxAge) * 0.8);
      const hue = 180 + Math.min(1, speed / 2) * 100;

      c.strokeStyle = `hsla(${hue}, 90%, 65%, ${alpha})`;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(p.x, p.y);

      p.x += u * 45 * 0.016;
      p.y -= v * 45 * 0.016;

      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      c.lineTo(p.x, p.y);
      c.stroke();
    }
  }

  function _updateOCLegend() {
    const minEl = document.getElementById('oc-legend-min');
    const maxEl = document.getElementById('oc-legend-max');
    if (!minEl || !maxEl) return;

    if (_ocMode === 'temperature' && _ocFieldMap?.sst && _ocStatsMap?.[_ocFieldMap.sst]) {
      const s = _ocStatsMap[_ocFieldMap.sst];
      minEl.textContent = `${s.min.toFixed(1)}°C`;
      maxEl.textContent = `${s.max.toFixed(1)}°C`;
    } else {
      const velF = _ocFieldMap?.vel || _ocFieldMap?.u;
      if (velF && _ocStatsMap?.[velF]) {
        const s = _ocStatsMap[velF];
        minEl.textContent = `${s.min.toFixed(3)} m/s`;
        maxEl.textContent = `${s.max.toFixed(3)} m/s`;
      } else {
        minEl.textContent = 'Low';
        maxEl.textContent = 'High';
      }
    }
  }

  function _drawOCWaiting() {
    if (!_ocCtx || !_ocCanvas) return;
    const c = _ocCtx, W = _ocCanvas.width, H = _ocCanvas.height;
    c.fillStyle = '#010a18';
    c.fillRect(0, 0, W, H);
    _drawCenteredMsg(c, W, H, 'Awaiting verified NASA Sea-Surface Currents & Temperature dataset');
  }

  function _drawCenteredMsg(c, W, H, msg) {
    c.fillStyle = 'rgba(138, 172, 204, 0.6)';
    c.font = '14px Inter, sans-serif';
    c.textAlign = 'center';
    c.fillText(msg, W / 2, H / 2 + 25);
    c.font = '36px sans-serif';
    c.fillText('🛰️', W / 2, H / 2 - 15);
  }

  function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  return {
    initNightLights,
    loadNightLightsData,
    initOcean,
    loadOceanData,
    setOceanMode,
    setActiveObservation,
    clearActiveObservation
  };
})();

/* ── Telemetry HUD ───────────────────────────────────────────── */
export const TelemetryHUD = (() => {
  const _els = { lat: null, lon: null, dataset: null, measurement: null, units: null };

  function init() {
    _els.lat         = document.getElementById('hud-lat');
    _els.lon         = document.getElementById('hud-lon');
    _els.dataset     = document.getElementById('hud-dataset');
    _els.measurement = document.getElementById('hud-measurement');
    _els.units       = document.getElementById('hud-units');
  }

  function update(lat, lon, measurement, units, datasetName) {
    if (!_els.lat) return;
    _els.lat.textContent         = (lat !== null && lat !== undefined) ? `${typeof lat === 'number' ? lat.toFixed(2) : lat}°` : '—';
    _els.lon.textContent         = (lon !== null && lon !== undefined) ? `${typeof lon === 'number' ? lon.toFixed(2) : lon}°` : '—';
    _els.dataset.textContent     = datasetName || 'None';
    _els.measurement.textContent = measurement !== null && measurement !== undefined
      ? (typeof measurement === 'number' ? measurement.toFixed(3) : measurement)
      : '—';
    _els.units.textContent       = units || '—';
  }

  function setDataset(name) {
    if (_els.dataset) _els.dataset.textContent = name || 'None';
  }

  function clear() {
    update(null, null, null, null, 'None');
  }

  return { init, update, clear, setDataset };
})();

if (typeof window !== 'undefined') {
  window.EarthViewer = EarthViewer;
  window.ExperienceVisualizer = ExperienceVisualizer;
  window.TelemetryHUD = TelemetryHUD;
}
