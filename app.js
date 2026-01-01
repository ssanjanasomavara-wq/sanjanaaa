/* ===== Scoped App Script (adapted) ===== */

/* ===== Mood Tracking ===== */
let moodValue = null;
let moodEmoji = "";
const moodDisplay = document.getElementById("moodDisplay");

function selectMood(emoji, value) {
  moodEmoji = emoji;
  moodValue = value;
  if (moodDisplay) moodDisplay.textContent = "Selected Mood: " + emoji;
}

/* ===== Save Entry ===== */
function saveEntry() {
  if (!moodValue) {
    alert("Please select a mood first 💭");
    return;
  }

  const journalText = document.getElementById("journal").value.trim();
  const history = JSON.parse(localStorage.getItem("moodHistory")) || [];

  history.push({
    mood: moodValue,
    emoji: moodEmoji,
    note: journalText,
    date: new Date().toISOString()
  });

  localStorage.setItem("moodHistory", JSON.stringify(history));
  document.getElementById("journal").value = "";
  drawChart();
  alert("Saved 🌱");
}

/* ===== Export Entries ===== */
function exportEntries() {
  const history = JSON.parse(localStorage.getItem("moodHistory")) || [];
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
  const a = document.createElement('a');
  a.setAttribute('href', dataStr);
  a.setAttribute('download', 'mood-history.json');
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ===== Mood Chart ===== */
const chartCanvas = document.getElementById("chartCanvas");
const cctx = chartCanvas ? chartCanvas.getContext("2d") : null;

function drawChart() {
  if (!cctx || !chartCanvas) return;
  const history = JSON.parse(localStorage.getItem("moodHistory")) || [];
  cctx.clearRect(0,0,chartCanvas.width,chartCanvas.height);

  // background grid
  cctx.fillStyle = "#fff";
  cctx.fillRect(0, 0, chartCanvas.width, chartCanvas.height);

  const visible = history.slice(-10);
  const maxBars = 10;
  const w = chartCanvas.width;
  const h = chartCanvas.height;
  const paddingLeft = 20;
  const paddingBottom = 20;
  const barAreaW = w - paddingLeft - 20;
  const step = barAreaW / maxBars;
  const barWidth = Math.min(32, step * 0.6);

  visible.forEach((entry, i) => {
    const x = paddingLeft + i*step + (step - barWidth)/2;
    const height = (entry.mood/5) * (h - 60);
    cctx.fillStyle = "rgba(90,90,219,0.95)";
    cctx.fillRect(x, h - paddingBottom - height, barWidth, height);

    cctx.font = "20px serif";
    cctx.textBaseline = "top";
    cctx.fillText(entry.emoji || '', x, h - paddingBottom + 4);
  });
}

/* ===== Doodle (Touch + Ink) ===== */
const drawCanvas = document.getElementById("drawCanvas");
const dctx = drawCanvas ? drawCanvas.getContext("2d", { willReadFrequently: true }) : null;
let drawing = false;

function resizeCanvasForDisplay() {
  if (!drawCanvas) return;
  const ratio = window.devicePixelRatio || 1;
  const w = drawCanvas.clientWidth;
  const h = drawCanvas.clientHeight;
  if (drawCanvas.width !== Math.floor(w*ratio) || drawCanvas.height !== Math.floor(h*ratio)) {
    drawCanvas.width = Math.floor(w*ratio);
    drawCanvas.height = Math.floor(h*ratio);
    const ctx = drawCanvas.getContext('2d');
    ctx.scale(ratio, ratio);
  }
}
window.addEventListener('resize', resizeCanvasForDisplay);
window.addEventListener('orientationchange', resizeCanvasForDisplay);
resizeCanvasForDisplay();

if (drawCanvas) {
  drawCanvas.addEventListener("pointerdown", e => {
    drawing = true;
    dctx.beginPath();
    dctx.lineWidth = (e.pressure && e.pressure > 0 ? e.pressure : 0.35) * 8;
    dctx.moveTo(e.offsetX, e.offsetY);
    try { drawCanvas.setPointerCapture(e.pointerId); } catch(e){}
  });

  drawCanvas.addEventListener("pointerup", e => {
    drawing = false;
    dctx.beginPath();
    try { drawCanvas.releasePointerCapture(e.pointerId); } catch(e){}
  });

  drawCanvas.addEventListener("pointercancel", () => { drawing = false; dctx.beginPath(); });

  drawCanvas.addEventListener("pointermove", e => {
    if (!drawing) return;
    dctx.lineCap = "round";
    dctx.strokeStyle = "#111827";
    dctx.lineWidth = (e.pressure && e.pressure > 0 ? e.pressure : 0.35) * 8;
    dctx.lineTo(e.offsetX, e.offsetY);
    dctx.stroke();
    dctx.beginPath();
    dctx.moveTo(e.offsetX, e.offsetY);
  });
}

function clearDoodle() {
  if (!dctx || !drawCanvas) return;
  dctx.clearRect(0,0,drawCanvas.width,drawCanvas.height);
}

function downloadDoodle() {
  if (!drawCanvas) return;
  const url = drawCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'doodle.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* Initialize */
window.addEventListener('load', () => {
  drawChart();
});
