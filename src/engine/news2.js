/**
 * NEWS2 Scoring Engine
 * Implements the National Early Warning Score 2 as pure functions.
 * Every score is computed, never hardcoded.
 */

import { NEWS2_THRESHOLDS, CLINICAL_RESPONSE, COMORBIDITIES } from '../data/clinical-knowledge.js';

/**
 * Score a single numeric vital sign parameter against NEWS2 thresholds.
 * Returns { score, matchedRange } so we can explain WHY the score was given.
 */
export function scoreParameter(parameterName, value) {
  const thresholds = NEWS2_THRESHOLDS[parameterName];
  if (!thresholds) return { score: 0, matchedRange: null, parameterName };

  for (const range of thresholds.ranges) {
    if (range.value !== undefined) {
      // Boolean/categorical match (supplementalOxygen, consciousness)
      if (range.value === value) {
        return { score: range.score, matchedRange: range, parameterName };
      }
    } else {
      // Numeric range match
      const aboveMin = range.min === null || value >= range.min;
      const belowMax = range.max === null || value <= range.max;
      if (aboveMin && belowMax) {
        return { score: range.score, matchedRange: range, parameterName };
      }
    }
  }

  return { score: 0, matchedRange: null, parameterName };
}

/**
 * Compute full NEWS2 assessment for a patient.
 * Returns individual scores, aggregate, risk level, and clinical response.
 */
export function computeNEWS2(patient) {
  // Determine which SpO2 scale to use based on comorbidities
  const hasCOPD = patient.comorbidities.some(code => {
    const comorbidity = COMORBIDITIES[code];
    return comorbidity && comorbidity.useSpo2Scale2;
  });
  const spo2Scale = hasCOPD ? 'spo2Scale2' : 'spo2Scale1';

  // Score each parameter
  const parameterScores = {
    respiratoryRate: scoreParameter('respiratoryRate', patient.currentVitals.respiratoryRate),
    spo2: scoreParameter(spo2Scale, patient.currentVitals.spo2),
    supplementalOxygen: scoreParameter('supplementalOxygen', patient.supplementalOxygen),
    systolicBP: scoreParameter('systolicBP', patient.currentVitals.systolicBP),
    heartRate: scoreParameter('heartRate', patient.currentVitals.heartRate),
    consciousness: scoreParameter('consciousness', patient.consciousness),
    temperature: scoreParameter('temperature', patient.currentVitals.temperature),
  };

  // Calculate aggregate score
  const aggregate = Object.values(parameterScores).reduce((sum, p) => sum + p.score, 0);

  // Check for "red score" (any single parameter = 3)
  const hasRedScore = Object.values(parameterScores).some(p => p.score === 3);

  // Determine clinical risk level
  let riskLevel;
  if (aggregate >= 7) {
    riskLevel = CLINICAL_RESPONSE.high;
  } else if (aggregate >= 5) {
    riskLevel = CLINICAL_RESPONSE.medium;
  } else if (hasRedScore) {
    riskLevel = CLINICAL_RESPONSE.lowMedium;
  } else if (aggregate >= 1) {
    riskLevel = CLINICAL_RESPONSE.lowWatch;
  } else {
    riskLevel = CLINICAL_RESPONSE.low;
  }

  return {
    parameterScores,
    aggregate,
    maxPossibleScore: 20, // 7 parameters × max 3 each, minus consciousness which is 0 or 3
    hasRedScore,
    riskLevel,
    spo2Scale: hasCOPD ? 'Scale 2 (COPD)' : 'Scale 1 (Standard)',
    timestamp: Date.now(),
  };
}

/**
 * Human-readable parameter labels for UI display.
 */
export const PARAMETER_LABELS = {
  respiratoryRate: 'Respiratory Rate',
  spo2: 'SpO₂',
  supplementalOxygen: 'Supplemental O₂',
  systolicBP: 'Systolic Blood Pressure',
  heartRate: 'Heart Rate',
  consciousness: 'Consciousness (ACVPU)',
  temperature: 'Temperature',
};

/**
 * Get the parameter icon for display
 */
export const PARAMETER_ICONS = {
  respiratoryRate: '🫁',
  spo2: '💨',
  supplementalOxygen: '🫧',
  systolicBP: '🩸',
  heartRate: '❤️',
  consciousness: '🧠',
  temperature: '🌡️',
};
