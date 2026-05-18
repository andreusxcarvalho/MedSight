/**
 * Recommendation Engine
 * Generates clinically-grounded recommendations based on NEWS2 scores,
 * vital sign patterns, and patient context. Every recommendation is
 * traceable to a clinical protocol or patient-specific finding.
 */

import { CONDITION_RECOMMENDATIONS, COMORBIDITIES, NORMAL_RANGES } from '../data/clinical-knowledge.js';
import { computeNEWS2 } from './news2.js';
import { analyzeTrends, computeComorbidityAdjustedRisk } from './ai-layer.js';

/**
 * Generate prioritized recommendations for a patient.
 * Each recommendation includes its source (protocol, vital-specific, or comorbidity-driven).
 */
export function generateRecommendations(patient) {
  const news2 = computeNEWS2(patient);
  const trends = analyzeTrends(patient, 6);
  const comorbidityRisk = computeComorbidityAdjustedRisk(news2.aggregate, patient);
  const recommendations = [];

  // ─── 1. Protocol-based recommendations (NEWS2 score → response) ─────
  recommendations.push({
    priority: news2.aggregate >= 7 ? 'critical' : news2.aggregate >= 5 ? 'high' : 'medium',
    category: 'Clinical Response Protocol',
    source: `NEWS2 aggregate score: ${news2.aggregate} (${news2.riskLevel.riskLevel})`,
    title: news2.riskLevel.response,
    details: [
      `Monitoring frequency: ${news2.riskLevel.monitoring}`,
      `Escalation: ${news2.riskLevel.escalation}`,
      `Responsible team: ${news2.riskLevel.team}`,
    ],
    icon: news2.aggregate >= 7 ? '🚨' : news2.aggregate >= 5 ? '⚠️' : 'ℹ️',
  });

  // ─── 2. Vital-specific recommendations ──────────────────────────────
  const vitals = patient.currentVitals;
  const ps = news2.parameterScores;

  // SpO2
  if (ps.spo2.score >= 2) {
    const rec = CONDITION_RECOMMENDATIONS.lowSpo2;
    // Modify for COPD patients
    const hasCOPD = patient.comorbidities.some(c => COMORBIDITIES[c]?.useSpo2Scale2);
    recommendations.push({
      priority: ps.spo2.score >= 3 ? 'critical' : 'high',
      category: 'Respiratory',
      source: `SpO₂ ${vitals.spo2}% — ${ps.spo2.matchedRange?.label || 'abnormal'} (NEWS2 score ${ps.spo2.score}/3)`,
      title: rec.condition,
      details: hasCOPD
        ? rec.actions.map(a => a.replace('94–98%', '88–92% (COPD patient — Scale 2 applies)'))
        : rec.actions,
      icon: '🫁',
    });
  }

  // Heart Rate
  if (ps.heartRate.score >= 2) {
    const rec = CONDITION_RECOMMENDATIONS.highHR;
    recommendations.push({
      priority: ps.heartRate.score >= 3 ? 'critical' : 'high',
      category: 'Cardiovascular',
      source: `Heart Rate ${vitals.heartRate} bpm — ${ps.heartRate.matchedRange?.label || 'abnormal'} (NEWS2 score ${ps.heartRate.score}/3)`,
      title: rec.condition,
      details: rec.actions,
      icon: '❤️',
    });
  }

  // Blood Pressure
  if (ps.systolicBP.score >= 2) {
    const isLow = vitals.systolicBP <= 100;
    const rec = isLow ? CONDITION_RECOMMENDATIONS.lowBP : CONDITION_RECOMMENDATIONS.highBP;
    recommendations.push({
      priority: ps.systolicBP.score >= 3 ? 'critical' : 'high',
      category: 'Cardiovascular',
      source: `Systolic BP ${vitals.systolicBP} mmHg — ${ps.systolicBP.matchedRange?.label || 'abnormal'} (NEWS2 score ${ps.systolicBP.score}/3)`,
      title: rec.condition,
      details: rec.actions,
      icon: '🩸',
    });
  }

  // Temperature
  if (ps.temperature.score >= 1) {
    const isHigh = vitals.temperature >= 38.1;
    const rec = isHigh ? CONDITION_RECOMMENDATIONS.highTemp : CONDITION_RECOMMENDATIONS.lowTemp;
    recommendations.push({
      priority: ps.temperature.score >= 2 ? 'high' : 'medium',
      category: 'Thermoregulation',
      source: `Temperature ${vitals.temperature}°C — ${ps.temperature.matchedRange?.label || 'abnormal'} (NEWS2 score ${ps.temperature.score}/3)`,
      title: rec.condition,
      details: rec.actions,
      icon: '🌡️',
    });
  }

  // Consciousness
  if (ps.consciousness.score >= 3) {
    const rec = CONDITION_RECOMMENDATIONS.abnormalConsciousness;
    recommendations.push({
      priority: 'critical',
      category: 'Neurological',
      source: `Consciousness: ${patient.consciousness} — ${ps.consciousness.matchedRange?.label || 'altered'} (NEWS2 score 3/3)`,
      title: rec.condition,
      details: rec.actions,
      icon: '🧠',
    });
  }

  // ─── 3. Sepsis screening trigger ───────────────────────────────────
  if (news2.aggregate >= 5 && (vitals.temperature >= 38.1 || vitals.temperature <= 36.0)) {
    const rec = CONDITION_RECOMMENDATIONS.sepsisScreen;
    recommendations.push({
      priority: 'critical',
      category: 'Infection / Sepsis',
      source: `NEWS2 ≥ 5 with temperature abnormality — sepsis screening triggered`,
      title: rec.condition,
      details: rec.actions,
      icon: '🦠',
    });
  }

  // ─── 4. Trend-based recommendations ────────────────────────────────
  for (const [key, trend] of Object.entries(trends)) {
    if (trend.concern === 'worsening') {
      recommendations.push({
        priority: 'medium',
        category: 'Trend Alert',
        source: `${trend.label} trending ${trend.direction} at ${trend.ratePerHour}`,
        title: `${trend.label} deteriorating — increase monitoring frequency`,
        details: [
          `Current: ${trend.currentValue} ${NORMAL_RANGES[key]?.unit || ''}`,
          `Rate of change: ${trend.ratePerHour}`,
          `Trend reliability (R²): ${(trend.rSquared * 100).toFixed(0)}%`,
          'Consider early intervention before next threshold crossing',
        ],
        icon: '📈',
      });
    }
  }

  // ─── 5. Comorbidity-specific recommendations ──────────────────────
  for (const code of patient.comorbidities) {
    const comorbidity = COMORBIDITIES[code];
    if (!comorbidity) continue;

    if (comorbidity.useSpo2Scale2 && ps.spo2.score > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Comorbidity-Specific',
        source: `${comorbidity.name} — modified SpO₂ assessment`,
        title: 'COPD: Use NEWS2 Scale 2 for SpO₂',
        details: [
          'Target SpO₂: 88–92% (not standard 94–98%)',
          'Document Scale 2 selection in clinical notes',
          'Excessive oxygen supplementation may suppress respiratory drive',
        ],
        icon: comorbidity.icon,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}
