/**
 * Main Application Entry Point
 * Wires together routing, simulation, and page rendering.
 */

import './styles/base.css';
import { startSimulation, togglePause, isPausedState, onUpdate } from './simulation/vitals-simulator.js';
import { getPatients } from './simulation/vitals-simulator.js';
import { computeNEWS2 } from './engine/news2.js';
import { renderDashboard, updateDashboard } from './pages/dashboard.js';
import { renderPatientDetail, updatePatientDetail } from './pages/patient-detail.js';
import { renderRiskAnalysis } from './pages/risk-analysis.js';
import { renderSandbox } from './pages/sandbox.js';

// ─── State ──────────────────────────────────────────────────────
let currentPage = 'dashboard';
let currentPatientId = null;

// ─── Navigation ─────────────────────────────────────────────────
function navigate(page, patientId = null) {
  currentPage = page;
  currentPatientId = patientId;
  renderCurrentPage();
  updateNavActiveState();
}

function updateNavActiveState() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === currentPage) {
      item.classList.add('active');
    }
  });
}

// ─── Render ─────────────────────────────────────────────────────
function renderCurrentPage() {
  const main = document.getElementById('main-content');
  if (!main) return;

  main.scrollTop = 0;

  switch (currentPage) {
    case 'dashboard':
      renderDashboard(main, navigate);
      break;
    case 'patient':
      renderPatientDetail(main, currentPatientId, navigate);
      break;
    case 'analysis':
      renderRiskAnalysis(main, currentPatientId, navigate);
      break;
    case 'sandbox':
      renderSandbox(main, navigate);
      break;
    default:
      renderDashboard(main, navigate);
  }
}

// ─── Build App Shell ────────────────────────────────────────────
function buildAppShell() {
  const app = document.getElementById('app');

  // Build patient nav items
  const patients = getPatients();
  const patientNavItems = patients.map(p => {
    const news2 = computeNEWS2(p);
    const scoreColor = news2.aggregate >= 7 ? '#ef4444' : news2.aggregate >= 5 ? '#f97316' : news2.aggregate >= 3 ? '#fbbf24' : '#22c55e';
    return `
      <div class="nav-item" data-page="patient" data-patient-id="${p.id}">
        <span class="nav-icon" style="color: ${scoreColor};">●</span>
        <span>${p.name.split(' ')[1]}</span>
        <span class="mono" style="margin-left:auto; font-size: var(--text-xs); color: ${scoreColor};">${news2.aggregate}</span>
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="app-layout">
      <nav class="sidebar">
        <div class="sidebar-brand">
          <h1>⚡ MedSight</h1>
          <p>Clinical Decision Support</p>
        </div>

        <div class="sidebar-nav">
          <div class="nav-section-label">Overview</div>
          <div class="nav-item active" data-page="dashboard">
            <span class="nav-icon">📊</span>
            <span>Ward Dashboard</span>
          </div>
          <div class="nav-item" data-page="sandbox">
            <span class="nav-icon">🧪</span>
            <span>Clinical Sandbox</span>
          </div>

          <div class="nav-section-label" style="margin-top: var(--space-4);">Patients by Risk</div>
          ${patientNavItems}
        </div>

        <div class="sidebar-footer">
          <div class="sim-controls">
            <div class="sim-indicator" id="sim-dot"></div>
            <span class="sim-label" id="sim-label">Simulation active</span>
            <button class="sim-btn" id="sim-toggle-btn">Pause</button>
          </div>
        </div>
      </nav>

      <main class="main-content" id="main-content">
      </main>
    </div>
  `;

  // Sidebar nav click handlers
  document.querySelectorAll('.nav-item[data-page="dashboard"]').forEach(item => {
    item.addEventListener('click', () => navigate('dashboard'));
  });
  
  document.querySelectorAll('.nav-item[data-page="sandbox"]').forEach(item => {
    item.addEventListener('click', () => navigate('sandbox'));
  });

  document.querySelectorAll('.nav-item[data-patient-id]').forEach(item => {
    item.addEventListener('click', () => {
      navigate('patient', item.dataset.patientId);
    });
  });

  // Simulation toggle
  document.getElementById('sim-toggle-btn')?.addEventListener('click', () => {
    const paused = togglePause();
    const dot = document.getElementById('sim-dot');
    const label = document.getElementById('sim-label');
    const btn = document.getElementById('sim-toggle-btn');
    if (dot) dot.classList.toggle('paused', paused);
    if (label) label.textContent = paused ? 'Simulation paused' : 'Simulation active';
    if (btn) btn.textContent = paused ? 'Resume' : 'Pause';
  });
}

// ─── Live Updates ───────────────────────────────────────────────
function setupLiveUpdates() {
  onUpdate(() => {
    const main = document.getElementById('main-content');
    if (!main) return;

    if (currentPage === 'dashboard') {
      updateDashboard(main);
    } else if (currentPage === 'patient' && currentPatientId) {
      updatePatientDetail(main, currentPatientId);
    }
    // Risk analysis is a snapshot — no live updates (intentional)

    // Update sidebar patient scores
    const patients = getPatients();
    document.querySelectorAll('.nav-item[data-patient-id]').forEach(item => {
      const patient = patients.find(p => p.id === item.dataset.patientId);
      if (patient) {
        const news2 = computeNEWS2(patient);
        const scoreEl = item.querySelector('.mono');
        const dotEl = item.querySelector('.nav-icon');
        const color = news2.aggregate >= 7 ? '#ef4444' : news2.aggregate >= 5 ? '#f97316' : news2.aggregate >= 3 ? '#fbbf24' : '#22c55e';
        if (scoreEl) {
          scoreEl.textContent = news2.aggregate;
          scoreEl.style.color = color;
        }
        if (dotEl) dotEl.style.color = color;
      }
    });
  });
}

// ─── Initialize ─────────────────────────────────────────────────
buildAppShell();
renderCurrentPage();
startSimulation();
setupLiveUpdates();
