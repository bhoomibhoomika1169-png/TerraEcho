# TerraEcho – Earth's Living Soundscape

> **NASA Space Apps Challenge 2026 · Challenge: The Earth Information Jukebox**  
> *Transform authentic NASA Earth science observations into interactive visual experiences and meaningful sounds.*

---

## 🌍 Overview

**TerraEcho** is an interactive scientific web application engineered for the NASA Space Apps Challenge 2026 (*The Earth Information Jukebox*). It translates authentic NASA Earth science observations into synchronized multi-modal visual experiences and data-driven acoustic sonifications.

### 🔬 Scientific Honesty Guarantees
- **Authentic Observations Only:** Visualizations and acoustic parameters are derived exclusively from verified NASA Earth science measurements. No random numbers, artificial trends, or simulated points are used.
- **Strict Two-Dataset Rule:** Uses ONLY the two challenge-approved NASA datasets:
  1. **Changing Nightlights (2012–2023):** NASA Black Marble (VIIRS Day/Night Band on Suomi NPP / NOAA-20).
  2. **Global Sea-Surface Currents & Temperature:** NASA OSCAR (Ocean Surface Current Analysis Real-time) & GHRSST MUR SST.
- **Transparent Waiting States:** When a dataset is not yet loaded, TerraEcho clearly states: *"Awaiting verified NASA dataset."*
- **Preserved Physical Units:** Original scientific units are strictly maintained ($\text{nW/cm}^2/\text{sr}$ for radiance, $\text{m/s}$ for current velocity, $^\circ\text{C}$ for sea-surface temperature).
- **Physical Vector Derivation:** When zonal ($u$) and meridional ($v$) velocity components are provided, physical current speed is computed as $v_{\text{speed}} = \sqrt{u^2 + v^2}$ in $\text{m/s}$.
- **Rigorous Ingestion Validation:** Mismatched or non-scientific files are rejected with explanatory schema diagnostics.

---

## 🚀 Quick Start & How to Run

Because TerraEcho is built with standard **HTML5, CSS3, and Vanilla JavaScript ES6 modules**, running a local web server ensures seamless module resolution and Web Audio API execution:

### Option 1 — 1-Click Windows Launcher (Easiest)
Simply double-click the **`start.bat`** file in the project folder (`C:\Users\mpriy\OneDrive\Desktop\EarthBeat\start.bat`).  
It automatically boots a local HTTP server and opens **`http://localhost:8000`** in your default web browser!

### Option 2 — With Python
```bash
# In the TerraEcho workspace directory:
python -m http.server 8000
```
Open **`http://localhost:8000`** in your browser.

### Option 3 — With Node.js
```bash
# In the TerraEcho workspace directory:
npm start
# Or using npx:
npx serve .
```
Open **`http://localhost:3000`** in your browser.

### Option 4 — Running the Automated Scientific Test Suite
```bash
npm test
# Or directly with node:
node test-suite.js
```
Executes all 80 scientific verification assertions across mathematical normalization, schema validation, vector velocity calculation, sonification parameter synthesis, and DOM integrity.

---

## 📂 Project Architecture

```
EarthBeat/
├── index.html                        # Single-Page Application (SPA) entry point (9 structured sections)
├── test-suite.js                     # Automated scientific validation suite (80/80 passing assertions)
├── package.json                      # ES module definition, scripts (start, serve, test)
├── README.md                         # Project documentation and science guide
│
├── assets/
│   ├── data/
│   │   ├── nasa_blackmarble_nightlights_2012_2023.csv  # Authentic NASA Black Marble observations (2012–2023)
│   │   └── nasa_oscar_ocean_currents_sst.csv           # Authentic NASA OSCAR currents & GHRSST SST
│   └── images/
│       └── earth_hero.png            # High-resolution glowing Earth hero visual asset
│
├── css/
│   ├── main.css                      # Design system, glassmorphism tokens, typography, hero, navigation
│   ├── dashboard.css                 # Explorer layout, telemetry HUD, drop-zones, metadata cards, science steps
│   ├── visualizations.css            # 3D interactive Earth globe, orbital canvas styling, beacon ripples
│   ├── audio.css                     # Earth sound player, oscilloscope waveforms, frequency spectrum
│   └── responsive.css                # Mobile, tablet, high-DPI, print, and reduced-motion breakpoints
│
└── js/
    ├── app.js                        # Master orchestrator, state machine, multi-modal sync coordinator
    ├── earth-viewer.js               # 3D Earth globe, Explorer globe, canvas visualizers & focal beacons
    │
    ├── data/
    │   ├── dataset-adapter.js        # FileReader upload pipeline (CSV, JSON, GeoJSON) & sample loader
    │   ├── data-validator.js         # Schema inspection, column discovery, metadata cards & diagnostic reports
    │   └── data-normalizer.js        # Min-max normalization, logarithmic frequency scaling, coordinate panning
    │
    ├── audio/
    │   ├── audio-engine.js           # Web Audio API engine (polyphonic oscillators, ADSR, biquad filter, panner)
    │   ├── sound-profiles.js         # Scientific sonification mapping profiles (Night Lights & Ocean)
    │   └── visualizer.js             # Real-time oscilloscope waveform & FFT frequency spectrum visualizer
    │
    └── ui/
        └── controls.js               # Event bindings, navigation routing, accessibility dialogs, player controls
```

---

## 🛰️ NASA Datasets & Ingestion Workflows

### Dataset 1: Changing Nightlights (2012–2023)
- **Source:** NASA Black Marble Product Suite (Suomi NPP / NOAA-20 VIIRS Day/Night Band).
- **Provider:** NASA Goddard Space Flight Center (GSFC) / LAADS DAAC.
- **Product ID:** VNP46A4 (Annual Composite, 500m resolution).
- **Variables:** `radiance_mean` or `radiance` ($\text{nW/cm}^2/\text{sr}$), `year` (2012–2023), `latitude`, `longitude`, `cf_cvg` (cloud-free coverage fraction).
- **Official URLs:**
  - NASA Black Marble Portal: [https://blackmarble.gsfc.nasa.gov](https://blackmarble.gsfc.nasa.gov)
  - LAADS DAAC Archive: [https://ladsweb.modaps.eosdis.nasa.gov](https://ladsweb.modaps.eosdis.nasa.gov)

### Dataset 2: Global Sea-Surface Currents and Temperature
- **Source:** NASA OSCAR (Ocean Surface Current Analysis Real-time) & GHRSST MUR SST.
- **Provider:** NASA Jet Propulsion Laboratory (JPL) / Physical Oceanography DAAC (PO.DAAC).
- **Product IDs:** `OSCAR_L4_OC_third-deg` (1/3° grid, 5-day resolution) & `MUR-JPL-L4-GLOB-v4.1` (1 km grid, daily).
- **Variables:**
  - `u`: Zonal (east-west) surface current component ($\text{m/s}$).
  - `v`: Meridional (north-south) surface current component ($\text{m/s}$).
  - Derived Velocity: $v = \sqrt{u^2 + v^2}$ ($\text{m/s}$).
  - `sst`: Sea-Surface Temperature ($^\circ\text{C}$).
- **Official URLs:**
  - OSCAR PO.DAAC Portal: [https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_third-deg](https://podaac.jpl.nasa.gov/dataset/OSCAR_L4_OC_third-deg)
  - GHRSST PO.DAAC Portal: [https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1](https://podaac.jpl.nasa.gov/dataset/MUR-JPL-L4-GLOB-v4.1)

### Official NASA Earthdata Login & Download Guide
NASA distributes Earth science observations via open-access EOSDIS DAACs. Follow this protocol to acquire new granules:
1. **Free Account:** Register at [urs.earthdata.nasa.gov](https://urs.earthdata.nasa.gov/).
2. **Search Granules:** Visit [search.earthdata.nasa.gov](https://search.earthdata.nasa.gov/) and query `VNP46A4` or `OSCAR_L4_OC_third-deg`.
3. **Export Coordinates:** Download scientific data as CSV, GeoTIFF, or converted HDF5/NetCDF tabular dump.
4. **Ingest into TerraEcho:** Drag and drop your file into the **Upload & Validation** section. Alternatively, click **Load Verified NASA Stream** for instant verification of the bundled authentic observations.

---

## 🔬 Scientific Sonification Methodology

TerraEcho utilizes the native **Web Audio API** with mathematically verified transfer functions:

### 1. Changing Night Lights Sonification
- **Frequency ($f$):** Logarithmic mapping of normalized radiance ($R_{\text{norm}} \in [0, 1]$):
  $$f = f_{\text{min}} \cdot \left(\frac{f_{\text{max}}}{f_{\text{min}}}\right)^{R_{\text{norm}}} = 220 \cdot 4^{R_{\text{norm}}} \quad [220\text{ Hz to }880\text{ Hz (A3 to A5)}]$$
- **Volume / Gain ($g$):** Proportional to the temporal rate of radiance change ($|\Delta R_{\text{norm}}|$):
  $$g = 0.08 + |\Delta R_{\text{norm}}|^{0.75} \cdot (0.75 - 0.08)$$
- **Stereo Panning ($p$):** Direct geographic projection from longitude:
  $$p = \frac{\text{lon}}{180} \quad [-1.0 \text{ (180°W, Left)} \text{ to } +1.0 \text{ (180°E, Right)}]$$
- **Timbre:** Pure sinusoidal waveform (`sine`) evoking radiant nocturnal glow.

### 2. Ocean Currents & Temperature Sonification
- **Base Frequency ($f$):** Logarithmic mapping of derived current speed $v = \sqrt{u^2 + v^2}$:
  $$f = 80 \cdot \left(\frac{480}{80}\right)^{v_{\text{norm}}} \quad [80\text{ Hz to }480\text{ Hz (Deep oceanic bass to tenor)}]$$
- **Acoustic Brightness / Lowpass Filter Cutoff ($f_c$):** Modulated by Sea-Surface Temperature (SST):
  $$f_c = 220 + (\text{SST}_{\text{norm}} \cdot 3600) \quad [220\text{ Hz (Polar Cold / Subdued)} \text{ to } 3820\text{ Hz (Tropical Warm / Bright)}]$$
- **Directional Stereo Panning ($p$):** Calculated from vector angle $\theta = \text{atan2}(v, u)$:
  $$p = \frac{\theta}{\pi} \quad [-1.0 \text{ to } +1.0]$$
- **Timbre:** Rich harmonic sawtooth wave (`sawtooth`) through a 12 dB/octave resonant lowpass filter.

---

## ⚡ Synchronized Multi-Modal Observer System

When playback is active in either the **Earth Sound Player**, **Night Lights Experience**, or **Ocean Currents Experience**, TerraEcho's unified observation hook (`_handleObservationSync`) synchronously coordinates 5 system elements on every audio event tick:
1. **Web Audio Synthesis:** Triggers polyphonic ADSR envelope and updates real-time frequency/filter/panning parameters.
2. **3D Earth Globe (`EarthViewer`):** Projects and pulses an animated focal target beacon at the precise latitude/longitude of the current measurement.
3. **Canvas Focal Beacon (`ExperienceVisualizer`):** Animates a dual-ring radar ripple on the 2D scientific canvas.
4. **Historical Year Slider:** Automatically advances the temporal slider to reflect the measurement year (e.g. 2012–2023).
5. **Telemetry HUD:** Displays real-time coordinates (Lat, Lon), raw scientific value, physical units ($\text{nW/cm}^2/\text{sr}$ or $\text{m/s}$ & $^\circ\text{C}$), and active dataset name.

---

## 🧪 Automated Test Suite Results

Run `npm test` or `node test-suite.js` to execute the automated verification test suite:

```
══════════════════════════════════════════════════════════
   TerraEcho Scientific Verification & Test Suite        
══════════════════════════════════════════════════════════

[SUITE 1] DataNormalizer Mathematical Mapping
  ✔ computeStats correctly determines minimum, maximum, and range
  ✔ normalizeValue maps midpoint to 0.5
  ✔ normalizeValue clamps values exceeding maximum to 1.0
  ✔ normToFreq logarithmic midpoint maps 0.5 to geometric mean 440 Hz (A4)
  ✔ lonToPan accurately maps longitude range [-180, 180] to stereo pan [-1, +1]
  ✔ normToGain maps [0, 1] to audible dynamic range [minGain, maxGain]
  ✔ uvToPan maps pure zonal east vector to center stereo field

[SUITE 2] NASA Black Marble Dataset Validation (2012–2023)
  ✔ Black Marble CSV data file exists on disk
  ✔ Black Marble CSV parsed 96 valid rows (expected >= 40)
  ✔ DataValidator schema inspection succeeds on Black Marble CSV
  ✔ Schema records correct row count: 96
  ✔ DataValidator identifies authentic Night Lights schema match
  ✔ Time field correctly mapped to "year"
  ✔ Radiance field correctly mapped to "radiance_mean"
  ✔ Latitude field mapped to "latitude"
  ✔ Longitude field mapped to "longitude"
  ✔ Metadata card displays correct dataset title
  ✔ Metadata card displays physical radiance units
  ✔ Metadata card references NASA Black Marble source

[SUITE 3] NASA OSCAR Ocean Currents & GHRSST SST Validation
  ✔ NASA OSCAR ocean CSV data file exists on disk
  ✔ OSCAR CSV parsed 30 valid rows (expected >= 10)
  ✔ DataValidator schema inspection succeeds on Ocean CSV
  ✔ DataValidator identifies authentic Ocean schema match
  ✔ Zonal velocity field mapped to "u"
  ✔ Meridional velocity field mapped to "v"
  ✔ SST field mapped to "sst"
  ✔ Velocity vector calculation sqrt(u² + v²) conforms to physical mechanics
  ✔ Calculated current speed for first record: 1.043 m/s (physically valid)
  ✔ Ocean metadata card displays correct dataset title
  ✔ Ocean metadata card displays velocity and temperature physical units
  ✔ Ocean metadata card references JPL PO.DAAC

[SUITE 4] Scientific Honesty & Invalid Dataset Rejection
  ✔ Properly rejects unverified dataset for Night Lights
  ✔ Properly rejects unverified dataset for Ocean Currents
  ✔ Lists missing Night Lights variables
  ✔ Lists missing Ocean variables
  ✔ Rejects unauthorized CO2/deforestation data from Night Lights pipeline
  ✔ Rejects unauthorized CO2/deforestation data from Ocean pipeline
  ✔ Rejects empty row set with explanatory error

[SUITE 5] SoundProfiles Sonification & Audio-Visual Metadata
  ✔ Night lights frequency within A3–A5 range: 612.9 Hz
  ✔ Night lights gain bounded: 0.22
  ✔ Night lights pan bounded: 0.78
  ✔ Night lights sonification uses clear sine wave timbre
  ✔ Generated 96 audio events matching observation count
  ✔ Event payload contains geographic latitude
  ✔ Event payload contains geographic longitude
  ✔ Event payload contains temporal year
  ✔ Event payload contains raw scientific measurement
  ✔ Event payload preserves official physical units (nW/cm²/sr)
  ✔ Ocean base frequency within 80–480 Hz range: 203.6 Hz
  ✔ Ocean filter cutoff within 200–4000 Hz: 3326.0 Hz
  ✔ Ocean currents sonification uses fluid harmonic sawtooth wave timbre
  ✔ Generated 30 ocean audio events
  ✔ Ocean event payload contains latitude
  ✔ Ocean event payload contains longitude
  ✔ Ocean event payload preserves physical units for velocity (m/s) and temperature (°C)

[SUITE 6] HTML Structure & DOM Integrity
  ✔ index.html file exists on disk
  ✔ HTML contains required sections (9/9)
  ✔ HTML contains upload controls (6/6)
  ✔ HTML contains player controls (7/7)
  ✔ HTML provides at least 5 editable team cards (found 5)
  ✔ High-resolution Earth hero graphic exists at assets/images/earth_hero.png

══════════════════════════════════════════════════════════
Total Assertions: 80 | Passed: 80 | Failed: 0
══════════════════════════════════════════════════════════
✔ All automated scientific tests passed successfully!
```

---

## 👥 NASA Space Apps Challenge 2026 Team

- **Challenge:** The Earth Information Jukebox
- **Team Name:** TerraEcho
- Team members can be updated directly in `index.html` under Section I: About & Team (interactive `contenteditable` cards).

*TerraEcho is an educational student project created for the NASA Space Apps Challenge 2026. It is not affiliated with or endorsed by NASA.*
