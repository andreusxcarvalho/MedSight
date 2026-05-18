/**
 * Real-Time Vitals Simulator
 * Updates patient vitals with physiologically coherent drift and noise.
 * Vitals are correlated: dropping BP → compensatory HR increase, etc.
 */

import { PATIENTS } from '../data/patients.js';

let simulationInterval = null;
let isPaused = false;
let listeners = [];

/**
 * Get a deep copy of the current patient data (with live vitals).
 */
export function getPatients() {
  return PATIENTS;
}

/**
 * Subscribe to vital sign updates.
 * Callback receives the updated patient list on each tick.
 */
export function onUpdate(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

function notifyListeners() {
  for (const listener of listeners) {
    listener(PATIENTS);
  }
}

/**
 * Simulate one tick of vital sign changes.
 * Each tick represents ~30 seconds of real time.
 */
function simulateTick() {
  if (isPaused) return;

  const now = Date.now();

  for (const patient of PATIENTS) {
    const drift = patient.driftConfig;
    const vitals = patient.currentVitals;

    // Apply drift (rate per hour, tick is ~30 seconds so divide by 120)
    const tickFactor = 1 / 120;

    // Heart rate: drift + noise + physiological coupling
    const hrDrift = drift.heartRate * tickFactor;
    const hrNoise = (Math.random() * 2 - 1) * 1.5;
    // Compensatory: if BP drops, HR increases
    const bpCompensation = vitals.systolicBP < 100 ? (100 - vitals.systolicBP) * 0.02 * tickFactor : 0;
    vitals.heartRate = clamp(
      Math.round((vitals.heartRate + hrDrift + hrNoise + bpCompensation) * 10) / 10,
      30, 180
    );

    // Systolic BP: drift + noise
    const bpDrift = drift.systolicBP * tickFactor;
    const bpNoise = (Math.random() * 2 - 1) * 2;
    vitals.systolicBP = clamp(
      Math.round(vitals.systolicBP + bpDrift + bpNoise),
      60, 240
    );

    // Diastolic BP: follows systolic roughly
    vitals.diastolicBP = clamp(
      Math.round(vitals.systolicBP * 0.6 + (Math.random() * 2 - 1) * 2),
      35, 140
    );

    // SpO2: drift + noise (inverse correlation with respiratory distress)
    const spo2Drift = drift.spo2 * tickFactor;
    const spo2Noise = (Math.random() * 2 - 1) * 0.3;
    vitals.spo2 = clamp(
      Math.round((vitals.spo2 + spo2Drift + spo2Noise) * 10) / 10,
      70, 100
    );

    // Respiratory rate: drift + noise + coupling (low SpO2 → increased RR)
    const rrDrift = drift.respiratoryRate * tickFactor;
    const rrNoise = (Math.random() * 2 - 1) * 0.5;
    const spo2Compensation = vitals.spo2 < 93 ? (93 - vitals.spo2) * 0.1 * tickFactor : 0;
    vitals.respiratoryRate = clamp(
      Math.round((vitals.respiratoryRate + rrDrift + rrNoise + spo2Compensation) * 10) / 10,
      4, 45
    );

    // Temperature: drift + minimal noise
    const tempDrift = drift.temperature * tickFactor;
    const tempNoise = (Math.random() * 2 - 1) * 0.05;
    vitals.temperature = clamp(
      Math.round((vitals.temperature + tempDrift + tempNoise) * 10) / 10,
      33, 42
    );

    // Append to history (every 6th tick ≈ every 3 minutes for charting)
    if (Math.random() < 0.17) {
      const historyKeys = ['heartRate', 'systolicBP', 'spo2', 'respiratoryRate', 'temperature'];
      for (const key of historyKeys) {
        if (patient.vitalHistory[key]) {
          patient.vitalHistory[key].push({
            timestamp: now,
            value: vitals[key],
          });
          // Keep last 100 points
          if (patient.vitalHistory[key].length > 100) {
            patient.vitalHistory[key].shift();
          }
        }
      }
    }
  }

  notifyListeners();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Start the real-time simulation.
 * Updates every 500ms (each tick = ~30 seconds of simulated time).
 */
export function startSimulation() {
  if (simulationInterval) return;
  isPaused = false;
  simulationInterval = setInterval(simulateTick, 500);
}

/**
 * Pause/resume the simulation.
 */
export function togglePause() {
  isPaused = !isPaused;
  return isPaused;
}

export function isPausedState() {
  return isPaused;
}

/**
 * Stop the simulation entirely.
 */
export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}
