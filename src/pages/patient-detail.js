/**
 * Patient Detail Page
 * Live vitals with NEWS2 sub-scores, trend charts, and patient context.
 */

import { getPatients } from '../simulation/vitals-simulator.js';
import { computeNEWS2, PARAMETER_LABELS, PARAMETER_ICONS } from '../engine/news2.js';
import { analyzeTrends } from '../engine/ai-layer.js';
import { drawTrendChart } from '../components/charts.js';
import { COMORBIDITIES, NORMAL_RANGES } from '../data/clinical-knowledge.js';

export function renderPatientDetail(container, patientId, navigate) {
  const patients = getPatients();
  const patient = patients.find(p => p.id === patientId);
  if (!patient) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>Patient not found</p></div>';
    return;
  }

  const news2 = computeNEWS2(patient);
  const trends = analyzeTrends(patient, 6);

  function getScoreColor(score) {
    if (score >= 3) return 'var(--score-3)';
    if (score >= 2) return 'var(--score-2)';
    if (score >= 1) return 'var(--score-1)';
    return 'var(--score-0)';
  }

  function getRiskClass(aggregate) {
    if (aggregate >= 7) return 'critical';
    if (aggregate >= 5) return 'high';
    if (aggregate >= 3) return 'medium';
    return 'low';
  }

  const initials = patient.name.split(' ').map(n => n[0]).join('');
  const admissionDate = new Date(patient.admissionDate);
  const daysSinceAdmission = Math.round((Date.now() - admissionDate.getTime()) / 86400000);

  const vitalEntries = [
    { key: 'heartRate', paramKey: 'heartRate', label: 'Heart Rate', value: Math.round(patient.currentVitals.heartRate), unit: 'bpm', icon: '❤️' },
    { key: 'spo2', paramKey: 'spo2', label: 'SpO₂', value: Math.round(patient.currentVitals.spo2), unit: '%', icon: '💨' },
    { key: 'systolicBP', paramKey: 'systolicBP', label: 'Blood Pressure', value: `${Math.round(patient.currentVitals.systolicBP)}/${Math.round(patient.currentVitals.diastolicBP)}`, unit: 'mmHg', icon: '🩸' },
    { key: 'respiratoryRate', paramKey: 'respiratoryRate', label: 'Respiratory Rate', value: Math.round(patient.currentVitals.respiratoryRate), unit: '/min', icon: '🫁' },
    { key: 'temperature', paramKey: 'temperature', label: 'Temperature', value: patient.currentVitals.temperature.toFixed(1), unit: '°C', icon: '🌡️' },
    { key: 'consciousness', paramKey: 'consciousness', label: 'Consciousness', value: patient.consciousness, unit: 'ACVPU', icon: '🧠' },
  ];

  container.innerHTML = `
    <div class="breadcrumb">
      <a id="back-to-dashboard">Dashboard</a>
      <span>›</span>
      <span>${patient.name}</span>
    </div>

    <div class="detail-header animate-fade-in">
      <div class="detail-patient-info">
        <div class="detail-avatar">${initials}</div>
        <div>
          <div class="detail-name">${patient.name}</div>
          <div class="detail-meta">${patient.age}${patient.gender === 'Male' ? 'M' : 'F'} — ${patient.ward} — ${patient.bed}</div>
          <div class="detail-meta">MRN: ${patient.mrn} — Admitted ${daysSinceAdmission}d ago</div>
        </div>
      </div>
      <div style="display:flex; gap: var(--space-4); align-items:center;">
        <div class="detail-score-box" style="border-color: ${getScoreColor(news2.aggregate)};">
          <div class="detail-score-value" id="live-score" style="color: ${getScoreColor(news2.aggregate)};">${news2.aggregate}</div>
          <div class="detail-score-label">NEWS2 Score</div>
        </div>
        <div>
          <span class="risk-badge ${getRiskClass(news2.aggregate)}" id="live-risk-badge">
            ${news2.riskLevel.riskLevel}
          </span>
          <div class="detail-meta mt-4">${news2.riskLevel.monitoring}</div>
        </div>
        <button class="sim-btn" id="run-analysis-btn" style="padding: 10px 20px; font-size: var(--text-sm); background: var(--accent-cyan-bg); border-color: var(--accent-cyan); color: var(--accent-cyan);">
          ⚡ Run AI Analysis
        </button>
      </div>
    </div>

    <div class="grid-2 mb-6">
      <div>
        <div class="card-title mb-4">⚡ Live Vitals with NEWS2 Sub-Scores</div>
        <div class="vital-grid animate-stagger" id="vitals-grid">
          ${vitalEntries.map(v => {
            const score = news2.parameterScores[v.paramKey]?.score ?? 0;
            const trend = trends[v.key];
            const trendArrow = trend ? (trend.direction === 'rising' ? '↑' : trend.direction === 'falling' ? '↓' : '→') : '';
            const trendColor = trend?.concern === 'worsening' ? 'var(--risk-high)' : trend?.concern === 'improving' ? 'var(--risk-low)' : 'var(--text-muted)';
            return `
            <div class="vital-card score-${score}" data-vital="${v.key}">
              <div class="vital-label">${v.icon} ${v.label}</div>
              <div class="vital-value" id="vital-${v.key}">${v.value} <span class="vital-unit">${v.unit}</span></div>
              <div class="vital-score">Score: ${score}/3</div>
              ${trend ? `<div class="vital-trend" style="color: ${trendColor};">${trendArrow} ${trend.ratePerHour}</div>` : ''}
            </div>`;
          }).join('')}
        </div>

        <div class="card-title mb-4 mt-6">💊 Current Medications</div>
        <div class="card" style="padding: var(--space-4);">
          ${patient.medications.map(m => `<div style="font-size: var(--text-sm); padding: var(--space-1) 0; color: var(--text-secondary);">• ${m}</div>`).join('')}
        </div>
      </div>

      <div>
        <div class="card-title mb-4">📋 Patient Context</div>
        <div class="card mb-4">
          <div style="font-size: var(--text-xs); font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-3);">Admission Reason</div>
          <div style="font-size: var(--text-sm); color: var(--text-primary);">${patient.admissionReason}</div>
        </div>

        <div class="card mb-4">
          <div style="font-size: var(--text-xs); font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-3);">Comorbidities</div>
          <div>
            ${patient.comorbidities.map(c => {
              const cm = COMORBIDITIES[c];
              return cm ? `<span class="comorbidity-tag">${cm.icon} ${cm.name} <span class="mono" style="color:var(--risk-medium);font-size:var(--text-xs);">×${cm.weight}</span></span>` : '';
            }).join('')}
          </div>
        </div>

        <div class="card mb-4">
          <div style="font-size: var(--text-xs); font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-3);">Lab Results</div>
          <table class="data-table">
            <tbody>
              ${Object.entries(patient.labs).map(([key, lab]) => {
                const ref = NORMAL_RANGES[key];
                const isAbnormal = ref && (lab.value < ref.min || lab.value > ref.max);
                return `<tr>
                  <td>${ref?.label || key}</td>
                  <td class="mono" style="color: ${isAbnormal ? 'var(--risk-high)' : 'var(--text-primary)'};">${lab.value} ${ref?.unit || ''}</td>
                  <td class="text-muted" style="font-size: var(--text-xs);">${ref ? `${ref.min}–${ref.max}` : ''}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div style="font-size: var(--text-xs); font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-3);">Clinical Notes</div>
          <div style="font-size: var(--text-sm); color: var(--text-secondary); line-height: 1.7;">${patient.notes}</div>
        </div>
      </div>
    </div>

    <div class="card-title mb-4">📈 Vital Trends — Last 6 Hours</div>
    <div class="grid-2 mb-6 animate-stagger">
      ${['heartRate', 'spo2', 'systolicBP', 'respiratoryRate'].map(key => {
        const ref = NORMAL_RANGES[key];
        return `
        <div class="chart-container">
          <div style="font-size: var(--text-xs); font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-3);">
            ${ref?.label || key}
          </div>
          <canvas class="chart-canvas" id="chart-${key}" style="width:100%;height:180px;"></canvas>
        </div>`;
      }).join('')}
    </div>
  `;

  // Navigation handlers
  container.querySelector('#back-to-dashboard')?.addEventListener('click', () => navigate('dashboard'));
  container.querySelector('#run-analysis-btn')?.addEventListener('click', () => navigate('analysis', patientId));

  // Draw trend charts
  requestAnimationFrame(() => {
    const chartConfigs = {
      heartRate: { lineColor: '#ef4444', normalRange: { min: 60, max: 100 } },
      spo2: { lineColor: '#22d3ee', normalRange: { min: 95, max: 100 }, minY: 85, maxY: 100 },
      systolicBP: { lineColor: '#a78bfa', normalRange: { min: 110, max: 140 } },
      respiratoryRate: { lineColor: '#34d399', normalRange: { min: 12, max: 20 } },
    };

    for (const [key, config] of Object.entries(chartConfigs)) {
      const canvas = container.querySelector(`#chart-${key}`);
      const history = patient.vitalHistory[key];
      if (canvas && history) {
        const cutoff = Date.now() - 6 * 3600000;
        const windowData = history.filter(p => p.timestamp >= cutoff);
        drawTrendChart(canvas, windowData, config);
      }
    }
  });
}

/**
 * Update patient detail vitals in-place.
 */
export function updatePatientDetail(container, patientId) {
  const patients = getPatients();
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return;

  const news2 = computeNEWS2(patient);

  // Update score
  const scoreEl = container.querySelector('#live-score');
  if (scoreEl) {
    scoreEl.textContent = news2.aggregate;
  }

  // Update vital values
  const vitalUpdates = {
    heartRate: Math.round(patient.currentVitals.heartRate),
    spo2: Math.round(patient.currentVitals.spo2),
    respiratoryRate: Math.round(patient.currentVitals.respiratoryRate),
    temperature: patient.currentVitals.temperature.toFixed(1),
  };

  for (const [key, value] of Object.entries(vitalUpdates)) {
    const el = container.querySelector(`#vital-${key}`);
    if (el) {
      const unit = el.querySelector('.vital-unit')?.outerHTML || '';
      el.innerHTML = `${value} ${unit}`;
    }
  }
}
