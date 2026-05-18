/**
 * Risk Analysis Page
 * Full AI risk report with NEWS2 breakdown, SHAP-style attribution,
 * trajectory predictions, and protocol-mapped recommendations.
 */

import { getPatients } from '../simulation/vitals-simulator.js';
import { computeNEWS2, PARAMETER_LABELS } from '../engine/news2.js';
import { generateAnalysis } from '../engine/ai-layer.js';
import { generateRecommendations } from '../engine/recommendations.js';
import { COMORBIDITIES, NORMAL_RANGES } from '../data/clinical-knowledge.js';

export function renderRiskAnalysis(container, patientId, navigate) {
  const patients = getPatients();
  const patient = patients.find(p => p.id === patientId);
  if (!patient) {
    container.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>Patient not found</p></div>';
    return;
  }

  // Run the full analysis
  const analysis = generateAnalysis(patient);
  const recommendations = generateRecommendations(patient);
  const { news2, trends, trajectory, comorbidityRisk, attribution } = analysis;

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

  const riskClass = getRiskClass(news2.aggregate);
  const maxBarWidth = Math.max(...attribution.features.map(f => f.percentage));

  container.innerHTML = `
    <div class="breadcrumb">
      <a id="back-to-dashboard">Dashboard</a>
      <span>›</span>
      <a id="back-to-patient">${patient.name}</a>
      <span>›</span>
      <span>AI Risk Analysis</span>
    </div>

    <div class="page-header">
      <h2>⚡ AI Risk Analysis Report</h2>
      <p>Generated ${new Date().toLocaleTimeString()} — ${patient.name} (${patient.mrn})</p>
    </div>

    <!-- AI Summary -->
    <div class="summary-block mb-6 animate-fade-in">
      <div style="font-size: var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent-cyan); margin-bottom: var(--space-3);">🤖 AI-Generated Clinical Summary</div>
      ${analysis.summary}
    </div>

    <div class="grid-2 mb-6">
      <!-- NEWS2 Breakdown Table -->
      <div class="card animate-fade-in">
        <div class="card-header">
          <span class="card-title">NEWS2 Score Breakdown</span>
          <span class="risk-badge ${riskClass}">${news2.riskLevel.riskLevel}</span>
        </div>
        <p style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-4);">
          SpO₂ assessed on ${news2.spo2Scale}
        </p>
        <table class="news2-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Normal Range</th>
              <th style="text-align:center">Score</th>
              <th>Matched Threshold</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(news2.parameterScores).map(([key, ps]) => {
              const labels = {
                respiratoryRate: { label: 'Respiratory Rate', value: patient.currentVitals.respiratoryRate, unit: '/min' },
                spo2: { label: 'SpO₂', value: patient.currentVitals.spo2, unit: '%' },
                supplementalOxygen: { label: 'Supplemental O₂', value: patient.supplementalOxygen ? 'Yes' : 'No', unit: '' },
                systolicBP: { label: 'Systolic BP', value: patient.currentVitals.systolicBP, unit: 'mmHg' },
                heartRate: { label: 'Heart Rate', value: patient.currentVitals.heartRate, unit: 'bpm' },
                consciousness: { label: 'Consciousness', value: patient.consciousness, unit: '' },
                temperature: { label: 'Temperature', value: patient.currentVitals.temperature, unit: '°C' },
              };
              const info = labels[key];
              const ref = NORMAL_RANGES[key === 'spo2' ? 'spo2' : key];
              const displayVal = typeof info.value === 'number' ? Math.round(info.value * 10) / 10 : info.value;
              return `
              <tr>
                <td>${info.label}</td>
                <td class="value-cell" style="color: ${ps.score > 0 ? getScoreColor(ps.score) : 'var(--text-primary)'};">
                  ${displayVal} ${info.unit}
                </td>
                <td class="range-cell">${ref ? `${ref.min}–${ref.max} ${ref.unit}` : '—'}</td>
                <td class="score-cell">
                  <span class="score-dot s${ps.score}"></span>
                  ${ps.score}
                </td>
                <td class="range-cell">${ps.matchedRange?.label || 'Normal'}</td>
              </tr>`;
            }).join('')}
            <tr class="total-row">
              <td colspan="3">Aggregate NEWS2 Score</td>
              <td class="score-cell" style="color: ${getScoreColor(news2.aggregate)}; font-size: var(--text-xl);">
                ${news2.aggregate}
              </td>
              <td>/20${news2.hasRedScore ? ' ⚑ Red flag' : ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Feature Attribution (SHAP-like) -->
      <div class="card animate-fade-in" style="animation-delay: 0.1s;">
        <div class="card-header">
          <span class="card-title">Feature Attribution — Risk Drivers</span>
        </div>
        <p style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-5);">
          Contribution of each factor to overall risk score (SHAP-style analysis)
        </p>
        ${attribution.features.map(f => {
          const barColor = f.totalContribution >= 2 ? 'var(--risk-high)'
            : f.totalContribution >= 1 ? 'var(--risk-medium)'
            : 'var(--accent-cyan)';
          const barWidth = Math.max(8, (f.percentage / maxBarWidth) * 100);
          return `
          <div class="waterfall-bar">
            <div class="waterfall-label">${f.name}</div>
            <div class="waterfall-track">
              <div class="waterfall-fill" style="width: ${barWidth}%; background: ${barColor};">
                ${f.percentage}%
              </div>
            </div>
            <div class="waterfall-value">${f.currentValue}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Comorbidity-Adjusted Risk -->
    <div class="card mb-6 animate-fade-in" style="animation-delay: 0.15s;">
      <div class="card-header">
        <span class="card-title">Comorbidity-Adjusted Risk Assessment</span>
        <span class="mono" style="font-size: var(--text-lg); color: var(--risk-high); font-weight: 700;">
          ${comorbidityRisk.riskPercentage}% effective risk
        </span>
      </div>
      <div class="grid-3" style="margin-top: var(--space-4);">
        <div>
          <div style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-2);">Base NEWS2 Score</div>
          <div class="mono" style="font-size: var(--text-xl); font-weight: 700;">${comorbidityRisk.baseScore}/20</div>
        </div>
        <div>
          <div style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-2);">Comorbidity Multiplier</div>
          <div class="mono" style="font-size: var(--text-xl); font-weight: 700; color: var(--risk-medium);">×${comorbidityRisk.comorbidityMultiplier}</div>
          <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-1);">
            ${comorbidityRisk.appliedWeights.map(w => `${w.name} (+${w.contribution})`).join(', ')}
          </div>
        </div>
        <div>
          <div style="font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; margin-bottom: var(--space-2);">Age Adjustment</div>
          <div class="mono" style="font-size: var(--text-xl); font-weight: 700; color: var(--accent-purple);">×${comorbidityRisk.ageMultiplier}</div>
          ${comorbidityRisk.ageNote ? `<div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-1);">${comorbidityRisk.ageNote}</div>` : ''}
        </div>
      </div>
      <!-- Risk bar -->
      <div style="margin-top: var(--space-6); height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
        <div style="height: 100%; width: ${comorbidityRisk.riskPercentage}%; border-radius: 4px; transition: width 0.6s ease;
          background: linear-gradient(90deg, var(--risk-low) 0%, var(--risk-medium) 50%, var(--risk-high) 100%);"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size: var(--text-xs); color: var(--text-muted); margin-top: var(--space-1);">
        <span>Low</span><span>Medium</span><span>High</span><span>Critical</span>
      </div>
    </div>

    <!-- Trajectory Predictions -->
    ${Object.keys(trajectory).length > 0 ? `
    <div class="card mb-6 animate-fade-in" style="animation-delay: 0.2s;">
      <div class="card-header">
        <span class="card-title">⚠ Trajectory Predictions</span>
        <span style="font-size: var(--text-xs); color: var(--risk-medium);">Based on ${Object.keys(trends).length} vital sign trends</span>
      </div>
      <p style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-4);">
        If current trends continue, these thresholds are projected to be crossed:
      </p>
      ${Object.entries(trajectory).map(([key, predictions]) => {
        const trend = trends[key];
        return predictions.map(pred => `
          <div class="trajectory-card">
            <div class="trajectory-header">
              <span class="trajectory-vital">${trend?.label || key}</span>
              <span class="trajectory-time" style="color: ${pred.hoursUntilCrossing <= 3 ? 'var(--risk-high)' : 'var(--risk-medium)'};">
                ~${pred.hoursUntilCrossing}h from now
              </span>
            </div>
            <div class="trajectory-desc">
              → Will cross <strong>${pred.label}</strong> (${pred.threshold} ${NORMAL_RANGES[key]?.unit || ''})
              — Confidence: ${(pred.confidence * 100).toFixed(0)}%
            </div>
          </div>
        `).join('');
      }).join('')}
    </div>` : ''}

    <!-- Recommendations -->
    <div class="card animate-fade-in" style="animation-delay: 0.25s;">
      <div class="card-header">
        <span class="card-title">Clinical Recommendations</span>
        <span style="font-size: var(--text-xs); color: var(--text-muted);">${recommendations.length} actions</span>
      </div>
      <p style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-5);">
        Each recommendation is derived from the patient's current NEWS2 score, vital sign patterns, and clinical context — not generic templates.
      </p>
      <div class="animate-stagger">
        ${recommendations.map(rec => `
          <div class="rec-card ${rec.priority}">
            <div class="rec-header">
              <span class="rec-icon">${rec.icon}</span>
              <span class="rec-title">${rec.title}</span>
              <span class="risk-badge ${rec.priority}" style="font-size: 0.6rem;">${rec.priority}</span>
            </div>
            <div class="rec-source">Source: ${rec.source}</div>
            <ul class="rec-actions">
              ${rec.details.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Navigation
  container.querySelector('#back-to-dashboard')?.addEventListener('click', () => navigate('dashboard'));
  container.querySelector('#back-to-patient')?.addEventListener('click', () => navigate('patient', patientId));
}
