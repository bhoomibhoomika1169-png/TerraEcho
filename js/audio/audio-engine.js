/**
 * audio-engine.js
 * Core Web Audio API sonification synthesis engine.
 * Handles:
 * - AudioContext lifecycle (initialized strictly upon user gesture)
 * - Master gain, mute, and exponential volume curves
 * - AnalyserNode for real-time oscilloscope waveform & FFT frequency spectrum
 * - Stereo panning (StereoPannerNode) for spatial data mapping
 * - Dynamic filtering (BiquadFilterNode) for ocean temperature timbre
 * - LFO modulation for fluid ocean currents
 * - Smooth exponential and linear ramps to eliminate clicks or sudden jumps
 * - Precise event scheduling with seek, speed, pause, resume, and stop
 * ES6 Module.
 */

export const AudioEngine = (() => {

  let _ctx = null;
  let _masterGain = null;
  let _analyser = null;
  let _compressor = null;
  let _panner = null;
  let _filter = null;
  let _lfo = null;
  let _lfoGain = null;
  let _activeOscillators = [];

  let _sequence = [];
  let _currentIndex = 0;
  let _isPlaying = false;
  let _isPaused = false;
  let _isMuted = false;
  let _volume = 0.7;
  let _speed = 1.0;
  let _activeDataset = null;

  let _scheduledTimeouts = [];
  let _startIndex = 0;

  let _onTimeUpdate = null;
  let _onPlaybackEnd = null;

  function _ensureContext() {
    if (_ctx && _ctx.state !== 'closed') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API is not supported in this browser environment.');
      return;
    }
    _ctx = new AudioContextClass();
    _masterGain = _ctx.createGain();
    _masterGain.gain.setValueAtTime(_isMuted ? 0 : _volume, _ctx.currentTime);

    _analyser = _ctx.createAnalyser();
    _analyser.fftSize = 2048;
    _analyser.smoothingTimeConstant = 0.85;

    // Master Dynamics Compressor to eliminate all harsh clipping and distortions
    _compressor = _ctx.createDynamicsCompressor();
    _compressor.threshold.setValueAtTime(-16, _ctx.currentTime);
    _compressor.knee.setValueAtTime(12, _ctx.currentTime);
    _compressor.ratio.setValueAtTime(3.5, _ctx.currentTime);
    _compressor.attack.setValueAtTime(0.005, _ctx.currentTime);
    _compressor.release.setValueAtTime(0.12, _ctx.currentTime);

    _masterGain.connect(_analyser);
    _analyser.connect(_compressor);
    _compressor.connect(_ctx.destination);
  }

  function resumeContext() {
    if (_ctx && _ctx.state === 'suspended') {
      return _ctx.resume();
    }
    return Promise.resolve();
  }

  /**
   * Load an authentic sonification sequence.
   * @param {Object[]} sequence
   * @param {'nightlights'|'ocean'} datasetType
   * @param {{ onTimeUpdate: Function, onPlaybackEnd: Function }} callbacks
   */
  function loadSequence(sequence, datasetType, callbacks = {}) {
    stop();
    _sequence = sequence || [];
    _activeDataset = datasetType;
    _currentIndex = 0;
    _onTimeUpdate = callbacks.onTimeUpdate || null;
    _onPlaybackEnd = callbacks.onPlaybackEnd || null;
  }

  /**
   * Start or resume sonification.
   * @param {number|null} fromIndex
   */
  function play(fromIndex = null) {
    if (!_sequence || _sequence.length === 0) return;
    _ensureContext();
    resumeContext();

    if (_isPaused && fromIndex === null) {
      _isPaused = false;
      _isPlaying = true;
      _startFromIndex(_currentIndex);
      return;
    }

    stop();
    _isPlaying = true;
    _isPaused = false;
    _startIndex = fromIndex !== null ? Math.max(0, Math.min(fromIndex, _sequence.length - 1)) : 0;
    _currentIndex = _startIndex;
    _startFromIndex(_currentIndex);
  }

  function pause() {
    if (!_isPlaying) return;
    _clearScheduled();
    _stopCurrentOscillator(0.04);
    _isPlaying = false;
    _isPaused = true;
  }

  function stop() {
    _clearScheduled();
    _stopCurrentOscillator(0.04);
    _isPlaying = false;
    _isPaused = false;
    _currentIndex = 0;
  }

  function seekTo(index) {
    if (index < 0 || index >= _sequence.length) return;
    if (_isPlaying) {
      _clearScheduled();
      _stopCurrentOscillator(0.04);
      _currentIndex = index;
      _startFromIndex(index);
    } else {
      _currentIndex = index;
    }
  }

  function _startFromIndex(startIdx) {
    if (!_ctx || !_sequence.length) return;
    _scheduleEvents(startIdx);
  }

  function _scheduleEvents(fromIdx) {
    const remaining = _sequence.slice(fromIdx);
    const baseOffset = fromIdx > 0 ? _sequence[fromIdx].startTime : 0;

    remaining.forEach((event, i) => {
      const delay = (event.startTime - baseOffset) / _speed;
      const tid = setTimeout(() => {
        if (!_isPlaying) return;
        _currentIndex = fromIdx + i;
        _playEvent(event);
        if (_onTimeUpdate) _onTimeUpdate(_currentIndex, _sequence.length, event);
      }, delay * 1000);
      _scheduledTimeouts.push(tid);
    });

    const lastEvent = remaining[remaining.length - 1];
    const totalDuration = (lastEvent.startTime - baseOffset + lastEvent.duration) / _speed;
    const endTid = setTimeout(() => {
      if (!_isPlaying) return;
      _isPlaying = false;
      _currentIndex = 0;
      if (_onPlaybackEnd) _onPlaybackEnd();
    }, (totalDuration + 0.1) * 1000);
    _scheduledTimeouts.push(endTid);
  }

  function _clearScheduled() {
    _scheduledTimeouts.forEach(tid => clearTimeout(tid));
    _scheduledTimeouts = [];
  }

  let _activeVoices = [];

  function _playEvent(event) {
    if (!_ctx) return;
    _stopCurrentOscillator(0.03);

    const now = _ctx.currentTime;
    const dur = Math.max(0.12, (event.duration || 0.5) / _speed);
    const targetFreq = Math.max(20, Math.min(18000, event.frequency || 440));
    const peakGain = Math.max(0.001, Math.min(1.0, event.gain || 0.3));

    // Multi-oscillator warm harmonic pad synthesis:
    // Osc 1: Primary fundamental
    const osc1 = _ctx.createOscillator();
    osc1.type = event.waveType || 'sine';
    osc1.frequency.setValueAtTime(targetFreq, now);

    const oscGain1 = _ctx.createGain();
    oscGain1.gain.setValueAtTime(0.72, now);
    osc1.connect(oscGain1);

    // Osc 2: Harmonic overtone / sub-octave layer for rich ambient body
    const osc2 = _ctx.createOscillator();
    const isOcean = event.filterCutoff !== undefined;
    if (isOcean) {
      // Sub-octave deep ocean warmth (-12 semitones, subtle -4 cents detune)
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(Math.max(20, targetFreq * 0.5), now);
      if (osc2.detune) osc2.detune.setValueAtTime(-4, now);
    } else {
      // Pure celestial overtone harmonic (+7 semitones fifth, subtle +3 cents detune)
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(Math.min(16000, targetFreq * 1.5), now);
      if (osc2.detune) osc2.detune.setValueAtTime(3, now);
    }

    const oscGain2 = _ctx.createGain();
    oscGain2.gain.setValueAtTime(0.28, now);
    osc2.connect(oscGain2);

    // Voice master gain with click-free ADSR envelope
    const voiceGain = _ctx.createGain();
    const attackTime = Math.min(0.07, dur * 0.22);
    const releaseTime = Math.min(0.09, dur * 0.3);

    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(peakGain, now + attackTime);
    voiceGain.gain.setValueAtTime(peakGain, Math.max(now + attackTime, now + dur - releaseTime));
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    oscGain1.connect(voiceGain);
    oscGain2.connect(voiceGain);

    // Stereo Panning
    if (!_panner || _panner.context !== _ctx) {
      if (typeof _ctx.createStereoPanner === 'function') {
        _panner = _ctx.createStereoPanner();
      }
    }

    if (_panner) {
      const panVal = Math.max(-1, Math.min(1, event.pan || 0));
      _panner.pan.setValueAtTime(panVal, now);
    }

    // Dynamic Ocean Filtering (Lowpass Filter representing SST)
    if (isOcean) {
      if (!_filter || _filter.context !== _ctx) {
        _filter = _ctx.createBiquadFilter();
        _filter.type = 'lowpass';
        _filter.Q.setValueAtTime(2.2, now);
      }
      const cutoff = Math.max(80, Math.min(8000, event.filterCutoff));
      _filter.frequency.exponentialRampToValueAtTime(cutoff, now + 0.05);

      // Current dynamics LFO vibrato for fluid oceanic swell
      if (!_lfo || _lfo.context !== _ctx) {
        _lfo = _ctx.createOscillator();
        _lfo.type = 'sine';
        _lfoGain = _ctx.createGain();
        _lfo.connect(_lfoGain);
        _lfo.start();
      }
      try { _lfoGain.connect(osc1.frequency); } catch (_) {}
      _lfo.frequency.setValueAtTime(1.8 + (event.gain || 0.3) * 2.2, now);
      _lfoGain.gain.setValueAtTime(targetFreq * 0.015, now);

      voiceGain.connect(_filter);
      if (_panner) {
        _filter.connect(_panner);
        _panner.connect(_masterGain);
      } else {
        _filter.connect(_masterGain);
      }
    } else {
      if (_panner) {
        voiceGain.connect(_panner);
        _panner.connect(_masterGain);
      } else {
        voiceGain.connect(_masterGain);
      }
    }

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur + 0.03);
    osc2.stop(now + dur + 0.03);

    const voiceRecord = { osc1, osc2, voiceGain };
    _activeVoices.push(voiceRecord);

    const cleanup = () => {
      const idx = _activeVoices.indexOf(voiceRecord);
      if (idx !== -1) _activeVoices.splice(idx, 1);
      try { voiceGain.disconnect(); } catch (_) {}
    };
    osc1.onended = cleanup;
  }

  function _stopCurrentOscillator(fadeTime = 0.03) {
    if (_ctx && _activeVoices.length > 0) {
      const now = _ctx.currentTime;
      _activeVoices.forEach(({ osc1, osc2, voiceGain }) => {
        try {
          voiceGain.gain.cancelScheduledValues(now);
          voiceGain.gain.setValueAtTime(Math.max(0.0001, voiceGain.gain.value), now);
          voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeTime);
          if (osc1) osc1.stop(now + fadeTime + 0.01);
          if (osc2) osc2.stop(now + fadeTime + 0.01);
        } catch (_) {}
      });
      _activeVoices = [];
    }
    if (_lfo) {
      try { _lfo.stop(); } catch (_) {}
      _lfo = null;
      _lfoGain = null;
    }
  }

  function setVolume(vol) {
    _volume = Math.max(0, Math.min(1, vol));
    if (_masterGain && _ctx && !_isMuted) {
      _masterGain.gain.setTargetAtTime(_volume, _ctx.currentTime, 0.04);
    }
  }

  function toggleMute() {
    _isMuted = !_isMuted;
    if (_masterGain && _ctx) {
      _masterGain.gain.setTargetAtTime(_isMuted ? 0 : _volume, _ctx.currentTime, 0.04);
    }
    return _isMuted;
  }

  function setSpeed(spd) {
    _speed = Math.max(0.25, Math.min(4, Number(spd)));
    if (_isPlaying) {
      const idx = _currentIndex;
      _clearScheduled();
      _stopCurrentOscillator(0.04);
      _startFromIndex(idx);
    }
  }

  function getAnalyser()     { return _analyser; }
  function isPlaying()       { return _isPlaying; }
  function isPaused()        { return _isPaused; }
  function isMuted()         { return _isMuted; }
  function getCurrentIndex() { return _currentIndex; }
  function getSequenceLen()  { return _sequence.length; }
  function getActiveDataset(){ return _activeDataset; }
  function getContext()      { return _ctx; }

  function destroy() {
    stop();
    if (_ctx && _ctx.state !== 'closed') {
      _ctx.close();
      _ctx = null;
    }
    _masterGain = null;
    _analyser = null;
    _sequence = [];
  }

  return {
    loadSequence,
    play,
    pause,
    stop,
    seekTo,
    setVolume,
    toggleMute,
    setSpeed,
    resumeContext,
    getAnalyser,
    getContext,
    isPlaying,
    isPaused,
    isMuted,
    getCurrentIndex,
    getSequenceLen,
    getActiveDataset,
    destroy
  };
})();

if (typeof window !== 'undefined') {
  window.AudioEngine = AudioEngine;
}
