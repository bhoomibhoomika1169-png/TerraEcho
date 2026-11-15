/**
 * controls.js
 * User interface controller wiring all events:
 * - Single-Page Navigation routing with smooth transitions
 * - Mobile responsive navigation menu
 * - Drag-and-drop NASA dataset upload zones with progress updates
 * - Professional audio player transport, timeline, volume, speed, and mute
 * - Dedicated sonification experience buttons
 * - 3D Earth Explorer globe controls (zoom in/out/reset/dataset selection)
 * - Ocean visualization mode switcher (Currents vs Temperature)
 * - Field mapping dialog
 * ES6 Module.
 */

import { DatasetAdapter } from '../data/dataset-adapter.js';
import { AudioEngine } from '../audio/audio-engine.js';

export const Controls = (() => {

  function init() {
    _initNav();
    _initUploadZones();
    _initPlayerControls();
    _initExperienceSoundBtns();
    _initExplorerControls();
    _initOceanTabs();
    _initModal();
  }

  /* ── 1. Navigation Routing ──────────────────────────────────── */
  function _initNav() {
    const validSections = [
      'home', 'explorer', 'nightlights', 'ocean',
      'upload', 'player', 'science', 'sources', 'about'
    ];

    document.querySelectorAll('.nav-link, .footer-link, [data-nav], [data-section], [data-dataset]').forEach(el => {
      el.addEventListener('click', (e) => {
        // If clicking a child inside a card that has its own link, allow natural propagation
        const target = el.dataset.nav || el.dataset.section || el.dataset.dataset || el.getAttribute('href')?.replace('#', '');
        if (target && validSections.includes(target)) {
          e.preventDefault();
          if (window.TerraApp) {
            window.TerraApp.navigateTo(target);
          }
        }
      });
    });

    // Mobile Hamburger Menu
    const hamburger = document.getElementById('nav-hamburger');
    const navLinks  = document.getElementById('nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', String(isOpen));
      });
      navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ── 2. Dataset Upload Zones ────────────────────────────────── */
  function _initUploadZones() {
    _setupUploadZone({
      dropZoneId:             'nl-drop-zone',
      fileInputId:            'nl-file-input',
      progressPanelId:        'nl-progress-panel',
      progressBarId:          'nl-progress-bar',
      progressLabelId:        'nl-progress-label',
      validationReportId:     'nl-validation-report',
      validationStatusId:     'nl-validation-status',
      validationDetailsId:    'nl-validation-details',
      fieldMappingId:         'nl-field-mapping',
      fieldMappingControlsId: 'nl-field-mapping-controls',
      applyMappingBtnId:      'nl-apply-mapping',
      badgeId:                'nl-dataset-badge',
      sampleBtnId:            'nl-load-sample-btn',
      datasetType:            'nightlights'
    });

    _setupUploadZone({
      dropZoneId:             'oc-drop-zone',
      fileInputId:            'oc-file-input',
      progressPanelId:        'oc-progress-panel',
      progressBarId:          'oc-progress-bar',
      progressLabelId:        'oc-progress-label',
      validationReportId:     'oc-validation-report',
      validationStatusId:     'oc-validation-status',
      validationDetailsId:    'oc-validation-details',
      fieldMappingId:         'oc-field-mapping',
      fieldMappingControlsId: 'oc-field-mapping-controls',
      applyMappingBtnId:      'oc-apply-mapping',
      badgeId:                'oc-dataset-badge',
      sampleBtnId:            'oc-load-sample-btn',
      datasetType:            'ocean'
    });
  }

  function _setupUploadZone(cfg) {
    const dropZone        = document.getElementById(cfg.dropZoneId);
    const fileInput       = document.getElementById(cfg.fileInputId);
    const progressPanel   = document.getElementById(cfg.progressPanelId);
    const progressBar     = document.getElementById(cfg.progressBarId);
    const progressLabel   = document.getElementById(cfg.progressLabelId);
    const validationReport= document.getElementById(cfg.validationReportId);
    const validationStatus= document.getElementById(cfg.validationStatusId);
    const validationDetails = document.getElementById(cfg.validationDetailsId);
    const fieldMappingEl  = document.getElementById(cfg.fieldMappingId);
    const fieldMappingControls = document.getElementById(cfg.fieldMappingControlsId) || (fieldMappingEl ? fieldMappingEl.querySelector('div') : null);
    const applyMappingBtn = document.getElementById(cfg.applyMappingBtnId);
    const badge           = document.getElementById(cfg.badgeId);
    const sampleBtn       = document.getElementById(cfg.sampleBtnId);

    if (sampleBtn) {
      sampleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const adapter = window.DatasetAdapter || DatasetAdapter;
        const adapterRefs = {
          progressPanel,
          progressBar,
          progressLabel,
          validationReport,
          validationStatus,
          validationDetails,
          fieldMapping: fieldMappingEl,
          fieldMappingControls,
          applyMappingBtn,
          badge
        };
        adapter.loadSampleDataset(
          cfg.datasetType,
          adapterRefs,
          (result) => {
            if (window.TerraApp) window.TerraApp.onDatasetLoaded(cfg.datasetType, result);
          },
          (errMsg) => {
            console.warn(`[TerraEcho] Sample dataset notice (${cfg.datasetType}):`, errMsg);
          }
        );
      });
    }

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) _dispatchUpload(file, cfg, { progressPanel, progressBar, progressLabel, validationReport, validationStatus, validationDetails, fieldMappingEl, fieldMappingControls, applyMappingBtn, badge });
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) _dispatchUpload(file, cfg, { progressPanel, progressBar, progressLabel, validationReport, validationStatus, validationDetails, fieldMappingEl, fieldMappingControls, applyMappingBtn, badge });
    });
  }

  function _dispatchUpload(file, cfg, uiRefs) {
    const adapter = window.DatasetAdapter || DatasetAdapter;
    const adapterRefs = {
      progressPanel:        uiRefs.progressPanel,
      progressBar:          uiRefs.progressBar,
      progressLabel:        uiRefs.progressLabel,
      validationReport:     uiRefs.validationReport,
      validationStatus:     uiRefs.validationStatus,
      validationDetails:    uiRefs.validationDetails,
      fieldMapping:         uiRefs.fieldMappingEl,
      fieldMappingControls: uiRefs.fieldMappingControls,
      applyMappingBtn:      uiRefs.applyMappingBtn,
      badge:                uiRefs.badge
    };

    adapter.processUpload(
      file,
      cfg.datasetType,
      adapterRefs,
      (result) => {
        if (window.TerraApp) {
          window.TerraApp.onDatasetLoaded(cfg.datasetType, result);
        }
      },
      (errMsg) => {
        console.warn(`[TerraEcho] Upload validation notice (${cfg.datasetType}):`, errMsg);
      }
    );
  }

  /* ── 3. Audio Player Transport Controls ─────────────────────── */
  function _initPlayerControls() {
    const playBtn      = document.getElementById('player-play');
    const stopBtn      = document.getElementById('player-stop');
    const prevBtn      = document.getElementById('player-prev');
    const nextBtn      = document.getElementById('player-next');
    const muteBtn      = document.getElementById('player-mute');
    const volumeSlider = document.getElementById('player-volume');
    const speedSelect  = document.getElementById('player-speed');
    const timeline     = document.getElementById('player-timeline');
    const loadDsBtn    = document.getElementById('player-load-dataset');

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (window.TerraApp) window.TerraApp.playerTogglePlay();
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (window.TerraApp) window.TerraApp.playerStop();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (window.TerraApp) window.TerraApp.playerSeekRelative(-10);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (window.TerraApp) window.TerraApp.playerSeekRelative(10);
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const engine = window.AudioEngine || AudioEngine;
        const muted = engine.toggleMute();
        muteBtn.textContent = muted ? '🔇' : '🔊';
        muteBtn.title = muted ? 'Unmute' : 'Mute';
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', () => {
        const engine = window.AudioEngine || AudioEngine;
        engine.setVolume(parseFloat(volumeSlider.value));
      });
    }

    if (speedSelect) {
      speedSelect.addEventListener('change', () => {
        const engine = window.AudioEngine || AudioEngine;
        engine.setSpeed(parseFloat(speedSelect.value));
      });
    }

    if (timeline) {
      timeline.addEventListener('input', () => {
        const engine = window.AudioEngine || AudioEngine;
        const idx = Math.round((timeline.value / 100) * Math.max(0, engine.getSequenceLen() - 1));
        if (window.TerraApp) window.TerraApp.playerSeekTo(idx);
      });
    }

    if (loadDsBtn) {
      loadDsBtn.addEventListener('click', () => {
        if (window.TerraApp) window.TerraApp.playerLoadSelectedDataset();
      });
    }

    document.querySelectorAll('input[name="player-dataset"]').forEach(r => {
      r.addEventListener('change', () => {
        if (window.TerraApp) {
          window.TerraApp.playerUpdateDatasetStatus();
          window.TerraApp.playerLoadSelectedDataset();
        }
      });
    });
  }

  /* ── 4. Dedicated Experience Sound Triggers ─────────────────── */
  function _initExperienceSoundBtns() {
    const nlPlay = document.getElementById('nl-play-btn');
    const nlStop = document.getElementById('nl-stop-btn');
    const ocPlay = document.getElementById('oc-play-btn');
    const ocStop = document.getElementById('oc-stop-btn');

    if (nlPlay) nlPlay.addEventListener('click', () => { if (window.TerraApp) window.TerraApp.playNightLights(); });
    if (nlStop) nlStop.addEventListener('click', () => { if (window.TerraApp) window.TerraApp.stopAudio(); });
    if (ocPlay) ocPlay.addEventListener('click', () => { if (window.TerraApp) window.TerraApp.playOcean(); });
    if (ocStop) ocStop.addEventListener('click', () => { if (window.TerraApp) window.TerraApp.stopAudio(); });
  }

  /* ── 5. Explorer Globe Controls ─────────────────────────────── */
  function _initExplorerControls() {
    const zoomIn   = document.getElementById('globe-zoom-in');
    const zoomOut  = document.getElementById('globe-zoom-out');
    const reset    = document.getElementById('globe-reset');
    const dsRadios = document.querySelectorAll('input[name="explorer-dataset"]');

    if (zoomIn)  zoomIn.addEventListener('click',  () => { if (window.EarthViewer) window.EarthViewer.zoomExplorer(0.25); });
    if (zoomOut) zoomOut.addEventListener('click', () => { if (window.EarthViewer) window.EarthViewer.zoomExplorer(-0.25); });
    if (reset)   reset.addEventListener('click',   () => { if (window.EarthViewer) window.EarthViewer.resetExplorerView(); });

    dsRadios.forEach(r => {
      r.addEventListener('change', () => {
        const type = r.value;
        const result = window.TerraApp ? window.TerraApp.state.datasets[type] : null;
        const statusEl = document.getElementById('explorer-dataset-status');

        if (result && window.EarthViewer) {
          window.EarthViewer.setExplorerDataset(type, result.rows, result.fieldMap, result.statsMap);
          if (window.TelemetryHUD) window.TelemetryHUD.setDataset(type === 'nightlights' ? 'Night Lights' : 'Ocean');
          if (statusEl) statusEl.innerHTML = `<span class="status-dot status-ok" aria-hidden="true"></span> Dataset loaded`;
        } else {
          if (window.EarthViewer) window.EarthViewer.setExplorerDataset(null, null, null, null);
          if (window.TelemetryHUD) window.TelemetryHUD.clear();
          if (statusEl) statusEl.innerHTML = `<span class="status-dot status-waiting" aria-hidden="true"></span> Awaiting verified NASA dataset`;
        }
      });
    });
  }

  /* ── 6. Ocean Visualization Mode Switcher ───────────────────── */
  function _initOceanTabs() {
    document.querySelectorAll('.viz-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.viz-tab').forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const mode = tab.dataset.tab;
        if (window.ExperienceVisualizer) window.ExperienceVisualizer.setOceanMode(mode);
      });
    });
  }

  /* ── 7. Modal Dialog ────────────────────────────────────────── */
  function _initModal() {
    const modal = document.getElementById('field-mapping-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const backdrop = document.getElementById('modal-backdrop');

    function close() {
      if (modal) modal.hidden = true;
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
  }

  return { init };
})();

if (typeof window !== 'undefined') {
  window.Controls = Controls;
}
