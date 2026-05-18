/**
 * Ward Dashboard Page
 * Shows all patients sorted by NEWS2 risk with live-updating scores.
 */

import { getPatients } from '../simulation/vitals-simulator.js';
import { computeNEWS2 } from '../engine/news2.js';
import { analyzeTrends } from '../engine/ai-layer.js';
import { drawSparkline } from '../components/charts.js';
import { COMORBIDITIES } from '../data/clinical-knowledge.js';

export function renderDashboard(container, navigate) {
  const patients = getPatients();

  // Compute scores for all patients
  const patientData = patients.map(p => {
    const news2 = computeNEWS2(p);
    const trends = analyzeTrends(p, 6);
    return { patient: p, news2, trends };
  });

  // Sort by aggregate score (highest first)
  patientData.sort((a, b) => b.news2.aggregate - a.news2.aggregate);

  function getRiskClass(aggregate, hasRedScore) {
    if (aggregate >= 7) return 'critical';
    if (aggregate >= 5) return 'high';
    if (hasRedScore || aggregate >= 3) return 'medium';
    return 'low';
  }

  function getScoreColor(aggregate) {
    if (aggregate >= 7) return '#ef4444';
    if (aggregate >= 5) return '#f97316';
    if (aggregate >= 3) return '#fbbf24';
    return '#22c55e';
  }

  // Summary stats
  const criticalCount = patientData.filter(d => d.news2.aggregate >= 7).length;
  const mediumCount = patientData.filter(d => d.news2.aggregate >= 5 && d.news2.aggregate < 7).length;
  const lowCount = patientData.filter(d => d.news2.aggregate < 5).length;
  const avgScore = Math.round(patientData.reduce((s, d) => s + d.news2.aggregate, 0) / patientData.length * 10) / 10;

  container.innerHTML = `
    <div class="page-header">
      <h2>Ward Dashboard</h2>
      <p>Real-time patient monitoring with NEWS2 clinical scoring</p>
    </div>

    <div class="grid-2 grid-2--stats mb-6 animate-stagger" style="grid-template-columns: repeat(4, 1fr);">
      <div class="card" style="text-align: center;">
        <div class="score-large" style="color: var(--risk-critical);">${criticalCount}</div>
        <div class="card-title mt-4">High Risk (≥7)</div>
      </div>
      <div class="card" style="text-align: center;">
        <div class="score-large" style="color: var(--risk-medium);">${mediumCount}</div>
        <div class="card-title mt-4">Medium Risk (5–6)</div>
      </div>
      <div class="card" style="text-align: center;">
        <div class="score-large" style="color: var(--risk-low);">${lowCount}</div>
        <div class="card-title mt-4">Low Risk (<5)</div>
      </div>
      <div class="card" style="text-align: center;">
        <div class="score-large" style="color: var(--accent-cyan);">${avgScore}</div>
        <div class="card-title mt-4">Ward Avg Score</div>
      </div>
    </div>

    <div class="card animate-fade-in">
      <div class="card-header">
        <span class="card-title">Patient Overview — Sorted by Risk</span>
        <span class="card-title">${patients.length} patients</span>
      </div>
      <table class="data-table" id="patient-table">
        <thead>
          <tr>
            <th style="width:50px"></th>
            <th>Patient</th>
            <th>Ward</th>
            <th style="width:100px">NEWS2</th>
            <th style="width:110px">Risk Level</th>
            <th style="width:80px">HR</th>
            <th style="width:80px">SpO₂</th>
            <th style="width:80px">BP</th>
            <th style="width:80px">Temp</th>
            <th style="width:120px">HR Trend (6h)</th>
          </tr>
        </thead>
        <tbody>
          ${patientData.map((d, idx) => {
            const p = d.patient;
            const riskClass = getRiskClass(d.news2.aggregate, d.news2.hasRedScore);
            const initials = p.name.split(' ').map(n => n[0]).join('');
            const comorbList = p.comorbidities.map(c => COMORBIDITIES[c]?.name || c).join(', ');
            return `
            <tr data-patient-id="${p.id}" class="animate-fade-in" style="animation-delay: ${idx * 0.05}s">
              <td>
                <div class="patient-avatar" style="border-color: ${getScoreColor(d.news2.aggregate)}">${initials}</div>
              </td>
              <td>
                <div class="patient-name">${p.name}</div>
                <div class="patient-meta">${p.age}${p.gender === 'Male' ? 'M' : 'F'} — ${p.mrn}</div>
              </td>
              <td>
                <div style="font-size: var(--text-sm);">${p.ward}</div>
                <div class="patient-meta">${p.bed}</div>
              </td>
              <td>
                <span class="score-large" style="color: ${getScoreColor(d.news2.aggregate)}">
                  ${d.news2.aggregate}
                </span>
                <span class="text-muted" style="font-size: var(--text-xs);">/20</span>
              </td>
              <td>
                <span class="risk-badge ${riskClass}">
                  ${d.news2.hasRedScore ? '⚑ ' : ''}${d.news2.riskLevel.riskLevel}
                </span>
              </td>
              <td class="mono">${Math.round(p.currentVitals.heartRate)}</td>
              <td class="mono">${Math.round(p.currentVitals.spo2)}%</td>
              <td class="mono">${Math.round(p.currentVitals.systolicBP)}/${Math.round(p.currentVitals.diastolicBP)}</td>
              <td class="mono">${p.currentVitals.temperature.toFixed(1)}°</td>
              <td>
                <canvas class="sparkline-canvas" data-patient-idx="${idx}" width="100" height="30" style="width:100px;height:30px;"></canvas>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Draw sparklines
  requestAnimationFrame(() => {
    patientData.forEach((d, idx) => {
      const canvas = container.querySelector(`canvas[data-patient-idx="${idx}"]`);
      if (canvas && d.patient.vitalHistory.heartRate) {
        const last12 = d.patient.vitalHistory.heartRate.slice(-24);
        const scoreColor = getScoreColor(d.news2.aggregate);
        drawSparkline(canvas, last12, scoreColor);
      }
    });
  });

  // Click handlers for patient rows
  container.querySelectorAll('tr[data-patient-id]').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.dataset.patientId;
      navigate('patient', id);
    });
  });
}

/**
 * Update dashboard vitals in-place (called on simulation tick).
 */
export function updateDashboard(container) {
  const patients = getPatients();
  const rows = container.querySelectorAll('tr[data-patient-id]');

  rows.forEach(row => {
    const id = row.dataset.patientId;
    const patient = patients.find(p => p.id === id);
    if (!patient) return;

    const news2 = computeNEWS2(patient);
    const cells = row.querySelectorAll('td');

    // Update NEWS2 score
    if (cells[3]) {
      const scoreEl = cells[3].querySelector('.score-large');
      if (scoreEl) {
        scoreEl.textContent = news2.aggregate;
        const color = news2.aggregate >= 7 ? '#ef4444' : news2.aggregate >= 5 ? '#f97316' : news2.aggregate >= 3 ? '#fbbf24' : '#22c55e';
        scoreEl.style.color = color;
      }
    }

    // Update vitals
    if (cells[5]) cells[5].textContent = Math.round(patient.currentVitals.heartRate);
    if (cells[6]) cells[6].textContent = Math.round(patient.currentVitals.spo2) + '%';
    if (cells[7]) cells[7].textContent = `${Math.round(patient.currentVitals.systolicBP)}/${Math.round(patient.currentVitals.diastolicBP)}`;
    if (cells[8]) cells[8].textContent = patient.currentVitals.temperature.toFixed(1) + '°';
  });
}
