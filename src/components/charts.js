/**
 * Canvas-based chart rendering utilities.
 * No external chart library — full control, zero dependencies.
 */

/**
 * Draw a sparkline (mini trend chart) on a canvas element.
 */
export function drawSparkline(canvas, dataPoints, color = '#22d3ee', options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = options.padding || 2;

  if (!dataPoints || dataPoints.length < 2) return;

  const values = dataPoints.map(p => p.value || p);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  ctx.clearRect(0, 0, width, height);

  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';

  for (let i = 0; i < values.length; i++) {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((values[i] - min) / range) * (height - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Fill gradient below line
  const lastX = padding + ((values.length - 1) / (values.length - 1)) * (width - padding * 2);
  ctx.lineTo(lastX, height);
  ctx.lineTo(padding, height);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, color + '30');
  gradient.addColorStop(1, color + '05');
  ctx.fillStyle = gradient;
  ctx.fill();
}

/**
 * Draw a full trend chart with axes, threshold bands, and data line.
 */
export function drawTrendChart(canvas, dataPoints, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 20, right: 15, bottom: 30, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  if (!dataPoints || dataPoints.length < 2) return;

  const values = dataPoints.map(p => p.value);
  const times = dataPoints.map(p => p.timestamp);

  // Determine Y range with some breathing room
  let minY = options.minY ?? Math.min(...values) * 0.95;
  let maxY = options.maxY ?? Math.max(...values) * 1.05;
  if (maxY - minY < 1) { minY -= 1; maxY += 1; }
  const rangeY = maxY - minY;

  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const rangeT = maxT - minT || 1;

  ctx.clearRect(0, 0, width, height);

  // Draw threshold bands
  if (options.thresholds) {
    for (const threshold of options.thresholds) {
      const y1 = padding.top + chartH - ((threshold.max - minY) / rangeY) * chartH;
      const y2 = padding.top + chartH - ((threshold.min - minY) / rangeY) * chartH;
      ctx.fillStyle = threshold.color || 'rgba(239, 68, 68, 0.06)';
      ctx.fillRect(padding.left, Math.max(padding.top, y1), chartW, Math.min(y2 - y1, chartH));
    }
  }

  // Draw normal range band
  if (options.normalRange) {
    const ny1 = padding.top + chartH - ((options.normalRange.max - minY) / rangeY) * chartH;
    const ny2 = padding.top + chartH - ((options.normalRange.min - minY) / rangeY) * chartH;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.06)';
    ctx.fillRect(padding.left, ny1, chartW, ny2 - ny1);

    // Normal range border lines
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, ny1);
    ctx.lineTo(padding.left + chartW, ny1);
    ctx.moveTo(padding.left, ny2);
    ctx.lineTo(padding.left + chartW, ny2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Y-axis labels
  ctx.fillStyle = '#5a6580';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const val = minY + (rangeY * i) / ySteps;
    const y = padding.top + chartH - (i / ySteps) * chartH;
    ctx.fillText(Math.round(val * 10) / 10, padding.left - 8, y + 3);

    // Grid line
    ctx.strokeStyle = 'rgba(99, 122, 180, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
  }

  // X-axis time labels
  ctx.textAlign = 'center';
  ctx.fillStyle = '#5a6580';
  const xLabels = 6;
  for (let i = 0; i <= xLabels; i++) {
    const t = minT + (rangeT * i) / xLabels;
    const x = padding.left + (i / xLabels) * chartW;
    const date = new Date(t);
    const hoursAgo = Math.round((maxT - t) / 3600000);
    const label = hoursAgo === 0 ? 'Now' : `${hoursAgo}h ago`;
    ctx.fillText(label, x, height - 8);
  }

  // Data line
  ctx.beginPath();
  ctx.strokeStyle = options.lineColor || '#22d3ee';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';

  for (let i = 0; i < values.length; i++) {
    const x = padding.left + ((times[i] - minT) / rangeT) * chartW;
    const y = padding.top + chartH - ((values[i] - minY) / rangeY) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Fill gradient
  const lastX = padding.left + ((times[times.length - 1] - minT) / rangeT) * chartW;
  const firstX = padding.left + ((times[0] - minT) / rangeT) * chartW;
  ctx.lineTo(lastX, padding.top + chartH);
  ctx.lineTo(firstX, padding.top + chartH);
  ctx.closePath();

  const lineColor = options.lineColor || '#22d3ee';
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
  gradient.addColorStop(0, lineColor + '25');
  gradient.addColorStop(1, lineColor + '03');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Current value dot
  if (values.length > 0) {
    const lastVal = values[values.length - 1];
    const cx = padding.left + ((times[times.length - 1] - minT) / rangeT) * chartW;
    const cy = padding.top + chartH - ((lastVal - minY) / rangeY) * chartH;

    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.strokeStyle = lineColor + '40';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
