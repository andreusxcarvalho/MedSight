/**
 * Clinical Sandbox Page
 * Allows manual input of vitals to demonstrate the AI engine dynamically.
 */

import { computeNEWS2 } from '../engine/news2.js';
import { generateAnalysis } from '../engine/ai-layer.js';
import { generateRecommendations } from '../engine/recommendations.js';
import { COMORBIDITIES } from '../data/clinical-knowledge.js';

export function renderSandbox(container, navigate) {
  // We'll render the form first. If the user submits, we render the analysis block below it.
  
  container.innerHTML = `
    <div class="page-header">
      <h2>🧪 Clinical Sandbox</h2>
      <p>Manually input patient data to test the deterministic AI engine.</p>
    </div>

    <div class="grid-2">
      <div class="card animate-fade-in">
        <div class="card-header">
          <span class="card-title">Vital Signs Input</span>
        </div>
        
        <div class="grid-2" style="gap: var(--space-4);">
          <div class="form-group">
            <label class="form-label">Heart Rate (bpm)</label>
            <input type="number" id="sb-hr" class="form-input" value="80" min="0" max="300">
          </div>
          <div class="form-group">
            <label class="form-label">SpO₂ (%)</label>
            <input type="number" id="sb-spo2" class="form-input" value="98" min="0" max="100">
          </div>
          <div class="form-group">
            <label class="form-label">Respiratory Rate (/min)</label>
            <input type="number" id="sb-rr" class="form-input" value="16" min="0" max="60">
          </div>
          <div class="form-group">
            <label class="form-label">Systolic BP (mmHg)</label>
            <input type="number" id="sb-sys" class="form-input" value="120" min="0" max="300">
          </div>
          <div class="form-group">
            <label class="form-label">Temperature (°C)</label>
            <input type="number" id="sb-temp" class="form-input" value="36.8" step="0.1" min="30" max="45">
          </div>
          <div class="form-group">
            <label class="form-label">Consciousness</label>
            <select id="sb-acvpu" class="form-input">
              <option value="A">Alert</option>
              <option value="C">Confusion</option>
              <option value="V">Voice</option>
              <option value="P">Pain</option>
              <option value="U">Unresponsive</option>
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-top: var(--space-4);">
          <label class="checkbox-label">
            <input type="checkbox" id="sb-supp-o2"> Patient is on Supplemental Oxygen
          </label>
        </div>

        <div class="card-title mt-6 mb-4">Patient Profile & Comorbidities</div>
        <div class="grid-2" style="gap: var(--space-4); margin-bottom: var(--space-4);">
          <div class="form-group">
            <label class="form-label">Age</label>
            <input type="number" id="sb-age" class="form-input" value="65" min="1" max="120">
          </div>
        </div>
        
        <div class="checkbox-grid mb-6">
          ${Object.entries(COMORBIDITIES).map(([key, cm]) => `
            <label class="checkbox-label">
              <input type="checkbox" class="sb-comorb" value="${key}"> ${cm.icon} ${cm.name}
            </label>
          `).join('')}
        </div>

        <button id="sb-analyze-btn" class="sim-btn" style="width: 100%; padding: 12px; font-size: 1rem; background: var(--accent-cyan-bg); border-color: var(--accent-cyan); color: var(--accent-cyan); cursor: pointer;">
          ⚡ Run Clinical Analysis
        </button>
      </div>

      <!-- Results Container -->
      <div id="sb-results-container">
        <div class="empty-state animate-fade-in">
          <div class="icon">📈</div>
          <p>Awaiting data input...</p>
          <p style="font-size: var(--text-xs); margin-top: 10px;">The AI uses deterministic algorithms (not LLMs) to ensure clinical reliability.</p>
        </div>
      </div>
    </div>
  `;

  // Attach event listener
  document.getElementById('sb-analyze-btn').addEventListener('click', () => {
    runAnalysis(container);
  });
}

function runAnalysis(container) {
  const resultsDiv = document.getElementById('sb-results-container');
  
  // 1. Gather Data
  const hr = parseFloat(document.getElementById('sb-hr').value) || 80;
  const spo2 = parseFloat(document.getElementById('sb-spo2').value) || 98;
  const rr = parseFloat(document.getElementById('sb-rr').value) || 16;
  const sys = parseFloat(document.getElementById('sb-sys').value) || 120;
  const temp = parseFloat(document.getElementById('sb-temp').value) || 36.8;
  const acvpu = document.getElementById('sb-acvpu').value;
  const suppO2 = document.getElementById('sb-supp-o2').checked;
  const age = parseInt(document.getElementById('sb-age').value) || 65;
  
  const comorbidities = Array.from(document.querySelectorAll('.sb-comorb:checked')).map(cb => cb.value);

  // Create a synthetic patient object formatted for our engine
  const mockPatient = {
    id: 'sandbox-1',
    name: 'Sandbox Patient',
    age: age,
    comorbidities: comorbidities,
    supplementalOxygen: suppO2,
    consciousness: acvpu,
    currentVitals: {
      heartRate: hr,
      spo2: spo2,
      respiratoryRate: rr,
      systolicBP: sys,
      diastolicBP: 80,
      temperature: temp
    },
    vitalHistory: {
      heartRate: [], spo2: [], respiratoryRate: [], systolicBP: []
    }
  };

  // 2. Run Engine
  const analysis = generateAnalysis(mockPatient);
  const recommendations = generateRecommendations(mockPatient);
  const { news2, comorbidityRisk, attribution } = analysis;

  function getRiskClass(aggregate) {
    if (aggregate >= 7) return 'critical';
    if (aggregate >= 5) return 'high';
    if (aggregate >= 3) return 'medium';
    return 'low';
  }

  const maxBarWidth = Math.max(...attribution.features.map(f => f.percentage), 1);

  // 3. Render Results
  resultsDiv.innerHTML = `
    <div class="card animate-fade-in">
      <div class="card-header">
        <span class="card-title">Live AI Analysis</span>
        <span class="risk-badge ${getRiskClass(news2.aggregate)}">${news2.riskLevel.riskLevel}</span>
      </div>
      
      <div style="font-size: var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:var(--accent-cyan); margin-bottom: var(--space-3);">🤖 Deterministic Clinical Summary</div>
      <div style="font-size: var(--text-sm); line-height: 1.6; color: var(--text-secondary); margin-bottom: var(--space-6);">
        Patient is evaluated at a NEWS2 score of <strong style="color:var(--text-primary);">${news2.aggregate}</strong>. 
        Adjusting for age and ${comorbidities.length} comorbidities, the effective risk multiplier is <strong style="color:var(--risk-medium);">×${comorbidityRisk.comorbidityMultiplier}</strong>.
      </div>

      <div class="card-title mb-4">Feature Attribution (SHAP-style)</div>
      <div class="mb-6">
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

      <div class="card-title mb-4">Clinical Protocol Recommendations</div>
      <div>
        ${recommendations.map(rec => `
          <div class="rec-card ${rec.priority}">
            <div class="rec-header">
              <span class="rec-icon">${rec.icon}</span>
              <span class="rec-title">${rec.title}</span>
              <span class="risk-badge ${rec.priority}" style="font-size: 0.6rem;">${rec.priority}</span>
            </div>
            <ul class="rec-actions">
              ${rec.details.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
        ${recommendations.length === 0 ? '<p class="text-muted">No specific interventions required. Continue routine monitoring.</p>' : ''}
      </div>
    </div>
  `;
}
