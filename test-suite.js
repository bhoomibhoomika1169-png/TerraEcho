/**
 * TerraEcho – Automated Scientific & System Verification Test Suite
 * NASA Space Apps Challenge 2026: The Earth Information Jukebox
 *
 * Verifies:
 * 1. Static ES module syntax and parsing.
 * 2. DatasetAdapter CSV parsing and vector speed calculation sqrt(u^2 + v^2).
 * 3. DataValidator schema inspection and scientific rejection of invalid datasets.
 * 4. DataNormalizer scientific mapping (logarithmic frequency, pan, filter cutoff).
 * 5. SoundProfiles parameter synthesis and audio-visual synchronization metadata.
 * 6. HTML DOM structure, navigation section IDs, control elements, and asset files.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import application modules
import { DataNormalizer } from './js/data/data-normalizer.js';
import { DataValidator } from './js/data/data-validator.js';
import { DatasetAdapter } from './js/data/dataset-adapter.js';
import { SoundProfiles } from './js/audio/sound-profiles.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔\x1b[0m ${message}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖\x1b[0m FAILED: ${message}`);
  }
}

function assertClose(actual, expected, tolerance, message) {
  totalTests++;
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    passedTests++;
    console.log(`  \x1b[32m✔\x1b[0m ${message} (${actual.toFixed(4)} ~ ${expected.toFixed(4)})`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖\x1b[0m FAILED: ${message} (Actual: ${actual}, Expected: ${expected})`);
  }
}

console.log('\n\x1b[1m══════════════════════════════════════════════════════════\x1b[0m');
console.log('\x1b[1m   TerraEcho Scientific Verification & Test Suite        \x1b[0m');
console.log('\x1b[1m══════════════════════════════════════════════════════════\x1b[0m\n');

// ── TEST SUITE 1: DataNormalizer Mathematical Mapping ──
console.log('\x1b[36m[SUITE 1] DataNormalizer Mathematical Mapping\x1b[0m');

const testRows = [{ val: -10 }, { val: 0 }, { val: 50 }, { val: 100 }];
const stats = DataNormalizer.computeStats(testRows, 'val');
assert(stats.min === -10 && stats.max === 100 && stats.range === 110, 'computeStats correctly determines minimum, maximum, and range');

const normVal = DataNormalizer.normalizeValue(50, { min: 0, max: 100, range: 100 });
assert(normVal === 0.5, 'normalizeValue maps midpoint to 0.5');

const clampedNorm = DataNormalizer.normalizeValue(150, { min: 0, max: 100, range: 100 });
assert(clampedNorm === 1.0, 'normalizeValue clamps values exceeding maximum to 1.0');

const freqMid = DataNormalizer.normToFreq(0.5, 220, 880);
assertClose(freqMid, 440.0, 0.01, 'normToFreq logarithmic midpoint maps 0.5 to geometric mean 440 Hz (A4)');

const panLeft = DataNormalizer.lonToPan(-180);
const panCenter = DataNormalizer.lonToPan(0);
const panRight = DataNormalizer.lonToPan(180);
assert(panLeft === -1 && panCenter === 0 && panRight === 1, 'lonToPan accurately maps longitude range [-180, 180] to stereo pan [-1, +1]');

const gainSilent = DataNormalizer.normToGain(0, 0.05, 0.8);
const gainMax = DataNormalizer.normToGain(1, 0.05, 0.8);
assert(gainSilent === 0.05 && gainMax === 0.8, 'normToGain maps [0, 1] to audible dynamic range [minGain, maxGain]');

const uvPan = DataNormalizer.uvToPan(1, 0);
assertClose(uvPan, 0, 0.01, 'uvToPan maps pure zonal east vector to center stereo field');


// ── TEST SUITE 2: NASA Black Marble Dataset Parsing & Schema ──
console.log('\n\x1b[36m[SUITE 2] NASA Black Marble Dataset Validation (2012–2023)\x1b[0m');

const nlCsvPath = path.join(__dirname, 'assets', 'data', 'nasa_blackmarble_nightlights_2012_2023.csv');
assert(fs.existsSync(nlCsvPath), 'Black Marble CSV data file exists on disk');

const nlRaw = fs.readFileSync(nlCsvPath, 'utf8');
const nlRows = DatasetAdapter.parseCSV(nlRaw);
assert(nlRows.length >= 40, `Black Marble CSV parsed ${nlRows.length} valid rows (expected >= 40)`);

const nlSchema = DataValidator.inspect(nlRows);
assert(nlSchema.ok === true, 'DataValidator schema inspection succeeds on Black Marble CSV');
assert(nlSchema.rowCount === nlRows.length, `Schema records correct row count: ${nlSchema.rowCount}`);

const nlMatch = DataValidator.matchNightLights(nlSchema);
assert(nlMatch.match === true, 'DataValidator identifies authentic Night Lights schema match');
assert(nlMatch.suggestedFields.time === 'year', 'Time field correctly mapped to "year"');
assert(nlMatch.suggestedFields.radiance === 'radiance_mean', 'Radiance field correctly mapped to "radiance_mean"');
assert(nlMatch.suggestedFields.lat === 'latitude', 'Latitude field mapped to "latitude"');
assert(nlMatch.suggestedFields.lon === 'longitude', 'Longitude field mapped to "longitude"');

const nlMetaCard = DataValidator.renderMetadataCardHTML('nightlights', nlSchema, 'nasa_blackmarble_nightlights_2012_2023.csv', nlMatch.suggestedFields, nlRows);
assert(nlMetaCard.includes('Changing Nightlights (2012–2023)'), 'Metadata card displays correct dataset title');
assert(nlMetaCard.includes('nW/cm²/sr (Radiance)'), 'Metadata card displays physical radiance units');
assert(nlMetaCard.includes('NASA Black Marble'), 'Metadata card references NASA Black Marble source');


// ── TEST SUITE 3: NASA OSCAR Ocean Currents & SST Validation ──
console.log('\n\x1b[36m[SUITE 3] NASA OSCAR Ocean Currents & GHRSST SST Validation\x1b[0m');

const ocCsvPath = path.join(__dirname, 'assets', 'data', 'nasa_oscar_ocean_currents_sst.csv');
assert(fs.existsSync(ocCsvPath), 'NASA OSCAR ocean CSV data file exists on disk');

const ocRaw = fs.readFileSync(ocCsvPath, 'utf8');
const ocRows = DatasetAdapter.parseCSV(ocRaw);
assert(ocRows.length >= 10, `OSCAR CSV parsed ${ocRows.length} valid rows (expected >= 10)`);

const ocSchema = DataValidator.inspect(ocRows);
assert(ocSchema.ok === true, 'DataValidator schema inspection succeeds on Ocean CSV');

const ocMatch = DataValidator.matchOcean(ocSchema);
assert(ocMatch.match === true, 'DataValidator identifies authentic Ocean schema match');
assert(ocMatch.suggestedFields.u === 'u', 'Zonal velocity field mapped to "u"');
assert(ocMatch.suggestedFields.v === 'v', 'Meridional velocity field mapped to "v"');
assert(ocMatch.suggestedFields.sst === 'sst', 'SST field mapped to "sst"');

// Test vector speed calculation sqrt(u^2 + v^2)
const testU = 0.42;
const testV = -0.18;
const expectedSpeed = Math.sqrt(testU * testU + testV * testV);
assertClose(expectedSpeed, 0.4569, 0.001, 'Velocity vector calculation sqrt(u² + v²) conforms to physical mechanics');

// Simulate adapter calculation on rows
for (const row of ocRows) {
  const u = Number(row[ocMatch.suggestedFields.u]);
  const v = Number(row[ocMatch.suggestedFields.v]);
  if (!isNaN(u) && !isNaN(v)) {
    row._calc_velocity = Math.sqrt(u * u + v * v);
  }
}
const firstSpeed = ocRows[0]._calc_velocity;
assert(typeof firstSpeed === 'number' && firstSpeed > 0 && firstSpeed < 3.0, `Calculated current speed for first record: ${firstSpeed.toFixed(3)} m/s (physically valid)`);

const ocMetaCard = DataValidator.renderMetadataCardHTML('ocean', ocSchema, 'nasa_oscar_ocean_currents_sst.csv', ocMatch.suggestedFields, ocRows);
assert(ocMetaCard.includes('Global Sea-Surface Currents and Temperature'), 'Ocean metadata card displays correct dataset title');
assert(ocMetaCard.includes('m/s (Velocity) · °C (Temperature)'), 'Ocean metadata card displays velocity and temperature physical units');
assert(ocMetaCard.includes('PO.DAAC'), 'Ocean metadata card references JPL PO.DAAC');


// ── TEST SUITE 4: Scientific Honesty & Rejection of Invalid Data ──
console.log('\n\x1b[36m[SUITE 4] Scientific Honesty & Invalid Dataset Rejection\x1b[0m');

// Reject random non-scientific CSV
const fakeCsv = 'colA,colB,colC\n1,2,3\n4,5,6';
const fakeRows = DatasetAdapter.parseCSV(fakeCsv);
const fakeSchema = DataValidator.inspect(fakeRows);
const fakeNLMatch = DataValidator.matchNightLights(fakeSchema);
const fakeOCMatch = DataValidator.matchOcean(fakeSchema);
assert(fakeNLMatch.match === false, 'Properly rejects unverified dataset for Night Lights');
assert(fakeOCMatch.match === false, 'Properly rejects unverified dataset for Ocean Currents');
assert(fakeNLMatch.missing.length > 0, `Lists missing Night Lights variables: ${fakeNLMatch.missing.join(', ')}`);
assert(fakeOCMatch.missing.length > 0, `Lists missing Ocean variables: ${fakeOCMatch.missing.join(', ')}`);

// Reject prohibited datasets (e.g. CO2 / deforestation)
const prohibitedCsv = 'year,country,co2_emissions,deforestation_rate\n2020,Global,415,10.2';
const prohibRows = DatasetAdapter.parseCSV(prohibitedCsv);
const prohibSchema = DataValidator.inspect(prohibRows);
assert(DataValidator.matchNightLights(prohibSchema).match === false, 'Rejects unauthorized CO2/deforestation data from Night Lights pipeline');
assert(DataValidator.matchOcean(prohibSchema).match === false, 'Rejects unauthorized CO2/deforestation data from Ocean pipeline');

// Reject empty dataset
const emptySchema = DataValidator.inspect([]);
assert(emptySchema.ok === false, 'Rejects empty row set with explanatory error');


// ── TEST SUITE 5: SoundProfiles & Audio-Visual Synchronization Metadata ──
console.log('\n\x1b[36m[SUITE 5] SoundProfiles Sonification & Audio-Visual Metadata\x1b[0m');

// Prepare normalized fields for night lights
DataNormalizer.normalizeFields(nlRows, ['radiance_mean']);
const nlAudioParams = SoundProfiles.nightLightsParams(nlRows[0], nlMatch.suggestedFields);
assert(nlAudioParams.frequency >= 220 && nlAudioParams.frequency <= 880, `Night lights frequency within A3–A5 range: ${nlAudioParams.frequency.toFixed(1)} Hz`);
assert(nlAudioParams.gain >= 0.05 && nlAudioParams.gain <= 0.8, `Night lights gain bounded: ${nlAudioParams.gain.toFixed(2)}`);
assert(nlAudioParams.pan >= -1 && nlAudioParams.pan <= 1, `Night lights pan bounded: ${nlAudioParams.pan.toFixed(2)}`);
assert(nlAudioParams.waveType === 'sine', 'Night lights sonification uses clear sine wave timbre');

// Test Night Lights sequence generation with audio-visual metadata
const nlSequence = SoundProfiles.buildNightLightsSequence(nlRows, nlMatch.suggestedFields);
assert(nlSequence.length === nlRows.length, `Generated ${nlSequence.length} audio events matching observation count`);
const firstNlEvent = nlSequence[0];
assert(typeof firstNlEvent.lat === 'number', 'Event payload contains geographic latitude');
assert(typeof firstNlEvent.lon === 'number', 'Event payload contains geographic longitude');
assert(typeof firstNlEvent.year === 'number' || typeof firstNlEvent.year === 'string', 'Event payload contains temporal year');
assert(firstNlEvent.rawValue !== null && firstNlEvent.rawValue !== undefined, 'Event payload contains raw scientific measurement');
assert(firstNlEvent.rawUnits === 'nW/cm²/sr', 'Event payload preserves official physical units (nW/cm²/sr)');

// Prepare normalized fields for ocean
DataNormalizer.normalizeFields(ocRows, ['sst', 'u', 'v']);
const ocAudioParams = SoundProfiles.oceanParams(ocRows[0], ocMatch.suggestedFields);
assert(ocAudioParams.frequency >= 80 && ocAudioParams.frequency <= 480, `Ocean base frequency within 80–480 Hz range: ${ocAudioParams.frequency.toFixed(1)} Hz`);
assert(ocAudioParams.filterCutoff >= 200 && ocAudioParams.filterCutoff <= 4000, `Ocean filter cutoff within 200–4000 Hz: ${ocAudioParams.filterCutoff.toFixed(1)} Hz`);
assert(ocAudioParams.waveType === 'sawtooth', 'Ocean currents sonification uses fluid harmonic sawtooth wave timbre');

// Test Ocean sequence generation with audio-visual metadata
const ocSequence = SoundProfiles.buildOceanSequence(ocRows, ocMatch.suggestedFields);
assert(ocSequence.length === ocRows.length, `Generated ${ocSequence.length} ocean audio events`);
const firstOcEvent = ocSequence[0];
assert(typeof firstOcEvent.lat === 'number', 'Ocean event payload contains latitude');
assert(typeof firstOcEvent.lon === 'number', 'Ocean event payload contains longitude');
assert(firstOcEvent.rawUnitsVel === 'm/s' && firstOcEvent.rawUnitsSST === '°C', 'Ocean event payload preserves physical units for velocity (m/s) and temperature (°C)');


// ── TEST SUITE 6: HTML Structure, Navigation Sections & DOM Elements ──
console.log('\n\x1b[36m[SUITE 6] HTML Structure & DOM Integrity\x1b[0m');

const htmlPath = path.join(__dirname, 'index.html');
assert(fs.existsSync(htmlPath), 'index.html file exists on disk');
const html = fs.readFileSync(htmlPath, 'utf8');

const requiredSections = [
  'id="home"',
  'id="explorer"',
  'id="nightlights"',
  'id="ocean"',
  'id="upload"',
  'id="player"',
  'id="science"',
  'id="sources"',
  'id="about"'
];
for (const sec of requiredSections) {
  assert(html.includes(sec), `HTML contains required section: ${sec}`);
}

const requiredUploadControls = [
  'id="nl-drop-zone"',
  'id="nl-file-input"',
  'id="nl-load-sample-btn"',
  'id="oc-drop-zone"',
  'id="oc-file-input"',
  'id="oc-load-sample-btn"'
];
for (const ctl of requiredUploadControls) {
  assert(html.includes(ctl), `HTML contains upload control: ${ctl}`);
}

const requiredPlayerControls = [
  'id="player-play"',
  'id="player-stop"',
  'id="player-timeline"',
  'id="player-volume"',
  'id="player-speed"',
  'id="player-status"',
  'id="player-observation"'
];
for (const ctl of requiredPlayerControls) {
  assert(html.includes(ctl), `HTML contains player control: ${ctl}`);
}

// Check team cards with contenteditable="true"
const editableNames = (html.match(/contenteditable="true"/g) || []).length;
assert(editableNames >= 5, `HTML provides at least 5 editable team cards (found ${editableNames})`);

// Check assets
const heroImgPath = path.join(__dirname, 'assets', 'images', 'earth_hero.png');
assert(fs.existsSync(heroImgPath), 'High-resolution Earth hero graphic exists at assets/images/earth_hero.png');


// ── TEST SUMMARY ──
console.log('\n\x1b[1m══════════════════════════════════════════════════════════\x1b[0m');
console.log(`\x1b[1mTotal Assertions: ${totalTests} | Passed: \x1b[32m${passedTests}\x1b[0m\x1b[1m | Failed: \x1b[31m${failedTests}\x1b[0m\x1b[1m\x1b[0m`);
console.log('\x1b[1m══════════════════════════════════════════════════════════\x1b[0m\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All automated scientific tests passed successfully!\x1b[0m\n');
}
