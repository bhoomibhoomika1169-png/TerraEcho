/**
 * data-normalizer.js
 * Scientific min-max normalization and sonification coordinate transformations.
 * Original measurements are strictly preserved; normalized values are assigned to helper properties.
 * ES6 Module.
 */

export const DataNormalizer = (() => {

  /**
   * Compute statistical parameters (min, max, mean, count) for a numeric column.
   * @param {Object[]} rows
   * @param {string} field
   * @returns {{ min: number, max: number, mean: number, count: number, missingCount: number, range: number }}
   */
  function computeStats(rows, field) {
    let min = Infinity, max = -Infinity, sum = 0, count = 0, missingCount = 0;

    for (const row of rows) {
      const raw = row[field];
      const v = Number(raw);
      if (raw === null || raw === undefined || raw === '' || isNaN(v)) {
        missingCount++;
        continue;
      }
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      count++;
    }

    return {
      min:          count > 0 ? min : 0,
      max:          count > 0 ? max : 1,
      mean:         count > 0 ? sum / count : 0,
      count,
      missingCount,
      range:        count > 0 ? (max - min) : 1
    };
  }

  /**
   * Normalize a single scientific value using pre-computed dataset statistics.
   * @param {*} rawValue
   * @param {{ min: number, max: number, range: number }} stats
   * @returns {number} 0..1 or NaN
   */
  function normalizeValue(rawValue, stats) {
    const v = Number(rawValue);
    if (isNaN(v)) return NaN;
    if (stats.range === 0) return 0.5; // Uniform distribution
    return Math.max(0, Math.min(1, (v - stats.min) / stats.range));
  }

  /**
   * Add a _norm_<field> property to each row (range [0, 1]).
   * Strictly avoids mutating the raw field data.
   * @param {Object[]} rows
   * @param {string} field
   * @returns {{ rows: Object[], stats: Object }}
   */
  function normalizeField(rows, field) {
    const stats = computeStats(rows, field);
    for (const row of rows) {
      row[`_norm_${field}`] = normalizeValue(row[field], stats);
    }
    return { rows, stats };
  }

  /**
   * Normalize multiple measurement fields across all records.
   * @param {Object[]} rows
   * @param {string[]} fields
   * @returns {{ rows: Object[], statsMap: Object }}
   */
  function normalizeFields(rows, fields) {
    const statsMap = {};
    for (const field of fields) {
      const { stats } = normalizeField(rows, field);
      statsMap[field] = stats;
    }
    return { rows, statsMap };
  }

  /**
   * Map normalized [0, 1] value to acoustic frequency (Hz) using logarithmic psychoacoustic scale.
   * @param {number} norm [0..1]
   * @param {number} fMin minimum Hz
   * @param {number} fMax maximum Hz
   * @returns {number}
   */
  function normToFreq(norm, fMin, fMax) {
    if (isNaN(norm)) return fMin;
    return fMin * Math.pow(fMax / fMin, Math.max(0, Math.min(1, norm)));
  }

  /**
   * Map normalized [0, 1] value to gain/amplitude envelope.
   * @param {number} norm [0..1]
   * @param {number} gMin
   * @param {number} gMax
   * @returns {number}
   */
  function normToGain(norm, gMin = 0.05, gMax = 0.8) {
    if (isNaN(norm)) return gMin;
    return gMin + Math.pow(Math.max(0, Math.min(1, norm)), 0.75) * (gMax - gMin);
  }

  /**
   * Map geographic longitude to stereo spatial pan [-1, 1].
   * @param {number|string|null} lon
   * @returns {number}
   */
  function lonToPan(lon) {
    if (lon === null || lon === undefined || isNaN(Number(lon))) return 0;
    return Math.max(-1, Math.min(1, Number(lon) / 180));
  }

  /**
   * Map zonal (u) and meridional (v) current components to spatial pan [-1, 1].
   * @param {number|string} u
   * @param {number|string} v
   * @returns {number}
   */
  function uvToPan(u, v) {
    const uN = Number(u), vN = Number(v);
    if (isNaN(uN) || isNaN(vN)) return 0;
    const angle = Math.atan2(vN, uN);
    return Math.max(-1, Math.min(1, angle / Math.PI));
  }

  return {
    computeStats,
    normalizeValue,
    normalizeField,
    normalizeFields,
    normToFreq,
    normToGain,
    lonToPan,
    uvToPan
  };
})();

if (typeof window !== 'undefined') {
  window.DataNormalizer = DataNormalizer;
}
