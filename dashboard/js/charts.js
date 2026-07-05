const palette = {
  Positive: "#16803c",
  Neutral: "#d09200",
  Negative: "#b42318",
  blue: "#2563eb",
  teal: "#0f766e",
  slate: "#64748b",
  grid: "#e2e8f0",
  text: "#334155",
};

export function drawDonut(canvas, rows) {
  const ctx = setup(canvas);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const { width, height } = dimensions(ctx);
  const radius = Math.min(width, height) * 0.34;
  const cx = width * 0.5;
  const cy = height * 0.46;
  let angle = -Math.PI / 2;

  clear(ctx, width, height);
  if (!total) return empty(ctx, width, height);

  rows.forEach((row) => {
    const slice = (row.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = row.color;
    ctx.fill();
    angle += slice;
  });

  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = palette.text;
  ctx.font = "700 24px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(total.toLocaleString(), cx, cy + 8);

  drawLegend(ctx, rows, 18, height - 52);
}

export function drawBars(canvas, rows, options = {}) {
  const ctx = setup(canvas);
  const { width, height } = dimensions(ctx);
  clear(ctx, width, height);
  if (!rows.length) return empty(ctx, width, height);

  const max = Math.max(...rows.map((row) => row.value), 1);
  const left = 130;
  const top = 16;
  const rowHeight = Math.max(22, Math.min(34, (height - top - 24) / rows.length));
  const barMax = width - left - 24;

  rows.forEach((row, index) => {
    const y = top + index * rowHeight;
    const barWidth = Math.round((row.value / max) * barMax);
    ctx.fillStyle = palette.text;
    ctx.font = "12px Segoe UI";
    ctx.textAlign = "right";
    ctx.fillText(truncate(row.label, 18), left - 10, y + 15);
    ctx.fillStyle = row.color || options.color || palette.teal;
    ctx.fillRect(left, y, barWidth, 16);
    ctx.fillStyle = palette.text;
    ctx.textAlign = "left";
    ctx.fillText(row.value.toLocaleString(), left + barWidth + 6, y + 13);
  });
}

export function drawRatingBars(canvas, counts) {
  const rows = [5, 4, 3, 2, 1].map((rating) => ({
    label: `${rating} star`,
    value: counts[rating] || 0,
    color: rating >= 4 ? palette.Positive : rating === 3 ? palette.Neutral : palette.Negative,
  }));
  drawBars(canvas, rows);
}

export function drawStackedTrend(canvas, rows) {
  const ctx = setup(canvas);
  const { width, height } = dimensions(ctx);
  clear(ctx, width, height);
  if (!rows.length) return empty(ctx, width, height);

  const visible = rows.slice(-18);
  const left = 46;
  const right = 18;
  const top = 18;
  const bottom = 48;
  const chartW = width - left - right;
  const chartH = height - top - bottom;
  const max = Math.max(...visible.map((row) => row.total), 1);
  const barW = Math.max(8, chartW / visible.length - 8);

  drawGrid(ctx, left, top, chartW, chartH, max);

  visible.forEach((row, index) => {
    const x = left + index * (chartW / visible.length) + 4;
    let y = top + chartH;
    ["Negative", "Neutral", "Positive"].forEach((key) => {
      const h = row[key] / max * chartH;
      y -= h;
      ctx.fillStyle = palette[key];
      ctx.fillRect(x, y, barW, h);
    });
    ctx.save();
    ctx.translate(x + barW / 2, height - 14);
    ctx.rotate(-Math.PI / 6);
    ctx.fillStyle = palette.text;
    ctx.font = "10px Segoe UI";
    ctx.textAlign = "left";
    ctx.fillText(row.monthLabel || row.month, 0, 0);
    ctx.restore();
  });
}

export function drawLine(canvas, rows) {
  const ctx = setup(canvas);
  const { width, height } = dimensions(ctx);
  clear(ctx, width, height);
  if (!rows.length) return empty(ctx, width, height);

  const visible = rows.slice(-18);
  const left = 46;
  const right = 18;
  const top = 18;
  const bottom = 48;
  const chartW = width - left - right;
  const chartH = height - top - bottom;
  const max = Math.max(...visible.map((row) => row.total), 1);

  drawGrid(ctx, left, top, chartW, chartH, max);
  ctx.strokeStyle = palette.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  visible.forEach((row, index) => {
    const x = left + index * (chartW / Math.max(visible.length - 1, 1));
    const y = top + chartH - (row.total / max) * chartH;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

export function sentimentRows(counts) {
  return [
    { label: "Positive", value: counts.Positive || 0, color: palette.Positive },
    { label: "Neutral", value: counts.Neutral || 0, color: palette.Neutral },
    { label: "Negative", value: counts.Negative || 0, color: palette.Negative },
  ];
}

function setup(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = Math.max(320, Math.floor(rect.width || canvas.parentElement.clientWidth || 640));
  const cssHeight = Number(canvas.getAttribute("height") || 260);
  canvas.width = Math.floor(cssWidth * ratio);
  canvas.height = Math.floor(cssHeight * ratio);
  canvas.style.height = `${cssHeight}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx._cssWidth = cssWidth;
  ctx._cssHeight = cssHeight;
  return ctx;
}

function dimensions(ctx) {
  return { width: ctx._cssWidth, height: ctx._cssHeight };
}

function clear(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

function empty(ctx, width, height) {
  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText("No data for current filters", width / 2, height / 2);
}

function drawLegend(ctx, rows, x, y) {
  ctx.font = "12px Segoe UI";
  ctx.textAlign = "left";
  rows.forEach((row, index) => {
    const lx = x + index * 110;
    ctx.fillStyle = row.color;
    ctx.fillRect(lx, y, 10, 10);
    ctx.fillStyle = palette.text;
    ctx.fillText(`${row.label} ${row.value}`, lx + 16, y + 10);
  });
}

function drawGrid(ctx, left, top, width, height, max) {
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = palette.text;
  ctx.font = "11px Segoe UI";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i += 1) {
    const y = top + (height / 4) * i;
    const value = Math.round(max - (max / 4) * i);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + width, y);
    ctx.stroke();
    ctx.fillText(value, left - 8, y + 4);
  }
}

function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}
