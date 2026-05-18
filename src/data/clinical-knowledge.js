/**
 * Clinical Knowledge Base
 * Based on NEWS2 (National Early Warning Score 2) — Royal College of Physicians, UK
 * Reference: https://www.rcplondon.ac.uk/projects/outputs/national-early-warning-score-news-2
 */

// NEWS2 scoring thresholds for each physiological parameter
// Each entry maps a score (0-3) to the value range that triggers it
export const NEWS2_THRESHOLDS = {
  respiratoryRate: {
    unit: 'breaths/min',
    ranges: [
      { score: 3, min: null, max: 8, label: '≤8' },
      { score: 1, min: 9, max: 11, label: '9–11' },
      { score: 0, min: 12, max: 20, label: '12–20' },
      { score: 2, min: 21, max: 24, label: '21–24' },
      { score: 3, min: 25, max: null, label: '≥25' },
    ],
  },
  spo2Scale1: {
    unit: '%',
    ranges: [
      { score: 3, min: null, max: 91, label: '≤91%' },
      { score: 2, min: 92, max: 93, label: '92–93%' },
      { score: 1, min: 94, max: 95, label: '94–95%' },
      { score: 0, min: 96, max: null, label: '≥96%' },
    ],
  },
  spo2Scale2: {
    unit: '%',
    label: 'For patients with hypercapnic respiratory failure (e.g., COPD)',
    ranges: [
      { score: 3, min: null, max: 83, label: '≤83%' },
      { score: 2, min: 84, max: 85, label: '84–85%' },
      { score: 1, min: 86, max: 87, label: '86–87%' },
      { score: 0, min: 88, max: 92, label: '88–92% (target)' },
      { score: 3, min: 93, max: null, label: '≥93% on O₂' },
    ],
  },
  supplementalOxygen: {
    unit: 'boolean',
    ranges: [
      { score: 0, value: false, label: 'Room air' },
      { score: 2, value: true, label: 'On supplemental O₂' },
    ],
  },
  systolicBP: {
    unit: 'mmHg',
    ranges: [
      { score: 3, min: null, max: 90, label: '≤90' },
      { score: 2, min: 91, max: 100, label: '91–100' },
      { score: 1, min: 101, max: 110, label: '101–110' },
      { score: 0, min: 111, max: 219, label: '111–219' },
      { score: 3, min: 220, max: null, label: '≥220' },
    ],
  },
  heartRate: {
    unit: 'bpm',
    ranges: [
      { score: 3, min: null, max: 40, label: '≤40' },
      { score: 1, min: 41, max: 50, label: '41–50' },
      { score: 0, min: 51, max: 90, label: '51–90' },
      { score: 1, min: 91, max: 110, label: '91–110' },
      { score: 2, min: 111, max: 130, label: '111–130' },
      { score: 3, min: 131, max: null, label: '≥131' },
    ],
  },
  consciousness: {
    unit: 'ACVPU',
    ranges: [
      { score: 0, value: 'A', label: 'Alert' },
      { score: 3, value: 'C', label: 'New Confusion' },
      { score: 3, value: 'V', label: 'Responds to Voice' },
      { score: 3, value: 'P', label: 'Responds to Pain' },
      { score: 3, value: 'U', label: 'Unresponsive' },
    ],
  },
  temperature: {
    unit: '°C',
    ranges: [
      { score: 3, min: null, max: 35.0, label: '≤35.0' },
      { score: 1, min: 35.1, max: 36.0, label: '35.1–36.0' },
      { score: 0, min: 36.1, max: 38.0, label: '36.1–38.0' },
      { score: 1, min: 38.1, max: 39.0, label: '38.1–39.0' },
      { score: 2, min: 39.1, max: null, label: '≥39.1' },
    ],
  },
};

// Normal reference ranges for display
export const NORMAL_RANGES = {
  heartRate: { min: 60, max: 100, unit: 'bpm', label: 'Heart Rate' },
  systolicBP: { min: 110, max: 140, unit: 'mmHg', label: 'Systolic BP' },
  diastolicBP: { min: 70, max: 90, unit: 'mmHg', label: 'Diastolic BP' },
  respiratoryRate: { min: 12, max: 20, unit: 'breaths/min', label: 'Respiratory Rate' },
  spo2: { min: 95, max: 100, unit: '%', label: 'SpO₂' },
  temperature: { min: 36.1, max: 38.0, unit: '°C', label: 'Temperature' },
  lactate: { min: 0.5, max: 2.0, unit: 'mmol/L', label: 'Lactate' },
  creatinine: { min: 59, max: 104, unit: 'µmol/L', label: 'Creatinine' },
  wbc: { min: 4.0, max: 11.0, unit: '×10⁹/L', label: 'WBC' },
};

// Clinical response protocols mapped to NEWS2 aggregate scores
export const CLINICAL_RESPONSE = {
  low: {
    scoreRange: '0',
    riskLevel: 'Low',
    color: '#22c55e',
    monitoring: 'Minimum every 12 hours',
    response: 'Continue routine monitoring',
    escalation: 'None required',
    team: 'Ward nursing staff',
  },
  lowWatch: {
    scoreRange: '1–4',
    riskLevel: 'Low',
    color: '#86efac',
    monitoring: 'Minimum every 4–6 hours',
    response: 'Registered nurse to assess and decide on monitoring frequency',
    escalation: 'Nurse-led escalation if clinically concerned',
    team: 'Ward nursing staff',
  },
  lowMedium: {
    scoreRange: '3 in any single parameter',
    riskLevel: 'Low–Medium',
    color: '#fbbf24',
    monitoring: 'Minimum every hour',
    response: 'Urgent ward-based review — nurse to inform medical team',
    escalation: 'Medical team to assess and determine care plan',
    team: 'Ward medical team',
  },
  medium: {
    scoreRange: '5–6',
    riskLevel: 'Medium',
    color: '#f97316',
    monitoring: 'Minimum every hour',
    response: 'Urgent assessment by clinician with acute illness competency',
    escalation: 'Consider transfer to higher-dependency environment',
    team: 'Acute care / medical emergency team',
  },
  high: {
    scoreRange: '≥7',
    riskLevel: 'High',
    color: '#ef4444',
    monitoring: 'Continuous monitoring',
    response: 'Emergency assessment by critical care team',
    escalation: 'Immediate transfer to critical care / ICU',
    team: 'Critical care outreach / ICU team',
  },
};

// Comorbidity definitions with risk weights
export const COMORBIDITIES = {
  'I25.1': { name: 'Coronary Heart Disease', weight: 1.3, category: 'Cardiovascular', icon: '❤️' },
  'I10': { name: 'Hypertension', weight: 1.1, category: 'Cardiovascular', icon: '🫀' },
  'J44.1': { name: 'COPD (Acute Exacerbation)', weight: 1.4, category: 'Respiratory', icon: '🫁', useSpo2Scale2: true },
  'E11.9': { name: 'Type 2 Diabetes', weight: 1.15, category: 'Metabolic', icon: '🩸' },
  'N18.3': { name: 'Chronic Kidney Disease (Stage 3)', weight: 1.2, category: 'Renal', icon: '🫘' },
  'I48.0': { name: 'Atrial Fibrillation', weight: 1.25, category: 'Cardiovascular', icon: '💓' },
  'I50.9': { name: 'Heart Failure', weight: 1.4, category: 'Cardiovascular', icon: '❤️‍🩹' },
  'J18.9': { name: 'Pneumonia', weight: 1.3, category: 'Respiratory', icon: '🫁' },
};

// Condition-specific recommendation templates
export const CONDITION_RECOMMENDATIONS = {
  lowSpo2: {
    condition: 'SpO₂ below safe threshold',
    actions: [
      'Initiate supplemental oxygen therapy per protocol',
      'Target SpO₂ 94–98% (or 88–92% if COPD/hypercapnic risk)',
      'Order arterial blood gas analysis',
      'Assess for airway obstruction or respiratory distress',
    ],
  },
  highHR: {
    condition: 'Elevated heart rate',
    actions: [
      'Assess for pain, anxiety, fever, or hypovolemia as causes',
      'Review current medications (beta-blockers, inotropes)',
      '12-lead ECG if new onset or irregular rhythm',
      'Check fluid balance and consider IV fluid bolus if hypovolemic',
    ],
  },
  lowBP: {
    condition: 'Hypotension',
    actions: [
      'Assess fluid status — consider 250ml crystalloid bolus',
      'Review vasodilating medications',
      'Check for signs of hemorrhage or sepsis',
      'Position patient supine with legs elevated if acute',
    ],
  },
  highBP: {
    condition: 'Severe hypertension',
    actions: [
      'Assess for target organ damage (headache, visual changes, chest pain)',
      'Review and optimize antihypertensive medications',
      'Avoid rapid BP reduction — target 25% reduction in first hour',
      'Consider IV labetalol or nicardipine if hypertensive emergency',
    ],
  },
  highTemp: {
    condition: 'Pyrexia / Fever',
    actions: [
      'Obtain blood cultures before starting antibiotics',
      'Screen for sepsis using local sepsis screening tool',
      'Administer antipyretics (paracetamol 1g)',
      'Review antibiotic regimen if already prescribed',
    ],
  },
  lowTemp: {
    condition: 'Hypothermia',
    actions: [
      'Active warming measures (warm blankets, Bair Hugger)',
      'Check blood glucose (hypothermia risk in hypoglycemia)',
      'Continuous temperature monitoring',
      'Assess for environmental exposure or sepsis',
    ],
  },
  abnormalConsciousness: {
    condition: 'Altered consciousness',
    actions: [
      'Perform ABCDE assessment immediately',
      'Check blood glucose (rule out hypoglycemia)',
      'Neurological assessment including pupil response',
      'Consider CT head if new neurological deficit',
    ],
  },
  sepsisScreen: {
    condition: 'Sepsis suspected (NEWS2 ≥ 5 + infection)',
    actions: [
      'Initiate Sepsis Six bundle within 1 hour',
      'Take blood cultures, lactate, and FBC',
      'Administer IV antibiotics per empirical protocol',
      'Give IV fluid challenge (500ml crystalloid over 15 min)',
      'Monitor urine output (catheterize if necessary)',
      'Administer high-flow oxygen if SpO₂ < 94%',
    ],
  },
};
