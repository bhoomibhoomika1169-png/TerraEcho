/**
 * visualizer.js
 * Real-time audio waveform oscilloscope and frequency spectrum analyzer.
 * Renders high-frame-rate visualizations onto HTML5 canvas elements via Web Audio AnalyserNode.
 * ES6 Module.
 */

import { AudioEngine } from './audio-engine.js';

export const Visualizer = (() => {

  let _waveCanvas = null;
  let _waveCtx = null;
  let _specCanvas = null;
  let _specCtx = null;
  let _animId = null;
  let _isActive = false;

  let _timeData = null;
  let _freqData = null;

  function init(waveCanvas, specCanvas) {
    _waveCanvas = waveCanvas;
    _specCanvas = specCanvas;
    if (_waveCanvas) _waveCtx = _waveCanvas.getContext('2d');
    if (_specCanvas) _specCtx = _specCanvas.getContext('2d');

    _drawIdle();
  }

  function start() {
    _isActive = true;
    if (!_animId) _loop();
  }

  function stop() {
    _isActive = false;
    if (_animId) {
      cancelAnimationFrame(_animId);
      _animId = null;
    }
    _drawIdle();
  }

  function _loop() {
    if (!_isActive) return;
    _draw();
    _animId = requestAnimationFrame(_loop);
  }

  function _draw() {
    const engine = window.AudioEngine || AudioEngine;
    const analyser = engine.getAnalyser();

    if (!analyser) {
      _drawIdle();
      return;
    }

    if (!_timeData || _timeData.length !== analyser.frequencyBinCount) {
      _timeData = new Uint8Array(analyser.frequencyBinCount);
      _freqData = new Uint8Array(analyser.frequencyBinCount);
    }

    analyser.getByteTimeDomainData(_timeData);
    analyser.getByteFrequencyData(_freqData);

    _drawWaveform(_timeData);
    _drawSpectrum(_freqData);
  }

  function _drawWaveform(data) {
    if (!_waveCtx || !_waveCanvas) return;
    const c = _waveCtx;
    const W = _waveCanvas.width;
    const H = _waveCanvas.height;

    c.clearRect(0, 0, W, H);

    // Subtle coordinate grid line
    c.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, H / 2);
    c.lineTo(W, H / 2);
    c.stroke();

    // Waveform curve with glowing cyan-blue gradient
    const grad = c.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#00e5ff');
    grad.addColorStop(0.5, '#76ff03');
    grad.addColorStop(1, '#9b59ff');

    c.strokeStyle = grad;
    c.lineWidth = 2.5;
    c.shadowColor = '#00e5ff';
    c.shadowBlur = 10;
    c.beginPath();

    const sliceWidth = W / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0; // 0..2, mid = 1.0
      const y = (v * H) / 2;

      if (i === 0) {
        c.moveTo(x, y);
      } else {
        c.lineTo(x, y);
      }
      x += sliceWidth;
    }

    c.lineTo(W, H / 2);
    c.stroke();
    c.shadowBlur = 0;
  }

  function _drawSpectrum(data) {
    if (!_specCtx || !_specCanvas) return;
    const c = _specCtx;
    const W = _specCanvas.width;
    const H = _specCanvas.height;

    c.clearRect(0, 0, W, H);

    // Frequency spectrum bars (low frequencies to high frequencies)
    const numBars = 48;
    const barWidth = (W / numBars) - 1.5;
    const step = Math.floor(data.length / (numBars * 2.2));

    for (let i = 0; i < numBars; i++) {
      const val = data[i * step] / 255.0; // 0..1
      const barHeight = Math.max(2, val * (H - 8));
      const x = i * (barWidth + 1.5) + 1;
      const y = H - barHeight;

      const grad = c.createLinearGradient(0, H, 0, y);
      grad.addColorStop(0, 'rgba(26, 107, 255, 0.6)');
      grad.addColorStop(0.6, 'rgba(0, 229, 255, 0.85)');
      grad.addColorStop(1, '#9b59ff');

      c.fillStyle = grad;
      c.fillRect(x, y, barWidth, barHeight);

      // Bright peak indicator line on top of each bar
      if (val > 0.05) {
        c.fillStyle = '#ffffff';
        c.fillRect(x, Math.max(0, y - 2), barWidth, 1.5);
      }
    }
  }

  function _drawIdle() {
    if (_waveCtx && _waveCanvas) {
      const c = _waveCtx;
      const W = _waveCanvas.width;
      const H = _waveCanvas.height;
      c.clearRect(0, 0, W, H);

      c.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(0, H / 2);
      c.lineTo(W, H / 2);
      c.stroke();
    }

    if (_specCtx && _specCanvas) {
      const c = _specCtx;
      const W = _specCanvas.width;
      const H = _specCanvas.height;
      c.clearRect(0, 0, W, H);

      const numBars = 48;
      const barWidth = (W / numBars) - 1.5;
      c.fillStyle = 'rgba(0, 229, 255, 0.12)';
      for (let i = 0; i < numBars; i++) {
        const x = i * (barWidth + 1.5) + 1;
        c.fillRect(x, H - 3, barWidth, 3);
      }
    }
  }

  return {
    init,
    start,
    stop
  };
})();

if (typeof window !== 'undefined') {
  window.Visualizer = Visualizer;
}
