/**
 * Synthetic Patient Records
 * 5 patients spanning low → critical risk profiles
 * All data is internally consistent (correlated vitals, coherent histories)
 *
 * Vital history: 24 hours of data at 30-minute intervals (49 data points)
 */

function generateVitalHistory(baseValue, trendPerHour, noisePercent, hours = 24) {
  const points = [];
  const intervalMinutes = 30;
  const totalPoints = (hours * 60) / intervalMinutes + 1;
  const now = Date.now();

  for (let i = 0; i < totalPoints; i++) {
    const hoursAgo = (totalPoints - 1 - i) * (intervalMinutes / 60);
    const trend = trendPerHour * (i * (intervalMinutes / 60));
    const noise = baseValue * (noisePercent / 100) * (Math.random() * 2 - 1);
    const value = Math.round((baseValue + trend + noise) * 10) / 10;
    points.push({
      timestamp: now - hoursAgo * 3600000,
      value: Math.max(0, value),
    });
  }
  return points;
}

export const PATIENTS = [
  // ─── Patient 1: LOW RISK ───────────────────────────────────────────────
  {
    id: 'P001',
    mrn: 'MRX-4291037',
    name: 'Elena Fischer',
    age: 42,
    gender: 'Female',
    ward: 'General Medicine — Ward 3A',
    bed: 'Bed 12',
    admissionDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    admissionReason: 'Elective cholecystectomy — post-operative monitoring',
    comorbidities: ['E11.9'], // Type 2 Diabetes
    medications: ['Metformin 500mg BD', 'Paracetamol 1g QDS PRN'],
    supplementalOxygen: false,
    consciousness: 'A',
    currentVitals: {
      heartRate: 72,
      systolicBP: 124,
      diastolicBP: 78,
      respiratoryRate: 14,
      spo2: 98,
      temperature: 36.8,
    },
    vitalHistory: {
      heartRate: generateVitalHistory(72, 0, 3),
      systolicBP: generateVitalHistory(124, 0, 2),
      spo2: generateVitalHistory(98, 0, 0.5),
      respiratoryRate: generateVitalHistory(14, 0, 5),
      temperature: generateVitalHistory(36.8, 0, 0.5),
    },
    labs: {
      lactate: { value: 1.1, timestamp: Date.now() - 3600000 },
      creatinine: { value: 78, timestamp: Date.now() - 3600000 },
      wbc: { value: 7.2, timestamp: Date.now() - 3600000 },
    },
    notes: 'Post-op day 2, uncomplicated recovery. Mobilizing independently. Tolerating oral diet.',
    driftConfig: { heartRate: 0, systolicBP: 0, spo2: 0, respiratoryRate: 0, temperature: 0 },
  },

  // ─── Patient 2: LOW–MEDIUM RISK ────────────────────────────────────────
  {
    id: 'P002',
    mrn: 'MRX-7183625',
    name: 'Thomas Weber',
    age: 71,
    gender: 'Male',
    ward: 'Respiratory — Ward 5B',
    bed: 'Bed 4',
    admissionDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    admissionReason: 'Acute exacerbation of COPD',
    comorbidities: ['J44.1', 'I10'], // COPD, Hypertension
    medications: ['Salbutamol 2.5mg NEB QDS', 'Ipratropium 500mcg NEB QDS', 'Prednisolone 30mg OD', 'Amlodipine 5mg OD'],
    supplementalOxygen: true,
    consciousness: 'A',
    currentVitals: {
      heartRate: 92,
      systolicBP: 138,
      diastolicBP: 85,
      respiratoryRate: 22,
      spo2: 91,
      temperature: 37.1,
    },
    vitalHistory: {
      heartRate: generateVitalHistory(88, 0.2, 3),
      systolicBP: generateVitalHistory(138, 0, 2),
      spo2: generateVitalHistory(93, -0.1, 0.8),
      respiratoryRate: generateVitalHistory(20, 0.1, 5),
      temperature: generateVitalHistory(37.0, 0.02, 0.5),
    },
    labs: {
      lactate: { value: 1.8, timestamp: Date.now() - 7200000 },
      creatinine: { value: 98, timestamp: Date.now() - 7200000 },
      wbc: { value: 12.4, timestamp: Date.now() - 7200000 },
    },
    notes: 'Day 4 of admission. Improving but still requiring 2L O₂ via nasal cannulae. Wheeze persistent on auscultation.',
    driftConfig: { heartRate: 0.15, systolicBP: 0, spo2: -0.05, respiratoryRate: 0.05, temperature: 0.01 },
  },

  // ─── Patient 3: MEDIUM RISK ────────────────────────────────────────────
  {
    id: 'P003',
    mrn: 'MRX-2847591',
    name: 'Johan Müller',
    age: 67,
    gender: 'Male',
    ward: 'Cardiology — Ward 7A',
    bed: 'Bed 2',
    admissionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    admissionReason: 'Chest pain — query acute coronary syndrome',
    comorbidities: ['I25.1', 'I10', 'E11.9'], // CHD, Hypertension, T2DM
    medications: ['Aspirin 300mg STAT', 'Clopidogrel 300mg STAT', 'Fondaparinux 2.5mg SC OD', 'GTN spray PRN', 'Atorvastatin 80mg ON', 'Bisoprolol 2.5mg OD', 'Ramipril 2.5mg OD'],
    supplementalOxygen: false,
    consciousness: 'A',
    currentVitals: {
      heartRate: 98,
      systolicBP: 148,
      diastolicBP: 92,
      respiratoryRate: 18,
      spo2: 95,
      temperature: 37.2,
    },
    vitalHistory: {
      heartRate: generateVitalHistory(90, 0.4, 3),
      systolicBP: generateVitalHistory(142, 0.3, 2),
      spo2: generateVitalHistory(96, -0.05, 0.5),
      respiratoryRate: generateVitalHistory(16, 0.1, 5),
      temperature: generateVitalHistory(37.0, 0.01, 0.5),
    },
    labs: {
      lactate: { value: 2.3, timestamp: Date.now() - 1800000 },
      creatinine: { value: 112, timestamp: Date.now() - 1800000 },
      wbc: { value: 9.8, timestamp: Date.now() - 1800000 },
    },
    notes: 'Admitted via A&E with central crushing chest pain radiating to left arm. Troponin pending. ECG: ST depression V4-V6.',
    driftConfig: { heartRate: 0.3, systolicBP: 0.2, spo2: -0.03, respiratoryRate: 0.08, temperature: 0.005 },
  },

  // ─── Patient 4: HIGH RISK ─────────────────────────────────────────────
  {
    id: 'P004',
    mrn: 'MRX-9356281',
    name: 'Ingrid Hoffmann',
    age: 78,
    gender: 'Female',
    ward: 'ICU — Bay 2',
    bed: 'Bed 6',
    admissionDate: new Date(Date.now() - 0.5 * 86400000).toISOString(),
    admissionReason: 'Sepsis secondary to urinary tract infection',
    comorbidities: ['N18.3', 'I48.0', 'I10'], // CKD3, AF, Hypertension
    medications: ['Piperacillin-Tazobactam 4.5g IV TDS', 'Metoprolol 25mg BD', 'Apixaban 5mg BD (held)', 'Hartmann\'s 125ml/hr IV'],
    supplementalOxygen: true,
    consciousness: 'C', // New confusion
    currentVitals: {
      heartRate: 118,
      systolicBP: 94,
      diastolicBP: 58,
      respiratoryRate: 26,
      spo2: 92,
      temperature: 39.2,
    },
    vitalHistory: {
      heartRate: generateVitalHistory(95, 1.0, 3),
      systolicBP: generateVitalHistory(118, -1.0, 3),
      spo2: generateVitalHistory(96, -0.2, 1),
      respiratoryRate: generateVitalHistory(18, 0.35, 5),
      temperature: generateVitalHistory(37.5, 0.07, 1),
    },
    labs: {
      lactate: { value: 4.1, timestamp: Date.now() - 900000 },
      creatinine: { value: 186, timestamp: Date.now() - 900000 },
      wbc: { value: 18.7, timestamp: Date.now() - 900000 },
    },
    notes: 'Admitted from care home with acute confusion, fever, and dysuria. Blood cultures taken. Lactate rising. New AF with rapid ventricular response.',
    driftConfig: { heartRate: 0.5, systolicBP: -0.4, spo2: -0.08, respiratoryRate: 0.15, temperature: 0.02 },
  },

  // ─── Patient 5: CRITICAL ──────────────────────────────────────────────
  {
    id: 'P005',
    mrn: 'MRX-1428763',
    name: 'Karl Braun',
    age: 83,
    gender: 'Male',
    ward: 'ICU — Bay 1',
    bed: 'Bed 1',
    admissionDate: new Date(Date.now() - 0.25 * 86400000).toISOString(),
    admissionReason: 'Acute heart failure with pulmonary edema',
    comorbidities: ['I50.9', 'I25.1', 'I48.0', 'N18.3', 'E11.9'], // HF, CHD, AF, CKD3, T2DM
    medications: ['Furosemide 80mg IV BD', 'GTN infusion 2-10mg/hr', 'Morphine 2.5mg IV PRN', 'CPAP 10cmH₂O', 'Dobutamine 5mcg/kg/min'],
    supplementalOxygen: true,
    consciousness: 'V', // Responds to voice
    currentVitals: {
      heartRate: 132,
      systolicBP: 88,
      diastolicBP: 52,
      respiratoryRate: 30,
      spo2: 89,
      temperature: 36.0,
    },
    vitalHistory: {
      heartRate: generateVitalHistory(110, 1.0, 4),
      systolicBP: generateVitalHistory(105, -0.7, 3),
      spo2: generateVitalHistory(94, -0.22, 1),
      respiratoryRate: generateVitalHistory(22, 0.35, 5),
      temperature: generateVitalHistory(36.5, -0.02, 0.5),
    },
    labs: {
      lactate: { value: 5.8, timestamp: Date.now() - 600000 },
      creatinine: { value: 234, timestamp: Date.now() - 600000 },
      wbc: { value: 14.2, timestamp: Date.now() - 600000 },
    },
    notes: 'Transferred from A&E resus. Acute pulmonary edema on CXR. BNP >5000. Requires inotropic support. Family informed — ceiling of care discussion pending.',
    driftConfig: { heartRate: 0.6, systolicBP: -0.3, spo2: -0.1, respiratoryRate: 0.2, temperature: -0.01 },
  },
];
