# MedSight: Explainable Clinical Decision Support System

## Executive Summary
MedSight is a proactive Clinical Decision Support System (CDSS) designed for hospital wards and Intensive Care Units. By integrating real-time vital sign monitoring with the NHS-standardized NEWS2 clinical scoring system and Explainable AI (XAI), MedSight helps healthcare professionals identify patient deterioration hours before it becomes critical. Unlike "black box" AI tools, MedSight provides fully transparent feature attribution, ensuring clinicians understand exactly *why* a risk alert was triggered.

---

## 1. Problem Statement

Modern hospital wards face three compounding crises regarding patient monitoring:

1. **Failure to Rescue (FTR):** Patients often exhibit subtle physiological signs of deterioration 6 to 8 hours before a critical event (like cardiac arrest). In busy wards with high nurse-to-patient ratios, these early warning signs are frequently missed until the patient is in acute distress.
2. **Alert Fatigue:** Current monitoring systems trigger generic alarms based on rigid, single-parameter thresholds (e.g., "Heart rate > 120"). This creates constant, noisy alerts that lack clinical context, leading staff to ignore them.
3. **The "Black Box" AI Problem:** While advanced machine learning models can predict deterioration accurately, they operate as black boxes. If an AI tells a doctor "This patient has an 82% risk of cardiac failure" but cannot explain *why*, the doctor cannot safely act on that information. Clinical trust requires transparency.

---

## 2. The Solution: MedSight

MedSight shifts patient monitoring from **reactive alarms to proactive, explainable intelligence**. 

Instead of alerting staff *after* a patient crashes, MedSight provides a continuous, ward-level dashboard that prioritizes patients based on computed clinical risk. It is designed for use at nursing stations and by rapid response medical teams.

### Target Audience
* **Ward Nurses:** For continuous monitoring and prioritizing patient rounds.
* **Rapid Response Teams / Doctors:** For assessing escalating patients with full clinical context and data-driven recommendations.

---

## 3. How MedSight Outperforms Standard CDSS

Most hospitals currently use rudimentary Clinical Decision Support Systems built directly into Electronic Health Records (EHRs) like Epic or Cerner. MedSight provides a massive leap forward over these standard systems in three key ways:

### A. Explainable AI (XAI) over "Black Box" Predictions
* **Standard CDSS:** If they use machine learning, they output a blunt probability (e.g., "Sepsis Risk: High") without showing their work. Doctors frequently dismiss these alerts because they cannot verify the AI's reasoning.
* **MedSight:** Uses **SHAP-style Feature Attribution**. When MedSight flags a patient, it generates a waterfall chart showing exactly how much each vital sign and comorbidity contributed to the total score. It builds clinical trust by making the AI's reasoning 100% transparent.

### B. Proactive Trajectory vs. Static Thresholds
* **Standard CDSS:** Relies on static snapshots. It only alerts the nurse *after* a patient crosses a dangerous threshold (e.g., SpO₂ drops below 90%).
* **MedSight:** Analyzes temporal drift over a 6-hour window. Using linear regression and trend analysis, it predicts **when** a patient will cross a critical threshold. It warns the staff: "If current trends continue, SpO₂ will cross the critical threshold in 3.2 hours," allowing for early intervention.

### C. Dynamic Comorbidity Scaling vs. One-Size-Fits-All
* **Standard CDSS:** Triggers the same alarm for a 20-year-old athlete as it does for an 80-year-old with heart failure if their heart rate hits 110. This is the root cause of alert fatigue.
* **MedSight:** Dynamically adjusts the effective risk score using **Comorbidity Multipliers**. A patient with a history of Atrial Fibrillation and Chronic Kidney Disease will have their baseline NEWS2 score weighted differently than a patient with no history, reducing false positives and highlighting truly vulnerable patients.

---

## 4. Core Capabilities & Technical Approach

To ensure clinical validity and user trust, MedSight is built on three foundational pillars:

### A. Grounded in Clinical Standards (NEWS2)
MedSight does not rely on arbitrary algorithms to determine baseline risk. The core scoring engine is built entirely on the **National Early Warning Score 2 (NEWS2)**, the standardized clinical assessment tool used globally.
* Every vital sign is evaluated against exact NHS thresholds.
* The system automatically adjusts thresholds based on patient comorbidities (e.g., applying the NEWS2 Scale 2 for SpO₂ targets in COPD patients).

### B. Protocol-Mapped Recommendations
MedSight maps computed risk scores and vital sign patterns directly to established clinical response protocols. Recommendations are not generic; they are synthesized based on the specific parameters that triggered the alert (e.g., triggering a sepsis screening protocol if the NEWS2 score is elevated alongside abnormal temperature).

### C. Deterministic AI Architecture (Zero Hallucination)
In medical software, Large Language Models (LLMs) pose a severe safety risk due to "hallucinations" (fabricating clinical data). MedSight entirely avoids this risk by using a **Deterministic AI Engine**.
* Instead of prompting an LLM to guess a patient's risk, MedSight uses pure mathematical algorithms (Linear Regression for trajectories, SHAP logic for feature attribution, and boolean logic for protocol mapping).
* **The result:** The AI is 100% mathematically verifiable, reproducible, and compliant with strict medical software regulations like FDA and MDR standards.

---

## 5. Technical Architecture & Prototype Implementation

The current prototype is implemented as a high-fidelity, interactive web application designed to simulate a live clinical environment.

* **Frontend Framework:** Built using Vite and Vanilla JavaScript (ES6+), ensuring a lightweight, extremely fast, and dependency-free core.
* **Design System:** Custom CSS design system utilizing CSS variables for consistent theming (Dark/Neon clinical aesthetic optimized for low-light ward environments).
* **Simulation Engine:** A custom-built client-side simulation engine generates physiologically coherent vital sign drift. The simulator ensures that vitals are correlated (e.g., simulating compensatory tachycardia when blood pressure drops) to provide a realistic testing environment.
* **Data Visualization:** Custom HTML5 Canvas rendering for highly performant sparklines and trend charts, removing the need for heavy external charting libraries.

### Prototype Structure
1. **Clinical Knowledge Base (`src/data/clinical-knowledge.js`):** The source of truth for NEWS2 thresholds and clinical protocols.
2. **Scoring Engine (`src/engine/news2.js` & `ai-layer.js`):** Pure functions that compute deterministic risk scores and generate feature attributions.
3. **Ward Dashboard (`src/pages/dashboard.js`):** The primary view for sorting and tracking multiple patients simultaneously.
4. **Deep Dive Analysis (`src/pages/risk-analysis.js`):** The XAI interface providing the reasoning chain behind every alert.
5. **Clinical Sandbox (`src/pages/sandbox.js`):** An interactive testing tool that allows evaluators to manually input patient vitals and instantly generate a deterministic AI analysis, proving the engine responds dynamically to new data.

---

## Conclusion
MedSight bridges the gap between raw medical data and clinical action. By combining the rigid, trusted foundation of the NEWS2 protocol with the predictive power and transparency of Explainable AI, MedSight represents the next generation of safe, effective clinical decision support.
