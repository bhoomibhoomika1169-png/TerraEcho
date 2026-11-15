/**
 * sound-profiles.js
 * Scientific data-to-sound parameter mapping profiles for NASA Earth datasets.
 * Strictly maps authentic validated observations — never generates fake or random audio.
 * Attaches physical measurements, coordinates, and temporal anchors to every audio event.
 * ES6 Module.
 */

import { DataNormalizer } from '../data/data-normalizer.js';

export const SoundProfiles = (() => {

  /**
   * Calculate sonification synthesis parameters for a single Night Lights observation.
   * @param {Object} row
   * @param {Object} fieldMap
   * @returns {{ frequency: number, gain: number, pan: number, duration: number, waveType: string }}
   */
  function nightLightsParams(row, fieldMap) {
    const normalizer = (typeof window !== 'undefined' && window.DataNormalizer) || DataNormalizer;

    // Radiance value (nW/cm²/sr) -> Logarithmic Frequency (220 Hz to 880 Hz: A3 to A5)
    const normRad = fieldMap.radiance ? (row[`_norm_${fieldMap.radiance}`] ?? 0.5) : 0.5;
    const frequency = normalizer.normToFreq(normRad, 220, 880);

    // Magnitude of temporal change in brightness -> Gain amplitude
    const prevNorm = row._prevNormRad ?? normRad;
    const delta = Math.abs(normRad - prevNorm);
    const gain = normalizer.normToGain(0.12 + delta * 0.88, 0.08, 0.75);

    // Geographic longitude -> Stereo Pan (-1 Left to +1 Right)
    const pan = fieldMap.lon ? normalizer.lonToPan(row[fieldMap.lon]) : 0;

    return {
      frequency,
      gain,
      pan,
      duration: 0.45,
      waveType: 'sine'
    };
  }

  /**
   * Build an ordered sonification sequence from Night Lights dataset rows.
   * @param {Object[]} rows
   * @param {Object} fieldMap
   * @returns {Object[]} Chronologically or index-sequenced audio events with spatial/temporal metadata
   */
  function buildNightLightsSequence(rows, fieldMap) {
    if (!rows || rows.length === 0) return [];

    let sorted = [...rows];
    if (fieldMap.time) {
      sorted.sort((a, b) => Number(a[fieldMap.time]) - Number(b[fieldMap.time]));
    }

    let prevNorm = null;
    return sorted.map((row, i) => {
      if (i > 0 && fieldMap.radiance) {
        sorted[i]._prevNormRad = prevNorm;
      }
      const normRad = fieldMap.radiance ? (row[`_norm_${fieldMap.radiance}`] ?? 0.5) : 0.5;
      prevNorm = normRad;

      const params = nightLightsParams(row, fieldMap);
      const latVal = fieldMap.lat ? Number(row[fieldMap.lat]) : null;
      const lonVal = fieldMap.lon ? Number(row[fieldMap.lon]) : null;
      const yrVal  = fieldMap.time ? Number(row[fieldMap.time]) : null;

      return {
        index: i,
        startTime: i * 0.38,
        ...params,
        lat: isNaN(latVal) ? null : latVal,
        lon: isNaN(lonVal) ? null : lonVal,
        year: isNaN(yrVal) ? null : yrVal,
        label: yrVal ? `Year ${yrVal}` : `Observation #${i + 1}`,
        rawValue: fieldMap.radiance ? row[fieldMap.radiance] : null,
        rawUnits: 'nW/cm²/sr'
      };
    });
  }

  /**
   * Calculate sonification synthesis parameters for a single Ocean Currents & Temperature observation.
   * @param {Object} row
   * @param {Object} fieldMap
   * @returns {{ frequency: number, gain: number, pan: number, filterCutoff: number, duration: number, waveType: string }}
   */
  function oceanParams(row, fieldMap) {
    const normalizer = (typeof window !== 'undefined' && window.DataNormalizer) || DataNormalizer;

    // Ocean Current Velocity (m/s) -> Base Frequency (80 Hz to 480 Hz: deep bass to tenor)
    let normVel;
    if (fieldMap.vel) {
      normVel = row[`_norm_${fieldMap.vel}`] ?? 0.3;
    } else if (fieldMap.u && fieldMap.v) {
      const u = Number(row[fieldMap.u]) || 0;
      const v = Number(row[fieldMap.v]) || 0;
      const vel = Math.sqrt(u * u + v * v);
      normVel = Math.min(1.0, vel / 2.0);
    } else {
      normVel = 0.3;
    }
    normVel = Math.max(0, Math.min(1, normVel));
    const frequency = normalizer.normToFreq(normVel, 80, 480);

    // Sea-Surface Temperature (SST °C) -> Lowpass Filter Cutoff (Warm = bright timbre, Cold = dark timbre)
    const normSST = fieldMap.sst ? (row[`_norm_${fieldMap.sst}`] ?? 0.5) : 0.5;
    const filterCutoff = 220 + normSST * 3600;

    // Velocity magnitude -> Amplitude Gain
    const gain = normalizer.normToGain(normVel, 0.12, 0.75);

    // Current vector direction (u, v) -> Stereo Pan
    const pan = (fieldMap.u && fieldMap.v)
      ? normalizer.uvToPan(row[fieldMap.u], row[fieldMap.v])
      : (fieldMap.lon ? normalizer.lonToPan(row[fieldMap.lon]) : 0);

    return {
      frequency,
      gain,
      pan,
      filterCutoff,
      duration: 0.55,
      waveType: 'sawtooth'
    };
  }

  /**
   * Build an ordered sonification sequence from Ocean dataset observations.
   * @param {Object[]} rows
   * @param {Object} fieldMap
   * @returns {Object[]}
   */
  function buildOceanSequence(rows, fieldMap) {
    if (!rows || rows.length === 0) return [];

    // Sample representative subset for smooth performance if dataset is large (>250 observations)
    let sampled = rows;
    if (rows.length > 250) {
      const step = Math.floor(rows.length / 250);
      sampled = rows.filter((_, i) => i % step === 0).slice(0, 250);
    }

    if (fieldMap.lat && fieldMap.lon) {
      sampled.sort((a, b) => {
        const latDiff = Number(a[fieldMap.lat]) - Number(b[fieldMap.lat]);
        return latDiff !== 0 ? latDiff : Number(a[fieldMap.lon]) - Number(b[fieldMap.lon]);
      });
    }

    return sampled.map((row, i) => {
      const params = oceanParams(row, fieldMap);
      const sstVal = fieldMap.sst ? row[fieldMap.sst] : null;
      let velVal = fieldMap.vel ? row[fieldMap.vel] : null;
      if (velVal === null && fieldMap.u && fieldMap.v) {
        const u = Number(row[fieldMap.u]) || 0;
        const v = Number(row[fieldMap.v]) || 0;
        velVal = Math.sqrt(u * u + v * v).toFixed(3);
      }

      const latVal = fieldMap.lat ? Number(row[fieldMap.lat]) : null;
      const lonVal = fieldMap.lon ? Number(row[fieldMap.lon]) : null;

      return {
        index: i,
        startTime: i * 0.35,
        ...params,
        lat: isNaN(latVal) ? null : latVal,
        lon: isNaN(lonVal) ? null : lonVal,
        label: (latVal !== null && lonVal !== null) ? `${latVal.toFixed(1)}°, ${lonVal.toFixed(1)}°` : `Ocean Point #${i + 1}`,
        rawSST: sstVal,
        rawVel: velVal,
        rawUnitsSST: '°C',
        rawUnitsVel: 'm/s'
      };
    });
  }

  return {
    nightLightsParams,
    buildNightLightsSequence,
    oceanParams,
    buildOceanSequence
  };
})();

if (typeof window !== 'undefined') {
  window.SoundProfiles = SoundProfiles;
}
