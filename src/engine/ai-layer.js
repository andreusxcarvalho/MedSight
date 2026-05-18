/**
 * AI Enhancement Layer
 * Adds trend analysis, trajectory prediction, comorbidity-adjusted risk,
 * and SHAP-like feature attribution on top of base NEWS2 scoring.
 */

import { COMORBIDITIES, NORMAL_RANGES } from '../data/clinical-knowledge.js';
import { computeNEWS2 } from './news2.js';

/**
 * Simple linear regression over a time series.
 * Returns slope (change per hour) and r-squared (goodness of fit).
 */
function linearRegression(dataPoints) {
  const n = dataPoints.length;
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

  // Convert timestamps to hours from first point
  const firstTime = dataPoints[0].timestamp;
  const points = dataPoints.map(p => ({
    x: (p.timestamp - firstTime) / 3600000, // hours
    y: p.value,
  }));

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = points.reduce((s, p) => s + p.y * p.y, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const meanY = sumY / n;
  const ssTotal = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssResidual = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return { slope, intercept, rSquared };
}

/**
 * Analyze trends for all vital signs over a given window.
 * Returns trend direction, rate of change, and clinical interpretation.
 */
export function analyzeTrends(patient, windowHours = 6) {
  const cutoff = Date.now() - windowHours * 3600000;
  const trends = {};

  const vitalKeys = ['heartRate', 'systolicBP', 'spo2', 'respiratoryRate', 'temperature'];

  for (const key of vitalKeys) {
    const history = patient.vitalHistory[key];
    if (!history || history.length < 2) continue;

    const windowData = history.filter(p => p.timestamp >= cutoff);
    if (windowData.length < 2) continue;

    const regression = linearRegression(windowData);
    const currentValue = patient.currentVitals[key] || windowData[windowData.length - 1].value;
    const normal = NORMAL_RANGES[key];

    let direction = 'stable';
    const absSlope = Math.abs(regression.slope);
    if (absSlope > 0.5) {
      direction = regression.slope > 0 ? 'rising' : 'falling';
    }

    // Determine if trend is clinically concerning
    let concern = 'none';
    if (normal) {
      const isAboveNormal = currentValue > normal.max;
      const isBelowNormal = currentValue < normal.min;
      const movingAwayFromNormal =
        (isAboveNormal && direction === 'rising') ||
        (isBelowNormal && direction === 'falling');
      const movingTowardNormal =
        (isAboveNormal && direction === 'falling') ||
        (isBelowNormal && direction === 'rising');

      if (movingAwayFromNormal) concern = 'worsening';
      else if (movingTowardNormal) concern = 'improving';
      else if (isAboveNormal || isBelowNormal) concern = 'abnormal-stable';
    }

    trends[key] = {
      slope: Math.round(regression.slope * 100) / 100,
      rSquared: Math.round(regression.rSquared * 100) / 100,
      direction,
      concern,
      ratePerHour: `${regression.slope > 0 ? '+' : ''}${regression.slope.toFixed(2)} ${normal?.unit || ''}/hr`,
      currentValue,
      label: normal?.label || key,
    };
  }

  return trends;
}

/**
 * Predict when a vital sign will cross the next clinical threshold
 * based on current trend trajectory.
 */
export function predictTrajectory(patient, windowHours = 6) {
  const trends = analyzeTrends(patient, windowHours);
  const predictions = {};

  const thresholdCrossings = {
    heartRate: [
      { value: 90, label: 'upper normal limit', direction: 'above' },
      { value: 110, label: 'NEWS2 score 2 threshold', direction: 'above' },
      { value: 130, label: 'NEWS2 score 3 threshold (critical)', direction: 'above' },
    ],
    spo2: [
      { value: 95, label: 'NEWS2 score 1 threshold', direction: 'below' },
      { value: 93, label: 'NEWS2 score 2 threshold', direction: 'below' },
      { value: 91, label: 'NEWS2 score 3 threshold (critical)', direction: 'below' },
    ],
    systolicBP: [
      { value: 110, label: 'NEWS2 score 1 threshold', direction: 'below' },
      { value: 100, label: 'NEWS2 score 2 threshold', direction: 'below' },
      { value: 90, label: 'NEWS2 score 3 threshold (critical)', direction: 'below' },
    ],
    respiratoryRate: [
      { value: 20, label: 'upper normal limit', direction: 'above' },
      { value: 24, label: 'NEWS2 score 2 threshold', direction: 'above' },
      { value: 25, label: 'NEWS2 score 3 threshold (critical)', direction: 'above' },
    ],
    temperature: [
      { value: 38.0, label: 'upper normal limit', direction: 'above' },
      { value: 39.0, label: 'NEWS2 score 2 threshold', direction: 'above' },
    ],
  };

  for (const [key, crossings] of Object.entries(thresholdCrossings)) {
    const trend = trends[key];
    if (!trend || Math.abs(trend.slope) < 0.01) continue;

    const predicted = [];
    for (const threshold of crossings) {
      const currentValue = trend.currentValue;
      const willCross =
        (threshold.direction === 'above' && currentValue < threshold.value && trend.slope > 0) ||
        (threshold.direction === 'below' && currentValue > threshold.value && trend.slope < 0);

      if (willCross) {
        const hoursUntilCrossing = Math.abs((threshold.value - currentValue) / trend.slope);
        if (hoursUntilCrossing <= 24) {
          predicted.push({
            threshold: threshold.value,
            label: threshold.label,
            hoursUntilCrossing: Math.round(hoursUntilCrossing * 10) / 10,
            projectedTime: new Date(Date.now() + hoursUntilCrossing * 3600000).toISOString(),
            confidence: Math.min(0.95, trend.rSquared * 0.9 + 0.1),
          });
        }
      }
    }

    if (predicted.length > 0) {
      predictions[key] = predicted;
    }
  }

  return predictions;
}

/**
 * Compute comorbidity-adjusted risk score.
 * Applies multiplicative risk weights from patient's comorbidities.
 */
export function computeComorbidityAdjustedRisk(news2Score, patient) {
  let multiplier = 1.0;
  const appliedWeights = [];

  for (const code of patient.comorbidities) {
    const comorbidity = COMORBIDITIES[code];
    if (comorbidity) {
      multiplier *= comorbidity.weight;
      appliedWeights.push({
        code,
        name: comorbidity.name,
        weight: comorbidity.weight,
        contribution: ((comorbidity.weight - 1) * 100).toFixed(0) + '%',
      });
    }
  }

  // Age-based adjustment (over 65 adds risk)
  let ageMultiplier = 1.0;
  if (patient.age >= 80) ageMultiplier = 1.3;
  else if (patient.age >= 70) ageMultiplier = 1.2;
  else if (patient.age >= 65) ageMultiplier = 1.1;

  const adjustedScore = news2Score * multiplier * ageMultiplier;
  const maxAdjustedScore = 20 * multiplier * ageMultiplier;

  return {
    baseScore: news2Score,
    comorbidityMultiplier: Math.round(multiplier * 100) / 100,
    ageMultiplier,
    adjustedScore: Math.round(adjustedScore * 10) / 10,
    riskPercentage: Math.min(99, Math.round((adjustedScore / maxAdjustedScore) * 100)),
    appliedWeights,
    ageNote: patient.age >= 65 ? `Age ${patient.age} — elevated risk demographic (+${((ageMultiplier - 1) * 100).toFixed(0)}%)` : null,
  };
}

/**
 * SHAP-like feature attribution.
 * Computes each feature's percentage contribution to the overall risk score.
 * Includes comorbidity and trend adjustments.
 */
export function computeFeatureAttribution(patient) {
  const news2 = computeNEWS2(patient);
  const trends = analyzeTrends(patient, 6);
  const comorbidityRisk = computeComorbidityAdjustedRisk(news2.aggregate, patient);

  const features = [];
  let totalContribution = 0;

  // Base NEWS2 parameter contributions
  for (const [key, paramScore] of Object.entries(news2.parameterScores)) {
    let contribution = paramScore.score;

    // Boost contribution if trend is worsening
    const trend = trends[key === 'spo2' ? 'spo2' : key];
    if (trend && trend.concern === 'worsening') {
      contribution += 0.5;
    }

    if (contribution > 0) {
      const vitalLabels = {
        respiratoryRate: 'Respiratory Rate',
        spo2: 'SpO₂',
        supplementalOxygen: 'Supplemental O₂',
        systolicBP: 'Systolic Blood Pressure',
        heartRate: 'Heart Rate',
        consciousness: 'Consciousness',
        temperature: 'Temperature',
      };

      features.push({
        name: vitalLabels[key] || key,
        paramKey: key,
        rawScore: paramScore.score,
        trendAdjustment: trend && trend.concern === 'worsening' ? 0.5 : 0,
        totalContribution: contribution,
        currentValue: key === 'supplementalOxygen'
          ? (patient.supplementalOxygen ? 'Yes' : 'No')
          : key === 'consciousness'
            ? patient.consciousness
            : patient.currentVitals[key],
        matchedRange: paramScore.matchedRange?.label || 'Normal',
        trend: trend || null,
      });

      totalContribution += contribution;
    }
  }

  // Add comorbidity contribution
  const comorbidityContribution = (comorbidityRisk.comorbidityMultiplier - 1) * news2.aggregate;
  if (comorbidityContribution > 0) {
    features.push({
      name: 'Comorbidity Burden',
      paramKey: 'comorbidities',
      rawScore: 0,
      trendAdjustment: 0,
      totalContribution: Math.round(comorbidityContribution * 10) / 10,
      currentValue: patient.comorbidities.length + ' conditions',
      matchedRange: `×${comorbidityRisk.comorbidityMultiplier} multiplier`,
      trend: null,
    });
    totalContribution += comorbidityContribution;
  }

  // Add age contribution
  const ageContribution = (comorbidityRisk.ageMultiplier - 1) * news2.aggregate;
  if (ageContribution > 0) {
    features.push({
      name: 'Age-Related Risk',
      paramKey: 'age',
      rawScore: 0,
      trendAdjustment: 0,
      totalContribution: Math.round(ageContribution * 10) / 10,
      currentValue: patient.age + ' years',
      matchedRange: `×${comorbidityRisk.ageMultiplier} multiplier`,
      trend: null,
    });
    totalContribution += ageContribution;
  }

  // Calculate percentages
  for (const feature of features) {
    feature.percentage = totalContribution > 0
      ? Math.round((feature.totalContribution / totalContribution) * 100)
      : 0;
  }

  // Sort by contribution (highest first)
  features.sort((a, b) => b.totalContribution - a.totalContribution);

  return { features, totalContribution };
}

/**
 * Generate full AI analysis report for a patient.
 * This is the master function that combines all analysis.
 */
export function generateAnalysis(patient) {
  const news2 = computeNEWS2(patient);
  const trends = analyzeTrends(patient, 6);
  const trajectory = predictTrajectory(patient, 6);
  const comorbidityRisk = computeComorbidityAdjustedRisk(news2.aggregate, patient);
  const attribution = computeFeatureAttribution(patient);

  // Generate natural language summary
  const summary = generateSummary(patient, news2, trends, trajectory, comorbidityRisk);

  return {
    patient,
    news2,
    trends,
    trajectory,
    comorbidityRisk,
    attribution,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate a natural language summary of the analysis.
 */
function generateSummary(patient, news2, trends, trajectory, comorbidityRisk) {
  const parts = [];

  // Opening: risk level
  parts.push(
    `${patient.name} (${patient.age}${patient.gender === 'Male' ? 'M' : 'F'}) presents with a NEWS2 aggregate score of ${news2.aggregate}/20, placing them in the ${news2.riskLevel.riskLevel.toUpperCase()} risk category.`
  );

  // Key abnormal parameters
  const abnormal = Object.entries(news2.parameterScores)
    .filter(([_, p]) => p.score >= 2)
    .map(([key, p]) => {
      const labels = {
        respiratoryRate: 'respiratory rate',
        spo2: 'oxygen saturation',
        supplementalOxygen: 'supplemental oxygen requirement',
        systolicBP: 'systolic blood pressure',
        heartRate: 'heart rate',
        consciousness: 'level of consciousness',
        temperature: 'temperature',
      };
      return `${labels[key]} (score ${p.score}/3)`;
    });

  if (abnormal.length > 0) {
    parts.push(`Primary risk drivers: ${abnormal.join(', ')}.`);
  }

  // Trend analysis
  const worseningTrends = Object.entries(trends)
    .filter(([_, t]) => t.concern === 'worsening')
    .map(([key, t]) => `${t.label} (${t.ratePerHour})`);

  if (worseningTrends.length > 0) {
    parts.push(`Concerning trends: ${worseningTrends.join(', ')} — trending away from normal range.`);
  }

  // Trajectory warnings
  const criticalPredictions = [];
  for (const [key, predictions] of Object.entries(trajectory)) {
    for (const pred of predictions) {
      if (pred.hoursUntilCrossing <= 6) {
        criticalPredictions.push(
          `${trends[key]?.label || key} projected to cross ${pred.label} in ${pred.hoursUntilCrossing}h`
        );
      }
    }
  }

  if (criticalPredictions.length > 0) {
    parts.push(`⚠ Trajectory alert: ${criticalPredictions.join('; ')}.`);
  }

  // Comorbidity context
  if (comorbidityRisk.appliedWeights.length > 0) {
    const conditions = comorbidityRisk.appliedWeights.map(w => w.name).join(', ');
    parts.push(
      `Comorbidity profile (${conditions}) increases effective risk by ×${comorbidityRisk.comorbidityMultiplier}.`
    );
  }

  return parts.join(' ');
}
