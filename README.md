# MedSight: Explainable Clinical Decision Support System

<div align="center">
  <p><strong>Proactive, Explainable, and Deterministic AI for Hospital Wards</strong></p>
</div>

---

## 🚀 Overview

MedSight is a proactive **Clinical Decision Support System (CDSS)** designed for hospital wards and Intensive Care Units. By integrating real-time vital sign monitoring with the NHS-standardized **NEWS2** clinical scoring system and **Explainable AI (XAI)**, MedSight helps healthcare professionals identify patient deterioration hours before it becomes critical. 

Unlike "black box" AI tools that doctors often distrust due to hallucinations, MedSight uses a **Deterministic AI Architecture**. It provides fully transparent feature attribution so clinicians understand exactly *why* a risk alert was triggered and how to respond.

---

## ✨ Core Features

### 1. Ward-Level Dashboard (Triage)
- **Live Prioritization:** Automatically sorts patients based on their real-time clinical risk score, allowing nurses to instantly see who needs immediate attention.
- **Sparkline Trends:** Mini HTML5 canvas charts provide an at-a-glance view of vital sign drift over the last 6 hours.

### 2. Deterministic AI Engine (Zero Hallucination)
- **FDA/MDR Friendly:** Avoids LLMs entirely for clinical scoring. Uses mathematically verifiable algorithms (linear regression, SHAP logic, boolean rule-mapping).
- **Explainable AI (XAI):** Generates SHAP-style waterfall charts breaking down exactly how much each vital sign (e.g., Heart Rate, SpO₂) contributed to the final risk score.
- **Dynamic Comorbidity Scaling:** Adjusts base risk scores using patient history (e.g., COPD, Atrial Fibrillation) to reduce "alert fatigue" common in standard CDSS tools.

### 3. Proactive Trajectory Modeling
- Analyzes temporal drift over a 6-hour window to predict **when** a patient will cross a critical threshold, shifting care from reactive alarms to proactive intervention.

### 4. Protocol-Mapped Recommendations
- Automatically synthesizes clinical response protocols (e.g., "Sepsis Six Bundle", "Escalate to ICU") based on the specific parameters that triggered the alert, directly following NHS NEWS2 guidelines.

### 5. Interactive Testing & Simulation
- **Clinical Sandbox:** A dedicated manual-entry page where evaluators can type in hypothetical vitals and immediately see the AI's deterministic response and changing recommendations.
- **Live Simulator:** A custom-built, physiologically-coupled vitals engine runs in the background to simulate realistic patient deterioration and compensatory mechanisms (e.g., HR rising as BP falls).

---

## 🛠️ How to Run the Demo Locally

This project is built using **Vanilla JavaScript** and **Vite** for lightning-fast performance and zero framework bloat.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/andreusxcarvalho/MedSight.git
   cd MedSight
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **View the app:**
   Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).

---

## 🧪 Demo Scripting Guide

For presentations, we recommend the following flow to demonstrate the platform's capabilities:

1. **Ward Dashboard:** Show how patients are automatically sorted. Pause the simulation using the bottom-left toggle to freeze data.
2. **Patient Detail:** Click on a high-risk patient (e.g., "Marcus Chen") to view detailed 6-hour trend charts and lab results.
3. **Run AI Analysis:** Click the "Run AI Analysis" button to demonstrate the **Explainable AI** waterfall chart and the specific clinical protocol recommendations.
4. **Clinical Sandbox:** Navigate to the Sandbox via the sidebar. Input a healthy patient, hit analyze, and then drastically change their SpO₂ or Temperature to prove the deterministic engine reacts dynamically without hardcoding.
