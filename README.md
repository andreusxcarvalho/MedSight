# MedSight: Clinical Decision Support System

MedSight is a proactive remote patient monitoring dashboard built for hospital wards and intensive care units. It integrates real-time vital sign tracking with the NHS-standardized NEWS2 scoring system and Explainable AI (XAI) to detect patient deterioration hours before it becomes critical.

## Features
- **NEWS2 Clinical Scoring:** Automatically computes risk scores based on NHS thresholds.
- **Explainable AI (XAI):** Generates SHAP-style waterfall charts to break down exactly which vital signs are driving patient risk.
- **Proactive Trajectory Prediction:** Uses 6-hour trend analysis to forecast when a patient will cross a critical threshold.
- **Dynamic Comorbidity Scaling:** Adjusts base risk scores using patient history to reduce "alert fatigue."
- **Live Simulation:** Includes a physiologically coupled vitals simulator to generate realistic patient data drift for demo purposes.

---

## How to Run the Demo Locally

This project is built using Vanilla JavaScript and Vite for lightning-fast performance and zero framework bloat.

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

## Using the Demo

- **Simulation Controls:** Use the "Pause/Resume" button in the bottom left of the sidebar to freeze the live vital sign simulation.
- **Ward Dashboard:** View the real-time sorting of patients based on their NEWS2 risk score.
- **Patient Detail:** Click on any patient row to drill down into their specific vitals and historical trends.
- **Risk Analysis:** Click the "Run AI Analysis" button on a patient's detail page to view the Explainable AI breakdown and clinical recommendations.
