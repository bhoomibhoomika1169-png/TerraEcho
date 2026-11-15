/**
 * app.js
 * TerraEcho — Primary Application Orchestrator.
 * Coordinates Single-Page Application (SPA) routing, dataset memory states,
 * canvas visualizers, telemetry readouts, and Web Audio API playback.
 * Enforces strict scientific synchronization between audio and visuals.
 * ES6 Module.
 */

import { EarthViewer, ExperienceVisualizer, TelemetryHUD } from './earth-viewer.js';
import { AudioEngine } from './audio/audio-engine.js';
import { SoundProfiles } from './audio/sound-profiles.js';
import { Visualizer } from './audio/visualizer.js';
import { DatasetAdapter } from './data/dataset-adapter.js';
import { DataValidator } from './data/data-validator.js';
import { DataNormalizer } from './data/data-normalizer.js';
import { Controls } from './ui/controls.js';

export const TerraApp = (() => {

  /* ── 1. Application Global State ────────────────────────────── */
  const state = {
    currentSection: 'home',
    datasets: {
      nightlights: null, // { rows, schema, fieldMap, statsMap, fileName }
      ocean:       null  // { rows, schema, fieldMap, statsMap, fileName }
    }
  };

  const SECTIONS = [
    'home',
    'explorer',
    'nightlights',
    'ocean',
    'upload',
    'player',
    'science',
    'sources',
    'about'
  ];

  let _playerIntervalId = null;

  /* ── 2. Initialization ──────────────────────────────────────── */
  function init() {
    TelemetryHUD.init();
    Controls.init();

    _initCanvases();

    const hash = window.location.hash.replace('#', '');
    navigateTo(SECTIONS.includes(hash) ? hash : 'home');

    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#', '');
      if (SECTIONS.includes(h)) navigateTo(h);
    });

    if (typeof window !== 'undefined') {
      window.__TERRA_ECHO_INITIALIZED__ = true;
    }

    // Auto-initialize authentic NASA streams so the site is instantly alive on first load
    _autoLoadInitialStreams();

    console.log('%c[TerraEcho]%c Earth’s Living Soundscape Initialized · NASA Space Apps 2026', 'color:#00e5ff;font-weight:bold;', 'color:#8aaccc;');
  }

  async function _autoLoadInitialStreams() {
    try {
      const adapter = (typeof window !== 'undefined' && window.DatasetAdapter) || DatasetAdapter;
      if (!adapter || !adapter.loadDefaultStream) return;

      const nl = await adapter.loadDefaultStream('nightlights');
      if (nl) onDatasetLoaded('nightlights', nl);

      const oc = await adapter.loadDefaultStream('ocean');
      if (oc) onDatasetLoaded('ocean', oc);

      const expRadio = document.querySelector('input[name="explorer-dataset"]:checked');
      const expType = expRadio ? expRadio.value : 'nightlights';
      const expData = state.datasets[expType];
      if (expData && typeof EarthViewer !== 'undefined' && EarthViewer.setExplorerDataset) {
        EarthViewer.setExplorerDataset(expType, expData.rows, expData.fieldMap, expData.statsMap);
        const expStatus = document.getElementById('explorer-dataset-status');
        if (expStatus) {
          expStatus.innerHTML = `<span class="status-dot status-ok" aria-hidden="true"></span> NASA ${expType === 'nightlights' ? 'Black Marble' : 'OSCAR'} dataset active`;
        }
      }

      playerUpdateDatasetStatus();
      playerLoadSelectedDataset();
    } catch (err) {
      console.warn('[TerraEcho] Auto-stream initialization info:', err);
    }
  }

  function _initCanvases() {
    const starCanvas = document.getElementById('star-canvas');
    if (starCanvas) EarthViewer.initStarCanvas(starCanvas);

    const homeGlobe = document.getElementById('home-globe');
    if (homeGlobe) EarthViewer.initHomeGlobe(homeGlobe);

    const expGlobe = document.getElementById('explorer-globe');
    if (expGlobe) {
      EarthViewer.initExplorerGlobe(expGlobe, (lat, lon, val, units) => {
        const dsType = document.querySelector('input[name="explorer-dataset"]:checked')?.value;
        const dsName = dsType === 'nightlights' ? 'Night Lights' : 'Ocean';
        TelemetryHUD.update(lat, lon, val, units, dsName);
      });
    }

    const nlCanvas = document.getElementById('nl-canvas');
    if (nlCanvas) ExperienceVisualizer.initNightLights(nlCanvas);

    const ocCanvas = document.getElementById('oc-canvas');
    if (ocCanvas) ExperienceVisualizer.initOcean(ocCanvas);

    const waveCanvas = document.getElementById('waveform-canvas');
    const specCanvas = document.getElementById('spectrum-canvas');
    if (waveCanvas && specCanvas) Visualizer.init(waveCanvas, specCanvas);
  }

  /* ── 3. Section Navigation ──────────────────────────────────── */
  function navigateTo(sectionId) {
    if (!SECTIONS.includes(sectionId)) return;

    SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.remove('active');
        el.hidden = true;
      }
    });

    const target = document.getElementById(sectionId);
    if (target) {
      target.hidden = false;
      target.classList.add('active');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.section === sectionId || link.getAttribute('href') === `#${sectionId}`);
    });

    state.currentSection = sectionId;
    window.location.hash = sectionId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    _onSectionMount(sectionId);
  }

  function _onSectionMount(sectionId) {
    if (sectionId === 'explorer') {
      const selectedDs = document.querySelector('input[name="explorer-dataset"]:checked')?.value;
      const result = selectedDs ? state.datasets[selectedDs] : null;
      if (result) {
        EarthViewer.setExplorerDataset(selectedDs, result.rows, result.fieldMap, result.statsMap);
        const statusEl = document.getElementById('explorer-dataset-status');
        if (statusEl) statusEl.innerHTML = `<span class="status-dot status-ok" aria-hidden="true"></span> Dataset loaded`;
      }
    } else if (sectionId === 'player') {
      playerUpdateDatasetStatus();
    }
  }

  /* ── 4. Dataset Ingestion Callbacks ─────────────────────────── */
  function onDatasetLoaded(datasetType, result) {
    state.datasets[datasetType] = result;

    if (datasetType === 'nightlights') {
      ExperienceVisualizer.loadNightLightsData(result.rows, result.fieldMap, result.statsMap);
      _enableSoundBtns('nl', true);
      _updatePlayerDsStatus();
    } else if (datasetType === 'ocean') {
      ExperienceVisualizer.loadOceanData(result.rows, result.fieldMap, result.statsMap);
      _enableSoundBtns('oc', true);
      _updatePlayerDsStatus();
    }

    const selectedDs = document.querySelector('input[name="explorer-dataset"]:checked')?.value;
    if (selectedDs === datasetType) {
      EarthViewer.setExplorerDataset(datasetType, result.rows, result.fieldMap, result.statsMap);
      const statusEl = document.getElementById('explorer-dataset-status');
      if (statusEl) statusEl.innerHTML = `<span class="status-dot status-ok" aria-hidden="true"></span> Dataset loaded`;
    }

    if (datasetType === 'nightlights' && result.fieldMap.time) {
      const timePanel = document.getElementById('time-selector-content');
      if (timePanel) {
        const years = [...new Set(result.rows.map(r => r[result.fieldMap.time]).filter(Boolean))].sort();
        timePanel.innerHTML = `
          <label class="timeline-label" for="explorer-time-select">Observation Year</label>
          <select id="explorer-time-select" class="speed-select" aria-label="Select observation year" style="width:100%;margin-top:6px;">
            ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
          </select>`;
        document.getElementById('explorer-time-select')?.addEventListener('change', (e) => {
          const yr = Number(e.target.value);
          const filtered = result.rows.filter(r => Number(r[result.fieldMap.time]) === yr);
          EarthViewer.setExplorerDataset(datasetType, filtered, result.fieldMap, result.statsMap);
        });
      }
    }

    // Update experience badge to verified
    const prefix = datasetType === 'nightlights' ? 'nl' : 'oc';
    const badge = document.getElementById(`${prefix}-dataset-badge`);
    if (badge) {
      badge.className = 'data-badge data-badge--verified';
      badge.innerHTML = '<span class="badge-dot-sm" aria-hidden="true"></span> Verified NASA dataset';
    }

    // Populate upload validation card
    const report = document.getElementById(`${prefix}-validation-report`);
    const status = document.getElementById(`${prefix}-validation-status`);
    const details = document.getElementById(`${prefix}-validation-details`);
    if (report && status && details && result.schema) {
      const validator = (typeof window !== 'undefined' && window.DataValidator) || DataValidator;
      if (validator && validator.renderMetadataCardHTML) {
        status.innerHTML = validator.renderMetadataCardHTML(datasetType, result.schema, result.fileName, result.fieldMap, result.rows);
        details.innerHTML = validator.renderSummaryHTML(result.schema);
        report.hidden = false;
      }
    }

    _updateHeroSystemStatus();
    console.log(`[TerraEcho] Verified NASA ${datasetType} dataset activated with ${result.rows.length.toLocaleString()} records.`);
  }

  function _enableSoundBtns(prefix, enabled) {
    ['play-btn', 'stop-btn'].forEach(suffix => {
      const btn = document.getElementById(`${prefix}-${suffix}`);
      if (btn) btn.disabled = !enabled;
    });
  }

  function _updateHeroSystemStatus() {
    const nlLoaded = !!state.datasets.nightlights;
    const ocLoaded = !!state.datasets.ocean;
    const heroStatus = document.getElementById('hero-system-status');
    if (!heroStatus) return;

    if (nlLoaded && ocLoaded) {
      heroStatus.innerHTML = '<span class="status-dot status-ok"></span> All Scientific Streams Active';
    } else if (nlLoaded || ocLoaded) {
      heroStatus.innerHTML = `<span class="status-dot status-ok"></span> ${nlLoaded ? 'Night Lights' : 'Ocean'} Stream Active`;
    } else {
      heroStatus.innerHTML = '<span class="status-dot status-waiting"></span> System Ready · Awaiting NASA Datasets';
    }
  }

  /* ── 5. Audio Player Coordination & Real-Time Synchronization ── */
  function playerTogglePlay() {
    if (AudioEngine.isPlaying()) {
      AudioEngine.pause();
      _setPlayerIcon('▶');
      _setPlayerStatus('Paused');
      _stopPlayerInterval();
      Visualizer.stop();
    } else {
      const loaded = _ensureSequenceLoaded();
      if (!loaded) return;
      AudioEngine.play();
      _setPlayerIcon('⏸');
      _setPlayerStatus('Sonifying NASA Observations');
      _startPlayerInterval();
      Visualizer.start();
    }
    _updatePlayerBtnState();
  }

  function playerStop() {
    AudioEngine.stop();
    _setPlayerIcon('▶');
    _setPlayerStatus('Stopped');
    _stopPlayerInterval();
    Visualizer.stop();
    _updatePlayerTimeline(0, 1);
    _updatePlayerBtnState();

    EarthViewer.clearActiveObservation();
    ExperienceVisualizer.clearActiveObservation();

    const obs = document.getElementById('player-observation');
    if (obs) obs.textContent = '—';
  }

  function playerSeekRelative(delta) {
    const idx = Math.max(0, Math.min(AudioEngine.getSequenceLen() - 1, AudioEngine.getCurrentIndex() + delta));
    AudioEngine.seekTo(idx);
  }

  function playerSeekTo(idx) {
    AudioEngine.seekTo(idx);
  }

  function playerLoadSelectedDataset() {
    const selectedType = document.querySelector('input[name="player-dataset"]:checked')?.value;
    if (!selectedType) return;
    const result = state.datasets[selectedType];
    if (!result) {
      _setPlayerStatus('No validated dataset. Upload via Data Upload section.');
      return;
    }

    let sequence;
    if (selectedType === 'nightlights') {
      sequence = SoundProfiles.buildNightLightsSequence(result.rows, result.fieldMap);
    } else {
      sequence = SoundProfiles.buildOceanSequence(result.rows, result.fieldMap);
    }

    if (sequence.length === 0) {
      _setPlayerStatus('Could not construct sequence from dataset.');
      return;
    }

    AudioEngine.loadSequence(sequence, selectedType, {
      onTimeUpdate: (idx, total, event) => {
        _handleObservationSync(selectedType, idx, total, event);
      },
      onPlaybackEnd: () => {
        _setPlayerIcon('▶');
        _setPlayerStatus('Playback Completed');
        _stopPlayerInterval();
        Visualizer.stop();
        EarthViewer.clearActiveObservation();
        ExperienceVisualizer.clearActiveObservation();
        _updatePlayerBtnState();
      }
    });

    const dot = document.getElementById('player-indicator-dot');
    const name = document.getElementById('player-dataset-name');
    if (dot) dot.className = `indicator-dot ${selectedType === 'nightlights' ? 'active-nl' : 'active-oc'}`;
    if (name) name.textContent = selectedType === 'nightlights' ? 'Night Lights Sonification' : 'Ocean Currents Sonification';

    const playBtn = document.getElementById('player-play');
    const stopBtn = document.getElementById('player-stop');
    if (playBtn) playBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = false;

    const totalTime = sequence.length > 0 ? (sequence[sequence.length - 1].startTime + sequence[sequence.length - 1].duration) : 0;
    _setText('player-time-total', _formatTime(totalTime));
    _setPlayerStatus(`${sequence.length} observations sequenced. Press Play.`);
  }

  function playerUpdateDatasetStatus() {
    const selectedType = document.querySelector('input[name="player-dataset"]:checked')?.value;
    _updatePlayerDsStatus();
    const loadBtn = document.getElementById('player-load-dataset');
    if (loadBtn) {
      loadBtn.disabled = !(selectedType && state.datasets[selectedType]);
    }
    const noteEl = document.getElementById('player-note');
    if (noteEl) {
      if (selectedType && state.datasets[selectedType]) {
        noteEl.textContent = `✅ ${selectedType === 'nightlights' ? 'Night Lights' : 'Ocean'} dataset verified. Click ▶ Play to listen.`;
        noteEl.style.color = 'var(--status-ok)';
      } else {
        noteEl.textContent = 'Upload and validate a NASA dataset in the Upload section to enable playback.';
        noteEl.style.color = '';
      }
    }
  }

  function _updatePlayerDsStatus() {
    const nlStatus = document.getElementById('player-nl-status');
    const ocStatus = document.getElementById('player-oc-status');
    if (nlStatus) {
      nlStatus.textContent = state.datasets.nightlights ? 'Verified ✅' : 'Not loaded';
      nlStatus.className = state.datasets.nightlights ? 'ds-status-sm loaded' : 'ds-status-sm';
    }
    if (ocStatus) {
      ocStatus.textContent = state.datasets.ocean ? 'Verified ✅' : 'Not loaded';
      ocStatus.className = state.datasets.ocean ? 'ds-status-sm loaded' : 'ds-status-sm';
    }
    const selectedType = document.querySelector('input[name="player-dataset"]:checked')?.value;
    const loadBtn = document.getElementById('player-load-dataset');
    if (loadBtn) loadBtn.disabled = !(selectedType && state.datasets[selectedType]);
  }

  function _ensureSequenceLoaded() {
    if (AudioEngine.getSequenceLen() === 0) {
      playerLoadSelectedDataset();
    }
    if (AudioEngine.getSequenceLen() === 0) {
      _setPlayerStatus('No sequence loaded. Select a verified dataset first.');
      return false;
    }
    return true;
  }

  function _startPlayerInterval() {
    _stopPlayerInterval();
    _playerIntervalId = setInterval(() => {
      if (!AudioEngine.isPlaying()) return;
      const idx   = AudioEngine.getCurrentIndex();
      const total = AudioEngine.getSequenceLen();
      _updatePlayerTimeline(idx, total);
    }, 200);
  }

  function _stopPlayerInterval() {
    if (_playerIntervalId) {
      clearInterval(_playerIntervalId);
      _playerIntervalId = null;
    }
  }

  function _updatePlayerTimeline(idx, total) {
    const timeline = document.getElementById('player-timeline');
    if (timeline) {
      timeline.value = total > 1 ? (idx / (total - 1)) * 100 : 0;
    }
    const timeEl = document.getElementById('player-time-current');
    if (timeEl) {
      const seq = AudioEngine.getSequenceLen();
      if (seq > 0 && idx < seq) {
        timeEl.textContent = `${idx + 1}/${seq}`;
      }
    }
  }

  function _updatePlayerObservation(event) {
    const obs = document.getElementById('player-observation');
    if (!obs || !event) return;
    const dsType = AudioEngine.getActiveDataset();
    if (dsType === 'nightlights') {
      const val = event.rawValue !== null && event.rawValue !== undefined
        ? ` | ${Number(event.rawValue).toFixed(3)} ${event.rawUnits}`
        : '';
      obs.textContent = `${event.label}${val}`;
    } else {
      const sstStr = event.rawSST !== null ? ` SST: ${Number(event.rawSST).toFixed(2)}${event.rawUnitsSST}` : '';
      const velStr = event.rawVel !== null ? ` | Vel: ${Number(event.rawVel).toFixed(3)}${event.rawUnitsVel}` : '';
      obs.textContent = `${event.label}${sstStr}${velStr}`;
    }
  }

  function _updatePlayerBtnState() {
    const playBtn = document.getElementById('player-play');
    if (playBtn) playBtn.disabled = AudioEngine.getSequenceLen() === 0;
    const stopBtn = document.getElementById('player-stop');
    if (stopBtn) stopBtn.disabled = AudioEngine.getSequenceLen() === 0;
  }

  /* ── 6. Synchronized Multi-Modal Observer Hook ──────────────── */
  function _handleObservationSync(selectedType, idx, total, event) {
    _updatePlayerTimeline(idx, total);
    _updatePlayerObservation(event);

    const dsName = selectedType === 'nightlights' ? 'Night Lights' : 'Ocean';
    const rawVal = (event.rawValue !== null && event.rawValue !== undefined)
      ? event.rawValue
      : (event.rawSST !== null ? event.rawSST : event.rawVel);
    const rawUnits = event.rawUnits || event.rawUnitsSST || event.rawUnitsVel || '';

    // 1. Synchronize Telemetry HUD
    TelemetryHUD.update(event.lat, event.lon, rawVal, rawUnits, dsName);

    // 2. Synchronize 3D Earth Globe Active Focal Target
    EarthViewer.setActiveObservation(event.lat, event.lon, rawVal, rawUnits);

    // 3. Synchronize Experience Canvas Focal Beacon & Historical Year Slider
    ExperienceVisualizer.setActiveObservation(selectedType, idx, event);
  }

  /* ── 7. Experience Level Direct Sonification ─────────────────── */
  function playNightLights() {
    const result = state.datasets.nightlights;
    if (!result) {
      alert('Awaiting verified NASA Changing Nightlights dataset. Please load or upload a validated dataset.');
      return;
    }

    if (AudioEngine.getActiveDataset() === 'nightlights') {
      if (AudioEngine.isPlaying()) {
        AudioEngine.pause();
        _setNLBtnsState(false, true);
        Visualizer.stop();
        return;
      } else if (AudioEngine.isPaused()) {
        AudioEngine.play();
        _setNLBtnsState(true);
        Visualizer.start();
        return;
      }
    }

    const sequence = SoundProfiles.buildNightLightsSequence(result.rows, result.fieldMap);
    AudioEngine.loadSequence(sequence, 'nightlights', {
      onTimeUpdate: (idx, total, event) => {
        _handleObservationSync('nightlights', idx, total, event);
      },
      onPlaybackEnd: () => {
        _setNLBtnsState(false);
        EarthViewer.clearActiveObservation();
        ExperienceVisualizer.clearActiveObservation();
        Visualizer.stop();
      }
    });
    AudioEngine.play();
    _setNLBtnsState(true);
    Visualizer.start();
  }

  function playOcean() {
    const result = state.datasets.ocean;
    if (!result) {
      alert('Awaiting verified NASA Ocean Currents & Temperature dataset. Please load or upload a validated dataset.');
      return;
    }

    if (AudioEngine.getActiveDataset() === 'ocean') {
      if (AudioEngine.isPlaying()) {
        AudioEngine.pause();
        _setOCBtnsState(false, true);
        Visualizer.stop();
        return;
      } else if (AudioEngine.isPaused()) {
        AudioEngine.play();
        _setOCBtnsState(true);
        Visualizer.start();
        return;
      }
    }

    const sequence = SoundProfiles.buildOceanSequence(result.rows, result.fieldMap);
    AudioEngine.loadSequence(sequence, 'ocean', {
      onTimeUpdate: (idx, total, event) => {
        _handleObservationSync('ocean', idx, total, event);
      },
      onPlaybackEnd: () => {
        _setOCBtnsState(false);
        EarthViewer.clearActiveObservation();
        ExperienceVisualizer.clearActiveObservation();
        Visualizer.stop();
      }
    });
    AudioEngine.play();
    _setOCBtnsState(true);
    Visualizer.start();
  }

  function stopAudio() {
    AudioEngine.stop();
    Visualizer.stop();
    EarthViewer.clearActiveObservation();
    ExperienceVisualizer.clearActiveObservation();
    _setNLBtnsState(false);
    _setOCBtnsState(false);
    _setPlayerIcon('▶');
    _setPlayerStatus('Stopped');
  }

  function _setNLBtnsState(playing, paused = false) {
    const play = document.getElementById('nl-play-btn');
    const stop = document.getElementById('nl-stop-btn');
    if (play) play.textContent = playing ? '⏸ Pause' : (paused ? '▶ Resume' : '▶ Play Sonification');
    if (stop) stop.disabled = (!playing && !paused);
  }

  function _setOCBtnsState(playing, paused = false) {
    const play = document.getElementById('oc-play-btn');
    const stop = document.getElementById('oc-stop-btn');
    if (play) play.textContent = playing ? '⏸ Pause' : (paused ? '▶ Resume' : '▶ Play Sonification');
    if (stop) stop.disabled = (!playing && !paused);
  }

  /* ── Helpers ────────────────────────────────────────────────── */
  function _setPlayerIcon(icon) {
    const el = document.getElementById('player-play-icon');
    if (el) el.textContent = icon;
  }

  function _setPlayerStatus(msg) {
    const el = document.getElementById('player-status');
    if (el) el.textContent = msg;
  }

  function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return {
    state,
    navigateTo,
    onDatasetLoaded,
    playerTogglePlay,
    playerStop,
    playerSeekRelative,
    playerSeekTo,
    playerLoadSelectedDataset,
    playerUpdateDatasetStatus,
    playNightLights,
    playOcean,
    stopAudio
  };
})();

if (typeof window !== 'undefined') {
  window.TerraApp = TerraApp;
}
